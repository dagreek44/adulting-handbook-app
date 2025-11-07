-- Add family_id column to user_tasks (without foreign key constraint)
ALTER TABLE public.user_tasks 
ADD COLUMN family_id UUID;

-- Populate family_id for existing rows based on user_id
UPDATE public.user_tasks ut
SET family_id = u.family_id
FROM public.users u
WHERE ut.user_id = u.id;

-- Make family_id not nullable now that it's populated
ALTER TABLE public.user_tasks 
ALTER COLUMN family_id SET NOT NULL;

-- Create function to auto-populate family_id on insert
CREATE OR REPLACE FUNCTION public.set_user_task_family_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get family_id from users table
  SELECT family_id INTO NEW.family_id
  FROM users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-populate family_id
CREATE TRIGGER set_family_id_on_user_task_insert
BEFORE INSERT ON public.user_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_user_task_family_id();

-- Update RLS policy to use family_id for better performance
DROP POLICY IF EXISTS "Users can view family tasks" ON public.user_tasks;

CREATE POLICY "Users can view family tasks"
ON public.user_tasks
FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id 
    FROM users 
    WHERE id = auth.uid()
  )
);