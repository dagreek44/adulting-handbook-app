
## Diagnosis

The only Android build error captured so far is:

```
:capacitor-android:compileDebugJavaWithJavac
> error: invalid source release: 21
```

This is **not** a bug in your TypeScript/React code — it's a JDK mismatch. Capacitor 7 (you're on `@capacitor/android@^7.4.3`) requires **JDK 21** to compile its Android module. Android Studio is currently using an older embedded JDK (likely 17), so the compiler refuses `sourceCompatibility = 21`.

Everything generated under `android/` lives on your local machine (it isn't in the repo), so the fix has to be applied there. Nothing in the web codebase is broken from a Gradle perspective.

## Fix plan

### 1. Point Android Studio at JDK 21

In Android Studio:
- **Settings → Build, Execution, Deployment → Build Tools → Gradle**
- Set **Gradle JDK** to a **JDK 21** entry. If none is listed, click the dropdown → **Download JDK…** → Vendor: *Eclipse Temurin 21* (or *Oracle OpenJDK 21*) → Download.
- Click **Apply**, then **File → Sync Project with Gradle Files**.

For command-line builds (`npx cap run android`), also set:
```bash
export JAVA_HOME=/path/to/jdk-21        # macOS/Linux
# or on Windows: setx JAVA_HOME "C:\Program Files\Java\jdk-21"
```

### 2. Clean and rebuild

From the project root:
```bash
cd android
./gradlew clean
cd ..
npm run build
npx cap sync android
npx cap run android
```

### 3. If errors remain, share the new log

The "series of errors" you mention this round wasn't included in the message. After applying the JDK 21 fix, if the build still fails, paste the new Gradle output (especially the first `FAILURE:` block and the `> Task :…` line above it). Common follow-on issues at this stage are:
- Missing `google-services.json` in `android/app/` (needed for FCM push) — symptom: `File google-services.json is missing`.
- Stale `node_modules` after the recent refactor — fix with `rm -rf node_modules && npm install` then `npx cap sync android`.
- Android SDK 34/35 not installed — Android Studio will offer to install it via the SDK Manager link in the error.

## Why no code changes are needed

The recent refactor removed unused TS/React files but did not touch any native Android sources, Gradle files, or the Capacitor config. The Capacitor 7 → JDK 21 requirement has been in place since you upgraded Capacitor; the previous successful builds were on a different machine/JDK setup.

## Files to change

None in this repo. All changes are local IDE/JDK configuration on your build machine.

<lov-actions>
<lov-link url="https://capacitorjs.com/docs/main/updating/7-0#update-your-environment">Capacitor 7 environment requirements</lov-link>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>
