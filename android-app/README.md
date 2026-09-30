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
  `@capacitor/splash-screen`, `@capacitor-community/background-geolocation`.
  The background-geolocation plugin's own manifest already declares the
  foreground-service + location permissions it needs (see its
  `AndroidManifest.xml`) — nothing extra was added by hand.

## What's NOT done yet (real next steps)

1. **Build tooling**: this container has no Android SDK, so `android/` has
   never actually been compiled. Open `android-app/android/` in Android
   Studio (it'll prompt to install the SDK/build tools) and hit Run to get a
   first working APK on a device/emulator.
2. **Launcher icon & splash screen**: still Capacitor's default template
   assets. Need real ElectroField icons in all the mipmap densities —
   generate from `public/logo-mark.png` with Android Studio's Image Asset
   tool or `npx @capacitor/assets generate`.
3. **Wire the background-geolocation plugin into the actual tracking code**:
   `src/app/mobil/location-tracker.tsx` needs a
   `Capacitor.isNativePlatform()` branch that uses the plugin's watcher API
   instead of the browser one when running inside this shell, falling back
   to the current browser behavior when opened as a plain website. Until
   this is done, installing the plugin alone does nothing — the web code
   doesn't know to call it yet.
4. **Android's background-location permission flow**: Android 10+ shows a
   separate "Allow all the time" location prompt, and Google Play requires a
   declared, reviewed justification for any app requesting it. Budget time
   for that review when publishing, not just for the code.
5. **Signing + Play Store listing**: need a keystore (never commit it — the
   local `.gitignore` here already excludes `*.keystore`/`*.jks`) and a Play
   Console developer account to publish, even for internal testing tracks.
6. **Push notifications** (optional, not started): `@capacitor/push-notifications`
   + Firebase Cloud Messaging, if native alerts for new jobs are wanted
   instead of relying on the app being open.

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
