import type { Metadata } from "next";
import { requireAdminContext } from "@/lib/auth";
import { MailWorkspace } from "./mail-workspace";

export const metadata: Metadata = { title: "Mail — Super Admin ElectroField" };

export default async function AdminMailPage() {
  // Keep this gate on the page as well as the admin layout. Tenant admin is
  // deliberately insufficient: platform_admins membership is required.
  await requireAdminContext();
  return <MailWorkspace />;
}
