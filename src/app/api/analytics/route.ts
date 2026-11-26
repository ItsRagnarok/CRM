import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ipHash } from "@/lib/ip-key";
import { parseUserAgent, cleanScreen, cleanLang } from "@/lib/user-agent";

// Public page-view beacon. No cookies and no stored IP: the visitor id is a daily-rotating hash, so the same person
// cannot be followed across days. Bots and "Do Not Track" visitors are not counted.
const BOT = /bot|crawl|spider|slurp|lighthouse|preview|monitor|facebookexternalhit|curl|wget|python|node-fetch/i;
// Browsere conduse de un program (teste automate, roboți care imită un om): se țin separat, nu în statistici.
const AUTOMATED = /headless|playwright|puppeteer|selenium|phantomjs|webdriver/i;
const norm = (host: string) => host.replace(/^www\./, "").toLowerCase();

export async function POST(request: NextRequest) {
  const quiet = () => new Response(null, { status: 204 });
  // Se numără doar vizitele de pe site-ul public (deploy-ul de producție de pe Vercel). Testele
  // automate, serverele locale și previzualizările scriu în aceeași bază de date, dar nu sunt vizitatori.
  if (process.env.VERCEL_ENV !== "production") return quiet();
  if (request.headers.get("dnt") === "1") return quiet();
  const origin = request.headers.get("origin");
  let originHost = "";
  try { originHost = origin ? norm(new URL(origin).host) : ""; } catch { /* malformed origin */ }
  if (!originHost || originHost !== norm(request.nextUrl.host)) return new Response("Forbidden", { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return new Response("Too large", { status: 413 });
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return quiet();

  let body: { path?: unknown; referrer?: unknown; utm?: unknown; type?: unknown; seconds?: unknown; screen?: unknown; lang?: unknown; wd?: unknown };
  try { body = JSON.parse(await request.text()); } catch { return new Response("Invalid", { status: 400 }); }
  const path = typeof body.path === "string" ? body.path : "";
  if (!/^\/[A-Za-z0-9/_.-]{0,198}$/.test(path) || path.startsWith("/admin") || path.startsWith("/api")) return quiet();
  if (body.wd === true || AUTOMATED.test(ua)) {
    if (body.type !== "time") {
      let autoCity = "";
      try { autoCity = decodeURIComponent(request.headers.get("x-vercel-ip-city") ?? ""); } catch { /* oraș cu codare greșită */ }
      const db = await createClient();
      await db.rpc("ef_record_site_automated", {
        p_path: path, p_country: request.headers.get("x-vercel-ip-country") ?? "", p_city: autoCity,
        p_device: /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop", p_browser: parseUserAgent(ua, null).browser ?? "",
      });
    }
    return quiet();
  }

  let referrerHost = "";
  if (typeof body.referrer === "string" && body.referrer) {
    try { const h = norm(new URL(body.referrer).host); if (h && h !== norm(request.nextUrl.host)) referrerHost = h; } catch { /* invalid referrer */ }
  }
  const utm = typeof body.utm === "string" ? body.utm.replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60) : "";
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${ip}|${ua}|${day}|ef-analytics`).digest("hex").slice(0, 32);
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";

  const db = await createClient();
  const excluded = ip ? ipHash(ip) : null;
  if (excluded && (await db.rpc("ef_site_ip_excluded", { p_hash: excluded })).data === true) return quiet();

  // „time”: cât a stat pe pagină (trimis la plecare). „lead”: a trimis o cerere de demo / programare.
  if (body.type === "time") {
    const seconds = Math.round(Number(body.seconds));
    if (Number.isFinite(seconds) && seconds > 0) await db.rpc("ef_record_site_time", { p_visitor: visitor, p_path: path, p_seconds: Math.min(seconds, 3600) });
    return quiet();
  }
  // Județul (codul ISO, ex. CJ) și orașul vin de la Vercel, din IP; IP-ul nu se păstrează.
  let city = "";
  try { city = decodeURIComponent(request.headers.get("x-vercel-ip-city") ?? ""); } catch { /* oraș cu codare greșită */ }
  // Sistemul, browserul și tipul de telefon (pe Android, Chrome trimite modelul în Sec-CH-UA-Model).
  const info = parseUserAgent(ua, request.headers.get("sec-ch-ua-model"));
  await db.rpc("ef_record_site_view", {
    p_path: path, p_referrer_host: referrerHost, p_utm_source: utm, p_country: request.headers.get("x-vercel-ip-country") ?? "", p_device: device, p_visitor: visitor,
    p_region: request.headers.get("x-vercel-ip-country-region") ?? "", p_city: city, p_kind: body.type === "lead" ? "lead" : "view",
    p_os: info.os ?? "", p_browser: info.browser ?? "", p_model: info.model ?? "", p_screen: cleanScreen(body.screen) ?? "", p_lang: cleanLang(body.lang) ?? "",
  });
  return quiet();
}
