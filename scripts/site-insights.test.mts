import assert from "node:assert/strict";
import { ruleRecommendations, summarize, compactForAi, groundAiRecommendations } from "../src/lib/site-insights";

const base = {
  visitors: 42, views: 95, bounce: 67, avg_seconds: 160, leads_count: 0, bookings: 0, prev_visitors: 0,
  pages: [
    { path: "/", visitors: 36, views: 62, avg_seconds: 94 },
    { path: "/blog", visitors: 9, views: 12, avg_seconds: 48 },
    { path: "/programare", visitors: 7, views: 10, avg_seconds: 6 },
    { path: "/blog/gestionare-echipe-de-teren", visitors: 1, views: 1, avg_seconds: null },
  ],
  entries: [{ path: "/", visitors: 35 }, { path: "/programare", visitors: 4 }],
  channels: [{ name: "Direct", visitors: 29, leads: 0 }, { name: "Google", visitors: 11, leads: 0 }, { name: "Campanie: dmo-energy", visitors: 1, leads: 0 }],
  sources: [{ name: "dmo-energy", visitors: 1 }],
  devices: [{ name: "desktop", visitors: 25 }, { name: "mobile", visitors: 17 }],
  journeys: [{ entry: "/", channel: "Google", pages: 3, seconds: 120, lead: false, device: "mobile", trail: ["/", "/blog", "/programare"] }],
};

const recs = ruleRecommendations(base, "30d");
const ids = recs.map((r) => r.id);
assert.ok(ids.includes("programare-abandon"), "programare deschisă fără trimitere");
assert.ok(ids.includes("home-bounce"), "prima pagină cu ieșiri mari");
assert.ok(ids.includes("campanie-dmo-energy"), "link marcat deschis");
assert.ok(ids.includes("social"), "fără rețele sociale");
assert.equal(recs[0].impact, "mare");
assert.ok(recs.every((r) => r.steps.length > 0 && r.why.length > 0));
assert.equal(summarize(base).mobileShare, 40);
assert.equal(summarize(base).programareVisitors, 7);

const none = ruleRecommendations({ ...base, visitors: 0, views: 0, pages: [], entries: [], channels: [], devices: [], journeys: [] }, "1h");
assert.equal(none.length, 1);
assert.equal(none[0].id, "fara-trafic");

const withLead = ruleRecommendations({ ...base, leads_count: 1 }, "30d").map((r) => r.id);
assert.ok(!withLead.includes("programare-abandon"));

const ai = compactForAi(base, "24h");
assert.equal(ai.perioada, "Ultimele 24 de ore");
assert.equal(ai.pagini[0].pagina, "Prima pagină");
assert.ok(!JSON.stringify(ai).includes("visitor\""));
console.log("site-insights: ok");

// Filtrul AI: aruncă recomandările imposibile sau fără cifre reale.
{
  const data = compactForAi(base, "30d");
  const rec = (title: string, why: string, steps: string[], link?: string) => ({ id: title, source: "ai" as const, title, why, steps, impact: "mare" as const, ...(link ? { link: { href: link, label: "x" } } : {}) });
  const { kept, rejected } = groundAiRecommendations([
    rec("Trimite email de follow-up celor 11 vizitatori de la Google", "Google aduce 11 vizitatori, dar niciunul nu a cerut programare.", ["Exportă lista IP/UTM din Google Analytics", "Trimite un mesaj scurt cu link direct la /programare"]),
    rec("Activează un pop-up de exit intent pe pagina principală", "36 de vizitatori pe prima pagină.", ["Pune un pop-up când vor să plece."]),
    rec("Pune un newsletter", "29 de vizitatori direcți.", ["Strânge abonați cu un formular."]),
    rec("Butonul de programare sus pe prima pagină", "36 de vizitatori au văzut prima pagină și 7 au deschis programarea (7 din 42).", ["Pune butonul „Programează o discuție” sub titlu."], "/"),
    rec("Prima pagină pierde oameni", "Am observat 120 de vizitatori care pleacă.", ["Scurtează textul."]),
    rec("Scrie mai mult", "Blogul e important.", ["Scrie un articol."]),
    rec("dmo-energy a deschis linkul", "Campania dmo-energy a adus 1 vizitator; scrie-i firmei un mesaj cu linkul marcat.", ["Trimite firmei un mesaj cu linkul /programare?utm_source=dmo-energy."], "/pagina-inexistenta"),
  ], data);
  assert.deepEqual(kept.map((r) => r.title), ["Butonul de programare sus pe prima pagină", "dmo-energy a deschis linkul"]);
  assert.equal(kept[1].link, undefined, "link spre o pagină care nu apare în date e scos");
  assert.equal(rejected.length, 5);
  assert.match(rejected[0].reason, /Google Analytics|vizitator/);
  assert.match(rejected.find((r) => r.title.startsWith("Prima pagină"))!.reason, /nu apar în date \(120\)/);
  assert.match(rejected.find((r) => r.title === "Scrie mai mult")!.reason, /nicio cifră/);
  console.log("site-insights filtru AI: ok");
}
