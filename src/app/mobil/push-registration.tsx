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
      const perm = await PushNotifications.checkPermissions();
      let granted = perm.receive === "granted";
      if (!granted && perm.receive !== "denied") {
        const req = await PushNotifications.requestPermissions();
        granted = req.receive === "granted";
      }
      if (!granted || cancelled) return;

      await PushNotifications.register();
    }

    const registrationListener = PushNotifications.addListener("registration", (token) => {
      registerPushToken(token.value).catch(() => {});
    });
    const errorListener = PushNotifications.addListener("registrationError", (err) => {
      console.error("PushNotifications registration failed", err);
    });

    setup();

    return () => {
      cancelled = true;
      registrationListener.then((h) => h.remove());
      errorListener.then((h) => h.remove());
    };
  }, []);

  return null;
}
