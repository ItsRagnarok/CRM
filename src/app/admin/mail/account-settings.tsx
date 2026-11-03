"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mail, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import type { MailAccount, MailSettings } from "@/lib/mail/types";
import { configureMailAccount, disconnectMailAccount } from "./actions";
import s from "./mail.module.css";

const EMPTY: MailSettings = { name: "", address: "", username: "", incomingHost: "", incomingPort: 993, incomingSecurity: "tls", outgoingHost: "", outgoingPort: 465, outgoingSecurity: "tls", outgoingUsername: "" };
export function AccountSettings({ accounts, onAccounts, onClose }: { accounts: MailAccount[]; onAccounts: (accounts: MailAccount[]) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<MailAccount | null>(null);
  const [adding, setAdding] = useState(accounts.length === 0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => { ref.current?.showModal(); }, []);
  async function remove(account: MailAccount) {
    if (!confirm(`Deconectezi ${account.address}? Mesajele rămân pe serverul Hostico.`)) return;
    setBusy(true); setNotice("");
    try {
      const result = await disconnectMailAccount(account.id);
      if (result.error) setNotice(result.error);
      else if (result.data) { onAccounts(result.data); setNotice("Adresa a fost deconectată. Mesajele de pe server nu au fost șterse."); }
    } catch { setNotice("Operația nu a putut fi confirmată. Reîncarcă pagina pentru a verifica lista adreselor."); }
    finally { setBusy(false); }
  }
  return <dialog ref={ref} className={`${s.dialog} ${s.settingsDialog}`} aria-labelledby="mail-settings-title" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className={s.dialogHeading}><h2 id="mail-settings-title">Adrese de email<small>Hostico · configurare IMAP și SMTP</small></h2><button className={s.iconButton} disabled={busy} onClick={onClose} aria-label="Închide configurarea"><X size={20} /></button></div>
    <div className={s.settingsBody}>
      <div className={s.settingsPermission}><ShieldCheck size={20} /><p>Doar Super Admin poate conecta și folosi aceste adrese. Parolele sunt păstrate criptat și nu sunt afișate după salvare.</p></div>
      {!!accounts.length && <div className={s.settingsAccounts}>{accounts.map((a) => <div key={a.id}><Mail size={18} /><span><strong>{a.name}</strong><small>{a.address}</small><small>Verificat: {new Date(a.verifiedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</small></span><button className={s.iconButton} disabled={busy} aria-label={`Editează ${a.address}`} onClick={() => { setEditing(a); setAdding(false); setNotice(""); }}><Pencil size={16} /></button><button className={s.iconButton} disabled={busy} aria-label={`Deconectează ${a.address}`} onClick={() => remove(a)}><Trash2 size={16} /></button></div>)}</div>}
      {!adding && !editing && <button className={`${s.button} ${s.primary}`} disabled={busy} onClick={() => { setAdding(true); setNotice(""); }}><Plus size={17} />Adaugă adresă</button>}
      {(adding || editing) && <AccountForm key={editing?.id ?? "new"} account={editing} onBusy={setBusy} onSaved={(rows) => { onAccounts(rows); setAdding(false); setEditing(null); setNotice("Adresă conectată. IMAP și SMTP au fost verificate."); }} onCancel={() => { setEditing(null); setAdding(false); }} />}
      {notice && <p className={s.formNotice} role="status">{notice}</p>}
    </div>
  </dialog>;
}
function AccountForm({ account, onBusy, onSaved, onCancel }: { account: MailAccount | null; onBusy: (busy: boolean) => void; onSaved: (rows: MailAccount[]) => void; onCancel: () => void }) {
  const [settings, setSettings] = useState<MailSettings>(account ?? EMPTY);
  const [password, setPassword] = useState("");
  const [outgoingPassword, setOutgoingPassword] = useState("");
  const [separateSmtp, setSeparateSmtp] = useState(account?.separateSmtp ?? (!!account && account.username !== account.outgoingUsername));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  function field<K extends keyof MailSettings>(key: K, value: MailSettings[K]) { setSettings((v) => ({ ...v, [key]: value })); setNotice(""); }
  async function configure(save: boolean) {
    setBusy(true); onBusy(true); setNotice(save ? "Verific IMAP și SMTP, apoi salvez adresa…" : "Verific autentificarea IMAP și SMTP…");
    try {
      const result = await configureMailAccount({ ...settings, separateSmtp, username: settings.username || settings.address,
        outgoingUsername: separateSmtp ? settings.outgoingUsername : settings.username || settings.address,
        password, outgoingPassword: separateSmtp ? outgoingPassword : password }, account?.id ?? null, save);
      if (result.error) setNotice(result.error);
      else if (result.data) {
        setNotice(result.data.message);
        if (save) { setPassword(""); setOutgoingPassword(""); onSaved(result.data.accounts); }
      }
    } catch { setNotice("Nu am primit confirmarea serverului. Verifică lista adreselor după reîncărcare înainte de a salva din nou."); }
    finally { setBusy(false); onBusy(false); }
  }
  return <form className={s.accountForm} onSubmit={(e) => { e.preventDefault(); void configure(true); }}>
    <h3>{account ? `Editează ${account.address}` : "Conectează o adresă"}</h3>
    <p>Copiază datele din Hostico → Email Accounts → Connect Devices → <strong>Mail Client Manual Settings</strong>. Folosește setările securizate pentru IMAP, nu POP3.</p>
    <fieldset disabled={busy} className={s.formGrid}>
      <label>Nume afișat<input required maxLength={80} value={settings.name} placeholder="Contact ElectroField" onChange={(e) => field("name", e.target.value)} /></label>
      <label>Adresă de email<input required type="email" value={settings.address} autoComplete="off" placeholder="contact@electrofield.ro" onChange={(e) => field("address", e.target.value)} /></label>
      <label>Username<input value={settings.username} autoComplete="off" placeholder={settings.address || "Adresa completă de email"} onChange={(e) => field("username", e.target.value)} /></label>
      <label>Parola căsuței<input type="password" required={!account} autoComplete="new-password" maxLength={2048} value={password} placeholder={account ? "Lasă gol pentru a păstra parola" : "Parola acestei adrese de email"} onChange={(e) => setPassword(e.target.value)} /></label>
      <div className={s.formSection}>Incoming server · IMAP</div>
      <label>Server IMAP<input required value={settings.incomingHost} placeholder="mail.exemplu.ro" onChange={(e) => field("incomingHost", e.target.value)} /></label>
      <label>Securitate<select value={settings.incomingSecurity} onChange={(e) => { field("incomingSecurity", e.target.value as "tls" | "starttls"); field("incomingPort", e.target.value === "tls" ? 993 : 143); }}><option value="tls">SSL/TLS — recomandat</option><option value="starttls">STARTTLS — obligatoriu</option></select></label>
      <label>Port IMAP<input required type="number" min={1} max={65535} value={settings.incomingPort} onChange={(e) => field("incomingPort", Number(e.target.value))} /></label>
      <div className={s.formSection}>Outgoing server · SMTP</div>
      <label>Server SMTP<input required value={settings.outgoingHost} placeholder="mail.exemplu.ro" onChange={(e) => field("outgoingHost", e.target.value)} /></label>
      <label>Securitate<select value={settings.outgoingSecurity} onChange={(e) => { field("outgoingSecurity", e.target.value as "tls" | "starttls"); field("outgoingPort", e.target.value === "tls" ? 465 : 587); }}><option value="tls">SSL/TLS</option><option value="starttls">STARTTLS — obligatoriu</option></select></label>
      <label>Port SMTP<input required type="number" min={1} max={65535} value={settings.outgoingPort} onChange={(e) => field("outgoingPort", Number(e.target.value))} /></label>
      <label className={s.checkField}><input type="checkbox" checked={separateSmtp} onChange={(e) => setSeparateSmtp(e.target.checked)} />SMTP are username sau parolă diferită</label>
      {separateSmtp && <><label>Username SMTP<input required value={settings.outgoingUsername} autoComplete="off" onChange={(e) => field("outgoingUsername", e.target.value)} /></label><label>Parolă SMTP<input type="password" autoComplete="new-password" required={!account} value={outgoingPassword} placeholder={account ? "Lasă gol pentru a păstra parola SMTP" : "Parola SMTP"} onChange={(e) => setOutgoingPassword(e.target.value)} /></label></>}
    </fieldset>
    <p className={s.formNotice} role="status" aria-live="polite">{notice}</p>
    <div className={s.formActions}><button type="submit" className={`${s.button} ${s.primary}`} disabled={busy}><Check size={16} />{busy ? "Se verifică…" : "Verifică și salvează"}</button><button type="button" className={s.button} disabled={busy} onClick={(e) => { if (e.currentTarget.form?.reportValidity()) void configure(false); }}>Testează conexiunea</button><button type="button" className={s.button} disabled={busy} onClick={onCancel}>Anulează</button></div>
  </form>;
}
