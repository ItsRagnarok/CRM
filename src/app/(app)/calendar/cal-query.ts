// Parametrii calendarului stau în adresă (?view=&date=&teamId=&domain=), ca orice vedere să se poată
// deschide, partaja și reîncărca exact la fel. Toate legăturile păstrează filtrele: schimbi vederea
// sau săptămâna fără să pierzi echipa ori domeniul ales.
export type CalView = "echipe" | "week" | "day";
export type CalQuery = { view: CalView; date: string; teamId: string; domain: string };

export function calHref(q: CalQuery, over: Partial<CalQuery> = {}) {
  const m = { ...q, ...over };
  const p = new URLSearchParams();
  if (m.view !== "echipe") p.set("view", m.view);
  p.set("date", m.date);
  if (m.teamId) p.set("teamId", m.teamId);
  if (m.domain) p.set("domain", m.domain);
  return `/calendar?${p.toString()}`;
}

export const VIEW_HINTS: Record<CalView, string> = {
  echipe: "Câte un rând pentru fiecare echipă, pe zilele săptămânii: vezi dintr-o privire cine e ocupat și cine e liber.",
  week: "Toată săptămâna pe ore. Trage o lucrare pe altă zi ca s-o muți.",
  day: "O singură zi, pe ore, cu câte o coloană pentru fiecare echipă.",
};
