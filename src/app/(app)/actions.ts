"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function endSession() {
  const supabase = await createClient();
  await supabase.rpc("ef_close_usage");
  await supabase.auth.signOut();
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

/** Sign-out from the phone app: lands on the app's own login screen. */
export async function signOutMobile() {
  await endSession();
  redirect("/mobil-login");
}
