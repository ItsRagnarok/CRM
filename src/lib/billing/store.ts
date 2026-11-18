import "server-only";
import { cookies } from "next/headers";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_COOKIE, parsePreview } from "@/lib/preview";

export async function billingDb() {
  await requireAdminContext();
  if (parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value)) {
    throw new Error(
      "Închide vizualizarea companiei înainte de a folosi facturarea.",
    );
  }
  return createClient({ ignorePreview: true });
}
