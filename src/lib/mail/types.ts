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
export const MAIL_UPLOAD_BUCKET = "platform-mail-uploads";
export const MAX_ATTACHMENTS_BYTES = 15 * 1024 * 1024;
export type MailUpload = { path: string; name: string; size: number };
export type MailAttachmentMeta = { index: number; name: string; size: number };
export type ComposeOptions = {
  cc?: string; bcc?: string; replyTo?: string; followUpTo?: string;
  priority?: "high" | "normal" | "low"; format?: "plain" | "html"; bodyHtml?: string;
  readReceipt?: boolean; deliveryNotification?: boolean; saveSent?: boolean; sentFolder?: string;
};
export type MailComposeInput = ComposeOptions & {
  accountId: string; to: string; subject: string; body: string; deliveryId: string;
  reply?: MailReference; draftRef?: MailReference; uploads?: MailUpload[];
  attachmentSource?: MailReference; existingAttachments?: MailAttachmentMeta[];
};
export type MailMessage = MailReference & {
  id: string; name: string; address: string; to: string; replyTo: string;
  subject: string; timestamp: string; unread: boolean; body?: string;
  messageId?: string; references?: string[];
  cc?: string; bcc?: string; bodyHtml?: string; composeOptions?: ComposeOptions;
  attachments?: { index: number; name: string; size: number }[];
};
export type MailResult<T> = { data: T; error?: never } | { error: string; data?: never };
