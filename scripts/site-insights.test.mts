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

// Cazurile găsite la testele de atac (27 nov): ce trebuie aruncat și ce trebuie păstrat.
{
  const data = compactForAi(base, "30d");
  const why0 = "Google aduce 11 vizitatori.";
  const r = (title: string, why: string, steps: string[]) => ({ id: title, source: "ai" as const, title, why, steps, impact: "mare" as const });
  const fantasy = [
    r("Campanie de e-mail către vizitatori", why0, ["Trimite o campanie de e-mail tuturor vizitatorilor de pe Google."]),
    r("Măsoară campania", why0, ["Instalează Google Analytics 4 ca să măsori campania dmo-energy."]),
    r("Retargeting", why0, ["Pune pixelul Meta pe site ca să faci retargeting în campaniile tale."]),
    r("Newsletter", why0, ["Fă un newsletter lunar și trimite-l tuturor vizitatorilor, cu link marcat."]),
    r("Reclame", why0, ["Pornește o campanie Google Ads cu un buget de 500 lei pe lună."]),
    r("Reia legătura", why0, ["Reia legătura cu cei care au vizitat pagina și întreabă-i ce i-a oprit."]),
    r("Oferta", why0, ["Trimite oferta pe e-mail celor interesați veniți de pe Google."]),
    r("Sună-i", why0, ["Sună-i pe cei 7 care au deschis pagina de programare."]),
    r("WhatsApp utilizatori", why0, ["Trimite un mesaj pe WhatsApp utilizatorilor care au intrat de pe telefon."]),
    r("Chat", why0, ["Configurează un chatbot pe /programare care răspunde automat."]),
    r("Click-uri", why0, ["Instalează un instrument care înregistrează mișcarea mouse-ului (Smartlook)."]),
    r("Firme după IP", why0, ["Folosește Leadfeeder ca să afli ce firme au intrat."]),
    r("E-mail automat", why0, ["Setează un e-mail automat care se trimite oricui deschide /programare."]),
    r("250%", "Mutarea butonului crește cererile cu 250%. Ai 7 vizitatori pe programare.", ["Mută butonul."]),
    r("Media industriei", "Rata de plecare e 67%, peste media de 45% din industrie.", ["Rescrie titlul."]),
    r("Conform Google", "Conform Google, 53% dintre utilizatorii de mobil pleacă; ai 17 pe telefon.", ["Verifică pe telefon."]),
    r("Promisiune", why0, ["Scrie 2 articole; vei avea 15 cereri în plus luna viitoare."]),
    r("Atribuire greșită", "Google a adus 29 de vizitatori, mai mulți decât Direct.", ["Scrie pe blog."]),
    r("În litere", "Am observat o sută de vizitatori pe prima pagină; 36 de vizitatori sunt unici.", ["Scurtează textul."]),
  ];
  const legit = [
    r("Mesajul de pe prima pagină", "36 de vizitatori au văzut prima pagină și 7 au deschis programarea (7 din 42).", ["Schimbă mesajul principal de pe prima pagină pentru vizitatorii care vin de pe Google: o propoziție cu rezultatul concret."]),
    r("Buton Sună pe telefon", "17 vizitatori au intrat de pe telefon.", ["Pune un buton „Sună” fix jos pe ecran, pentru vizitatorii de pe telefon."]),
    r("Verifică pe telefon", "17 vizitatori au intrat de pe telefon.", ["Verifică formularul pe telefon, ca vizitatorii să-l completeze ușor."]),
    r("Formular mai scurt", "7 vizitatori au deschis programarea, cu 6 secunde în medie, și nicio cerere.", ["Scurtează formularul: lasă câmpurile nume, telefon și e-mail pentru vizitatori."]),
    r("dmo-energy", "Campania dmo-energy a adus 1 vizitator.", ["Scrie-i firmei dmo-energy un mesaj cu linkul trimis de tine, ca să te asiguri că a găsit ce căuta."]),
    r("Procent calculat", "Doar 7 din 42 de vizitatori au ajuns la programare (17%).", ["Pune butonul de programare sus pe prima pagină."]),
    r("Minute", "Pe prima pagină se stă 1 minut și 34 de secunde în medie, iar 36 de vizitatori au intrat acolo.", ["Pune capturi din aplicație sus pe pagină."]),
    r("Sumă", "Google (11) și Direct (29) aduc împreună 40 de vizitatori.", ["Scrie un articol nou pe blog și postează-l pe LinkedIn cu link marcat."]),
    r("Imagini", "36 de vizitatori pe prima pagină.", ["Înlocuiește capturile pixelate cu imagini de 1200 de pixeli lățime."]),
  ];
  const f = groundAiRecommendations(fantasy, data);
  assert.deepEqual(f.kept.map((x) => x.title), [], "toate inventate trebuie aruncate");
  const g = groundAiRecommendations(legit, data);
  assert.deepEqual(g.rejected, [], "cele corecte nu trebuie aruncate");
  console.log("site-insights atac: ok");
}

{
  const { socialCampaign } = await import("../src/lib/site-insights");
  assert.equal(socialCampaign("Campanie: linkedin"), "LinkedIn (link marcat)");
  assert.equal(socialCampaign("Campanie: dmo-energy"), null);
  const withSocial = { ...base, channels: [...base.channels, { name: "Campanie: linkedin", visitors: 3, leads: 0 }] };
  assert.ok(!ruleRecommendations(withSocial, "30d").some((x) => x.id === "campanie-linkedin"), "LinkedIn nu e tratat ca firmă");
  assert.ok(compactForAi(withSocial, "30d").surse.some((x) => x.sursa === "LinkedIn (link marcat)"));
  console.log("site-insights rețele: ok");
}
