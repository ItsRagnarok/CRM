"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireMailAdmin, mailStore, getMailCredentials, listMailAccounts } from "@/lib/mail/store";
import { deliverMessage, listMailbox, mutateMailboxMessage, readMailboxMessage, verifyMailbox } from "@/lib/mail/protocol";
import { accountId, composeInput, mailFolder, MailError, reference, safeMailError, validateCredentials } from "@/lib/mail/validation";
import type { MailReference, MailResult } from "@/lib/mail/types";

async function run<T>(work: () => Promise<T>): Promise<MailResult<T>> {
  // Authentication redirects must retain Next's redirect semantics.
  await requireMailAdmin();
  try { return { data: await work() }; } catch (error) { return { error: safeMailError(error) }; }
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
export async function submitMail(input: { accountId: string; to: string; subject: string; body: string; deliveryId: string; reply?: MailReference; draftRef?: MailReference }, draft: boolean) {
  return run(async () => {
    const id = accountId(input.accountId), deliveryId = accountId(input.deliveryId), content = composeInput(input, draft === true);
    const settings = await getMailCredentials(id);
    const reply = input.reply ? reference(input.reply) : null;
    if (reply && reply.accountId !== id) throw new MailError("Răspunsul trebuie trimis de pe adresa care a primit mesajul.");
    const draftRef = input.draftRef ? reference(input.draftRef) : null;
    if (draftRef && (draftRef.accountId !== id || draftRef.folder !== "draft")) throw new MailError("Ciorna aparține altei adrese.");
    const original = reply ? await readMailboxMessage(settings, reply) : null;
    if (!draft) {
      const fingerprint = createHash("sha256").update(JSON.stringify({ id, ...content })).digest("hex");
      const claim = await mailStore<{ claimed: boolean; status?: string }>("claim_send", id, { deliveryId, fingerprint });
      if (!claim.claimed) {
        if (claim.status === "accepted") return { warning: "Acest mesaj a fost deja acceptat de serverul SMTP. Nu a fost retrimis." };
        throw new MailError("Trimiterea a fost deja inițiată. Verifică dosarul Trimise și webmailul înainte de a crea un mesaj nou.");
      }
    }
    let result;
    try {
      result = await deliverMessage(settings, { ...content, messageId: `<${deliveryId}@${settings.address.split("@")[1]}>`,
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
