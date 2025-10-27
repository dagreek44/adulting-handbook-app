-- Step 1: Remove admin role concept and simplify to Parent/Child only

-- First, convert all Admin family members to Parent
UPDATE public.family_members
SET role = 'Parent'
WHERE role = 'Admin';

-- Update the constraint on family_members to only allow Parent and Child
ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_role_check;
ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check 
  CHECK (role IN ('Parent', 'Child'));

-- Convert all admin user_roles to parent
UPDATE public.user_roles
SET role = 'parent'::app_role
WHERE role = 'admin'::app_role;

-- Drop the policies that depend on is_family_admin before dropping the function
DROP POLICY IF EXISTS "Only admins can invite to their family" ON public.family_members;
DROP POLICY IF EXISTS "Only admins can remove family members" ON public.family_members;

-- Drop the is_family_admin function
DROP FUNCTION IF EXISTS public.is_family_admin(uuid);

-- Update the app_role enum by creating a new one without admin
CREATE TYPE public.app_role_new AS ENUM ('parent', 'child');

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role_new 
  USING role::text::public.app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE IF EXISTS public.app_role CASCADE;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate the has_role function with the new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create new policies that allow any parent to manage family members
CREATE POLICY "Parents can invite to their family"
ON public.family_members
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'parent'::app_role)
);

CREATE POLICY "Parents can remove family members"
ON public.family_members
FOR DELETE
USING (
  public.has_role(auth.uid(), 'parent'::app_role) 
  AND (
    (profile_id IN (
      SELECT profiles.id
      FROM profiles
      WHERE profiles.family_id = (
        SELECT profiles_1.family_id
        FROM profiles profiles_1
        WHERE profiles_1.id = auth.uid()
      )
    ))
    OR (email IN (
      SELECT users.email
      FROM users
      WHERE users.family_id = (
        SELECT users_1.family_id
        FROM users users_1
        WHERE users_1.id = auth.uid()
      )
    ))
  )
);

-- Update the handle_user_signup function to always assign 'parent' to first user
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Flow 1: New user not invited - create new family and make them parent
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
    
    -- Create family_members entry as Parent (no more admin)
    INSERT INTO public.family_members (profile_id, family_id, name, email, role)
    VALUES (
      new.id,
      new_family_id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email,
      'Parent'
    );
    
    -- Assign parent role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'parent');
    
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
    
    -- Assign role based on invitation (only parent or child now)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      new.id, 
      CASE 
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
$function$;