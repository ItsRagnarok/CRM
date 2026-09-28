import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { avatarColor, initials } from "@/lib/avatar-color";
import { Users, Plus, Search } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "Toți" },
  { value: "active", label: "Activi" },
  { value: "inactive", label: "Inactivi" },
] as const;

const TYPE_TABS = [
  { value: "company", label: "Companii" },
  { value: "individual", label: "Persoane fizice" },
] as const;

function formatDateRo(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const { q = "", status = "", type = "" } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, company_name, client_type, cui, phone, email, address, status")
    .eq("organization_id", organization.id);

  if (status === "active" || status === "inactive") {
    query = query.eq("status", status);
  }
  if (type === "company" || type === "individual") {
    query = query.eq("client_type", type);
  }
  if (q.trim()) {
    const term = q.trim().replace(/[%,]/g, "");
    query = query.or(
      `name.ilike.%${term}%,company_name.ilike.%${term}%,cui.ilike.%${term}%,phone.ilike.%${term}%`
    );
  }

  const { data: clients } = await query.order("created_at", { ascending: false });
  const hasFilters = Boolean(q.trim()) || Boolean(status) || Boolean(type);

  const clientIds = (clients ?? []).map((c) => c.id);
  const { data: jobRows } = clientIds.length
    ? await supabase.from("jobs").select("client_id, scheduled_date").in("client_id", clientIds)
    : { data: [] as { client_id: string; scheduled_date: string }[] };

  const jobStats = new Map<string, { count: number; lastDate: string | null }>();
  for (const row of jobRows ?? []) {
    const stat = jobStats.get(row.client_id) ?? { count: 0, lastDate: null };
    stat.count += 1;
    if (!stat.lastDate || row.scheduled_date > stat.lastDate) stat.lastDate = row.scheduled_date;
    jobStats.set(row.client_id, stat);
  }

  const buildHref = (overrides: { status?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const nextStatus = overrides.status !== undefined ? overrides.status : status;
    const nextType = overrides.type !== undefined ? overrides.type : type;
    if (nextStatus) params.set("status", nextStatus);
    if (nextType) params.set("type", nextType);
    return params.toString() ? `/clienti?${params}` : "/clienti";
  };

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-extrabold text-foreground">Clienți</h1>
        <Link
          href="/clienti/nou"
          prefetch={false}
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
            placeholder="Caută client, companie, telefon…"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-2"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {type && <input type="hidden" name="type" value={type} />}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildHref({ status: "" })}
            prefetch={false}
            className={`rounded-[9px] px-3.5 py-2 text-[13px] font-semibold ${
              !status ? "bg-[#101828] text-white" : "border border-[#d0d5dd] bg-white text-[#344054]"
            }`}
          >
            Toți
          </Link>
          {STATUS_TABS.slice(1).map((tab) => (
            <Link
              key={tab.value}
              href={buildHref({ status: tab.value })}
              prefetch={false}
              className={`rounded-[9px] px-3.5 py-2 text-[13px] font-semibold ${
                status === tab.value ? "bg-[#101828] text-white" : "border border-[#d0d5dd] bg-white text-[#344054]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          <div className="mx-1 h-5 w-px bg-border" />
          {TYPE_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={buildHref({ type: type === tab.value ? "" : tab.value })}
              prefetch={false}
              className={`rounded-[9px] px-3.5 py-2 text-[13px] font-semibold ${
                type === tab.value ? "bg-[#101828] text-white" : "border border-[#d0d5dd] bg-white text-[#344054]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
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
                <th className="px-5 py-3 text-center">Lucrări</th>
                <th className="px-5 py-3">Ultima intervenție</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const color = avatarColor(c.id);
                const stat = jobStats.get(c.id);
                return (
                  <tr key={c.id} className="border-t border-[#f2f4f7] hover:bg-[#f9fafb]">
                    <td className="px-5 py-3.5">
                      <Link href={`/clienti/${c.id}`} prefetch={false} className="flex items-center gap-2.5">
                        <div
                          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[12.5px] font-bold"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {initials(c.name)}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-bold text-foreground">{c.name}</div>
                          <div className="text-[12px] text-muted-2">
                            {c.client_type === "company" ? "Companie" : "Persoană fizică"}
                            {c.cui ? ` · CUI ${c.cui}` : ""}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#344054]">{c.phone ?? "—"}</td>
                    <td className="px-5 py-3.5 text-[13px] text-[#344054]">{c.address ?? "—"}</td>
                    <td className="px-5 py-3.5 text-center text-[13px] font-bold text-[#344054]">
                      {stat?.count ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#344054]">
                      {stat?.lastDate ? formatDateRo(stat.lastDate) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={c.status === "active" ? "Activ" : "Inactiv"}
                        className={c.status === "active" ? "bg-success-bg text-success" : "bg-neutral-bg text-neutral"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : hasFilters ? (
        <EmptyState
          icon={Search}
          title="Niciun client găsit"
          description="Încearcă alți termeni de căutare sau elimină filtrele."
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Niciun client încă"
          description="Adaugă primul client pentru a putea crea lucrări pentru el."
          action={
            <Link
              href="/clienti/nou"
              prefetch={false}
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
