import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/preview";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new Response("Forbidden", { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 2048) return new Response("Too large", { status: 413 });
  let body;
  try { body = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (!body || !UUID.test(body.sessionId ?? "") || !["web", "mobile"].includes(body.channel)
    || !Number.isInteger(body.activeSeconds) || body.activeSeconds < 0 || body.activeSeconds > 35
    || typeof body.route !== "string" || body.route.length > 100 || !/^\/[a-zA-Z0-9/_:-]*$/.test(body.route)
    || !["start", "ping", "hidden", "close", "logout"].includes(body.event)) return new Response("Invalid event", { status: 400 });
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { error } = await db.rpc("ef_record_usage", { session_id: body.sessionId, p_channel: body.channel,
    p_active_seconds: body.activeSeconds, p_route: body.route, p_event: body.event });
  return error ? NextResponse.json({ error: "Activitatea nu a putut fi înregistrată." }, { status: 400 }) : new Response(null, { status: 204 });
}
