"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export function WorkTimer({ startedAt }: { startedAt: string }) {
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
    <div className="flex items-center justify-center gap-2 rounded-[12px] border border-[#eaecf0] bg-white py-3">
      <Timer className="h-4 w-4 text-electric" />
      <span className="text-[18px] font-extrabold tabular-nums">
        {h}:{m}:{s}
      </span>
      <span className="text-[11.5px] font-semibold text-muted-2">timp lucrat</span>
    </div>
  );
}
