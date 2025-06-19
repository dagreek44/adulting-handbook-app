
-- First, let's create the updated database structure

-- 1. Create a new table for out-of-the-box reminders (global reminders)
CREATE TABLE public.global_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Easy',
  estimated_time TEXT DEFAULT '30 min',
  estimated_budget TEXT,
  video_url TEXT,
  instructions TEXT[],
  tools JSONB,
  supplies JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Rename completed_tasks to user_tasks and extend it
ALTER TABLE public.completed_tasks RENAME TO user_tasks;

-- 3. Add new columns to user_tasks table
ALTER TABLE public.user_tasks 
ADD COLUMN reminder_type TEXT DEFAULT 'custom' CHECK (reminder_type IN ('global', 'custom')),
ADD COLUMN global_reminder_id UUID REFERENCES public.global_reminders(id),
ADD COLUMN enabled BOOLEAN DEFAULT true,
ADD COLUMN due_date DATE,
ADD COLUMN frequency TEXT;

-- 4. Update the existing reminders table to be family-specific only (custom reminders)
-- No changes needed to reminders table structure, it will remain for custom reminders

-- 5. Create RLS policies for global_reminders (readable by all authenticated users)
ALTER TABLE public.global_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global reminders are viewable by all authenticated users" 
  ON public.global_reminders 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Admin policy for inserting global reminders (you can adjust this as needed)
CREATE POLICY "Only admins can manage global reminders" 
  ON public.global_reminders 
  FOR ALL 
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 6. Update RLS policies for user_tasks (formerly completed_tasks)
DROP POLICY IF EXISTS "Users can view family completed tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can insert family completed tasks" ON public.user_tasks;

CREATE POLICY "Users can view family user tasks" 
  ON public.user_tasks 
  FOR SELECT 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert family user tasks" 
  ON public.user_tasks 
  FOR INSERT 
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update family user tasks" 
  ON public.user_tasks 
  FOR UPDATE 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete family user tasks" 
  ON public.user_tasks 
  FOR DELETE 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 7. Insert some sample global reminders
INSERT INTO public.global_reminders (title, description, frequency, difficulty, estimated_time, estimated_budget, instructions) VALUES
('Change Air Filter', 'Replace HVAC air filter to maintain air quality', 'monthly', 'Easy', '15 min', '$10-20', ARRAY['Turn off HVAC system', 'Locate air filter compartment', 'Remove old filter', 'Insert new filter with arrow pointing toward unit', 'Turn system back on']),
('Clean Gutters', 'Remove debris from gutters and downspouts', 'quarterly', 'Medium', '2-3 hours', '$0-50', ARRAY['Set up ladder safely', 'Remove debris by hand or with scoop', 'Flush gutters with garden hose', 'Check downspouts for clogs', 'Inspect for damage']),
('Test Smoke Detectors', 'Test all smoke detectors and replace batteries if needed', 'monthly', 'Easy', '30 min', '$5-15', ARRAY['Press test button on each detector', 'Replace batteries if chirping', 'Clean detector with soft brush', 'Check expiration date on unit']),
('Deep Clean Refrigerator', 'Remove expired items and clean all surfaces', 'monthly', 'Medium', '1 hour', '$5-10', ARRAY['Remove all items', 'Check expiration dates', 'Wipe down all shelves and drawers', 'Clean exterior', 'Organize items back']);

-- 8. Create a function to calculate next due date (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(completed_date DATE, frequency TEXT)
RETURNS DATE
LANGUAGE plpgsql
AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN
      RETURN completed_date + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN completed_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN completed_date + INTERVAL '3 months';
    WHEN 'seasonally' THEN
      RETURN completed_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN completed_date + INTERVAL '1 year';
    ELSE
      RETURN completed_date + INTERVAL '1 month';
  END CASE;
END;
$$;
