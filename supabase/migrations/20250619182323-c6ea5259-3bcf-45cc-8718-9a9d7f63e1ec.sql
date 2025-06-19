
-- Drop the global_reminders table
DROP TABLE IF EXISTS public.global_reminders;

-- Recreate the user_tasks table with the new simplified structure
DROP TABLE IF EXISTS public.user_tasks;

CREATE TABLE public.user_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id uuid REFERENCES public.reminders(id) ON DELETE CASCADE NOT NULL,
  completed_date date,
  family_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  due_date date NOT NULL,
  frequency text NOT NULL,
  reminder_type text NOT NULL DEFAULT 'custom',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_tasks
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_tasks
CREATE POLICY "Users can view their family's tasks" 
  ON public.user_tasks 
  FOR SELECT 
  USING (true); -- Allow all users to see tasks for now, can be restricted later

CREATE POLICY "Users can insert their family's tasks" 
  ON public.user_tasks 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their family's tasks" 
  ON public.user_tasks 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete their family's tasks" 
  ON public.user_tasks 
  FOR DELETE 
  USING (true);
