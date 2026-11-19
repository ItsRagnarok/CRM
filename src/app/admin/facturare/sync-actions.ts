"use server";
import { billingDb, BillingError } from "@/lib/billing/store";
import { syncStore } from "@/lib/billing/sync";
import { providerToken } from "@/lib/billing/provider";
import { oblioRead, OblioError } from "@/lib/billing/oblio";
export async function syncOblioPage(key?: string, force = false) {
  await billingDb();
  try {
    const state = await syncStore(
      key ? "status" : "begin",
      key ? {} : { force },
    );
    if (state.phase === "done") return { state };
    if (key && key !== state.run_key)
      throw new BillingError(
        "Sincronizarea a fost repornită. Reia actualizarea.",
      );
    const db = await billingDb();
    const { data: company, error } = await db
      .from("billing_company_settings")
      .select("cui")
      .eq("id", 1)
      .single();
    if (error || !company) throw new BillingError("Completează datele firmei.");
    const token = await providerToken();
    const params = new URLSearchParams({
      cif: company.cui,
      offset: String(state.page_offset),
    });
    let endpoint = "/nomenclature/clients";
    if (state.phase === "invoices") {
      endpoint = "/docs/invoice/list";
      Object.entries({
        limitPerPage: "100",
        draft: "0",
        canceled: "-1",
        withProducts: "1",
        withCollects: "1",
        orderBy: "id",
        orderDir: "ASC",
      }).forEach(([k, v]) => params.set(k, v));
    }
    const rows = await oblioRead<unknown[]>(`${endpoint}?${params}`, token);
    if (!Array.isArray(rows))
      throw new BillingError(
        "Oblio nu a returnat lista așteptată. Datele deja preluate sunt păstrate.",
      );
    return {
      state: await syncStore("apply", {
        key: state.run_key,
        phase: state.phase,
        offset: state.page_offset,
        rows,
      }),
    };
  } catch (e) {
    return {
      error:
        e instanceof BillingError || e instanceof OblioError
          ? e.message
          : "Sincronizarea nu a putut fi finalizată. Reîncearcă.",
    };
  }
}
