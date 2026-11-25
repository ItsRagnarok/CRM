import { notFound, redirect } from "next/navigation";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrls } from "@/lib/storage";
import { todayInOrgTimeZone } from "@/lib/date";
import { PrintButton } from "@/app/rapoarte-lucrare/[id]/print-button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const when = (iso: string) => new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const day = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

/**
 * Proces-verbal de lucrări ascunse, generat din pozele cu eticheta „Ascuns” făcute de tehnician
 * înainte de acoperire și din lista de lucrări ascunse a lucrării. Model de lucru: conținutul
 * și semnatarii se stabilesc după proiect și contract.
 */
export default async function HiddenWorksReportPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!UUID.test(jobId)) notFound();
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) redirect("/mobil");
  const supabase = await createClient();
  const [{ data: job }, { data: works }, { data: photos }] = await Promise.all([
    supabase.from("jobs").select("id, display_number, title, scheduled_date, clients(name), locations(address)").eq("id", jobId).eq("organization_id", organization.id).maybeSingle(),
    supabase.from("electric_hidden_works").select("description, documented").eq("job_id", jobId).eq("organization_id", organization.id).order("created_at"),
    supabase.from("photos").select("id, storage_path, taken_at, profiles!photos_uploaded_by_fkey(full_name)").eq("job_id", jobId).eq("category", "hidden").order("taken_at"),
  ]);
  if (!job) notFound();
  const urls = await signedAttachmentUrls(supabase, (photos ?? []).map((p) => p.storage_path));
  const authors = [...new Set((photos ?? []).map((p) => p.profiles?.full_name).filter(Boolean))];
  const td = "border border-black px-2 py-1 align-top";

  return (
    <div className="mx-auto max-w-[820px] bg-white px-8 py-8 text-[12px] leading-snug text-black">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } @page { size: A4; margin: 12mm; } figure, tr { break-inside: avoid; } }`}</style>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-3 text-[13px]">
        <span>{(photos ?? []).length ? `${(photos ?? []).length} poze „Ascuns” din aplicație.` : "Nicio poză „Ascuns” încă: tehnicianul le face din aplicație, eticheta „Ascuns”, înainte de acoperire."} Verifică textul cu proiectul și contractul.</span>
        <PrintButton />
      </div>

      <div><b>{organization.name}</b>{organization.cui ? `, CUI ${organization.cui}` : ""}{organization.address ? ` · ${organization.address}` : ""}</div>
      <h1 className="mt-5 text-center text-[15px] font-bold uppercase">Proces-verbal de lucrări ascunse</h1>
      <div className="mb-4 text-center">Nr. ______ / data {day(todayInOrgTimeZone())}</div>

      <table className="w-full border-collapse">
        <tbody>
          <tr><td className={`${td} w-48 font-semibold`}>Lucrarea</td><td className={td}>#{job.display_number} · {job.title}</td></tr>
          <tr><td className={`${td} font-semibold`}>Beneficiar</td><td className={td}>{job.clients?.name ?? ""}</td></tr>
          <tr><td className={`${td} font-semibold`}>Adresa</td><td className={td}>{job.locations?.address ?? ""}</td></tr>
          <tr><td className={`${td} font-semibold`}>Executant</td><td className={td}>{organization.name}{authors.length ? ` · ${authors.join(", ")}` : ""}</td></tr>
        </tbody>
      </table>

      <p className="mt-4">Subsemnații am verificat pe teren, înainte de acoperire, următoarele lucrări, care urmează să devină ascunse:</p>
      <table className="mt-2 w-full border-collapse">
        <thead><tr><th className={`${td} w-10 text-left`}>Nr.</th><th className={`${td} text-left`}>Lucrarea care devine ascunsă</th><th className={`${td} w-40 text-left`}>Constatare</th></tr></thead>
        <tbody>
          {(works ?? []).map((w, i) => <tr key={i}><td className={td}>{i + 1}.</td><td className={td}>{w.description}</td><td className={td}>{w.documented ? "documentată cu poze" : ""}</td></tr>)}
          {Array.from({ length: Math.max(0, 3 - (works ?? []).length) }).map((_, i) => <tr key={`e${i}`}><td className={td}>{(works ?? []).length + i + 1}.</td><td className={`${td} h-7`} /><td className={td} /></tr>)}
        </tbody>
      </table>
      <p className="mt-3">Constatăm că lucrările de mai sus sunt executate conform proiectului și pot fi acoperite / nu pot fi acoperite până la remedierea următoarelor: ______________________________________________</p>

      {(photos ?? []).length > 0 && (
        <>
          <div className="mt-5 font-semibold">Anexă: fotografii făcute înainte de acoperire</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(photos ?? []).map((p, i) => (
              <figure key={p.id} className="border border-black p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urls.get(p.storage_path) ?? ""} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="mt-1 text-[11px]">Foto {i + 1} · {when(p.taken_at)}{p.profiles?.full_name ? ` · ${p.profiles.full_name}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 grid grid-cols-3 gap-4">
        {["Executant", "Beneficiar / diriginte de șantier", "Proiectant (dacă e cazul)"].map((t) => (
          <div key={t}><div className="font-semibold">{t}</div><div className="mt-1">Nume: ________________</div><div className="mt-6">Semnătura: ____________</div></div>
        ))}
      </div>
    </div>
  );
}
