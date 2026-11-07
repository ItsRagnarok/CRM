import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
      <div className="flex items-center gap-1 border-b border-[#eaecf0] bg-white px-4 pb-3 pt-2">
        <Link href="/mobil" aria-label="Înapoi" className="-ml-2 flex h-11 w-11 items-center justify-center text-[#344054]">
          <ChevronLeft className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="flex-1 text-[18px] font-extrabold">Mesaje</h1>
      </div>

      {(conversations ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
          <MessageSquare className="h-8 w-8 text-muted-2" strokeWidth={1.6} />
          <div className="text-[14px] font-bold">Nicio conversație încă</div>
          <div className="text-[12.5px] text-muted">Mesajele de la administrator și din echipa ta apar aici.</div>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden border-y border-[#eaecf0] bg-white">
          {(conversations ?? []).map((c) => {
            const last = lastBy.get(c.id);
            const unread = unreadFor(c.id);
            const title = c.kind === "team" ? c.teams?.name ?? "Echipa ta" : "Administrator";
            return (
              <Link key={c.id} href={`/mobil/mesaje/${c.id}`} className="flex items-center gap-3 border-b border-[#eaecf0] px-4 py-3.5 last:border-b-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-neutral-bg text-[12px] font-bold text-[#475467]">
                  {title.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[13.5px] font-bold">{title}</div>
                    {last && <div className="shrink-0 text-[10.5px] text-muted-2">{fmtTime(last.created_at)}</div>}
                  </div>
                  <div className="truncate text-[12.5px] text-muted-2">
                    {last ? `${last.sender_profile_id === profile.id ? "Tu: " : ""}${last.body}` : "Niciun mesaj încă"}
                  </div>
                </div>
                {unread > 0 && (
                  <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-[10.5px] font-bold text-white">
                    {unread}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-2" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
