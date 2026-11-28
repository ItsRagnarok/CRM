import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";
import { classifyPath, isSessionlessPath, loginPathFor, PUBLIC_POST_PATHS, SIGNED_IN_ENTRY_PATHS } from "@/lib/route-access";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (parsePreview(request.cookies.get(PREVIEW_COOKIE)?.value) && !["GET", "HEAD"].includes(request.method) && pathname !== "/api/admin/preview-exit") {
    return NextResponse.json({ error: "Modul de vizualizare nu permite modificări." }, { status: 403 });
  }
  if (request.method === "POST" && PUBLIC_POST_PATHS.includes(pathname)) {
    return NextResponse.next({ request });
  }
  // Public site assets do not need a session lookup (incl. the IndexNow key file and /llms.txt).
  if (isSessionlessPath(pathname)) {
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Verify the identity before making authentication routing decisions. getClaims() reîmprospătează
  // sesiunea dacă a expirat și verifică semnătura tokenului local (chei ES256), fără un drum la
  // serverul de autentificare la fiecare cerere, cum făcea getUser().
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims?.sub ? claimsData.claims : null;

  // A redirect built from scratch would drop the refreshed session cookies that
  // getUser() just set. The rotated refresh token would be lost and the next
  // request would present the old, already-used one, which logs the user out.
  const redirectWithSession = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  // Without a session only the app's own routes send the visitor to log in (src/lib/route-access.ts).
  // Public pages and unknown addresses fall through: Next serves the real page or a 404 (noindex),
  // never a redirect to /login for a URL that does not exist.
  if (!user && classifyPath(pathname) === "private") {
    return redirectWithSession(new URL(loginPathFor(pathname), request.url));
  }

  if (user && SIGNED_IN_ENTRY_PATHS.includes(pathname)) {
    return redirectWithSession(new URL("/start", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|woff2|ico)$).*)"],
};
