// Canalul preferat și acordul pentru oferte, pe client (Etapa 4, punctul 18).
// Mesajele despre lucrare pleacă pe canalul preferat; ofertele doar pe canalele cu acord.

export type Channel = "telefon" | "sms" | "whatsapp" | "email";
export type MarketingChannel = "sms" | "whatsapp" | "email";

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "telefon", label: "Apel" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "E-mail" },
];
export const MARKETING_CHANNELS: { id: MarketingChannel; label: string }[] = [
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "E-mail" },
];

export const CHANNEL_LABEL: Record<Channel, string> = { telefon: "Apel", sms: "SMS", whatsapp: "WhatsApp", email: "E-mail" };

export const SOURCES = [
  { id: "birou_telefon", label: "Mi-a spus la telefon" },
  { id: "birou_fata", label: "Mi-a spus față în față" },
  { id: "birou_scris", label: "În scris (contract, e-mail, formular semnat)" },
] as const;
export const SOURCE_LABEL: Record<string, string> = {
  birou_telefon: "spus la telefon",
  birou_fata: "spus față în față",
  birou_scris: "în scris",
  formular_cerere: "formularul de cereri, de clientul însuși",
  link_status: "linkul de status, de clientul însuși",
};

export function isChannel(v: unknown): v is Channel {
  return v === "telefon" || v === "sms" || v === "whatsapp" || v === "email";
}

/** Canalele de oferte valide, fără dubluri, în ordinea fixă SMS, WhatsApp, E-mail. */
export function normMarketing(list: unknown[]): MarketingChannel[] {
  const set = new Set(list.map(String));
  return MARKETING_CHANNELS.map((c) => c.id).filter((c) => set.has(c));
}

/** Butoanele pentru un mesaj despre lucrare, cu canalul preferat primul. */
export function orderedChannels(available: Channel[], preferred: string | null | undefined): Channel[] {
  if (!isChannel(preferred) || !available.includes(preferred)) return available;
  return [preferred, ...available.filter((c) => c !== preferred)];
}

/** Ce scriem lângă un client: „Preferă WhatsApp · oferte: SMS, E-mail” sau „fără oferte”. */
export function prefsSummary(channel: string | null | undefined, marketing: string[] | null | undefined) {
  const ch = isChannel(channel) ? `Preferă ${CHANNEL_LABEL[channel]}` : "Canal nespecificat";
  const mk = normMarketing(marketing ?? []);
  return `${ch} · ${mk.length ? `oferte: ${mk.map((c) => CHANNEL_LABEL[c]).join(", ")}` : "fără oferte"}`;
}

export type ChannelAction = { id: Channel; label: string; href: string; preferred: boolean };

/**
 * Linkurile pentru un mesaj despre lucrare (apel, SMS, WhatsApp, e-mail), doar pentru datele
 * pe care clientul le are, cu canalul preferat primul și marcat.
 */
export function channelActions(o: { text: string; phone?: string | null; email?: string | null; subject?: string; preferred?: string | null; wa?: string | null }): ChannelAction[] {
  const tel = (o.phone ?? "").replace(/[^\d+]/g, "");
  const out: ChannelAction[] = [];
  if (o.wa) out.push({ id: "whatsapp", label: "WhatsApp", href: `https://wa.me/${o.wa}?text=${encodeURIComponent(o.text)}`, preferred: false });
  if (tel) out.push({ id: "sms", label: "SMS", href: `sms:${tel}?body=${encodeURIComponent(o.text)}`, preferred: false });
  if (tel) out.push({ id: "telefon", label: "Sună", href: `tel:${tel}`, preferred: false });
  if (o.email) out.push({ id: "email", label: "E-mail", href: `mailto:${o.email}?subject=${encodeURIComponent(o.subject ?? "Lucrarea dumneavoastră")}&body=${encodeURIComponent(o.text)}`, preferred: false });
  const order = orderedChannels(out.map((a) => a.id), o.preferred);
  return order.map((id) => {
    const a = out.find((x) => x.id === id)!;
    return { ...a, preferred: isChannel(o.preferred) && id === o.preferred };
  });
}

/** Rândul de sub mesaj: ce canal preferă clientul, sau că nu a spus. */
export function preferredHint(preferred: string | null | undefined, has: { phone?: string | null; email?: string | null }) {
  if (!isChannel(preferred)) return null;
  if ((preferred === "email" && !has.email) || (preferred !== "email" && !has.phone)) return `Clientul preferă ${CHANNEL_LABEL[preferred]}, dar nu are ${preferred === "email" ? "e-mail" : "telefon"} în fișă.`;
  return preferred === "telefon" ? "Clientul preferă să fie sunat. Spune-i mesajul la telefon." : `Clientul preferă ${CHANNEL_LABEL[preferred]}.`;
}

export type MarketingRow = { name: string; phone: string | null; email: string | null; marketing_channels: string[]; contact_prefs_updated_at: string | null };

/**
 * Lista pentru oferte (CSV pentru Excel, „;”): doar clienții cu acord, iar la fiecare doar datele
 * canalelor acceptate (telefonul doar cu acord SMS/WhatsApp, e-mailul doar cu acord e-mail).
 */
export function marketingCsv(rows: MarketingRow[]): string {
  const cell = (v: string) => {
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; // fără formule la deschiderea în Excel
    return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [["Client", "Telefon (SMS/WhatsApp)", "E-mail", "Canale acceptate", "Acord din"]];
  for (const r of rows) {
    const mk = normMarketing(r.marketing_channels ?? []);
    if (!mk.length) continue;
    const phoneOk = mk.includes("sms") || mk.includes("whatsapp");
    const phone = phoneOk ? r.phone ?? "" : "";
    const email = mk.includes("email") ? r.email ?? "" : "";
    if (!phone && !email) continue;
    lines.push([r.name, phone, email, mk.map((c) => CHANNEL_LABEL[c]).join(", "), r.contact_prefs_updated_at ? r.contact_prefs_updated_at.slice(0, 10) : ""]);
  }
  return "﻿" + lines.map((l) => l.map(cell).join(";")).join("\r\n") + "\r\n";
}
