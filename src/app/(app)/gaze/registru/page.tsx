import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { requireSessionContext, isBackOfficeRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasModule } from "@/lib/modules";
import { todayInOrgTimeZone } from "@/lib/date";
import { buildRegister } from "@/lib/gas-register";

export const dynamic = "force-dynamic";

/** Registrul anual electronic (anexa 6), generat din fișele încheiate. */
export default async function GasRegisterPage({ searchParams }: { searchParams: Promise<{ an?: string }> }) {
  const { an } = await searchParams;
  const { organization, profile } = await requireSessionContext();
  if (!hasModule(organization.enabled_modules, "scadentar_gaze") || !isBackOfficeRole(profile.role)) redirect("/dashboard");
  const thisYear = Number(todayInOrgTimeZone().slice(0, 4));
  const year = Number(an) >= 2015 && Number(an) <= thisYear + 1 ? Number(an) : thisYear;
  const supabase = await createClient();
  const { data } = await supabase
    .from("gas_records")
    .select("kind, number, drawn_up_on, conform, data")
    .eq("organization_id", organization.id)
    .eq("year", year)
    .not("completed_at", "is", null)
    .limit(10000);
  const rows = buildRegister(data ?? []);
  const th = "border-b border-border px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-muted";

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-5 p-6">
      <Link href="/gaze/fise" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Înapoi la fișe</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold">Registrul de evidență {year}</h1>
          <p className="mt-1 max-w-[760px] text-sm text-muted">Verificările și reviziile tehnice efectuate în cursul anului, în coloanele din anexa 6 la Ord. ANRE 179/2015. Se completează singur din fișele încheiate pe telefon. Contractele de remediere a defectelor se adaugă manual, dacă e cazul.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[thisYear - 1, thisYear].map((y) => (
            <Link key={y} href={`/gaze/registru?an=${y}`} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${y === year ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white"}`}>{y}</Link>
          ))}
          <a href={`/gaze/registru/export?an=${year}`} className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13px] font-bold"><Download className="h-3.5 w-3.5" /> Excel (CSV)</a>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[1100px] text-[13px]">
          <thead>
            <tr>
              <th className={th}>Nr.</th><th className={th}>Client final</th><th className={th}>Adresa locului de consum</th><th className={th}>Cod loc</th><th className={th}>Contract</th>
              <th className={th}>Individuală</th><th className={th}>Comună</th><th className={th}>Fișă verificare</th><th className={th}>Fișă revizie</th><th className={th}>Poate funcționa</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-muted">Nicio fișă încheiată în {year}.</td></tr>}
            {rows.map((r) => (
              <tr key={r.nr} className="border-b border-[#f2f4f7] last:border-0">
                <td className="px-3 py-2.5 tabular-nums">{r.nr}</td>
                <td className="px-3 py-2.5 font-semibold">{r.client}</td>
                <td className="px-3 py-2.5">{r.adresa}</td>
                <td className="px-3 py-2.5">{r.codLoc}</td>
                <td className="px-3 py-2.5">{r.contract}</td>
                <td className="px-3 py-2.5 text-center">{r.individuala ? "X" : ""}</td>
                <td className="px-3 py-2.5 text-center">{r.comuna ? "X" : ""}</td>
                <td className="px-3 py-2.5 tabular-nums">{r.verificare ? `${r.verificare.nr} / ${r.verificare.data}` : ""}</td>
                <td className="px-3 py-2.5 tabular-nums">{r.revizie ? `${r.revizie.nr} / ${r.revizie.data}` : ""}</td>
                <td className={`px-3 py-2.5 font-bold ${r.conform === false ? "text-danger" : ""}`}>{r.conform === null ? "" : r.conform ? "Da" : "Nu"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
