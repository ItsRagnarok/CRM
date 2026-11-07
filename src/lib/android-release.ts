// Single source of truth for the downloadable Android app version shown on
// the login page. Keep it equal to `versionName` in
// android-app/android/app/build.gradle — `npm run check:android` fails if
// they drift. Bump both (and versionCode) on every APK release; see the
// "Release checklist" in android-app/README.md.
export const ANDROID_APP_VERSION = "0.2";
export const ANDROID_APK_URL = `/downloads/electrofield.apk?v=${ANDROID_APP_VERSION}`;
