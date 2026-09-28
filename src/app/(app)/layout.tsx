import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar fullName={profile.full_name} roleLabel={ROLE_LABELS[profile.role]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
