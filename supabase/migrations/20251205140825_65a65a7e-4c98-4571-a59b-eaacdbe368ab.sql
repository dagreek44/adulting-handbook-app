-- Add first_login column to profiles table for onboarding flow tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_login boolean DEFAULT true;

-- Update existing users to have completed onboarding (they shouldn't see it again)
UPDATE public.profiles SET first_login = false WHERE first_login IS NULL;