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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, type, related_job_id, is_read, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar fullName={profile.full_name} roleLabel={ROLE_LABELS[profile.role]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar notifications={notifications ?? []} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
