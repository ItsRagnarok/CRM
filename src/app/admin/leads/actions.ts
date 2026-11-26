"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_KINDS, LEAD_DOMAINS, LEAD_SOURCES, LEAD_WANTS, normalizeTags, isLeadStage, isOpenStage, stageLabel } from "@/lib/leads";
import { companyKey, parseLeadsFile, type ImportedLead } from "@/lib/leads-import";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
type Result = { error?: string; ok?: boolean } | undefined;

function fields(fd: FormData) {
  const team = Number.parseInt(txt(fd, "teamSize", 6), 10);
  const value = Number(txt(fd, "value", 12).replace(",", "."));
  const follow = txt(fd, "followUp", 10);
  const source = txt(fd, "source", 20);
  return {
    company_name: txt(fd, "company", 160),
    contact_name: txt(fd, "contact", 120) || null,
    phone: txt(fd, "phone", 40) || null,
    email: txt(fd, "email", 160) || null,
    team_size: Number.isInteger(team) && team > 0 && team <= 10000 ? team : null,
    domains: LEAD_DOMAINS.map((d) => d.id).filter((d) => fd.getAll("domains").includes(d)),
    estimated_value: Number.isFinite(value) && value > 0 ? value : null,
    next_follow_up: ISO.test(follow) ? follow : null,
    current_tools: txt(fd, "currentTools", 1000) || null,
    problems: txt(fd, "problems", 2000) || null,
    wants: LEAD_WANTS.map((w) => w.id).filter((w) => fd.getAll("wants").includes(w)),
    last_reply: txt(fd, "lastReply", 2000) || null,
    source: LEAD_SOURCES.some((s) => s.id === source) ? source : "altul",
  };
}

export async function addLead(_prev: Result, fd: FormData): Promise<Result> {
  const { userId } = await requireAdminContext();
  const f = fields(fd);
  if (!f.company_name) return { error: "Scrie numele firmei." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("platform_leads").insert({ ...f, created_by: userId });
  if (error) return { error: "Nu am putut salva leadul. Încearcă din nou." };
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function updateLead(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requireAdminContext();
  if (!UUID.test(id)) return { error: "Lead necunoscut." };
  const f = fields(fd);
  if (!f.company_name) return { error: "Scrie numele firmei." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("platform_leads").update(f).eq("id", id);
  if (error) return { error: "Nu am putut salva modificările." };
  revalidatePath("/admin/leads");
  return { ok: true };
}

/** Mută leadul în altă etapă și notează schimbarea în jurnal. „Pierdut” cere un motiv. */
export async function setLeadStage(id: string, stage: string, reason?: string): Promise<Result> {
  const { userId } = await requireAdminContext();
  if (!UUID.test(id) || !isLeadStage(stage)) return { error: "Etapă necunoscută." };
  const why = (reason ?? "").trim().slice(0, 300);
  if (stage === "pierdut" && !why) return { error: "Scrie motivul, ca să înveți din el." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase
    .from("platform_leads")
    .update({ stage, lost_reason: stage === "pierdut" ? why : null, closed_at: isOpenStage(stage) ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Nu am putut muta leadul." };
  await supabase.from("platform_lead_events").insert({ lead_id: id, kind: "etapa", body: stage === "pierdut" ? `Pierdut: ${why}` : `Mutat la ${stageLabel(stage)}`, created_by: userId });
  revalidatePath("/admin/leads");
  return { ok: true };
}

/** Etichetele unui lead (Important, Urgent sau proprii). Înlocuiește lista întreagă. */
export async function setLeadTags(id: string, tags: string[]): Promise<Result> {
  await requireAdminContext();
  if (!UUID.test(id) || !Array.isArray(tags)) return { error: "Lead necunoscut." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("platform_leads").update({ tags: normalizeTags(tags) }).eq("id", id);
  if (error) return { error: "Nu am putut salva etichetele." };
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function addLeadEvent(id: string, kind: string, body: string): Promise<Result> {
  const { userId } = await requireAdminContext();
  const text = body.trim().slice(0, 2000);
  if (!UUID.test(id) || !EVENT_KINDS.some((k) => k.id === kind)) return { error: "Tip necunoscut." };
  if (!text) return { error: "Scrie ce s-a întâmplat." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("platform_lead_events").insert({ lead_id: id, kind, body: text, created_by: userId });
  if (error) return { error: "Nu am putut salva notița." };
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function setFollowUp(id: string, date: string): Promise<Result> {
  await requireAdminContext();
  if (!UUID.test(id) || (date && !ISO.test(date))) return { error: "Dată invalidă." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("platform_leads").update({ next_follow_up: date || null }).eq("id", id);
  if (error) return { error: "Nu am putut salva data." };
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<Result> {
  await requireAdminContext();
  if (!UUID.test(id)) return { error: "Lead necunoscut." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("platform_leads").delete().eq("id", id);
  if (error) return { error: "Nu am putut șterge leadul." };
  revalidatePath("/admin/leads");
  return { ok: true };
}

/** Aduce din Programări cererile de discuție care nu sunt încă leaduri. */
export async function importBookings(): Promise<{ error?: string; added?: number }> {
  const { userId } = await requireAdminContext();
  const supabase = await createClient({ ignorePreview: true });
  const [{ data: bookings, error }, { data: linked }] = await Promise.all([
    supabase.from("bookings").select("id, name, phone, email, note, slot_start").order("slot_start", { ascending: false }).limit(200),
    supabase.from("platform_leads").select("booking_id").not("booking_id", "is", null),
  ]);
  if (error) return { error: "Nu am putut citi programările." };
  const taken = new Set((linked ?? []).map((l) => l.booking_id));
  const fresh = (bookings ?? []).filter((b) => !taken.has(b.id));
  if (!fresh.length) return { added: 0 };
  const now = Date.now();
  const rows = fresh.map((b) => ({
    company_name: String(b.name).slice(0, 160),
    contact_name: String(b.name).slice(0, 120),
    phone: b.phone ? String(b.phone).slice(0, 40) : null,
    email: b.email ? String(b.email).slice(0, 160) : null,
    source: "programari",
    stage: Date.parse(b.slot_start) > now ? "discutie" : "nou",
    next_follow_up: new Date(b.slot_start).toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" }),
    problems: b.note ? String(b.note).slice(0, 2000) : null,
    booking_id: b.id,
    created_by: userId,
  }));
  const { error: insertError } = await supabase.from("platform_leads").insert(rows);
  if (insertError) return { error: "Nu am putut importa programările." };
  revalidatePath("/admin/leads");
  return { added: rows.length };
}

/**
 * Importă leaduri dintr-un fișier JSON (formatul din src/lib/leads-import.ts).
 * Firma deja existentă (același nume) nu se dublează: i se completează doar câmpurile goale,
 * iar din istoric se adaugă doar mesajele care nu sunt deja acolo.
 */
export async function importLeadsFile(text: string): Promise<{ error?: string; added?: number; updated?: number; events?: number; warnings?: string[] }> {
  const { userId } = await requireAdminContext();
  if (typeof text !== "string" || text.length > 2_000_000) return { error: "Fișierul e prea mare (maxim 2 MB)." };
  const { leads, errors } = parseLeadsFile(text);
  if (!leads.length) return { error: errors[0] ?? "Nu am găsit niciun lead în fișier." };
  const supabase = await createClient({ ignorePreview: true });
  const { data: existing, error: readError } = await supabase.from("platform_leads").select("id, company_name, contact_name, phone, email, team_size, estimated_value, next_follow_up, current_tools, problems").limit(5000);
  if (readError) return { error: "Nu am putut citi leadurile existente." };
  const byKey = new Map((existing ?? []).map((l) => [companyKey(l.company_name), l]));
  let added = 0, updated = 0, events = 0;
  for (const l of leads) {
    const { events: evs, ...row } = l;
    let leadId: string;
    const found = byKey.get(companyKey(l.company_name));
    if (found) {
      leadId = found.id;
      const fill: Partial<Pick<ImportedLead, "contact_name" | "phone" | "email" | "team_size" | "estimated_value" | "next_follow_up" | "current_tools" | "problems">> = {};
      for (const k of ["contact_name", "phone", "email", "team_size", "estimated_value", "next_follow_up", "current_tools", "problems"] as const) {
        if ((found[k] === null || found[k] === "") && row[k] !== null) Object.assign(fill, { [k]: row[k] });
      }
      if (Object.keys(fill).length) {
        await supabase.from("platform_leads").update(fill).eq("id", leadId);
        updated++;
      }
    } else {
      const { data: ins, error } = await supabase.from("platform_leads").insert({ ...row, created_by: userId, ...(evs.length ? { created_at: evs.map((e) => e.created_at).sort()[0] } : {}) }).select("id").single();
      if (error || !ins) { errors.push(`${l.company_name}: nu s-a putut salva.`); continue; }
      leadId = ins.id;
      added++;
    }
    if (evs.length) {
      const { data: had } = await supabase.from("platform_lead_events").select("kind, body").eq("lead_id", leadId);
      const seen = new Set((had ?? []).map((e) => `${e.kind}|${e.body}`));
      const fresh = evs.filter((e) => !seen.has(`${e.kind}|${e.body}`)).map((e) => ({ ...e, lead_id: leadId, created_by: userId }));
      if (fresh.length) {
        const { error } = await supabase.from("platform_lead_events").insert(fresh);
        if (error) errors.push(`${l.company_name}: istoricul nu s-a putut salva.`);
        else events += fresh.length;
      }
    }
  }
  revalidatePath("/admin/leads");
  return { added, updated, events, warnings: errors.slice(0, 20) };
}
