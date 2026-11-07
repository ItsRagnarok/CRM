"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth";
import { notificationHref } from "@/lib/notification-ui";

// Tapping a notification both marks it read and goes where it points.
export async function openNotification(id: string) {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();

  const { data: n } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("profile_id", profile.id)
    .select("link, related_job_id")
    .maybeSingle();

  revalidatePath("/mobil");
  revalidatePath("/mobil/notificari");
  redirect((n && notificationHref(n, "mobile")) || "/mobil/notificari");
}

export async function markAllNotificationsReadMobile() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("profile_id", profile.id).eq("is_read", false);
  revalidatePath("/mobil");
  revalidatePath("/mobil/notificari");
}
