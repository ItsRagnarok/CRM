import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { parsePreview, PREVIEW_COOKIE, readOnlyFetch } from "@/lib/preview";

export async function createClient(options: { ignorePreview?: boolean } = {}) {
  const cookieStore = await cookies();
  const preview = options.ignorePreview ? null : parsePreview(cookieStore.get(PREVIEW_COOKIE)?.value);

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: preview ? { headers: { "x-ef-preview-org": preview.organizationId }, fetch: readOnlyFetch(fetch) } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component without a mutable cookie store;
            // safe to ignore because the proxy below refreshes the session.
          }
        },
      },
    }
  );
}
