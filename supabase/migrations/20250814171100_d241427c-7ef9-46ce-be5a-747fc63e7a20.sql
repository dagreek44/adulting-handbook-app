-- Remove the overly permissive policy that allows all operations on reminders
DROP POLICY IF EXISTS "Allow all operations on reminders" ON public.reminders;

-- The existing family-scoped policies will remain:
-- - "Users can view global and family reminders" 
-- - "Users can create family reminders"
-- - "Users can insert family reminders" 
-- - "Users can update family reminders"
-- - "Users can delete family reminders"
-- - "Users can view family reminders"
-- These policies properly restrict access to family data only