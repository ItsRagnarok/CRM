import "server-only";
import { cookies } from "next/headers";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";
import type { Json } from "@/lib/supabase/database.types";
import type { MailAccount, MailCredentials } from "./types";
import { accountId, MailError, validateCredentials } from "./validation";

export async function requireMailAdmin() {
  const admin = await requireAdminContext();
  if (parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value)) throw new MailError("Închide vizualizarea companiei înainte de a folosi panoul Mail.");
  return admin;
}
export async function mailStore<T>(operation: string, id?: string, config?: unknown): Promise<T> {
  const client = await createClient({ ignorePreview: true });
  const { data, error } = await client.rpc("ef_platform_mail", { operation, ...(id ? { p_id: accountId(id) } : {}), ...(config ? { config: config as Json } : {}) });
  if (error) {
    if (error.code === "23505") throw new MailError("Această adresă este deja adăugată. Editează configurația existentă.");
    if (error.message.includes("rate limit")) throw new MailError("Prea multe operații într-un minut. Așteaptă puțin și reîncearcă.");
    if (error.message.includes("account limit")) throw new MailError("Poți conecta cel mult 20 de adrese.");
    if (error.code === "P0002") throw new MailError("Adresa nu mai este configurată. Reîncarcă pagina.");
    throw new MailError("Configurația de mail nu a putut fi accesată. Reîncearcă.");
  }
  return data as T;
}
export async function listMailAccounts() { return mailStore<MailAccount[]>("list"); }
export async function getMailCredentials(id: string) {
  return validateCredentials(await mailStore<MailCredentials>("credentials", id));
}
