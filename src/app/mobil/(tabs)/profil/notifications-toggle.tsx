"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { toggleNotifications } from "./actions";

export function NotificationsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    const formData = new FormData();
    if (next) formData.set("enabled", "on");
    startTransition(() => toggleNotifications(formData));
  }

  return (
    <div className="flex items-center gap-3 border-b border-[#f2f4f7] px-4 py-3.5">
      <Bell className="h-[18px] w-[18px] text-[#475467]" strokeWidth={1.9} />
      <div className="flex-1 text-[13.5px] font-semibold">Notificări</div>
      <button
        type="button"
        role="switch"
        aria-checked={initialEnabled}
        disabled={pending}
        onClick={() => handleChange(!initialEnabled)}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${
          initialEnabled ? "bg-electric" : "bg-[#d0d5dd]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            initialEnabled ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
