import Link from "next/link";
import { Bell, MessageSquare, PhoneCall, Briefcase, ShoppingCart } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  categoryOf,
  dayGroup,
  notificationHref,
  timeAgo,
  type NotificationCategory,
  type NotificationItem,
} from "@/lib/notification-ui";

const FILTERS: (NotificationCategory | "toate")[] = ["toate", "mesaje", "apeluri", "lucrari"];

function TypeIcon({ type }: { type: string }) {
  const cls = "h-[18px] w-[18px]";
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

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  const { tip } = await searchParams;
  const active: NotificationCategory | "toate" = FILTERS.includes(tip as NotificationCategory) ? (tip as NotificationCategory) : "toate";
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, type, related_job_id, link, is_read, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(150);
  const all: NotificationItem[] = data ?? [];
  const shown = active === "toate" ? all : all.filter((n) => categoryOf(n.type) === active);

  const groups = new Map<string, NotificationItem[]>();
  for (const n of shown) {
    const g = dayGroup(n.created_at);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(n);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[60px] shrink-0 items-center gap-4 border-b border-border bg-white px-6">
        <h1 className="text-[16px] font-extrabold text-foreground">Notificări</h1>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "toate" ? "/notificari" : `/notificari?tip=${f}`}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-bold ${
                f === active ? "border-[#101828] bg-[#101828] text-white" : "border-[#d0d5dd] bg-white text-[#344054]"
              }`}
            >
              {f === "toate" ? "Toate" : CATEGORY_LABELS[f]}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-[760px]">
          {shown.length === 0 ? (
            <div className="rounded-[14px] border border-border bg-white px-6 py-16 text-center text-[13px] text-muted">
              Nicio notificare{active === "toate" ? " încă" : " în această categorie"}.
            </div>
          ) : (
            [...groups.entries()].map(([group, items]) => (
              <div key={group} className="mb-5">
                <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-muted-2">{group}</div>
                <div className="overflow-hidden rounded-[14px] border border-border bg-white">
                  {items.map((n) => {
                    const href = notificationHref(n, "platform");
                    const inner = (
                      <>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${tileBg(n.type)}`}>
                          <TypeIcon type={n.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-foreground">{n.title}</span>
                            {!n.is_read && <span className="h-[7px] w-[7px] rounded-full bg-electric" />}
                          </div>
                          {n.body && <div className="mt-0.5 text-[12.5px] text-[#475467]">{n.body}</div>}
                        </div>
                        <div className="shrink-0 text-[11px] text-muted-2">{timeAgo(n.created_at)}</div>
                      </>
                    );
                    const cls = `flex items-start gap-3 border-b border-[#f2f4f7] px-4 py-3.5 last:border-b-0 ${
                      n.is_read ? "" : "bg-electric-soft/30"
                    }`;
                    return href ? (
                      <Link key={n.id} href={href} className={`${cls} hover:bg-[#f9fafb]`}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={n.id} className={cls}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
