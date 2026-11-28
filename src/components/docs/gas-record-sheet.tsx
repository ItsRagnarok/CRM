import { GAS_TEMPLATES } from "@/lib/forms/gas-record";
import type { OpsValue } from "@/lib/forms/templates";
import type { Database } from "@/lib/supabase/database.types";

const fmt = (d: unknown) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const txt = (v: unknown) => (v === undefined || v === null || v === "" ? "" : String(v));
const X = ({ on }: { on: boolean }) => <span className="inline-block w-6 text-center font-bold">{on ? "X" : ""}</span>;
// Semnăturile sunt imagini mici (data:image/png) salvate în fișă; next/image nu are ce optimiza aici.
// eslint-disable-next-line @next/next/no-img-element
const Sig = ({ src, className }: { src: string; className: string }) => <img src={src} alt="Semnătură" className={className} />;

const MOTIV: Record<string, string> = {
  periodic: "La intervale de maximum {n} ani",
  cerere: "La cererea clientului final",
  intrerupere: "După o întrerupere a utilizării mai mare de 6 luni",
  eveniment: "După un eveniment care poate afecta instalația",
};
const ROBINET: Record<string, string> = { incendiu: "robinetul de incendiu", contor: "robinetul contorului", sectionare: "robinetul de secționare", aparat: "robinetul aparatului" };

type Org = { name: string; cui?: string | null; address?: string | null; phone?: string | null; email?: string | null };
type Auth = { title: string; expires_on: string | null } | null;
type GasRecord = Database["public"]["Tables"]["gas_records"]["Row"];

/** Fișa de evidență, în forma din anexa 4 / 5 (Ord. ANRE 179/2015). Folosită în platformă (tipărire) și în aplicație. */
export function GasRecordSheet({ r, auth, organization, toolbar }: { r: GasRecord; auth: Auth; organization: Org; toolbar?: React.ReactNode }) {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const kind = r.kind === "revizie" ? "revizie" : "verificare";
  const t = GAS_TEMPLATES[kind];
  const opsItems = t.steps.flatMap((s) => s.fields ?? []).find((f) => f.type === "ops")?.items ?? [];
  const ops = (d.operatiuni ?? {}) as OpsValue;
  const aparate = Array.isArray(d.aparate) ? (d.aparate as Record<string, string>[]) : [];
  const defecte = Array.isArray(d.defecte) ? (d.defecte as Record<string, string>[]) : [];
  const lucrare = kind === "revizie" ? "revizie" : "verificare";
  const sig = (k: string) => (typeof d[k] === "string" && (d[k] as string).startsWith("data:image/png") ? (d[k] as string) : null);

  const th = "border border-black px-1.5 py-1 text-left align-top font-semibold";
  const td = "border border-black px-1.5 py-1 align-top";

  return (
    <div className="mx-auto max-w-[820px] bg-white px-8 py-8 text-[11.5px] leading-snug text-black">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } @page { size: A4; margin: 12mm; } tr, .keep { break-inside: avoid; } }`}</style>
      {toolbar}

      <div className="flex justify-between gap-6">
        <div>
          <div>Operator de sistem: ______________________</div>
          <div>Număr/dată înregistrare la operatorul de sistem: {r.os_registration_no ? `${r.os_registration_no} / ${fmt(r.os_registered_on)}` : "______________"}</div>
        </div>
      </div>
      <div className="mt-3">
        <div>Operator economic autorizat ANRE: <b>{organization.name}</b>{organization.cui ? `, CUI ${organization.cui}` : ""}</div>
        <div>Autorizație ANRE: {auth ? `${auth.title}${auth.expires_on ? `, valabilă până la ${fmt(auth.expires_on)}` : ""}` : "tip ____, nr. ____/an ____, valabilă până la ________"}</div>
        <div>Adresă sediu: {organization.address ?? "______________________"} · Tel: {organization.phone ?? "________"} · Email: {organization.email ?? "________"}</div>
      </div>

      <h1 className="mt-5 text-center text-[15px] font-bold uppercase">Fișa de evidență</h1>
      <div className="text-center font-semibold">a lucrărilor periodice de {lucrare} tehnică a instalației de utilizare a gazelor naturale</div>
      <div className="mb-3 text-center">Nr. {r.number ?? "____"} / data {fmt(r.drawn_up_on)}</div>

      <table className="w-full border-collapse">
        <tbody>
          <tr><td className={td}>1.</td><td className={th}>Clientul final</td><td className={td}>{txt(d.client)}</td></tr>
          <tr><td className={td}>2.</td><td className={th}>Adresa locului de consum</td><td className={td}>{txt(d.adresa)}</td></tr>
          <tr><td className={td}>3.</td><td className={th}>Codul locului de consum</td><td className={td}>{txt(d.cod_loc)}</td></tr>
          <tr><td className={td}>4.</td><td className={th}>Contractul de prestări servicii</td><td className={td}>{[txt(d.contract_nr) && `Nr. ${txt(d.contract_nr)}`, fmt(d.contract_data) && `din ${fmt(d.contract_data)}`].filter(Boolean).join(" ")}</td></tr>
          <tr><td className={td}>5.</td><td className={th}>Documentația tehnică</td><td className={td}>{txt(d.documentatie)}</td></tr>
          <tr><td className={td}>6.</td><td className={th}>Data ultimei {lucrare === "revizie" ? "revizii" : "verificări"} tehnice (din notificare)</td><td className={td}>{fmt(d.ultima_lucrare)}</td></tr>
          <tr><td className={td}>7.</td><td className={th}>Data scadentă (din notificare)</td><td className={td}>{fmt(d.scadenta_notificare)}</td></tr>
          <tr><td className={td}>8.</td><td className={th}>Instalatorul autorizat</td><td className={td}>{txt(d.instalator_nume)} · Legitimație tip {txt(d.legitimatie_tip)}, nr. {txt(d.legitimatie_nr)}, valabilă până la {fmt(d.legitimatie_valabila)}</td></tr>
        </tbody>
      </table>

      <div className="keep mt-3 font-semibold">9. Aparate consumatoare de combustibili gazoși</div>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>Tip</th><th className={th}>Debit nominal (m³/h)</th><th className={th}>Notificat / identificat</th></tr></thead>
        <tbody>{aparate.map((a, i) => <tr key={i}><td className={td}>{txt(a.tip)}</td><td className={td}>{txt(a.debit)}</td><td className={td}>{txt(a.sursa)}</td></tr>)}</tbody>
      </table>

      <div className="keep mt-3">(1) Situația (tabelul nr. 1): <b>{(MOTIV[txt(d.motiv)] ?? txt(d.motiv)).replace("{n}", kind === "revizie" ? "10" : "2")}</b>. Instalația (tabelul nr. 2): <b>{d.instalatie === "ambele" ? "individuală și comună" : txt(d.instalatie) === "comuna" ? "comună" : "individuală"}</b>{d.ultima_fisa ? `; ultima fișă: ${txt(d.ultima_fisa)}` : ""}.</div>

      <div className="keep mt-3">(2) Operațiunile realizate (tabelul nr. 3):</div>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>Nr.</th><th className={th}>Operațiuni</th><th className={th}>Da</th><th className={th}>Nu</th><th className={th}>Nu este cazul</th></tr></thead>
        <tbody>
          {opsItems.map((text, i) => {
            const o = ops[String(i + 1)];
            return (
              <tr key={i}>
                <td className={td}>{i + 1}.</td>
                <td className={td}>{text}{o?.v === "nu" && o.j ? <div className="mt-0.5 italic">Motiv: {o.j}</div> : null}</td>
                <td className={td}><X on={o?.v === "da"} /></td>
                <td className={td}><X on={o?.v === "nu"} /></td>
                <td className={td}><X on={o?.v === "nc"} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="keep mt-2">
        <div>{d.client_confirma_operatii === true ? "☒" : "☐"} Confirm că au fost efectuate toate operațiile enumerate în tabelul nr. 3.</div>
        <div>{d.client_confirma_instructiuni === true ? "☒" : "☐"} Confirm că am primit un exemplar al instrucțiunilor de utilizare a gazelor naturale{d.instructiuni === "predate" ? " (predat la această lucrare)" : ""}.</div>
        <div className="flex items-center gap-2">Semnătură client final: {sig("semnatura_client") && <Sig src={sig("semnatura_client")!} className="h-10" />}</div>
      </div>

      {kind === "revizie" && (
        <div className="keep mt-3">
          <div>(3) Probele de presiune (cu aer comprimat):</div>
          <table className="w-full border-collapse">
            <thead><tr><th className={th}>Probă</th><th className={th}>Material / amplasare</th><th className={th}>Regim</th><th className={th}>Presiune (bar)</th><th className={th}>Timp (h)</th><th className={th}>Rezultat</th></tr></thead>
            <tbody>
              <tr><td className={td}>Rezistență</td><td className={td}>{txt(d.material)} / {txt(d.amplasare)}</td><td className={td}>{txt(d.regim)}</td><td className={td}>{d.rezistenta_facuta === true ? txt(d.rezistenta_presiune) : "nu e cazul"}</td><td className={td}>{d.rezistenta_facuta === true ? txt(d.rezistenta_timp) : ""}</td><td className={td}>{d.rezistenta_facuta === true ? txt(d.rezistenta_rezultat) : ""}</td></tr>
              <tr><td className={td}>Etanșeitate</td><td className={td}>{txt(d.material)} / {txt(d.amplasare)}</td><td className={td}>{txt(d.regim)}</td><td className={td}>{txt(d.etanseitate_presiune)}</td><td className={td}>{txt(d.etanseitate_timp)}</td><td className={td}>{txt(d.etanseitate_rezultat)}</td></tr>
            </tbody>
          </table>
          <div className="mt-1">{d.client_confirma_probe === true ? "☒" : "☐"} Confirm că au fost efectuate probele enumerate mai sus.</div>
        </div>
      )}

      <div className="keep mt-3">({kind === "revizie" ? 4 : 3}) Defectele constatate:</div>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>Nr.</th><th className={th}>Defecte constatate</th><th className={th}>Modul de remediere</th><th className={th}>Remediat</th></tr></thead>
        <tbody>
          {defecte.length === 0 && <tr><td className={td} colSpan={4}>Nu s-au constatat defecte.</td></tr>}
          {defecte.map((x, i) => <tr key={i}><td className={td}>{i + 1}.</td><td className={td}>{txt(x.defect)}</td><td className={td}>{txt(x.remediere)}</td><td className={td}>{x.remediat === "da" ? "Da" : "Nu"}</td></tr>)}
        </tbody>
      </table>

      <table className="keep mt-3 w-full border-collapse">
        <tbody>
          <tr><td className={th}>({kind === "revizie" ? 5 : 4}) Instalația îndeplinește condițiile tehnice de funcționare în siguranță</td><td className={td}>{d.siguranta === "da" ? "Da" : "Nu"}</td><td className={td}>{txt(d.siguranta_obs)}</td></tr>
        </tbody>
      </table>

      <div className="keep mt-3">Documentele aparatelor:</div>
      <table className="w-full border-collapse">
        <thead><tr><th className={th}>Nr.</th><th className={th}>Tip aparat</th><th className={th}>Debit (m³/h)</th><th className={th}>Doc. coș nr.</th><th className={th}>Data</th><th className={th}>Doc. verificare aparat nr.</th><th className={th}>Data</th></tr></thead>
        <tbody>{aparate.map((a, i) => <tr key={i}><td className={td}>{i + 1}.</td><td className={td}>{txt(a.tip)}</td><td className={td}>{txt(a.debit)}</td><td className={td}>{txt(a.cos_nr)}</td><td className={td}>{fmt(a.cos_data)}</td><td className={td}>{txt(a.iscir_nr)}</td><td className={td}>{fmt(a.iscir_data)}</td></tr>)}</tbody>
      </table>
      {Boolean(d.racord_valabil || d.detector_valabil) && <div className="mt-1">Racord flexibil valabil până la {fmt(d.racord_valabil) || "—"}; detector automat valabil până la {fmt(d.detector_valabil) || "—"}.</div>}

      <table className="keep mt-3 w-full border-collapse">
        <tbody>
          <tr>
            <td className={th}>({kind === "revizie" ? 6 : 5}) Concluzii: pe baza documentelor prezentate și a operațiunilor realizate, instalația respectă prevederile normelor tehnice și poate funcționa în condiții de siguranță</td>
            <td className={td}>{d.concluzie === "da" ? "Da" : "Nu"}</td>
            <td className={td}>
              {txt(d.concluzie_obs)}
              {d.intrerupt === true && <div className="mt-1 font-semibold">Vehicularea gazelor a fost întreruptă de la {ROBINET[txt(d.intrerupt_robinet)] ?? txt(d.intrerupt_robinet)}. Motiv: {txt(d.intrerupt_motiv)}{d.operator_anuntat ? ` Operator anunțat: ${txt(d.operator_anuntat)}.` : ""}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="keep mt-3">
        Prezenta fișă se întocmește în 3 exemplare, câte unul pentru: a) clientul final; b) operatorul economic autorizat ANRE; c) operatorul de sistem. Se predă clientului după ce este înregistrată la operatorul de sistem. Orice modificare adusă instalației ulterior {lucrare === "revizie" ? "reviziei" : "verificării"} tehnice cade în răspunderea clientului final.
      </div>

      <div className="keep mt-5 grid grid-cols-3 gap-4">
        {[
          ["Reprezentantul legal / împuternicitul OE", txt(d.reprezentant_nume), sig("semnatura_reprezentant")],
          [`Instalatorul autorizat care a efectuat ${lucrare === "revizie" ? "revizia" : "verificarea"}`, txt(d.instalator_nume), sig("semnatura_instalator")],
          ["Clientul final", txt(d.semnatura_client_nume), sig("semnatura_client")],
        ].map(([title, name, img]) => (
          <div key={title as string}>
            <div className="font-semibold">{title}</div>
            <div>Nume și prenume: {name || "________________"}</div>
            <div className="flex h-14 items-end">Semnătura: {img ? <Sig src={img as string} className="h-12" /> : "________________"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
