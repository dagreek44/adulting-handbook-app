-- Fix search_path warning
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Outbox processor: drains queue, posts to edge function with backoff
CREATE OR REPLACE FUNCTION public.process_notification_outbox(
  p_function_url TEXT,
  p_auth_token TEXT
) RETURNS TABLE(processed INTEGER, queued INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
  v_remaining INTEGER := 0;
BEGIN
  -- Claim a batch (mark as processing so concurrent runs don't double-send)
  FOR v_row IN
    UPDATE public.notification_outbox o
       SET status = 'processing',
           attempts = o.attempts + 1,
           updated_at = now()
     WHERE o.id IN (
       SELECT id FROM public.notification_outbox
        WHERE status IN ('pending','failed')
          AND next_attempt_at <= now()
          AND attempts < max_attempts
        ORDER BY next_attempt_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
     )
    RETURNING o.id, o.recipient_user_id, o.sender_user_id, o.notification_type,
              o.title, o.body, o.data, o.attempts
  LOOP
    -- Fire-and-forget; the edge function writes to notification_log and
    -- will mark this outbox row as sent/failed via direct update.
    PERFORM net.http_post(
      url := p_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || p_auth_token
      ),
      body := jsonb_build_object(
        'outbox_id', v_row.id,
        'user_ids', jsonb_build_array(v_row.recipient_user_id),
        'sender_user_id', v_row.sender_user_id,
        'notification_type', v_row.notification_type,
        'title', v_row.title,
        'body', v_row.body,
        'data', v_row.data
      )
    );
    v_count := v_count + 1;
  END LOOP;

  -- Reset any rows still 'processing' for >5 minutes back to pending with backoff
  UPDATE public.notification_outbox
     SET status = 'failed',
         next_attempt_at = now() + (interval '1 minute' * power(2, LEAST(attempts,4))),
         last_error = COALESCE(last_error,'') || ' [stuck-processing reset]'
   WHERE status = 'processing'
     AND updated_at < now() - interval '5 minutes';

  SELECT COUNT(*) INTO v_remaining
    FROM public.notification_outbox
   WHERE status IN ('pending','failed') AND attempts < max_attempts;

  RETURN QUERY SELECT v_count, v_remaining;
END;
$$;

-- Helper called by edge function (service role) to mark outbox rows done
CREATE OR REPLACE FUNCTION public.mark_outbox_result(
  p_outbox_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_success THEN
    UPDATE public.notification_outbox
       SET status = 'sent',
           sent_at = now(),
           last_error = NULL
     WHERE id = p_outbox_id;
  ELSE
    UPDATE public.notification_outbox
       SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
           next_attempt_at = now() + (interval '1 minute' * power(2, LEAST(attempts,4))),
           last_error = p_error
     WHERE id = p_outbox_id;
  END IF;
END;
$$;
