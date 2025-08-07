-- Update the handle_user_signup function to properly handle family invitations
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Also update the handle_new_user function to use invitation family_id if available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

  INSERT INTO public.profiles (id, first_name, last_name, username, family_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name', 
    new.raw_user_meta_data ->> 'username',
    COALESCE(invitation_family_id, gen_random_uuid())
  );
  RETURN new;
END;
$function$;