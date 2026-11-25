import { notFound, redirect } from "next/navigation";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/app/rapoarte-lucrare/[id]/print-button";
import { categoryLabel, conditionLabel } from "@/lib/tools";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const when = (iso: string) => new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const day = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

/** Proces-verbal de predare-primire pentru o sculă, din înregistrarea din registru (cu confirmarea din aplicație). */
export default async function ToolHandoverPvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) redirect("/mobil");
  const supabase = await createClient();
  const { data: h } = await supabase
    .from("tool_handovers")
    .select("*, tools(name, category, serial, inventory_code, value, needs_calibration, compliance_items(expires_on))")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!h || !h.tools) notFound();
  const ids = [h.from_profile_id, h.to_profile_id, h.created_by, h.confirmed_by].filter(Boolean) as string[];
  const [{ data: people }, { data: org }, { data: vehicle }] = await Promise.all([
    ids.length ? supabase.from("profiles").select("id, full_name").in("id", ids) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    supabase.from("organizations").select("name, cui, address").eq("id", organization.id).maybeSingle(),
    h.to_vehicle_id ? supabase.from("vehicles").select("name, plate_number").eq("id", h.to_vehicle_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const name = (pid: string | null) => (pid ? (people ?? []).find((p) => p.id === pid)?.full_name ?? "—" : null);
  const t = h.tools;
  const predare = h.kind === "predare";
  const giver = predare ? name(h.from_profile_id) ?? `${org?.name ?? organization.name} (depozit), prin ${name(h.created_by) ?? "birou"}` : name(h.from_profile_id) ?? "—";
  const receiver = predare ? name(h.to_profile_id) ?? "—" : `${org?.name ?? organization.name} (depozit), prin ${name(h.confirmed_by) ?? "birou"}`;
  const td = "border border-black px-2 py-1.5 align-top";

  return (
    <div className="mx-auto max-w-[820px] bg-white px-8 py-8 text-[12.5px] leading-snug text-black">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } @page { size: A4; margin: 14mm; } }`}</style>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-3 text-[13px]">
        <span>{h.status === "confirmata" ? "Primirea a fost confirmată în aplicație; confirmarea apare mai jos." : "Primirea nu e încă confirmată în aplicație. Poți tipări PV-ul și semna pe hârtie."}</span>
        <PrintButton />
      </div>
      <div className="flex justify-between gap-6">
        <div>
          <div className="font-bold">{org?.name ?? organization.name}</div>
          {org?.cui && <div>CUI {org.cui}</div>}
          {org?.address && <div>{org.address}</div>}
        </div>
        <div className="text-right">Nr. {id.slice(0, 8).toUpperCase()}<br />Data: {when(h.created_at)}</div>
      </div>
      <h1 className="mt-6 text-center text-[16px] font-bold uppercase">Proces-verbal de {predare ? "predare-primire" : "restituire"} a echipamentului de muncă</h1>
      <p className="mt-4">
        Subsemnații <b>{giver}</b>, în calitate de predător, și <b>{receiver}</b>, în calitate de primitor, am procedat la {predare ? "predarea" : "restituirea"} următorului echipament
        {predare && vehicle ? <>, care va fi păstrat în autovehiculul <b>{vehicle.name}{vehicle.plate_number ? ` (${vehicle.plate_number})` : ""}</b></> : null}:
      </p>
      <table className="mt-3 w-full border-collapse">
        <thead><tr><th className={td}>Denumire</th><th className={td}>Tip</th><th className={td}>Serie</th><th className={td}>Cod inventar</th><th className={td}>Valoare (lei)</th><th className={td}>Stare</th></tr></thead>
        <tbody><tr>
          <td className={td}>{t.name}</td><td className={td}>{categoryLabel(t.category)}</td><td className={td}>{t.serial ?? "—"}</td><td className={td}>{t.inventory_code ?? "—"}</td>
          <td className={td}>{t.value != null ? Number(t.value).toLocaleString("ro-RO", { minimumFractionDigits: 2 }) : "—"}</td>
          <td className={td}>{conditionLabel(h.condition_confirmed ?? h.condition)}</td>
        </tr></tbody>
      </table>
      {t.needs_calibration && <p className="mt-3">Calibrare / verificare metrologică valabilă până la: <b>{t.compliance_items?.expires_on ? day(t.compliance_items.expires_on) : "nedeclarată"}</b>.</p>}
      {h.note && <p className="mt-2">Observații la predare: {h.note}</p>}
      {h.confirm_note && <p className="mt-1">Observații la primire: {h.confirm_note}</p>}
      <p className="mt-3">Primitorul se obligă să folosească echipamentul conform destinației, să îl păstreze în bune condiții și să anunțe imediat orice defecțiune, pierdere sau furt. Răspunderea pentru pagube se stabilește potrivit Codului muncii și contractului individual de muncă.</p>
      {h.status === "confirmata" && h.confirmed_at && (
        <p className="mt-3 rounded border border-black p-2">Primire confirmată electronic de <b>{name(h.confirmed_by)}</b> în aplicația ElectroField, la {when(h.confirmed_at)}.</p>
      )}
      <div className="mt-12 grid min-h-[110px] grid-cols-2 gap-10">
        <div className="flex flex-col">Am predat,<b>{giver}</b><div className="mt-auto border-t border-black pt-1">Semnătura</div></div>
        <div className="flex flex-col">Am primit,<b>{receiver}</b><div className="mt-auto border-t border-black pt-1">Semnătura</div></div>
      </div>
      <p className="no-print mt-8 text-[11px] text-[#667085]">Model de lucru. Verifică textul cu regulamentul intern și cu un jurist înainte să îl folosești ca act de răspundere materială.</p>
    </div>
  );
}
