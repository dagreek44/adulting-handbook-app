
-- Add missing columns to user_tasks table
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Easy';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS estimated_time TEXT DEFAULT '30 min';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS estimated_budget TEXT;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS frequency_days INTEGER DEFAULT 30;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS last_completed DATE;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT '{}';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS tools JSONB DEFAULT '[]';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS supplies JSONB DEFAULT '[]';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS reminder_type TEXT DEFAULT 'global';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Make reminder_id nullable since custom tasks won't have one
ALTER TABLE public.user_tasks ALTER COLUMN reminder_id DROP NOT NULL;

-- Update the existing constraint to allow null reminder_id
ALTER TABLE public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_reminder_id_fkey;
ALTER TABLE public.user_tasks ADD CONSTRAINT user_tasks_reminder_id_fkey 
  FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON DELETE CASCADE;
