// Mesajele către client (confirmarea programării, „suntem pe drum”) și fereastra de sosire.
// Textele sunt la persoana a II-a plural (clientul nu e cunoscut personal), scurte, cu linkul de status.

export function arrivalWindow(start: string | null | undefined, minutes: number): { from: string; to: string } | null {
  if (!start || !/^\d{2}:\d{2}/.test(start)) return null;
  const m = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
  const end = Math.min(m + Math.max(15, minutes), 23 * 60 + 59);
  const f = (x: number) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  return { from: f(m), to: f(end) };
}

export function longDay(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
}

export function confirmationMessage(p: { company: string; date: string | null; start: string | null; windowMinutes: number; link: string; title?: string }) {
  const w = arrivalWindow(p.start, p.windowMinutes);
  const when = p.date ? `${longDay(p.date)}${w ? `, între ${w.from} și ${w.to}` : ""}` : "în curând";
  return [
    `Bună ziua! Vă confirmăm programarea cu ${p.company}${p.title ? ` pentru „${p.title}”` : ""}: ${when}.`,
    `Pe linkul de mai jos vedeți oricând stadiul lucrării și cine vine: ${p.link}`,
    "Vă anunțăm când echipa pleacă spre dumneavoastră.",
  ].join("\n");
}

export function onTheWayMessage(p: { company: string; techName: string | null; link: string; etaMinutes?: number | null }) {
  const who = p.techName ? `Sunt ${p.techName} de la ${p.company}.` : `Echipa ${p.company}.`;
  const eta = p.etaMinutes && p.etaMinutes > 0 ? ` Ajungem în aproximativ ${p.etaMinutes} de minute.` : "";
  return `Bună ziua! ${who} Am plecat spre dumneavoastră.${eta} Aici vedeți stadiul lucrării: ${p.link}`;
}

/** Numărul pentru wa.me (doar cifre, cu prefixul României dacă începe cu 0). */
export function waPhone(phone: string | null | undefined) {
  const d = (phone ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("40")) return d;
  if (d.startsWith("0")) return `4${d}`;
  return d;
}
