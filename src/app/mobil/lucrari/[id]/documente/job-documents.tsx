import Link from "next/link";
import { ChevronRight, ClipboardList, FileText, Flame, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES } from "@/lib/forms/templates";

const day = (iso: string) => new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

function Row({ href, icon: Icon, title, detail }: { href: string; icon: typeof FileText; title: string; detail: string }) {
  return (
    <Link href={href} className="m-r" style={{ gap: 12, padding: "10px 0" }}>
      <span className="m-ic sm g"><Icon className="m-i" /></span>
      <div className="m-fl">
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{title}</div>
        <div className="m-mu m-sm">{detail}</div>
      </div>
      <ChevronRight className="m-chev" />
    </Link>
  );
}

/**
 * „Documentele lucrării” pe o lucrare finalizată: raportul, fișele de gaze, formularele tehnice și
 * fișierele încărcate. Fiecare se deschide în aplicație, cu „Înapoi”.
 */
export async function JobDocuments({ jobId }: { jobId: string }) {
  const supabase = await createClient();
  const [{ data: gas }, { data: forms }, { data: files }] = await Promise.all([
    supabase.from("gas_records").select("id, kind, number, year, completed_at, data").eq("job_id", jobId).not("completed_at", "is", null).order("drawn_up_on"),
    supabase.from("job_forms").select("id, template, completed_at").eq("job_id", jobId).not("completed_at", "is", null),
    supabase.from("documents").select("id, name, doc_type, created_at").eq("job_id", jobId).order("created_at"),
  ]);

  return (
    <div className="m-cd" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="m-lb" style={{ margin: "6px 0 2px" }}>Documentele lucrării</div>
      <Row href={`/mobil/lucrari/${jobId}/raport`} icon={FileText} title="Raport de intervenție (PDF)" detail="Vezi PDF-ul și trimite-l clientului" />
      {(gas ?? []).map((r) => {
        const d = (r.data ?? {}) as Record<string, unknown>;
        return (
          <Row
            key={r.id}
            href={`/mobil/lucrari/${jobId}/documente/fisa/${r.id}`}
            icon={Flame}
            title={`Fișă de evidență · ${r.kind === "revizie" ? "revizie" : "verificare"}${r.number ? ` nr. ${r.number}/${r.year}` : ""}`}
            detail={[d.client, d.adresa].filter(Boolean).map(String).join(" · ") || "Ord. ANRE 179/2015"}
          />
        );
      })}
      {(forms ?? []).map((f) => {
        const t = FORM_TEMPLATES[f.template as keyof typeof FORM_TEMPLATES];
        if (!t) return null;
        return <Row key={f.id} href={`/mobil/lucrari/${jobId}/documente/formular/${f.id}`} icon={ClipboardList} title={t.label} detail={`Completat ${day(f.completed_at!)}`} />;
      })}
      {(files ?? []).map((f) => (
        <Row key={f.id} href={`/mobil/lucrari/${jobId}/documente/fisier/${f.id}`} icon={Paperclip} title={f.name} detail={`${f.doc_type ?? "Document"} · ${day(f.created_at)}`} />
      ))}
    </div>
  );
}
