import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MessagesThread } from "@/components/messages-thread";
import { AutoMarkRead } from "@/components/auto-mark-read";
import { sendTeamMessage, sendDirectMessage } from "./actions";
import { MessageSquare } from "lucide-react";

export default async function MesajePage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; emp?: string }>;
}) {
  const { team: selectedTeamId, emp: selectedProfileId } = await searchParams;
  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: teams }, { data: employees }, { data: conversations }, { data: reads }, { data: recentMessages }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, team_members(profiles(id, full_name))")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .neq("role", "client")
        .neq("id", profile.id)
        .order("full_name"),
      supabase.from("conversations").select("id, kind, team_id, profile_id, last_message_at").eq("organization_id", organization.id),
      supabase.from("conversation_reads").select("conversation_id, last_read_at").eq("profile_id", profile.id),
      supabase
        .from("conversation_messages")
        .select("id, conversation_id, body, sender_profile_id, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

  const readByConv = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));
  const convByTeam = new Map((conversations ?? []).filter((c) => c.kind === "team").map((c) => [c.team_id as string, c]));
  const convByProfile = new Map(
    (conversations ?? []).filter((c) => c.kind === "direct").map((c) => [c.profile_id as string, c])
  );
  const lastMsgByConv = new Map<string, NonNullable<typeof recentMessages>[number]>();
  for (const m of recentMessages ?? []) {
    if (!lastMsgByConv.has(m.conversation_id)) lastMsgByConv.set(m.conversation_id, m);
  }
  function unreadCountFor(conversationId: string) {
    const lastRead = readByConv.get(conversationId);
    return (recentMessages ?? []).filter(
      (m) => m.conversation_id === conversationId && m.sender_profile_id !== profile.id && (!lastRead || m.created_at > lastRead)
    ).length;
  }

  const selectedConversation = selectedTeamId
    ? convByTeam.get(selectedTeamId) ?? null
    : selectedProfileId
      ? convByProfile.get(selectedProfileId) ?? null
      : null;

  const { data: threadMessages } = selectedConversation
    ? await supabase
        .from("conversation_messages")
        .select("id, body, sender_profile_id, created_at")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true })
        .limit(200)
    : { data: [] };

  const orgProfileNames: Record<string, string> = {};
  for (const t of teams ?? []) {
    for (const m of t.team_members) {
      if (m.profiles) orgProfileNames[m.profiles.id] = m.profiles.full_name;
    }
  }
  for (const e of employees ?? []) orgProfileNames[e.id] = e.full_name;
  orgProfileNames[profile.id] = profile.full_name;

  const selectedTitle = selectedTeamId
    ? (teams ?? []).find((t) => t.id === selectedTeamId)?.name
    : selectedProfileId
      ? orgProfileNames[selectedProfileId]
      : null;

  function fmtTime(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "ieri";
    return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[60px] shrink-0 items-center border-b border-border bg-white px-6">
        <h1 className="text-[16px] font-extrabold text-foreground">Mesaje</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-[320px] shrink-0 flex-col overflow-auto border-r border-border bg-white">
          <div className="px-4 pb-1 pt-3.5 text-[11px] font-bold uppercase tracking-wide text-muted-2">Echipe</div>
          {(teams ?? []).map((t) => {
            const conv = convByTeam.get(t.id);
            const last = conv ? lastMsgByConv.get(conv.id) : null;
            const unread = conv ? unreadCountFor(conv.id) : 0;
            const active = selectedTeamId === t.id;
            return (
              <a
                key={t.id}
                href={`/mesaje?team=${t.id}`}
                className={`flex items-center gap-2.5 border-b border-[#f2f4f7] px-4 py-3 ${active ? "bg-electric-soft/40" : "hover:bg-[#f9fafb]"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-neutral-bg text-[12px] font-bold text-[#475467]">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[13px] font-bold text-foreground">{t.name}</div>
                    {last && <div className="shrink-0 text-[10px] text-muted-2">{fmtTime(last.created_at)}</div>}
                  </div>
                  <div className="truncate text-[11.5px] text-muted-2">
                    {last ? `${last.sender_profile_id === profile.id ? "Tu: " : ""}${last.body}` : "Niciun mesaj încă"}
                  </div>
                </div>
                {unread > 0 && (
                  <span className="flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </a>
            );
          })}

          <div className="px-4 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-muted-2">Angajați</div>
          {(employees ?? []).map((e) => {
            const conv = convByProfile.get(e.id);
            const last = conv ? lastMsgByConv.get(conv.id) : null;
            const unread = conv ? unreadCountFor(conv.id) : 0;
            const active = selectedProfileId === e.id;
            return (
              <a
                key={e.id}
                href={`/mesaje?emp=${e.id}`}
                className={`flex items-center gap-2.5 border-b border-[#f2f4f7] px-4 py-3 ${active ? "bg-electric-soft/40" : "hover:bg-[#f9fafb]"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-neutral-bg text-[12px] font-bold text-[#475467]">
                  {e.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[13px] font-bold text-foreground">{e.full_name}</div>
                    {last && <div className="shrink-0 text-[10px] text-muted-2">{fmtTime(last.created_at)}</div>}
                  </div>
                  <div className="truncate text-[11.5px] text-muted-2">
                    {last ? `${last.sender_profile_id === profile.id ? "Tu: " : ""}${last.body}` : "Niciun mesaj încă"}
                  </div>
                </div>
                {unread > 0 && (
                  <span className="flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        <div className="flex-1">
          {selectedTeamId || selectedProfileId ? (
            <div className="flex h-full flex-col">
              {selectedConversation && <AutoMarkRead conversationId={selectedConversation.id} />}
              <div className="flex h-[54px] shrink-0 items-center border-b border-[#f2f4f7] bg-white px-5">
                <div className="text-[14px] font-extrabold text-foreground">{selectedTitle}</div>
              </div>
              <div className="flex-1 overflow-hidden">
                <MessagesThread
                  conversationId={selectedConversation?.id ?? null}
                  initialMessages={threadMessages ?? []}
                  currentProfileId={profile.id}
                  participantNames={orgProfileNames}
                  sendAction={selectedTeamId ? sendTeamMessage : sendDirectMessage}
                  hiddenFields={selectedTeamId ? { teamId: selectedTeamId } : { profileId: selectedProfileId! }}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <MessageSquare className="h-8 w-8 text-muted-2" />
              <p className="text-[13.5px] text-muted">Alege o echipă sau un angajat din stânga.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
