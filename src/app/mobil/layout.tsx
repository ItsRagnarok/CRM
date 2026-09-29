import { requireSessionContext } from "@/lib/auth";
import { LocationTracker } from "./location-tracker";

// Every page in this group reads the signed-in user's session; never serve a
// cached/prerendered response for someone else's data.
export const dynamic = "force-dynamic";

export default async function MobilLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await requireSessionContext();

  return (
    <div className="mx-auto flex h-screen max-w-[480px] flex-col bg-[#f6f7fa]">
      <LocationTracker enabled={organization.gps_continuous_tracking_enabled} />
      {children}
    </div>
  );
}
