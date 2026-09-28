import { ComingSoon } from "@/components/coming-soon";
import { Package } from "lucide-react";

export default function MaterialePage() {
  return (
    <ComingSoon
      icon={Package}
      title="Materiale & Stoc"
      description="Inventar depozit central și stoc pe fiecare vehicul, cu alerte de reaprovizionare."
    />
  );
}
