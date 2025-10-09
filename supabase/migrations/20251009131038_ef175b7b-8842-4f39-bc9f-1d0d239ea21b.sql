-- Backfill roles for existing users who don't have roles assigned yet
-- Only assign roles to users that exist in auth.users

-- Assign 'admin' role to the oldest user in each family (first created account)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT ON (u.family_id) u.id, 'admin'::app_role
FROM public.users u
WHERE EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = u.id
)
ORDER BY u.family_id, u.created_at ASC
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign 'parent' role to all other existing users who don't have any role yet
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'parent'::app_role
FROM public.users u
WHERE EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = u.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;