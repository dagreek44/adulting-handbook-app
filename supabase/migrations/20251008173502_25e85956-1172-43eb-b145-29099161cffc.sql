-- Add family_id column to family_members table (no foreign key constraint)
ALTER TABLE public.family_members 
ADD COLUMN family_id uuid;

-- Update existing family_members to set their family_id based on their profile_id
UPDATE public.family_members
SET family_id = (
  SELECT family_id 
  FROM public.profiles 
  WHERE profiles.id = family_members.profile_id
)
WHERE profile_id IS NOT NULL;

-- For pending invitations (no profile_id), set family_id from the invitation
UPDATE public.family_members fm
SET family_id = (
  SELECT fi.family_id
  FROM public.family_invitations fi
  WHERE fi.invitee_email = fm.email
  LIMIT 1
)
WHERE fm.profile_id IS NULL AND fm.family_id IS NULL;

-- Create index for better query performance
CREATE INDEX idx_family_members_family_id ON public.family_members(family_id);

-- Update RLS policies to use the new family_id column
DROP POLICY IF EXISTS "Users can view their family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can update their family members" ON public.family_members;

CREATE POLICY "Users can view their family members"
ON public.family_members
FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their family members"
ON public.family_members
FOR UPDATE
TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
);