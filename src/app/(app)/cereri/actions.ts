"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBackOfficeContext } from "@/lib/auth";
import { REQUEST_SOURCES, WINDOWS } from "@/lib/service-requests";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const txt = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

/** Biroul notează o cerere venită pe telefon, e-mail sau WhatsApp. */
export async function addRequest(_prev: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const ctx = await requireBackOfficeContext();
  if (!ctx) return { error: "Doar biroul poate nota cereri." };
  const source = txt(fd, "source", 20);
  const contactName = txt(fd, "contactName", 120);
  const description = txt(fd, "description", 2000);
  const phone = txt(fd, "phone", 40) || null;
  const email = txt(fd, "email", 160) || null;
  if (!REQUEST_SOURCES.some((s) => s.id === source)) return { error: "Alege de unde vine cererea." };
  if (!contactName) return { error: "Scrie numele clientului." };
  if (description.length < 3) return { error: "Scrie pe scurt ce cere clientul." };
  if (!phone && !email) return { error: "Pune un telefon sau un e-mail, ca să poți reveni." };

  const clientId = txt(fd, "clientId", 40);
  const domain = txt(fd, "domain", 20);
  const date = txt(fd, "preferredDate", 10);
  const window = txt(fd, "preferredWindow", 20);
  const supabase = await createClient();
  const { error } = await supabase.from("service_requests").insert({
    organization_id: ctx.organization.id,
    source,
    contact_name: contactName,
    phone,
    email,
    address: txt(fd, "address", 300) || null,
    description,
    domain: ["gaze", "electric", "fotovoltaic"].includes(domain) ? domain : null,
    preferred_date: ISO.test(date) ? date : null,
    preferred_window: WINDOWS.some((w) => w.id === window) ? window : null,
    urgent: fd.get("urgent") === "on",
    client_id: UUID.test(clientId) ? clientId : null,
    created_by: ctx.userId,
  });
  if (error) return { error: "Nu am putut salva cererea. Încearcă din nou." };
  revalidatePath("/cereri");
  return { ok: true };
}

/** Contactată / respinsă (cu motiv) / redeschisă. */
export async function setRequestStatus(id: string, status: "noua" | "contactata" | "respinsa", fd?: FormData) {
  const ctx = await requireBackOfficeContext();
  if (!ctx || !UUID.test(id) || !["noua", "contactata", "respinsa"].includes(status)) return;
  const note = fd ? String(fd.get("note") ?? "").trim().slice(0, 500) : "";
  const supabase = await createClient();
  await supabase
    .from("service_requests")
    .update({
      status,
      decision_note: status === "respinsa" ? note || null : undefined,
      decided_by: status === "noua" ? null : ctx.userId,
      decided_at: status === "noua" ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", ctx.organization.id)
    .neq("status", "programata");
  revalidatePath("/cereri");
}

/**
 * Din cerere în lucrare: găsește clientul (ales, după telefon sau e-mail) sau îl creează,
 * apoi deschide formularul de lucrare nouă completat din cerere.
 */
export async function convertRequest(id: string) {
  const ctx = await requireBackOfficeContext();
  if (!ctx || !UUID.test(id)) return;
  const supabase = await createClient();
  const orgId = ctx.organization.id;
  const { data: r } = await supabase.from("service_requests").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!r) return;

  let clientId = r.client_id;
  if (!clientId && r.phone) {
    const digits = r.phone.replace(/\D/g, "").slice(-9);
    if (digits.length === 9) {
      const { data: byPhone } = await supabase.from("clients").select("id, phone").eq("organization_id", orgId).ilike("phone", `%${digits.slice(-4)}%`).limit(50);
      clientId = (byPhone ?? []).find((c) => (c.phone ?? "").replace(/\D/g, "").endsWith(digits))?.id ?? null;
    }
  }
  if (!clientId && r.email) {
    const { data: byEmail } = await supabase.from("clients").select("id").eq("organization_id", orgId).ilike("email", r.email).maybeSingle();
    clientId = byEmail?.id ?? null;
  }
  if (!clientId) {
    const { data: created } = await supabase
      .from("clients")
      .insert({ organization_id: orgId, name: r.contact_name, phone: r.phone, email: r.email, address: r.address, created_by: ctx.userId })
      .select("id")
      .single();
    clientId = created?.id ?? null;
  }
  if (!clientId) return;
  if (clientId !== r.client_id) await supabase.from("service_requests").update({ client_id: clientId }).eq("id", id);

  const q = new URLSearchParams({ clientId, cerere: id });
  if (r.preferred_date) q.set("date", r.preferred_date);
  redirect(`/lucrari/nou?${q}`);
}
