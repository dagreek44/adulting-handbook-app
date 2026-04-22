
-- 1. Drop the unused password_hash column from users table
-- Authentication is handled entirely by Supabase Auth; this column stored only a placeholder
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- 2. Tighten family_invitations SELECT policy to only inviter (and recipient by email)
DROP POLICY IF EXISTS "Users can view family invitations" ON public.family_invitations;
DROP POLICY IF EXISTS "Family members can view invitations" ON public.family_invitations;
DROP POLICY IF EXISTS "Authenticated users can view invitations for their family" ON public.family_invitations;

CREATE POLICY "Inviter and invitee can view invitations"
ON public.family_invitations
FOR SELECT
TO authenticated
USING (
  inviter_id = auth.uid()
  OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
