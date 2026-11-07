import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/mobile/bottom-nav";

export default async function MobileTabsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id)
    .eq("type", "message")
    .eq("is_read", false);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
      <BottomNav unreadMessages={count ?? 0} />
    </>
  );
}
