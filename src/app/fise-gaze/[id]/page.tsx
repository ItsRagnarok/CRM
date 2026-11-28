import { notFound, redirect } from "next/navigation";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GasRecordSheet } from "@/components/docs/gas-record-sheet";
import { PrintButton } from "@/app/rapoarte-lucrare/[id]/print-button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Fișa de evidență, în forma din anexa 4 / 5, gata de tipărit sau salvat ca PDF. */
export default async function GasRecordPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { organization, profile } = await requireSessionContext();
  if (!isBackOfficeRole(profile.role)) redirect("/mobil");
  const supabase = await createClient();
  const [{ data: r }, { data: auth }] = await Promise.all([
    supabase.from("gas_records").select("*").eq("id", id).eq("organization_id", organization.id).maybeSingle(),
    supabase.from("compliance_items").select("title, subject, issued_on, expires_on").eq("organization_id", organization.id).eq("kind", "company").eq("domain", "gaze").order("expires_on", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!r) notFound();
  return (
    <GasRecordSheet
      r={r}
      auth={auth}
      organization={organization}
      toolbar={
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-3 text-[13px]">
        <span>Verifică forma fișei cu textul în vigoare al Ord. ANRE 179/2015 înainte de a o depune.</span>
        <PrintButton />
        </div>
      }
    />
  );
}
