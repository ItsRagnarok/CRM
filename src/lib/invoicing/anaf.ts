import "server-only";

// Serviciul public ANAF pentru plătitorii de TVA (fără cheie). Completează datele unei firme după CUI.
const URL_ANAF = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";

export type AnafCompany = {
  cui: string;
  name: string;
  regCom: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  phone: string | null;
  vatPayer: boolean;
  eInvoice: boolean;
  inactive: boolean;
};

const title = (s: string) => s.toLowerCase().replace(/(^|[\s\-.(])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());

export function normalizeCui(input: string) {
  return input.toUpperCase().replace(/\s+/g, "").replace(/^RO/, "");
}

export async function anafLookup(input: string, today: string): Promise<AnafCompany | null> {
  const cui = normalizeCui(input);
  if (!/^\d{2,10}$/.test(cui)) return null;
  const res = await fetch(URL_ANAF, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ cui: Number(cui), data: today }]),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ANAF ${res.status}`);
  const json = (await res.json()) as { found?: Record<string, Record<string, unknown>>[] };
  const f = json.found?.[0];
  if (!f) return null;
  const g = f.date_generale ?? {};
  const sed = f.adresa_sediu_social ?? {};
  const street = [sed.sdenumire_Strada, sed.snumar_Strada ? `nr. ${sed.snumar_Strada}` : null, sed.sdetalii_Adresa].filter(Boolean).join(", ");
  const city = typeof sed.sdenumire_Localitate === "string" ? sed.sdenumire_Localitate : null;
  const county = typeof sed.sdenumire_Judet === "string" ? sed.sdenumire_Judet : null;
  return {
    cui,
    name: String(g.denumire ?? "").trim(),
    regCom: typeof g.nrRegCom === "string" && g.nrRegCom ? g.nrRegCom : null,
    address: street || (typeof g.adresa === "string" ? g.adresa : null),
    city: city ? title(city.replace(/\s+Mun\.\s+Bucure[sș]ti$/i, "")) : null,
    county: county ? (/BUCURE/i.test(county) ? "Bucuresti" : title(county)) : null,
    phone: typeof g.telefon === "string" && g.telefon ? g.telefon : null,
    vatPayer: Boolean((f.inregistrare_scop_Tva as { scpTVA?: boolean } | undefined)?.scpTVA),
    eInvoice: Boolean(g.statusRO_e_Factura),
    inactive: Boolean((f.stare_inactiv as { statusInactivi?: boolean } | undefined)?.statusInactivi),
  };
}
