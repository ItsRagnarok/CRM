import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrls } from "@/lib/storage";
import { todayInOrgTimeZone } from "@/lib/date";
import { EmptyScreen, ScreenHeader } from "@/components/mobile/ui";

const SOON_DAYS = 60;

function daysUntil(date: string, today: string) {
  return Math.round((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000);
}

export default async function MobileDocumentsPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, doc_type, storage_path, created_at, expires_at")
    .eq("profile_id", profile.id)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const urls = await signedAttachmentUrls(supabase, (documents ?? []).map((d) => d.storage_path));
  const docs = documents ?? [];
  const withExpiry = docs.filter((d) => d.expires_at);
  const others = docs.filter((d) => !d.expires_at);
  const expiring = withExpiry.filter((d) => daysUntil(d.expires_at!, today) <= SOON_DAYS);
  const worst = expiring.sort((a, b) => a.expires_at!.localeCompare(b.expires_at!))[0];

  const row = (doc: (typeof docs)[number]) => {
    const left = doc.expires_at ? daysUntil(doc.expires_at, today) : null;
    return (
      <div key={doc.id}>
        <a href={urls.get(doc.storage_path) ?? "#"} target="_blank" rel="noreferrer" className="m-row">
          <span className={`m-ic sm ${left != null && left < 0 ? "bad" : left != null && left <= SOON_DAYS ? "w" : ""}`}>
            {doc.expires_at ? <ShieldCheck className="m-i" /> : <FileText className="m-i" />}
          </span>
          <div className="m-fl">
            <div className="t" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
            <div className="d">{doc.doc_type ?? "Document"}</div>
          </div>
          {left != null && (
            <span className={`m-pl ${left < 0 ? "bad" : left <= SOON_DAYS ? "wr" : "ok"}`}>
              {left < 0 ? "Expirat" : new Date(`${doc.expires_at}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
            </span>
          )}
        </a>
        <hr className="m-sep" />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Documente" subtitle="Autorizații, legitimații, documente scanate" back="/mobil/meniu" />
      <div className="m-bd">
        {worst && (
          <div className={`m-note ${daysUntil(worst.expires_at!, today) < 0 ? "bad" : "warn"}`}>
            <span className={`m-ic ${daysUntil(worst.expires_at!, today) < 0 ? "bad" : "w"}`}><AlertTriangle className="m-i" /></span>
            <div className="m-fl">
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>
                {worst.name} {daysUntil(worst.expires_at!, today) < 0 ? "a expirat" : `expiră în ${daysUntil(worst.expires_at!, today)} zile`}
              </div>
              <div className="m-sm" style={{ marginTop: 2 }}>Anunță biroul ca să o reînnoiască din timp.</div>
            </div>
          </div>
        )}
        {docs.length === 0 ? (
          <div className="m-cd" style={{ padding: 0 }}>
            <EmptyScreen icon={FileText} title="Niciun document">
              Legitimațiile și autorizațiile încărcate de firmă apar aici. Poți scana și tu documente din butonul Scanează.
            </EmptyScreen>
          </div>
        ) : (
          <>
            {withExpiry.length > 0 && (
              <>
                <div className="m-lb">Autorizații și valabilitate</div>
                <div className="m-list">{withExpiry.map(row)}</div>
              </>
            )}
            {others.length > 0 && (
              <>
                <div className="m-lb">Alte documente</div>
                <div className="m-list">{others.map(row)}</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
