import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/preview";

// Recover invalid/expired preview contexts without redirecting between admin and dashboard.
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);
  response.cookies.delete(PREVIEW_COOKIE);
  return response;
}
