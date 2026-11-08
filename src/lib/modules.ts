import type { DomainId } from "@/lib/domains";

// Modules a company can have. The platform admin picks them when creating a
// company (and can change them later). This is a commercial switch, not a
// security boundary: the data stays protected by row-level security per company.
export type ModuleDef = {
  id: string;
  label: string;
  description: string;
  /** Needs one of these domains to make sense. Empty = for every company. */
  domains: DomainId[];
  /** Built and usable now. Others are listed in the admin form as "în curând". */
  available: boolean;
};

export const MODULES: ModuleDef[] = [
  {
    id: "conformitate",
    label: "Registru de conformitate",
    description: "Legitimații, autorizații, aparate și mașini cu data de expirare și alerte (60, 30 și 7 zile).",
    domains: [],
    available: true,
  },
  {
    id: "scadentar_gaze",
    label: "Scadențar gaze",
    description: "Pe bloc, scară și apartament: verificări și revizii, cine nu a răspuns, campanii.",
    domains: ["gaze"],
    available: false,
  },
  {
    id: "dosar_fotovoltaic",
    label: "Dosar fotovoltaic",
    description: "Etape de la ofertă la garanție, termenele operatorului (ATR, contor), AFM.",
    domains: ["fotovoltaic"],
    available: false,
  },
  {
    id: "buletine_electrice",
    label: "Măsurători și buletine electrice",
    description: "Tablouri și circuite, măsurători completate de tehnician, procese-verbale cu semnatar autorizat.",
    domains: ["electric"],
    available: false,
  },
];

/** Modules proposed for a new company, from the domains chosen. Only built ones are pre-selected. */
export function defaultModules(domains: string[]): string[] {
  return MODULES.filter((m) => m.available && (m.domains.length === 0 || m.domains.some((d) => domains.includes(d)))).map((m) => m.id);
}

export function parseModules(values: unknown[]): string[] {
  return MODULES.filter((m) => values.includes(m.id)).map((m) => m.id);
}

export function hasModule(modules: string[] | null | undefined, id: string) {
  return Boolean(modules?.includes(id));
}
