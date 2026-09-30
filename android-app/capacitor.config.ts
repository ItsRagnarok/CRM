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
  },
};

export default config;
