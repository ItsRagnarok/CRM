import type { Metadata } from "next";
import { requireAdminContext } from "@/lib/auth";
import { MailWorkspace } from "./mail-workspace";
import { listMailAccounts } from "@/lib/mail/store";

export const metadata: Metadata = { title: "Mail — Super Admin ElectroField" };
export const runtime = "nodejs";
export const maxDuration = 60;

export default async function AdminMailPage() {
  // Keep this gate on the page as well as the admin layout. Tenant admin is
  // deliberately insufficient: platform_admins membership is required.
  await requireAdminContext();
  return <MailWorkspace initialAccounts={await listMailAccounts()} />;
}
