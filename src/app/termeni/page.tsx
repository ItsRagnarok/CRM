import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TermsContent } from "@/components/terms-content";

export const metadata = { title: "Termeni și condiții — ElectroField" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 text-[#1c1c22]">
      <Link href="/login" className="mb-6 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi
      </Link>

      <h1 className="text-[24px] font-extrabold">Termeni și condiții</h1>
      <p className="mt-1 text-[13px] text-muted-2">
        Ultima actualizare:{" "}
        {new Date().toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-8">
        <TermsContent />
      </div>
    </div>
  );
}
