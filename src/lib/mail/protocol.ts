import dns from "node:dns/promises";
import { ImapFlow, type FetchMessageObject } from "imapflow";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { simpleParser } from "mailparser";
import { MailError, hostname, isPublicAddress, composeOptions } from "./validation";
import { sanitizeEmailHtml } from "./html";
import type { ComposeOptions, MailCredentials, MailFolder, MailMessage, MailReference } from "./types";

const MAX_MESSAGE = 25 * 1024 * 1024;
const SPECIAL: Record<MailFolder, string> = { inbox: "\\Inbox", sent: "\\Sent", draft: "\\Drafts", spam: "\\Junk", trash: "\\Trash" };
const FALLBACK: Record<MailFolder, string[]> = {
  inbox: ["INBOX"], sent: ["Sent", "INBOX.Sent", "Sent Items", "Sent Messages"],
  draft: ["Drafts", "INBOX.Drafts"], spam: ["Junk", "INBOX.Junk", "Spam", "INBOX.spam"], trash: ["Trash", "INBOX.Trash", "Deleted Items"],
};
export async function publicHost(host: string) {
  hostname(host);
  const answers = await dns.lookup(host, { all: true });
  if (!answers.length || answers.some((a) => !isPublicAddress(a.address))) throw new MailError("Serverul de mail trebuie să aibă exclusiv adrese IP publice.");
  // Connect to the checked IP instead of resolving the hostname a second time.
  return answers.find((a) => a.family === 4)?.address ?? answers[0].address;
}
async function imap(settings: MailCredentials) {
  const client = new ImapFlow({ host: await publicHost(settings.incomingHost), port: settings.incomingPort,
    secure: settings.incomingSecurity === "tls", ...(settings.incomingSecurity === "starttls" ? { doSTARTTLS: true } : {}),
    servername: settings.incomingHost, tls: { servername: settings.incomingHost, minVersion: "TLSv1.2", rejectUnauthorized: true },
    auth: { user: settings.username, pass: settings.password }, logger: false, emitLogs: false,
    connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 20000, disableAutoIdle: true });
  // Socket errors must not become unhandled process events or log credentials.
  client.on("error", () => {});
  return client;
}
export async function createMailTransport(settings: MailCredentials) {
  return nodemailer.createTransport({ host: await publicHost(settings.outgoingHost), port: settings.outgoingPort,
    secure: settings.outgoingSecurity === "tls", requireTLS: true,
    tls: { servername: settings.outgoingHost, minVersion: "TLSv1.2", rejectUnauthorized: true },
    auth: { user: settings.outgoingUsername, pass: settings.outgoingPassword },
    connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 20000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
}
export async function withMailbox<T>(settings: MailCredentials, work: (client: ImapFlow) => Promise<T>) {
  const client = await imap(settings);
  const timeout = setTimeout(() => client.close(), 45000);
  try { await client.connect(); return await work(client); }
  finally { clearTimeout(timeout); client.close(); }
}
export async function verifyMailbox(settings: MailCredentials) {
  await withMailbox(settings, async (client) => { await client.mailboxOpen("INBOX", { readOnly: true }); });
  const transport = await createMailTransport(settings);
  try { await transport.verify(); } finally { transport.close(); }
}
async function folderPath(client: ImapFlow, folder: MailFolder, create = false) {
  if (folder === "inbox") return "INBOX";
  const boxes = await client.list();
  const found = boxes.find((b) => b.specialUse === SPECIAL[folder]) ?? boxes.find((b) => FALLBACK[folder].some((n) => n.toLowerCase() === b.path.toLowerCase()));
  if (found) return found.path;
  if (!create) return null;
  const path = FALLBACK[folder][0];
  await client.mailboxCreate(path);
  return path;
}
function date(value?: Date | string) {
  const result = value ? new Date(value) : new Date(0);
  return Number.isNaN(result.getTime()) ? new Date(0).toISOString() : result.toISOString();
}
function summary(row: FetchMessageObject, accountId: string, folder: MailFolder, validity: string): MailMessage {
  const e = row.envelope;
  const outgoing = folder === "sent" || folder === "draft";
  const person = (outgoing ? e?.to : e?.from)?.[0];
  return { id: `${accountId}:${folder}:${validity}:${row.uid}`, accountId, folder, uid: row.uid, uidValidity: validity,
    name: person?.name || person?.address || "Expeditor necunoscut", address: person?.address || "", to: e?.to?.map((p) => p.address).filter(Boolean).join(", ") || "",
    cc: e?.cc?.map((p) => p.address).filter(Boolean).join(", ") || "", bcc: outgoing ? e?.bcc?.map((p) => p.address).filter(Boolean).join(", ") || "" : "",
    replyTo: outgoing ? e?.to?.[0]?.address || "" : e?.replyTo?.[0]?.address || e?.from?.[0]?.address || "", subject: e?.subject || "(Fără subiect)",
    timestamp: date(e?.date || row.internalDate), unread: !row.flags?.has("\\Seen"), messageId: e?.messageId };
}
export async function listMailbox(settings: MailCredentials, accountId: string, folder: MailFolder, page: number) {
  return withMailbox(settings, async (client) => {
    const status = await client.status("INBOX", { unseen: true });
    const unread = status ? status.unseen ?? 0 : 0;
    const path = await folderPath(client, folder);
    if (!path) return { messages: [] as MailMessage[], hasMore: false, unread };
    const box = await client.mailboxOpen(path, { readOnly: true });
    const end = box.exists - page * 30, start = Math.max(1, end - 29);
    const rows = end > 0 ? await client.fetchAll(`${start}:${end}`, { envelope: true, flags: true, internalDate: true }) : [];
    return { messages: rows.reverse().map((r) => summary(r, accountId, folder, String(box.uidValidity))), hasMore: start > 1, unread };
  });
}
async function openReference(client: ImapFlow, ref: MailReference) {
  const path = await folderPath(client, ref.folder);
  if (!path) throw new MailError("Dosarul nu mai există. Reîncarcă lista.");
  const box = await client.mailboxOpen(path);
  if (String(box.uidValidity) !== ref.uidValidity) throw new MailError("Dosarul a fost reorganizat pe server. Reîncarcă lista mesajelor.");
  return path;
}
async function parsedMessage(client: ImapFlow, ref: MailReference) {
  await openReference(client, ref);
  const info = await client.fetchOne(String(ref.uid), { size: true }, { uid: true });
  if (!info) throw new MailError("Mesajul nu mai există. Reîncarcă lista.");
  if (!info.size || info.size > MAX_MESSAGE) throw new MailError("Mesajul depășește 25 MB. Deschide-l în webmail pentru conținut și atașamente.");
  const row = await client.fetchOne(String(ref.uid), { source: { start: 0, maxLength: MAX_MESSAGE + 1 }, envelope: true, flags: true }, { uid: true });
  if (!row || !row.source || row.source.length > MAX_MESSAGE) throw new MailError("Conținutul mesajului nu a putut fi citit.");
  const parsed = await simpleParser(row.source, { skipHtmlToText: false, skipTextToHtml: true, skipImageLinks: true, maxHtmlLengthToParse: 500_000 });
  return { row, parsed };
}
export async function readMailboxMessage(settings: MailCredentials, ref: MailReference) {
  return withMailbox(settings, async (client) => {
    const { row, parsed } = await parsedMessage(client, ref);
    await client.messageFlagsAdd(String(ref.uid), ["\\Seen"], { uid: true });
    let options: ComposeOptions = {};
    const stored = parsed.headers.get("x-electrofield-compose");
    if (ref.folder === "draft" && typeof stored === "string" && stored.length < 4000) {
      try { options = composeOptions(JSON.parse(Buffer.from(stored, "base64").toString("utf8"))); } catch { /* Foreign drafts have no application preferences. */ }
    }
    const addresses = (value: typeof parsed.to) => (Array.isArray(value) ? value : value ? [value] : []).flatMap((a) => a.value).map((a) => a.address).filter(Boolean).join(", ");
    return { ...summary(row, ref.accountId, ref.folder, ref.uidValidity), body: (parsed.text || (ref.folder === "draft" ? "" : "Mesajul nu conține text afișabil.")).slice(0, 300_000), unread: false,
      to: addresses(parsed.to), cc: addresses(parsed.cc), bcc: ref.folder === "draft" || ref.folder === "sent" ? addresses(parsed.bcc) : "",
      bodyHtml: ref.folder === "draft" && parsed.html ? sanitizeEmailHtml(parsed.html.slice(0, 200_000)).slice(0, 200_000) : "",
      composeOptions: { ...options, replyTo: addresses(parsed.replyTo), followUpTo: String(parsed.headers.get("mail-followup-to") || "") },
      references: parsed.references ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]).slice(-20) : [],
      attachments: parsed.attachments.map((a, index) => ({ index, name: a.filename || "Atașament", size: a.size })) };
  });
}
export async function mailboxAttachments(settings: MailCredentials, ref: MailReference, indexes: number[]) {
  return withMailbox(settings, async (client) => {
    const { parsed } = await parsedMessage(client, ref);
    return indexes.map((index) => {
      const a = parsed.attachments[index];
      if (!a) throw new MailError("Un atașament din mesajul original nu mai este disponibil.");
      return { filename: a.filename || "atasament", content: a.content };
    });
  });
}
export async function mailboxSendFolders(settings: MailCredentials) {
  return withMailbox(settings, async (client) => (await client.list()).filter((b) => !b.flags.has("\\Noselect")).map((b) => b.path));
}
export async function mailboxAttachment(settings: MailCredentials, ref: MailReference, index: number) {
  return withMailbox(settings, async (client) => {
    const { parsed } = await parsedMessage(client, ref);
    const attachment = parsed.attachments[index];
    if (!attachment) throw new MailError("Atașamentul nu există.");
    return { name: attachment.filename || "atasament", content: attachment.content };
  });
}
export async function mutateMailboxMessage(settings: MailCredentials, ref: MailReference, action: "unread" | "trash") {
  return withMailbox(settings, async (client) => {
    await openReference(client, ref);
    if (action === "unread") {
      if (!(await client.messageFlagsRemove(String(ref.uid), ["\\Seen"], { uid: true }))) throw new MailError("Mesajul nu a putut fi marcat. Reîncarcă lista.");
    }
    else {
      if (ref.folder === "trash") throw new MailError("Mesajul este deja în Coș.");
      // Without MOVE or UIDPLUS, the library's fallback can expunge unrelated
      // messages already flagged Deleted by another mail client.
      if (!client.capabilities.has("MOVE") && !client.capabilities.has("UIDPLUS")) throw new MailError("Serverul nu permite mutarea în siguranță a unui singur mesaj. Folosește webmailul pentru această operație.");
      const trash = await folderPath(client, "trash", true);
      if (!trash || !(await client.messageMove(String(ref.uid), trash, { uid: true }))) throw new MailError("Mesajul nu a putut fi mutat în Coș.");
    }
  });
}
export async function buildMailMessage(settings: MailCredentials, input: DeliveryInput, privateCopy: boolean) {
  const opts = composeOptions(input);
  const headers: Record<string, string> = {};
  if (opts.followUpTo) headers["Mail-Followup-To"] = opts.followUpTo;
  if (opts.readReceipt) headers["Disposition-Notification-To"] = settings.address;
  if (opts.priority !== "normal") {
    headers["X-Priority"] = opts.priority === "high" ? "1 (Highest)" : "5 (Lowest)";
    headers["Importance"] = opts.priority === "high" ? "High" : "Low";
    headers["X-MSMail-Priority"] = headers["Importance"];
  }
  if (privateCopy) headers["X-ElectroField-Compose"] = Buffer.from(JSON.stringify({ ...opts, bodyHtml: undefined, cc: undefined, bcc: undefined, replyTo: undefined, followUpTo: undefined })).toString("base64");
  const options = { from: { name: settings.name, address: settings.address }, to: input.to, subject: input.subject, text: input.body,
    cc: opts.cc, bcc: opts.bcc, replyTo: opts.replyTo || undefined, headers,
    html: opts.format === "html" ? sanitizeEmailHtml(opts.bodyHtml) : undefined, attachments: input.attachments,
    messageId: input.messageId, inReplyTo: input.inReplyTo, references: input.references,
    disableFileAccess: true, disableUrlAccess: true };
  const message = new MailComposer(options).compile();
  message.keepBcc = privateCopy;
  return new Promise<Buffer>((resolve, reject) => message.build((error, buffer) => error ? reject(error) : resolve(buffer)));
}
type DeliveryInput = ComposeOptions & { to: string; subject: string; body: string; messageId: string; inReplyTo?: string; references?: string[]; attachments?: { filename: string; content: Buffer }[] };
export async function deliverMessage(settings: MailCredentials, input: DeliveryInput, draft: boolean) {
  const opts = composeOptions(input);
  const raw = await buildMailMessage(settings, input, draft);
  if (draft) {
    await withMailbox(settings, async (client) => {
      const path = await folderPath(client, "draft", true);
      if (!path || !(await client.append(path, raw, ["\\Draft", "\\Seen"]))) throw new MailError("Ciorna nu a putut fi salvată pe server.");
    });
    return { warning: "" };
  }
  const recipients = [...new Set([input.to, opts.cc, opts.bcc].flatMap((v) => v.split(/[,;]/).map((a) => a.trim()).filter(Boolean)))];
  const warnings: string[] = [];
  const transport = await createMailTransport(settings);
  try {
    const result = await transport.sendMail({ envelope: { from: settings.address, to: recipients }, raw,
      ...(opts.deliveryNotification ? { dsn: { id: input.messageId, return: "headers" as const, notify: ["success", "failure", "delay"] as ("success" | "failure" | "delay")[] } } : {}),
      disableFileAccess: true, disableUrlAccess: true });
    if (!result.accepted?.length) throw new MailError("Serverul SMTP nu a acceptat niciun destinatar.");
    if (result.rejected?.length) warnings.push(`Mesaj acceptat parțial. Destinatari refuzați: ${result.rejected.join(", ")}. Nu retrimite întregul mesaj.`);
    const ehlo = (result as unknown as { ehlo?: string[] }).ehlo ?? [];
    if (opts.deliveryNotification && !ehlo.some((line) => /^DSN(?:\s|$)/i.test(line))) warnings.push("Mesaj acceptat de SMTP, dar serverul nu a anunțat suport DSN; notificarea de livrare nu poate fi confirmată.");
  } finally { transport.close(); }
  if (!opts.saveSent) return { warning: warnings.join(" ") };
  try {
    const sentCopy = await buildMailMessage(settings, input, true);
    await withMailbox(settings, async (client) => {
      const path = opts.sentFolder || await folderPath(client, "sent", true);
      if (!path || !(await client.append(path, sentCopy, ["\\Seen"]))) throw new Error("Sent append failed");
    });
    return { warning: warnings.join(" ") };
  } catch {
    // SMTP already accepted delivery: never return a send failure that encourages
    // duplicate sending just because saving the Sent copy failed.
    return { warning: [...warnings, "Mesajul a fost acceptat de SMTP, dar copia nu a putut fi salvată în dosarul ales. Nu retrimite mesajul."].join(" ") };
  }
}
