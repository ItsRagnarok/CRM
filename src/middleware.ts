
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth",
  "/downloads",
  "/confidentialitate",
  "/termeni",
  "/blog",
  "/sitemap",
  "/robots.txt",
  "/programare.html",
];

export async function middleware(request: NextRequest) {
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

  // Citește sesiunea utilizatorului autentificat.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  const isPublicPath =
    pathname === "/" ||
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    );

  // Redirecționează utilizatorii neautentificați
  // către login dacă încearcă să acceseze o pagină privată.
  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Utilizatorii autentificați nu au nevoie de paginile login/signup.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
