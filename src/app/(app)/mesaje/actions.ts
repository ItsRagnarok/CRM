"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";

// Lazily create-or-fetch pattern: a team/employee only gets a conversation
// row once someone actually sends a first message to them — the partial
// unique indexes on conversations(team_id)/(profile_id) make the insert a
// safe no-op race (two admins messaging the same team at once just means
// one insert wins and the other falls back to the select).
async function getOrCreateTeamConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  teamId: string
) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("team_id", teamId)
    .eq("kind", "team")
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ organization_id: organizationId, kind: "team", team_id: teamId })
    .select("id")
    .single();
  if (!error) return created.id;

  const { data: afterRace } = await supabase
    .from("conversations")
    .select("id")
    .eq("team_id", teamId)
    .eq("kind", "team")
    .single();
  return afterRace!.id;
}

async function getOrCreateDirectConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  profileId: string
) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("profile_id", profileId)
    .eq("kind", "direct")
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ organization_id: organizationId, kind: "direct", profile_id: profileId })
    .select("id")
    .single();
  if (!error) return created.id;

  const { data: afterRace } = await supabase
    .from("conversations")
    .select("id")
    .eq("profile_id", profileId)
    .eq("kind", "direct")
    .single();
  return afterRace!.id;
}

// Sending also marks the conversation read for the sender — otherwise your
// own just-sent message would make the thread you're looking at show up as
// "unread" again in the badge/list a moment later.
async function markReadFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  profileId: string
) {
  await supabase
    .from("conversation_reads")
    .upsert({ conversation_id: conversationId, profile_id: profileId, last_read_at: new Date().toISOString() });
}

export async function sendTeamMessage(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const jobId = String(formData.get("jobId") ?? "") || null;
  if (!teamId || !body) return;

  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const conversationId = await getOrCreateTeamConversation(supabase, organization.id, teamId);
  const now = new Date().toISOString();

  await supabase.from("conversation_messages").insert({
    conversation_id: conversationId,
    organization_id: organization.id,
    sender_profile_id: profile.id,
    body,
    job_id: jobId,
  });
  await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversationId);
  await markReadFor(supabase, conversationId, profile.id);

  revalidatePath("/harta");
  revalidatePath("/mesaje");
}

export async function sendDirectMessage(formData: FormData) {
  const targetProfileId = String(formData.get("profileId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!targetProfileId || !body) return;

  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const conversationId = await getOrCreateDirectConversation(supabase, organization.id, targetProfileId);
  const now = new Date().toISOString();

  await supabase.from("conversation_messages").insert({
    conversation_id: conversationId,
    organization_id: organization.id,
    sender_profile_id: profile.id,
    body,
  });
  await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversationId);
  await markReadFor(supabase, conversationId, profile.id);

  revalidatePath("/mesaje");
}

export async function markConversationRead(conversationId: string) {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  await markReadFor(supabase, conversationId, profile.id);
  revalidatePath("/mesaje");
  revalidatePath("/harta");
}
