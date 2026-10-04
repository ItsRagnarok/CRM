"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { MessagesThread, type ThreadMessage } from "@/components/messages-thread";
import { sendTeamMessage } from "@/app/(app)/mesaje/actions";

const ADMIN_QUICK_REPLIES = ["Trimit pe cineva cu materiale", "Rezolvați cu ce aveți", "Sun acum"];

export function TeamCommsPanel({
  teamId,
  jobId,
  requestCallAction,
  memberPhones,
  conversationId,
  initialMessages,
  currentProfileId,
  participantNames,
  unreadCount,
}: {
  teamId: string;
  jobId: string;
  requestCallAction: (formData: FormData) => void | Promise<void>;
  memberPhones: { fullName: string; phone: string }[];
  conversationId: string | null;
  initialMessages: ThreadMessage[];
  currentProfileId: string;
  participantNames: Record<string, string>;
  unreadCount: number;
}) {
  const [tab, setTab] = useState<"apel" | "mesaje">("apel");

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#eaecf0]">
      <div className="flex border-b border-[#eaecf0]">
        <button
          type="button"
          onClick={() => setTab("apel")}
          className={`flex-1 py-2.5 text-center text-[12px] font-bold ${
            tab === "apel" ? "border-b-2 border-electric text-electric" : "text-muted"
          }`}
        >
          Apel rapid
        </button>
        <button
          type="button"
          onClick={() => setTab("mesaje")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-center text-[12px] font-bold ${
            tab === "mesaje" ? "border-b-2 border-electric text-electric" : "text-muted"
          }`}
        >
          Mesaje
          {unreadCount > 0 && (
            <span className="rounded-full bg-danger px-1.5 py-0 text-[9.5px] font-bold text-white">{unreadCount}</span>
          )}
        </button>
      </div>

      {tab === "apel" ? (
        <div className="p-3.5">
          <form action={requestCallAction} className="flex flex-col gap-2">
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="jobId" value={jobId} />
            <button type="submit" className="rounded-[9px] bg-electric px-3.5 py-2 text-[12.5px] font-bold text-white">
              Trimite notificare de apel în aplicația mobilă
            </button>
          </form>
          {memberPhones.map((p) => (
            <a
              key={p.phone}
              href={`tel:${p.phone}`}
              className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#344054]"
            >
              <Phone className="h-3.5 w-3.5 text-muted-2" /> Sună direct — {p.fullName} ({p.phone})
            </a>
          ))}
        </div>
      ) : (
        <div style={{ height: 360 }}>
          <MessagesThread
            conversationId={conversationId}
            initialMessages={initialMessages}
            currentProfileId={currentProfileId}
            participantNames={participantNames}
            quickReplies={ADMIN_QUICK_REPLIES}
            sendAction={sendTeamMessage}
            hiddenFields={{ teamId, jobId }}
          />
        </div>
      )}
    </div>
  );
}
