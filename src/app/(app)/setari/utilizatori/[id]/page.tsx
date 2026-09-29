import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addUserDocument, deleteUserDocument } from "./actions";
import { AccountForm } from "./account-form";

export default async function UserDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const [{ data: profile }, { data: email }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase.rpc("company_admin_get_employee_email", { target_profile_id: id }),
  ]);
  if (!profile) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, doc_type, storage_path, created_at")
    .eq("profile_id", id)
    .order("created_at", { ascending: false });

  const publicUrl = (path: string) => supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;

  return (
    <div className="mx-auto max-w-[720px] px-8 py-8">
      <Link href="/setari?tab=utilizatori" className="mb-4 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi la Utilizatori
      </Link>

      <h1 className="text-[19px] font-extrabold text-foreground">{profile.full_name}</h1>
      <div className="mt-0.5 text-[13px] text-muted-2">{ROLE_LABELS[profile.role]}</div>

      <AccountForm profileId={profile.id} email={email ?? ""} />

      <div className="mt-6 rounded-[13px] border border-border bg-white p-5">
        <h2 className="text-[14.5px] font-bold text-foreground">Documente</h2>
        <p className="mb-3.5 mt-0.5 text-[12px] text-muted-2">
          Contract de muncă, carte de identitate, certificări/autorizații — vizibile și pentru el în aplicația
          mobilă, la Profil → Documentele mele.
        </p>
        {documents && documents.length > 0 ? (
          <div className="flex flex-col divide-y divide-[#f2f4f7]">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <a href={publicUrl(doc.storage_path)} target="_blank" rel="noreferrer" className="truncate text-[13px] font-semibold text-electric">
                    {doc.name}
                  </a>
                  <div className="text-[11.5px] text-muted-2">{doc.doc_type ?? "Document"}</div>
                </div>
                <form action={deleteUserDocument}>
                  <input type="hidden" name="documentId" value={doc.id} />
                  <input type="hidden" name="storagePath" value={doc.storage_path} />
                  <input type="hidden" name="profileId" value={profile.id} />
                  <button type="submit" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger" aria-label="Șterge documentul">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">Niciun document încă.</p>
        )}
        <form action={addUserDocument} className="mt-4 flex items-center gap-2 border-t border-[#f2f4f7] pt-4">
          <input type="hidden" name="profileId" value={profile.id} />
          <input name="docType" placeholder="Tip (opțional)" className="w-40 rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric" />
          <input name="file" type="file" required className="flex-1 text-[13px]" />
          <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]">
            <Plus className="h-3.5 w-3.5" /> Încarcă
          </button>
        </form>
      </div>
    </div>
  );
}
