-- Allow users to update invitations sent to their email (for accepting invitations)
CREATE POLICY "Users can update their own invitations"
ON family_invitations
FOR UPDATE
TO authenticated
USING (invitee_email = auth.email())
WITH CHECK (invitee_email = auth.email());