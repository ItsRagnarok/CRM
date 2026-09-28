import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export default async function MobileDocumentsPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, doc_type, storage_path, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  const publicUrl = (path: string) => supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link href="/mobil/profil" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div className="text-[15px] font-extrabold">Documentele mele</div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {documents && documents.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={publicUrl(doc.storage_path)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-[12px] border border-[#eaecf0] bg-white p-3.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-electric-soft">
                  <FileText className="h-[18px] w-[18px] text-electric" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold">{doc.name}</div>
                  <div className="text-[11.5px] text-muted-2">{doc.doc_type ?? "Document"}</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Niciun document"
            description="Contractul, certificările sau alte documente pe care ți le încarcă firma vor apărea aici."
          />
        )}
      </div>
    </div>
  );
}
