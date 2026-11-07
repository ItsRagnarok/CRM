"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// Shown the moment the phone loses signal. Honest about what works: the screen
// the technician is on keeps working, but nothing is sent until the signal returns.
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;
  return (
    <div className="m-offline" role="status">
      <WifiOff className="m-i" style={{ width: 18, height: 18 }} />
      Ești offline. Ce ai completat se trimite când revine semnalul.
    </div>
  );
}
