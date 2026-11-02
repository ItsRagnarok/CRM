"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.dataset.theme === "dark");
    sync();
    window.addEventListener("ef-theme", sync);
    const storage = (event: StorageEvent) => { if (event.key === "ef-theme") { document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light"; sync(); } };
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener("ef-theme", sync); window.removeEventListener("storage", storage); };
  }, []);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("ef-theme", next); } catch { /* Private browsing can disable persistence. */ }
    window.dispatchEvent(new Event("ef-theme"));
  }
  return <button type="button" onClick={toggle} aria-label={dark ? "Activează tema luminoasă" : "Activează tema întunecată"} title={dark ? "Temă luminoasă" : "Temă întunecată"} aria-pressed={dark}
    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-neutral-bg text-neutral">
    {dark ? <Sun size={17} /> : <Moon size={17} />}
  </button>;
}
