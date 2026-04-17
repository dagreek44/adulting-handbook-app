-- Drop policies that reference columns we're removing
DROP POLICY IF EXISTS "Users can create family reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete family reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert family reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update family reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can view family reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can view global and family reminders" ON public.reminders;

-- Drop unused columns from reminders (global content table)
ALTER TABLE public.reminders
  DROP COLUMN IF EXISTS is_custom,
  DROP COLUMN IF EXISTS family_id,
  DROP COLUMN IF EXISTS enabled,
  DROP COLUMN IF EXISTS assignees,
  DROP COLUMN IF EXISTS due_date;

-- Drop unused column from family_members
ALTER TABLE public.family_members
  DROP COLUMN IF EXISTS adulting_progress;

-- New simple RLS for reminders: authenticated users can read; no client writes
CREATE POLICY "Authenticated users can read reminders"
  ON public.reminders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Deny anon read of reminders"
  ON public.reminders
  FOR SELECT
  TO anon
  USING (false);