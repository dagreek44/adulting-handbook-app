

## Diagnosis

The Android APK reports `"Notifications: web (no push)"` and never registers a device token because `src/utils/capacitorUtils.ts` uses CommonJS `require('@capacitor/core')` inside a Vite-built ES module bundle. `require` does not exist in the WebView at runtime, every call throws, the `try/catch` swallows the error, and the helpers fall back to `'web'` / `false`. The downstream effect:

- `NotificationStatus` shows the web fallback message.
- `DeviceTokenService.isPushAvailable()` returns `false` immediately, so `PushNotifications.register()` is never called.
- `device_tokens` stays empty.
- `waitForCapacitor()` always times out and resolves `false` even on the device.

The native side (Gradle, `google-services.json`, FCM project, permissions) is almost certainly fine — we just never reach it.

## Fix

Single-file change: replace the dynamic `require()` calls in `src/utils/capacitorUtils.ts` with a static ESM import.

### `src/utils/capacitorUtils.ts`

- Add `import { Capacitor } from '@capacitor/core';` at the top.
- `isNativePlatform()` → return `Capacitor.isNativePlatform()` directly (sync, no try/catch needed beyond a defensive guard).
- `getPlatform()` → return `Capacitor.getPlatform()` directly.
- `waitForCapacitor()` → simplify to: if `Capacitor.isNativePlatform()` is true, resolve immediately; otherwise resolve `false`. The polling loop was only needed because of the `require` failure — Capacitor 7's bridge is ready before the JS bundle executes.
- Remove the cached `cachedIsNative` / `cachedPlatform` module variables (no longer needed, and they masked the bug across HMR reloads in dev).

No other files need code changes. `DeviceTokenService`, `App.tsx`, and `NotificationStatus` will start working as designed once the helpers return correct values.

## Verification steps after the fix

1. `npm run build && npx cap sync android`
2. Rebuild and reinstall the APK from Android Studio.
3. Open the app, log in, look at the Notifications panel on the dashboard. Expected new state:
   - Platform: `android`
   - Permission: `granted` (Android will prompt on first launch on Android 13+)
   - Token: `registered`
4. Confirm with a query: `SELECT user_id, device_platform, created_at FROM device_tokens ORDER BY created_at DESC LIMIT 5;` — your row should appear.

If after the rebuild the panel shows Platform: `android` but Token: `missing` with a `Last error: Registration error: …`, that's a *real* FCM problem (mismatched `google-services.json`, missing SHA-1, or wrong `FIREBASE_SERVICE_ACCOUNT` secret) and we'll debug from the error message. But the symptoms you're seeing right now are 100% the `require` bug.

## Files to change

- `src/utils/capacitorUtils.ts` — switch to static ESM import, simplify helpers.

## What I will not touch

- `DeviceTokenService.ts`, `App.tsx`, `NotificationStatus.tsx` — they're correct; they just need truthful answers from the utils module.
- `capacitor.config.ts`, `android/`, edge functions, DB.

