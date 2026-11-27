"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PUBLIC = ["/blog", "/programare", "/termeni", "/confidentialitate", "/solicitare", "/status"];

// Keeps the app's layout stable against an accidental trackpad pinch or
// Ctrl+scroll — actual browser zoom (Ctrl+/Ctrl-, or the browser's own zoom
// menu/setting) still works, since those never fire as wheel/gesture events.
export function PreventZoom() {
  const pathname = usePathname();
  // Pe site-ul public zoomul rămâne permis (accesibilitate, cerință Google pentru mobil).
  const isPublic = pathname === "/" || PUBLIC.some((p) => pathname.startsWith(p));
  useEffect(() => {
    if (isPublic) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    // Safari fires gesture events on trackpad pinch instead of ctrl+wheel.
    const onGesture = (e: Event) => e.preventDefault();

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("gesturestart", onGesture);
    window.addEventListener("gesturechange", onGesture);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("gesturestart", onGesture);
      window.removeEventListener("gesturechange", onGesture);
    };
  }, [isPublic]);

  return null;
}
