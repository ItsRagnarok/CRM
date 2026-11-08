import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { CopyField } from "@/components/copy-field";
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

  return (
    <div className="rounded-[13px] border border-border bg-white p-5">
      <h3 className="text-[14px] font-bold">Status pentru client</h3>
      <p className="mt-1 text-[12.5px] text-muted">Un link pe care clientul îl deschide fără cont și vede stadiul lucrării. Nu vede prețuri, note interne sau alte lucrări. Expiră în 90 de zile.</p>
      {link ? (
        <div className="mt-3 space-y-2">
          <CopyField value={`${SITE_URL}/status/${link.token}`} />
          <p className="text-xs text-muted">Valabil până la {new Date(link.expires_at).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" })}. Cine are linkul îl poate deschide.</p>
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
