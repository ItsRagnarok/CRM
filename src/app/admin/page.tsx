import Link from "next/link";
import { Building2, Users, Briefcase, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext } from "@/lib/auth";

export default async function AdminHomePage() {
  const { fullName } = await requireAdminContext();
  const supabase = await createClient();

  const { data: companies } = await supabase.rpc("platform_admin_list_companies");
  const totalCompanies = companies?.length ?? 0;
  const activeCompanies = (companies ?? []).filter((c) => c.is_active).length;
  const totalUsers = (companies ?? []).reduce((sum, c) => sum + Number(c.user_count), 0);
  const totalJobs = (companies ?? []).reduce((sum, c) => sum + Number(c.job_count), 0);
  const recent = (companies ?? []).slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <span className="inline-flex items-center gap-2 rounded-full bg-purple-soft px-3 py-1 text-[12.5px] font-semibold text-purple">
        Panou Super Admin ElectroField
      </span>
      <h1 className="mt-5 text-[26px] font-extrabold tracking-tight text-[#17151f]">
        Bine ai revenit, {fullName.split(" ")[0]}.
      </h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#5c5670]">
        Acest cont vede și administrează toate firmele client din platformă.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Building2} label="Companii" value={totalCompanies} />
        <StatCard icon={Building2} label="Active" value={activeCompanies} color="text-success" />
        <StatCard icon={Users} label="Utilizatori" value={totalUsers} />
        <StatCard icon={Briefcase} label="Lucrări create" value={totalJobs} />
      </div>

      <div className="mt-8 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        <div className="flex items-center justify-between border-b border-[#f2f0f9] px-5 py-3.5">
          <div className="text-[14px] font-bold text-[#17151f]">Companii recente</div>
          <Link href="/admin/companii" className="flex items-center gap-1 text-[12.5px] font-bold text-purple">
            Vezi toate <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-[#f2f0f9]">
          {recent.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companii/${c.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-[#faf9fd]"
            >
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{c.name}</div>
                <div className="text-[12px] text-[#9b93b5]">{c.user_count} utilizatori</div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  c.is_active ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                }`}
              >
                {c.is_active ? "Activă" : "Suspendată"}
              </span>
            </Link>
          ))}
          {recent.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-[#9b93b5]">
              Nicio companie încă.{" "}
              <Link href="/admin/companii/noua" className="font-bold text-purple">
                Creează prima →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e7e3f5] bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-purple-soft">
        <Icon className="h-4 w-4 text-purple" strokeWidth={1.8} />
      </div>
      <div className={`mt-3 text-[20px] font-extrabold ${color ?? "text-[#17151f]"}`}>{value}</div>
      <div className="mt-0.5 text-[12px] font-semibold text-[#9b93b5]">{label}</div>
    </div>
  );
}
