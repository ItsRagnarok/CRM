import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — long enough for a page view/PDF render, short enough that a leaked link doesn't stay valid.

// The "attachments" bucket (job photos, receipts, signatures, client
// documents) was public until this fix — anyone with a link could open any
// org's files, no auth required. RLS already exists on storage.objects and
// correctly scopes access by organization folder, but a public bucket
// serves files over a path that bypasses RLS entirely regardless of
// policies. Signed URLs are what actually makes that RLS apply.

export async function signedAttachmentUrls(
  supabase: SupabaseClient<Database>,
  paths: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();
  if (uniquePaths.length === 0) return map;

  const { data, error } = await supabase.storage.from("attachments").createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("signedAttachmentUrls failed", error);
    return map;
  }
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

export async function signedAttachmentUrl(
  supabase: SupabaseClient<Database>,
  path: string | null | undefined
): Promise<string> {
  if (!path) return "";
  const { data, error } = await supabase.storage.from("attachments").createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("signedAttachmentUrl failed", error);
    return "";
  }
  return data?.signedUrl ?? "";
}
