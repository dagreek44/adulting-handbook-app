

## Diagnosis

Two separate problems, both visible in the console logs you shared:

### 1. `permission denied for table users` (42501) on every login
The recent security migration added a tighter `SELECT` policy on `family_invitations` ("Inviter and invitee can view invitations") but **did not drop the old policy** ("Users can view invitations for their family"). The old policy contains `family_id IN (SELECT family_id FROM public.users WHERE id = auth.uid())`. Because the security pass also revoked the authenticated role's privileges on `public.users`, that subquery now throws 42501 — and Postgres surfaces the error even though the new policy alone would have allowed the row.

This is also why `acceptPendingInvitations` never finds an invitation: the very first query bails out with the permission error.

### 2. No device token registers
The console shows:
```
DeviceTokenService: Capacitor ready: false
DeviceTokenService: Capacitor not ready — push notifications will not register this session
```
You're testing in the **web preview**, not in the rebuilt APK. `waitForCapacitor` correctly returns `false` on web, so registration is skipped — that's expected behavior in the browser. We have no on-device log evidence yet to confirm the APK is or isn't registering.

To get visibility on-device we need the `NotificationStatus` diagnostics widget actually mounted somewhere visible (right now the file exists but isn't shown on the dashboard).

## Fix plan

### A. Drop the legacy invitations policy (DB migration)
```sql
DROP POLICY IF EXISTS "Users can view invitations for their family"
  ON public.family_invitations;
```
The replacement policy "Inviter and invitee can view invitations" already covers both roles correctly without touching `public.users`. After this, `acceptPendingInvitations` will succeed and the 42501 spam will stop.

### B. Mount `NotificationStatus` on the dashboard
Add the existing `NotificationStatus` component to the top of `src/pages/Index.tsx` (above the dashboard cards) so that on the APK you'll instantly see:
- Platform (android / ios / web)
- Permission status
- Token registered: yes/no
- Last error if registration failed

This is the only way to know whether the APK is hitting permission denial, plugin unavailability, or an FCM-side `registrationError`.

### C. Increase Capacitor wait timeout slightly
`DeviceTokenService.initialize` waits 2000ms for Capacitor; on cold start of a freshly installed APK on Android this can occasionally take longer. Bump to 5000ms to remove that as a variable. (`App.tsx` already waits 3000ms before calling initialize, so end-to-end budget becomes ~8s which is fine.)

### D. Confirm on device, then iterate
Reinstall the APK, log in, open the dashboard, and tell me what the Notifications panel shows. Three likely outcomes and what each means:
- **"Permission: denied"** → Android 13+ POST_NOTIFICATIONS was rejected; user must grant in Settings.
- **"Token: missing" + Last error: Registration error: …** → FCM-side issue (mismatched `google-services.json`, SHA-1 not added, or `FIREBASE_SERVICE_ACCOUNT` secret belongs to a different Firebase project).
- **"Token: registered"** → Registration works; problem is then on the *send* side (`process-notification-outbox` cron / `send-push-notification` edge function), and we'll debug from there.

## Files to change

- **DB migration** — drop the stale `family_invitations` SELECT policy.
- `src/pages/Index.tsx` — render `<NotificationStatus />` at the top of the page (only for authenticated users).
- `src/services/DeviceTokenService.ts` — change `waitForCapacitor(2000)` → `waitForCapacitor(5000)`.

## What I will not touch

- `android/` (you've rebuilt it).
- `google-services.json` / `GoogleService-Info.plist` (you've placed them).
- `capacitor.config.ts`, edge functions, cron schedule — until on-device diagnostics tell us where it's actually failing.

