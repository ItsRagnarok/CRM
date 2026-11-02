import { NextRequest, NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/auth";
import { PREVIEW_COOKIE } from "@/lib/preview";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new Response("Forbidden", { status: 403 });
  await requireAdminContext();
  const response = NextResponse.redirect(new URL("/admin/companii", request.url), 303);
  response.cookies.delete(PREVIEW_COOKIE);
  return response;
}
