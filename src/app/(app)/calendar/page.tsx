import { ComingSoon } from "@/components/coming-soon";
import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={Calendar}
      title="Calendar"
      description="Vizualizare drag & drop a lucrărilor pe zi/săptămână/lună, cu dispatch pe echipe."
    />
  );
}
