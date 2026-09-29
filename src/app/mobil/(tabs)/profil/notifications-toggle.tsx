"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { toggleNotifications } from "./actions";

export function NotificationsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !enabled;
    setEnabled(next); // flip immediately — don't wait on a server round-trip
    const formData = new FormData();
    if (next) formData.set("enabled", "on");
    startTransition(async () => {
      const result = await toggleNotifications(formData);
      if (result?.error) setEnabled(!next); // roll back if the save actually failed
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-[#f2f4f7] px-4 py-3.5">
      <Bell className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
      <div className="flex-1 text-[13.5px] font-semibold">Notificări</div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending}
        onClick={handleClick}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          enabled ? "bg-electric" : "bg-[#d0d5dd]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
