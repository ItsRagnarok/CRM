import Link from "next/link";
import { Lock, CalendarClock, ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { demoExpired, demoFeature, demoLocked } from "@/lib/demo";
import { OfferButton } from "./offer-button";

/**
 * Pus în layout-ul unei secțiuni: într-un cont demo, dacă funcția e blocată, arată ecranul
 * „se configurează pe firma ta” în locul paginii (pagina nu se mai execută, deci nici datele ei).
 * Pe telefon, textul nu vorbește despre bani sau abonament (regulile magazinelor de aplicații).
 */
export async function DemoGate({ feature, area, children }: { feature: string; area: "web" | "mobil"; children: React.ReactNode }) {
  const { organization, profile, readOnly } = await requireSessionContext();
  if (!demoLocked(organization, feature)) return <>{children}</>;

  if (!readOnly) {
    // Ce a încercat firma: Super Adminul vede asta la companie, ca subiect pentru discuție.
    try {
      const supabase = await createClient();
      await supabase.from("demo_events").insert({ organization_id: organization.id, profile_id: profile.id, feature, area });
    } catch {
      /* jurnalul nu oprește pagina */
    }
  }
  const f = demoFeature(feature);
  const expired = demoExpired(organization);
  return area === "mobil"
    ? <LockedMobile label={f?.label.replace(/ \(telefon\)$/, "") ?? "Funcția"} why={f?.why ?? ""} expired={expired} />
    : <LockedWeb feature={feature} label={f?.label ?? "Modulul"} why={f?.why ?? ""} expired={expired} canRequest={profile.role === "admin" && !readOnly} />;
}

function LockedWeb({ feature, label, why, expired, canRequest }: { feature: string; label: string; why: string; expired: boolean; canRequest: boolean }) {
  return (
    <div className="relative min-h-full overflow-hidden p-5 md:p-7">
      {/* Ecranul „real”, estompat, în spate: rânduri și carduri, ca să se vadă că modulul există. */}
      <div aria-hidden="true" className="pointer-events-none select-none opacity-60 blur-[3px]">
        <div className="h-7 w-64 rounded-lg bg-[#e4e7ec]" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-[#eef0f3]" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl border border-border bg-white" />)}
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-white p-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[#f2f4f7] py-3 last:border-0">
              <div className="h-9 w-9 rounded-xl bg-[#eef0f3]" />
              <div className="h-3.5 flex-1 rounded bg-[#eef0f3]" />
              <div className="h-3.5 w-24 rounded bg-[#eef0f3]" />
              <div className="h-6 w-20 rounded-full bg-[#e8f8c8]" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-[10vh]">
        <section className="w-full max-w-[520px] rounded-[18px] border border-border bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,.16)]" aria-labelledby="demo-lock-title">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#101828] text-electric"><Lock className="h-5 w-5" /></div>
          <h1 id="demo-lock-title" className="mt-4 text-[21px] font-extrabold leading-tight tracking-tight">
            {expired ? "Perioada demo s-a încheiat" : `${label} se configurează pe firma ta`}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#344054]">
            {expired
              ? "Datele rămân în cont. Ca să continui, stabilim împreună ce module îți trebuie și cum lucrezi: abonament lunar sau contract, după mărimea firmei."
              : <>Depinde de datele tale: {why.charAt(0).toLowerCase() + why.slice(1)} O configurăm împreună, pe firma ta, în aproximativ 30 de minute.</>}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a href="/programare" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[11px] bg-electric px-4 py-2.5 text-[14px] font-extrabold text-[#0a0d0a]">
              <CalendarClock className="h-4 w-4" /> Programează o discuție
            </a>
            {canRequest && <OfferButton feature={feature} />}
            <Link href="/dashboard" className="px-2 py-2.5 text-[13.5px] font-semibold text-muted hover:text-foreground">Rămân în demo</Link>
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[12px] text-muted-2">Abonament lunar fără angajament, sau contract pentru echipe mari. Discutăm ce ți se potrivește.</p>
        </section>
      </div>
    </div>
  );
}

function LockedMobile({ label, why, expired }: { label: string; why: string; expired: boolean }) {
  return (
    <div className="flex flex-col">
      <header className="m-hd">
        <Link href="/mobil" className="m-ib" aria-label="Înapoi"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="m-t1 m-fl">{label}</h1>
      </header>
      <div className="m-bd">
        <div className="m-cd" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ margin: "0 auto 12px", width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "#101828", color: "#c6ff4a" }}>
            <Lock className="h-6 w-6" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{expired ? "Contul demo s-a încheiat" : "Se activează pentru firma ta"}</div>
          <p className="m-mu" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5 }}>
            {expired ? "Vorbește cu administratorul contului." : <>Depinde de firma ta: {why.charAt(0).toLowerCase() + why.slice(1)} Administratorul contului o activează după ce o configurează.</>}
          </p>
          <Link href="/mobil" className="m-btn" style={{ marginTop: 16 }}>Înapoi la ziua de azi</Link>
        </div>
      </div>
    </div>
  );
}
