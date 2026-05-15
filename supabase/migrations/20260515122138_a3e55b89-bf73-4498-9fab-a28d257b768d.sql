GRANT EXECUTE ON FUNCTION public.get_user_family_id(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_group_ids(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated, anon;