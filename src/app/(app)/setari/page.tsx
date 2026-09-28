import { ComingSoon } from "@/components/coming-soon";
import { Settings } from "lucide-react";

export default function SetariPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Setări"
      description="Date companie, utilizatori și roluri, checklist-uri, abonament și confidențialitate GPS."
    />
  );
}
