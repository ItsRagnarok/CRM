# ElectroField — Android shell (Capacitor)

This is a native Android wrapper around the live ElectroField mobile app
(`https://electrofield-alporaro.vercel.app/mobil`). It does **not** contain a
copy of the UI — `capacitor.config.ts` points the WebView at the real
deployment, so every screen, form and server action is the same code as the
web app. Capacitor only adds native device APIs on top, via plugins.

## Why this exists

The web app's live GPS tracking (`src/app/mobil/location-tracker.tsx`) uses
`navigator.geolocation.watchPosition`, which browsers suspend once the screen
locks or the tab is backgrounded — acceptable for a website, not for tracking
a technician who's driving with the phone in a pocket. Wrapping the app in
Capacitor lets us add `@capacitor-community/background-geolocation`, which
runs a real Android foreground service and keeps reporting position with the
screen off.

## What's already set up

- `capacitor.config.ts` — app id `com.electrofield.app`, remote `server.url`
  pointing at the production `/mobil` app.
- `android/` — generated native project (Gradle/Kotlin), via `npx cap add android`.
- Plugins installed: `@capacitor/geolocation`, `@capacitor/app`,
  `@capacitor/splash-screen`, `@capacitor-community/background-geolocation`,
  `@capacitor/push-notifications`.
- **GPS wired end-to-end**: `src/app/mobil/location-tracker.tsx` (in the main
  web app, not here) branches on `Capacitor.isNativePlatform()` — inside this
  shell it uses the background-geolocation plugin's native foreground
  service; opened as a plain website it falls back to
  `navigator.geolocation.watchPosition` exactly as before. Same
  `pingLocation` server call either way, so the admin map needs no changes.
- **Push notifications wired end-to-end, pending your Firebase project**:
  `src/app/mobil/push-registration.tsx` registers the device for FCM and
  saves its token (`device_push_tokens` table); `src/lib/push.ts` sends real
  pushes via the FCM HTTP v1 API (no SDK, a signed service-account JWT +
  fetch, same pattern as the Groq integration) and is already called
  wherever the app creates an in-app notification (job started → admins,
  call requested → team). The one missing piece is your own Firebase
  project — see below.

## Push notifications: the one thing only you can set up

Real (system-tray, works with the app killed) notifications need a Firebase
project — there's no way around creating one yourself, same as the
`GROQ_API_KEY` step earlier:

1. Go to [Firebase Console](https://console.firebase.google.com/) → create a
   project (any name).
2. Add an Android app to it with package name **`com.electrofield.app`**
   (must match `capacitor.config.ts` exactly). Download the generated
   **`google-services.json`** and place it at
   `android-app/android/app/google-services.json` (already gitignored — a
   real key file, never commit it).
3. Project settings → Service accounts → "Generate new private key" →
   downloads a JSON file. From it, add **three** env vars in Vercel
   (Production), same place as `GROQ_API_KEY`:
   - `FIREBASE_PROJECT_ID` — the `project_id` field
   - `FIREBASE_CLIENT_EMAIL` — the `client_email` field
   - `FIREBASE_PRIVATE_KEY` — the `private_key` field, pasted as-is
     (including the `\n` escapes and `-----BEGIN/END PRIVATE KEY-----` lines;
     `src/lib/push.ts` un-escapes it at runtime)
4. Redeploy. Without these three vars, `sendPushToProfiles` silently no-ops
   (logged, never blocks the action that triggered it) — everything else in
   the app keeps working exactly as before.
5. The Android build itself doesn't need step 3 at all, only step 2's
   `google-services.json` — Capacitor's Gradle template already skips
   applying the Firebase plugin if that file is missing, so the app still
   builds and runs (just without push) until you add it.

## What's NOT done yet (real next steps)

1. **Build tooling**: this container has no Android SDK, so `android/` has
   never actually been compiled. Open `android-app/android/` in Android
   Studio (it'll prompt to install the SDK/build tools) and hit Run to get a
   first working APK on a device/emulator.
2. **Launcher icon & splash screen**: still Capacitor's default template
   assets. Need real ElectroField icons in all the mipmap densities —
   generate from `public/logo-mark.png` with Android Studio's Image Asset
   tool or `npx @capacitor/assets generate`.
3. **Android's background-location permission flow**: Android 10+ shows a
   separate "Allow all the time" location prompt, and Google Play requires a
   declared, reviewed justification for any app requesting it. Budget time
   for that review when publishing, not just for the code.
4. **Signing + Play Store listing**: need a keystore (never commit it — the
   local `.gitignore` here already excludes `*.keystore`/`*.jks`) and a Play
   Console developer account to publish, even for internal testing tracks.
5. **Push notification icon**: Android will fall back to the app icon
   (usually shows as an ugly white square/circle) until a dedicated white-on-
   transparent icon is added — see the plugin's own README section on this.

## Local development

```bash
cd android-app
npm install
npx cap sync android   # re-run after changing capacitor.config.ts or plugins
npx cap open android   # opens Android Studio
```

The remote URL in `capacitor.config.ts` currently points at production. For
testing against a local `next dev` server instead, point it at your machine's
LAN IP (e.g. `http://192.168.1.x:3000/mobil`) — `localhost` won't resolve
from inside the Android emulator/device.
