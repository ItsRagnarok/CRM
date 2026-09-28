import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext, ROLE_LABELS } from "@/lib/auth";
import { CompanyDetailForm } from "./company-detail-form";

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminContext();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: companies }, { data: users }] = await Promise.all([
    supabase.rpc("platform_admin_list_companies"),
    supabase.rpc("platform_admin_list_company_users", { org_id: id }),
  ]);

  const company = (companies ?? []).find((c) => c.id === id);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/companii" className="mb-4 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#9b93b5]">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi la Companii
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-extrabold text-[#17151f]">{company.name}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            company.is_active ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
          }`}
        >
          {company.is_active ? "Activă" : "Suspendată"}
        </span>
      </div>
      <div className="mt-1 text-[13px] text-[#9b93b5]">
        {company.user_count} utilizatori · {company.job_count} lucrări · creată{" "}
        {new Date(company.created_at).toLocaleDateString("ro-RO")}
      </div>

      <div className="mt-6">
        <CompanyDetailForm company={company} />
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        <div className="border-b border-[#f2f0f9] px-5 py-3.5 text-[14px] font-bold text-[#17151f]">
          Utilizatori ({users?.length ?? 0})
        </div>
        <div className="flex flex-col divide-y divide-[#f2f0f9]">
          {(users ?? []).map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{u.full_name}</div>
                <div className="text-[12px] text-[#9b93b5]">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {!u.is_active && (
                  <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[10.5px] font-bold text-danger">
                    Inactiv
                  </span>
                )}
                <span className="rounded-full bg-[#f2f0f9] px-2.5 py-1 text-[11px] font-bold text-[#5c5670]">
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
            </div>
          ))}
          {(users ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-[#9b93b5]">Niciun utilizator încă.</div>
          )}
        </div>
      </div>
    </div>
  );
}
