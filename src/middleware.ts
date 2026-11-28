import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";
import { MARKETING_SLUGS } from "@/lib/marketing-pages";

const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/downloads", "/confidentialitate", "/termeni", "/blog", "/sitemap", "/robots.txt", "/programare", "/mobil-login", "/status", "/solicitare"];
export async function middleware(request: NextRequest) {
  if (parsePreview(request.cookies.get(PREVIEW_COOKIE)?.value) && !["GET", "HEAD"].includes(request.method) && request.nextUrl.pathname !== "/api/admin/preview-exit") {
    return NextResponse.json({ error: "Modul de vizualizare nu permite modificări." }, { status: 403 });
  }
  if (request.method === "POST" && ["/api/programari", "/api/analytics"].includes(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }
  // Public site assets do not need a session lookup (incl. the IndexNow key file).
  if (request.nextUrl.pathname === "/d40280e4de21e42ba69e38e8aaa74cdc.txt" || request.nextUrl.pathname.startsWith("/pdfjs/")) return NextResponse.next({ request });
  if (["/robots.txt", "/sitemap.xml", "/blog-style.css", "/public-web-analytics.js", "/ef-analytics.js", "/manifest.json", "/sw.js", "/mobil-offline.html", "/api/version", "/api/prospect-probe"].includes(request.nextUrl.pathname)) {
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

  const { pathname } = request.nextUrl;
  const isPublicPath = pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path)) || MARKETING_SLUGS.includes(pathname.slice(1));

  // A redirect built from scratch would drop the refreshed session cookies that
  // getUser() just set. The rotated refresh token would be lost and the next
  // request would present the old, already-used one, which logs the user out.
  const redirectWithSession = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!user && !isPublicPath) {
    const inApp = pathname === "/mobil" || pathname.startsWith("/mobil/");
    return redirectWithSession(new URL(inApp ? "/mobil-login" : "/login", request.url));
  }

  if (user && (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/mobil-login")) {
    return redirectWithSession(new URL("/start", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|woff2|ico)$).*)"],
};
