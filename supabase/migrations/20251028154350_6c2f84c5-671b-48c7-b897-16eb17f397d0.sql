-- Update RLS policies on user_tasks to allow viewing all family tasks
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.user_tasks;

-- Create new policy to allow viewing all tasks in the same family
CREATE POLICY "Users can view family tasks"
ON public.user_tasks
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT u.id 
    FROM public.users u
    WHERE u.family_id = (
      SELECT family_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  )
);

-- Update policy should still be restricted to own tasks
-- Users can only update tasks assigned to them
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.user_tasks;

CREATE POLICY "Users can update their own tasks"
ON public.user_tasks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Insert policy should allow creating tasks for any family member
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.user_tasks;

CREATE POLICY "Users can insert family tasks"
ON public.user_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT u.id 
    FROM public.users u
    WHERE u.family_id = (
      SELECT family_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  )
);

-- Delete policy should allow parents to delete any family task
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.user_tasks;

CREATE POLICY "Users can delete family tasks"
ON public.user_tasks
FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT u.id 
    FROM public.users u
    WHERE u.family_id = (
      SELECT family_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  )
);