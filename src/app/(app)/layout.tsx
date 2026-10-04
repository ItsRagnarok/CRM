import { redirect } from "next/navigation";
import { requireSessionContext, ROLE_LABELS, FIELD_ROLES } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

// Every page in this group reads the signed-in user's session; never serve a
// cached/prerendered response for someone else's data.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireSessionContext();

  // requireSessionContext only checks org membership, not role — without this,
  // a technician/team_leader could type /facturare or /setari directly and the
  // page would render (RLS only isolates by organization, not by role). Login
  // already sends these roles to /mobil; this is the guard that makes it stick.
  if (FIELD_ROLES.includes(profile.role)) {
    redirect("/mobil");
  }

  const supabase = await createClient();

  const [{ data: notifications }, { data: conversations }, { data: reads }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, body, type, related_job_id, is_read, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("conversations").select("id, last_message_at"),
    supabase.from("conversation_reads").select("conversation_id, last_read_at").eq("profile_id", profile.id),
  ]);

  // Sent messages also bump the sender's own conversation_reads (see
  // app/(app)/mesaje/actions.ts), so comparing last_message_at to my own
  // last_read_at is enough to know a conversation has something I haven't
  // seen yet — no need to also check who sent the latest message.
  const readByConv = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));
  const unreadConversationsCount = (conversations ?? []).filter((c) => {
    const lastRead = readByConv.get(c.id);
    return !lastRead || c.last_message_at > lastRead;
  }).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar fullName={profile.full_name} roleLabel={ROLE_LABELS[profile.role]} unreadMessages={unreadConversationsCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar notifications={notifications ?? []} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
