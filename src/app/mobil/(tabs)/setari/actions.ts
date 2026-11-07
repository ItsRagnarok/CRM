"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Display modes are per-device preferences, so they live in a cookie (read in
// the mobile layout) rather than in the profile.
export async function setDisplayMode(mode: "sun" | "gloves", on: boolean) {
  const store = await cookies();
  store.set(mode === "sun" ? "ef_sun" : "ef_gloves", on ? "1" : "0", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/mobil", "layout");
}
