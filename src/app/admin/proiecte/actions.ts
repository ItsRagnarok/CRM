"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_KINDS, PROJECT_STATUSES } from "./shared";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
type Result = { error?: string; ok?: boolean } | undefined;

async function db() {
  await requireAdminContext();
  return createClient({ ignorePreview: true });
}
const refresh = (id?: string | null) => {
  revalidatePath("/admin/proiecte");
  if (id) revalidatePath(`/admin/proiecte/${id}`);
  revalidatePath("/admin", "layout");
};

function projectFields(fd: FormData) {
  const kind = txt(fd, "kind", 20);
  const status = txt(fd, "status", 20);
  const url = txt(fd, "url", 300);
  return {
    name: txt(fd, "name", 120),
    kind: PROJECT_KINDS.some((k) => k.id === kind) ? kind : "altul",
    status: PROJECT_STATUSES.some((s) => s.id === status) ? status : "activ",
    url: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null,
    contact_name: txt(fd, "contact", 120) || null,
    phone: txt(fd, "phone", 40) || null,
    email: txt(fd, "email", 160) || null,
    about: txt(fd, "about", 4000) || null,
  };
}

export async function addProject(_prev: Result, fd: FormData): Promise<Result> {
  const supabase = await db();
  const f = projectFields(fd);
  if (!f.name) return { error: "Scrie numele proiectului." };
  const { data, error } = await supabase.from("admin_projects").insert(f).select("id").single();
  if (error || !data) return { error: "Nu am putut salva proiectul. Încearcă din nou." };
  refresh();
  redirect(`/admin/proiecte/${data.id}`);
}

export async function updateProject(id: string, _prev: Result, fd: FormData): Promise<Result> {
  if (!UUID.test(id)) return { error: "Proiect necunoscut." };
  const supabase = await db();
  const f = projectFields(fd);
  if (!f.name) return { error: "Scrie numele proiectului." };
  const { error } = await supabase.from("admin_projects").update(f).eq("id", id);
  if (error) return { error: "Nu am putut salva modificările." };
  refresh(id);
  return { ok: true };
}

export async function deleteProject(id: string) {
  if (!UUID.test(id)) return;
  const supabase = await db();
  await supabase.from("admin_projects").delete().eq("id", id);
  refresh();
  redirect("/admin/proiecte");
}

export async function addTask(_prev: Result, fd: FormData): Promise<Result> {
  const supabase = await db();
  const title = txt(fd, "title", 300);
  if (!title) return { error: "Scrie ce e de făcut." };
  const project = txt(fd, "project", 40);
  const due = txt(fd, "due", 10);
  const { error } = await supabase.from("admin_tasks").insert({
    title,
    details: txt(fd, "details", 2000) || null,
    project_id: UUID.test(project) ? project : null,
    due_on: ISO.test(due) ? due : null,
    urgent: fd.get("urgent") === "on",
  });
  if (error) return { error: "Nu am putut salva sarcina." };
  refresh(UUID.test(project) ? project : null);
  return { ok: true };
}

export async function setTaskDone(id: string, done: boolean, projectId: string | null) {
  if (!UUID.test(id)) return;
  const supabase = await db();
  await supabase.from("admin_tasks").update({ done_at: done ? new Date().toISOString() : null }).eq("id", id);
  refresh(projectId);
}

export async function deleteTask(id: string, projectId: string | null) {
  if (!UUID.test(id)) return;
  const supabase = await db();
  await supabase.from("admin_tasks").delete().eq("id", id);
  refresh(projectId);
}

export async function addNote(projectId: string, _prev: Result, fd: FormData): Promise<Result> {
  if (!UUID.test(projectId)) return { error: "Proiect necunoscut." };
  const supabase = await db();
  const body = txt(fd, "body", 4000);
  if (!body) return { error: "Scrie notița." };
  const { error } = await supabase.from("admin_project_notes").insert({ project_id: projectId, body });
  if (error) return { error: "Nu am putut salva notița." };
  refresh(projectId);
  return { ok: true };
}

export async function deleteNote(id: string, projectId: string) {
  if (!UUID.test(id)) return;
  const supabase = await db();
  await supabase.from("admin_project_notes").delete().eq("id", id);
  refresh(projectId);
}
