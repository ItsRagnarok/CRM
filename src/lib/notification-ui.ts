import { ORG_TIME_ZONE, todayInOrgTimeZone } from "@/lib/date";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  related_job_id: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationCategory = "mesaje" | "apeluri" | "lucrari";

export function categoryOf(type: string): NotificationCategory | null {
  if (type === "message") return "mesaje";
  if (type === "call_request") return "apeluri";
  if (
    type === "job_assigned" || type === "job_updated" || type === "job_started" ||
    type === "job_alert" || type === "job_finished"
  ) return "lucrari";
  return null;
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  mesaje: "Mesaje",
  apeluri: "Apeluri",
  lucrari: "Lucrări",
};

// Where tapping a notification goes. Stored links win; older rows only carry a
// job id, which opens the screen that matches the device it is shown on.
export function notificationHref(n: Pick<NotificationItem, "link" | "related_job_id">, surface: "mobile" | "platform") {
  if (n.link) return n.link;
  if (n.related_job_id) return surface === "mobile" ? `/mobil/lucrari/${n.related_job_id}` : `/lucrari/${n.related_job_id}`;
  return null;
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "chiar acum";
  if (minutes < 60) return `acum ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `acum ${hours} h`;
  return `acum ${Math.round(hours / 24)} zile`;
}

export function dayGroup(iso: string): "Astăzi" | "Ieri" | "Mai vechi" {
  const day = todayInOrgTimeZone(new Date(iso));
  const today = todayInOrgTimeZone();
  if (day === today) return "Astăzi";
  const yesterday = todayInOrgTimeZone(new Date(Date.now() - 86_400_000));
  return day === yesterday ? "Ieri" : "Mai vechi";
}

export { ORG_TIME_ZONE };
