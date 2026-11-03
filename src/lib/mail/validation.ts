import ipaddr from "ipaddr.js";
import type { MailCredentials, MailFolder, MailReference, MailSettings } from "./types";

export class MailError extends Error {}
const EMAIL = /^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/;
export function email(value: unknown): string {
  if (typeof value !== "string" || value.length > 254 || !EMAIL.test(value.trim())) throw new MailError("Introdu o adresă de email validă.");
  return value.trim();
}
function line(value: unknown, label: string, max = 254) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) throw new MailError(`Verifică ${label}.`);
  return value.trim();
}
export function hostname(value: unknown): string {
  const host = line(value, "numele serverului").toLowerCase();
  if (ipaddr.isValid(host) || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)
    || /\.(localhost|local|internal|test|invalid|example)$/.test(host)) throw new MailError("Introdu numele public al serverului, fără https:// sau port.");
  return host;
}
export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === "unicast"; } catch { return false; }
}
export function validateSettings(input: unknown): MailSettings {
  if (!input || typeof input !== "object") throw new MailError("Configurație incompletă.");
  const v = input as Record<string, unknown>;
  function security(value: unknown): "tls" | "starttls" {
    if (value !== "tls" && value !== "starttls") throw new MailError("Selectează SSL/TLS sau STARTTLS.");
    return value;
  }
  const incomingSecurity = security(v.incomingSecurity), outgoingSecurity = security(v.outgoingSecurity);
  const incomingPort = Number(v.incomingPort), outgoingPort = Number(v.outgoingPort);
  if (incomingPort !== (incomingSecurity === "tls" ? 993 : 143)) throw new MailError("IMAP: folosește portul 993 cu SSL/TLS sau 143 cu STARTTLS.");
  if (outgoingPort !== (outgoingSecurity === "tls" ? 465 : 587)) throw new MailError("SMTP: folosește portul 465 cu SSL/TLS sau 587 cu STARTTLS.");
  return { name: line(v.name, "numele afișat", 80), address: email(v.address), username: line(v.username, "username-ul IMAP"),
    incomingHost: hostname(v.incomingHost), incomingPort, incomingSecurity,
    outgoingHost: hostname(v.outgoingHost), outgoingPort, outgoingSecurity,
    outgoingUsername: line(v.separateSmtp === false ? v.username : v.outgoingUsername || v.username, "username-ul SMTP"), separateSmtp: v.separateSmtp === true };
}
export function validateCredentials(input: unknown, previous?: MailCredentials): MailCredentials {
  const settings = validateSettings(input);
  const v = input as Record<string, unknown>;
  const password = v.password === "" && previous ? previous.password : v.password;
  if (typeof password !== "string" || !password || password.length > 2048 || password.includes("\0")) throw new MailError("Completează parola căsuței de email.");
  const outgoingPassword = v.separateSmtp === false ? password : v.outgoingPassword === "" && previous ? previous.outgoingPassword : v.outgoingPassword || password;
  if (typeof outgoingPassword !== "string" || outgoingPassword.length > 2048 || outgoingPassword.includes("\0")) throw new MailError("Verifică parola SMTP.");
  return { ...settings, password, outgoingPassword };
}
export function accountId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new MailError("Adresă de mail invalidă.");
  return value;
}
export function mailFolder(value: unknown): MailFolder {
  if (!["inbox", "sent", "draft", "spam", "trash"].includes(String(value))) throw new MailError("Dosar invalid.");
  return value as MailFolder;
}
export function reference(value: MailReference): MailReference {
  if (!value || !Number.isSafeInteger(value.uid) || value.uid < 1 || !/^\d{1,20}$/.test(value.uidValidity)) throw new MailError("Referință de mesaj invalidă. Reîncarcă lista.");
  return { accountId: accountId(value.accountId), folder: mailFolder(value.folder), uid: value.uid, uidValidity: value.uidValidity };
}
export function composeInput(input: { to: string; subject: string; body: string }, draft = false) {
  return { to: draft && input.to === "" ? "" : email(input.to), subject: draft && input.subject === "" ? "" : line(input.subject, "subiectul", 500), body: typeof input.body === "string" && input.body.length <= 200_000 ? input.body : (() => { throw new MailError("Mesajul depășește limita de 200.000 de caractere."); })() };
}
export function safeMailError(error: unknown): string {
  if (error instanceof MailError) return error.message;
  const e = error as { code?: string; authenticationFailed?: boolean; responseCode?: number } | null;
  if (e?.authenticationFailed || e?.code === "EAUTH" || e?.responseCode === 535) return "Autentificarea a eșuat. Verifică username-ul și parola pentru IMAP și SMTP.";
  if (e?.code && /CERT|TLS|SSL|SELF_SIGNED/.test(e.code)) return "Certificatul serverului nu este valid. Folosește serverul securizat din Mail Client Manual Settings.";
  if (e?.code && /TIMEOUT|TIMEDOUT|ECONN|ENOTFOUND|EAI_AGAIN|ESOCKET/.test(e.code)) return "Serverul de mail nu a putut fi contactat. Verifică serverul, portul și conexiunea securizată.";
  return "Operația de mail nu a reușit. Reîncearcă sau verifică setările adresei.";
}
