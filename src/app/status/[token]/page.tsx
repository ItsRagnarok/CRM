import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stadiul lucrării | ElectroField", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STEPS = ["Programată", "În lucru", "Finalizată"];

function stepOf(status: string) {
  if (status === "finalizata") return 2;
  if (status === "programata") return 0;
  return 1;
}
const detail: Record<string, string> = {
  programata: "Lucrarea este programată.",
  in_drum: "Echipa este în drum spre dumneavoastră.",
  ajunsa: "Echipa a ajuns la locație.",
  in_lucru: "Echipa lucrează acum.",
  pauza: "Lucrarea este în pauză. Echipa revine.",
  finalizata: "Lucrarea este finalizată.",
  necesita_atentie: "Lucrarea are nevoie de o clarificare. Vă contactăm în curând.",
  anulata: "Lucrarea a fost anulată.",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#111a17", color: "#f6f9f6", colorScheme: "dark" }}>
      <div className="mx-auto max-w-[520px]">
        <Logo size={32} />
        {children}
      </div>
    </div>
  );
}

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = UUID.test(token) ? await supabase.rpc("public_job_status", { p_token: token }) : { data: null };
  const s = data?.[0];

  if (!s) {
    return (
      <Shell>
        <div className="mt-10 rounded-2xl border border-white/15 bg-[#18231f] p-6">
          <h1 className="text-xl font-extrabold">Linkul nu mai este valabil</h1>
          <p className="mt-2 text-[14.5px] text-[#b7c2ba]">Linkul a expirat sau a fost dezactivat. Cere firmei un link nou.</p>
        </div>
      </Shell>
    );
  }

  const cancelled = s.status === "anulata";
  const step = stepOf(s.status);
  const when = s.scheduled_date
    ? `${new Date(`${s.scheduled_date}T12:00:00Z`).toLocaleDateString("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" })}${s.start_time ? `, ora ${s.start_time.slice(0, 5)}` : ""}`
    : null;

  return (
    <Shell>
      <div className="mt-8 rounded-2xl border border-white/15 bg-[#18231f] p-6">
        <p className="text-[12.5px] font-semibold uppercase tracking-wider text-[#b7c2ba]">{s.company_name} · Lucrarea #{s.job_number}</p>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">{s.title}</h1>
        <p className="mt-3 text-[15px] font-semibold text-[#c6ff4a]">{detail[s.status] ?? ""}</p>

        {!cancelled && (
          <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Etapele lucrării">
            {STEPS.map((label, i) => (
              <li key={label} className="text-center">
                <div className={`mx-auto h-2 rounded-full ${i <= step ? "bg-[#c6ff4a]" : "bg-white/15"}`} />
                <span className={`mt-2 block text-[12.5px] font-bold ${i === step ? "text-[#f6f9f6]" : "text-[#b7c2ba]"}`}>{label}</span>
              </li>
            ))}
          </ol>
        )}
        {when && <p className="mt-5 text-[14px] text-[#b7c2ba]">Programare: <b className="text-[#f6f9f6]">{when}</b></p>}
      </div>

      {(s.company_phone || s.company_email) && (
        <div className="mt-4 rounded-2xl border border-white/15 bg-[#18231f] p-5 text-[14.5px]">
          <p className="font-bold">Ai o întrebare?</p>
          <p className="mt-1 text-[#b7c2ba]">Contactează {s.company_name}:</p>
          <div className="mt-2 flex flex-col gap-1">
            {s.company_phone && <a href={`tel:${s.company_phone}`} className="font-semibold text-[#c6ff4a]">{s.company_phone}</a>}
            {s.company_email && <a href={`mailto:${s.company_email}`} className="font-semibold text-[#c6ff4a]">{s.company_email}</a>}
          </div>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-[#b7c2ba]">Pagina se actualizează la reîncărcare. Trimis prin ElectroField.</p>
    </Shell>
  );
}
