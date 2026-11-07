import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyProfiles } from "@/lib/notify";

const STAFF_ROLES: Database["public"]["Enums"]["user_role"][] = ["admin", "manager"];

function preview(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
}

// After a chat message is stored, tells the people on the other end:
// - an admin/manager writing  -> the team's members, or the one employee
// - a technician replying      -> the admins/managers (and, in a team thread,
//                                 their teammates)
// Each recipient gets a link into the right screen for their device: the
// mobile thread for field roles, the platform's Mesaje page for staff.
export async function notifyConversationMessage(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    conversationId: string;
    sender: { id: string; fullName: string; role: string };
    body: string;
  }
) {
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, kind, team_id, profile_id")
    .eq("id", input.conversationId)
    .maybeSingle();
  if (!conv) return;

  const senderIsStaff = (STAFF_ROLES as string[]).includes(input.sender.role);

  const recipientIds = new Set<string>();
  if (conv.kind === "direct" && conv.profile_id) {
    if (senderIsStaff) recipientIds.add(conv.profile_id);
  } else if (conv.kind === "team" && conv.team_id) {
    const { data: members } = await supabase.from("team_members").select("profile_id").eq("team_id", conv.team_id);
    for (const m of members ?? []) recipientIds.add(m.profile_id);
  }
  if (!senderIsStaff) {
    const { data: staff } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", input.organizationId)
      .in("role", STAFF_ROLES)
      .eq("is_active", true);
    for (const s of staff ?? []) recipientIds.add(s.id);
  }
  recipientIds.delete(input.sender.id);
  if (recipientIds.size === 0) return;

  const { data: recipients } = await supabase.from("profiles").select("id, role").in("id", [...recipientIds]);
  const staffIds = (recipients ?? []).filter((r) => STAFF_ROLES.includes(r.role)).map((r) => r.id);
  const fieldIds = (recipients ?? []).filter((r) => !STAFF_ROLES.includes(r.role)).map((r) => r.id);

  const staffLink =
    conv.kind === "team" ? `/mesaje?team=${conv.team_id}` : `/mesaje?emp=${conv.profile_id}`;
  const title = senderIsStaff ? `Mesaj nou de la ${input.sender.fullName}` : `Mesaj de la ${input.sender.fullName}`;
  const body = preview(input.body);

  await Promise.all([
    staffIds.length > 0
      ? notifyProfiles(supabase, { organizationId: input.organizationId, profileIds: staffIds, type: "message", title, body, link: staffLink })
      : null,
    fieldIds.length > 0
      ? notifyProfiles(supabase, {
          organizationId: input.organizationId,
          profileIds: fieldIds,
          type: "message",
          title,
          body,
          link: `/mobil/mesaje/${conv.id}`,
        })
      : null,
  ]);
}
