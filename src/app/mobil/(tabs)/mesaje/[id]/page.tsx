import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Phone } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MessagesThread } from "@/components/messages-thread";
import { sendMobileMessage } from "../actions";
import { AutoMarkReadMobile } from "../auto-mark-read";

const QUICK_REPLIES = ["Am ajuns", "Plec acum", "Am nevoie de ajutor", "Te sun mai târziu"];

export default async function MobileConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, organization } = await requireSessionContext();
  const supabase = await createClient();

  // Row-level security only lets a field employee see their own direct
  // conversation and their teams', so a guessed id is simply "not found".
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, kind, teams(name)")
    .eq("id", id)
    .maybeSingle();
  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("conversation_messages")
    .select("id, body, sender_profile_id, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const senderIds = [...new Set((messages ?? []).map((m) => m.sender_profile_id))];
  const { data: senders } = senderIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", senderIds)
    : { data: [] };
  const names: Record<string, string> = {};
  for (const s of senders ?? []) names[s.id] = s.full_name;

  const title = conversation.kind === "team" ? conversation.teams?.name ?? "Echipa ta" : "Administrator";

  return (
    <div className="flex h-full flex-col">
      <AutoMarkReadMobile conversationId={id} />
      <div className="flex shrink-0 items-center gap-2 border-b border-[#eaecf0] bg-white px-4 py-2">
        <Link href="/mobil/mesaje" aria-label="Înapoi" className="-ml-2 flex h-11 w-11 items-center justify-center text-[#344054]">
          <ChevronLeft className="h-[22px] w-[22px]" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-extrabold">{title}</div>
          <div className="text-[11.5px] text-muted">{conversation.kind === "team" ? "Conversația echipei" : "Conversație directă"}</div>
        </div>
        {organization.phone && (
          <a
            href={`tel:${organization.phone}`}
            aria-label="Sună administratorul"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-electric text-white"
          >
            <Phone className="h-[19px] w-[19px]" strokeWidth={2} />
          </a>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <MessagesThread
          conversationId={id}
          initialMessages={messages ?? []}
          currentProfileId={profile.id}
          participantNames={names}
          quickReplies={QUICK_REPLIES}
          sendAction={sendMobileMessage}
          hiddenFields={{ conversationId: id }}
        />
      </div>
    </div>
  );
}
