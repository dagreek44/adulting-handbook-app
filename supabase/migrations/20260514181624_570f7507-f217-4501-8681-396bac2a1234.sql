
-- Phase 2: Consolidate profiles into users

-- 1. Add first_login to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_login boolean NOT NULL DEFAULT true;

-- 2. Backfill first_login from profiles
UPDATE public.users u
SET first_login = p.first_login
FROM public.profiles p
WHERE p.id = u.id AND p.first_login IS NOT NULL;

-- 3. Rewrite signup trigger function: stop writing to profiles
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
  existing_member_id UUID;
BEGIN
  SELECT fi.family_id, COALESCE(fm.role, 'Parent'), fm.id
  INTO invitation_family_id, invitation_role, existing_member_id
  FROM public.family_invitations fi
  LEFT JOIN public.family_members fm ON fm.email = fi.invitee_email AND fm.family_id = fi.family_id
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

    INSERT INTO public.family_members (profile_id, family_id, name, email, role)
    VALUES (
      new.id, new_family_id,
      TRIM(COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', '')),
      new.email, 'Parent'
    )
    ON CONFLICT DO NOTHING;

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

    IF existing_member_id IS NOT NULL THEN
      UPDATE public.family_members
      SET profile_id = new.id,
          name = TRIM(COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''))
      WHERE id = existing_member_id;
    ELSE
      INSERT INTO public.family_members (profile_id, family_id, name, email, role)
      VALUES (
        new.id, invitation_family_id,
        TRIM(COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', '')),
        new.email,
        CASE WHEN LOWER(invitation_role) = 'child' THEN 'Child' ELSE 'Parent' END
      )
      ON CONFLICT DO NOTHING;
    END IF;

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

-- 4. Drop the unused legacy trigger function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Drop the profiles table
DROP TABLE public.profiles CASCADE;
