import { ScreenSkeleton } from "@/components/mobile/screen-skeleton";

// Ecranele din aplicație fără schelet propriu: atingerea arată imediat ecranul de încărcare.
export default function MobileLoading() {
  return <ScreenSkeleton />;
}
