import { NextRequest } from "next/server";
import { requireMailAdmin, getMailCredentials } from "@/lib/mail/store";
import { mailboxAttachment } from "@/lib/mail/protocol";
import { MailError, reference, safeMailError } from "@/lib/mail/validation";
import type { MailFolder } from "@/lib/mail/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  await requireMailAdmin();
  try {
    const p = request.nextUrl.searchParams;
    const ref = reference({ accountId: p.get("accountId") || "", folder: p.get("folder") as MailFolder, uid: Number(p.get("uid")), uidValidity: p.get("uidValidity") || "" });
    const index = Number(p.get("index"));
    if (!Number.isInteger(index) || index < 0 || index > 1000) throw new MailError("Atașament invalid.");
    const attachment = await mailboxAttachment(await getMailCredentials(ref.accountId), ref, index);
    const name = attachment.name.replace(/[\r\n\x00-\x1f\x7f/\\]/g, "_");
    return new Response(new Uint8Array(attachment.content), { headers: {
      "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)}`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'",
    } });
  } catch (error) { return Response.json({ error: safeMailError(error) }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
}
