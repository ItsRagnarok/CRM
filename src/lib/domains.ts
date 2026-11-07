// The trades a company works in. Chosen when the account is created (one, two
// or all) and changeable later from Setări; they decide which technical forms
// and job options the company sees.
export const DOMAINS = [
  { id: "electric", label: "Electrice", description: "Instalații electrice, tablouri, verificări" },
  { id: "gaze", label: "Gaze", description: "Instalații de gaze, verificări și revizii" },
  { id: "fotovoltaic", label: "Fotovoltaice", description: "Sisteme fotovoltaice, racordare, punere în funcțiune" },
] as const;

export type DomainId = (typeof DOMAINS)[number]["id"];
export const ALL_DOMAIN_IDS: DomainId[] = DOMAINS.map((d) => d.id);

/** Keeps only valid, unique domain ids; falls back to all of them when none is valid. */
export function parseDomains(values: unknown[]): DomainId[] {
  const valid = ALL_DOMAIN_IDS.filter((id) => values.includes(id));
  return valid.length > 0 ? valid : [...ALL_DOMAIN_IDS];
}

export function domainLabel(id: string) {
  return DOMAINS.find((d) => d.id === id)?.label ?? id;
}
