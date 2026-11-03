import dns from "node:dns/promises";
import { ImapFlow, type FetchMessageObject } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { MailError, hostname, isPublicAddress } from "./validation";
import type { MailCredentials, MailFolder, MailMessage, MailReference } from "./types";

const MAX_MESSAGE = 10 * 1024 * 1024;
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
async function smtp(settings: MailCredentials) {
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
  const transport = await smtp(settings);
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
    replyTo: e?.replyTo?.[0]?.address || e?.from?.[0]?.address || "", subject: e?.subject || "(Fără subiect)",
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
  if (!info.size || info.size > MAX_MESSAGE) throw new MailError("Mesajul depășește 10 MB. Deschide-l în webmail pentru conținut și atașamente.");
  const row = await client.fetchOne(String(ref.uid), { source: { start: 0, maxLength: MAX_MESSAGE + 1 }, envelope: true, flags: true }, { uid: true });
  if (!row || !row.source || row.source.length > MAX_MESSAGE) throw new MailError("Conținutul mesajului nu a putut fi citit.");
  const parsed = await simpleParser(row.source, { skipHtmlToText: false, skipTextToHtml: true, skipImageLinks: true, maxHtmlLengthToParse: MAX_MESSAGE });
  return { row, parsed };
}
export async function readMailboxMessage(settings: MailCredentials, ref: MailReference) {
  return withMailbox(settings, async (client) => {
    const { row, parsed } = await parsedMessage(client, ref);
    await client.messageFlagsAdd(String(ref.uid), ["\\Seen"], { uid: true });
    return { ...summary(row, ref.accountId, ref.folder, ref.uidValidity), body: (parsed.text || "Mesajul nu conține text afișabil.").slice(0, 300_000), unread: false,
      references: parsed.references ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]).slice(-20) : [],
      attachments: parsed.attachments.map((a, index) => ({ index, name: a.filename || "Atașament", size: a.size })) };
  });
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
    if (action === "unread") await client.messageFlagsRemove(String(ref.uid), ["\\Seen"], { uid: true });
    else {
      if (ref.folder === "trash") throw new MailError("Mesajul este deja în Coș.");
      const trash = await folderPath(client, "trash", true);
      if (!trash || !(await client.messageMove(String(ref.uid), trash, { uid: true }))) throw new MailError("Mesajul nu a putut fi mutat în Coș.");
    }
  });
}
export async function deliverMessage(settings: MailCredentials, input: { to: string; subject: string; body: string; messageId: string; inReplyTo?: string; references?: string[] }, draft: boolean) {
  const options = { from: { name: settings.name, address: settings.address }, to: input.to, subject: input.subject, text: input.body,
    messageId: input.messageId, inReplyTo: input.inReplyTo, references: input.references,
    disableFileAccess: true, disableUrlAccess: true };
  const composer = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  const built = await composer.sendMail(options);
  const raw = built.message as Buffer;
  if (draft) {
    await withMailbox(settings, async (client) => {
      const path = await folderPath(client, "draft", true);
      if (!path || !(await client.append(path, raw, ["\\Draft", "\\Seen"]))) throw new MailError("Ciorna nu a putut fi salvată pe server.");
    });
    return { warning: "" };
  }
  const transport = await smtp(settings);
  try {
    const result = await transport.sendMail({ envelope: { from: settings.address, to: [input.to] }, raw, disableFileAccess: true, disableUrlAccess: true });
    if (!result.accepted?.length || result.rejected?.length) throw new MailError("Serverul SMTP nu a acceptat destinatarul.");
  } finally { transport.close(); }
  try {
    await withMailbox(settings, async (client) => {
      const path = await folderPath(client, "sent", true);
      if (!path || !(await client.append(path, raw, ["\\Seen"]))) throw new Error("Sent append failed");
    });
    return { warning: "" };
  } catch {
    // SMTP already accepted delivery: never return a send failure that encourages
    // duplicate sending just because saving the Sent copy failed.
    return { warning: "Mesajul a fost acceptat de SMTP, dar copia nu a putut fi salvată în Trimise. Nu retrimite mesajul." };
  }
}
