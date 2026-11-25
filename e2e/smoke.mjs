// Verificare automată a platformei și a aplicației tehnicianului (doar citire).
//
// Rulează pe compania DEMO (date fictive) și NU modifică date: doar deschide
// pagini, citește textul și verifică ce trebuie să existe. Prinde exact tipul
// de problemă „după update a dispărut funcția X” sau „pe telefon arată alandala”.
//
//   E2E_BASE=http://localhost:3000 node e2e/smoke.mjs
//
// Variabile:
//   E2E_BASE      adresa aplicației (implicit http://localhost:3000)
//   E2E_PASSWORD  parola conturilor demo (implicit cea din supabase/demo/seed_demo_company.sql)
//   E2E_SHOTS     dacă e setat, salvează capturi la eșec în acest director
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = (process.env.E2E_BASE || "http://localhost:3000").replace(/\/$/, "");
const PW = process.env.E2E_PASSWORD || "12345678";
const SHOTS = process.env.E2E_SHOTS || "";
const ADMIN = "admin@demo.electrofield.test";
const TECH = "tehnician01@demo.electrofield.test";

const results = [];
const serverErrors = [];
const warnings = [];
const ok = (name, cond, extra = "") => results.push({ name, pass: !!cond, extra });

const ERROR_TEXT = /Application error|Internal Server Error|This page could not be found|A apărut o eroare neașteptată/i;

async function newPage(ctx) {
  const page = await ctx.newPage();
  // Vercel Analytics există doar pe Vercel; local răspunsul e HTML și ar da o eroare falsă.
  await page.route("**/_vercel/**", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  page.on("pageerror", (e) => {
    const line = `${page.url().replace(BASE, "")}: ${e.message.slice(0, 200)}`;
    // Nepotrivire la hidratare (React #418/#423/#425): React redesenează singur pagina, utilizatorul nu vede
    // nimic. Apare intermitent — o raportăm ca avertisment, nu ca eșec.
    // „parentNode of null” apare rar, după aceeași reparare de hidratare (o dată în ~3 rulări, nereproductibil izolat).
    if (/Minified React error #(418|423|425)\b|reading 'parentNode'/.test(e.message)) warnings.push(line);
    else serverErrors.push(`pageerror ${line}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 500 && r.url().startsWith(BASE)) serverErrors.push(`HTTP ${r.status()} ${r.url().replace(BASE, "").slice(0, 120)}`);
  });
  return page;
}

async function go(page, path) {
  // „load” și apoi liniște în rețea cel mult 8 s: unele pagini (hartă, notificări live) nu se liniștesc niciodată.
  const r = await page.goto(BASE + path, { waitUntil: "load", timeout: 45000 }).catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
  return r?.status?.() ?? 0;
}
const text = (page) => page.locator("body").innerText();

async function login(page, email, landing) {
  await go(page, "/login");
  await page.fill("#email", email);
  await page.fill("#password", PW);
  await Promise.all([page.waitForURL(`**${landing}**`, { timeout: 30000 }).catch(() => {}), page.click("button[type=submit]")]);
  return page.url().replace(BASE, "");
}

// Lățimea paginii nu depășește ecranul (altfel pe telefon pagina „fuge” lateral).
// Conținutul care se derulează intenționat (tabele, hărți) nu contează.
async function overflow(page) {
  return page.evaluate(() => {
    const vw = innerWidth;
    const bad = [];
    for (const e of document.querySelectorAll("body *")) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 2) continue;
      let a = e.parentElement, inScroller = false;
      while (a && a !== document.body) {
        const cs = getComputedStyle(a);
        if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) { inScroller = true; break; }
        a = a.parentElement;
      }
      if (!inScroller && !e.closest(".leaflet-container")) bad.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} → ${Math.round(r.right)}px`);
      if (bad.length > 3) break;
    }
    return { docWidth: document.documentElement.scrollWidth, vw, bad };
  });
}

async function shot(page, name) {
  if (!SHOTS) return;
  await mkdir(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name.replace(/[^a-z0-9]+/gi, "_")}.png` }).catch(() => {});
}

// Pagini de birou: [cale, text care trebuie să apară]
const OFFICE_PAGES = [
  ["/dashboard", "Lucrări azi"],
  ["/lucrari", "Lucrare nouă"],
  ["/lucrari/nou", "Client"],
  ["/calendar", "Calendar și echipe"],
  ["/echipe", "Echipe"],
  ["/harta", "Echipe pe teren"],
  ["/gaze", "Gaze"],
  ["/gaze/fise", "Fișe de evidență"],
  ["/gaze/registru", "Registrul de evidență"],
  ["/fotovoltaic", "Fotovoltaic"],
  ["/electric", "Electric"],
  ["/clienti", "Client nou"],
  ["/facturare", "Facturare"],
  ["/conformitate", "Conformitate"],
  ["/materiale", "Stoc și scule"],
  ["/aprobari", "Cereri de materiale"],
  ["/foaie-parcurs", "Foaie de parcurs"],
  ["/pontaj", "Pontaj"],
  ["/cheltuieli", "Cheltuieli"],
  ["/rapoarte", "Rapoarte"],
  ["/cereri", "Cereri noi"],
  ["/luni", "Luni dimineața"],
  ["/materiale/masini", "Stoc pe mașini"],
  ["/materiale/scule", "Registru de scule"],
  ["/mesaje", "Mesaje"],
  ["/notificari", "Notificări"],
  ["/setari", "Informații companie"],
  ["/setari?tab=integrari", "SmartBill"],
  ["/setari?tab=termene", "Termene"],
];

const MOBILE_PAGES = [
  ["/mobil", "Lucrări"],
  ["/mobil/lucrari", "Lucrări"],
  ["/mobil/pontaj", "Pontaj"],
  ["/mobil/materiale", "Materiale"],
  ["/mobil/profil", "Profil"],
  ["/mobil/mesaje", "Mesaje"],
  ["/mobil/notificari", "Notificări"],
  ["/mobil/cheltuieli", "Cheltuieli"],
  ["/mobil/documente", "Documente"],
];

const run = async () => {
  const browser = await chromium.launch();

  // 1. Pagini publice
  {
    const ctx = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 1 });
    const page = await newPage(ctx);
    for (const [path, needle] of [["/", "ElectroField"], ["/programare", "Programează"], ["/blog", "ElectroField"], ["/login", "Parol"]]) {
      const s = await go(page, path);
      const t = await text(page);
      ok(`public ${path}: se deschide`, s === 200 && t.includes(needle) && !ERROR_TEXT.test(t), `HTTP ${s}`);
      const o = await overflow(page);
      ok(`public ${path}: încape pe telefon`, o.docWidth <= o.vw + 1 && o.bad.length === 0, o.bad.join(", ") || `${o.docWidth}px`);
    }
    // Modul offline al aplicației: service worker-ul și pagina „Fără semnal” trebuie să existe.
    const sw = await page.request.get(BASE + "/sw.js");
    ok("offline: service worker-ul aplicației se descarcă", sw.status() === 200 && (await sw.text()).includes("ef-mobil"), `HTTP ${sw.status()}`);
    const off = await page.request.get(BASE + "/mobil-offline.html");
    ok("offline: pagina „Fără semnal” există", off.status() === 200 && (await off.text()).includes("Fără semnal"), `HTTP ${off.status()}`);
    await go(page, "/status/00000000-0000-0000-0000-000000000000");
    ok("status public: link greșit arată mesaj clar", (await text(page)).includes("nu mai este valabil"));
    await go(page, "/solicitare/00000000-0000-0000-0000-000000000000");
    ok("formular public de cereri: link greșit arată mesaj clar", (await text(page)).includes("nu mai este activ"));
    await go(page, "/dashboard");
    ok("fără cont: /dashboard trimite la login", page.url().includes("/login"), page.url().replace(BASE, ""));
    await ctx.close();
  }

  // 2. Administrator, pe calculator
  const actx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const ap = await newPage(actx);
  const landed = await login(ap, ADMIN, "/dashboard");
  ok("admin demo: login → panou", landed.startsWith("/dashboard"), landed);
  await ap.waitForFunction(() => document.body.innerText.includes("Lucrări azi"), null, { timeout: 15000 }).catch(() => {});
  let t = await text(ap);
  ok("panou: indicatorii principali", ["Lucrări azi", "De facturat", "Încasări restante", "Expiră în 30 de zile"].every((s) => t.includes(s)));
  const tl = t.toLowerCase();
  ok("meniu: grupurile și modulele pe domenii", ["pe domenii", "clienți și bani", "firmă", "comunicare"].every((s) => tl.includes(s)) && ["Gaze · scadențar", "Fotovoltaic · dosare", "Electric · lucrări", "Conformitate"].every((s) => t.includes(s)));

  for (const [path, needle] of OFFICE_PAGES) {
    const s = await go(ap, path);
    t = await text(ap);
    const pass = s === 200 && t.includes(needle) && !ERROR_TEXT.test(t);
    ok(`birou ${path}`, pass, pass ? "" : `HTTP ${s}, lipsește „${needle}”`);
    if (!pass) await shot(ap, `fail_desktop_${path}`);
  }

  // Date demo vizibile (dacă dispar, ceva a stricat interogările)
  await go(ap, "/lucrari");
  t = await text(ap);
  // 100 de lucrări din seed + cele 2 de gaze (bloc și casă) adăugate pentru fișa de evidență.
  ok("lucrări: compania demo are cel puțin 100 de lucrări", Number((t.match(/Toate · (\d+)/) || [])[1] ?? 0) >= 100, (t.match(/Toate · \d+/) || [""])[0]);
  await go(ap, "/foaie-parcurs");
  ok("foaie de parcurs: mașinile demo", (await text(ap)).includes("CJ 41 DMO"));
  await go(ap, "/facturare");
  ok("facturare: facturi emise demo", /DEMO \d{4}/.test(await text(ap)));
  // Măsurătorile din aplicația tehnicianului apar la birou (lucrarea demo #44 are formularul completat)
  await go(ap, "/electric");
  const el44 = await ap.evaluate(() => [...document.querySelectorAll('a[href^="/electric/"]')].find((x) => x.innerText.includes("#44"))?.getAttribute("href"));
  if (el44) {
    await go(ap, el44);
    t = await text(ap);
    ok("electric: măsurătorile din aplicație apar la birou", t.includes("Din aplicație") && t.includes("C1 iluminat parcare"));
  } else ok("electric: lucrarea demo #44 există", false);
  await go(ap, "/admin");
  ok("admin de firmă NU intră în Super Admin", !ap.url().replace(BASE, "").startsWith("/admin"), ap.url().replace(BASE, ""));

  // O lucrare deschisă: dosarul și banii pe lucrare
  await go(ap, "/lucrari");
  const jobHref = await ap.evaluate(() => [...document.querySelectorAll('a[href^="/lucrari/"]')].map((a) => a.getAttribute("href")).find((h) => /^\/lucrari\/[0-9a-f-]{36}$/.test(h)));
  ok("lucrări: lista are linkuri către lucrări", !!jobHref);
  if (jobHref) {
    const s = await go(ap, jobHref);
    t = await text(ap);
    ok("lucrare: pagina se deschide cu informațiile generale", s === 200 && t.includes("Informații generale") && !ERROR_TEXT.test(t), `HTTP ${s}`);
  }
  await go(ap, "/clienti");
  const clientHref = await ap.evaluate(() => [...document.querySelectorAll('a[href^="/clienti/"]')].map((a) => a.getAttribute("href")).find((h) => /^\/clienti\/[0-9a-f-]{36}$/.test(h)));
  if (clientHref) {
    const s = await go(ap, clientHref);
    t = await text(ap);
    ok("client: fișa se deschide", s === 200 && t.includes("Editează") && !ERROR_TEXT.test(t), `HTTP ${s}`);
  } else ok("clienți: lista are linkuri către clienți", false);
  await actx.close();

  // 3. Administrator, pe telefon: nimic nu iese din ecran, meniul e sertar
  const mctx = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 1 });
  const mp = await newPage(mctx);
  await login(mp, ADMIN, "/dashboard");
  const aside = await mp.evaluate(() => { const r = document.querySelector("aside")?.getBoundingClientRect(); return r ? r.right : -1; });
  ok("telefon: meniul lateral e ascuns (nu strivește conținutul)", aside <= 0, `marginea dreaptă la ${Math.round(aside)}px`);
  await mp.click('button[aria-label="Deschide meniul"]').catch(() => {});
  await mp.waitForTimeout(400);
  const asideOpen = await mp.evaluate(() => document.querySelector("aside")?.getBoundingClientRect().left ?? -999);
  ok("telefon: butonul ☰ deschide meniul", asideOpen >= -1, `stânga la ${Math.round(asideOpen)}px`);
  for (const [path] of OFFICE_PAGES) {
    await go(mp, path);
    const o = await overflow(mp);
    const pass = o.docWidth <= o.vw + 1 && o.bad.length === 0;
    ok(`telefon ${path}: încape pe ecran`, pass, pass ? "" : o.bad.join(", ") || `${o.docWidth}px`);
    if (!pass) await shot(mp, `fail_phone_${path}`);
  }
  await mctx.close();

  // 4. Tehnician: aplicația de teren
  const tctx = await browser.newContext({ ...devices["Pixel 7"], deviceScaleFactor: 1 });
  const tp = await newPage(tctx);
  const tl2 = await login(tp, TECH, "/mobil");
  ok("tehnician demo: login → aplicație", tl2.startsWith("/mobil"), tl2);
  for (const [path, needle] of MOBILE_PAGES) {
    const s = await go(tp, path);
    t = await text(tp);
    const o = await overflow(tp);
    const pass = s === 200 && t.includes(needle) && !ERROR_TEXT.test(t);
    ok(`aplicație ${path}`, pass, pass ? "" : `HTTP ${s}, lipsește „${needle}”`);
    ok(`aplicație ${path}: încape pe ecran`, o.docWidth <= o.vw + 1 && o.bad.length === 0, o.bad.join(", "));
  }
  for (const path of ["/dashboard", "/conformitate", "/facturare", "/setari"]) {
    await go(tp, path);
    ok(`tehnicianul nu intră în ${path}`, !tp.url().replace(BASE, "").startsWith(path), tp.url().replace(BASE, ""));
  }
  await tctx.close();
  await browser.close();
};

try {
  await run();
} catch (e) {
  ok("scriptul a rulat până la capăt", false, e.message.slice(0, 300));
}
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.extra ? " — " + r.extra : ""}`);
const failed = results.filter((r) => !r.pass);
if (serverErrors.length) {
  console.log("\nErori în browser / pe server:\n" + [...new Set(serverErrors)].join("\n"));
}
if (warnings.length) console.log("\nAvertismente (nu opresc verificarea):\n" + [...new Set(warnings)].join("\n"));
console.log(`\n${results.length - failed.length}/${results.length} trecute${serverErrors.length ? `, ${new Set(serverErrors).size} erori de server/browser` : ""}`);
process.exit(failed.length || serverErrors.length ? 1 : 0);
