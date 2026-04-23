GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
REVOKE ALL ON public.users FROM anon;