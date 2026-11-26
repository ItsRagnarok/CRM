import { VersionWatcher } from "@/components/version-watcher";
import "./mobile.css";
import { cookies } from "next/headers";
import { requireSessionContext } from "@/lib/auth";
import { OfflineBanner } from "@/components/mobile/offline-banner";
import { LocationTracker } from "./location-tracker";
import { PushRegistration } from "./push-registration";
import { PreviewBoundary } from "@/components/preview-boundary";
import { UsageTracker } from "@/components/usage-tracker";
import { demoLocked } from "@/lib/demo";

// Every page in this group reads the signed-in user's session; never serve a
// cached/prerendered response for someone else's data.
export const dynamic = "force-dynamic";

export default async function MobilLayout({ children }: { children: React.ReactNode }) {
  const { organization, profile, readOnly } = await requireSessionContext();

  // Org-level toggle alone isn't enough for GDPR — continuous GPS tracking of
  // an employee's device also needs that employee's own, revocable consent.
  // Cont demo: fără urmărire GPS până nu o deblochează Super Adminul.
  const gpsEnabled = organization.gps_continuous_tracking_enabled && Boolean(profile.location_consent_at) && !demoLocked(organization, "m_gps");
  const cookieStore = await cookies();
  const sun = cookieStore.get("ef_sun")?.value === "1";
  const gloves = cookieStore.get("ef_gloves")?.value === "1";

  return (
    <div
      className="ef-app-theme m-root mx-auto flex h-dvh max-w-[480px] flex-col"
      data-sun={sun ? "1" : undefined}
      data-gloves={gloves ? "1" : undefined}
    >
      <OfflineBanner />
      <LocationTracker enabled={gpsEnabled && !readOnly} />
      {!readOnly && <><PushRegistration /><UsageTracker channel="mobile" /></>}
      {readOnly ? <PreviewBoundary company={organization.name} fullName={profile.full_name}>{children}</PreviewBoundary> : children}
      <VersionWatcher />
    </div>
  );
}
