import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { STAGES, complaintDraft, openClocks } from "@/lib/pv";
import { EditForm } from "../pv-forms";
import { deleteProject } from "../actions";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "dosar_fotovoltaic") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const { data: p } = await supabase.from("pv_projects").select("*").eq("id", id).eq("organization_id", organization.id).maybeSingle();
  if (!p) notFound();
  const today = todayInOrgTimeZone();
  const clocks = openClocks(p, { atrDays: organization.pv_atr_days, certDays: organization.pv_cert_days }, today);

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 p-6">
      <Link href="/fotovoltaic" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Înapoi la dosare</Link>
      <h1 className="text-[22px] font-extrabold">{p.name}</h1>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="text-[15px] font-bold">Ceasul operatorului</h2>
        {clocks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nicio așteptare deschisă. Completează „ATR depus” sau „Certificat cerut” mai jos și pornește ceasul.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {clocks.map((c) => (
              <div key={c.key} className={`rounded-xl border p-4 ${c.overdue ? "border-danger/40 bg-danger-bg" : "border-border"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b>{c.label}</b>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${c.overdue ? "bg-white text-danger" : "bg-neutral-bg text-neutral"}`}>
                    {c.elapsed} zile de la depunere{c.termDays ? ` · termen ${c.termDays}` : ""}{c.left !== null ? (c.overdue ? ` · depășit cu ${-c.left}` : ` · mai sunt ${c.left}`) : ""}
                  </span>
                </div>
                {c.key !== "afm" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[13px] font-semibold text-electric">Mesaj pregătit pentru operator</summary>
                    <textarea readOnly rows={12} className="mt-2 w-full rounded-[10px] border border-[#d0d5dd] bg-white p-3 text-[13px]" defaultValue={complaintDraft({ clock: c, project: p, company: organization.name, today })} />
                    <p className="mt-1 text-xs text-muted">Copiază textul și trimite-l pe canalul operatorului. Verifică numele operatorului și numărul de înregistrare înainte.</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {readOnly ? null : (
        <>
          <EditForm id={p.id} stages={[...STAGES]} v={p} />
          <form action={deleteProject}><input type="hidden" name="id" value={p.id} /><button className="rounded-[10px] border border-danger/40 px-4 py-2.5 text-[13px] font-semibold text-danger">Șterge dosarul</button></form>
        </>
      )}
    </div>
  );
}
