
-- Create a table for reminders with completion tracking
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Easy',
  estimated_time TEXT DEFAULT '30 min',
  estimated_budget TEXT,
  due_date DATE,
  video_url TEXT,
  instructions TEXT[],
  tools JSONB,
  supplies JSONB,
  enabled BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  assignees TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for completed tasks
CREATE TABLE public.completed_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID REFERENCES public.reminders(id),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT,
  estimated_time TEXT,
  estimated_budget TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) - making tables public for now since no auth is implemented
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (can be restricted later when auth is added)
CREATE POLICY "Allow all operations on reminders" ON public.reminders FOR ALL USING (true);
CREATE POLICY "Allow all operations on completed_tasks" ON public.completed_tasks FOR ALL USING (true);

-- Insert default reminders
INSERT INTO public.reminders (title, description, frequency, difficulty, estimated_time, estimated_budget, video_url, instructions, tools, supplies) VALUES
('Change Furnace Filter', 'Replace the HVAC filter to improve air quality and system efficiency', 'monthly', 'Easy', '15 min', '$15-25', 'https://youtube.com/watch?v=example1', 
 ARRAY['Turn off your HVAC system at the thermostat', 'Locate the air filter compartment (usually near the return air duct)', 'Remove the old filter and note the airflow direction arrows', 'Insert the new filter with arrows pointing toward the unit', 'Close the compartment and turn the system back on'],
 '[{"name": "Flashlight", "required": false}, {"name": "Screwdriver", "required": false, "amazonUrl": "https://amazon.com/screwdriver"}]'::jsonb,
 '[{"name": "HVAC Filter (16x25x1)", "amazonUrl": "https://amazon.com/hvac-filter", "estimatedCost": "$8-15"}, {"name": "Disposable Gloves", "amazonUrl": "https://amazon.com/gloves", "estimatedCost": "$5-10"}]'::jsonb),

('Clean Gutters', 'Remove debris and check for proper drainage to prevent water damage', 'seasonally', 'Medium', '2 hours', '$30-50', 'https://youtube.com/watch?v=example2',
 ARRAY['Set up a sturdy ladder on level ground', 'Remove large debris by hand', 'Use a garden hose to flush remaining debris', 'Check downspouts for clogs', 'Inspect gutters for damage or loose connections'],
 '[{"name": "Extension Ladder", "required": true}, {"name": "Garden Hose", "required": true}, {"name": "Gutter Scoop", "required": false, "amazonUrl": "https://amazon.com/gutter-scoop"}]'::jsonb,
 '[{"name": "Work Gloves", "amazonUrl": "https://amazon.com/work-gloves", "estimatedCost": "$10-20"}, {"name": "Trash Bags", "amazonUrl": "https://amazon.com/trash-bags", "estimatedCost": "$8-15"}]'::jsonb),

('Test Smoke Detectors', 'Check batteries and test alarm functionality for home safety', 'monthly', 'Easy', '30 min', '$15-20', 'https://youtube.com/watch?v=example3',
 ARRAY['Press and hold the test button on each detector', 'Listen for a loud, clear alarm sound', 'Replace batteries if alarm is weak or doesn''t sound', 'Test again after battery replacement', 'Record the test date for your records'],
 '[{"name": "Step Ladder", "required": true}, {"name": "Battery Tester", "required": false, "amazonUrl": "https://amazon.com/battery-tester"}]'::jsonb,
 '[{"name": "9V Batteries (4-pack)", "amazonUrl": "https://amazon.com/9v-batteries", "estimatedCost": "$12-18"}]'::jsonb);
