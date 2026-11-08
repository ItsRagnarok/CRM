import "server-only";
import nodemailer from "nodemailer";
import type { Database } from "@/lib/supabase/database.types";
import type { defaultConfirmation } from "./booking-confirmation";
import type { MailCredentials } from "./mail/types";

export const bookingMailbox = "programare@electrofield.ro";
type Booking = Database["public"]["Tables"]["bookings"]["Insert"];
const dateFormat = new Intl.DateTimeFormat("ro-RO", { dateStyle: "full", timeZone: "Europe/Bucharest" });
const timeFormat = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
const escapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (text: string) => text.replace(/[&<>"']/g, (character) => escapes[character]);

export async function sendBookingEmail(to: string, subject: string, text: string, html?: string, account?: MailCredentials, replyTo?: string) {
  const host = process.env.BOOKING_SMTP_HOST;
  const password = process.env.BOOKING_SMTP_PASSWORD;
  if (!account && (!host || !password)) throw new Error("SMTP not configured");
  const sender = account?.address || process.env.BOOKING_SMTP_USER || bookingMailbox;
  const transport = account ? await (await import("./mail/protocol")).createMailTransport(account) : nodemailer.createTransport({
    host, port: 465, secure: true,
    auth: { user: sender, pass: password! },
    connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 10_000,
  });
  try {
    const result = await transport.sendMail({
      from: { name: "ElectroField Programări", address: sender },
      to: { name: "", address: to },
      replyTo,
      subject: subject.replace(/[\r\n]+/g, " "), text, html,
    });
    if (!result.accepted.length) throw new Error("SMTP did not accept recipient");
  } finally {
    transport.close();
  }
}

export async function notifyBooking(booking: Booking) {
  const when = new Date(booking.slot_start);
  const slot = `${dateFormat.format(when)}, ${timeFormat.format(when)}`;
  // The booking form stores the wizard answers in the note: "Domenii: Electrice, Gaze" comes first.
  const domains = booking.note?.match(/^Domenii: (.+)$/m)?.[1];
  await sendBookingEmail(bookingMailbox, `Programare nouă ElectroField · ${slot}${domains ? ` · ${domains}` : ""}`, [
    `Programare: ${slot} (ora României)`,
    `Nume: ${booking.name}`,
    `Telefon: ${booking.phone}`,
    booking.email && `Email: ${booking.email}`,
    booking.note && `\nDespre firmă:\n${booking.note}`,
  ].filter(Boolean).join("\n"));
}

export async function confirmBooking(booking: Booking, template: typeof defaultConfirmation, meet?: string, account?: MailCredentials) {
  if (!booking.email) throw new Error("Booking has no email");
  const when = new Date(booking.slot_start);
  const values: Record<string, string> = { nume: booking.name, data: dateFormat.format(when), ora: timeFormat.format(when) };
  const fill = (text: string) => text.replace(/\{(nume|data|ora)\}/g, (_, key) => values[key]);
  const subject = fill(template.subject);
  const message = fill(template.message);
  const slot = `${values.data} · ${values.ora} (ora României)`;
  const html = `<!doctype html><html lang="ro"><body style="margin:0;padding:24px;background:#f4f5fb;color:#19223a;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e3e7f3;border-radius:14px">
      <div style="padding:20px 24px;background:#17284a;color:#fff;border-radius:14px 14px 0 0;font-size:19px;font-weight:bold">ElectroField</div>
      <div style="padding:24px;font-size:15px;line-height:1.6">
        <h1 style="margin:0 0 14px;font-size:23px">${escape(subject)}</h1>
        <p style="padding:12px;background:#edf2ff;border-radius:8px"><strong>${escape(slot)}</strong></p>
        <p>${escape(message).replace(/\r?\n/g, "<br>")}</p>
        ${meet ? `<p><a href="${escape(meet)}" style="display:inline-block;background:#214cc0;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Deschide Google Meet</a></p>` : ""}
      </div>
    </div></body></html>`;
  await sendBookingEmail(booking.email, subject, [slot, message, meet && `Google Meet: ${meet}`].filter(Boolean).join("\n\n"), html, account);
}
