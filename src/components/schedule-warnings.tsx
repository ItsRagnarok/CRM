"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { ScheduleWarning } from "@/lib/schedule-warnings";
import { checkScheduleWarnings } from "@/app/(app)/lucrari/schedule-warnings-action";

/** Ora de acum în România, ca la salvarea unei lucrări noi fără oră de start. */
const nowHm = () => new Date().toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hour12: false });

/** Lista de avertizări, folosită în formulare, în pagina lucrării și după mutarea în calendar. */
export function WarningList({ warnings, compact = false, footer = "Poți salva oricum; avertizările te ajută să nu trimiți echipa cu probleme." }: { warnings: ScheduleWarning[]; compact?: boolean; footer?: string | null }) {
  if (!warnings.length) return null;
  const bad = warnings.some((w) => w.level === "bad");
  return (
    <div
      role="status"
      className={`rounded-[12px] border px-4 py-3 ${bad ? "border-[#f3b4ae] bg-[#fef3f2]" : "border-[#f5c27a] bg-[#fffaf0]"}`}
    >
      <div className={`mb-1.5 flex items-center gap-1.5 text-[13px] font-bold ${bad ? "text-[#b42318]" : "text-[#93370d]"}`}>
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {warnings.length === 1 ? "O avertizare pentru programarea asta" : `${warnings.length} avertizări pentru programarea asta`}
      </div>
      <ul className="flex flex-col gap-1">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
            <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${w.level === "bad" ? "bg-[#d92d20]" : "bg-[#f79009]"}`} aria-hidden />
            <span className="flex-1">
              {w.text}
              {w.href && !compact && (
                <>
                  {" "}
                  <Link href={w.href} className="font-semibold text-electric underline-offset-2 hover:underline">
                    Vezi
                  </Link>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {!compact && footer && <p className="mt-2 text-[11.5px] text-muted">{footer}</p>}
    </div>
  );
}

/**
 * Citește formularul din jur (echipă, dată, ore, domeniu, materiale bifate) și arată pe loc
 * ce nu se potrivește. Ascultă orice schimbare din formular, inclusiv câmpurile ascunse.
 */
export function LiveScheduleWarnings({ jobId, names = { date: "scheduledDate", start: "startTime", end: "endTime" } }: { jobId?: string; names?: { date: string; start: string; end: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [guardHit, setGuardHit] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = "";
    let seq = 0;
    const run = () => {
      const fd = new FormData(form);
      const req = {
        jobId: jobId ?? null,
        teamId: String(fd.get("teamId") ?? "") || null,
        date: String(fd.get(names.date) ?? "") || new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" }),
        start: String(fd.get(names.start) ?? "") || (jobId ? null : nowHm()),
        end: String(fd.get(names.end) ?? "") || (jobId ? null : "20:00"),
        domain: String(fd.get("domain") ?? "") || null,
        materialIds: fd.getAll("requiredMaterialIds").map(String),
        atHeight: form.querySelector('[name="atHeight"]') ? fd.get("atHeight") === "on" : null,
      };
      // Pe formularul de editare materialele vin din lucrare (null = ia-le din baza de date).
      const payload = { ...req, materialIds: jobId && req.materialIds.length === 0 ? null : req.materialIds };
      const key = JSON.stringify(payload);
      if (key === last) return;
      last = key;
      const mine = ++seq;
      setBusy(true);
      checkScheduleWarnings(payload)
        .then((w) => mine === seq && setWarnings(w))
        .catch(() => mine === seq && setWarnings(null))
        .finally(() => mine === seq && setBusy(false));
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, 450);
    };
    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(form, { childList: true, subtree: true });
    schedule();
    return () => {
      clearTimeout(timer);
      form.removeEventListener("input", schedule);
      form.removeEventListener("change", schedule);
      mo.disconnect();
    };
  }, [jobId, names.date, names.start, names.end]);

  // Lucrul la înălțime fără „apt”: oprim trimiterea aici (serverul verifică oricum), ca formularul
  // să nu se golească după un refuz.
  const heightBlock = Boolean(warnings?.some((w) => w.kind === "inaltime"));
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form || !heightBlock) return;
    const guard = (e: SubmitEvent) => {
      const fd = new FormData(form);
      if (fd.get("ssmOverride") === "on" && String(fd.get("ssmOverrideNote") ?? "").trim().length >= 5) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const box = form.querySelector<HTMLInputElement>('[name="ssmOverride"]');
      (box?.checked ? form.querySelector<HTMLInputElement>('[name="ssmOverrideNote"]') : box)?.focus();
      setGuardHit(true);
    };
    form.addEventListener("submit", guard, true);
    return () => form.removeEventListener("submit", guard, true);
  }, [heightBlock]);

  return (
    <div ref={ref} aria-live="polite">
      {warnings && warnings.length > 0 ? (
        <>
          <WarningList warnings={warnings} footer={warnings.some((w) => w.kind === "inaltime") ? "Celelalte avertizări nu blochează salvarea; lucrul la înălțime fără „apt” da." : undefined} />
          {warnings.some((w) => w.kind === "inaltime") && (
            <div className="mt-2 flex flex-col gap-2 rounded-[10px] border border-danger/40 bg-danger-bg/40 p-3 text-[12.5px] text-[#344054]">
              <b className="text-danger" role={guardHit ? "alert" : undefined}>Lucrarea la înălțime nu se salvează așa.{guardHit ? " Bifează confirmarea și scrie motivul, sau rezolvă mai întâi." : ""}</b>
              <span>Adaugă „apt pentru lucru la înălțime” în Conformitate, schimbă echipa, sau confirmă pe răspunderea ta, cu motivul (rămâne notat pe lucrare).</span>
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="ssmOverride" className="h-4 w-4" /> Confirm alocarea</label>
              <input name="ssmOverrideNote" maxLength={300} placeholder="Motivul (ex. fișa medicală nouă e la birou, o încarc azi)" className="rounded-[8px] border border-[#d0d5dd] bg-white px-3 py-2 text-[13px]" />
            </div>
          )}
        </>
      ) : warnings && !busy ? (
        <div className="flex items-center gap-1.5 text-[12px] text-muted">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> Nicio problemă la programare: autorizații, mașină, concedii, suprapuneri, stoc.
        </div>
      ) : busy ? (
        <div className="flex items-center gap-1.5 text-[12px] text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Verific programarea…
        </div>
      ) : null}
    </div>
  );
}
