
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";

const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/downloads", "/confidentialitate", "/termeni", "/blog", "/sitemap", "/robots.txt", "/programare", "/mobil-login", "/status"];
export async function middleware(request: NextRequest) {
  if (parsePreview(request.cookies.get(PREVIEW_COOKIE)?.value) && !["GET", "HEAD"].includes(request.method) && request.nextUrl.pathname !== "/api/admin/preview-exit") {
    return NextResponse.json({ error: "Modul de vizualizare nu permite modificări." }, { status: 403 });
  }
  if (request.method === "POST" && request.nextUrl.pathname === "/api/programari") {
    return NextResponse.next({ request });
  }
  // Public site assets do not need a session lookup.
  if (["/robots.txt", "/sitemap.xml", "/sitemap-blog.xml", "/blog-style.css", "/public-web-analytics.js", "/manifest.json", "/sw.js"].includes(request.nextUrl.pathname)) {
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

  // Verify the identity before making authentication routing decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path));

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

  if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/mobil-login")) {
    return redirectWithSession(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
