"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { notifyConversationMessage } from "@/lib/message-notify";

// A field employee can only answer inside a conversation that already
// exists for them (their direct line with the office, or their team's chat) —
// row-level security rejects anything else, so this never needs to re-check
// membership itself.
export async function sendMobileMessage(formData: FormData) {
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!conversationId || !body) return;

  const { organization, profile } = await requireSessionContext();
  const supabase = await createClient();

  const { error } = await supabase.from("conversation_messages").insert({
    conversation_id: conversationId,
    organization_id: organization.id,
    sender_profile_id: profile.id,
    body,
  });
  if (error) return;

  await supabase
    .from("conversation_reads")
    .upsert({ conversation_id: conversationId, profile_id: profile.id, last_read_at: new Date().toISOString() });

  await notifyConversationMessage(supabase, {
    organizationId: organization.id,
    conversationId,
    sender: { id: profile.id, fullName: profile.full_name, role: profile.role },
    body,
  });

  revalidatePath("/mobil/mesaje");
}

export async function markMobileConversationRead(conversationId: string) {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("conversation_reads")
    .upsert({ conversation_id: conversationId, profile_id: profile.id, last_read_at: now });
  // Opening the thread also settles the bell entries that pointed at it.
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", profile.id)
    .eq("type", "message")
    .eq("link", `/mobil/mesaje/${conversationId}`)
    .eq("is_read", false);
  revalidatePath("/mobil");
  revalidatePath("/mobil/mesaje");
}
