-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  invitation_family_id uuid;
BEGIN
  -- Check for pending family invitation
  SELECT family_id INTO invitation_family_id
  FROM public.family_invitations
  WHERE invitee_email = new.email 
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
  
  -- Insert into users table with appropriate family_id
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    username,
    family_id,
    password_hash
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'username', ''),
    COALESCE(invitation_family_id, gen_random_uuid()),
    'authenticated_via_supabase_auth'
  );
  
  -- Update profiles table with the same family_id
  UPDATE public.profiles 
  SET family_id = COALESCE(invitation_family_id, gen_random_uuid())
  WHERE id = new.id;
  
  -- If there was an invitation, mark it as accepted
  IF invitation_family_id IS NOT NULL THEN
    UPDATE public.family_invitations
    SET status = 'accepted'
    WHERE invitee_email = new.email 
      AND status = 'pending'
      AND family_id = invitation_family_id;
  END IF;
  
  RETURN new;
END;
$function$;

-- Fix accept_family_invitation function
CREATE OR REPLACE FUNCTION public.accept_family_invitation(invitation_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  invitation_family_id uuid;
BEGIN
  -- Get the family_id from pending invitation
  SELECT family_id INTO invitation_family_id
  FROM public.family_invitations
  WHERE invitee_email = invitation_email 
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
  
  IF invitation_family_id IS NULL THEN
    RAISE EXCEPTION 'No valid invitation found for email %', invitation_email;
  END IF;
  
  -- Update invitation status
  UPDATE public.family_invitations
  SET status = 'accepted'
  WHERE invitee_email = invitation_email 
    AND status = 'pending'
    AND family_id = invitation_family_id;
  
  RETURN invitation_family_id;
END;
$function$;

-- Fix calculate_next_due_date function
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(completed_date date, frequency text)
RETURNS date
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN
      RETURN completed_date + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN completed_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN completed_date + INTERVAL '3 months';
    WHEN 'seasonally' THEN
      RETURN completed_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN completed_date + INTERVAL '1 year';
    ELSE
      RETURN completed_date + INTERVAL '1 month';
  END CASE;
END;
$function$;