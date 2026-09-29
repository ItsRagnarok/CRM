"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export function LiveJobTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedS = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = String(Math.floor(elapsedS / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsedS % 3600) / 60)).padStart(2, "0");
  const s = String(elapsedS % 60).padStart(2, "0");

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-electric-soft px-3 py-1 text-[12.5px] font-bold text-electric">
      <Timer className="h-3.5 w-3.5" />
      {h}:{m}:{s}
    </span>
  );
}
