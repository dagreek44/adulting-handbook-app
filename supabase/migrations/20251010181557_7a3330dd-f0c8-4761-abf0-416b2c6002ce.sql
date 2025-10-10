-- Step 1: Fix the role constraint on family_members
ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_role_check;
ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check 
  CHECK (role IN ('Admin', 'Parent', 'Child'));

-- Step 2: Create missing profiles entries for users who don't have them
INSERT INTO public.profiles (id, first_name, last_name, username, family_id)
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.username,
  u.family_id
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  AND u.id IN (SELECT id FROM auth.users)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create missing family_members entries
INSERT INTO public.family_members (profile_id, family_id, name, email, role)
SELECT 
  u.id,
  u.family_id,
  u.first_name || ' ' || u.last_name,
  u.email,
  CASE 
    WHEN ur.role = 'admin' THEN 'Admin'
    WHEN ur.role = 'child' THEN 'Child'
    ELSE 'Parent'
  END
FROM public.users u
LEFT JOIN public.family_members fm ON u.id = fm.profile_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE fm.id IS NULL
  AND u.id IN (SELECT id FROM auth.users)
ON CONFLICT DO NOTHING;

-- Step 4: Create missing user_roles entries
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'parent'::app_role
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
  AND u.id IN (SELECT id FROM auth.users)
ON CONFLICT (user_id, role) DO NOTHING;