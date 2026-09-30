"use client";

import { useEffect, useRef } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { pingLocation } from "./location-actions";

// This plugin ships no bundled JS (native-only, no web fallback) — it must
// be registered via Capacitor's proxy rather than imported as a value, or
// webpack fails to resolve it at build time even though it's never called
// outside the isNativePlatform() branch below.
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

const MIN_INTERVAL_MS = 30_000;

// Reports the technician's live position so admins can see crews on the map
// in real time. Two entirely different mechanisms depending on where this
// runs:
//
// - Inside the Android app (Capacitor): a native foreground service via
//   @capacitor-community/background-geolocation keeps reporting position
//   with the screen off or the app backgrounded — the whole reason that
//   shell exists.
// - In a plain mobile browser tab: falls back to watchPosition, which the
//   OS suspends once the tab is hidden/screen locks. Best-effort only —
//   there's no way to guarantee background GPS from a browser tab.
export function LocationTracker({ enabled }: { enabled: boolean }) {
  const lastSentRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const nativeWatcherIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function sendIfDue(lat: number, lng: number, accuracy: number | null) {
      const now = Date.now();
      if (now - lastSentRef.current < MIN_INTERVAL_MS) return;
      lastSentRef.current = now;
      pingLocation(lat, lng, accuracy).catch(() => {});
    }

    if (Capacitor.isNativePlatform()) {
      let cancelled = false;

      // Never let a native plugin failure (missing Google Play Services on
      // an emulator, a denied permission, anything) take the whole app
      // down — GPS is important but not worth crashing over.
      try {
        BackgroundGeolocation.addWatcher(
          {
            backgroundTitle: "ElectroField urmărește locația",
            backgroundMessage: "Se trimite poziția către dispecerat cât timp lucrarea e activă.",
            requestPermissions: true,
            stale: false,
            distanceFilter: 25,
          },
          (location, error) => {
            if (error) {
              // "not authorized" fires if the user denies the background
              // permission — nothing to recover from here besides letting
              // them retry from Setări; the admin-facing map already
              // handles a technician with no recent position gracefully.
              console.error("BackgroundGeolocation error", error);
              return;
            }
            if (location) sendIfDue(location.latitude, location.longitude, location.accuracy ?? null);
          }
        )
          .then((id) => {
            if (cancelled) {
              BackgroundGeolocation.removeWatcher({ id }).catch(() => {});
            } else {
              nativeWatcherIdRef.current = id;
            }
          })
          .catch((err) => console.error("BackgroundGeolocation.addWatcher failed", err));
      } catch (err) {
        console.error("BackgroundGeolocation setup failed", err);
      }

      return () => {
        cancelled = true;
        const id = nativeWatcherIdRef.current;
        if (id) BackgroundGeolocation.removeWatcher({ id }).catch(() => {});
        nativeWatcherIdRef.current = null;
      };
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    function send(pos: GeolocationPosition) {
      sendIfDue(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null);
    }

    function start() {
      if (watchIdRef.current != null) return;
      watchIdRef.current = navigator.geolocation.watchPosition(send, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 15_000,
      });
    }

    function stop() {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        // Force a fresh ping right away when the technician comes back to the
        // app after it's been backgrounded — otherwise the admin map would
        // show a stale dot for however long they were away.
        lastSentRef.current = 0;
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stop();
    };
  }, [enabled]);

  return null;
}
