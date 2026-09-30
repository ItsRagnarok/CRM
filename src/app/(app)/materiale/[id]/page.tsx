import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrl } from "@/lib/storage";
import { MaterialEditForm } from "./material-edit-form";

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("materials")
    .select("id, name, category, unit, min_stock, kind, image_path")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!material) notFound();

  const imageUrl = material.image_path ? await signedAttachmentUrl(supabase, material.image_path) : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link href="/materiale" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">{material.name}</h1>
      </div>

      <MaterialEditForm
        material={{ ...material, kind: material.kind === "tool" ? "tool" : "material" }}
        imageUrl={imageUrl}
      />
    </div>
  );
}
