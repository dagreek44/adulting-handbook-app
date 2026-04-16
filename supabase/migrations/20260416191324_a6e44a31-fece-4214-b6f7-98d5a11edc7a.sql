-- =====================================================================
-- Notification hardening migration
-- =====================================================================

-- 1. notification_log (audit trail)
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id UUID,
  recipient_user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | no_token
  error_message TEXT,
  outbox_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_log_recipient ON public.notification_log(recipient_user_id, created_at DESC);
CREATE INDEX idx_notification_log_sender ON public.notification_log(sender_user_id, created_at DESC);
CREATE INDEX idx_notification_log_status ON public.notification_log(status) WHERE status IN ('pending','failed');

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification log"
  ON public.notification_log FOR SELECT
  TO authenticated
  USING (sender_user_id = auth.uid() OR recipient_user_id = auth.uid());

CREATE POLICY "No client writes to notification_log"
  ON public.notification_log FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny anon access notification_log"
  ON public.notification_log FOR SELECT
  TO anon
  USING (false);

-- 2. notification_outbox (retry queue, server-only)
CREATE TABLE public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL,
  sender_user_id UUID,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | sent | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_outbox_due
  ON public.notification_outbox(next_attempt_at)
  WHERE status IN ('pending','failed');

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Deny ALL client access (only service role / definer functions can touch this)
CREATE POLICY "No client read outbox"
  ON public.notification_outbox FOR SELECT
  USING (false);
CREATE POLICY "No client write outbox"
  ON public.notification_outbox FOR INSERT
  WITH CHECK (false);
CREATE POLICY "No client update outbox"
  ON public.notification_outbox FOR UPDATE
  USING (false);
CREATE POLICY "No client delete outbox"
  ON public.notification_outbox FOR DELETE
  USING (false);

-- 3. enqueue_notification helper (definer to bypass RLS on outbox)
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_recipient_user_id UUID,
  p_sender_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_recipient_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Don't notify yourself
  IF p_recipient_user_id = p_sender_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notification_outbox (
    recipient_user_id, sender_user_id, notification_type, title, body, data
  ) VALUES (
    p_recipient_user_id, p_sender_user_id, p_notification_type, p_title, p_body, COALESCE(p_data, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 4. Trigger: friend group invitation -> notify invitee (if they have an account)
CREATE OR REPLACE FUNCTION public.notify_friend_group_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
  v_group_name TEXT;
  v_inviter_name TEXT;
BEGIN
  SELECT id INTO v_recipient_id FROM auth.users WHERE email = NEW.invitee_email LIMIT 1;
  IF v_recipient_id IS NULL THEN
    RETURN NEW; -- No account yet; email invite handles it
  END IF;

  SELECT name INTO v_group_name FROM friend_groups WHERE id = NEW.group_id;
  SELECT TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
    INTO v_inviter_name FROM users WHERE id = NEW.inviter_id;

  PERFORM public.enqueue_notification(
    v_recipient_id,
    NEW.inviter_id,
    'friend_group_invitation',
    'Group Invitation',
    COALESCE(NULLIF(v_inviter_name,''), 'Someone') || ' invited you to "' || COALESCE(v_group_name,'a group') || '"',
    jsonb_build_object('group_id', NEW.group_id, 'invitation_id', NEW.id, 'action', 'openGroups')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friend_group_invitation
  AFTER INSERT ON public.friend_group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_group_invitation();

-- 5. Trigger: new user_task -> notify recipients
CREATE OR REPLACE FUNCTION public.notify_user_task_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator UUID := auth.uid();
  v_creator_name TEXT;
  v_member RECORD;
  v_task_title TEXT;
BEGIN
  v_task_title := COALESCE(NEW.title, 'a new task');

  SELECT TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
    INTO v_creator_name FROM users WHERE id = v_creator;

  -- Group task: notify all active members except creator
  IF NEW.group_id IS NOT NULL THEN
    FOR v_member IN
      SELECT user_id FROM friend_group_members
      WHERE group_id = NEW.group_id
        AND status = 'active'
        AND user_id IS NOT NULL
        AND user_id <> COALESCE(v_creator, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      PERFORM public.enqueue_notification(
        v_member.user_id,
        v_creator,
        'group_task_created',
        'New Group Task',
        COALESCE(NULLIF(v_creator_name,''),'Someone') || ' added "' || v_task_title || '" to your group',
        jsonb_build_object('taskId', NEW.id, 'group_id', NEW.group_id, 'action', 'openReminder')
      );
    END LOOP;
  -- Family task assigned to someone other than creator
  ELSIF NEW.user_id IS NOT NULL AND NEW.user_id <> COALESCE(v_creator, NEW.user_id) THEN
    PERFORM public.enqueue_notification(
      NEW.user_id,
      v_creator,
      'task_assigned',
      'New Reminder',
      COALESCE(NULLIF(v_creator_name,''),'Someone') || ' assigned you "' || v_task_title || '"',
      jsonb_build_object('taskId', NEW.id, 'action', 'openReminder')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_task_created
  AFTER INSERT ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_task_created();

-- 6. Trigger: task completed by someone other than assignee -> notify assignee
CREATE OR REPLACE FUNCTION public.notify_user_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completer_name TEXT;
  v_member RECORD;
BEGIN
  -- Fire only on transition to completed
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'completed' AND OLD.completed_by IS NOT DISTINCT FROM NEW.completed_by THEN
    RETURN NEW;
  END IF;
  IF NEW.completed_by IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
    INTO v_completer_name FROM users WHERE id = NEW.completed_by;

  -- Notify the original assignee if different from completer
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> NEW.completed_by THEN
    PERFORM public.enqueue_notification(
      NEW.user_id,
      NEW.completed_by,
      'task_completed',
      'Task Completed',
      COALESCE(NULLIF(v_completer_name,''),'Someone') || ' completed "' || COALESCE(NEW.title,'your task') || '"',
      jsonb_build_object('taskId', NEW.id, 'action', 'openReminder')
    );
  END IF;

  -- For group tasks, also notify other group members
  IF NEW.group_id IS NOT NULL THEN
    FOR v_member IN
      SELECT user_id FROM friend_group_members
      WHERE group_id = NEW.group_id
        AND status = 'active'
        AND user_id IS NOT NULL
        AND user_id <> NEW.completed_by
        AND user_id <> COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      PERFORM public.enqueue_notification(
        v_member.user_id,
        NEW.completed_by,
        'group_task_completed',
        'Group Task Done',
        COALESCE(NULLIF(v_completer_name,''),'Someone') || ' completed "' || COALESCE(NEW.title,'a group task') || '"',
        jsonb_build_object('taskId', NEW.id, 'group_id', NEW.group_id, 'action', 'openReminder')
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_task_completed
  AFTER UPDATE ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_task_completed();

-- 7. updated_at trigger for outbox
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_outbox_touch
  BEFORE UPDATE ON public.notification_outbox
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
