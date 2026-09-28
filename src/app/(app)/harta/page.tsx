import { ComingSoon } from "@/components/coming-soon";
import { MapPin } from "lucide-react";

export default function HartaPage() {
  return (
    <ComingSoon
      icon={MapPin}
      title="Hartă & GPS"
      description="Hartă live cu echipele și lucrările active — va fi conectată la un furnizor de hărți (Mapbox/Google Maps)."
    />
  );
}
