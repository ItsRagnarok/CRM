"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Paperclip, Send, Underline, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MAIL_UPLOAD_BUCKET, MAX_ATTACHMENTS_BYTES, type MailAccount, type MailComposeInput, type MailUpload } from "@/lib/mail/types";
import { cleanupMailUploads, fetchMailSendFolders, submitMail } from "./actions";
import s from "./mail.module.css";

type Upload = MailUpload & { status: "uploading" | "ready" | "error" };
function escaped(text: string) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>"); }
export function MailComposerDialog({ initial, accounts, ownerId, onClose, onSubmitted }: {
  initial: MailComposeInput; accounts: MailAccount[]; ownerId: string; onClose: () => void;
  onSubmitted: (result: { accountId: string; draft: boolean; saveSent: boolean; sentFolder: string; warning: string }) => void;
}) {
  const [value, setValue] = useState<MailComposeInput>({ cc: "", bcc: "", replyTo: "", followUpTo: "", priority: "normal", format: "plain", readReceipt: true, deliveryNotification: true, saveSent: true, sentFolder: "", existingAttachments: [], ...initial });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [folderError, setFolderError] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  const uploadLock = useRef(false);
  const busy = sending || uploading;
  useEffect(() => { dialog.current?.showModal(); void cleanupMailUploads().catch(() => {}); }, []);
  useEffect(() => {
    let active = true; setFolders([]); setFolderError("");
    fetchMailSendFolders(value.accountId).then((result) => { if (!active) return; if (result.data) setFolders(result.data); else setFolderError(result.error || "Nu am putut încărca dosarele."); }).catch(() => { if (active) setFolderError("Dosarele nu au putut fi încărcate. Dosarul implicit rămâne disponibil."); });
    return () => { active = false; };
  }, [value.accountId]);
  function field<K extends keyof MailComposeInput>(key: K, next: MailComposeInput[K]) { setValue((v) => ({ ...v, [key]: next })); }
  async function removeUploads(paths: string[]) {
    if (!paths.length) return;
    await createClient().storage.from(MAIL_UPLOAD_BUCKET).remove(paths);
  }
  async function close() {
    if (locked.current || uploadLock.current) return;
    if ((value.to || value.cc || value.bcc || value.subject || value.body || uploads.length || value.existingAttachments?.length) && !confirm("Închizi fără să salvezi ciorna? Atașamentele încărcate vor fi eliminate.")) return;
    void removeUploads(uploads.map((a) => a.path)).catch(() => {}); onClose();
  }
  async function attach(files: File[]) {
    if (uploadLock.current || locked.current || !files.length) return;
    const existingSize = (value.existingAttachments ?? []).reduce((sum, a) => sum + a.size, 0) + uploads.reduce((sum, a) => sum + a.size, 0);
    if (files.length + uploads.length + (value.existingAttachments?.length ?? 0) > 20 || existingSize + files.reduce((sum, f) => sum + f.size, 0) > MAX_ATTACHMENTS_BYTES) { setNotice("Poți atașa cel mult 20 de fișiere, cu maximum 15 MB în total."); return; }
    if (files.some((f) => f.name.length > 200 || /[\x00-\x1f\x7f]/.test(f.name))) { setNotice("Un nume de fișier este prea lung sau conține caractere nepermise."); return; }
    uploadLock.current = true; setUploading(true); setNotice("");
    const client = createClient();
    try {
      for (const file of files) {
        const path = `${ownerId}/${crypto.randomUUID()}`;
        const item: Upload = { path, name: file.name, size: file.size, status: "uploading" };
        setUploads((rows) => [...rows, item]);
        try {
          const { error } = await client.storage.from(MAIL_UPLOAD_BUCKET).upload(path, file, { contentType: "application/octet-stream", upsert: false });
          setUploads((rows) => rows.map((a) => a.path === path ? { ...a, status: error ? "error" : "ready" } : a));
          if (error) setNotice(`Încărcarea fișierului „${file.name}” a eșuat. Elimină-l și atașează-l din nou.`);
        } catch { setUploads((rows) => rows.map((a) => a.path === path ? { ...a, status: "error" } : a)); setNotice("Conexiunea s-a întrerupt la încărcarea unui fișier. Elimină-l și încearcă din nou."); }
      }
    } finally { uploadLock.current = false; setUploading(false); }
  }
  async function submit(draft: boolean) {
    if (locked.current || uploadLock.current) return;
    if (uploads.some((a) => a.status !== "ready")) { setNotice("Elimină sau reîncarcă fișierele care nu au fost încărcate complet."); return; }
    locked.current = true; setSending(true); setNotice("");
    try {
      const result = await submitMail({ ...value, uploads: uploads.map(({ path, name, size }) => ({ path, name, size })) }, draft);
      if (result.error) setNotice(result.error);
      else if (result.data) {
        void removeUploads(uploads.map((a) => a.path)).catch(() => {});
        onSubmitted({ accountId: value.accountId, draft, saveSent: value.saveSent !== false, sentFolder: value.sentFolder || "", warning: result.data.warning });
      }
    } catch { setNotice(draft ? "Salvarea nu a putut fi confirmată. Verifică Ciorne înainte de a salva din nou." : "Trimiterea nu a putut fi confirmată. Verifică în webmail înainte de a reîncerca."); }
    finally { locked.current = false; setSending(false); }
  }
  return <dialog ref={dialog} className={`${s.dialog} ${s.composerDialog}`} aria-labelledby="mail-compose-title" onCancel={(e) => { e.preventDefault(); void close(); }}>
    <form onSubmit={(e) => { e.preventDefault(); void submit(false); }}>
      <div className={s.dialogHeading}><h2 id="mail-compose-title">{value.draftRef ? "Editează ciorna" : "Mesaj nou"}<small>{accounts.find((a) => a.id === value.accountId)?.address}</small></h2><button type="button" className={s.iconButton} disabled={busy} onClick={() => close()} aria-label="Închide compunerea"><X size={20} /></button></div>
      <div className={s.composerContent}><fieldset disabled={busy} className={s.composeFields}>
        <label><span>De la</span><select value={value.accountId} disabled={!!value.reply || !!value.draftRef} onChange={(e) => setValue({ ...value, accountId: e.target.value, sentFolder: "" })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name} &lt;{a.address}&gt;</option>)}</select></label>
        <label><span>Către</span><input inputMode="email" required={!value.cc?.trim() && !value.bcc?.trim()} value={value.to} placeholder="adresa@firma.ro, alta@firma.ro" onChange={(e) => field("to", e.target.value)} /></label>
        <label><span>CC</span><input inputMode="email" value={value.cc} placeholder="Copie · adrese separate prin virgulă" onChange={(e) => field("cc", e.target.value)} /></label>
        <label><span>BCC</span><input inputMode="email" value={value.bcc} placeholder="Copie oarbă · ascunsă celorlalți destinatari" onChange={(e) => field("bcc", e.target.value)} /></label>
        <label><span>Subiect</span><input required maxLength={500} value={value.subject} onChange={(e) => field("subject", e.target.value)} /></label>
        <details className={s.composeOptions}><summary>Opțiuni de trimitere</summary><div className={s.optionGrid}>
          <label>Răspunde la (Reply-To)<input inputMode="email" value={value.replyTo} placeholder="Implicit: adresa expeditorului" onChange={(e) => field("replyTo", e.target.value)} /></label>
          <label>Follow-up la (Mail-Followup-To)<input inputMode="email" value={value.followUpTo} placeholder="Adrese pentru continuarea conversației" onChange={(e) => field("followUpTo", e.target.value)} /></label>
          <label>Prioritate<select value={value.priority} onChange={(e) => field("priority", e.target.value as "high" | "normal" | "low")}><option value="high">Ridicată / urgent</option><option value="normal">Normală</option><option value="low">Scăzută</option></select></label>
          <label>Formatare<select value={value.format} onChange={(e) => setValue({ ...value, format: e.target.value as "plain" | "html", bodyHtml: e.target.value === "html" ? escaped(value.body) : value.bodyHtml })}><option value="plain">Text simplu</option><option value="html">Text formatat (HTML)</option></select></label>
          <label className={s.optionCheck}><input type="checkbox" checked={value.readReceipt} onChange={(e) => field("readReceipt", e.target.checked)} />Solicită confirmare de citire / primire</label>
          <label className={s.optionCheck}><input type="checkbox" checked={value.deliveryNotification} onChange={(e) => field("deliveryNotification", e.target.checked)} />Solicită notificări de livrare (DSN)</label>
          <label className={s.optionCheck}><input type="checkbox" checked={value.saveSent} onChange={(e) => field("saveSent", e.target.checked)} />Păstrează o copie a mesajului trimis</label>
          <label>Salvează mesajul trimis în<select value={value.sentFolder} disabled={!value.saveSent} onChange={(e) => field("sentFolder", e.target.value)}><option value="">Trimise — dosarul implicit</option>{value.sentFolder && !folders.includes(value.sentFolder) && <option value={value.sentFolder}>{value.sentFolder} — verifică disponibilitatea</option>}{folders.map((path) => <option key={path} value={path}>{path}</option>)}</select></label>
        </div><p className={s.optionHelp}>Confirmările depind de serverul și aplicația destinatarului. Follow-up indică adresele pentru continuarea conversației; nu programează o retrimitere.</p>{folderError && <p className={s.formNotice}>{folderError}</p>}</details>
        <div className={s.editorLabel}>Mesaj <span>{value.format === "html" ? "Text formatat" : "Text simplu"}</span></div>
        {value.format === "html" ? <RichEditor key={value.deliveryId} html={value.bodyHtml || escaped(value.body)} disabled={busy} onChange={(bodyHtml, body) => setValue((v) => ({ ...v, bodyHtml, body }))} /> : <textarea aria-label="Conținutul mesajului" placeholder="Scrie mesajul…" maxLength={200000} value={value.body} onChange={(e) => field("body", e.target.value)} />}
        <div className={s.uploadArea}><button type="button" className={s.button} disabled={busy} onClick={() => fileInput.current?.click()}><Paperclip size={16} />{uploading ? "Se încarcă…" : "Atașează fișiere"}</button><small>Maximum 15 MB în total · 20 de fișiere</small><input ref={fileInput} type="file" multiple hidden onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; void attach(files); }} /></div>
        <div className={s.uploadList}>{value.existingAttachments?.map((a) => <div key={`original-${a.index}`}><Paperclip size={15} /><span>{a.name}<small>{Math.ceil(a.size / 1024)} KB · din mesajul original</small></span><button type="button" className={s.iconButton} aria-label={`Elimină ${a.name}`} onClick={() => field("existingAttachments", value.existingAttachments?.filter((f) => f.index !== a.index))}><X size={15} /></button></div>)}{uploads.map((a) => <div key={a.path}><Paperclip size={15} /><span>{a.name}<small>{Math.ceil(a.size / 1024)} KB · {a.status === "uploading" ? "Se încarcă…" : a.status === "error" ? "Încărcare eșuată" : "Încărcat"}</small></span><button type="button" className={s.iconButton} disabled={busy} aria-label={`Elimină ${a.name}`} onClick={() => { void removeUploads([a.path]).catch(() => {}); setUploads((rows) => rows.filter((f) => f.path !== a.path)); }}><X size={15} /></button></div>)}</div>
      </fieldset></div>
      <div className={s.composerStatus} role="status" aria-live="polite">{notice}</div>
      <div className={s.dialogFooter}><button type="submit" className={`${s.button} ${s.primary}`} disabled={busy || uploads.some((a) => a.status !== "ready")}><Send size={16} />{sending ? "Se procesează…" : "Trimite"}</button><button type="button" className={s.button} disabled={busy} onClick={() => submit(true)}>Salvează ciorna</button><span className={s.optionHelp}>{value.priority === "high" ? "Prioritate ridicată" : ""}{value.readReceipt || value.deliveryNotification ? " · Confirmări solicitate" : ""}</span></div>
    </form>
  </dialog>;
}

function RichEditor({ html, disabled, onChange }: { html: string; disabled: boolean; onChange: (html: string, text: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const initialHtml = useRef(html);
  const selection = useRef<Range | null>(null);
  useEffect(() => { if (editor.current) editor.current.innerHTML = initialHtml.current; }, []); // Initial HTML was sanitized on the server or escaped from plain text.
  function remember() { const s = window.getSelection(); if (s?.rangeCount && editor.current?.contains(s.anchorNode)) selection.current = s.getRangeAt(0).cloneRange(); }
  function change() { if (editor.current) { onChange(editor.current.innerHTML, editor.current.innerText); remember(); } }
  function command(name: string, value?: string) {
    if (disabled) return; editor.current?.focus();
    if (selection.current) { const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(selection.current); }
    document.execCommand(name, false, value); change();
  }
  const commands = [{ name: "bold", label: "Aldin", icon: Bold }, { name: "italic", label: "Cursiv", icon: Italic }, { name: "underline", label: "Subliniat", icon: Underline }, { name: "insertUnorderedList", label: "Listă cu puncte", icon: List }, { name: "insertOrderedList", label: "Listă numerotată", icon: ListOrdered }];
  return <div className={s.richWrap}><div className={s.richToolbar} role="toolbar" aria-label="Formatarea mesajului">{commands.map((c) => <button key={c.name} type="button" className={s.iconButton} disabled={disabled} title={c.label} aria-label={c.label} onMouseDown={(e) => e.preventDefault()} onClick={() => command(c.name)}><c.icon size={16} /></button>)}<button type="button" className={s.iconButton} disabled={disabled} aria-label="Inserează link" title="Inserează link" onMouseDown={(e) => e.preventDefault()} onClick={() => { const url = prompt("Adresa linkului (https://… sau mailto:…)"); if (url && /^(https?:\/\/|mailto:)/i.test(url)) command("createLink", url); }}><Link2 size={16} /></button><button type="button" className={s.button} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => command("removeFormat")}>Șterge formatarea</button></div>
    <div ref={editor} className={s.richEditor} role="textbox" aria-label="Conținutul formatat al mesajului" aria-multiline="true" contentEditable={!disabled} suppressContentEditableWarning onInput={change} onKeyUp={remember} onMouseUp={remember} onDrop={(e) => e.preventDefault()} onPaste={(e) => { e.preventDefault(); command("insertText", e.clipboardData.getData("text/plain")); }} />
  </div>;
}
