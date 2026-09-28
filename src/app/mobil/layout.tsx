import { requireSessionContext } from "@/lib/auth";

// Every page in this group reads the signed-in user's session; never serve a
// cached/prerendered response for someone else's data.
export const dynamic = "force-dynamic";

export default async function MobilLayout({ children }: { children: React.ReactNode }) {
  await requireSessionContext();

  return <div className="mx-auto flex h-screen max-w-[480px] flex-col bg-[#f6f7fa]">{children}</div>;
}
