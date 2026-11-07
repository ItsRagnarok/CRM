"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, MessageSquare, PhoneCall, Briefcase, ShoppingCart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { markNotificationRead, markAllNotificationsRead } from "@/app/(app)/notifications-actions";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORY_LABELS,
  categoryOf,
  notificationHref,
  timeAgo,
  type NotificationCategory,
  type NotificationItem,
} from "@/lib/notification-ui";

const TABS: (NotificationCategory | "toate")[] = ["toate", "mesaje", "apeluri", "lucrari"];

function TypeIcon({ type }: { type: string }) {
  const cls = "h-[17px] w-[17px]";
  if (type === "message") return <MessageSquare className={`${cls} text-electric`} strokeWidth={1.9} />;
  if (type === "call_request") return <PhoneCall className={`${cls} text-[#b54708]`} strokeWidth={1.9} />;
  if (type === "purchase") return <ShoppingCart className={`${cls} text-[#475467]`} strokeWidth={1.9} />;
  if (type === "test") return <Bell className={`${cls} text-electric`} strokeWidth={1.9} />;
  return <Briefcase className={`${cls} text-[#475467]`} strokeWidth={1.9} />;
}

function tileBg(type: string) {
  if (type === "message" || type === "test") return "bg-electric-soft";
  if (type === "call_request") return "bg-[#fef0c7]";
  return "bg-neutral-bg";
}

export function Topbar({
  notifications,
  profileId,
  readOnly,
}: {
  notifications: NotificationItem[];
  profileId: string;
  readOnly?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const showSearch = pathname === "/dashboard";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationCategory | "toate">("toate");
  // Opening the panel is "I've seen these" — optimistically clear the badge
  // right away instead of waiting on each one to be clicked individually,
  // which read as broken/stuck (notifications piling up with no way to
  // dismiss them as a batch).
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const isRead = (n: NotificationItem) => n.is_read || locallyRead.has(n.id);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  // A new notification for me arrived (message from a technician, a job that
  // just started…): re-render the layout's data so the badge and list update
  // without waiting for the next navigation.
  useEffect(() => {
    if (readOnly) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`topbar-notifications-${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${profileId}` },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, readOnly, router]);

  function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unreadCount > 0 && !readOnly) {
      setLocallyRead(new Set(notifications.map((n) => n.id)));
      startTransition(() => {
        markAllNotificationsRead();
      });
    }
  }

  function handleClick(n: NotificationItem) {
    setOpen(false);
    if (!n.is_read && !readOnly) markNotificationRead(n.id);
    const href = notificationHref(n, "platform");
    if (href) router.push(href);
  }

  const shown = tab === "toate" ? notifications : notifications.filter((n) => categoryOf(n.type) === tab);
  // Unread per category, shown on the tabs.
  const tabCount = (t: NotificationCategory | "toate") =>
    notifications.filter((n) => !n.is_read && (t === "toate" || categoryOf(n.type) === t)).length;

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
      <ThemeToggle />

      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          aria-expanded={open}
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-neutral-bg text-neutral"
          aria-label={unreadCount > 0 ? `Notificări, ${unreadCount} necitite` : "Notificări"}
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
            <div className="absolute right-0 top-[42px] z-20 w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[14px] border border-border bg-white shadow-[0_12px_32px_rgba(16,24,40,0.22)]">
              <div className="px-4 pb-2.5 pt-3.5 text-[14px] font-extrabold text-foreground">Notificări</div>
              <div className="flex gap-1.5 px-4 pb-2.5">
                {TABS.map((t) => {
                  const count = tabCount(t);
                  const on = t === tab;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-bold ${
                        on ? "border-[#101828] bg-[#101828] text-white" : "border-[#d0d5dd] bg-white text-[#344054]"
                      }`}
                    >
                      {t === "toate" ? "Toate" : CATEGORY_LABELS[t]}
                      {count > 0 && <span className="ml-1 opacity-80">{count}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="max-h-[400px] overflow-auto border-t border-[#eaecf0]">
                {shown.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12.5px] text-muted">
                    {tab === "toate" ? "Nicio notificare încă." : "Nicio notificare în această categorie."}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#f2f4f7]">
                    {shown.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleClick(n)}
                        className={`flex gap-3 px-4 py-3 text-left hover:bg-[#f9fafb] ${n.is_read ? "" : "bg-electric-soft/30"}`}
                      >
                        <div className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] ${tileBg(n.type)}`}>
                          <TypeIcon type={n.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12.5px] font-bold text-foreground">{n.title}</span>
                            {!n.is_read && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-electric" />}
                          </div>
                          {n.body && <div className="mt-0.5 text-[12px] leading-snug text-[#475467]">{n.body}</div>}
                          <div className="mt-1 text-[10.5px] text-muted-2">{timeAgo(n.created_at)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/notificari"
                onClick={() => setOpen(false)}
                className="block border-t border-[#eaecf0] px-4 py-3 text-center text-[12.5px] font-bold text-electric"
              >
                Vezi toate notificările
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
