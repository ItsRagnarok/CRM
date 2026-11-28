import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kindLabel, statusLabel, taskBucket, dayMonth, type Task } from "./shared";
import { AddTask, NewProjectButton, TaskRow } from "./ui";

export const dynamic = "force-dynamic";

const BUCKETS = [
  { id: "intarziat", title: "Întârziate" },
  { id: "azi", title: "Azi" },
  { id: "saptamana", title: "În 7 zile" },
  { id: "mai_tarziu", title: "Mai târziu" },
  { id: "fara", title: "Fără termen" },
] as const;

/** Super Admin → Proiecte: clienții tăi (SEO, site-uri, magazine), cu sarcinile din toate proiectele sus. */
export default async function ProjectsPage() {
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const [{ data: projects, error }, { data: tasks }] = await Promise.all([
    db.from("admin_projects").select("id, name, kind, status, url, contact_name, updated_at").order("updated_at", { ascending: false }),
    db.from("admin_tasks").select("*").order("due_on", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }).limit(1000),
  ]);
  if (error) return <p role="alert" className="p-6 text-danger">Nu am putut încărca proiectele. Reîncarcă pagina.</p>;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
  const all = (tasks ?? []) as Task[];
  const open = all.filter((t) => !t.done_at).sort((a, b) => Number(b.urgent) - Number(a.urgent));
  const doneRecent = all.filter((t) => t.done_at).sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? "")).slice(0, 15);
  const names = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const order = ["activ", "asteptare", "incheiat"];
  const list = [...(projects ?? [])].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight">Proiecte</h1>
          <p className="text-[13.5px] text-muted">Clienții tăi (SEO, site-uri, magazine online, ElectroField), cu ce ai de făcut și notițele fiecăruia.</p>
        </div>
        <NewProjectButton />
      </div>

      <section className="rounded-[14px] border border-border bg-white p-4 sm:p-5" aria-labelledby="tasks-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tasks-title" className="text-[16px] font-extrabold">De făcut</h2>
          <span className="text-[12.5px] text-muted">{open.length} deschise</span>
        </div>
        <AddTask projects={(projects ?? []).filter((p) => p.status !== "incheiat").map((p) => ({ id: p.id, name: p.name }))} />
        {open.length === 0 && <p className="mt-4 text-[13px] text-muted">Nimic deschis. Adaugă o sarcină mai sus.</p>}
        {BUCKETS.map((b) => {
          const items = open.filter((t) => taskBucket(t, today) === b.id);
          if (!items.length) return null;
          return (
            <div key={b.id} className="mt-4">
              <h3 className={`text-[12px] font-bold uppercase tracking-wide ${b.id === "intarziat" ? "text-danger" : "text-muted-2"}`}>{b.title} · {items.length}</h3>
              <ul className="divide-y divide-[#f2f4f7]">{items.map((t) => <TaskRow key={t.id} task={t} today={today} projectName={t.project_id ? names.get(t.project_id) : "Diverse"} />)}</ul>
            </div>
          );
        })}
        {doneRecent.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-[12.5px] font-bold text-muted">Făcute recent · {doneRecent.length}</summary>
            <ul className="divide-y divide-[#f2f4f7]">{doneRecent.map((t) => <TaskRow key={t.id} task={t} today={today} projectName={t.project_id ? names.get(t.project_id) : "Diverse"} />)}</ul>
          </details>
        )}
      </section>

      <section aria-labelledby="proj-title">
        <h2 id="proj-title" className="mb-3 text-[16px] font-extrabold">Proiectele tale</h2>
        {list.length === 0 ? (
          <p className="text-[13px] text-muted">Niciun proiect încă. Apasă „Proiect nou”.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => {
              const mine = open.filter((t) => t.project_id === p.id);
              const next = mine.find((t) => t.due_on);
              const late = mine.filter((t) => taskBucket(t, today) === "intarziat").length;
              return (
                <li key={p.id} className={`rounded-[14px] border border-border bg-white p-4 ${p.status === "incheiat" ? "opacity-70" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/proiecte/${p.id}`} className="min-w-0 text-[15px] font-extrabold hover:underline">{p.name}</Link>
                    <span className="shrink-0 rounded-full bg-neutral-bg px-2.5 py-0.5 text-[11.5px] font-bold text-muted">{statusLabel(p.status)}</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted">
                    {kindLabel(p.kind)}{p.contact_name ? ` · ${p.contact_name}` : ""}
                  </div>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-foreground hover:underline">{p.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="h-3 w-3" /></a>}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#f2f4f7] pt-2.5 text-[12.5px]">
                    <span className="font-semibold">{mine.length} de făcut</span>
                    {late > 0 && <span className="font-bold text-danger">{late} întârziate</span>}
                    {next?.due_on && <span className="text-muted">următorul termen: {dayMonth(next.due_on)}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
