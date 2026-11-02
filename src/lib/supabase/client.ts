import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { parsePreview, PREVIEW_COOKIE, readOnlyFetch } from "@/lib/preview";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { fetch: async (input, init) => {
      const value = typeof document === "undefined" ? undefined : document.cookie.split("; ").find((c) => c.startsWith(`${PREVIEW_COOKIE}=`))?.split("=").slice(1).join("=");
      const preview = parsePreview(value ? decodeURIComponent(value) : undefined);
      if (!preview) return fetch(input, init);
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.set("x-ef-preview-org", preview.organizationId);
      return readOnlyFetch(fetch)(input, { ...init, headers });
    } } }
  );
}
