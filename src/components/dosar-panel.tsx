import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { FORM_TEMPLATES } from "@/lib/forms/templates";
import { JOB_STATUS_LABELS } from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";

type JobStatus = Database["public"]["Enums"]["job_status"];
type Check = { key: string; ok: boolean; title: string; detail: string };
const lei = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} lei`;
const STEPS = ["Programată", "În drum", "Execuție", "Predată", "Facturată", "Încasată"];

/**
 * "Dosar complet" and "Bani pe lucrare" from the platform mockup, computed from what the
 * platform really has: forms, photos, signatures, documents, invoices and the validity of
 * the assigned technicians' authorizations. No judgement of measurements.
 */
export async function DosarPanel({
  job, organization,
}: {
  job: { id: string; status: JobStatus; domain: string | null; scheduled_date: string; require_arrival_photo: boolean; require_during_photo: boolean; require_final_photo: boolean };
  organization: { id: string; enabled_modules: string[] };
}) {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [forms, photos, signatures, documents, invoices, expenses, assigned] = await Promise.all([
    supabase.from("job_forms").select("template, completed_at").eq("job_id", job.id),
    supabase.from("photos").select("id", head).eq("job_id", job.id),
    supabase.from("signatures").select("id", head).eq("job_id", job.id),
    supabase.from("documents").select("id", head).eq("job_id", job.id),
    supabase.from("invoices").select("total_amount, status").eq("job_id", job.id),
    supabase.from("expenses").select("amount").eq("job_id", job.id).eq("status", "approved"),
    supabase.from("job_assignments").select("profile_id, profiles(full_name)").eq("job_id", job.id),
  ]);

  const checks: Check[] = [];
  const required = Object.values(FORM_TEMPLATES).filter((t) => job.domain && t.domain === job.domain);
  for (const t of required) {
    const f = (forms.data ?? []).find((x) => x.template === t.id);
    checks.push({ key: `f-${t.id}`, ok: Boolean(f?.completed_at), title: t.label, detail: f?.completed_at ? "Completat de tehnician" : f ? "Început, nefinalizat" : "Încă nu a fost început" });
  }
  if (hasModule(organization.enabled_modules, "conformitate") && (assigned.data ?? []).length > 0) {
    const ids = (assigned.data ?? []).map((a) => a.profile_id);
    const { data: items } = await supabase.from("compliance_items").select("profile_id, expires_on").eq("organization_id", organization.id).eq("kind", "person").in("profile_id", ids);
    const missing = (assigned.data ?? []).filter((a) => !(items ?? []).some((i) => i.profile_id === a.profile_id && i.expires_on >= job.scheduled_date));
    checks.push({ key: "auth", ok: missing.length === 0, title: "Autorizații valabile la data lucrării", detail: missing.length === 0 ? "Verificat automat în registrul de conformitate" : `Fără document valabil: ${missing.map((m) => m.profiles?.full_name ?? "—").join(", ")}` });
  }
  const needPhotos = [job.require_arrival_photo, job.require_during_photo, job.require_final_photo].filter(Boolean).length;
  checks.push({ key: "photos", ok: (photos.count ?? 0) >= Math.max(1, needPhotos), title: "Fotografii", detail: `${photos.count ?? 0} fotografii${needPhotos ? ` · ${needPhotos} etape cerute` : ""}` });
  checks.push({ key: "sign", ok: (signatures.count ?? 0) > 0, title: "Semnătura clientului", detail: signatures.count ? "Semnat" : "Se obține la închiderea lucrării" });
  checks.push({ key: "docs", ok: (documents.count ?? 0) > 0, title: "Documente încărcate", detail: documents.count ? `${documents.count} documente` : "Nimic încărcat încă" });

  const done = checks.filter((c) => c.ok).length;
  const billed = (invoices.data ?? []).reduce((a, i) => a + Number(i.total_amount ?? 0), 0);
  const paid = (invoices.data ?? []).filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.total_amount ?? 0), 0);
  const spent = (expenses.data ?? []).reduce((a, e) => a + Number(e.amount ?? 0), 0);
  const stepNow = (invoices.data ?? []).length ? ((invoices.data ?? []).every((i) => i.status === "paid") ? 5 : 4) : job.status === "finalizata" ? 3 : ["ajunsa", "in_lucru", "pauza", "necesita_atentie"].includes(job.status) ? 2 : job.status === "in_drum" ? 1 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[13px] border border-border bg-white p-5">
        <ol className="flex flex-wrap gap-1.5" aria-label="Parcursul lucrării">
          {STEPS.map((s, i) => (
            <li key={s} className={`rounded-full px-3 py-1 text-[12px] font-bold ${i < stepNow ? "bg-success-bg text-success" : i === stepNow ? "bg-[#c6ff4a] text-[#16210a]" : "bg-neutral-bg text-muted"}`}>{s}</li>
          ))}
        </ol>
        <p className="mt-2 text-[12px] text-muted">Stare curentă: {JOB_STATUS_LABELS[job.status]}</p>
      </div>

      <div className="rounded-[13px] border border-border bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[14px] font-bold">Dosar complet? {done} din {checks.length}</h3>
          <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${done === checks.length ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>{done === checks.length ? "Complet" : `${checks.length - done} lipsesc`}</span>
        </div>
        <ul className="divide-y divide-[#eef0f4]">
          {checks.map((c) => (
            <li key={c.key} className="flex items-start gap-3 py-2.5 text-[13.5px]">
              <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${c.ok ? "bg-success-bg text-success" : "bg-[#f2f4f7] text-muted"}`} aria-label={c.ok ? "îndeplinit" : "lipsește"}>{c.ok ? "✓" : "–"}</span>
              <span><b className="block font-semibold">{c.title}</b><span className="text-[12px] text-muted">{c.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[13px] border border-border bg-white p-5">
        <h3 className="mb-2 text-[14px] font-bold">Bani pe lucrare</h3>
        <div className="grid grid-cols-3 gap-3 text-[13px]">
          <div><div className="text-muted">Facturat</div><div className="text-[18px] font-extrabold tabular-nums">{lei(billed)}</div></div>
          <div><div className="text-muted">Încasat</div><div className="text-[18px] font-extrabold tabular-nums">{lei(paid)}</div></div>
          <div><div className="text-muted">Cheltuieli aprobate</div><div className="text-[18px] font-extrabold tabular-nums">{lei(spent)}</div></div>
        </div>
        <p className="mt-2 text-[11.5px] text-muted">Marja pe lucrare apare când și manopera și materialele sunt calculate pe lucrare; aici vezi doar ce e deja înregistrat.</p>
      </div>
    </div>
  );
}
