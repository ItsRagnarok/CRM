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
export function LiveScheduleWarnings({ jobId }: { jobId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[] | null>(null);
  const [busy, setBusy] = useState(false);

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
        date: String(fd.get("scheduledDate") ?? "") || new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" }),
        start: String(fd.get("startTime") ?? "") || (jobId ? null : nowHm()),
        end: String(fd.get("endTime") ?? "") || (jobId ? null : "20:00"),
        domain: String(fd.get("domain") ?? "") || null,
        materialIds: fd.getAll("requiredMaterialIds").map(String),
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
  }, [jobId]);

  return (
    <div ref={ref} aria-live="polite">
      {warnings && warnings.length > 0 ? (
        <WarningList warnings={warnings} />
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
