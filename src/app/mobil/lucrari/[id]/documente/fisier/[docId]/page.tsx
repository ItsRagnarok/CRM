import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrl } from "@/lib/storage";
import { ZoomBox } from "@/components/zoom-box";
import { PdfViewer } from "../../../raport/pdf/pdf-viewer";
import { DocScreen } from "../../doc-screen";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE = /\.(jpe?g|png|webp|gif|heic)$/i;

/** Un fișier încărcat la lucrare (PDF sau poză), văzut în aplicație cu zoom și „Înapoi”. */
export default async function MobileJobFilePage({ params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  if (!UUID.test(docId)) notFound();
  const { organization } = await requireSessionContext();
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, name, storage_path")
    .eq("id", docId)
    .eq("job_id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!doc) notFound();
  const url = await signedAttachmentUrl(supabase, doc.storage_path);
  const isPdf = /\.pdf$/i.test(doc.storage_path) || /\.pdf$/i.test(doc.name);
  const isImage = IMAGE.test(doc.storage_path) || IMAGE.test(doc.name);

  return (
    <DocScreen jobId={id} title={doc.name}>
      {!url ? (
        <div className="m-bd"><div className="m-cd m-sm" style={{ fontWeight: 700 }}>Fișierul nu s-a putut deschide. Încearcă din nou.</div></div>
      ) : isPdf ? (
        <PdfViewer url={url} />
      ) : isImage ? (
        <ZoomBox width={800}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={doc.name} style={{ display: "block", width: "100%", height: "auto", borderRadius: 6 }} />
        </ZoomBox>
      ) : (
        <div className="m-bd">
          <div className="m-cd m-col" style={{ gap: 10 }}>
            <div style={{ fontWeight: 800 }}>{doc.name}</div>
            <div className="m-mu m-sm">Fișierul nu e PDF sau poză, așa că nu se poate arăta în aplicație. Îl poți deschide de pe calculator, din platformă.</div>
          </div>
        </div>
      )}
    </DocScreen>
  );
}
