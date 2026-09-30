import { requireSessionContext } from "@/lib/auth";
import { LocationTracker } from "./location-tracker";
import { PushRegistration } from "./push-registration";

// Every page in this group reads the signed-in user's session; never serve a
// cached/prerendered response for someone else's data.
export const dynamic = "force-dynamic";

export default async function MobilLayout({ children }: { children: React.ReactNode }) {
  const { organization, profile } = await requireSessionContext();

  // Org-level toggle alone isn't enough for GDPR — continuous GPS tracking of
  // an employee's device also needs that employee's own, revocable consent.
  const gpsEnabled = organization.gps_continuous_tracking_enabled && Boolean(profile.location_consent_at);

  return (
    <div className="mx-auto flex h-screen max-w-[480px] flex-col bg-[#f6f7fa]">
      <LocationTracker enabled={gpsEnabled} />
      <PushRegistration />
      {children}
    </div>
  );
}
