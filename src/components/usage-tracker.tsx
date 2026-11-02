"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function UsageTracker({ channel }: { channel: "web" | "mobile" }) {
  const pathname = usePathname();
  useEffect(() => {
    const sessionId = crypto.randomUUID();
    let lastInput = Date.now();
    let activeMs = 0;
    let tick = performance.now();
    let lastSent = performance.now();
    const route = pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id").replace(/\d+/g, ":id").slice(0, 100);
    const active = () => document.visibilityState === "visible" && document.hasFocus() && Date.now() - lastInput < 60_000;
    const interact = () => { lastInput = Date.now(); };
    const send = (event: string) => {
      const seconds = Math.min(35, Math.floor(activeMs / 1000));
      activeMs = 0;
      lastSent = performance.now();
      void fetch("/api/usage", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, channel, activeSeconds: seconds, route, event }), keepalive: true }).catch(() => {});
    };
    send("start");
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (active()) activeMs += Math.min(2000, now - tick);
      tick = now;
      if (now - lastSent >= 30_000 && document.visibilityState === "visible") send("ping");
    }, 1000);
    const visibility = () => { send(document.visibilityState === "hidden" ? "hidden" : "ping"); tick = performance.now(); };
    const close = () => send("close");
    const logout = () => send("logout");
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, interact, { passive: true }));
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", close);
    window.addEventListener("ef-logout", logout);
    return () => {
      clearInterval(timer); send("close");
      events.forEach((event) => window.removeEventListener(event, interact));
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", close);
      window.removeEventListener("ef-logout", logout);
    };
  }, [channel, pathname]);
  return null;
}
