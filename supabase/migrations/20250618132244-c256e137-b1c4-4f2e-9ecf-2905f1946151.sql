
-- Create a profiles table to store user information and family relationships
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  family_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Update family_members table to reference profiles instead of having separate user data
ALTER TABLE public.family_members ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update reminders table to include family_id for family-based filtering
ALTER TABLE public.reminders ADD COLUMN family_id UUID;

-- Update completed_tasks table to include family_id for family-based filtering  
ALTER TABLE public.completed_tasks ADD COLUMN family_id UUID;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, username, family_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name', 
    new.raw_user_meta_data ->> 'username',
    COALESCE((new.raw_user_meta_data ->> 'family_id')::UUID, gen_random_uuid())
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add RLS policies for family-based access to reminders
CREATE POLICY "Users can view family reminders" 
  ON public.reminders 
  FOR SELECT 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert family reminders" 
  ON public.reminders 
  FOR INSERT 
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update family reminders" 
  ON public.reminders 
  FOR UPDATE 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete family reminders" 
  ON public.reminders 
  FOR DELETE 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Add RLS policies for family-based access to completed_tasks
CREATE POLICY "Users can view family completed tasks" 
  ON public.completed_tasks 
  FOR SELECT 
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert family completed tasks" 
  ON public.completed_tasks 
  FOR INSERT 
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Enable RLS on reminders and completed_tasks tables
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_tasks ENABLE ROW LEVEL SECURITY;
