import { Search, Bell, Plus, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/(app)/actions";

const TODAY_LABEL = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

export function Topbar({ newJobHref = "/lucrari/nou" }: { newJobHref?: string }) {
  const label = TODAY_LABEL.charAt(0).toUpperCase() + TODAY_LABEL.slice(1);

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

      <div className="hidden text-right text-[13px] font-semibold text-foreground md:block">
        {label}
      </div>

      <Link
        href={newJobHref}
        className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_3px_8px_rgba(47,111,237,0.28)]"
      >
        <Plus className="h-[15px] w-[15px]" strokeWidth={2.4} />
        Lucrare nouă
      </Link>

      <form action={signOut}>
        <button
          type="submit"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-neutral hover:bg-neutral-bg"
          aria-label="Deconectare"
        >
          <LogOut className="h-[17px] w-[17px]" strokeWidth={1.9} />
        </button>
      </form>
    </header>
  );
}
