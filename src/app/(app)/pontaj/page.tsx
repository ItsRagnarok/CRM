import { ComingSoon } from "@/components/coming-soon";
import { Clock } from "lucide-react";

export default function PontajPage() {
  return (
    <ComingSoon
      icon={Clock}
      title="Pontaj"
      description="Ore lucrate, deplasare și pauză per angajat, echipă și lucrare."
    />
  );
}
