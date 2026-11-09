import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public page-view beacon. No cookies and no stored IP: the visitor id is a daily-rotating hash, so the same person
// cannot be followed across days. Bots and "Do Not Track" visitors are not counted.
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|facebookexternalhit|curl|wget|python|node-fetch/i;
const norm = (host: string) => host.replace(/^www\./, "").toLowerCase();

export async function POST(request: NextRequest) {
  const quiet = () => new Response(null, { status: 204 });
  if (request.headers.get("dnt") === "1") return quiet();
  const origin = request.headers.get("origin");
  let originHost = "";
  try { originHost = origin ? norm(new URL(origin).host) : ""; } catch { /* malformed origin */ }
  if (!originHost || originHost !== norm(request.nextUrl.host)) return new Response("Forbidden", { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return new Response("Too large", { status: 413 });
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return quiet();

  let body: { path?: unknown; referrer?: unknown; utm?: unknown };
  try { body = JSON.parse(await request.text()); } catch { return new Response("Invalid", { status: 400 }); }
  const path = typeof body.path === "string" ? body.path : "";
  if (!/^\/[A-Za-z0-9/_.-]{0,198}$/.test(path) || path.startsWith("/admin") || path.startsWith("/api")) return quiet();

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
  await db.rpc("ef_record_site_view", { p_path: path, p_referrer_host: referrerHost, p_utm_source: utm, p_country: request.headers.get("x-vercel-ip-country") ?? "", p_device: device, p_visitor: visitor });
  return quiet();
}
