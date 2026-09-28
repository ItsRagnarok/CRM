import { ComingSoon } from "@/components/coming-soon";
import { Receipt } from "lucide-react";

export default function CheltuieliPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Cheltuieli"
      description="Listă cheltuieli depuse de tehnicieni, cu aprobare/respingere și scanare bon prin AI."
    />
  );
}
