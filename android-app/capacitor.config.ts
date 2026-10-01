import type { CapacitorConfig } from "@capacitor/cli";

// This shell has no UI of its own — it's a WebView pointed at the live
// ElectroField mobile app. All screens, forms and server actions run on
// the real deployment; Capacitor only adds native APIs (background GPS,
// camera, push) on top via plugins.
const config: CapacitorConfig = {
  appId: "com.electrofield.app",
  appName: "ElectroField",
  webDir: "www",
  server: {
    url: "https://electrofield-alporaro.vercel.app/mobil",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    // The background-geolocation plugin's own docs: without this, Android
    // stops delivering location updates to the WebView bridge after ~5
    // minutes in the background, even though the native watcher keeps running.
    useLegacyBridge: true,
  },
  plugins: {
    CapacitorHttp: {
      // Without this, outgoing requests (including the location-reporting
      // server action) are made through the WebView's own networking stack,
      // which Android throttles/delays after a few minutes in the
      // background — the GPS watcher keeps firing, but the pings stop
      // reaching the server. Routing them through native HTTP instead avoids
      // that throttling. It still uses the WebView's session cookies, so
      // login/auth is unaffected.
      enabled: true,
    },
  },
};

export default config;
