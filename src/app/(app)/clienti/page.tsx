import Link from "next/link";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Users, Plus } from "lucide-react";

export default async function ClientiPage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, company_name, client_type, phone, email, address, status")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

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
