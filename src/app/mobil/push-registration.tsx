"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken } from "./push-actions";

const PushConfiguration = registerPlugin<{ isReady(): Promise<{ ready: boolean }> }>("PushConfiguration");

export const PUSH_TOKEN_STORAGE_KEY = "ef_push_token";
// Must match PUSH_CHANNEL_ID in src/lib/push.ts (the server names this channel
// in every message so Android shows it as a heads-up alert with sound).
const CHANNEL_ID = "electrofield_alerts";

// Real (system-tray) push notifications only exist inside the native
// Android app — a browser tab has no equivalent, so this is a no-op there.
// Registers for FCM and hands the resulting device token to the server so
// sendPushToProfiles (src/lib/push.ts) can target this device later.
export function PushRegistration() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    async function setup() {
      try {
        // Older APKs have no Firebase configuration or native readiness check.
        // Calling register() in those APKs can throw on the Android bridge thread.
        if (Capacitor.getPlatform() === "android") {
          if (!Capacitor.isPluginAvailable("PushConfiguration")) return;
          const { ready } = await PushConfiguration.isReady();
          if (!ready || cancelled) return;
        }
        if (cancelled) return;
        const perm = await PushNotifications.checkPermissions();
        let granted = perm.receive === "granted";
        if (!granted && perm.receive !== "denied") {
          const req = await PushNotifications.requestPermissions();
          granted = req.receive === "granted";
        }
        if (!granted || cancelled) return;

        // Android 8+: without our own high-importance channel the system uses
        // a default one that never pops up on screen.
        if (Capacitor.getPlatform() === "android") {
          await PushNotifications.createChannel({
            id: CHANNEL_ID,
            name: "Alerte ElectroField",
            description: "Mesaje, cereri de apel și lucrări noi",
            importance: 5,
            visibility: 1,
            vibration: true,
            lights: true,
          }).catch(() => {});
        }

        await PushNotifications.register();
      } catch (err) {
        // Registration throws when Firebase isn't configured yet
        // (google-services.json missing) or on emulators without Google
        // Play Services — push is a nice-to-have, never worth crashing or
        // blocking the rest of the app over.
        console.error("PushNotifications setup failed", err);
      }
    }

    const listeners: ReturnType<typeof PushNotifications.addListener>[] = [];
    try {
      listeners.push(
        PushNotifications.addListener("registration", (token) => {
          try {
            window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token.value);
          } catch {}
          registerPushToken(token.value).catch(() => {});
        }),
        PushNotifications.addListener("registrationError", (err) => {
          console.error("PushNotifications registration failed", err);
        }),
        // Arrived while the app is open: the system doesn't draw it, so refresh
        // the screen's data and let the live bell pick it up.
        PushNotifications.addListener("pushNotificationReceived", () => {
          router.refresh();
        }),
        // The person tapped the notification (app was closed, backgrounded or
        // open): go straight to the thing it is about.
        PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
          const url = event.notification.data?.url;
          if (typeof url === "string" && url.startsWith("/mobil")) router.push(url);
        })
      );
    } catch (err) {
      console.error("PushNotifications addListener failed", err);
    }

    setup();

    return () => {
      cancelled = true;
      for (const l of listeners) l.then((h) => h.remove()).catch(() => {});
    };
  }, [router]);

  return null;
}
