import assert from "node:assert/strict";
import { ruleRecommendations, summarize, compactForAi } from "../src/lib/site-insights";

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
