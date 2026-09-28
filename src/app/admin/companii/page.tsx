import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  team: "Team",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminContext();
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: companies } = await supabase.rpc("platform_admin_list_companies");
  const filtered = q
    ? (companies ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : (companies ?? []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-extrabold text-[#17151f]">Companii</h1>
        <div className="flex-1" />
        <form className="flex max-w-[280px] flex-1 items-center gap-2 rounded-[10px] border border-[#e7e3f5] bg-white px-3.5 py-2.5">
          <Search className="h-3.5 w-3.5 text-[#9b93b5]" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Caută companie…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9b93b5]"
          />
        </form>
        <Link
          href="/admin/companii/noua"
          className="flex items-center gap-1.5 rounded-[10px] bg-purple px-4 py-2.5 text-[13.5px] font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Companie nouă
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Companii totale" value={companies?.length ?? 0} />
        <StatCard
          label="Active"
          value={(companies ?? []).filter((c) => c.is_active).length}
          color="text-success"
        />
        <StatCard
          label="Suspendate"
          value={(companies ?? []).filter((c) => !c.is_active).length}
          color="text-danger"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        {filtered.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#faf9fd] text-left text-[11px] font-bold uppercase tracking-wide text-[#9b93b5]">
                <th className="px-5 py-3">Companie</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Utilizatori</th>
                <th className="px-5 py-3">Lucrări</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Creată</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-[#f2f0f9]">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/companii/${c.id}`} className="text-[13.5px] font-bold text-[#17151f] hover:text-purple">
                      {c.name}
                    </Link>
                    {c.cui && <div className="text-[11.5px] text-[#9b93b5]">{c.cui}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-[#5c5670]">
                    {PLAN_LABELS[c.subscription_plan] ?? c.subscription_plan}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#5c5670]">{c.user_count}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#5c5670]">{c.job_count}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        c.is_active ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                      }`}
                    >
                      {c.is_active ? "Activă" : "Suspendată"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px] text-[#9b93b5]">
                    {new Date(c.created_at).toLocaleDateString("ro-RO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Building2}
            title="Nicio companie"
            description={q ? "Încearcă altă căutare." : "Creează prima companie client din platformă."}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-[13px] border border-[#e7e3f5] bg-white px-[18px] py-4">
      <div className={`text-[12.5px] font-semibold ${color ?? "text-[#9b93b5]"}`}>{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold text-[#17151f]">{value}</div>
    </div>
  );
}
