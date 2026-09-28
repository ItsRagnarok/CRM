import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Users, Plus, Search } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "Toți" },
  { value: "active", label: "Activi" },
  { value: "inactive", label: "Inactivi" },
] as const;

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, company_name, client_type, phone, email, address, status")
    .eq("organization_id", organization.id);

  if (status === "active" || status === "inactive") {
    query = query.eq("status", status);
  }
  if (q.trim()) {
    const term = q.trim().replace(/[%,]/g, "");
    query = query.or(
      `name.ilike.%${term}%,company_name.ilike.%${term}%,cui.ilike.%${term}%`
    );
  }

  const { data: clients } = await query.order("created_at", { ascending: false });
  const hasFilters = Boolean(q.trim()) || Boolean(status);

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-extrabold text-foreground">Clienți</h1>
        <Link
          href="/clienti/nou"
          className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Client nou
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex max-w-[360px] flex-1 items-center gap-2.5 rounded-[10px] border border-[#d0d5dd] bg-white px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-2" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Caută după nume, firmă sau CUI…"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-2"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        <div className="flex items-center gap-1 rounded-[10px] bg-neutral-bg p-1">
          {STATUS_TABS.map((tab) => {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (tab.value) params.set("status", tab.value);
            const href = params.toString() ? `/clienti?${params}` : "/clienti";
            const isActive = tab.value === status;
            return (
              <Link
                key={tab.value || "toti"}
                href={href}
                className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  isActive ? "bg-white text-foreground shadow-sm" : "text-muted"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {clients && clients.length > 0 ? (
        <div className="overflow-hidden rounded-[13px] border border-border bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Nume / Companie</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3">Adresă</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-[#f2f4f7] hover:bg-[#f9fafb]">
                  <td className="px-5 py-3.5">
                    <Link href={`/clienti/${c.id}`} className="block">
                      <div className="text-[13.5px] font-bold text-foreground">
                        {c.name}
                      </div>
                      <div className="text-[12px] text-muted-2">
                        {c.client_type === "company" ? "Companie" : "Persoană fizică"}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                    {c.address ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={c.status === "active" ? "Activ" : "Inactiv"}
                      className={
                        c.status === "active"
                          ? "bg-success-bg text-success"
                          : "bg-neutral-bg text-neutral"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : hasFilters ? (
        <EmptyState
          icon={Search}
          title="Niciun client găsit"
          description="Încearcă alți termeni de căutare sau elimină filtrul de status."
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Niciun client încă"
          description="Adaugă primul client pentru a putea crea lucrări pentru el."
          action={
            <Link
              href="/clienti/nou"
              className="mt-1 flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[13px] font-bold text-white"
            >
              <Plus className="h-4 w-4" /> Client nou
            </Link>
          }
        />
      )}
    </div>
  );
}
