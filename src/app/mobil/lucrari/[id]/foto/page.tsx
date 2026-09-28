import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PhotoCapture } from "./photo-capture";

const CATEGORIES = [
  { value: "before", label: "ÎNAINTE" },
  { value: "during", label: "ÎN TIMPUL LUCRĂRII" },
  { value: "after", label: "DUPĂ" },
];

export default async function MobilePhotoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;
  const category = CATEGORIES.some((c) => c.value === cat) ? cat! : "before";
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
        <div className="text-[15px] font-extrabold text-white">Fotografii lucrare #{job.display_number}</div>
      </div>

      <div className="flex flex-shrink-0 gap-2 px-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/mobil/lucrari/${id}/foto?cat=${c.value}`}
            className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold ${
              category === c.value ? "bg-electric text-white" : "bg-white/10 text-white/70"
            }`}
          >
            {c.label}
          </Link>
        ))}
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

      <div className="flex flex-shrink-0 items-center justify-center gap-10 px-4 pb-8 pt-2">
        <PhotoCapture jobId={id} category={category} />
      </div>
    </div>
  );
}
