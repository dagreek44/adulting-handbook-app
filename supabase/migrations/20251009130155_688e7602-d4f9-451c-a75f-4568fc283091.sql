-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'parent', 'child');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update is_family_admin function to use user_roles table
CREATE OR REPLACE FUNCTION public.is_family_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(check_user_id, 'admin');
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles in their family"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  user_id IN (
    SELECT id FROM public.users 
    WHERE family_id = (SELECT family_id FROM public.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Only system can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Update handle_user_signup trigger for the two flows
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_family_id UUID;
  invitation_role TEXT;
  new_family_id UUID;
BEGIN
  -- Check for pending family invitation
  SELECT family_id, role INTO invitation_family_id, invitation_role
  FROM (
    SELECT fi.family_id, COALESCE(fm.role, 'parent') as role
    FROM public.family_invitations fi
    LEFT JOIN public.family_members fm ON fm.email = fi.invitee_email AND fm.family_id = fi.family_id
    WHERE fi.invitee_email = new.email 
      AND fi.status = 'pending'
      AND fi.expires_at > now()
    ORDER BY fi.created_at DESC
    LIMIT 1
  ) AS invitation_data;
  
  -- Flow 1: New user not invited - create new family and make them admin
  IF invitation_family_id IS NULL THEN
    new_family_id := gen_random_uuid();
    
    -- Insert into users table
    INSERT INTO public.users (
      id, email, first_name, last_name, username, family_id, password_hash
    )
    VALUES (
      new.id, new.email,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'username', ''),
      new_family_id,
      'authenticated_via_supabase_auth'
    );
    
    -- Insert into profiles table
    INSERT INTO public.profiles (id, first_name, last_name, username, family_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'username', ''),
      new_family_id
    );
    
    -- Create family_members entry
    INSERT INTO public.family_members (profile_id, family_id, name, email, role)
    VALUES (
      new.id,
      new_family_id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email,
      'Admin'
    );
    
    -- Assign admin role using service role bypass
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
    
  -- Flow 2: Invited user - join existing family with assigned role
  ELSE
    -- Insert into users table with inviter's family_id
    INSERT INTO public.users (
      id, email, first_name, last_name, username, family_id, password_hash
    )
    VALUES (
      new.id, new.email,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'username', ''),
      invitation_family_id,
      'authenticated_via_supabase_auth'
    );
    
    -- Insert into profiles table
    INSERT INTO public.profiles (id, first_name, last_name, username, family_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'username', ''),
      invitation_family_id
    );
    
    -- Update family_members entry with profile_id
    UPDATE public.family_members
    SET profile_id = new.id,
        name = COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', '')
    WHERE email = new.email AND family_id = invitation_family_id;
    
    -- Assign role based on invitation
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      new.id, 
      CASE 
        WHEN LOWER(invitation_role) = 'admin' THEN 'admin'::app_role
        WHEN LOWER(invitation_role) = 'child' THEN 'child'::app_role
        ELSE 'parent'::app_role
      END
    );
    
    -- Mark invitation as accepted
    UPDATE public.family_invitations
    SET status = 'accepted'
    WHERE invitee_email = new.email 
      AND status = 'pending'
      AND family_id = invitation_family_id;
  END IF;
  
  RETURN new;
END;
$$;