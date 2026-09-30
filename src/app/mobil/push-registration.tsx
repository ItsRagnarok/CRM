"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken } from "./push-actions";

// Real (system-tray) push notifications only exist inside the native
// Android app — a browser tab has no equivalent, so this is a no-op there.
// Registers for FCM and hands the resulting device token to the server so
// sendPushToProfiles (src/lib/push.ts) can target this device later.
export function PushRegistration() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    async function setup() {
      try {
        const perm = await PushNotifications.checkPermissions();
        let granted = perm.receive === "granted";
        if (!granted && perm.receive !== "denied") {
          const req = await PushNotifications.requestPermissions();
          granted = req.receive === "granted";
        }
        if (!granted || cancelled) return;

        await PushNotifications.register();
      } catch (err) {
        // Registration throws when Firebase isn't configured yet
        // (google-services.json missing) or on emulators without Google
        // Play Services — push is a nice-to-have, never worth crashing or
        // blocking the rest of the app over.
        console.error("PushNotifications setup failed", err);
      }
    }

    let registrationListener: ReturnType<typeof PushNotifications.addListener> | null = null;
    let errorListener: ReturnType<typeof PushNotifications.addListener> | null = null;
    try {
      registrationListener = PushNotifications.addListener("registration", (token) => {
        registerPushToken(token.value).catch(() => {});
      });
      errorListener = PushNotifications.addListener("registrationError", (err) => {
        console.error("PushNotifications registration failed", err);
      });
    } catch (err) {
      console.error("PushNotifications addListener failed", err);
    }

    setup();

    return () => {
      cancelled = true;
      registrationListener?.then((h) => h.remove()).catch(() => {});
      errorListener?.then((h) => h.remove()).catch(() => {});
    };
  }, []);

  return null;
}
