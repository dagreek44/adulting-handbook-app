
-- 1. Remove the overly permissive "Allow service role to insert users" policy
-- Service role bypasses RLS anyway, so this WITH CHECK (true) is unnecessary and dangerous
DROP POLICY IF EXISTS "Allow service role to insert users" ON public.users;

-- 2. Block anonymous access to users table
CREATE POLICY "Deny anonymous access to users"
ON public.users
FOR SELECT
TO anon
USING (false);

-- 3. Block anonymous access to device_tokens table
CREATE POLICY "Deny anonymous access to device_tokens"
ON public.device_tokens
FOR SELECT
TO anon
USING (false);

-- 4. Block anonymous access to device_tokens for insert/update/delete too
CREATE POLICY "Deny anonymous insert to device_tokens"
ON public.device_tokens
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous insert to users"
ON public.users
FOR INSERT
TO anon
WITH CHECK (false);
