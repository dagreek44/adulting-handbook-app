-- Phase 3: Collapse family_members shadow table.
-- Roster is now derived from users + user_roles + family_invitations.

-- 1. Carry the invited role on the invitation itself
ALTER TABLE public.family_invitations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Child';

-- 2. Backfill role from family_members for any still-pending invitations
UPDATE public.family_invitations fi
SET role = fm.role
FROM public.family_members fm
WHERE fm.email = fi.invitee_email
  AND fm.family_id = fi.family_id
  AND fi.status = 'pending'
  AND fm.role IS NOT NULL;

-- 3. Salvage orphan pending family_members (no profile_id, no invitation row) into family_invitations
INSERT INTO public.family_invitations (inviter_id, invitee_email, family_id, status, role)
SELECT
  (SELECT id FROM public.users WHERE family_id = fm.family_id LIMIT 1),
  fm.email, fm.family_id, 'pending', COALESCE(fm.role, 'Child')
FROM public.family_members fm
WHERE fm.profile_id IS NULL
  AND fm.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.family_invitations fi
    WHERE fi.invitee_email = fm.email AND fi.family_id = fm.family_id
  )
  AND EXISTS (SELECT 1 FROM public.users WHERE family_id = fm.family_id);

-- 4. Rewrite handle_user_signup to stop writing family_members
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invitation_family_id UUID;
  invitation_role TEXT;
  new_family_id UUID;
BEGIN
  SELECT fi.family_id, COALESCE(fi.role, 'Child')
  INTO invitation_family_id, invitation_role
  FROM public.family_invitations fi
  WHERE fi.invitee_email = new.email
    AND fi.status = 'pending'
    AND fi.expires_at > now()
  ORDER BY fi.created_at DESC
  LIMIT 1;

  IF invitation_family_id IS NULL THEN
    new_family_id := gen_random_uuid();

    INSERT INTO public.users (id, email, first_name, last_name, username, family_id, first_login)
    VALUES (
      new.id, new.email,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'username', ''),
      new_family_id, true
    );

    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'parent');

  ELSE
    INSERT INTO public.users (id, email, first_name, last_name, username, family_id, first_login)
    VALUES (
      new.id, new.email,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'username', ''),
      invitation_family_id, true
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      new.id,
      CASE WHEN LOWER(invitation_role) = 'child' THEN 'child'::app_role ELSE 'parent'::app_role END
    );

    UPDATE public.family_invitations
    SET status = 'accepted'
    WHERE invitee_email = new.email
      AND status = 'pending'
      AND family_id = invitation_family_id;
  END IF;

  RETURN new;
END;
$function$;

-- 5. Move 10-member cap from family_members to users
DROP TRIGGER IF EXISTS enforce_family_member_limit ON public.family_members;

CREATE OR REPLACE FUNCTION public.enforce_family_size_on_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.family_id IS NOT NULL AND (
    SELECT count(*) FROM public.users
    WHERE family_id = NEW.family_id AND id <> NEW.id
  ) >= 10 THEN
    RAISE EXCEPTION 'Family is full (10 members maximum)';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_family_size ON public.users;
CREATE TRIGGER enforce_family_size
BEFORE INSERT OR UPDATE OF family_id ON public.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_family_size_on_users();

-- 6. Drop the shadow table and the now-unused limit function
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP FUNCTION IF EXISTS public.enforce_family_member_limit() CASCADE;