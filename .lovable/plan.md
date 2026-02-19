

# Fix Push Notifications Not Arriving on Devices

## Critical Finding: Firebase Console Test Messages Don't Arrive Either

If a test message sent **directly from the Firebase Console** to a device token doesn't show up on the device, the problem is on the **native Android app side**, not the server. This narrows the root cause to one or more of these:

1. **Missing or misconfigured notification channel** -- Android 8+ (API 26+) requires a notification channel to display notifications. Without one, messages are silently dropped.
2. **Stale/expired FCM tokens** -- Matt's token is already confirmed `UNREGISTERED`. But even Sylvie's token (last updated Jan 14) could be stale after 5+ weeks.
3. **Missing `google-services.json` or Gradle config** -- If the Firebase SDK isn't properly linked, the device won't process incoming FCM messages.
4. **App not creating a default notification channel** -- Capacitor Push Notifications plugin requires a default channel on Android.

---

## Implementation Plan

### Step 1: Add Android Notification Channel Configuration

Update `capacitor.config.ts` to include the `PushNotifications` plugin config with a default notification channel. Android 8+ silently drops notifications without a registered channel.

**File:** `capacitor.config.ts`
- Add `PushNotifications` plugin config with `presentationOptions` and a default channel definition.

### Step 2: Create a Notification Channel on App Startup (Android)

Update `DeviceTokenService.ts` to explicitly create a notification channel when initializing on Android. This ensures the channel exists before any FCM message arrives.

**File:** `src/services/DeviceTokenService.ts`
- After `PushNotifications.register()`, call `PushNotifications.createChannel()` with channel ID `default`, name `Default`, importance `5` (high), and sound `default`.

### Step 3: Force Token Refresh on Every App Open

Both tokens in the database are 5+ weeks old. Tokens expire and rotate. The current code skips re-registration if `isInitialized` is true (static flag that persists per app session). We need to:

**File:** `src/services/DeviceTokenService.ts`
- Remove the `isInitialized` early-return guard so that `PushNotifications.register()` is called every time the app opens, ensuring a fresh token is always saved to the database.

### Step 4: Add Stale Token Cleanup to send-push-notification

When FCM returns `UNREGISTERED` (404) or `NOT_FOUND`, delete the stale token from `device_tokens` so we stop sending to dead tokens.

**File:** `supabase/functions/send-push-notification/index.ts`
- After a failed `sendFCMNotification`, parse the error. If it contains `UNREGISTERED` or `NOT_FOUND`, delete that `fcm_token` from `device_tokens`.

### Step 5: Create check-due-reminders Edge Function

A new edge function that queries `user_tasks` for tasks due today (and tasks due in 7 days for medium/hard tasks), then calls `send-push-notification` for each user.

**File:** `supabase/functions/check-due-reminders/index.ts` (new)
- Query `user_tasks` where `due_date = CURRENT_DATE` and `status = 'pending'` and `enabled = true`
- Query `user_tasks` where `due_date = CURRENT_DATE + 7` and `difficulty IN ('Medium','Hard')` and `status = 'pending'`
- Group results by `user_id`
- Call `send-push-notification` for each user group

**File:** `supabase/config.toml`
- Add `[functions.check-due-reminders]` with `verify_jwt = false`

### Step 6: Schedule Daily Cron Job

Use `pg_cron` + `pg_net` to call `check-due-reminders` daily at 8 AM EST (1 PM UTC).

**Via SQL insert (not migration, contains project-specific data):**
- Enable `pg_cron` and `pg_net` extensions
- Schedule: `0 13 * * *` (1 PM UTC = 8 AM EST)
- Calls the `check-due-reminders` edge function URL with the anon key

### Step 7: Schedule Local Notifications as Backup

Update `ReminderContext.tsx` to call `NotificationService.scheduleAllTaskNotifications()` after tasks load, so local notifications are also set as a fallback on-device.

**File:** `src/contexts/ReminderContext.tsx`
- In the `loadData` effect, after tasks are loaded and formatted, call `scheduleAllTaskNotifications` with the user's tasks.

---

## What You Need To Do After Implementation

1. **Rebuild the native app** -- After these changes, you must run:
   ```text
   npm run build
   npx cap sync android
   npx cap run android
   ```
2. **Verify `google-services.json`** is present at `android/app/google-services.json`
3. **Verify `android/app/build.gradle`** has `apply plugin: 'com.google.gms.google-services'` at the bottom
4. **Have both Matt and Sylvie open the app** so fresh tokens are registered
5. **Send a test from Firebase Console** using the new token (not the old one) to verify delivery

---

## Technical Summary of File Changes

| File | Action | Purpose |
|------|--------|---------|
| `capacitor.config.ts` | Update | Add PushNotifications channel config |
| `src/services/DeviceTokenService.ts` | Update | Create notification channel, force token refresh every launch |
| `supabase/functions/send-push-notification/index.ts` | Update | Delete stale UNREGISTERED tokens |
| `supabase/functions/check-due-reminders/index.ts` | Create | Daily cron function for due-today notifications |
| `supabase/config.toml` | Update | Register check-due-reminders function |
| `src/contexts/ReminderContext.tsx` | Update | Call scheduleAllTaskNotifications on load |
| Database (SQL insert) | Execute | pg_cron job for daily 8 AM trigger |

