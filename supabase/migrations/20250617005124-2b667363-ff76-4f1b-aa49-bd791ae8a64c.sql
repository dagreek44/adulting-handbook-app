
-- Add completed_date to completed_tasks table
ALTER TABLE public.completed_tasks ADD COLUMN completed_date DATE;

-- Create family_members table to track invited family members
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
  adulting_progress INTEGER DEFAULT 0,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for family_members table
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on family_members" ON public.family_members FOR ALL USING (true);

-- Insert default family member
INSERT INTO public.family_members (name, email, role, adulting_progress) VALUES 
('Family', 'family@default.com', 'Admin', 0);

-- Create function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  completed_date DATE,
  frequency TEXT
) RETURNS DATE AS $$
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
$$ LANGUAGE plpgsql;
