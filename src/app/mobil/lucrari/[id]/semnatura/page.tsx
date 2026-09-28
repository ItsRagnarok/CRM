import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignaturePad } from "./signature-pad";

export default async function MobileSignaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, display_number, client:clients(name)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: existing } = await supabase
    .from("signatures")
    .select("id, signer_name, storage_path")
    .eq("job_id", id)
    .maybeSingle();

  if (existing) {
    const publicUrl = supabase.storage.from("attachments").getPublicUrl(existing.storage_path).data.publicUrl;
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
          <Link
            href={`/mobil/lucrari/${id}`}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
          >
            <ArrowLeft className="h-4 w-4 text-[#344054]" />
          </Link>
          <div className="text-[15px] font-extrabold">Semnătură — #{job.display_number}</div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-[14px] border border-[#eaecf0] bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicUrl} alt="Semnătură" className="h-[140px] w-[280px] object-contain" />
          </div>
          <div className="text-[13.5px] font-semibold text-[#344054]">
            Semnat de {existing.signer_name}
          </div>
          <Link
            href={`/mobil/lucrari/${id}`}
            className="mt-2 rounded-[12px] bg-electric px-6 py-3 text-[14px] font-extrabold text-white"
          >
            ÎNAPOI LA LUCRARE
          </Link>
        </div>
      </div>
    );
  }

  const client = job.client as unknown as { name: string } | null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#eaecf0] px-4 py-2.5">
        <Link
          href={`/mobil/lucrari/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <div className="text-[15px] font-extrabold">Semnătură de recepție — #{job.display_number}</div>
      </div>

      <SignaturePad jobId={id} defaultName={client?.name ?? ""} />
    </div>
  );
}
