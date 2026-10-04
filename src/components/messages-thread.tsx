"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export type ThreadMessage = {
  id: string;
  body: string;
  sender_profile_id: string;
  created_at: string;
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export function MessagesThread({
  conversationId,
  initialMessages,
  currentProfileId,
  participantNames,
  quickReplies = [],
  sendAction,
  hiddenFields,
}: {
  conversationId: string | null;
  initialMessages: ThreadMessage[];
  currentProfileId: string;
  participantNames: Record<string, string>;
  quickReplies?: string[];
  // A server action imported straight into this client component and used
  // as the form's action — the standard Next.js pattern, no API route needed.
  sendAction: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime push — this is what makes messages arrive instantly for
  // whoever has the thread open, instead of waiting on the periodic
  // AutoRefresh poll used elsewhere in the app (which is fine for a map
  // position, but reads as "broken chat" for a conversation).
  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as ThreadMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function submitWith(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const formData = new FormData();
    for (const [key, value] of Object.entries(hiddenFields)) formData.set(key, value);
    formData.set("body", trimmed);
    startTransition(() => sendAction(formData));
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto bg-[#fafafb] p-3.5">
        <div className="flex flex-col gap-2.5">
          {messages.length === 0 && (
            <p className="py-6 text-center text-[12.5px] text-muted">Niciun mesaj încă. Scrie primul.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_profile_id === currentProfileId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[12px] px-3 py-2 text-[12.5px] ${
                    mine ? "rounded-br-[3px] bg-electric text-white" : "rounded-bl-[3px] border border-[#eaecf0] bg-white"
                  }`}
                >
                  {m.body}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-2">
                  {mine ? "Tu" : participantNames[m.sender_profile_id] ?? "Cineva"} · {timeLabel(m.created_at)}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[#f2f4f7] p-2.5">
        {quickReplies.length > 0 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                disabled={pending}
                onClick={() => submitWith(q)}
                className="shrink-0 rounded-full border border-[#d0d5dd] px-2.5 py-1 text-[11px] font-semibold text-[#475467] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          ref={formRef}
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitWith(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrie un mesaj…"
            disabled={pending}
            className="flex-1 rounded-[10px] border border-[#d0d5dd] px-3 py-2 text-[12.5px] outline-none focus:border-electric disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-electric text-white disabled:opacity-40"
            aria-label="Trimite"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
