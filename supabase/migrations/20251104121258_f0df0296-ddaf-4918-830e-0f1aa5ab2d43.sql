
-- First, let's look at the handle_user_signup function to see what it does
-- and make sure it properly syncs auth users to the users table

-- Function to sync profile data to users table
CREATE OR REPLACE FUNCTION sync_profile_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the users table when profile is created/updated
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    username,
    family_id,
    password_hash
  ) VALUES (
    NEW.id,
    COALESCE(NEW."Email Address", 'no-email@example.com'),
    NEW.first_name,
    NEW.last_name,
    NEW.username,
    NEW.family_id,
    'authenticated_via_supabase_auth'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    family_id = EXCLUDED.family_id,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync profiles to users on insert or update
DROP TRIGGER IF EXISTS sync_profile_to_users_trigger ON profiles;
CREATE TRIGGER sync_profile_to_users_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_users();

-- Sync existing profiles that don't have corresponding users records
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  username,
  family_id,
  password_hash
)
SELECT 
  p.id,
  COALESCE(p."Email Address", 'no-email@example.com'),
  p.first_name,
  p.last_name,
  p.username,
  p.family_id,
  'authenticated_via_supabase_auth'
FROM profiles p
LEFT JOIN users u ON p.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
