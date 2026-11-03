export type MailFolder = "inbox" | "sent" | "draft" | "spam" | "trash";
export type MailView = "unified" | "accounts";
export type MailSettings = {
  name: string; address: string; username: string;
  incomingHost: string; incomingPort: number; incomingSecurity: "tls" | "starttls";
  outgoingHost: string; outgoingPort: number; outgoingSecurity: "tls" | "starttls";
  outgoingUsername: string;
  separateSmtp?: boolean;
};
export type MailAccount = MailSettings & { id: string; verifiedAt: string };
export type MailCredentials = MailSettings & { password: string; outgoingPassword: string };
export type MailReference = { accountId: string; folder: MailFolder; uid: number; uidValidity: string };
export type MailMessage = MailReference & {
  id: string; name: string; address: string; to: string; replyTo: string;
  subject: string; timestamp: string; unread: boolean; body?: string;
  messageId?: string; references?: string[];
  attachments?: { index: number; name: string; size: number }[];
};
export type MailResult<T> = { data: T; error?: never } | { error: string; data?: never };
