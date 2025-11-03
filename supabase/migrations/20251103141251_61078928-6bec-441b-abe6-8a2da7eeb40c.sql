-- Drop the existing policy that's not working correctly
DROP POLICY IF EXISTS "Users can view family tasks" ON user_tasks;

-- Create a simpler, more reliable policy for viewing family tasks
-- This checks if the task's user_id belongs to someone in the same family as the viewer
CREATE POLICY "Users can view family tasks"
ON user_tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_tasks.user_id
    AND u1.family_id = u2.family_id
  )
);

-- Update the insert policy to allow creating tasks for any family member
DROP POLICY IF EXISTS "Users can insert family tasks" ON user_tasks;

CREATE POLICY "Users can insert family tasks"
ON user_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_tasks.user_id
    AND u1.family_id = u2.family_id
  )
);

-- Update the delete policy to allow parents to delete any family task
DROP POLICY IF EXISTS "Users can delete family tasks" ON user_tasks;

CREATE POLICY "Users can delete family tasks"
ON user_tasks
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) OR
  (
    has_role(auth.uid(), 'parent') AND
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u2.id = user_tasks.user_id
      AND u1.family_id = u2.family_id
    )
  )
);

-- Update policy for family members to update tasks assigned to them
DROP POLICY IF EXISTS "Users can update their own tasks" ON user_tasks;

CREATE POLICY "Users can update family tasks"
ON user_tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_tasks.user_id
    AND u1.family_id = u2.family_id
  )
);