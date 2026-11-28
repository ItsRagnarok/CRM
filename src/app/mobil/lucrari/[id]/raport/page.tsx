import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Eye, FileText } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { reportMessage } from "@/lib/client-messages";
import { JOB_STATUS_LABELS } from "@/lib/status";
import { ShareReport } from "./share-report";

/**
 * Raportul lucrării în aplicație: un rezumat pe ecran, cu „Înapoi”, și trimiterea către client.
 * PDF-ul nu se mai deschide în aplicație (pe iPhone rămânea pe ecran fără ieșire); clientul primește linkul.
 */
export default async function MobileJobReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const { id } = await params;
  const { from } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, title, status, scheduled_date, clients(name, phone, email, preferred_channel, address), locations(address), job_assignments(profiles(full_name))")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const [{ data: checklist }, { count: photoCount }, { data: signature }] = await Promise.all([
    supabase.from("job_checklists").select("job_checklist_items(label, is_checked)").eq("job_id", id).eq("phase", "after").maybeSingle(),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("job_id", id),
    supabase.from("signatures").select("signer_name, signed_at").eq("job_id", id).maybeSingle(),
  ]);

  const done = job.status === "finalizata";
  const token = done ? (await supabase.rpc("ensure_job_status_link", { p_job: id })).data : null;
  const link = token ? `${SITE_URL}/status/${token}/raport` : null;
  const back = from === "gata" ? `/mobil/lucrari/${id}/gata` : `/mobil/lucrari/${id}`;
  const items = checklist?.job_checklist_items ?? [];
  const people = job.job_assignments.map((a) => a.profiles?.full_name).filter(Boolean).join(", ");
  const address = job.locations?.address ?? job.clients?.address ?? null;
  const day = job.scheduled_date ? new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${job.scheduled_date}T12:00:00Z`)) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="m-hd">
        <Link href={back} aria-label="Înapoi" className="m-ib sm">
          <ChevronRight className="m-i" style={{ transform: "rotate(180deg)" }} />
        </Link>
        <div className="m-fl" style={{ textAlign: "center" }}>
          <div className="m-lb">Raport lucrare #{job.display_number}</div>
        </div>
        <span className={`m-pl ${done ? "ok" : ""}`}>{JOB_STATUS_LABELS[job.status]}</span>
      </header>

      <div className="m-bd">
        <Link href={`/mobil/lucrari/${id}/raport/pdf${from === "gata" ? "?from=gata" : ""}`} className="m-btn" style={{ flexShrink: 0 }}><Eye className="m-i" /> Deschide PDF-ul</Link>
        <div className="m-cd m-col" style={{ gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Trimite raportul clientului</div>
            <div className="m-mu m-sm">Clientul primește un link la raportul PDF; îl deschide pe telefon sau pe calculator, fără cont.</div>
          </div>
          {link ? (
            <ShareReport
              text={reportMessage({ company: organization.name, number: job.display_number, title: job.title, link })}
              link={link}
              pdfUrl={`/api/rapoarte-lucrare/${id}`}
              fileName={`raport-lucrare-${job.display_number}.pdf`}
              phone={job.clients?.phone ?? null}
              email={job.clients?.email ?? null}
              preferred={job.clients?.preferred_channel ?? null}
              subject={`Raport lucrare #${job.display_number} · ${organization.name}`}
            />
          ) : (
            <div className="m-mu m-sm" style={{ fontWeight: 700 }}>Raportul se poate trimite după ce lucrarea e finalizată.</div>
          )}
        </div>
        <div className="m-cd m-col" style={{ gap: 10 }}>
          <div className="m-r" style={{ gap: 10 }}>
            <span className="m-ic"><FileText className="m-i" /></span>
            <div className="m-fl">
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{job.title}</div>
              <div className="m-mu m-sm">{organization.name} · Raport de intervenție</div>
            </div>
          </div>
          <hr className="m-sep" />
          <Row label="Client" value={job.clients?.name ?? "—"} />
          <Row label="Adresă" value={address ?? "—"} />
          <Row label="Data" value={day ?? "—"} />
          <Row label="Tehnicieni" value={people || "—"} />
          <hr className="m-sep" />
          <div className="m-lb">Checklist</div>
          {items.length > 0 ? (
            <ul className="m-col" style={{ gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
              {items.map((it) => (
                <li key={it.label} className="m-r" style={{ gap: 8, alignItems: "flex-start", fontSize: 14 }}>
                  <span className={`m-pl ${it.is_checked ? "ok" : "wr"}`} style={{ padding: "2px 8px" }}>{it.is_checked ? "Da" : "Nu"}</span>
                  <span className="m-fl">{it.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="m-mu m-sm">Fără checklist completat.</div>
          )}
          <hr className="m-sep" />
          <Row label="Fotografii" value={`${photoCount ?? 0}`} />
          <Row label="Semnătură client" value={signature ? `${signature.signer_name}, ${new Date(signature.signed_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Lipsește"} />
        </div>

      </div>

      <div className="m-ft">
        <Link href={back} className="m-bt2">Înapoi</Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="m-r" style={{ gap: 12, alignItems: "flex-start" }}>
      <span className="m-mu m-sm" style={{ width: 96, flexShrink: 0 }}>{label}</span>
      <span className="m-fl" style={{ fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
