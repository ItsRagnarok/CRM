import "server-only";
import { billingDb, BillingError } from "./store";
import type { Json } from "@/lib/supabase/database.types";
export type SyncState = {
  phase: "clients" | "invoices" | "done";
  page_offset: number;
  run_key: string;
  completed_at: string | null;
  clients_seen: number;
  documents_seen: number;
};
export async function syncStore(
  operation: string,
  input: Record<string, unknown> = {},
) {
  const db = await billingDb();
  const { data, error } = await db.rpc("billing_sync", {
    operation,
    input: input as Json,
  });
  if (error)
    throw new BillingError(
      error.code === "P0001"
        ? error.message
        : "Datele Oblio nu au putut fi salvate. Sincronizarea poate fi reluată fără duplicate.",
    );
  return data as SyncState;
}
