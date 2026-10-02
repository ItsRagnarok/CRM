import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdminContext, ROLE_LABELS } from "@/lib/auth";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import { CompanyDetailForm } from "./company-detail-form";

const CLIENT_STATUS_LABELS: Record<string, string> = {
  active: "Activ",
  inactive: "Inactiv",
};

function formatLastSignIn(value: string | null) {
  if (!value) return "Niciodată";
  return new Date(value).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminContext();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: companies }, { data: users }, { data: jobs }, { data: clients }] = await Promise.all([
    supabase.rpc("platform_admin_list_companies_v2"),
    supabase.rpc("platform_admin_list_company_users_v2", { org_id: id }),
    supabase.rpc("platform_admin_list_company_jobs", { org_id: id }),
    supabase.rpc("platform_admin_list_company_clients", { org_id: id }),
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
        {company.terms_accepted_at ? (
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-bold text-success">
            Termeni acceptați {new Date(company.terms_accepted_at).toLocaleDateString("ro-RO")}
          </span>
        ) : company.terms_declined_at ? (
          <span className="rounded-full bg-danger-bg px-2.5 py-1 text-[11px] font-bold text-danger">
            Termeni refuzați {new Date(company.terms_declined_at).toLocaleDateString("ro-RO")}
          </span>
        ) : (
          <span className="rounded-full bg-[#f2f0f9] px-2.5 py-1 text-[11px] font-bold text-[#5c5670]">
            Termeni în așteptare
          </span>
        )}
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
            <Link
              key={u.id}
              href={`/admin/companii/${id}/utilizatori/${u.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-[#faf9fd]"
            >
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{u.full_name}</div>
                <div className="text-[12px] text-[#9b93b5]">{u.email}</div>
                <div className="mt-0.5 text-[11px] text-[#9b93b5]">
                  Ultima autentificare: {formatLastSignIn(u.last_sign_in_at)}
                </div>
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
            </Link>
          ))}
          {(users ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-[#9b93b5]">Niciun utilizator încă.</div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        <div className="border-b border-[#f2f0f9] px-5 py-3.5 text-[14px] font-bold text-[#17151f]">
          Lucrări ({jobs?.length ?? 0})
        </div>
        <div className="flex flex-col divide-y divide-[#f2f0f9]">
          {(jobs ?? []).map((j) => (
            <div key={j.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{j.title}</div>
                <div className="text-[12px] text-[#9b93b5]">
                  {j.client_name} · {new Date(j.scheduled_date).toLocaleDateString("ro-RO")}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${JOB_STATUS_STYLES[j.status]}`}>
                {JOB_STATUS_LABELS[j.status]}
              </span>
            </div>
          ))}
          {(jobs ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-[#9b93b5]">Nicio lucrare încă.</div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7e3f5] bg-white">
        <div className="border-b border-[#f2f0f9] px-5 py-3.5 text-[14px] font-bold text-[#17151f]">
          Clienți ({clients?.length ?? 0})
        </div>
        <div className="flex flex-col divide-y divide-[#f2f0f9]">
          {(clients ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-[13.5px] font-bold text-[#17151f]">{c.name}</div>
                <div className="text-[12px] text-[#9b93b5]">
                  {c.company_name ?? c.phone ?? c.email ?? "—"} · {c.job_count} lucrări
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  c.status === "active" ? "bg-success-bg text-success" : "bg-[#f2f0f9] text-[#5c5670]"
                }`}
              >
                {CLIENT_STATUS_LABELS[c.status] ?? c.status}
              </span>
            </div>
          ))}
          {(clients ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] text-[#9b93b5]">Niciun client încă.</div>
          )}
        </div>
      </div>
    </div>
  );
}
