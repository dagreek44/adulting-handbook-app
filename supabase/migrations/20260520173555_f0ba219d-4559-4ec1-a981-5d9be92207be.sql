CREATE POLICY "Users can view family members' roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.get_user_family_id(user_id) = public.get_user_family_id(auth.uid())
);