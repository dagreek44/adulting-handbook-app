
-- ========================================
-- Step 1: Family size limit trigger (max 10)
-- ========================================

CREATE OR REPLACE FUNCTION public.enforce_family_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM family_members
  WHERE family_id = NEW.family_id;

  IF member_count >= 10 THEN
    RAISE EXCEPTION 'Family member limit reached (maximum 10 members)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_family_member_limit
BEFORE INSERT ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.enforce_family_member_limit();

-- ========================================
-- Step 2: Friend group tables
-- ========================================

CREATE TABLE public.friend_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.friend_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.friend_groups(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_group_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.friend_group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.friend_groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_group_invitations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Friend group member limit trigger (max 10)
-- ========================================

CREATE OR REPLACE FUNCTION public.enforce_friend_group_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
  group_max INTEGER;
BEGIN
  SELECT max_members INTO group_max
  FROM friend_groups
  WHERE id = NEW.group_id;

  SELECT COUNT(*) INTO member_count
  FROM friend_group_members
  WHERE group_id = NEW.group_id;

  IF member_count >= group_max THEN
    RAISE EXCEPTION 'Friend group member limit reached (maximum % members)', group_max;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_friend_group_member_limit
BEFORE INSERT ON public.friend_group_members
FOR EACH ROW
EXECUTE FUNCTION public.enforce_friend_group_member_limit();

-- ========================================
-- Security definer helper: check if user is member of a group
-- ========================================

CREATE OR REPLACE FUNCTION public.is_group_member(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friend_group_members
    WHERE user_id = p_user_id AND group_id = p_group_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friend_groups
    WHERE id = p_group_id AND created_by = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_group_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM friend_group_members
  WHERE user_id = p_user_id AND status = 'active';
$$;

-- ========================================
-- RLS policies for friend_groups
-- ========================================

CREATE POLICY "Users can view their groups"
ON public.friend_groups FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_group_ids(auth.uid())));

CREATE POLICY "Authenticated users can create groups"
ON public.friend_groups FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their groups"
ON public.friend_groups FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their groups"
ON public.friend_groups FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- ========================================
-- RLS policies for friend_group_members
-- ========================================

CREATE POLICY "Members can view group members"
ON public.friend_group_members FOR SELECT
TO authenticated
USING (group_id IN (SELECT public.get_user_group_ids(auth.uid())));

CREATE POLICY "Group creators can add members"
ON public.friend_group_members FOR INSERT
TO authenticated
WITH CHECK (public.is_group_creator(auth.uid(), group_id) OR invited_by = auth.uid());

CREATE POLICY "Group creators can remove members"
ON public.friend_group_members FOR DELETE
TO authenticated
USING (public.is_group_creator(auth.uid(), group_id) OR user_id = auth.uid());

CREATE POLICY "Group creators can update members"
ON public.friend_group_members FOR UPDATE
TO authenticated
USING (public.is_group_creator(auth.uid(), group_id) OR user_id = auth.uid());

-- ========================================
-- RLS policies for friend_group_invitations
-- ========================================

CREATE POLICY "Members can view group invitations"
ON public.friend_group_invitations FOR SELECT
TO authenticated
USING (group_id IN (SELECT public.get_user_group_ids(auth.uid())) OR invitee_email = auth.email());

CREATE POLICY "Members can create invitations"
ON public.friend_group_invitations FOR INSERT
TO authenticated
WITH CHECK (public.is_group_member(auth.uid(), group_id) OR public.is_group_creator(auth.uid(), group_id));

CREATE POLICY "Inviters can update their invitations"
ON public.friend_group_invitations FOR UPDATE
TO authenticated
USING (inviter_id = auth.uid() OR invitee_email = auth.email());

-- ========================================
-- Step 3: Add group_id to user_tasks
-- ========================================

ALTER TABLE public.user_tasks ADD COLUMN group_id UUID REFERENCES public.friend_groups(id);

-- Update RLS: allow viewing tasks from user's friend groups
DROP POLICY IF EXISTS "Users can view family tasks" ON public.user_tasks;
CREATE POLICY "Users can view family and group tasks"
ON public.user_tasks FOR SELECT
TO authenticated
USING (
  family_id IN (SELECT users.family_id FROM users WHERE users.id = auth.uid())
  OR (group_id IS NOT NULL AND group_id IN (SELECT public.get_user_group_ids(auth.uid())))
);

-- Update INSERT policy to allow group tasks
DROP POLICY IF EXISTS "Users can insert family tasks" ON public.user_tasks;
CREATE POLICY "Users can insert family and group tasks"
ON public.user_tasks FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (SELECT 1 FROM users u1, users u2 WHERE u1.id = auth.uid() AND u2.id = user_tasks.user_id AND u1.family_id = u2.family_id))
  OR (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
);

-- Update UPDATE policy
DROP POLICY IF EXISTS "Users can update family tasks" ON public.user_tasks;
CREATE POLICY "Users can update family and group tasks"
ON public.user_tasks FOR UPDATE
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM users u1, users u2 WHERE u1.id = auth.uid() AND u2.id = user_tasks.user_id AND u1.family_id = u2.family_id))
  OR (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
);

-- Update DELETE policy
DROP POLICY IF EXISTS "Users can delete family tasks" ON public.user_tasks;
CREATE POLICY "Users can delete family and group tasks"
ON public.user_tasks FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid())
  OR (has_role(auth.uid(), 'parent'::app_role) AND EXISTS (SELECT 1 FROM users u1, users u2 WHERE u1.id = auth.uid() AND u2.id = user_tasks.user_id AND u1.family_id = u2.family_id))
  OR (group_id IS NOT NULL AND public.is_group_creator(auth.uid(), group_id))
);

-- ========================================
-- Function to accept friend group invitation (called during signup or manually)
-- ========================================

CREATE OR REPLACE FUNCTION public.accept_friend_group_invitation(p_invitation_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT fgi.id, fgi.group_id, fg.name as group_name
    FROM friend_group_invitations fgi
    JOIN friend_groups fg ON fg.id = fgi.group_id
    WHERE fgi.invitee_email = p_invitation_email
      AND fgi.status = 'pending'
      AND fgi.expires_at > now()
  LOOP
    -- Update member status to active
    UPDATE friend_group_members
    SET user_id = auth.uid(), status = 'active'
    WHERE group_id = inv.group_id AND email = p_invitation_email AND status = 'pending';

    -- Mark invitation as accepted
    UPDATE friend_group_invitations
    SET status = 'accepted'
    WHERE id = inv.id;
  END LOOP;
END;
$$;
