
-- Create reminders table for global reminder templates
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 30,
  category TEXT DEFAULT 'maintenance',
  difficulty TEXT DEFAULT 'Easy',
  estimated_time TEXT DEFAULT '30 min',
  estimated_budget TEXT,
  video_url TEXT,
  instructions TEXT[] DEFAULT '{}',
  tools JSONB DEFAULT '[]',
  supplies JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_tasks table for user-specific reminders
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'Easy',
  estimated_time TEXT DEFAULT '30 min',
  estimated_budget TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 30,
  due_date DATE NOT NULL,
  last_completed DATE,
  status TEXT DEFAULT 'pending',
  video_url TEXT,
  instructions TEXT[] DEFAULT '{}',
  tools JSONB DEFAULT '[]',
  supplies JSONB DEFAULT '[]',
  reminder_type TEXT DEFAULT 'global',
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for reminders (global reminders are viewable by all authenticated users)
CREATE POLICY "Anyone can view reminders" ON public.reminders
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for user_tasks (users can only see their own tasks)
CREATE POLICY "Users can view their own tasks" ON public.user_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON public.user_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.user_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.user_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Insert some sample global reminders
INSERT INTO public.reminders (title, description, frequency_days, category, difficulty, estimated_time, estimated_budget, instructions, tools, supplies) VALUES
('Change HVAC Filter', 'Replace your heating and cooling system filter to maintain air quality and system efficiency', 90, 'hvac', 'Easy', '15 min', '$15-30', 
 ARRAY['Turn off HVAC system', 'Locate filter compartment', 'Remove old filter', 'Insert new filter with airflow arrow pointing toward unit', 'Turn system back on'],
 '[]'::jsonb, 
 '[{"item": "HVAC filter", "quantity": "1", "estimated_cost": "$15-30"}]'::jsonb),

('Clean Gutters', 'Remove debris from gutters and downspouts to prevent water damage', 180, 'exterior', 'Medium', '2-3 hours', '$50-100', 
 ARRAY['Set up sturdy ladder', 'Remove leaves and debris by hand', 'Flush gutters with water', 'Check for proper drainage', 'Inspect for damage'],
 '[{"item": "Ladder", "required": true}, {"item": "Work gloves", "required": true}, {"item": "Garden hose", "required": true}]'::jsonb,
 '[{"item": "Trash bags", "quantity": "2-3", "estimated_cost": "$5"}]'::jsonb),

('Test Smoke Detectors', 'Test all smoke detectors and replace batteries if needed', 180, 'safety', 'Easy', '30 min', '$20-40',
 ARRAY['Press test button on each detector', 'Listen for loud beep', 'Replace batteries in units that don''t beep', 'Test again after battery replacement'],
 '[]'::jsonb,
 '[{"item": "9V batteries", "quantity": "as needed", "estimated_cost": "$3-5 each"}]'::jsonb),

('Deep Clean Refrigerator', 'Clean interior and exterior of refrigerator, including coils', 90, 'appliances', 'Medium', '1-2 hours', '$10-20',
 ARRAY['Remove all food items', 'Remove shelves and drawers', 'Clean with mild soap solution', 'Wipe down exterior', 'Clean coils if accessible', 'Replace items'],
 '[{"item": "Vacuum cleaner", "required": false}, {"item": "Cleaning cloths", "required": true}]'::jsonb,
 '[{"item": "Mild dish soap", "quantity": "1", "estimated_cost": "$3"}, {"item": "Baking soda", "quantity": "1 box", "estimated_cost": "$2"}]'::jsonb);
