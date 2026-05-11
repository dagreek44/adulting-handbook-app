
-- 1. user_roles: explicitly deny client UPDATE/DELETE to prevent privilege escalation
CREATE POLICY "Deny client updates to user_roles"
ON public.user_roles FOR UPDATE TO public USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes from user_roles"
ON public.user_roles FOR DELETE TO public USING (false);

-- 2. family_invitations: allow inviter to revoke their own pending invitations
CREATE POLICY "Inviters can delete their invitations"
ON public.family_invitations FOR DELETE TO authenticated
USING (inviter_id = auth.uid());

-- 3. Lock down SECURITY DEFINER functions: only expose ones the client legitimately calls.
-- Revoke broad EXECUTE on every public function, then re-grant only client-facing ones.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.proname, r.args);
  END LOOP;
END$$;

-- Re-grant EXECUTE only on functions invoked from client code
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_badge_progress(uuid, uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend_group_invitation(text) TO authenticated;
