import { Search, Bell } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-[66px] shrink-0 items-center gap-4 border-b border-border bg-white px-6">
      <div className="flex max-w-[420px] flex-1 items-center gap-2.5 rounded-[10px] bg-neutral-bg px-3.5 py-2.5">
        <Search className="h-4 w-4 text-muted-2" />
        <input
          placeholder="Caută clienți, lucrări, echipe…"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-2"
        />
      </div>

      <div className="flex-1" />

      <button
        type="button"
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-neutral-bg text-neutral"
        aria-label="Notificări"
      >
        <Bell className="h-[17px] w-[17px]" strokeWidth={1.9} />
      </button>
    </header>
  );
}
