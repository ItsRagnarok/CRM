"use server";

import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBackOffice } from "@/lib/notify";

type State = { ok?: boolean; error?: string } | undefined;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COND = ["buna", "uzata", "defecta"];

/** „Am primit-o”: tehnicianul confirmă predarea, cu starea în care a găsit scula. */
export async function confirmTool(_prev: State, fd: FormData): Promise<State> {
  await requireSessionContext();
  const id = String(fd.get("handoverId") ?? "");
  const condition = String(fd.get("condition") ?? "buna");
  if (!UUID.test(id)) return { error: "Predare necunoscută." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("tool_confirm", { p_handover: id, p_condition: COND.includes(condition) ? condition : "buna", p_note: String(fd.get("note") ?? "").slice(0, 500) });
  if (error) return { error: "Nu am putut confirma. Încearcă din nou." };
  return { ok: true };
}

/** „O returnez”: anunță biroul; scula rămâne la tine până confirmă biroul că a primit-o. */
export async function returnTool(_prev: State, fd: FormData): Promise<State> {
  const { organization, userId } = await requireSessionContext();
  const toolId = String(fd.get("toolId") ?? "");
  const condition = String(fd.get("condition") ?? "buna");
  const note = String(fd.get("note") ?? "").slice(0, 500);
  if (!UUID.test(toolId)) return { error: "Sculă necunoscută." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("tool_return_request", { p_tool: toolId, p_condition: COND.includes(condition) ? condition : "buna", p_note: note });
  if (error) return { error: "Nu am putut trimite. Încearcă din nou." };
  const [{ data: me }, { data: tool }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("tools").select("name").eq("id", toolId).maybeSingle(),
  ]);
  await notifyBackOffice(supabase, {
    organizationId: organization.id,
    type: "tool_handover",
    title: "Sculă returnată",
    body: `${me?.full_name ?? "Tehnicianul"} returnează ${tool?.name ?? "o sculă"}${condition === "defecta" ? " (defectă)" : condition === "uzata" ? " (uzată)" : ""}${note ? ` · ${note}` : ""}. Confirmă primirea în Registru scule.`,
    link: `/materiale/scule#t-${toolId}`,
    exceptProfileId: userId,
  });
  return { ok: true };
}
