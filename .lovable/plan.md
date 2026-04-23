

## Combined diagnosis

Comparing Gemini's checklist against your actual code:

| Gemini's recommendation | Status in your code |
|---|---|
| 1. Runtime permission request | **Already implemented** in `DeviceTokenService.initialize` (lines checking `checkPermissions` then `requestPermissions`). |
| 2. Notification channels (Android 8+) | **Already implemented** — `createDefaultChannel()` runs before `register()` with id `default`, importance 5. |
| 3. Small icon (`ic_stat_icon`) | Referenced in `capacitor.config.ts` for **LocalNotifications only**, not push. If the drawable is missing, Android falls back to the app icon — annoying (white square) but **not a reason no token registers**. Worth fixing later for polish. |
| 4. FCM token registration listener | **Already implemented** — `addListener('registration', ...)` and `registrationError` are wired up in `setupListeners()`. |

So Gemini's list is correct in general but **none of those items explain your specific symptom**. Your symptom is "Platform: web (no push)" *on the actual Android device*. That can only happen if `Capacitor.isNativePlatform()` is never reached — and it isn't, because `src/utils/capacitorUtils.ts` calls `require('@capacitor/core')` inside an ES module bundle. `require` is undefined in the WebView, every call throws, the `try/catch` swallows it, and we cache `'web'` / `false` forever. Permission requests, channels, and listeners are all downstream of that check, so none of them ever run on device.

Fixing the `require` bug unblocks all four of Gemini's items simultaneously, because the code that implements them already exists and is gated behind `isNativePlatform()`.

## Fix (single file)

### `src/utils/capacitorUtils.ts`
- Replace `require('@capacitor/core')` with a static ESM import: `import { Capacitor } from '@capacitor/core';`.
- `isNativePlatform()` → return `Capacitor.isNativePlatform()` directly.
- `getPlatform()` → return `Capacitor.getPlatform()` directly.
- `waitForCapacitor()` → simplify: if `Capacitor.isNativePlatform()` is true, resolve `true` immediately; otherwise resolve `false`. The polling loop only existed to retry the failing `require`.
- Drop the module-level `cachedIsNative` / `cachedPlatform` (no longer needed; `Capacitor` is a synchronous singleton once the bundle loads, which is always after the bridge is ready in a Capacitor WebView).
- Keep `safeNativeCall` as-is.

No other source files need changes. `DeviceTokenService`, `NotificationStatus`, and `App.tsx` will start behaving correctly the moment `isNativePlatform()` returns the truth.

## Optional polish (defer unless you want it now)

- **Small icon**: add a transparent white `ic_stat_icon.png` to `android/app/src/main/res/drawable-*` folders so push notifications don't show as a white square. Cosmetic, not required for tokens to register.

## Verification after rebuild

1. `npm run build && npx cap sync android`
2. Rebuild + reinstall the APK from Android Studio.
3. On first launch, Android 13+ will prompt for notification permission — accept.
4. Open the dashboard. The Notifications panel should now read:
   - Platform: `android`
   - Permission: `granted`
   - Token: `registered`
5. Confirm in DB: a row appears in `device_tokens` for your user.

If after the rebuild Platform shows `android` but Token still shows `missing`, the panel will display the FCM `Last error` (mismatched `google-services.json`, missing SHA-1 in Firebase, or wrong `FIREBASE_SERVICE_ACCOUNT` secret) and we'll act on that specific message.

## Files to change

- `src/utils/capacitorUtils.ts`

## Files explicitly NOT changing

- `src/services/DeviceTokenService.ts` — permission flow, channel creation, listeners are already correct.
- `src/App.tsx`, `src/components/NotificationStatus.tsx`, `src/pages/Index.tsx` — wiring is correct.
- `capacitor.config.ts`, `android/`, edge functions, DB.

