import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Mail, Phone } from "lucide-react";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kindLabel, statusLabel, type Task } from "../shared";
import { AddNote, AddTask, DeleteNote, EditProject, TaskRow } from "../ui";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const when = (iso: string) => new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Un proiect: datele clientului, sarcinile lui și jurnalul de notițe. */
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  await requireAdminContext();
  const db = await createClient({ ignorePreview: true });
  const [{ data: p }, { data: tasks }, { data: notes }] = await Promise.all([
    db.from("admin_projects").select("*").eq("id", id).maybeSingle(),
    db.from("admin_tasks").select("*").eq("project_id", id).order("due_on", { ascending: true, nullsFirst: false }).order("created_at"),
    db.from("admin_project_notes").select("id, body, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(300),
  ]);
  if (!p) notFound();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
  const all = (tasks ?? []) as Task[];
  const open = all.filter((t) => !t.done_at).sort((a, b) => Number(b.urgent) - Number(a.urgent));
  const done = all.filter((t) => t.done_at).sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-6 sm:px-6">
      <Link href="/admin/proiecte" className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-muted hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Toate proiectele</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold tracking-tight">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <span>{kindLabel(p.kind)} · {statusLabel(p.status)}</span>
            {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline">{p.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="h-3 w-3" /></a>}
          </div>
        </div>
        <EditProject project={p} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-[14px] border border-border bg-white p-4 sm:p-5" aria-labelledby="pt">
          <h2 id="pt" className="mb-3 text-[16px] font-extrabold">De făcut · {open.length}</h2>
          <AddTask projectId={p.id} />
          {open.length === 0 ? <p className="mt-4 text-[13px] text-muted">Nimic deschis pe acest proiect.</p> : (
            <ul className="mt-2 divide-y divide-[#f2f4f7]">{open.map((t) => <TaskRow key={t.id} task={t} today={today} />)}</ul>
          )}
          {done.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[12.5px] font-bold text-muted">Făcute · {done.length}</summary>
              <ul className="divide-y divide-[#f2f4f7]">{done.map((t) => <TaskRow key={t.id} task={t} today={today} />)}</ul>
            </details>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-[14px] border border-border bg-white p-4 sm:p-5" aria-labelledby="pc">
            <h2 id="pc" className="mb-2 text-[16px] font-extrabold">Client</h2>
            <div className="flex flex-col gap-1.5 text-[13.5px]">
              {p.contact_name && <div className="font-semibold">{p.contact_name}</div>}
              {p.phone && <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:underline"><Phone className="h-3.5 w-3.5 text-muted" />{p.phone}</a>}
              {p.email && <a href={`mailto:${p.email}`} className="inline-flex items-center gap-2 hover:underline"><Mail className="h-3.5 w-3.5 text-muted" />{p.email}</a>}
              {!p.contact_name && !p.phone && !p.email && <span className="text-muted">Fără date de contact. Le adaugi din „Editează”.</span>}
            </div>
            {p.about && <p className="mt-3 whitespace-pre-wrap border-t border-[#f2f4f7] pt-3 text-[13.5px] text-[#344054]">{p.about}</p>}
          </section>

          <section className="rounded-[14px] border border-border bg-white p-4 sm:p-5" aria-labelledby="pn">
            <h2 id="pn" className="mb-3 text-[16px] font-extrabold">Jurnal</h2>
            <AddNote projectId={p.id} />
            {(notes ?? []).length === 0 ? <p className="mt-4 text-[13px] text-muted">Nicio notiță încă.</p> : (
              <ul className="mt-3 divide-y divide-[#f2f4f7]">
                {(notes ?? []).map((n) => (
                  <li key={n.id} className="flex items-start gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] font-semibold text-muted-2">{when(n.created_at)}</div>
                      <p className="whitespace-pre-wrap text-[13.5px]">{n.body}</p>
                    </div>
                    <DeleteNote id={n.id} projectId={p.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
