/**
 * Conturi demo: firma vede tot meniul; Super Adminul alege, pe fiecare cont, ce secțiuni și ce
 * subfuncții sunt deschise și ce apare cu lacăt („se configurează pe firma ta”). Implicit sunt blocate
 * cele care depind de datele reale ale firmei (facturare, stoc, pontaj, conformitate, SSM, setări, AI).
 * Mereu deschise: Panoul, notificările și, pe telefon, ziua de azi și pașii unei lucrări.
 */
export type DemoFeature = {
  id: string;
  label: string;
  area: "web" | "mobil" | "ambele";
  /** Începutul rutelor blocate (fără ele, funcția se blochează doar în cod: AI, GPS). */
  paths: string[];
  /** De ce se configurează pe firmă: apare pe ecranul blocat. */
  why: string;
  /** Subfuncție: e blocată și când secțiunea-mamă e blocată. */
  parent?: string;
  /** Blocată implicit într-un cont demo nou. */
  lockedByDefault?: boolean;
};

const W = "web" as const;
const M = "mobil" as const;

export const DEMO_FEATURES: DemoFeature[] = [
  // Platforma de birou, în ordinea din meniu.
  { id: "luni", label: "Luni dimineața", area: W, paths: ["/luni"], lockedByDefault: true, why: "Cifrele și pragurile alese de tine, calculate din facturile și pontajele reale ale firmei." },
  { id: "cereri", label: "Cereri noi", area: W, paths: ["/cereri"], why: "Formularul public al firmei tale și cine preia cererile." },
  { id: "lucrari", label: "Lucrări", area: W, paths: ["/lucrari"], why: "Tipurile de lucrări, echipele și clienții firmei tale." },
  { id: "lucrari.nou", label: "Lucrare nouă", parent: "lucrari", area: W, paths: ["/lucrari/nou"], why: "Tipurile de lucrări, echipele și clienții firmei tale." },
  { id: "calendar", label: "Calendar și echipe", area: W, paths: ["/calendar", "/echipe"], why: "Echipele, programul și oamenii firmei tale." },
  { id: "harta", label: "Hartă live", area: W, paths: ["/harta"], why: "Telefoanele echipelor tale și acordul lor pentru localizare." },
  { id: "gaze", label: "Gaze · scadențar", area: W, paths: ["/gaze"], why: "Blocurile, apartamentele și scadențele clienților tăi." },
  { id: "gaze.fise", label: "Fișe de evidență gaze", parent: "gaze", area: W, paths: ["/gaze/fise"], why: "Fișele de evidență ale firmei tale, cu legitimațiile oamenilor tăi." },
  { id: "gaze.registru", label: "Registru anual gaze", parent: "gaze", area: W, paths: ["/gaze/registru"], why: "Registrul anual al firmei tale." },
  { id: "fotovoltaic", label: "Fotovoltaic · dosare", area: W, paths: ["/fotovoltaic"], why: "Dosarele, operatorii și termenele proiectelor tale." },
  { id: "electric", label: "Electric · lucrări", area: W, paths: ["/electric"], why: "Buletinele, semnatarii și autorizațiile ANRE ale firmei tale." },
  { id: "clienti", label: "Clienți", area: W, paths: ["/clienti"], why: "Lista clienților firmei tale." },
  { id: "clienti.nou", label: "Client nou", parent: "clienti", area: W, paths: ["/clienti/nou"], why: "Lista clienților firmei tale." },
  { id: "facturare", label: "Facturare și încasări", area: W, paths: ["/facturare"], lockedByDefault: true, why: "Seriile de facturi, cota TVA, contul SmartBill sau Oblio și clienții tăi." },
  { id: "facturare.noua", label: "Factură sau proformă nouă", parent: "facturare", area: W, paths: ["/facturare/noua"], why: "Seriile de facturi, cota TVA și contul SmartBill sau Oblio al firmei tale." },
  { id: "conformitate", label: "Conformitate", area: W, paths: ["/conformitate"], lockedByDefault: true, why: "Autorizațiile oamenilor tăi, ITP-urile mașinilor și calibrările aparatelor." },
  { id: "ssm", label: "SSM", area: W, paths: ["/ssm"], lockedByDefault: true, why: "Instruirile oamenilor tăi și responsabilul SSM al firmei." },
  { id: "stoc", label: "Stoc și mașini", area: W, paths: ["/materiale"], lockedByDefault: true, why: "Mașinile, depozitele, sculele și listele de materiale ale firmei tale." },
  { id: "stoc.masini", label: "Stoc pe mașini", parent: "stoc", area: W, paths: ["/materiale/masini"], why: "Mașinile firmei tale și ce trebuie să aibă fiecare în portbagaj." },
  { id: "stoc.scule", label: "Registru scule", parent: "stoc", area: W, paths: ["/materiale/scule"], why: "Sculele și aparatele firmei tale, cu calibrările lor." },
  { id: "stoc.cereri", label: "Cereri de materiale", parent: "stoc", area: W, paths: ["/aprobari"], why: "Cine aprobă cererile de materiale în firma ta." },
  { id: "stoc.foaie", label: "Foaie de parcurs", parent: "stoc", area: W, paths: ["/foaie-parcurs"], why: "Mașinile și șoferii firmei tale." },
  { id: "stoc.comanda", label: "Comandă furnizor", parent: "stoc", area: W, paths: ["/materiale/comanda"], why: "Furnizorii și prețurile firmei tale." },
  { id: "stoc.nou", label: "Material nou", parent: "stoc", area: W, paths: ["/materiale/nou"], why: "Catalogul de materiale al firmei tale." },
  { id: "pontaj", label: "Pontaj și concedii", area: W, paths: ["/pontaj"], lockedByDefault: true, why: "Programul de lucru, tarifele orare și regulile de aprobare ale firmei tale." },
  { id: "pontaj.concedii", label: "Concedii", parent: "pontaj", area: W, paths: ["/pontaj/concedii"], why: "Zilele de concediu și regulile de aprobare ale firmei tale." },
  { id: "cheltuieli", label: "Cheltuieli", parent: "pontaj", area: W, paths: ["/cheltuieli"], why: "Categoriile de cheltuieli și cine le aprobă în firma ta." },
  { id: "rapoarte", label: "Rapoarte", area: W, paths: ["/rapoarte"], why: "Cifrele reale ale firmei tale." },
  { id: "mesaje", label: "Mesaje", area: W, paths: ["/mesaje"], why: "Oamenii firmei tale." },
  { id: "setari", label: "Setări", area: W, paths: ["/setari"], lockedByDefault: true, why: "Utilizatorii, rolurile, echipele, integrările și datele firmei tale." },
  { id: "ai", label: "Citire cu AI (bonuri, plăcuțe, descrieri)", area: "ambele", paths: [], lockedByDefault: true, why: "Acordul de prelucrare a datelor și regulile firmei pentru AI." },
  // Aplicația de telefon.
  { id: "m_scanare", label: "Scanează", area: M, paths: ["/mobil/scaneaza"], lockedByDefault: true, why: "Tipurile de documente și unde ajung în firma ta." },
  { id: "m_gps", label: "Localizare GPS", area: M, paths: [], lockedByDefault: true, why: "Acordul angajaților și regulile de păstrare a traseelor." },
  { id: "m_harta", label: "Hartă", area: M, paths: ["/mobil/harta"], why: "Lucrările și adresele firmei tale." },
  { id: "m_materiale", label: "Materiale", area: M, paths: ["/mobil/materiale"], why: "Stocul din mașina ta și cine aprobă cererile." },
  { id: "m_scule", label: "Scule", area: M, paths: ["/mobil/scule"], why: "Sculele și aparatele firmei tale." },
  { id: "m_mesaje", label: "Mesaje", area: M, paths: ["/mobil/mesaje"], why: "Oamenii firmei tale." },
  { id: "m_ssm", label: "SSM", area: M, paths: ["/mobil/ssm"], why: "Instruirile și responsabilul SSM al firmei." },
  { id: "m_cheltuieli", label: "Cheltuieli", area: M, paths: ["/mobil/cheltuieli"], why: "Categoriile de cheltuieli și cine le aprobă." },
  { id: "m_concediu", label: "Concediu", area: M, paths: ["/mobil/concediu"], why: "Zilele de concediu și cine le aprobă." },
  { id: "m_pontaj", label: "Pontaj", area: M, paths: ["/mobil/pontaj"], why: "Programul de lucru al firmei tale." },
];

export const DEMO_FEATURE_IDS = DEMO_FEATURES.map((f) => f.id);
export const DEMO_DEFAULT_DAYS = 14;

type DemoOrg = { account_type?: string | null; demo_unlocked?: string[] | null; demo_expires_at?: string | null };

export const isDemo = (org: DemoOrg) => org.account_type === "demo";

export function demoExpired(org: DemoOrg, now = Date.now()) {
  return isDemo(org) && Boolean(org.demo_expires_at) && Date.parse(org.demo_expires_at!) < now;
}

/**
 * Funcția e blocată pentru firmă: cont demo și nedeblocată de Super Admin (după expirare, toate).
 * O subfuncție e blocată și când secțiunea ei e blocată.
 */
export function demoLocked(org: DemoOrg, id: string): boolean {
  if (!isDemo(org)) return false;
  if (demoExpired(org)) return true;
  const parent = demoFeature(id)?.parent;
  if (parent && demoLocked(org, parent)) return true;
  return !(org.demo_unlocked ?? []).includes(id);
}

/** Ce e deschis implicit într-un cont demo nou (restul apare cu lacăt). */
export const DEMO_DEFAULT_OPEN = DEMO_FEATURES.filter((f) => !f.lockedByDefault).map((f) => f.id);

export function demoFeature(id: string): DemoFeature | undefined {
  return DEMO_FEATURES.find((f) => f.id === id);
}

/** Rutele de meniu blocate (pentru lacătul din meniul lateral). */
export function lockedPaths(org: DemoOrg): string[] {
  if (!isDemo(org)) return [];
  return DEMO_FEATURES.filter((f) => demoLocked(org, f.id)).flatMap((f) => f.paths);
}

/** AI-ul e pornit: oprit de firmă sau blocat în demo înseamnă oprit. */
export function aiOn(org: DemoOrg & { ai_enabled?: boolean | null }) {
  return org.ai_enabled !== false && !demoLocked(org, "ai");
}

export function demoDaysLeft(org: DemoOrg, now = Date.now()) {
  if (!org.demo_expires_at) return null;
  return Math.max(0, Math.ceil((Date.parse(org.demo_expires_at) - now) / 86_400_000));
}

export function parseDemoFeatures(values: unknown[]): string[] {
  return DEMO_FEATURE_IDS.filter((id) => values.includes(id));
}
