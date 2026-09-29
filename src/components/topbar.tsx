"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { markNotificationRead } from "@/app/(app)/notifications-actions";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  related_job_id: string | null;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "chiar acum";
  if (minutes < 60) return `acum ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `acum ${hours} h`;
  return `acum ${Math.round(hours / 24)} zile`;
}

export function Topbar({ notifications }: { notifications: Notification[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const showSearch = pathname === "/dashboard";
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleClick(n: Notification) {
    setOpen(false);
    if (!n.is_read) markNotificationRead(n.id);
    if (n.related_job_id) router.push(`/lucrari/${n.related_job_id}`);
  }

  return (
    <header className="relative flex h-[66px] shrink-0 items-center gap-4 border-b border-border bg-white px-6">
      {showSearch && (
        <div className="flex max-w-[420px] flex-1 items-center gap-2.5 rounded-[10px] bg-neutral-bg px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-2" />
          <input
            placeholder="Caută clienți, lucrări, echipe…"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-2"
          />
        </div>
      )}

      <div className="flex-1" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-neutral-bg text-neutral"
          aria-label="Notificări"
        >
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.9} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-[42px] z-20 max-h-[420px] w-[340px] overflow-auto rounded-[12px] border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.14)]">
              <div className="border-b border-[#f2f4f7] px-4 py-3 text-[13px] font-extrabold text-foreground">
                Notificări
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12.5px] text-muted">Nicio notificare încă.</div>
              ) : (
                <div className="flex flex-col divide-y divide-[#f2f4f7]">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-[#f9fafb] ${
                        n.is_read ? "" : "bg-electric-soft/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />}
                        <span className="text-[13px] font-bold text-foreground">{n.title}</span>
                      </div>
                      {n.body && <div className="text-[12px] text-[#475467]">{n.body}</div>}
                      <div className="text-[10.5px] text-muted-2">{timeAgo(n.created_at)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
