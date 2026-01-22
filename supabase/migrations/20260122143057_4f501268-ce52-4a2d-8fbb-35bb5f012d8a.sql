-- Add 'why' column to reminders table for "Why it Matters" information
ALTER TABLE public.reminders
ADD COLUMN why text DEFAULT NULL;

-- Add 'why' column to user_tasks table to inherit from global reminders
ALTER TABLE public.user_tasks
ADD COLUMN why text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.reminders.why IS 'Explains why this reminder matters to the user';
COMMENT ON COLUMN public.user_tasks.why IS 'Why it matters - inherited from global reminder when enabled';