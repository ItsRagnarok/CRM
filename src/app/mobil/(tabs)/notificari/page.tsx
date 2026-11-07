import Link from "next/link";
import { ChevronLeft, MessageSquare, PhoneCall, Briefcase, Bell, ShoppingCart } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  categoryOf,
  dayGroup,
  timeAgo,
  type NotificationCategory,
  type NotificationItem,
} from "@/lib/notification-ui";
import { markAllNotificationsReadMobile, openNotification } from "./actions";

const FILTERS: (NotificationCategory | "toate")[] = ["toate", "mesaje", "apeluri", "lucrari"];

function IconFor({ type }: { type: string }) {
  const cls = "h-[19px] w-[19px]";
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

export default async function MobileNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  const active: NotificationCategory | "toate" = FILTERS.includes(tip as NotificationCategory) ? (tip as NotificationCategory) : "toate";
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, type, related_job_id, link, is_read, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(80);
  const all: NotificationItem[] = data ?? [];

  const counts: Record<NotificationCategory | "toate", number> = {
    toate: all.filter((n) => !n.is_read).length,
    mesaje: all.filter((n) => !n.is_read && categoryOf(n.type) === "mesaje").length,
    apeluri: all.filter((n) => !n.is_read && categoryOf(n.type) === "apeluri").length,
    lucrari: all.filter((n) => !n.is_read && categoryOf(n.type) === "lucrari").length,
  };
  const shown = active === "toate" ? all : all.filter((n) => categoryOf(n.type) === active);

  const groups = new Map<string, NotificationItem[]>();
  for (const n of shown) {
    const g = dayGroup(n.created_at);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(n);
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0 border-b border-[#eaecf0] bg-white px-4 pb-3 pt-2">
        <div className="flex items-center gap-1">
          <Link href="/mobil" aria-label="Înapoi" className="-ml-2 flex h-11 w-11 items-center justify-center text-[#344054]">
            <ChevronLeft className="h-[22px] w-[22px]" />
          </Link>
          <h1 className="flex-1 text-[18px] font-extrabold">Notificări</h1>
          <Link href="/mobil/mesaje" aria-label="Conversații" className="flex h-11 w-11 items-center justify-center text-[#344054]">
            <MessageSquare className="h-[20px] w-[20px]" strokeWidth={1.9} />
          </Link>
          {counts.toate > 0 && (
            <form action={markAllNotificationsReadMobile}>
              <button type="submit" className="min-h-11 px-1 text-[12.5px] font-bold text-electric">
                Marchează tot ca citit
              </button>
            </form>
          )}
        </div>
        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => {
            const on = f === active;
            return (
              <Link
                key={f}
                href={f === "toate" ? "/mobil/notificari" : `/mobil/notificari?tip=${f}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-bold ${
                  on ? "border-[#101828] bg-[#101828] text-white" : "border-[#d0d5dd] bg-white text-[#344054]"
                }`}
              >
                {f === "toate" ? "Toate" : CATEGORY_LABELS[f]}
                {counts[f] > 0 && <span className="text-[11px] opacity-85">{counts[f]}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="px-6 py-16 text-center text-[13px] text-muted">
          {active === "toate" ? "Nicio notificare încă." : "Nicio notificare în această categorie."}
        </div>
      ) : (
        [...groups.entries()].map(([group, items]) => (
          <div key={group}>
            <div className="px-4 pb-1.5 pt-4 text-[11.5px] font-bold uppercase tracking-wide text-muted-2">{group}</div>
            <div className="overflow-hidden border-y border-[#eaecf0] bg-white">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-[#eaecf0] px-4 py-3.5 last:border-b-0 ${n.is_read ? "" : "bg-electric-soft/30"}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${tileBg(n.type)}`}>
                    <IconFor type={n.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <form action={openNotification.bind(null, n.id)}>
                      <button type="submit" className="block w-full text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-foreground">{n.title}</span>
                          {!n.is_read && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-electric" />}
                        </div>
                        {n.body && <div className="mt-0.5 text-[12.5px] leading-snug text-[#475467]">{n.body}</div>}
                        <div className="mt-1 text-[11px] text-muted-2">{timeAgo(n.created_at)}</div>
                      </button>
                    </form>
                    {n.type === "call_request" && organization.phone && (
                      <a
                        href={`tel:${organization.phone}`}
                        className="mt-2 inline-flex min-h-9 items-center rounded-[9px] bg-electric px-3.5 text-[12px] font-bold text-white"
                      >
                        Sună acum
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
