import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { HiddenForm, MeasurementForm, ReportForm, SignForm } from "../electric-forms";
import { deleteHidden, deleteMeasurement, deleteReport, toggleHidden } from "../actions";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const v = (n: number | null, unit: string) => (n === null ? "—" : `${Number(n).toLocaleString("ro-RO")} ${unit}`);

export default async function ElectricJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "buletine_electrice") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  if (!UUID.test(jobId)) notFound();
  const supabase = await createClient();
  const org = organization.id;
  const today = todayInOrgTimeZone();

  const [{ data: job }, { data: meas }, { data: reports }, { data: hidden }, { data: assigned }, { data: auths }] = await Promise.all([
    supabase.from("jobs").select("id, display_number, title, clients(name)").eq("id", jobId).eq("organization_id", org).maybeSingle(),
    supabase.from("electric_measurements").select("*").eq("job_id", jobId).eq("organization_id", org).order("created_at"),
    supabase.from("electric_reports").select("id, title, signed_on, signer_profile_id, profiles(full_name)").eq("job_id", jobId).eq("organization_id", org).order("created_at"),
    supabase.from("electric_hidden_works").select("id, description, documented").eq("job_id", jobId).eq("organization_id", org).order("created_at"),
    supabase.from("profiles").select("id, full_name").eq("organization_id", org).eq("is_active", true).order("full_name"),
    hasModule(organization.enabled_modules, "conformitate")
      ? supabase.from("compliance_items").select("profile_id, title, expires_on").eq("organization_id", org).eq("kind", "person").ilike("title", "%ANRE%").gte("expires_on", today)
      : Promise.resolve({ data: [] as { profile_id: string | null; title: string; expires_on: string }[] }),
  ]);
  if (!job) notFound();

  const authorized = new Map((auths ?? []).filter((a) => a.profile_id).map((a) => [a.profile_id as string, a]));
  const signers = (assigned ?? []).filter((p) => authorized.has(p.id)).map((p) => ({ id: p.id, name: p.full_name }));
  const hiddenOpen = (hidden ?? []).filter((h) => !h.documented).length;

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 p-6">
      <Link href="/electric" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Înapoi la lucrările electrice</Link>
      <div><h1 className="text-[22px] font-extrabold">#{job.display_number} · {job.title}</h1>{job.clients?.name && <p className="mt-1 text-sm text-muted">{job.clients.name}</p>}</div>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-3 text-[15px] font-bold">Tablouri, circuite și măsurători</h2>
        {(meas ?? []).length === 0 ? <p className="text-sm text-muted">Nicio măsurătoare încă.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead><tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted"><th className="py-2 pr-3">Tablou / circuit</th><th className="py-2 pr-3">Izolație</th><th className="py-2 pr-3">Buclă</th><th className="py-2 pr-3">Continuitate</th><th className="py-2 pr-3">Rezultat stabilit</th><th className="py-2" /></tr></thead>
              <tbody>
                {(meas ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-[#f2f4f7] last:border-0 align-top">
                    <td className="py-2.5 pr-3"><b>{m.label}</b><div className="text-xs text-muted">{m.kind === "tablou" ? "Tablou" : "Circuit"}{m.notes ? ` · ${m.notes}` : ""}</div></td>
                    <td className="py-2.5 pr-3 tabular-nums">{v(m.insulation_mohm, "MΩ")}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{v(m.loop_ohm, "Ω")}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{v(m.continuity_ohm, "Ω")}</td>
                    <td className="py-2.5 pr-3">{m.result ? <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${m.result === "conform" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>{m.result === "conform" ? "Conform" : "Neconform"}</span> : <span className="rounded-full bg-warning-bg px-2.5 py-1 text-[12px] font-bold text-warning">Nestabilit</span>}</td>
                    <td className="py-2.5 text-right">{!readOnly && <form action={deleteMeasurement}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="jobId" value={jobId} /><button className="text-[12.5px] font-semibold text-danger">Șterge</button></form>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[12px] text-muted">Platforma nu judecă valorile: limitele depind de normativ, iar rezultatul îl stabilește persoana autorizată.</p>
      </section>
      {!readOnly && <MeasurementForm jobId={jobId} />}

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-3 text-[15px] font-bold">Buletine și procese-verbale</h2>
        {(reports ?? []).length === 0 ? <p className="text-sm text-muted">Niciun document încă.</p> : (
          <ul className="divide-y divide-[#eef0f4]">
            {(reports ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-[13.5px]">
                <span className="min-w-0 flex-1"><b className="block">{r.title}</b>{r.signed_on ? <span className="text-xs text-muted">Semnat {fmt(r.signed_on)} de {r.profiles?.full_name ?? "—"}</span> : <span className="text-xs text-warning">Nesemnat{signers.length === 0 ? ": nicio persoană din firmă nu are autorizație ANRE valabilă în registru" : ""}</span>}</span>
                {r.signed_on ? <span className="rounded-full bg-success-bg px-2.5 py-1 text-[12px] font-bold text-success">Semnat</span> : !readOnly && (
                  <div className="flex flex-wrap items-center gap-2">
                    <SignForm reportId={r.id} jobId={jobId} signers={signers.length ? signers : (assigned ?? []).map((p) => ({ id: p.id, name: p.full_name }))} />
                    <form action={deleteReport}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="jobId" value={jobId} /><button className="text-[12.5px] font-semibold text-danger">Șterge</button></form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[12px] text-muted">Un document se semnează doar de o persoană cu autorizație ANRE valabilă în registrul de conformitate.</p>
        {!readOnly && <div className="mt-3"><ReportForm jobId={jobId} /></div>}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-1 text-[15px] font-bold">Lucrări ascunse</h2>
        <p className="mb-3 text-[12px] text-muted">{hiddenOpen ? `${hiddenOpen} de documentat cu poze și proces-verbal înainte de acoperire.` : "Documentează cu poze înainte să acoperi traseele."}</p>
        {(hidden ?? []).length > 0 && (
          <ul className="mb-3 divide-y divide-[#eef0f4]">
            {(hidden ?? []).map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                <span className="flex-1">{h.description}</span>
                {!readOnly ? (
                  <>
                    <form action={toggleHidden}><input type="hidden" name="id" value={h.id} /><input type="hidden" name="jobId" value={jobId} /><input type="hidden" name="documented" value={h.documented ? "0" : "1"} /><button className={`rounded-full px-3 py-1 text-[12px] font-bold ${h.documented ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>{h.documented ? "Documentat" : "De documentat"}</button></form>
                    <form action={deleteHidden}><input type="hidden" name="id" value={h.id} /><input type="hidden" name="jobId" value={jobId} /><button className="text-[12.5px] font-semibold text-danger">Șterge</button></form>
                  </>
                ) : <span className="text-xs">{h.documented ? "Documentat" : "De documentat"}</span>}
              </li>
            ))}
          </ul>
        )}
        {!readOnly && <HiddenForm jobId={jobId} />}
      </section>
    </div>
  );
}
