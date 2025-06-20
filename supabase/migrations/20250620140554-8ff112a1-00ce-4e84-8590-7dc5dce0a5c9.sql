
-- Create users table for authentication
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text UNIQUE NOT NULL,
  family_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own data
CREATE POLICY "Users can view their own data" 
  ON public.users 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data" 
  ON public.users 
  FOR UPDATE 
  USING (id = auth.uid());

-- Create family_invitations table
CREATE TABLE public.family_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email text NOT NULL,
  family_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on family_invitations
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for family invitations
CREATE POLICY "Users can view invitations for their family" 
  ON public.family_invitations 
  FOR SELECT 
  USING (
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations for their family" 
  ON public.family_invitations 
  FOR INSERT 
  WITH CHECK (
    inviter_id = auth.uid() AND
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Update reminders table to properly link to families
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS family_id uuid;

-- Update user_tasks to properly reference users
ALTER TABLE public.user_tasks 
DROP COLUMN IF EXISTS family_id,
ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable RLS on user_tasks with proper policies
DROP POLICY IF EXISTS "Users can view their family's tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can insert their family's tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can update their family's tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can delete their family's tasks" ON public.user_tasks;

CREATE POLICY "Users can view their own tasks" 
  ON public.user_tasks 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks" 
  ON public.user_tasks 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks" 
  ON public.user_tasks 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks" 
  ON public.user_tasks 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Enable RLS on reminders
CREATE POLICY "Users can view global and family reminders" 
  ON public.reminders 
  FOR SELECT 
  USING (
    is_custom = false OR 
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create family reminders" 
  ON public.reminders 
  FOR INSERT 
  WITH CHECK (
    is_custom = true AND
    family_id IN (
      SELECT family_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into users table when a new auth user is created
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    username,
    family_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'username', ''),
    COALESCE((new.raw_user_meta_data ->> 'family_id')::uuid, gen_random_uuid())
  );
  RETURN new;
END;
$$;

-- Create trigger for user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup();
