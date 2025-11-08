-- Drop the restrictive SELECT policy on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create new policy allowing family members to see each other's data
CREATE POLICY "Users can view family member data"
ON users FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id 
    FROM users 
    WHERE id = auth.uid()
  )
);