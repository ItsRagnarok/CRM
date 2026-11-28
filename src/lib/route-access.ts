/**
 * Ce face middleware-ul cu un vizitator fără cont, în funcție de adresă (funcții pure, testate în
 * scripts/middleware-routes.test.mts).
 *
 * - "private": rutele aplicației. Fără sesiune, vizitatorul ajunge la /login (sau la /mobil-login
 *   pentru /mobil...). Lista e scrisă de mână din src/app; testul pică dacă apare un folder de rută
 *   neclasificat, ca o rută nouă să nu devină publică fără să observe cineva.
 * - "public": paginile site-ului (prima pagină, blogul, paginile pe meserie, programarea, termenii).
 * - "notfound": orice altceva. Trece mai departe, iar Next servește pagina reală sau un 404 cu
 *   noindex (src/app/not-found.tsx), nu o redirecționare spre login.
 *
 * Potrivirea e pe segmente: "/lucrari" acoperă /lucrari și /lucrari/x, nu și /lucrarix.
 * Fișierul nu importă nimic cu alias "@/", ca să poată fi citit și de middleware și de teste.
 */
import { MARKETING_SLUGS } from "./marketing-pages";

export type RouteAccess = "public" | "private" | "notfound";

/**
 * Rutele care cer cont. Cuprinde toate folderele de rută din src/app care nu sunt publice: cele din
 * grupul (app), /start, /admin, /mobil (fără /mobil-login), paginile tipăribile și /api (API-ul
 * rămâne exact ca înainte: fără sesiune, redirecționare spre /login, cu excepțiile de mai jos).
 */
export const PRIVATE_PREFIXES = [
  // src/app/(app)/*: panoul biroului
  "/aprobari", "/calendar", "/cereri", "/cheltuieli", "/clienti", "/conformitate", "/dashboard", "/echipe",
  "/electric", "/facturare", "/foaie-parcurs", "/fotovoltaic", "/gaze", "/harta", "/lucrari", "/luni",
  "/materiale", "/mesaje", "/notificari", "/pontaj", "/rapoarte", "/setari", "/ssm",
  // restul aplicației, în afara grupului
  "/start", "/admin", "/mobil", "/fise-gaze", "/pv-lucrari-ascunse", "/pv-scule", "/rapoarte-lucrare",
  "/accepta-termeni", "/cont-suspendat",
  // rutele API
  "/api",
] as const;

/** Paginile publice (cu tot ce e sub ele). Paginile pe meserie vin din MARKETING_SLUGS. */
export const PUBLIC_PREFIXES = [
  "/login", "/signup", "/auth", "/downloads", "/confidentialitate", "/termeni", "/blog", "/programare",
  "/mobil-login", "/status", "/solicitare", "/despre",
  "/robots.txt", "/sitemap.xml", "/llms.txt",
] as const;

/**
 * Fișiere publice servite fără nicio lucrare cu sesiunea (nici citire, nici reîmprospătare):
 * fișiere statice din public/ și sonda de versiune a aplicației.
 */
export const SESSIONLESS_PATHS: ReadonlySet<string> = new Set([
  "/robots.txt", "/sitemap.xml", "/llms.txt",
  "/d40280e4de21e42ba69e38e8aaa74cdc.txt", // cheia IndexNow
  "/BingSiteAuth.xml", // verificarea site-ului în Bing Webmaster Tools
  "/blog-style.css", "/blog-tools.css", "/blog-guides.css", "/blog-guides.js",
  "/public-web-analytics.js", "/ef-analytics.js",
  "/manifest.json", "/sw.js", "/mobil-offline.html",
  "/api/version",
]);

/** Formularele publice care trimit date fără cont (programarea unui demo, analiticele site-ului). */
export const PUBLIC_POST_PATHS: readonly string[] = ["/api/programari", "/api/analytics"];

/** Adresele unde un utilizator deja conectat e trimis la /start. */
export const SIGNED_IN_ENTRY_PATHS: readonly string[] = ["/", "/login", "/signup", "/mobil-login"];

/** Adresa e chiar `base` sau un segment sub ea ("/lucrari" → /lucrari, /lucrari/x; nu /lucrarix). */
export function underPrefix(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Decodată, cu bare oblice normalizate, cu litere mici și fără segmente de tip „(grup)”. */
function tidyForPrivateCheck(p: string): string {
  p = p.replace(/\\/g, "/").replace(/\/{2,}/g, "/").toLowerCase();
  p = p.split("/").filter((segment) => !/^\(.*\)$/.test(segment)).join("/");
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * Formele „cele mai largi” ale adresei, folosite doar ca rutele private să nu poată fi ocolite:
 * forma decodată (vezi tidyForPrivateCheck) și aceeași formă cu segmentele „.” și „..” rezolvate
 * după decodare, ca /x%2F..%2Flucrari să ajungă /lucrari. Se verifică ambele: /lucrari%2F..%2Fx
 * rămâne privată prin forma nerezolvată, chiar dacă cea rezolvată e /x.
 */
function normalizedForPrivateCheck(pathname: string): string[] {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Codare invalidă: se verifică forma brută.
  }
  const tidy = tidyForPrivateCheck(decoded);
  let resolved = tidy;
  try {
    // URL rezolvă „.” și „..” (și formele codate %2e); rezultatul e recodat, deci se decodează iar.
    resolved = tidyForPrivateCheck(decodeURIComponent(new URL(tidy, "http://n").pathname));
  } catch {
    // Adresă pe care URL n-o poate citi: rămâne forma nerezolvată.
  }
  return resolved === tidy ? [tidy] : [tidy, resolved];
}

function isPrivate(pathname: string): boolean {
  const candidates = [pathname, ...normalizedForPrivateCheck(pathname)];
  return candidates.some((p) => PRIVATE_PREFIXES.some((base) => underPrefix(p, base)));
}

/** Clasifică o adresă pentru un vizitator fără sesiune. Privat are întâietate (fail-closed). */
export function classifyPath(pathname: string): RouteAccess {
  if (isPrivate(pathname)) return "private";
  if (
    pathname === "/" ||
    SESSIONLESS_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((base) => underPrefix(pathname, base)) ||
    MARKETING_SLUGS.includes(pathname.slice(1))
  ) {
    return "public";
  }
  return "notfound";
}

/** Unde ajunge un vizitator fără sesiune pe o rută privată: aplicația de telefon are login-ul ei. */
export function loginPathFor(pathname: string): "/login" | "/mobil-login" {
  return normalizedForPrivateCheck(pathname).some((p) => underPrefix(p, "/mobil")) ? "/mobil-login" : "/login";
}

/** Fișier public servit fără sesiune (potrivire exactă). */
export function isSessionlessPath(pathname: string): boolean {
  // public/pdfjs: workerul pdf.js pentru vizualizatorul de rapoarte PDF din aplicația de telefon.
  return SESSIONLESS_PATHS.has(pathname) || pathname.startsWith("/pdfjs/");
}
