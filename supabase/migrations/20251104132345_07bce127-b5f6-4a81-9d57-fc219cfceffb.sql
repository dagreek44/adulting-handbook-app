-- Drop both sync triggers to prevent infinite recursion
DROP TRIGGER IF EXISTS sync_profile_to_users_trigger ON profiles;
DROP TRIGGER IF EXISTS sync_users_to_profiles_trigger ON users;

-- Drop both sync functions
DROP FUNCTION IF EXISTS sync_profile_to_users();
DROP FUNCTION IF EXISTS sync_users_to_profiles();

-- One-time backfill: Create profiles for all users in the users table that don't have profiles
INSERT INTO public.profiles (
  id,
  "Email Address",
  first_name,
  last_name,
  username,
  family_id
)
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.username,
  u.family_id
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Update family_members to link profile_id where it's NULL
UPDATE public.family_members fm
SET profile_id = u.id
FROM users u
WHERE fm.profile_id IS NULL
  AND fm.email = u.email;