import { ComingSoon } from "@/components/coming-soon";
import { FileText } from "lucide-react";

export default function FacturarePage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Facturare"
      description="Generare facturi pe baza manoperei, materialelor și deplasării fiecărei lucrări."
    />
  );
}
