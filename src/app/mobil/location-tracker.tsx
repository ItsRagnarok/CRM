"use client";

import { useEffect, useRef } from "react";
import { pingLocation } from "./location-actions";

const MIN_INTERVAL_MS = 30_000;

// Reports the technician's live position while this tab is open and visible,
// so admins can see crews on the map in real time. This is a best-effort,
// web-only mechanism: a browser tab that's fully closed or a phone that's
// locked for a long time will stop reporting — there's no way to guarantee
// background GPS from a web app without wrapping it as a native app.
export function LocationTracker({ enabled }: { enabled: boolean }) {
  const lastSentRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    function send(pos: GeolocationPosition) {
      const now = Date.now();
      if (now - lastSentRef.current < MIN_INTERVAL_MS) return;
      lastSentRef.current = now;
      pingLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null).catch(() => {});
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
