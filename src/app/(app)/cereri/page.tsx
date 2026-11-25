import Link from "next/link";
import { headers } from "next/headers";
import { Inbox, Phone, Mail, MapPin, CalendarClock, AlertTriangle, ArrowRight } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { CopyField } from "@/components/copy-field";
import { REQUEST_STATUSES, sourceLabel, windowLabel, longDate, type RequestStatus } from "@/lib/service-requests";
import { domainLabel } from "@/lib/domains";
import { NewRequestForm } from "./new-request-form";
import { RequestActions } from "./request-actions";
import { prefsSummary } from "@/lib/contact-prefs";

const SOURCE_TONE: Record<string, string> = {
  site: "bg-electric-soft text-[#3b5c0a]",
  telefon: "bg-[#eef4ff] text-[#1d4ed8]",
  whatsapp: "bg-[#e7f8ee] text-[#15803d]",
  email: "bg-[#f4f3ff] text-[#5b21b6]",
  tehnician: "bg-[#fff4e5] text-[#9a3412]",
  altul: "bg-neutral-bg text-muted",
};

function ago(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 60) return `acum ${min || 1} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `acum ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ieri" : `acum ${d} zile`;
}

/** O singură listă pentru tot ce cer clienții înainte să devină lucrare. */
export default async function CereriPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams;
  const status: RequestStatus = REQUEST_STATUSES.find((x) => x.id === sp.s)?.id ?? "noua";
  const { organization, readOnly } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: rows }, { data: clients }, { data: org }] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id, source, status, contact_name, phone, email, address, description, domain, preferred_date, preferred_window, preferred_channel, marketing_channels, urgent, job_id, decision_note, created_at, client_id, clients(name), jobs(display_number), profiles!service_requests_created_by_fkey(full_name)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("clients").select("id, name, phone").eq("organization_id", organization.id).order("name").limit(2000),
    supabase.from("organizations").select("request_token").eq("id", organization.id).maybeSingle(),
  ]);

  const all = rows ?? [];
  const counts = Object.fromEntries(REQUEST_STATUSES.map((x) => [x.id, all.filter((r) => r.status === x.id).length])) as Record<RequestStatus, number>;
  const list = all
    .filter((r) => r.status === status)
    .sort((a, b) => (status === "noua" ? Number(b.urgent) - Number(a.urgent) : 0) || b.created_at.localeCompare(a.created_at));

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.electrofield.ro";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const publicUrl = org?.request_token ? `${proto}://${host}/solicitare/${org.request_token}` : null;
  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${on ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`;

  return (
    <div className="flex flex-col gap-5 p-7">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">Cereri noi</h1>
        <p className="mt-1 max-w-[70ch] text-[13px] text-muted">
          Tot ce cer clienții, într-un singur loc: telefoane notate, e-mailuri, WhatsApp și formularul online al firmei. Din cerere faci lucrarea cu un clic; clientul și adresa se completează singure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {REQUEST_STATUSES.map((x) => (
              <Link key={x.id} href={x.id === "noua" ? "/cereri" : `/cereri?s=${x.id}`} className={chip(status === x.id)}>
                {x.label} · {counts[x.id]}
              </Link>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="rounded-[13px] border border-border bg-white p-5">
              <EmptyState
                icon={Inbox}
                title={status === "noua" ? "Nicio cerere nouă" : "Nimic aici"}
                description={status === "noua" ? "Notează aici cererile primite la telefon sau pe WhatsApp. Cele trimise din formularul online apar singure." : "Cererile apar aici după ce le muți din „Noi”."}
              />
            </div>
          ) : (
            list.map((r) => (
              <article key={r.id} className={`rounded-[13px] border bg-white p-4 ${r.urgent && r.status === "noua" ? "border-[#f3b4ae]" : "border-border"}`}>
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-extrabold text-foreground">{r.clients?.name ?? r.contact_name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${SOURCE_TONE[r.source] ?? SOURCE_TONE.altul}`}>{sourceLabel(r.source)}</span>
                      {r.urgent && <span className="flex items-center gap-1 rounded-full bg-[#fef3f2] px-2.5 py-0.5 text-[11.5px] font-bold text-[#b42318]"><AlertTriangle className="h-3 w-3" /> Urgent</span>}
                      {r.domain && <span className="rounded-full bg-neutral-bg px-2.5 py-0.5 text-[11.5px] font-semibold text-muted">{domainLabel(r.domain)}</span>}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-2">
                      {ago(r.created_at)}
                      {r.profiles?.full_name ? ` · notată de ${r.profiles.full_name}` : r.source === "site" ? " · trimisă de client" : ""}
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-snug text-foreground">{r.description}</p>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-[#475467]">
                  {r.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted" /> <span className="select-all font-semibold">{r.phone}</span></span>}
                  {r.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted" /> <span className="select-all">{r.email}</span></span>}
                  {r.address && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted" /> {r.address}</span>}
                  {(r.preferred_date || r.preferred_window) && (
                    <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-muted" /> Preferă {r.preferred_date ? longDate(r.preferred_date) : ""}{r.preferred_date && r.preferred_window ? ", " : ""}{windowLabel(r.preferred_window)}</span>
                  )}
                  {(r.preferred_channel || (r.marketing_channels ?? []).length > 0) && <span>{prefsSummary(r.preferred_channel, r.marketing_channels)}</span>}
                </div>
                {r.status === "respinsa" && r.decision_note && <p className="mt-2 text-[12.5px] text-muted">Motiv: {r.decision_note}</p>}
                {r.status === "programata" && r.job_id ? (
                  <Link href={`/lucrari/${r.job_id}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-electric">
                    Lucrarea #{r.jobs?.display_number} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  !readOnly && <RequestActions id={r.id} status={r.status} />
                )}
              </article>
            ))
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          {!readOnly && <NewRequestForm clients={(clients ?? []).map((c) => ({ id: c.id, name: c.name }))} enabledDomains={organization.enabled_domains ?? []} />}
          {publicUrl && (
            <section className="rounded-[13px] border border-border bg-white p-4">
              <div className="text-[14px] font-bold text-foreground">Formularul online al firmei</div>
              <p className="mt-1 text-[12.5px] text-muted">
                Pune linkul pe site-ul firmei, pe Facebook sau în semnătura de e-mail. Clienții își descriu problema și aleg o zi; cererea apare aici, iar biroul primește notificare.
              </p>
              <div className="mt-3"><CopyField value={publicUrl} label="Linkul formularului online" /></div>
              <a href={publicUrl} target="_blank" rel="noopener" className="mt-2 inline-block text-[12.5px] font-semibold text-electric">Vezi cum arată →</a>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
