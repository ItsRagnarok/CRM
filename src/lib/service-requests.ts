/**
 * Cereri noi și reprogramări: etichete și mesajul pentru client. Funcții pure (fără importuri),
 * testate în scripts/service-requests.test.mjs.
 */

export const REQUEST_SOURCES = [
  { id: "telefon", label: "Telefon" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "E-mail" },
  { id: "site", label: "Formular online" },
  { id: "tehnician", label: "De la tehnician" },
  { id: "altul", label: "Altă sursă" },
] as const;
export type RequestSource = (typeof REQUEST_SOURCES)[number]["id"];

export const REQUEST_STATUSES = [
  { id: "noua", label: "Noi" },
  { id: "contactata", label: "Contactate" },
  { id: "programata", label: "Programate" },
  { id: "respinsa", label: "Respinse" },
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number]["id"];

export const WINDOWS = [
  { id: "dimineata", label: "dimineața (8–11)" },
  { id: "pranz", label: "la prânz (11–14)" },
  { id: "dupa_amiaza", label: "după-amiaza (14–18)" },
  { id: "oricand", label: "oricând" },
] as const;

export const sourceLabel = (id: string) => REQUEST_SOURCES.find((s) => s.id === id)?.label ?? id;
export const windowLabel = (id: string | null) => (id ? WINDOWS.find((w) => w.id === id)?.label ?? id : "");

/** Motivul reprogramării: eticheta pentru birou și fraza pentru client. */
export const RESCHEDULE_REASONS = [
  { id: "client", label: "La cererea clientului", phrase: "la cererea dumneavoastră" },
  { id: "vreme", label: "Vremea nu permite", phrase: "din cauza vremii" },
  { id: "material", label: "Lipsă material sau piesă", phrase: "pentru că așteptăm un material necesar lucrării" },
  { id: "echipa", label: "Echipa nu e disponibilă", phrase: "pentru că echipa nu este disponibilă la ora stabilită" },
  { id: "urgenta", label: "A intervenit o urgență", phrase: "din cauza unei urgențe apărute la alt client" },
  { id: "acces", label: "Nu s-a putut intra la locație", phrase: "pentru că nu am putut avea acces la locație" },
  { id: "altul", label: "Alt motiv", phrase: "" },
] as const;
export type RescheduleReason = (typeof RESCHEDULE_REASONS)[number]["id"];

const MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const DAYS = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"];
/** „2026-11-27” → „vineri, 27 noiembrie”. */
export function longDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
const hm = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

/** Mesajul gata de trimis clientului după o reprogramare. */
export function rescheduleMessage(input: {
  clientName: string | null;
  jobNumber: number;
  jobTitle: string;
  fromDate: string | null;
  toDate: string;
  toStart: string | null;
  toEnd: string | null;
  reason: RescheduleReason;
  note?: string | null;
  companyName: string;
  companyPhone?: string | null;
}): string {
  const r = RESCHEDULE_REASONS.find((x) => x.id === input.reason);
  const why = input.reason === "altul" ? (input.note?.trim() ? ` (${input.note.trim().replace(/[.\s]+$/, "")})` : "") : r?.phrase ? `, ${r.phrase}` : "";
  const when = input.toStart ? `${longDate(input.toDate)}, ${input.toEnd ? `între ${hm(input.toStart)} și ${hm(input.toEnd)}` : `de la ${hm(input.toStart)}`}` : longDate(input.toDate);
  const title = input.jobTitle.split(/\s[—–-]\s/)[0].trim();
  const lines = [
    `Bună ziua${input.clientName ? `, ${input.clientName}` : ""},`,
    "",
    input.fromDate
      ? `Intervenția „${title}” (lucrarea #${input.jobNumber}), programată ${longDate(input.fromDate)}, se mută${why}.`
      : `Intervenția „${title}” (lucrarea #${input.jobNumber}) se reprogramează${why}.`,
    `Noua programare: ${when}.`,
    "",
    "Ne cerem scuze pentru schimbare. Dacă data nu vă convine, răspundeți la acest mesaj și găsim altă zi.",
    "",
    `${input.companyName}${input.companyPhone ? ` · ${input.companyPhone}` : ""}`,
  ];
  return lines.join("\n");
}

/** Număr românesc pentru link-ul WhatsApp: 0722 123 456 → 40722123456; null dacă nu arată a telefon. */
export function waNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `40${d.slice(1)}`;
  return /^\d{10,15}$/.test(d) ? d : null;
}
