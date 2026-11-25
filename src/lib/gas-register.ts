// Registrul de evidență al verificărilor și reviziilor (Ord. ANRE 179/2015, anexa 6),
// generat din fișele încheiate în anul ales.

export type RegisterSource = {
  kind: string;
  number: number | null;
  drawn_up_on: string | null;
  conform: boolean | null;
  data: unknown;
};

export type RegisterRow = {
  nr: number;
  client: string;
  adresa: string;
  codLoc: string;
  contract: string;
  individuala: boolean;
  comuna: boolean;
  verificare: { nr: string; data: string } | null;
  revizie: { nr: string; data: string } | null;
  conform: boolean | null;
};

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const ro = (d: string | null | undefined) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "");

export function buildRegister(records: RegisterSource[]): RegisterRow[] {
  return [...records]
    .sort((a, b) => (a.drawn_up_on ?? "").localeCompare(b.drawn_up_on ?? "") || (a.number ?? 0) - (b.number ?? 0))
    .map((r, i) => {
      const d = (r.data ?? {}) as Record<string, unknown>;
      const fisa = { nr: s(r.number), data: ro(r.drawn_up_on) };
      return {
        nr: i + 1,
        client: s(d.client),
        adresa: s(d.adresa),
        codLoc: s(d.cod_loc),
        contract: [s(d.contract_nr), ro(s(d.contract_data))].filter(Boolean).join(" / "),
        individuala: d.instalatie !== "comuna",
        comuna: d.instalatie === "comuna" || d.instalatie === "ambele",
        verificare: r.kind === "verificare" ? fisa : null,
        revizie: r.kind === "revizie" ? fisa : null,
        conform: r.conform,
      };
    });
}

const HEADER = [
  "Nr. crt.", "Numele și prenumele clientului final", "Adresa locului de consum", "Codul locului de consum",
  "Contractul de prestări servicii", "Instalație individuală", "Instalație comună",
  "Fișa verificare nr.", "Fișa verificare data", "Fișa revizie nr.", "Fișa revizie data", "Respectă normele și poate funcționa în siguranță",
];

/** CSV cu „;” și BOM, ca Excel în română să-l deschidă corect. */
export function registerCsv(rows: RegisterRow[]): string {
  const cell = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [HEADER, ...rows.map((r) => [
    String(r.nr), r.client, r.adresa, r.codLoc, r.contract, r.individuala ? "X" : "", r.comuna ? "X" : "",
    r.verificare?.nr ?? "", r.verificare?.data ?? "", r.revizie?.nr ?? "", r.revizie?.data ?? "",
    r.conform === null ? "" : r.conform ? "Da" : "Nu",
  ])];
  return "﻿" + lines.map((l) => l.map(cell).join(";")).join("\r\n") + "\r\n";
}
