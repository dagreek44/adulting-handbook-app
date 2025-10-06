-- Add completed_by to user_tasks to track who completed the task
ALTER TABLE public.user_tasks 
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id);

-- Add a constraint to ensure only valid roles
ALTER TABLE public.family_members
DROP CONSTRAINT IF EXISTS valid_family_role;

ALTER TABLE public.family_members
ADD CONSTRAINT valid_family_role CHECK (role IN ('Admin', 'Parent', 'Child'));

-- Update any existing 'Member' roles to 'Parent'
UPDATE public.family_members 
SET role = 'Parent' 
WHERE role = 'Member';

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_family_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN family_members fm ON fm.profile_id = p.id
    WHERE p.id = check_user_id 
    AND fm.role = 'Admin'
  );
$$;

-- Update RLS policies for family_members to restrict delete to admins only
DROP POLICY IF EXISTS "Users can remove their family members" ON public.family_members;

CREATE POLICY "Only admins can remove family members"
ON public.family_members
FOR DELETE
TO authenticated
USING (
  public.is_family_admin(auth.uid())
  AND (
    profile_id IN (
      SELECT profiles.id
      FROM profiles
      WHERE profiles.family_id = (
        SELECT profiles_1.family_id
        FROM profiles profiles_1
        WHERE profiles_1.id = auth.uid()
      )
    ) 
    OR email IN (
      SELECT users.email
      FROM users
      WHERE users.family_id = (
        SELECT users_1.family_id
        FROM users users_1
        WHERE users_1.id = auth.uid()
      )
    )
  )
);

-- Update invite policy to restrict to admins only
DROP POLICY IF EXISTS "Users can invite to their family" ON public.family_members;

CREATE POLICY "Only admins can invite to their family"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_family_admin(auth.uid()));