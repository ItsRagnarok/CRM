import { requireSessionContext } from "@/lib/auth";
import { LocationTracker } from "./location-tracker";
import { PushRegistration } from "./push-registration";
import { PreviewBoundary } from "@/components/preview-boundary";
import { UsageTracker } from "@/components/usage-tracker";

// Every page in this group reads the signed-in user's session; never serve a
// cached/prerendered response for someone else's data.
export const dynamic = "force-dynamic";

export default async function MobilLayout({ children }: { children: React.ReactNode }) {
  const { organization, profile, readOnly } = await requireSessionContext();

  // Org-level toggle alone isn't enough for GDPR — continuous GPS tracking of
  // an employee's device also needs that employee's own, revocable consent.
  const gpsEnabled = organization.gps_continuous_tracking_enabled && Boolean(profile.location_consent_at);

  return (
    <div className="ef-app-theme mx-auto flex h-screen max-w-[480px] flex-col bg-[#f6f7fa]">
      <LocationTracker enabled={gpsEnabled && !readOnly} />
      {!readOnly && <><PushRegistration /><UsageTracker channel="mobile" /></>}
      {readOnly ? <PreviewBoundary company={organization.name} fullName={profile.full_name}>{children}</PreviewBoundary> : children}
    </div>
  );
}
