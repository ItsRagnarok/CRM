import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { CopyField } from "@/components/copy-field";
import { ClientMessage } from "@/components/client-message";
import { confirmationMessage, onTheWayMessage, arrivalWindow } from "@/lib/client-messages";
import { createStatusLink, revokeStatusLink } from "@/app/(app)/lucrari/[id]/status-link-actions";

// Office-only card on a job: a link the customer can open without an account.
export async function StatusLinkCard({ jobId, organizationId, canEdit }: { jobId: string; organizationId: string; canEdit: boolean }) {
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("job_status_links")
    .select("token, expires_at")
    .eq("job_id", jobId)
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const [{ data: job }, { data: org }] = await Promise.all([
    supabase.from("jobs").select("title, status, scheduled_date, start_time, clients(phone)").eq("id", jobId).maybeSingle(),
    supabase.from("organizations").select("name, arrival_window_minutes").eq("id", organizationId).maybeSingle(),
  ]);
  const url = link ? `${SITE_URL}/status/${link.token}` : null;
  const minutes = org?.arrival_window_minutes ?? 120;
  const w = arrivalWindow(job?.start_time, minutes);
  const showMessages = url && job && !["finalizata", "anulata"].includes(job.status);

  return (
    <div className="rounded-[13px] border border-border bg-white p-5">
      <h3 className="text-[14px] font-bold">Status pentru client</h3>
      <p className="mt-1 text-[12.5px] text-muted">Un link pe care clientul îl deschide fără cont: vede fereastra de sosire{w ? ` (${w.from}–${w.to})` : ""}, când pleacă echipa, cine vine, iar la final pozele înainte/după, documentele bifate „Pentru client” și confirmarea. Nu vede prețuri, note interne sau alte lucrări. Expiră în 90 de zile.</p>
      {link ? (
        <div className="mt-3 space-y-2">
          <CopyField value={url!} />
          <p className="text-xs text-muted">Valabil până la {new Date(link.expires_at).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" })}. Cine are linkul îl poate deschide.</p>
          {showMessages && (
            <details className="rounded-[10px] border border-border p-3">
              <summary className="cursor-pointer text-[13px] font-bold">Mesaje gata de trimis clientului</summary>
              <div className="mt-3 flex flex-col gap-4">
                {job.status === "programata" && <ClientMessage title="Confirmarea programării" text={confirmationMessage({ company: org?.name ?? "", date: job.scheduled_date, start: job.start_time, windowMinutes: minutes, link: url!, title: job.title.split(/\s[—–-]\s/)[0] })} phone={job.clients?.phone} />}
                <ClientMessage title="Echipa e pe drum" text={onTheWayMessage({ company: org?.name ?? "", techName: null, link: url! })} phone={job.clients?.phone} />
                <p className="text-[11.5px] text-muted">Tehnicianul are același mesaj în aplicație când pornește spre client, cu numele lui.</p>
              </div>
            </details>
          )}
          {canEdit && (
            <div className="flex gap-2">
              <form action={createStatusLink}><input type="hidden" name="jobId" value={jobId} /><button className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold">Link nou (cel vechi nu mai merge)</button></form>
              <form action={revokeStatusLink}><input type="hidden" name="jobId" value={jobId} /><button className="rounded-lg border border-danger/40 px-3 py-1.5 text-[12.5px] font-semibold text-danger">Dezactivează</button></form>
            </div>
          )}
        </div>
      ) : canEdit ? (
        <form action={createStatusLink} className="mt-3"><input type="hidden" name="jobId" value={jobId} /><button className="rounded-[10px] bg-electric px-4 py-2 text-[13px] font-bold">Creează linkul</button></form>
      ) : null}
    </div>
  );
}
