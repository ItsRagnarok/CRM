import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { gasRecordDeadlines, type GasDeadline } from "@/lib/working-days";
import { EmptyState } from "@/components/empty-state";
import { markRecordDelivered, markRecordRegistered } from "../actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "de_inregistrat", label: "De înregistrat la operator" },
  { id: "de_predat", label: "De predat clientului" },
  { id: "toate", label: "Toate" },
] as const;
const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

function DeadlineBadge({ d }: { d: GasDeadline }) {
  if (d.done) return <span className="rounded-full bg-success-bg px-2.5 py-1 text-[12px] font-bold text-success">Făcut</span>;
  const cls = d.left < 0 ? "bg-danger-bg text-danger" : d.left <= 1 ? "bg-warning-bg text-warning" : "bg-neutral-bg text-neutral";
  const text = d.left < 0 ? `Depășit cu ${-d.left} ${d.left === -1 ? "zi lucrătoare" : "zile lucrătoare"}` : d.left === 0 ? "Azi e ultima zi" : `${d.left} ${d.left === 1 ? "zi lucrătoare" : "zile lucrătoare"}`;
  return <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${cls}`} title={`Termen: ${fmt(d.due)}`}>{text}</span>;
}

/** Fișele încheiate pe teren și ceasul de după ele: 5 zile lucrătoare la operator, apoi 2 până la client. */
export default async function GasRecordsPage({ searchParams }: { searchParams: Promise<{ stare?: string }> }) {
  const { stare } = await searchParams;
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "scadentar_gaze") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const filter = FILTERS.find((f) => f.id === stare)?.id ?? "de_inregistrat";

  const { data } = await supabase
    .from("gas_records")
    .select("id, kind, year, number, drawn_up_on, notice_due_on, conform, gas_interrupted, os_registered_on, os_registration_no, client_delivered_on, data, job_id, jobs(display_number), profiles!gas_records_completed_by_fkey(full_name)")
    .eq("organization_id", organization.id)
    .not("completed_at", "is", null)
    .order("drawn_up_on", { ascending: false })
    .limit(500);

  const rows = (data ?? []).map((r) => ({ ...r, dl: gasRecordDeadlines(r, today), d: (r.data ?? {}) as Record<string, unknown> }));
  const toRegister = rows.filter((r) => !r.os_registered_on);
  const toDeliver = rows.filter((r) => r.os_registered_on && !r.client_delivered_on);
  const overdue = rows.filter((r) => (r.dl.register && !r.dl.register.done && r.dl.register.left < 0) || (r.dl.deliver && !r.dl.deliver.done && r.dl.deliver.left < 0)).length;
  const shown = filter === "de_inregistrat" ? toRegister : filter === "de_predat" ? toDeliver : rows;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 p-6">
      <Link href="/gaze" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Înapoi la scadențar</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold">Fișe de evidență</h1>
          <p className="mt-1 max-w-[760px] text-sm text-muted">Fișele încheiate de tehnicieni pe telefon. Ord. ANRE 179/2015, art. 9: înregistrare la operator în cel mult 5 zile lucrătoare de la întocmire (dar nu după scadența din notificare), apoi exemplarul clientului în cel mult 2 zile lucrătoare. Zilele lucrătoare exclud weekendul și sărbătorile legale.</p>
        </div>
        <Link href="/gaze/registru" className="rounded-[10px] border border-border bg-white px-4 py-2.5 text-[13px] font-bold">Registrul anual →</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[["De înregistrat", toRegister.length, ""], ["De predat clientului", toDeliver.length, ""], ["Termene depășite", overdue, overdue ? "border-danger/40 bg-danger-bg" : ""]].map(([l, n, cls]) => (
          <div key={l as string} className={`rounded-2xl border border-border bg-white p-4 ${cls}`}><div className="text-xs font-semibold text-muted">{l}</div><div className="mt-1 text-[28px] font-extrabold tabular-nums">{n}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => <Link key={f.id} href={`/gaze/fise?stare=${f.id}`} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${filter === f.id ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>{f.label}</Link>)}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="Nicio fișă încă" description="Fișele apar aici când tehnicianul le încheie pe telefon (lucrare cu domeniul Gaze). Pentru un bloc, leagă lucrarea de bloc din pagina blocului." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[1080px] text-left text-[13.5px]">
            <thead><tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted"><th className="px-3 py-3">Nr. / data</th><th className="px-3 py-3">Tip</th><th className="px-3 py-3">Client și adresă</th><th className="px-3 py-3">Concluzie</th><th className="px-3 py-3">Operator (5 zile)</th><th className="px-3 py-3">Client (2 zile)</th><th className="px-3 py-3" /></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nimic de făcut aici.</td></tr>}
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-[#f2f4f7] align-top last:border-0">
                  <td className="px-3 py-3"><div className="font-bold tabular-nums">{r.number}/{r.year}</div><div className="text-xs text-muted">{fmt(r.drawn_up_on)}</div></td>
                  <td className="px-3 py-3 capitalize">{r.kind}<div className="text-xs text-muted">#{r.jobs?.display_number} · {r.profiles?.full_name ?? ""}</div></td>
                  <td className="px-3 py-3"><div className="font-semibold">{String(r.d.client ?? "—")}</div><div className="text-xs text-muted">{String(r.d.adresa ?? "")}</div></td>
                  <td className="px-3 py-3">
                    {r.conform ? <span className="rounded-full bg-success-bg px-2.5 py-1 text-[12px] font-bold text-success">Poate funcționa</span> : <span className="rounded-full bg-danger-bg px-2.5 py-1 text-[12px] font-bold text-danger">Neconform</span>}
                    {r.gas_interrupted && <div className="mt-1 text-xs font-bold text-danger">Gaz întrerupt</div>}
                  </td>
                  <td className="px-3 py-3">
                    {r.dl.register && <DeadlineBadge d={r.dl.register} />}
                    <div className="mt-1 text-xs text-muted">{r.os_registered_on ? `Nr. ${r.os_registration_no ?? "—"} din ${fmt(r.os_registered_on)}` : `Termen ${fmt(r.dl.register?.due ?? null)}`}</div>
                    {!readOnly && !r.os_registered_on && (
                      <form action={markRecordRegistered} className="mt-2 flex flex-wrap items-center gap-1.5">
                        <input type="hidden" name="id" value={r.id} />
                        <input name="no" placeholder="Nr. înregistrare" aria-label="Număr înregistrare la operator" className="w-32 rounded-lg border border-[#d0d5dd] px-2 py-1 text-[12.5px]" />
                        <input type="date" name="on" defaultValue={today} aria-label="Data înregistrării" className="rounded-lg border border-[#d0d5dd] px-2 py-1 text-[12.5px]" />
                        <button className="rounded-lg bg-electric px-2.5 py-1 text-[12.5px] font-bold">Înregistrată</button>
                      </form>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.dl.deliver ? <DeadlineBadge d={r.dl.deliver} /> : <span className="text-xs text-muted">după înregistrare</span>}
                    {r.client_delivered_on && <div className="mt-1 text-xs text-muted">Predată {fmt(r.client_delivered_on)}</div>}
                    {!readOnly && r.os_registered_on && !r.client_delivered_on && (
                      <form action={markRecordDelivered} className="mt-2 flex items-center gap-1.5">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="date" name="on" defaultValue={today} aria-label="Data predării" className="rounded-lg border border-[#d0d5dd] px-2 py-1 text-[12.5px]" />
                        <button className="rounded-lg border border-border px-2.5 py-1 text-[12.5px] font-semibold">Predată</button>
                      </form>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right"><Link href={`/fise-gaze/${r.id}`} target="_blank" className="font-semibold text-electric">Fișa / PDF →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
