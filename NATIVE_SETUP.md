# Native Mobile App Setup Guide

This guide walks you through building the Adulting Handbook app for Android and iOS.

## Prerequisites

- Node.js 18+ installed
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- Firebase project with Cloud Messaging enabled

---

## Android Setup

### Step 1: Build and Add Platform

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Add Android platform
npx cap add android

# Sync web assets to native project
npx cap sync android
```

### Step 2: Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add an Android app with package name: `app.lovable.d8e8851b93de422897c29d6fb1ca824e`
4. Download `google-services.json`
5. Copy it to `android/app/google-services.json`

### Step 3: Verify Gradle Configuration

After running `npx cap sync android`, verify these files:

**`android/build.gradle`** should contain:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**`android/app/build.gradle`** should contain at the bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

> ⚠️ If these are missing, add them manually. Capacitor should auto-configure this, but sometimes it doesn't.

### Step 4: Android 13+ Permissions

For Android 13 (API 33) and above, notification permissions are requested at runtime. The app handles this automatically, but ensure your `android/app/src/main/AndroidManifest.xml` includes:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### Step 5: Build and Run

```bash
# Open in Android Studio
npx cap open android

# Or run directly (requires connected device/emulator)
npx cap run android
```

---

## iOS Setup

### Step 1: Build and Add Platform

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Add iOS platform
npx cap add ios

# Sync web assets to native project
npx cap sync ios
```

### Step 2: Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Add an iOS app with bundle ID: `app.lovable.d8e8851b93de422897c29d6fb1ca824e`
3. Download `GoogleService-Info.plist`
4. Copy it to `ios/App/App/GoogleService-Info.plist`

### Step 3: Enable Push Notifications in Xcode

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the App target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "Push Notifications"
5. Add "Background Modes" and enable "Remote notifications"

### Step 4: Apple Push Notification Service (APNs)

1. In Apple Developer Portal, create an APNs key
2. Upload the key to Firebase Console → Project Settings → Cloud Messaging → iOS app

### Step 5: Build and Run

```bash
# Open in Xcode
npx cap open ios

# Or run directly
npx cap run ios
```

---

## Troubleshooting

### App Crashes on Launch (Emulator)

1. **Check Android Studio Logcat for actual error**:
   - Open Android Studio → View → Tool Windows → Logcat
   - Filter by your app package or "crash" or "fatal"
   - Look for the actual exception/stack trace

2. **Version mismatch**: Ensure ALL `@capacitor/*` packages are version 7.x
   ```bash
   npm ls @capacitor/core @capacitor/push-notifications @capacitor/ios @capacitor/android
   ```
   All should show `7.x.x`. If any is `8.x`, run:
   ```bash
   npm install @capacitor/push-notifications@7
   ```

3. **Missing Firebase config**: The app will still work without Firebase, but if `google-services.json` is missing AND the Gradle plugin is configured, it will crash.
   
   **Option A**: Add the Firebase config file (see Step 2 above)
   
   **Option B**: Remove Firebase dependency temporarily for testing:
   - Comment out `apply plugin: 'com.google.gms.google-services'` in `android/app/build.gradle`
   - Re-sync: `npx cap sync android`

4. **Emulator lacks Google Play Services**: Push notifications require Google Play Services. Use a Google Play emulator image (not the basic one).

5. **Fresh start** (nuclear option):
   ```bash
   rm -rf android node_modules
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   ```

### Push Notifications Not Working

1. **Physical device required**: Push notifications don't work reliably on emulators
2. **Permission denied**: Check app permissions in device settings
3. **Firebase not configured**: Verify Firebase project setup and config files
4. **No token registered**: Check Logcat for "DeviceTokenService" logs

### Build Errors

```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx cap sync android
```

### Debugging with Logcat

To see what's happening in the app:
```bash
# Run with live logs
npx cap run android -l
```
Or in Android Studio, open Logcat and filter by package name.

---

## Development Workflow

After making code changes in Lovable:

```bash
# Pull latest changes
git pull

# Rebuild and sync
npm run build
npx cap sync android  # or ios

# Run the app
npx cap run android   # or ios
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npx cap sync` | Sync web build to native platforms |
| `npx cap update` | Update native plugins |
| `npx cap doctor` | Check for common issues |
| `npx cap open android` | Open in Android Studio |
| `npx cap open ios` | Open in Xcode |

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Lovable Native App Guide](https://docs.lovable.dev/features/mobile-development)
