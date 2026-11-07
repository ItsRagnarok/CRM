import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Home } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MobileJobDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const [{ data: job }, { data: billing }, { count: signatures }] = await Promise.all([
    supabase.from("jobs").select("id, display_number, title, work_ended_at").eq("id", id).eq("organization_id", organization.id).maybeSingle(),
    supabase.from("billing_requests").select("id, collected_method, collected_amount").eq("job_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("signatures").select("id", { count: "exact", head: true }).eq("job_id", id),
  ]);
  if (!job) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="m-bd" style={{ justifyContent: "center" }}>
        <div className="m-empty" style={{ flex: "none" }}>
          <div className="m-ill"><CheckCircle2 className="m-i" strokeWidth={1.5} /></div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Lucrare închisă</div>
          <div className="m-mu" style={{ fontSize: 15 }}>#{job.display_number} · {job.title}</div>
        </div>
        <div className="m-list">
          <div className="m-row"><span className="m-fl m-mu">Semnătură client</span><span className={`m-pl ${signatures ? "ok" : "wr"}`}>{signatures ? "Semnată" : "Lipsește"}</span></div>
          <hr className="m-sep" />
          <div className="m-row">
            <span className="m-fl m-mu">Facturare</span>
            <span className={`m-pl ${billing ? "ok" : ""}`}>{billing ? "Trimisă la birou" : "Netrimisă"}</span>
          </div>
          <hr className="m-sep" />
          {billing?.collected_amount ? (
            <>
              <div className="m-row"><span className="m-fl m-mu">Încasat</span><b>{Number(billing.collected_amount).toFixed(2)} lei · {billing.collected_method}</b></div>
              <hr className="m-sep" />
            </>
          ) : null}
        </div>
        <a href={`/api/rapoarte-lucrare/${id}`} target="_blank" rel="noreferrer" className="m-bt2"><FileText className="m-i" /> Raport lucrare (PDF)</a>
      </div>
      <div className="m-ft">
        <Link href="/mobil" className="m-btn"><Home className="m-i" /> Înapoi acasă</Link>
      </div>
    </div>
  );
}
