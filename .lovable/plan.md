

## Diagnosis

Sylvie's notifications are silently failing because **no FCM token is registered for her account**. Investigation revealed:

- `device_tokens` table is completely empty for her user (`54768e7e-…b6c0`) — and actually empty for everyone.
- `notification_outbox` and `notification_log` have zero rows for her.
- The `process-notification-outbox` pg_cron job is **not scheduled** (the SQL from the hardening step was never executed in the dashboard).
- Earlier network log confirms it: `send-push-notification` returned `"sent":0,"message":"No device tokens found"` when Matt assigned her a reminder.

So two independent things are broken: (a) her device never persists a token, and (b) even if it did, the outbox-driven path has no cron worker pushing rows to the edge function.

## Plan

### 1. Fix token registration on her device (code + rebuild)

Harden `DeviceTokenService.ts` so we can actually see why registration fails on Android, and so it self-recovers:

- Surface `registrationError` payloads with full detail (currently logs but doesn't persist) — write the error to a lightweight `device_token_errors` audit (or just `console.error` with structured fields if we don't want a new table).
- Add a `force=true` re-register path that runs every cold start *after* `getSession()` resolves (already partially done, but currently bails silently when push isn't available — add a visible warning).
- Confirm Android 13+ POST_NOTIFICATIONS permission is requested explicitly via `PushNotifications.requestPermissions()` (Capacitor handles this, but we'll log the resolved status).
- After this code change, **she must reinstall the APK** — the previous build has the pre-fix race condition.

### 2. Schedule the missing cron job (one SQL statement)

The hardening migration created `process_notification_outbox()` but never scheduled it. We'll re-run the cron schedule SQL (the same block the AI gave earlier). Without this, even if her token registers, queued notifications never leave the outbox.

```sql
SELECT cron.schedule(
  'process-notification-outbox',
  '* * * * *',
  $cmd$ SELECT public.process_notification_outbox(
    'https://dgwzmfgcuxtsrvcvahat.supabase.co/functions/v1/send-push-notification',
    '<anon key>'
  ); $cmd$
);
```

### 3. Add a tiny in-app diagnostics surface (optional but recommended)

Add a "Notifications status" line on the Profile/Settings area showing:
- Permission granted: yes/no
- Token registered: yes/no (queries `device_tokens` for current user)
- Last registration error (if any)

This way Sylvie (and you) can confirm at a glance whether the device successfully registered, instead of guessing.

### 4. Verify end-to-end after rebuild

After she installs the new APK and signs in:
- Check `select * from device_tokens where user_id = '54768e7e-…b6c0'` → should have one row.
- Have Matt assign her a reminder → check `notification_outbox` (row appears) → cron flushes within 60s → `notification_log` row with `status='sent'` → device shows banner.

## Files to change

- `src/services/DeviceTokenService.ts` — better error surfacing, explicit permission logging.
- `src/components/Header.tsx` or a new `NotificationStatus.tsx` — small diagnostics widget (optional based on your answer below).
- One DB action (insert tool) to schedule the cron job.

## Questions before implementing

- **Diagnostics widget**: Add the in-app "Notifications status" indicator, or skip it and just rely on the DB query?
- **Old tokens**: Once registration works, should we also add a periodic cleanup of `device_tokens` rows older than 60 days with no recent `updated_at`?

