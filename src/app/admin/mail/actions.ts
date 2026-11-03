"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireMailAdmin, mailStore, getMailCredentials, listMailAccounts } from "@/lib/mail/store";
import { deliverMessage, listMailbox, mailboxAttachments, mailboxSendFolders, mutateMailboxMessage, readMailboxMessage, verifyMailbox } from "@/lib/mail/protocol";
import { accountId, composeInput, composeOptions, mailFolder, MailError, reference, safeMailError, uploadManifest, validateCredentials } from "@/lib/mail/validation";
import { MAIL_UPLOAD_BUCKET, MAX_ATTACHMENTS_BYTES, type MailComposeInput, type MailReference, type MailResult } from "@/lib/mail/types";
import { createClient } from "@/lib/supabase/server";

async function run<T>(work: (admin: Awaited<ReturnType<typeof requireMailAdmin>>) => Promise<T>): Promise<MailResult<T>> {
  // Authentication redirects must retain Next's redirect semantics.
  const admin = await requireMailAdmin();
  try { return { data: await work(admin) }; } catch (error) { return { error: safeMailError(error) }; }
}
export async function configureMailAccount(input: unknown, id: string | null, save: boolean) {
  return run(async () => {
    if (id) accountId(id);
    await mailStore("check");
    const settings = validateCredentials(input, id ? await getMailCredentials(id) : undefined);
    await verifyMailbox(settings);
    if (save) {
      await mailStore("save", id ?? undefined, settings);
      revalidatePath("/admin/mail");
    }
    return { accounts: await listMailAccounts(), message: save ? "Adresă conectată. IMAP și SMTP au fost verificate." : "Conexiunile IMAP și SMTP sunt valide. Poți salva adresa." };
  });
}
export async function disconnectMailAccount(id: string) {
  return run(async () => { await mailStore("delete", accountId(id)); revalidatePath("/admin/mail"); return await listMailAccounts(); });
}
export async function fetchMailFolder(id: string, folder: string, page = 0) {
  return run(async () => {
    accountId(id); mailFolder(folder);
    if (!Number.isInteger(page) || page < 0 || page > 1000) throw new MailError("Pagina de mesaje este invalidă.");
    return listMailbox(await getMailCredentials(id), id, mailFolder(folder), page);
  });
}
export async function fetchMailFolders(ids: string[], folder: string, page = 0) {
  return run(async () => {
    if (!Array.isArray(ids) || ids.length > 20) throw new MailError("Lista adreselor este invalidă.");
    ids.forEach(accountId); const validFolder = mailFolder(folder);
    if (!Number.isInteger(page) || page < 0 || page > 1000) throw new MailError("Pagina de mesaje este invalidă.");
    // A slow/unreachable account must not serialize every other mailbox request.
    return Promise.all([...new Set(ids)].map(async (id) => {
      try { return { accountId: id, data: await listMailbox(await getMailCredentials(id), id, validFolder, page) }; }
      catch (error) { return { accountId: id, error: safeMailError(error) }; }
    }));
  });
}
export async function fetchMailMessage(ref: MailReference) {
  return run(async () => { const valid = reference(ref); return readMailboxMessage(await getMailCredentials(valid.accountId), valid); });
}
export async function changeMailMessage(ref: MailReference, action: "unread" | "trash") {
  return run(async () => {
    const valid = reference(ref);
    if (action !== "unread" && action !== "trash") throw new MailError("Operație invalidă.");
    await mutateMailboxMessage(await getMailCredentials(valid.accountId), valid, action);
    return true;
  });
}
export async function fetchMailSendFolders(id: string) {
  return run(async () => mailboxSendFolders(await getMailCredentials(accountId(id))));
}
export async function cleanupMailUploads() {
  return run(async ({ userId }) => {
    const client = await createClient();
    const { data } = await client.storage.from(MAIL_UPLOAD_BUCKET).list(userId, { limit: 100, sortBy: { column: "created_at", order: "asc" } });
    const expired = (data ?? []).filter((f) => f.created_at && new Date(f.created_at).getTime() < Date.now() - 24 * 3600_000).map((f) => `${userId}/${f.name}`);
    if (expired.length) await client.storage.from(MAIL_UPLOAD_BUCKET).remove(expired);
    return true;
  });
}
export async function submitMail(input: MailComposeInput, draft: boolean) {
  return run(async ({ userId }) => {
    if (typeof draft !== "boolean") throw new MailError("Operație de compunere invalidă.");
    const id = accountId(input.accountId), deliveryId = accountId(input.deliveryId);
    const content = { ...composeInput(input, draft, true), ...composeOptions(input) };
    const recipients = [content.to, content.cc, content.bcc].flatMap((v) => v.split(",").map((a) => a.trim()).filter(Boolean));
    if ((!draft && !recipients.length) || recipients.length > 50) throw new MailError("Alege cel puțin un destinatar; sunt permise cel mult 50 de adrese în total.");
    const uploads = uploadManifest(input.uploads ?? [], userId);
    const source = input.attachmentSource ? reference(input.attachmentSource) : null;
    const retained = input.existingAttachments ?? [];
    if (!Array.isArray(retained) || retained.length + uploads.length > 20 || retained.some((a) => !Number.isSafeInteger(a.index) || a.index < 0 || a.index > 1000) || new Set(retained.map((a) => a.index)).size !== retained.length || (retained.length && !source)) throw new MailError("Lista atașamentelor originale este invalidă.");
    const settings = await getMailCredentials(id);
    const reply = input.reply ? reference(input.reply) : null;
    if (reply && reply.accountId !== id) throw new MailError("Răspunsul trebuie trimis de pe adresa care a primit mesajul.");
    const draftRef = input.draftRef ? reference(input.draftRef) : null;
    if (draftRef && (draftRef.accountId !== id || draftRef.folder !== "draft")) throw new MailError("Ciorna aparține altei adrese.");
    const original = reply ? await readMailboxMessage(settings, reply) : null;
    if (!draft && content.saveSent && content.sentFolder && !(await mailboxSendFolders(settings)).includes(content.sentFolder)) throw new MailError("Dosarul ales pentru copia trimisă nu mai există. Alege alt dosar.");
    if (!draft) {
      const fingerprint = createHash("sha256").update(JSON.stringify({ id, ...content, uploads, source, reply, draftRef, retained: retained.map((a) => a.index) })).digest("hex");
      const claim = await mailStore<{ claimed: boolean; status?: string }>("claim_send", id, { deliveryId, fingerprint });
      if (!claim.claimed) {
        if (claim.status === "accepted") return { warning: "Acest mesaj a fost deja acceptat de serverul SMTP. Nu a fost retrimis." };
        throw new MailError("Trimiterea a fost deja inițiată. Verifică dosarul Trimise și webmailul înainte de a crea un mesaj nou.");
      }
    }
    let result;
    try {
      const storage = (await createClient()).storage.from(MAIL_UPLOAD_BUCKET);
      const attachments = source && retained.length ? await mailboxAttachments(await getMailCredentials(source.accountId), source, retained.map((a) => a.index)) : [];
      let total = attachments.reduce((sum, a) => sum + a.content.length, 0);
      for (const upload of uploads) {
        const { data, error } = await storage.download(upload.path);
        if (error || !data) throw new MailError("Un atașament încărcat nu mai este disponibil. Atașează-l din nou.");
        if (data.size !== upload.size) throw new MailError("Dimensiunea unui atașament s-a schimbat. Atașează-l din nou.");
        total += data.size;
        if (total > MAX_ATTACHMENTS_BYTES) throw new MailError("Atașamentele pot avea cel mult 15 MB în total.");
        attachments.push({ filename: upload.name, content: Buffer.from(await data.arrayBuffer()) });
      }
      if (total > MAX_ATTACHMENTS_BYTES) throw new MailError("Atașamentele pot avea cel mult 15 MB în total.");
      result = await deliverMessage(settings, { ...content, messageId: `<${deliveryId}@${settings.address.split("@")[1]}>`,
        attachments,
        inReplyTo: original?.messageId, references: original ? [...(original.references ?? []), ...(original.messageId ? [original.messageId] : [])] : undefined }, draft);
    } catch (error) {
      if (draft) throw error;
      await mailStore("finish_send", id, { deliveryId, status: "unknown" }).catch(() => {});
      throw new MailError(`${safeMailError(error)} Trimiterea nu este confirmată; verifică în webmail înainte să retrimiți.`);
    }
    if (!draft) await mailStore("finish_send", id, { deliveryId, status: "accepted" }).catch(() => {});
    if (draftRef) {
      try { await mutateMailboxMessage(settings, draftRef, "trash"); }
      catch { result.warning += " Ciorna anterioară nu a putut fi mutată în Coș."; }
    }
    return result;
  });
}
