import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PhotoCapture } from "./photo-capture";

// The photo screen is entered from one fixed place in the flow each time
// (arrival, mid-work, or finalization) — it's locked to that context rather
// than letting the technician freely switch categories, so he always knows
// exactly what he's supposed to be photographing.
const CATEGORY_INFO: Record<string, { title: string; caption: string; continueLabel: string }> = {
  before: {
    title: "Poze la sosire",
    caption: "Fă o poză la locul unde lucrezi — panoul electric, tabloul sau zona respectivă — înainte să începi.",
    continueLabel: "CONTINUĂ",
  },
  during: {
    title: "Poze în timpul lucrării",
    caption: "Adaugă poze din timpul lucrării, dacă e nevoie (opțional).",
    continueLabel: "ÎNAPOI LA LUCRARE",
  },
  after: {
    title: "Poze la finalizarea lucrării",
    caption: "Fă poza cu lucrarea finalizată (ex: rețeaua montată, tabloul montat).",
    continueLabel: "CONTINUĂ",
  },
};

function continueHref(id: string, category: string) {
  return category === "after" ? `/mobil/lucrari/${id}/finalizare` : `/mobil/lucrari/${id}`;
}

export default async function MobilePhotoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;
  const category = CATEGORY_INFO[cat ?? ""] ? cat! : "before";
  const info = CATEGORY_INFO[category];
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("job_id", id)
    .eq("category", category)
    .order("taken_at", { ascending: false });

  const publicUrl = (path: string) => supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;

  return (
    <div className="flex h-full flex-col bg-[#0b1530]">
      <div className="flex flex-shrink-0 items-center gap-3 px-4 py-2.5">
        <Link
          href={`/mobil/lucrari/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <div>
          <div className="text-[15px] font-extrabold text-white">{info.title}</div>
          <div className="text-[11px] text-white/60">Lucrare #{job.display_number}</div>
        </div>
      </div>

      <div className="mx-4 mt-2 rounded-[10px] bg-white/10 px-3.5 py-2.5 text-[12px] leading-snug text-white/80">
        {info.caption}
      </div>

      <div className="flex-1 overflow-auto px-4 pb-2 pt-4">
        <div className="mb-2 text-[12px] font-semibold text-white/70">CAPTURATE ({photos?.length ?? 0})</div>
        <div className="grid grid-cols-4 gap-2.5">
          {(photos ?? []).map((p) => (
            <a key={p.id} href={publicUrl(p.storage_path)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl(p.storage_path)} alt="" className="aspect-square w-full rounded-[10px] object-cover" />
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-center gap-10 px-4 pt-2">
        <PhotoCapture jobId={id} category={category} />
      </div>

      <div className="flex-shrink-0 px-4 pb-8 pt-4">
        <Link
          href={continueHref(id, category)}
          className="block rounded-[12px] bg-electric py-[14px] text-center text-[14.5px] font-extrabold text-white"
        >
          {info.continueLabel}
        </Link>
      </div>
    </div>
  );
}
