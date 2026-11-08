"use client";

import { useState } from "react";

export function CopyField({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-[10px] border border-[#d0d5dd] bg-[#f9fafb] px-3 py-2 text-[12.5px]" aria-label="Link de status" />
      <button
        type="button"
        onClick={async () => {
          try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* the field is selectable as a fallback */ }
        }}
        className="rounded-[10px] bg-electric px-3.5 py-2 text-[13px] font-bold"
      >
        {done ? "Copiat" : "Copiază"}
      </button>
    </div>
  );
}
