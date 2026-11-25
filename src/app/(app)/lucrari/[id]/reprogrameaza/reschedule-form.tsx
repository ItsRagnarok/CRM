"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { rescheduleWithReason, type RescheduleResult } from "./actions";
import { RESCHEDULE_REASONS, waNumber } from "@/lib/service-requests";
import { LiveScheduleWarnings } from "@/components/schedule-warnings";
import { DurationHint } from "@/components/duration-hint";
import type { DurationStat } from "@/lib/job-durations";

const input = "w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric";
const label = "mb-1.5 block text-[12.5px] font-semibold text-[#344054]";

export function RescheduleForm({
  jobId,
  title,
  teamId,
  domain,
  current,
  durations,
}: {
  jobId: string;
  title: string;
  teamId: string | null;
  domain: string | null;
  current: { date: string; start: string; end: string };
  durations: DurationStat[];
}) {
  const [state, action, pending] = useActionState<RescheduleResult | undefined, FormData>(rescheduleWithReason.bind(null, jobId), undefined);
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);

  if (state && "ok" in state) {
    const wa = waNumber(state.phone);
    return (
      <section className="flex flex-col gap-3 rounded-[12px] border border-border bg-white p-5" role="status">
        <div className="flex items-center gap-2 text-[15px] font-extrabold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-success" aria-hidden /> Lucrarea a fost mutată. Echipa a primit notificare.
        </div>
        <div className="text-[13px] font-semibold text-[#344054]">Mesaj pentru {state.clientName ?? "client"}, gata de trimis:</div>
        <textarea readOnly value={state.message} rows={9} className={`${input} bg-[#f9fafb] leading-relaxed`} aria-label="Mesajul pentru client" onFocus={(e) => e.currentTarget.select()} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try { await navigator.clipboard.writeText(state.message); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* textul rămâne selectabil */ }
            }}
            className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2 text-[13px] font-bold text-[#1f2024]"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? "Copiat" : "Copiază mesajul"}
          </button>
          {wa && (
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(state.message)}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] px-4 py-2 text-[13px] font-bold text-[#344054]">
              <MessageCircle className="h-3.5 w-3.5" /> Trimite pe WhatsApp
            </a>
          )}
          {state.phone && <a href={`sms:${state.phone}?body=${encodeURIComponent(state.message)}`} className="rounded-[10px] border border-[#d0d5dd] px-4 py-2 text-[13px] font-bold text-[#344054]">SMS</a>}
          {state.email && <a href={`mailto:${state.email}?subject=${encodeURIComponent("Reprogramare intervenție")}&body=${encodeURIComponent(state.message)}`} className="rounded-[10px] border border-[#d0d5dd] px-4 py-2 text-[13px] font-bold text-[#344054]">E-mail</a>}
          <Link href={`/lucrari/${jobId}`} className="ml-auto rounded-[10px] px-3 py-2 text-[13px] font-bold text-electric">Înapoi la lucrare</Link>
        </div>
        {!state.phone && !state.email && <p className="text-[12.5px] text-muted">Clientul nu are telefon sau e-mail salvat; copiază mesajul și trimite-l cum vorbiți de obicei.</p>}
      </section>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-[12px] border border-border bg-white p-5">
      {/* Citite de avertizări și de estimarea duratei. */}
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="teamId" value={teamId ?? ""} />
      <input type="hidden" name="domain" value={domain ?? ""} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="rs-date" className={label}>Noua dată</label>
          <input id="rs-date" name="date" type="date" required defaultValue={current.date} className={input} />
        </div>
        <div>
          <label htmlFor="rs-start" className={label}>Ora start</label>
          <input id="rs-start" name="start" type="time" defaultValue={current.start} className={input} />
        </div>
        <div>
          <label htmlFor="rs-end" className={label}>Ora sfârșit</label>
          <input id="rs-end" name="end" type="time" defaultValue={current.end} className={input} />
        </div>
      </div>
      <DurationHint stats={durations} names={{ start: "start", end: "end" }} />
      <LiveScheduleWarnings jobId={jobId} names={{ date: "date", start: "start", end: "end" }} />
      <div>
        <label htmlFor="rs-reason" className={label}>De ce se mută</label>
        <select id="rs-reason" name="reason" required value={reason} onChange={(e) => setReason(e.target.value)} className={input}>
          <option value="" disabled>Alege motivul</option>
          {RESCHEDULE_REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="rs-note" className={label}>{reason === "altul" ? "Motivul (apare în mesajul pentru client)" : "Notă internă (opțional)"}</label>
        <input id="rs-note" name="note" maxLength={500} required={reason === "altul"} className={input} />
      </div>
      {state && "error" in state && <p role="alert" className="text-[13px] font-semibold text-[#b42318]">{state.error}</p>}
      <button type="submit" disabled={pending} className="self-start rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-[#1f2024] disabled:opacity-60">
        {pending ? "Se mută…" : "Mută lucrarea și pregătește mesajul"}
      </button>
    </form>
  );
}
