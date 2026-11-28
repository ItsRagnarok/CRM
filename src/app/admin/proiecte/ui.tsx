"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { addNote, addProject, addTask, deleteNote, deleteProject, deleteTask, setTaskDone, updateProject } from "./actions";
import { PROJECT_KINDS, PROJECT_STATUSES, dayMonth, taskBucket, type Task } from "./shared";

const field = "rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-foreground";
export const input = `w-full ${field}`;
export const label = "mb-1 block text-[12px] font-semibold text-muted";
export const btn = "rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold disabled:opacity-50";
export const btnPrimary = "rounded-[10px] bg-electric px-3.5 py-2 text-[13px] font-bold text-[#0a0d0a] disabled:opacity-50";
type Result = { error?: string; ok?: boolean } | undefined;

function DueTag({ task, today }: { task: Task; today: string }) {
  if (task.done_at || !task.due_on) return null;
  const b = taskBucket(task, today);
  const tone = b === "intarziat" ? "bg-danger-bg text-danger" : b === "azi" ? "bg-warning-bg text-warning" : "bg-neutral-bg text-muted";
  const text = b === "intarziat" ? `Întârziat · ${dayMonth(task.due_on)}` : b === "azi" ? "Azi" : dayMonth(task.due_on);
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${tone}`}>{text}</span>;
}

/** Un rând de sarcină: bifă (făcut / redeschis), titlul, proiectul, termenul, ștergere. */
export function TaskRow({ task, today, projectName }: { task: Task; today: string; projectName?: string | null }) {
  const [pending, start] = useTransition();
  // Bifa se schimbă pe loc; lista se reface după răspunsul serverului.
  const [done, setDone] = useState(Boolean(task.done_at));
  return (
    <li className={`flex items-start gap-3 py-2.5 ${pending ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        aria-label={done ? `Redeschide: ${task.title}` : `Marchează făcut: ${task.title}`}
        checked={done}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setDone(next);
          start(() => setTaskDone(task.id, next, task.project_id));
        }}
        className="mt-1 h-[18px] w-[18px] shrink-0 accent-[#0a0d0a]"
      />
      <div className="min-w-0 flex-1">
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-semibold ${done ? "text-muted line-through" : "text-foreground"}`}>
          {task.urgent && !done && <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-label="Urgent" />}
          <span className="min-w-0 break-words">{task.title}</span>
        </div>
        {(task.details || projectName) && (
          <div className="mt-0.5 text-[12.5px] text-muted">
            {projectName && task.project_id ? <Link href={`/admin/proiecte/${task.project_id}`} className="font-semibold hover:underline">{projectName}</Link> : null}
            {projectName && task.details ? " · " : ""}
            {task.details}
          </div>
        )}
      </div>
      <DueTag task={task} today={today} />
      <button type="button" aria-label={`Șterge sarcina: ${task.title}`} disabled={pending} onClick={() => start(() => deleteTask(task.id, task.project_id))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/** Sarcină nouă: titlu, termen, urgent și (în lista generală) proiectul. */
export function AddTask({ projectId, projects }: { projectId?: string; projects?: { id: string; name: string }[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, run, pending] = useActionState(async (p: Result, fd: FormData) => {
    const r = await addTask(p, fd);
    if (r?.ok) form.current?.reset();
    return r;
  }, undefined);
  const key = projectId ?? "all";
  return (
    <form ref={form} action={run} className="flex flex-col gap-2 rounded-[12px] border border-border bg-[#fafaf9] p-3">
      <label htmlFor={`tt-${key}`} className="sr-only">Ce e de făcut</label>
      <input id={`tt-${key}`} name="title" required maxLength={300} placeholder="Ce e de făcut, ex. „Trimite raportul SEO lunar”" className={input} />
      <div className="flex flex-wrap items-center gap-2">
        {projectId ? <input type="hidden" name="project" value={projectId} /> : (
          <>
            <label htmlFor={`tp-${key}`} className="sr-only">Proiect</label>
            <select id={`tp-${key}`} name="project" defaultValue="" className={`${field} min-w-[160px] flex-1`}>
              <option value="">Fără proiect (diverse)</option>
              {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        )}
        <label htmlFor={`td-${key}`} className="sr-only">Termen</label>
        <input id={`td-${key}`} name="due" type="date" aria-label="Termen" className={field} />
        <label className="flex items-center gap-1.5 text-[13px] font-semibold"><input type="checkbox" name="urgent" /> Urgent</label>
        <button type="submit" disabled={pending} className={`${btnPrimary} ml-auto`}>{pending ? "Se salvează…" : "Adaugă sarcina"}</button>
      </div>
      {state?.error && <p role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</p>}
    </form>
  );
}

type Project = { id: string; name: string; kind: string; status: string; url: string | null; contact_name: string | null; phone: string | null; email: string | null; about: string | null };

/** Formularul unui proiect: nou (redirecționează la proiect) sau editare. */
export function ProjectForm({ project, onDone }: { project?: Project; onDone?: () => void }) {
  const action = project ? updateProject.bind(null, project.id) : addProject;
  const [state, run, pending] = useActionState(async (p: Result, fd: FormData) => {
    const r = await action(p, fd);
    if (r?.ok) onDone?.();
    return r;
  }, undefined);
  const id = project?.id ?? "new";
  return (
    <form action={run} className="flex flex-col gap-3">
      <div><label htmlFor={`n-${id}`} className={label}>Nume</label><input id={`n-${id}`} name="name" required maxLength={120} defaultValue={project?.name} placeholder="ex. iusarymi.ro" className={input} /></div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor={`k-${id}`} className={label}>Tip</label>
          <select id={`k-${id}`} name="kind" defaultValue={project?.kind ?? "seo"} className={input}>{PROJECT_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
        </div>
        <div>
          <label htmlFor={`s-${id}`} className={label}>Stare</label>
          <select id={`s-${id}`} name="status" defaultValue={project?.status ?? "activ"} className={input}>{PROJECT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        </div>
        <div className="col-span-2"><label htmlFor={`u-${id}`} className={label}>Site</label><input id={`u-${id}`} name="url" maxLength={300} defaultValue={project?.url ?? ""} placeholder="iusarymi.ro" className={input} /></div>
        <div><label htmlFor={`c-${id}`} className={label}>Persoană de contact</label><input id={`c-${id}`} name="contact" maxLength={120} defaultValue={project?.contact_name ?? ""} className={input} /></div>
        <div><label htmlFor={`p-${id}`} className={label}>Telefon</label><input id={`p-${id}`} name="phone" type="tel" maxLength={40} defaultValue={project?.phone ?? ""} className={input} /></div>
        <div className="col-span-2"><label htmlFor={`e-${id}`} className={label}>E-mail</label><input id={`e-${id}`} name="email" type="email" maxLength={160} defaultValue={project?.email ?? ""} className={input} /></div>
      </div>
      <div><label htmlFor={`a-${id}`} className={label}>Despre (ce faci pentru el, înțelegeri, acces)</label><textarea id={`a-${id}`} name="about" rows={4} maxLength={4000} defaultValue={project?.about ?? ""} className={input} /></div>
      <p className="text-[11.5px] text-muted-2">Nu scrie parole aici: ține-le în managerul de parole.</p>
      {state?.error && <p role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Se salvează…" : project ? "Salvează" : "Creează proiectul"}</button>
        {onDone && <button type="button" onClick={onDone} className={btn}>Renunță</button>}
      </div>
    </form>
  );
}

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>+ Proiect nou</button>;
  return (
    <div className="w-full rounded-[14px] border border-border bg-white p-4 sm:max-w-[520px]">
      <h2 className="mb-3 text-[15px] font-extrabold">Proiect nou</h2>
      <ProjectForm onDone={() => setOpen(false)} />
    </div>
  );
}

export function EditProject({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (open) return <div className="rounded-[14px] border border-border bg-white p-4"><ProjectForm project={project} onDone={() => setOpen(false)} /></div>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setOpen(true)} className={btn}>Editează</button>
      {confirm ? (
        <>
          <span className="text-[12.5px] font-semibold text-danger">Ștergi proiectul cu sarcini și notițe?</span>
          <button type="button" disabled={pending} onClick={() => start(() => deleteProject(project.id))} className="rounded-[10px] bg-danger px-3 py-2 text-[13px] font-bold text-white">Da, șterge</button>
          <button type="button" onClick={() => setConfirm(false)} className={btn}>Nu</button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="rounded-[10px] px-3 py-2 text-[13px] font-bold text-danger hover:bg-danger-bg">Șterge</button>
      )}
    </div>
  );
}

export function AddNote({ projectId }: { projectId: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, run, pending] = useActionState(async (p: Result, fd: FormData) => {
    const r = await addNote(projectId, p, fd);
    if (r?.ok) form.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={form} action={run} className="flex flex-col gap-2">
      <label htmlFor="note-body" className="sr-only">Notiță nouă</label>
      <textarea id="note-body" name="body" rows={3} required maxLength={4000} placeholder="Ce s-a întâmplat, ce ai stabilit, ce urmează…" className={input} />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Se salvează…" : "Adaugă notița"}</button>
        {state?.error && <p role="alert" className="text-[12.5px] font-semibold text-danger">{state.error}</p>}
      </div>
    </form>
  );
}

export function DeleteNote({ id, projectId }: { id: string; projectId: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" aria-label="Șterge notița" disabled={pending} onClick={() => start(() => deleteNote(id, projectId))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
