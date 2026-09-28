import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/status";
import { PrintButton } from "./print-button";

export default async function JobReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "*, clients(name, address), locations(address), teams(name), job_assignments(profiles(full_name))"
    )
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!job) notFound();

  const [{ data: expenses }, { data: checklist }, { data: photos }, { data: signature }] = await Promise.all([
    supabase.from("expenses").select("category, vendor, amount, currency").eq("job_id", id),
    supabase
      .from("job_checklists")
      .select("job_checklist_items(label, is_checked)")
      .eq("job_id", id)
      .eq("phase", "after")
      .maybeSingle(),
    supabase.from("photos").select("id").eq("job_id", id),
    supabase.from("signatures").select("signer_name, signed_at, storage_path").eq("job_id", id).maybeSingle(),
  ]);

  const assignees = job.job_assignments.map((a) => a.profiles?.full_name).filter((n): n is string => Boolean(n));
  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const checklistItems = checklist?.job_checklist_items ?? [];
  const signatureUrl = signature ? supabase.storage.from("attachments").getPublicUrl(signature.storage_path).data.publicUrl : null;

  return (
    <div className="mx-auto max-w-[800px] p-10 font-sans text-[#101828]">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <div className="flex items-center justify-between border-b-2 border-[#101828] pb-4">
        <div>
          <div className="text-[20px] font-extrabold">{organization.name}</div>
          <div className="text-[13px] text-[#667085]">Raport de intervenție</div>
        </div>
        <div className="text-right text-[13px] text-[#667085]">
          Generat: {new Date().toLocaleString("ro-RO")}
        </div>
      </div>

      <h1 className="mt-6 text-[22px] font-extrabold">
        Lucrare #{job.display_number} — {job.title}
      </h1>
      <div className="mt-1 text-[13px] text-[#667085]">
        Status: {JOB_STATUS_LABELS[job.status]} · Tip: {JOB_TYPE_LABELS[job.job_type]}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 rounded-[10px] border border-[#eaecf0] p-5 text-[13px]">
        <div>
          <div className="font-semibold text-[#98a2b3]">CLIENT</div>
          <div className="mt-1 font-bold">{job.clients?.name ?? "—"}</div>
        </div>
        <div>
          <div className="font-semibold text-[#98a2b3]">ADRESĂ</div>
          <div className="mt-1 font-bold">{job.locations?.address ?? job.clients?.address ?? "—"}</div>
        </div>
        <div>
          <div className="font-semibold text-[#98a2b3]">ECHIPĂ / TEHNICIENI</div>
          <div className="mt-1 font-bold">{assignees.length > 0 ? assignees.join(", ") : (job.teams?.name ?? "—")}</div>
        </div>
        <div>
          <div className="font-semibold text-[#98a2b3]">DATA</div>
          <div className="mt-1 font-bold">{job.scheduled_date}</div>
        </div>
      </div>

      {job.description && (
        <div className="mt-6">
          <h2 className="text-[14.5px] font-bold">Descriere lucrare</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#344054]">{job.description}</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-[14.5px] font-bold">Checklist</h2>
        {checklistItems.length > 0 ? (
          <ul className="mt-1.5 flex flex-col gap-1 text-[13px]">
            {checklistItems.map((item, i) => (
              <li key={i}>
                {item.is_checked ? "✅" : "⬜"} {item.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-[13px] text-[#98a2b3]">Fără checklist completat.</p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-[14.5px] font-bold">Cheltuieli</h2>
        {expenses && expenses.length > 0 ? (
          <>
            <table className="mt-1.5 w-full border-collapse text-[13px]">
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i} className="border-b border-[#f2f4f7]">
                    <td className="py-1.5">{e.vendor ? `${e.vendor} — ${e.category}` : e.category}</td>
                    <td className="py-1.5 text-right font-bold">{Number(e.amount).toFixed(2)} {e.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1.5 flex justify-end text-[13.5px] font-extrabold">Total: {total.toFixed(2)} RON</div>
          </>
        ) : (
          <p className="mt-1.5 text-[13px] text-[#98a2b3]">Nicio cheltuială înregistrată.</p>
        )}
      </div>

      <div className="mt-6 text-[13px] text-[#667085]">
        {(photos ?? []).length} fotografii atașate lucrării.
      </div>

      <div className="mt-10">
        <h2 className="text-[14.5px] font-bold">Semnătură client</h2>
        {signature && signatureUrl ? (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signatureUrl} alt="Semnătură" className="h-[70px]" />
            <div className="mt-1 text-[12px] text-[#98a2b3]">
              Semnat de {signature.signer_name}, {new Date(signature.signed_at).toLocaleString("ro-RO")}
            </div>
          </div>
        ) : (
          <div className="mt-2 h-[70px] w-[220px] border-b border-[#d0d5dd]" />
        )}
      </div>
    </div>
  );
}
