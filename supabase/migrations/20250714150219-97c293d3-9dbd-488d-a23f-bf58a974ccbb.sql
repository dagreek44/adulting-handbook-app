-- Fix RLS policies and triggers for user creation

-- Add INSERT policy for users table to allow trigger-based user creation
CREATE POLICY "Allow service role to insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Ensure the handle_user_signup trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup();

-- Also ensure we have a backup policy for authenticated users to insert their own profile
CREATE POLICY "Users can insert their own record" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);