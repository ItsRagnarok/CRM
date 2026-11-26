/**
 * Conturi demo: firma vede tot meniul, dar funcțiile care depind de datele ei reale sunt blocate cu
 * un ecran „se configurează pe firma ta”. Deschise rămân cele care îi arată valoarea în primele minute:
 * panou, lucrări, calendar, clienți, cereri, hartă, mesaje, rapoarte, modulele de domeniu, iar pe
 * telefon pașii lucrării, pozele, checklistul și semnătura.
 * Super Adminul poate debloca orice funcție de aici, pe fiecare cont demo.
 */
export type DemoFeature = {
  id: string;
  label: string;
  area: "web" | "mobil" | "ambele";
  /** Începutul rutelor blocate (fără ele, funcția se blochează doar în cod: AI, GPS). */
  paths: string[];
  /** De ce se configurează pe firmă: apare pe ecranul blocat. */
  why: string;
};

export const DEMO_FEATURES: DemoFeature[] = [
  { id: "facturare", label: "Facturare și încasări", area: "web", paths: ["/facturare"], why: "Seriile de facturi, cota TVA, contul SmartBill sau Oblio și clienții tăi." },
  { id: "luni", label: "Luni dimineața", area: "web", paths: ["/luni"], why: "Cifrele și pragurile alese de tine, calculate din facturile și pontajele reale ale firmei." },
  { id: "stoc", label: "Stoc și mașini", area: "web", paths: ["/materiale", "/aprobari", "/foaie-parcurs"], why: "Mașinile, depozitele, sculele și listele de materiale ale firmei tale." },
  { id: "pontaj", label: "Pontaj, concedii și cheltuieli", area: "web", paths: ["/pontaj", "/cheltuieli"], why: "Programul de lucru, tarifele orare și regulile de aprobare ale firmei tale." },
  { id: "conformitate", label: "Conformitate", area: "web", paths: ["/conformitate"], why: "Autorizațiile oamenilor tăi, ITP-urile mașinilor și calibrările aparatelor." },
  { id: "ssm", label: "SSM", area: "web", paths: ["/ssm"], why: "Instruirile oamenilor tăi și responsabilul SSM al firmei." },
  { id: "setari", label: "Setări", area: "web", paths: ["/setari"], why: "Utilizatorii, rolurile, echipele, integrările și datele firmei tale." },
  { id: "ai", label: "Citire cu AI (bonuri, plăcuțe, descrieri)", area: "ambele", paths: [], why: "Acordul de prelucrare a datelor și regulile firmei pentru AI." },
  { id: "m_scanare", label: "Scanează (telefon)", area: "mobil", paths: ["/mobil/scaneaza"], why: "Tipurile de documente și unde ajung în firma ta." },
  { id: "m_gps", label: "Localizare GPS (telefon)", area: "mobil", paths: [], why: "Acordul angajaților și regulile de păstrare a traseelor." },
];

export const DEMO_FEATURE_IDS = DEMO_FEATURES.map((f) => f.id);
export const DEMO_DEFAULT_DAYS = 14;

type DemoOrg = { account_type?: string | null; demo_unlocked?: string[] | null; demo_expires_at?: string | null };

export const isDemo = (org: DemoOrg) => org.account_type === "demo";

export function demoExpired(org: DemoOrg, now = Date.now()) {
  return isDemo(org) && Boolean(org.demo_expires_at) && Date.parse(org.demo_expires_at!) < now;
}

/** Funcția e blocată pentru firmă: cont demo și nedeblocată de Super Admin (după expirare, toate). */
export function demoLocked(org: DemoOrg, id: string) {
  if (!isDemo(org)) return false;
  if (demoExpired(org)) return true;
  return !(org.demo_unlocked ?? []).includes(id);
}

export function demoFeature(id: string) {
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
