import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { arrivalWindow, longDay } from "@/lib/client-messages";
import { StatusPrefsForm } from "./prefs-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stadiul lucrării | ElectroField", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STEPS = ["Programată", "Pe drum", "În lucru", "Finalizată"];
const ROLE: Record<string, string> = { technician: "Tehnician", team_leader: "Șef de echipă", manager: "Coordonator", admin: "Coordonator" };

type StatusData = {
  company: { name: string; phone: string | null; email: string | null };
  job: { number: number; title: string; status: string; date: string | null; start: string | null; end: string | null; window_minutes: number; departed_at: string | null; arrived_at: string | null; started_at: string | null; ended_at: string | null };
  team: { name: string; role: string; badges: string[] }[];
  team_name: string | null;
  photos: { path: string; category: "before" | "after"; taken_at: string }[];
  documents: { name: string; path: string; type: string | null }[];
  signature: { name: string; at: string } | null;
};

function stepOf(status: string) {
  if (status === "finalizata") return 3;
  if (status === "programata") return 0;
  if (status === "in_drum") return 1;
  return 2;
}
const detail: Record<string, string> = {
  programata: "Lucrarea este programată.",
  in_drum: "Echipa este pe drum spre dumneavoastră.",
  ajunsa: "Echipa a ajuns la locație.",
  in_lucru: "Echipa lucrează acum.",
  pauza: "Lucrarea este în pauză. Echipa revine.",
  finalizata: "Lucrarea este finalizată.",
  necesita_atentie: "Lucrarea are nevoie de o clarificare. Vă contactăm în curând.",
  anulata: "Lucrarea a fost anulată.",
};
const hm = (iso: string) => new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const dayOf = (iso: string) => new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#111a17", color: "#f6f9f6", colorScheme: "dark" }}>
      <div className="mx-auto max-w-[560px]">
        <Logo size={32} />
        {children}
      </div>
    </div>
  );
}
const card = "mt-4 rounded-2xl border border-white/15 bg-[#18231f] p-5";

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = UUID.test(token) ? await supabase.rpc("public_job_status_v2", { p_token: token }) : { data: null };
  const s = data as unknown as StatusData | null;
  const prefs = s ? ((await supabase.rpc("public_status_prefs", { p_token: token })).data as { channel: string | null; marketing: string[]; has_phone: boolean; has_email: boolean } | null) : null;

  if (!s) {
    return (
      <Shell>
        <div className="mt-10 rounded-2xl border border-white/15 bg-[#18231f] p-6">
          <h1 className="text-xl font-extrabold">Linkul nu mai este valabil</h1>
          <p className="mt-2 text-[14.5px] text-[#b7c2ba]">Linkul a expirat sau a fost dezactivat. Cereți firmei un link nou.</p>
        </div>
      </Shell>
    );
  }

  const j = s.job;
  const cancelled = j.status === "anulata";
  const done = j.status === "finalizata";
  const step = stepOf(j.status);
  const w = arrivalWindow(j.start, j.window_minutes);

  // Ce scriem sub titlu, după stadiu: fereastra de sosire, plecarea, sosirea sau încheierea.
  let timing: string | null = null;
  if (j.status === "programata" && j.date) timing = `Sosire estimată: ${longDay(j.date)}${w ? `, între ${w.from} și ${w.to}` : ""}.`;
  else if (j.status === "in_drum") timing = j.departed_at ? `Echipa a plecat spre dumneavoastră la ${hm(j.departed_at)}.` : "Echipa a plecat spre dumneavoastră.";
  else if (["ajunsa", "in_lucru", "pauza"].includes(j.status)) timing = j.arrived_at ? `Echipa a ajuns la ${hm(j.arrived_at)}.` : null;
  else if (done && j.ended_at) timing = `Încheiată ${dayOf(j.ended_at)}, la ${hm(j.ended_at)}${j.started_at ? ` (începută la ${hm(j.started_at)})` : ""}.`;

  // Pachetul de la închidere: linkuri semnate, valabile o oră.
  const paths = [...s.photos.map((p) => p.path), ...s.documents.map((d) => d.path)];
  const signed = paths.length ? (await supabase.storage.from("attachments").createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlOf = new Map(signed.filter((x) => x.signedUrl && x.path).map((x) => [x.path as string, x.signedUrl as string]));
  const before = s.photos.filter((p) => p.category === "before" && urlOf.has(p.path));
  const after = s.photos.filter((p) => p.category === "after" && urlOf.has(p.path));
  const docs = s.documents.filter((d) => urlOf.has(d.path));

  return (
    <Shell>
      <div className="mt-8 rounded-2xl border border-white/15 bg-[#18231f] p-6">
        <p className="text-[12.5px] font-semibold uppercase tracking-wider text-[#b7c2ba]">{s.company.name} · Lucrarea #{j.number}</p>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">{j.title}</h1>
        <p className="mt-3 text-[15px] font-semibold text-[#c6ff4a]">{detail[j.status] ?? ""}</p>
        {timing && <p className="mt-1 text-[14.5px] text-[#f6f9f6]">{timing}</p>}

        {!cancelled && (
          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Etapele lucrării">
            {STEPS.map((label, i) => (
              <li key={label} className="text-center">
                <div className={`mx-auto h-2 rounded-full ${i <= step ? "bg-[#c6ff4a]" : "bg-white/15"}`} />
                <span className={`mt-2 block text-[12px] font-bold ${i === step ? "text-[#f6f9f6]" : "text-[#b7c2ba]"}`}>{label}</span>
              </li>
            ))}
          </ol>
        )}
        {j.status === "programata" && w && <p className="mt-5 text-[13px] text-[#b7c2ba]">Fereastra de sosire ține cont de drum și de lucrarea dinainte. Vă anunțăm când echipa pleacă spre dumneavoastră.</p>}
      </div>

      {!cancelled && s.team.length > 0 && (
        <div className={card}>
          <p className="font-bold">{done ? "Cine a lucrat" : "Cine vine"}{s.team_name ? <span className="font-normal text-[#b7c2ba]"> · {s.team_name}</span> : null}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {s.team.map((t) => (
              <li key={t.name} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c6ff4a] text-[14px] font-extrabold text-[#111a17]" aria-hidden="true">{initials(t.name)}</span>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <div className="text-[13px] text-[#b7c2ba]">{ROLE[t.role] ?? "Tehnician"}</div>
                  {t.badges.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {t.badges.slice(0, 3).map((b) => <span key={b} className="rounded-full border border-[#c6ff4a]/40 px-2 py-0.5 text-[11.5px] font-semibold text-[#c6ff4a]">✓ {b}</span>)}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!done && s.team.some((t) => t.badges.length > 0) && <p className="mt-3 text-[12.5px] text-[#b7c2ba]">Autorizațiile afișate sunt valabile la data lucrării, verificate în registrul firmei.</p>}
        </div>
      )}

      {done && (before.length > 0 || after.length > 0) && (
        <div className={card}>
          <p className="font-bold">Poze de la lucrare</p>
          {[["Înainte", before], ["După", after]].map(([label, list]) => (list as typeof before).length > 0 && (
            <div key={label as string} className="mt-3">
              <p className="text-[12.5px] font-bold uppercase tracking-wider text-[#b7c2ba]">{label as string}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(list as typeof before).map((p) => (
                  <a key={p.path} href={urlOf.get(p.path)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlOf.get(p.path)} alt={`Poză ${(label as string).toLowerCase()}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {done && (docs.length > 0 || s.signature) && (
        <div className={card}>
          <p className="font-bold">Documentele lucrării</p>
          {docs.length > 0 && (
            <ul className="mt-2 flex flex-col gap-2">
              {docs.map((d) => (
                <li key={d.path}><a href={urlOf.get(d.path)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3.5 py-2.5 text-[14px] font-semibold text-[#c6ff4a]"><span className="min-w-0 truncate">{d.name}</span><span className="shrink-0 text-[12.5px] text-[#b7c2ba]">Deschide ↗</span></a></li>
              ))}
            </ul>
          )}
          {s.signature && <p className="mt-3 text-[13.5px] text-[#b7c2ba]">Lucrare confirmată la predare de <b className="text-[#f6f9f6]">{s.signature.name}</b>, {dayOf(s.signature.at)}, la {hm(s.signature.at)}.</p>}
          <p className="mt-2 text-[12px] text-[#b7c2ba]">Linkurile către fișiere sunt valabile o oră; reîncărcați pagina pentru linkuri noi.</p>
        </div>
      )}

      {prefs && (prefs.has_phone || prefs.has_email) && j.status !== "anulata" && (
        <div className={card}>
          <p className="font-bold">Cum preferați să vă anunțăm?</p>
          <StatusPrefsForm token={token} company={s.company.name} channel={prefs.channel} marketing={prefs.marketing ?? []} hasPhone={prefs.has_phone} hasEmail={prefs.has_email} />
        </div>
      )}

      {(s.company.phone || s.company.email) && (
        <div className={`${card} text-[14.5px]`}>
          <p className="font-bold">Aveți o întrebare?</p>
          <p className="mt-1 text-[#b7c2ba]">Contactați {s.company.name}:</p>
          <div className="mt-2 flex flex-col gap-1">
            {s.company.phone && <a href={`tel:${s.company.phone}`} className="font-semibold text-[#c6ff4a]">{s.company.phone}</a>}
            {s.company.email && <a href={`mailto:${s.company.email}`} className="font-semibold text-[#c6ff4a]">{s.company.email}</a>}
          </div>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-[#b7c2ba]">Pagina se actualizează la reîncărcare. Trimis prin ElectroField.</p>
    </Shell>
  );
}
