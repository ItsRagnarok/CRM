/* ElectroField — service worker pentru aplicația tehnicianului (doar /mobil).
 *
 * Fără semnal:
 *  - paginile deschise deja pe telefon (și pașii lucrării, încărcați dinainte) se văd din memoria telefonului;
 *  - altfel apare o pagină clară „Fără semnal”, nu eroarea browserului;
 *  - ce face tehnicianul (poze, semnătură, sosire, închidere) NU trece pe aici: stă în coada
 *    din IndexedDB a aplicației și se trimite când revine semnalul.
 * Platforma de birou și site-ul nu sunt afectate (scope /mobil).
 */
const VERSION = "ef-mobil-v2";
const PAGES = `${VERSION}-pagini`;
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/mobil-offline.html";
const MAX_PAGES = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.add(new Request(OFFLINE_URL, { cache: "reload" }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimPages() {
  const cache = await caches.open(PAGES);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(k);
}

function isAppPage(url) {
  return url.origin === self.location.origin && (url.pathname === "/mobil" || url.pathname.startsWith("/mobil/"));
}

// O pagină fără codul ei nu funcționează (butoanele nu răspund): păstrăm și fișierele
// /_next/static/... pe care le cere pagina.
async function saveAssetsOf(html) {
  const urls = new Set((html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []).map((u) => u.replace(/&amp;/g, "&")));
  if (!urls.size) return;
  const cache = await caches.open(STATIC);
  await Promise.all([...urls].slice(0, 120).map(async (u) => {
    try {
      if (await cache.match(u)) return;
      const r = await fetch(u);
      if (r.ok) await cache.put(u, r);
    } catch { /* fără semnal */ }
  }));
}

async function savePage(request, response) {
  // Nu păstrăm redirecționări (ex. spre login) și nici erori.
  if (!response || !response.ok || response.redirected || response.type !== "basic") return;
  const cache = await caches.open(PAGES);
  await cache.put(request, response.clone());
  trimPages();
  try { await saveAssetsOf(await response.clone().text()); } catch { /* ignorăm */ }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((r) => { clearTimeout(t); resolve(r); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function pageFromNetworkOrCache(request) {
  try {
    const response = await withTimeout(fetch(request), 10000);
    savePage(request, response.clone());
    return response;
  } catch {
    const cache = await caches.open(PAGES);
    const exact = await cache.match(request);
    if (exact) return exact;
    const loose = await cache.match(request, { ignoreSearch: true });
    if (loose) return loose;
    return (await caches.match(OFFLINE_URL)) || new Response("Fără semnal", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Ieșire din cont: ștergem paginile păstrate, ca următorul utilizator al telefonului să nu le vadă.
  if (request.mode === "navigate" && (url.pathname === "/mobil-login" || url.pathname === "/login")) {
    event.waitUntil(caches.delete(PAGES));
    return;
  }

  // Fișierele aplicației au numele cu hash: nu se schimbă niciodată, deci le păstrăm.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Paginile aplicației: întâi rețeaua, iar fără semnal ultima versiune salvată.
  if (request.mode === "navigate" && isAppPage(url)) {
    event.respondWith(pageFromNetworkOrCache(request));
  }
  // Restul (date RSC, imagini, API): direct la rețea. Dacă pică, aplicația face o navigare
  // completă, pe care o servim mai sus din memorie.
});

// Aplicația cere „încarcă dinainte pașii lucrării” când tehnicianul deschide o lucrare cu semnal,
// ca să poată face poze, închide și lua semnătura și dacă pierde semnalul la client.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm" && Array.isArray(data.urls)) {
    event.waitUntil(
      Promise.all(
        data.urls.slice(0, 12).map(async (u) => {
          const url = new URL(u, self.location.origin);
          if (!isAppPage(url)) return;
          try {
            const request = new Request(url.href, { credentials: "include", headers: { Accept: "text/html" } });
            const response = await fetch(request);
            await savePage(request, response);
          } catch { /* fără semnal: încercăm data viitoare */ }
        })
      )
    );
  }
  if (data.type === "clear") event.waitUntil(caches.delete(PAGES));
});
