import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES } from "@/lib/forms/templates";
import { DocScreen } from "../../doc-screen";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const show = (v: unknown, unit?: string) =>
  v === undefined || v === null || v === "" ? "—" : v === true ? "Da" : v === false ? "Nu" : v === "conform" ? "Conform" : v === "neconform" ? "Neconform" : `${v}${unit ? ` ${unit}` : ""}`;

/** Un formular tehnic completat (probă, PIF, verificare electrică), doar de citit, în aplicație. */
export default async function MobileFormViewPage({ params }: { params: Promise<{ id: string; formId: string }> }) {
  const { id, formId } = await params;
  if (!UUID.test(formId)) notFound();
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const { data: f } = await supabase
    .from("job_forms")
    .select("id, template, data, completed_at, profiles!job_forms_completed_by_fkey(full_name)")
    .eq("id", formId)
    .eq("job_id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  const template = f ? FORM_TEMPLATES[f.template as keyof typeof FORM_TEMPLATES] : null;
  if (!f || !template) notFound();
  const values = (f.data ?? {}) as Record<string, unknown>;

  return (
    <DocScreen jobId={id} title={template.label}>
      <div className="m-bd">
        <div className="m-mu m-sm">
          {f.completed_at ? `Completat de ${f.profiles?.full_name ?? "tehnician"} · ${new Date(f.completed_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` : "Ciornă"}
        </div>
        {template.steps.map((st) => (
          <div key={st.title} className="m-cd m-col" style={{ gap: 6 }}>
            <div className="m-lb">{st.title}</div>
            {(st.fields ?? []).map((fl) => (
              <div key={fl.key} className="m-r" style={{ gap: 12, alignItems: "flex-start", fontSize: 14 }}>
                <span className="m-mu m-fl">{fl.label}</span>
                <b style={{ textAlign: "right", maxWidth: "55%" }}>{show(values[fl.key], fl.unit)}</b>
              </div>
            ))}
            {st.repeater &&
              (Array.isArray(values[st.repeater.key]) ? (values[st.repeater.key] as Record<string, unknown>[]) : []).map((row, i) => (
                <div key={i} style={{ background: "var(--m-input-bg, #f4f5f7)", borderRadius: 12, padding: "8px 12px", fontSize: 13.5 }}>
                  <b>{st.repeater!.itemLabel} {i + 1}</b>
                  {st.repeater!.fields.map((fl) => (
                    <div key={fl.key} className="m-r" style={{ gap: 12, justifyContent: "space-between" }}>
                      <span className="m-mu">{fl.label}</span>
                      <span style={{ fontWeight: 700 }}>{show(row[fl.key], fl.unit)}</span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        ))}
      </div>
    </DocScreen>
  );
}
