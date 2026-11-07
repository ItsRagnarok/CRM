import Link from "next/link";
import { MessageSquare, PhoneCall, Briefcase, Bell, ShoppingCart } from "lucide-react";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";
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
  const Icon = type === "message" ? MessageSquare : type === "call_request" ? PhoneCall : type === "purchase" || type === "purchase_request" ? ShoppingCart : type === "test" ? Bell : Briefcase;
  const tone = type === "call_request" ? "w" : type === "message" || type === "test" ? "" : "g";
  return <span className={`m-ic sm ${tone}`}><Icon className="m-i" /></span>;
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
      <ScreenHeader
        title="Notificări"
        back="/mobil/mesaje"
        right={
          counts.toate > 0 ? (
            <form action={markAllNotificationsReadMobile}>
              <button type="submit" className="m-link">Citește tot</button>
            </form>
          ) : undefined
        }
      />
      <div className="m-bd" style={{ overflow: "visible", gap: 6 }}>
        <div className="m-chips" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 6 }}>
          {FILTERS.map((f) => (
            <Link key={f} href={f === "toate" ? "/mobil/notificari" : `/mobil/notificari?tip=${f}`} className={`m-chip ${f === active ? "on" : ""}`} style={{ whiteSpace: "nowrap" }}>
              {f === "toate" ? "Toate" : CATEGORY_LABELS[f]}
              {counts[f] > 0 && <span style={{ opacity: 0.8 }}>{counts[f]}</span>}
            </Link>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={Bell} title="Nimic nou">
              {active === "toate" ? "Nicio notificare încă." : "Nicio notificare în această categorie."}
            </EmptyScreen>
          </div>
        ) : (
          [...groups.entries()].map(([group, items]) => (
            <div key={group} className="m-col" style={{ gap: 8 }}>
              <div className="m-lb" style={{ marginTop: 8 }}>{group}</div>
              <div className="m-list">
                {items.map((n) => (
                  <div key={n.id}>
                    <div className="m-row" style={{ alignItems: "flex-start", padding: "14px 0" }}>
                      <IconFor type={n.type} />
                      <div className="m-fl">
                        <form action={openNotification.bind(null, n.id)}>
                          <button type="submit" style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, padding: 0, color: "inherit" }}>
                            <div style={{ fontSize: 14.5, fontWeight: n.is_read ? 700 : 800 }}>{n.title}</div>
                            {n.body && <div className="m-mu" style={{ fontSize: 13, marginTop: 2 }}>{n.body}</div>}
                            <div className="m-mu" style={{ fontSize: 11.5, marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                          </button>
                        </form>
                        {n.type === "call_request" && organization.phone && (
                          <a href={`tel:${organization.phone}`} className="m-btn sm" style={{ marginTop: 10, width: "auto", display: "inline-flex", padding: "0 18px" }}>Sună acum</a>
                        )}
                      </div>
                      {!n.is_read && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--m-ac)", boxShadow: "0 0 0 2px var(--m-acs)", marginTop: 6, flexShrink: 0 }} />}
                    </div>
                    <hr className="m-sep" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
