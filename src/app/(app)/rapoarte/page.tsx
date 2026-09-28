import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

function startOfWeek(d: Date) {
  const c = new Date(d);
  const day = c.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setUTCDate(c.getUTCDate() + diff);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

const CATEGORY_LABEL: Record<string, string> = {
  materiale: "Materiale",
  combustibil: "Combustibil",
  parcare: "Parcare / Transport",
  unelte: "Unelte / Altele",
};

export default async function RapoartePage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const today = new Date();
  const thisWeekStart = startOfWeek(today);
  const rangeStart = addDays(thisWeekStart, -21); // 4 weeks total, including this one

  const [{ data: jobs }, { data: signatures }, { data: expenses }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, display_number, title, status, scheduled_date, clients(name)")
      .eq("organization_id", organization.id)
      .order("scheduled_date", { ascending: false }),
    supabase.from("signatures").select("job_id").eq("organization_id", organization.id),
    supabase.from("expenses").select("category, amount").eq("organization_id", organization.id),
  ]);

  const signedJobIds = new Set((signatures ?? []).map((s) => s.job_id));

  // Bucket finalized jobs into the last 4 weeks for the bar chart.
  const weekBuckets = [0, 1, 2, 3].map((i) => {
    const start = addDays(rangeStart, i * 7);
    const end = addDays(start, 7);
    return { start, end, count: 0 };
  });
  const finished = (jobs ?? []).filter((j) => j.status === "finalizata");
  for (const job of finished) {
    const d = new Date(`${job.scheduled_date}T00:00:00Z`);
    if (d < rangeStart) continue;
    const bucket = weekBuckets.find((b) => d >= b.start && d < b.end);
    if (bucket) bucket.count += 1;
  }
  const maxCount = Math.max(1, ...weekBuckets.map((b) => b.count));

  const categoryTotals = new Map<string, number>();
  for (const e of expenses ?? []) {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + Number(e.amount));
  }
  const maxCategory = Math.max(1, ...categoryTotals.values());

  const reportableJobs = (jobs ?? []).filter((j) => j.status === "finalizata").slice(0, 20);

  return (
    <div className="flex flex-col gap-5 p-7">
      <h1 className="text-[17px] font-extrabold text-foreground">Rapoarte</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[13px] border border-border bg-white p-5">
          <div className="mb-4 text-[14.5px] font-bold text-foreground">Lucrări finalizate pe săptămână</div>
          <div className="flex h-[160px] items-end gap-4">
            {weekBuckets.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 rounded-t-[6px] ${i === 3 ? "bg-electric" : "bg-electric-soft"}`}
                  style={{ height: Math.max(6, (b.count / maxCount) * 130) }}
                  title={`${b.count} lucrări`}
                />
                <div className={`text-[11px] ${i === 3 ? "font-bold text-foreground" : "text-muted-2"}`}>
                  S{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[13px] border border-border bg-white p-5">
          <div className="mb-4 text-[14.5px] font-bold text-foreground">Cheltuieli pe categorie</div>
          {categoryTotals.size > 0 ? (
            <div className="flex flex-col gap-2.5">
              {[...categoryTotals.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-[12.5px]">
                      <span className="capitalize">{CATEGORY_LABEL[cat] ?? cat}</span>
                      <b>{total.toFixed(0)} RON</b>
                    </div>
                    <div className="h-2 rounded-[6px] bg-neutral-bg">
                      <div
                        className="h-2 rounded-[6px] bg-electric"
                        style={{ width: `${Math.max(4, (total / maxCategory) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Nicio cheltuială înregistrată încă.</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[13px] border border-border bg-white">
        <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">Rapoarte generate</div>
        {reportableJobs.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Lucrare</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Finalizată</th>
                <th className="px-5 py-3">Semnat</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {reportableJobs.map((job) => (
                <tr key={job.id} className="border-t border-[#f2f4f7]">
                  <td className="px-5 py-3">
                    <Link href={`/lucrari/${job.id}`} prefetch={false} className="text-[13px] font-bold text-electric">
                      #{job.display_number} — {job.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#344054]">{job.clients?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-[13px] text-muted">
                    {new Date(`${job.scheduled_date}T00:00:00`).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-[12px] font-bold">
                    {signedJobIds.has(job.id) ? (
                      <span className="text-success">✓ Da</span>
                    ) : (
                      <span className="text-muted-2">Nu încă</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/rapoarte-lucrare/${job.id}`}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-electric"
                    >
                      <Download className="h-3.5 w-3.5" /> Descarcă PDF
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={FileText}
              title="Niciun raport încă"
              description="Rapoartele apar aici automat pe măsură ce lucrările sunt finalizate."
            />
          </div>
        )}
      </div>
    </div>
  );
}
