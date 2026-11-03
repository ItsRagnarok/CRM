import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, isAbsolute } from "node:path";
import dns from "node:dns/promises";
import { mock } from "node:test";
import ts from "typescript";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { validateCredentials, validateSettings, hostname, isPublicAddress, composeInput, reference, safeMailError } from "../src/lib/mail/validation.ts";

// Transpile the actual protocol module for Node's runner without changing the
// application's bundler resolution settings. No production credentials are used.
const cache = new URL("../node_modules/.cache/ef-mail-tests/", import.meta.url);
await mkdir(cache, { recursive: true });
const source = (await readFile(new URL("../src/lib/mail/protocol.ts", import.meta.url), "utf8"))
  .replace('"./validation"', JSON.stringify(new URL("../src/lib/mail/validation.ts", import.meta.url).href));
const modulePath = new URL("protocol.mjs", cache);
await writeFile(modulePath, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
const protocol = await import(modulePath.href);
after(async () => {
  mock.restoreAll();
  const target = fileURLToPath(cache), within = relative(fileURLToPath(new URL("../node_modules/.cache/", import.meta.url)), target);
  if (!within || within.startsWith("..") || isAbsolute(within)) throw new Error("Test cache cleanup escaped its workspace");
  await rm(target, { recursive: true, force: true });
});
const settings = { name: "Test", address: "contact@example.com", username: "contact@example.com", password: " secret with spaces ", outgoingPassword: "smtp-secret", incomingHost: "mail.example.com", incomingPort: 993, incomingSecurity: "tls", outgoingHost: "mail.example.com", outgoingPort: 465, outgoingSecurity: "tls", outgoingUsername: "contact@example.com", separateSmtp: true };
const ref = { accountId: "11111111-1111-4111-8111-111111111111", folder: "inbox", uid: 9, uidValidity: "123" };

test("manual settings accept secured ports, preserve passwords and safely reuse editing credentials", () => {
  assert.equal(validateCredentials(settings).password, settings.password);
  assert.equal(validateCredentials({ ...settings, password: "", outgoingPassword: "" }, settings).outgoingPassword, "smtp-secret");
  assert.equal(validateCredentials({ ...settings, separateSmtp: false, password: "new-secret", outgoingPassword: "" }, settings).outgoingPassword, "new-secret");
  assert.throws(() => validateSettings({ ...settings, outgoingPort: 25 }));
  assert.throws(() => validateSettings({ ...settings, incomingPort: 143 }));
  assert.throws(() => validateSettings({ ...settings, outgoingSecurity: "none" }));
  assert.throws(() => validateCredentials({ ...settings, password: "" }));
});
test("rejects local servers, credentials in URLs, special IP ranges and header injection", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]", "https://mail.example.com", "user:pass@mail.example.com", "mail.internal", "mail.example.com:993"]) assert.throws(() => hostname(host));
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "224.0.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "64:ff9b::7f00:1"]) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("1.1.1.1"), true);
  assert.throws(() => composeInput({ to: "x@example.com\r\nBcc:y@example.com", subject: "Test", body: "Text" }));
  assert.throws(() => composeInput({ to: "x@example.com", subject: "Test\r\nBcc:y@example.com", body: "Text" }));
  assert.deepEqual(composeInput({ to: "", subject: "", body: "Draft" }, true), { to: "", subject: "", body: "Draft" });
  assert.throws(() => reference({ ...ref, uid: -1 }));
  assert.throws(() => reference({ ...ref, uidValidity: "123:*" }));
  assert.throws(() => reference({ ...ref, folder: "../../secrets" }));
  assert.ok(!safeMailError(new Error("password=private-secret")).includes("private-secret"));
});
test("DNS results are all checked and the public address is pinned", async () => {
  const lookup = mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }, { address: "10.0.0.1", family: 4 }]);
  await assert.rejects(protocol.publicHost("mail.example.com"));
  lookup.mock.mockImplementation(async () => [{ address: "1.1.1.1", family: 4 }]);
  assert.equal(await protocol.publicHost("mail.example.com"), "1.1.1.1");
  lookup.mock.restore();
});
test("connection test enforces TLS certificate checks, suppresses logs and never sends mail", async () => {
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  let verified = false;
  mock.method(ImapFlow.prototype, "connect", async function () { assert.equal(this.options.host, "1.1.1.1"); assert.equal(this.options.servername, settings.incomingHost); assert.equal(this.options.tls.rejectUnauthorized, true); assert.equal(this.options.logger, false); });
  mock.method(ImapFlow.prototype, "mailboxOpen", async () => ({ exists: 0, uidValidity: 123n }));
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(nodemailer, "createTransport", (options) => { assert.equal(options.tls.rejectUnauthorized, true); assert.equal(options.requireTLS, true); assert.equal(options.host, "1.1.1.1"); return { verify: async () => { verified = true; }, close() {}, sendMail() { assert.fail("Verification sent an email"); } }; });
  try { await protocol.verifyMailbox(settings); assert.ok(verified); } finally { mock.restoreAll(); }
});
test("message reads reject oversized content and obsolete UID validity before fetching source", async () => {
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  mock.method(ImapFlow.prototype, "connect", async () => {});
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(ImapFlow.prototype, "mailboxOpen", async () => ({ exists: 1, uidValidity: 124n }));
  const fetch = mock.method(ImapFlow.prototype, "fetchOne", async () => ({ size: 11 * 1024 * 1024 }));
  try {
    await assert.rejects(protocol.readMailboxMessage(settings, ref), /reorganizat/);
    assert.equal(fetch.mock.callCount(), 0);
    await assert.rejects(protocol.readMailboxMessage(settings, { ...ref, uidValidity: "124" }), /10 MB/);
    assert.equal(fetch.mock.callCount(), 1);
  } finally { mock.restoreAll(); }
});
test("SMTP acceptance followed by Sent-copy failure reports successful send with a warning", async () => {
  const originalCreate = nodemailer.createTransport.bind(nodemailer);
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  mock.method(ImapFlow.prototype, "connect", async () => {});
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(ImapFlow.prototype, "list", async () => [{ path: "Sent", specialUse: "\\Sent" }]);
  mock.method(ImapFlow.prototype, "append", async () => { throw new Error("Sent storage unavailable"); });
  let sent = 0;
  mock.method(nodemailer, "createTransport", (options) => options.streamTransport ? originalCreate(options) : { sendMail: async () => { sent++; return { accepted: ["recipient@example.com"], rejected: [] }; }, close() {} });
  try {
    const result = await protocol.deliverMessage(settings, { to: "recipient@example.com", subject: "Test", body: "Test", messageId: "<synthetic@example.com>" }, false);
    assert.equal(sent, 1); assert.match(result.warning, /Nu retrimite/);
  } finally { mock.restoreAll(); }
});
test("folder listing paginates actual envelopes and keeps mailbox UID validity", async () => {
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  mock.method(ImapFlow.prototype, "connect", async () => {});
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(ImapFlow.prototype, "status", async () => ({ unseen: 3 }));
  mock.method(ImapFlow.prototype, "mailboxOpen", async () => ({ exists: 62, uidValidity: 123n }));
  mock.method(ImapFlow.prototype, "fetchAll", async (range) => { assert.equal(range, "33:62"); return [
    { uid: 33, flags: new Set(["\\Seen"]), envelope: { from: [{ name: "Client", address: "client@example.com" }], subject: "Lucrare", date: new Date("2026-11-03T08:00:00Z") } },
    { uid: 62, flags: new Set(), envelope: { from: [{ address: "other@example.com" }], subject: "Ofertă" } },
  ]; });
  try {
    const result = await protocol.listMailbox(settings, ref.accountId, "inbox", 0);
    assert.equal(result.unread, 3); assert.equal(result.hasMore, true);
    assert.equal(result.messages[0].uid, 62); assert.equal(result.messages[0].uidValidity, "123");
    assert.equal(result.messages[0].unread, true); assert.equal(result.messages[1].unread, false);
  } finally { mock.restoreAll(); }
});
test("real MIME parser returns text and downloadable attachment without exposing HTML", async () => {
  const built = await nodemailer.createTransport({ streamTransport: true, buffer: true }).sendMail({ from: "client@example.com", to: settings.address,
    subject: "Verificare", text: "Mesaj în limba română.", html: '<script>alert(1)</script><p>Mesaj în limba română.</p>',
    attachments: [{ filename: "document.txt", content: Buffer.from("test attachment") }] });
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  mock.method(ImapFlow.prototype, "connect", async () => {});
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(ImapFlow.prototype, "mailboxOpen", async () => ({ exists: 1, uidValidity: 123n }));
  mock.method(ImapFlow.prototype, "fetchOne", async (uid, query, options) => {
    assert.equal(uid, "9"); assert.equal(options.uid, true);
    return query.size ? { size: built.message.length } : { uid: 9, source: built.message, flags: new Set(), envelope: { from: [{ address: "client@example.com" }], to: [{ address: settings.address }] } };
  });
  const flags = mock.method(ImapFlow.prototype, "messageFlagsAdd", async () => true);
  try {
    const message = await protocol.readMailboxMessage(settings, ref);
    assert.match(message.body, /limba română/); assert.equal("html" in message, false); assert.equal(message.unread, false);
    assert.equal(message.attachments[0].name, "document.txt"); assert.equal(flags.mock.callCount(), 1);
    const attachment = await protocol.mailboxAttachment(settings, ref, 0);
    assert.equal(attachment.content.toString(), "test attachment");
  } finally { mock.restoreAll(); }
});
test("trash refuses servers whose MOVE fallback could expunge other deleted messages", async () => {
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  mock.method(ImapFlow.prototype, "connect", async () => {});
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(ImapFlow.prototype, "mailboxOpen", async () => ({ exists: 1, uidValidity: 123n }));
  const move = mock.method(ImapFlow.prototype, "messageMove", async () => true);
  try {
    await assert.rejects(protocol.mutateMailboxMessage(settings, ref, "trash"), /în siguranță/);
    assert.equal(move.mock.callCount(), 0);
  } finally { mock.restoreAll(); }
});
test("replying to a sent message targets its recipient instead of the sender account", async () => {
  mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  mock.method(ImapFlow.prototype, "connect", async () => {});
  mock.method(ImapFlow.prototype, "close", () => {});
  mock.method(ImapFlow.prototype, "status", async () => ({ unseen: 0 }));
  mock.method(ImapFlow.prototype, "list", async () => [{ path: "Sent", specialUse: "\\Sent" }]);
  mock.method(ImapFlow.prototype, "mailboxOpen", async () => ({ exists: 1, uidValidity: 123n }));
  mock.method(ImapFlow.prototype, "fetchAll", async () => [{ uid: 9, flags: new Set(["\\Seen"]), envelope: { from: [{ address: settings.address }], to: [{ address: "recipient@example.com" }] } }]);
  try { assert.equal((await protocol.listMailbox(settings, ref.accountId, "sent", 0)).messages[0].replyTo, "recipient@example.com"); }
  finally { mock.restoreAll(); }
});
