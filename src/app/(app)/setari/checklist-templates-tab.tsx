import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JOB_TYPE_LABELS } from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";
import { addChecklistTemplateItem, deleteChecklistTemplateItem } from "./checklist-actions";

type JobType = Database["public"]["Enums"]["job_type"];

const JOB_TYPES: JobType[] = [
  "instalare",
  "reparatie",
  "mentenanta",
  "inspectie",
  "interventie",
  "service",
  "demontare",
  "urgenta",
];

function pillClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-[12px] font-bold ${
    active ? "bg-electric text-white" : "bg-neutral-bg text-[#475467]"
  }`;
}

export async function ChecklistTemplatesTab({
  organizationId,
  selectedJobType,
}: {
  organizationId: string;
  selectedJobType: JobType | null;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("checklist_templates")
    .select("id, job_type, checklist_template_items(id, label, phase, sort_order)")
    .eq("organization_id", organizationId);
  query = selectedJobType ? query.eq("job_type", selectedJobType) : query.is("job_type", null);
  const { data: template } = await query.maybeSingle();

  const items = template?.checklist_template_items ?? [];
  const before = [...items].filter((i) => i.phase === "before").sort((a, b) => a.sort_order - b.sort_order);
  const after = [...items].filter((i) => i.phase === "after").sort((a, b) => a.sort_order - b.sort_order);
  const jobTypeValue = selectedJobType ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[13px] border border-border bg-white p-5">
        <div className="mb-1 text-[15px] font-bold text-foreground">Checklist-uri implicite</div>
        <p className="mb-3 text-[12.5px] leading-relaxed text-muted-2">
          Itemii de mai jos apar automat pe telefonul tehnicianului, la fiecare lucrare de tipul ales — el poate doar
          să-i bifeze, nu să-i șteargă. Poate adăuga în plus alte lucruri de verificat, dacă e nevoie, dar lista ta
          rămâne mereu acolo. „Toate tipurile” e checklist-ul folosit când lucrarea nu are un checklist specific
          setat pentru tipul ei.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Link href="/setari?tab=checklisturi" prefetch={false} className={pillClass(selectedJobType === null)}>
            Toate tipurile (implicit)
          </Link>
          {JOB_TYPES.map((jt) => (
            <Link
              key={jt}
              href={`/setari?tab=checklisturi&jt=${jt}`}
              prefetch={false}
              className={pillClass(selectedJobType === jt)}
            >
              {JOB_TYPE_LABELS[jt]}
            </Link>
          ))}
        </div>
      </div>

      <PhaseCard
        title="Checklist înainte de start"
        subtitle="Apare pe telefon când tehnicianul ajunge la locație, înainte să înceapă lucrul."
        phase="before"
        jobTypeValue={jobTypeValue}
        items={before}
      />
      <PhaseCard
        title="Checklist la finalizare"
        subtitle="Apare pe telefon la finalizarea lucrării, înainte de semnătura clientului."
        phase="after"
        jobTypeValue={jobTypeValue}
        items={after}
      />
    </div>
  );
}

function PhaseCard({
  title,
  subtitle,
  phase,
  jobTypeValue,
  items,
}: {
  title: string;
  subtitle: string;
  phase: "before" | "after";
  jobTypeValue: string;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-[13px] border border-border bg-white">
      <div className="border-b border-[#f2f4f7] px-5 py-3.5">
        <div className="text-[14px] font-bold text-foreground">{title}</div>
        <div className="text-[11.5px] text-muted-2">{subtitle}</div>
      </div>
      {items.length > 0 && (
        <div className="flex flex-col divide-y divide-[#f2f4f7]">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-2.5">
              <div className="text-[13px] font-semibold text-[#344054]">{item.label}</div>
              <form action={deleteChecklistTemplateItem}>
                <input type="hidden" name="itemId" value={item.id} />
                <button type="submit" className="text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
      <form action={addChecklistTemplateItem} className="flex gap-2 p-4">
        <input type="hidden" name="jobType" value={jobTypeValue} />
        <input type="hidden" name="phase" value={phase} />
        <input
          name="label"
          required
          placeholder="Ex: Verifică siguranța generală oprită…"
          className="flex-1 rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13px] outline-none focus:border-electric"
        />
        <button type="submit" className="flex items-center gap-1 rounded-[10px] bg-neutral-bg px-3.5 text-[12.5px] font-bold text-[#344054]">
          <Plus className="h-4 w-4" /> Adaugă
        </button>
      </form>
    </div>
  );
}
