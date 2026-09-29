import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
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
