/**
 * Ce știe platforma, pentru briefurile de lead. Starea e cinstită: nimic nu e încă testat cu o firmă reală.
 * Actualizează aici când un modul e validat pe teren sau când apare unul nou.
 */
export const PLATFORM_CAPABILITIES: { name: string; what: string; status: "exista-netestat" | "parțial" | "lipsa" }[] = [
  { name: "Scadențar gaze", what: "evidența verificărilor și reviziilor, cu scadențe și fișe de gaze", status: "exista-netestat" },
  { name: "Dosare fotovoltaic", what: "dosarul fiecărei lucrări de panouri, pas cu pas", status: "exista-netestat" },
  { name: "Buletine electrice", what: "măsurători și buletine pentru lucrări electrice", status: "exista-netestat" },
  { name: "Lucrări și calendar", what: "lucrări, programări, echipe și hartă live", status: "exista-netestat" },
  { name: "Aplicație mobilă tehnicieni", what: "pontaj, foto, checklist, semnătură client, funcționează și offline", status: "exista-netestat" },
  { name: "Cereri online și status pentru client", what: "formular public de cereri, link de status al lucrării pentru client", status: "exista-netestat" },
  { name: "Facturare și încasări", what: "facturi, proforme, încasări, e-mail către client, e-Factura", status: "exista-netestat" },
  { name: "Conformitate și SSM", what: "documente și evidențe de conformitate și securitate", status: "exista-netestat" },
  { name: "Stoc, mașini, pontaj, concedii, cheltuieli", what: "evidențe interne ale firmei", status: "exista-netestat" },
  { name: "Integrare cu operatorii de rețea", what: "depunere automată de dosare la operator", status: "lipsa" },
];

const STATUS_TEXT = { "exista-netestat": "există, netestat cu o firmă reală", "parțial": "parțial", lipsa: "nu există" } as const;

export function capabilitiesText(): string {
  return PLATFORM_CAPABILITIES.map((c) => `- ${c.name}: ${c.what} (${STATUS_TEXT[c.status]})`).join("\n");
}
