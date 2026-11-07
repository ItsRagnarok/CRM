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
    <>
      <div className="m-row">
        <span className="m-ic sm"><Bell className="m-i" /></span>
        <div className="m-fl">
          <div className="t">Primesc notificări</div>
          <div className="d">Pe acest telefon, chiar și cu aplicația închisă</div>
        </div>
        <button type="button" role="switch" aria-checked={enabled} aria-label="Primesc notificări" disabled={pending} onClick={handleClick} className={`m-sw ${enabled ? "" : "off"}`} />
      </div>
      <hr className="m-sep" />
    </>
  );
}
