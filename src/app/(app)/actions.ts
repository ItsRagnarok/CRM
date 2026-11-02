"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.rpc("ef_close_usage");
  await supabase.auth.signOut();
  redirect("/login");
}
