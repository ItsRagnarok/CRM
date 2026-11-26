import { FlaskConical } from "lucide-react";
import { demoDaysLeft, demoExpired } from "@/lib/demo";

type Org = { name: string; account_type?: string | null; demo_unlocked?: string[] | null; demo_expires_at?: string | null };

/** Banda subțire de sus din platformă: „Cont demo · Firma”, câte zile mai are, și programarea unei discuții. */
export function DemoBanner({ org }: { org: Org }) {
  const expired = demoExpired(org);
  const days = demoDaysLeft(org);
  return (
    <div role="note" className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2 text-[13px] font-semibold md:px-7 ${expired ? "bg-danger-bg text-danger" : "bg-[#101828] text-white"}`}>
      <FlaskConical className={`h-4 w-4 shrink-0 ${expired ? "" : "text-electric"}`} />
      <span>Cont demo · {org.name}</span>
      <span className={expired ? "" : "text-[#9da0a8]"}>
        {expired ? "Perioada demo s-a încheiat; datele rămân în cont." : days === null ? "Modulele cu lacăt se configurează pe firma ta." : `Mai sunt ${days} ${days === 1 ? "zi" : "zile"}. Modulele cu lacăt se configurează pe firma ta.`}
      </span>
      <a href="/programare" target="_blank" rel="noreferrer" className={`ml-auto rounded-full px-3 py-1 text-[12.5px] font-extrabold ${expired ? "bg-danger text-white" : "bg-electric text-[#0a0d0a]"}`}>Programează o discuție</a>
    </div>
  );
}

/** Pe telefon: o etichetă mică, fără bani sau abonament în text. */
export function DemoChip({ org }: { org: Org }) {
  const expired = demoExpired(org);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800, background: expired ? "#fef3f2" : "#101828", color: expired ? "#b42318" : "#c6ff4a" }}>
      <FlaskConical style={{ width: 13, height: 13 }} /> {expired ? "Cont demo încheiat" : "Cont demo"} · {org.name}
    </span>
  );
}
