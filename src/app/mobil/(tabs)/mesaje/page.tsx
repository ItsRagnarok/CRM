import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";

function fmtTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
  if (days === 1) return "ieri";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", timeZone: "Europe/Bucharest" });
}

export default async function MobileMessagesPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: conversations }, { data: reads }, { data: recent }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, kind, team_id, profile_id, last_message_at, teams(name)")
      .order("last_message_at", { ascending: false }),
    supabase.from("conversation_reads").select("conversation_id, last_read_at").eq("profile_id", profile.id),
    supabase
      .from("conversation_messages")
      .select("conversation_id, body, sender_profile_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const readBy = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));
  const lastBy = new Map<string, NonNullable<typeof recent>[number]>();
  for (const m of recent ?? []) if (!lastBy.has(m.conversation_id)) lastBy.set(m.conversation_id, m);
  const unreadFor = (id: string) => {
    const lastRead = readBy.get(id);
    return (recent ?? []).filter((m) => m.conversation_id === id && m.sender_profile_id !== profile.id && (!lastRead || m.created_at > lastRead)).length;
  };

  return (
    <div className="flex flex-col">
      <ScreenHeader
        title="Mesaje"
        right={
          <Link href="/mobil/notificari" aria-label="Notificări" className="m-ib sm"><Bell className="m-i" /></Link>
        }
      />
      <div className="m-bd" style={{ overflow: "visible" }}>
        {(conversations ?? []).length === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={MessageCircle} title="Nicio conversație încă">Mesajele de la birou și din echipa ta apar aici.</EmptyScreen>
          </div>
        ) : (
          <div className="m-list">
            {(conversations ?? []).map((c) => {
              const last = lastBy.get(c.id);
              const unread = unreadFor(c.id);
              const title = c.kind === "team" ? c.teams?.name ?? "Echipa ta" : "Birou";
              return (
                <div key={c.id}>
                  <Link href={`/mobil/mesaje/${c.id}`} className="m-row" style={{ padding: "14px 0" }}>
                    <div className={`m-av ${c.kind === "team" ? "" : "ac"}`}>{title.slice(0, 2).toUpperCase()}</div>
                    <div className="m-fl">
                      <div className="m-r">
                        <b className="m-fl" style={{ fontSize: 15.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</b>
                        {last && <span className="m-mu" style={{ fontSize: 12 }}>{fmtTime(last.created_at)}</span>}
                      </div>
                      <div className="m-r" style={{ gap: 8 }}>
                        <span className="m-mu m-fl" style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: unread > 0 ? "var(--m-ink)" : undefined, fontWeight: unread > 0 ? 600 : undefined }}>
                          {last ? `${last.sender_profile_id === profile.id ? "Tu: " : ""}${last.body}` : "Niciun mesaj încă"}
                        </span>
                        {unread > 0 && <span className="m-un" style={{ minWidth: 22, height: 22, borderRadius: 11, background: "var(--m-ac)", color: "var(--m-onac)", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{unread}</span>}
                      </div>
                    </div>
                  </Link>
                  <hr className="m-sep" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
