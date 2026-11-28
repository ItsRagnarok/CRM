"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CAMPAIGN_DOMAINS, DEFAULT_CAEN, hostKey } from "@/lib/prospect";
import { companyKey } from "@/lib/leads-import";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Result = { error?: string; ok?: boolean; id?: string } | undefined;

const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
/** Listă dintr-un câmp: câte una pe rând sau despărțite prin virgulă. */
const list = (fd: FormData, k: string, maxItems = 30, maxLen = 120) =>
  [...new Set(txt(fd, k, 6000).split(/[\n,;]+/).map((s) => s.trim().slice(0, maxLen)).filter(Boolean))].slice(0, maxItems);
const int = (fd: FormData, k: string) => { const n = Number.parseInt(txt(fd, k, 7), 10); return Number.isInteger(n) && n > 0 ? n : null; };

export async function saveCampaign(id: string | null, _prev: Result, fd: FormData): Promise<Result> {
  const { userId } = await requireAdminContext();
  if (id && !UUID.test(id)) return { error: "Campanie necunoscută." };
  const name = txt(fd, "name", 120);
  if (!name) return { error: "Scrie numele campaniei." };
  const domain = txt(fd, "domain", 20);
  const dom = CAMPAIGN_DOMAINS.some((d) => d.id === domain) ? domain : "altul";
  const caen = list(fd, "caen", 40, 4).filter((c) => /^\d{4}$/.test(c));
  const min = int(fd, "minEmployees"), max = int(fd, "maxEmployees");
  if (min && max && min > max) return { error: "Minimul de angajați e mai mare decât maximul." };
  const row = {
    name, domain: dom,
    offer: txt(fd, "offer", 1000) || null,
    customer_problem: txt(fd, "problem", 1000) || null,
    targeting: txt(fd, "targeting", 2000) || null,
    target_roles: txt(fd, "roles", 1000) || null,
    example_clients: list(fd, "examples"),
    positive_criteria: list(fd, "positive"),
    negative_criteria: list(fd, "negative"),
    keywords: list(fd, "keywords", 40, 80),
    caen_codes: caen.length ? caen : DEFAULT_CAEN[dom] ?? [],
    counties: list(fd, "counties", 42, 40),
    min_employees: min, max_employees: max,
    daily_target: Math.min(500, int(fd, "daily") ?? 30),
    agent_notes: txt(fd, "agentNotes", 4000) || null,
  };
  const supabase = await createClient({ ignorePreview: true });
  if (id) {
    const { error } = await supabase.from("prospect_campaigns").update(row).eq("id", id);
    if (error) return { error: "Nu am putut salva campania." };
    revalidatePath("/admin/prospectare");
    return { ok: true, id };
  }
  const { data, error } = await supabase.from("prospect_campaigns").insert({ ...row, created_by: userId }).select("id").single();
  if (error || !data) return { error: "Nu am putut crea campania." };
  revalidatePath("/admin/prospectare");
  return { ok: true, id: data.id };
}

export async function setCampaignStatus(id: string, status: "activa" | "pauza"): Promise<Result> {
  await requireAdminContext();
  if (!UUID.test(id) || !["activa", "pauza"].includes(status)) return { error: "Cerere greșită." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("prospect_campaigns").update({ status }).eq("id", id);
  if (error) return { error: "Nu am putut schimba starea campaniei." };
  revalidatePath("/admin/prospectare");
  return { ok: true };
}

/** Respinge firmele alese. Motivul rămâne pe firmă: agentul îl citește la următoarea rulare și nu mai caută așa ceva. */
export async function rejectCompanies(ids: string[], reason: string): Promise<Result> {
  await requireAdminContext();
  const clean = ids.filter((i) => UUID.test(i)).slice(0, 500);
  if (!clean.length) return { error: "Alege cel puțin o firmă." };
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("prospect_companies")
    .update({ status: "respins", reject_reason: reason.trim().slice(0, 300) || null, reviewed_at: new Date().toISOString() })
    .in("id", clean).neq("status", "importat");
  if (error) return { error: "Nu am putut respinge firmele." };
  revalidatePath("/admin/prospectare");
  return { ok: true };
}

export async function restoreCompanies(ids: string[]): Promise<Result> {
  await requireAdminContext();
  const clean = ids.filter((i) => UUID.test(i)).slice(0, 500);
  const supabase = await createClient({ ignorePreview: true });
  const { error } = await supabase.from("prospect_companies").update({ status: "candidat", reject_reason: null, reviewed_at: null }).in("id", clean).eq("status", "respins");
  if (error) return { error: "Nu am putut readuce firmele." };
  revalidatePath("/admin/prospectare");
  return { ok: true };
}

type EmailItem = { email: string; kind?: string };

/**
 * Mută firmele aprobate în Leads, la „De contactat”, cu sursa „E-mail rece”.
 * O firmă deja în Leads (același nume sau același domeniu de e-mail) nu se dublează: se leagă de leadul existent.
 */
export async function approveCompanies(ids: string[]): Promise<{ error?: string; added?: number; linked?: number }> {
  const { userId } = await requireAdminContext();
  const clean = ids.filter((i) => UUID.test(i)).slice(0, 200);
  if (!clean.length) return { error: "Alege cel puțin o firmă." };
  const supabase = await createClient({ ignorePreview: true });
  const [{ data: companies, error }, { data: leads, error: leadsError }] = await Promise.all([
    supabase.from("prospect_companies").select("*, prospect_campaigns(domain, name), prospect_people(name, role, email, email_status)").in("id", clean).neq("status", "importat"),
    supabase.from("platform_leads").select("id, company_name, email").limit(5000),
  ]);
  if (error || leadsError) return { error: "Nu am putut citi firmele sau leadurile." };
  const byName = new Map((leads ?? []).map((l) => [companyKey(l.company_name), l.id]));
  const byDomain = new Map((leads ?? []).filter((l) => l.email).map((l) => [l.email!.split("@")[1]?.toLowerCase(), l.id]));
  let added = 0, linked = 0;
  for (const c of companies ?? []) {
    const people = (c.prospect_people ?? []) as { name: string; role: string | null; email: string | null; email_status: string }[];
    const emails = (Array.isArray(c.emails) ? c.emails : []) as EmailItem[];
    const person = people.find((p) => p.email && p.email_status === "pe_site") ?? people.find((p) => p.email) ?? people[0];
    const email = person?.email ?? emails.find((e) => e.kind === "generic")?.email ?? emails[0]?.email ?? null;
    const existing = byName.get(companyKey(c.name)) ?? (c.host ? byDomain.get(hostKey(c.host)) : undefined);
    let leadId = existing ?? null;
    if (!leadId) {
      const campaign = c.prospect_campaigns as { domain: string; name: string } | null;
      const domains = campaign && ["gaze", "electric", "fotovoltaic"].includes(campaign.domain) ? [campaign.domain] : [];
      const facts = [
        c.website && `Site: ${c.website}`, c.cui && `CUI ${c.cui}`, c.employees != null && `${c.employees} angajați (ANAF ${c.fin_year ?? ""})`,
        [c.city, c.county].filter(Boolean).join(", "), c.description, c.fit_reason && `De ce se potrivește: ${c.fit_reason}`,
        people.length ? `Oameni: ${people.map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}${p.email ? ` ${p.email}${p.email_status === "ghicit" ? " [ghicit]" : ""}` : ""}`).join("; ")}` : null,
        emails.length ? `Adrese găsite: ${emails.map((e) => e.email).join(", ")}` : null,
      ].filter(Boolean).join("\n");
      const { data: ins, error: insError } = await supabase.from("platform_leads").insert({
        company_name: c.name.slice(0, 160), contact_name: person?.name?.slice(0, 120) ?? null, email: email?.slice(0, 160) ?? null,
        phone: c.phone?.slice(0, 40) ?? null, team_size: c.employees && c.employees > 0 ? Math.min(10000, c.employees) : null,
        domains, stage: "nou", source: "outbound", created_by: userId,
      }).select("id").single();
      if (insError || !ins) continue;
      leadId = ins.id;
      await supabase.from("platform_lead_events").insert({ lead_id: leadId, kind: "nota", body: `Găsit de agentul de prospectare (campania „${campaign?.name ?? ""}”).\n${facts}`.slice(0, 2000), created_by: userId });
      added++;
    } else linked++;
    await supabase.from("prospect_companies").update({ status: "importat", lead_id: leadId, reviewed_at: new Date().toISOString() }).eq("id", c.id);
  }
  revalidatePath("/admin/prospectare");
  revalidatePath("/admin/leads");
  return { added, linked };
}
