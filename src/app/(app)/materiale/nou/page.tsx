import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewMaterialForm } from "./new-material-form";

export default async function NewMaterialPage() {
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: materials } = await supabase
    .from("materials")
    .select("category")
    .eq("organization_id", organization.id);

  const categories = Array.from(
    new Set((materials ?? []).map((m) => m.category).filter((c): c is string => Boolean(c)))
  ).sort();

  return <NewMaterialForm categories={categories} />;
}
