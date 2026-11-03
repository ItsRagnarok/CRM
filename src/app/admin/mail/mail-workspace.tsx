"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FilePenLine, Forward, Inbox, LayoutGrid, Mail, MailOpen, MessagesSquare, RefreshCw, Reply, Search, Send, Settings2, ShieldAlert, ShieldCheck, SquarePen, Trash2, X } from "lucide-react";
import type { MailAccount, MailFolder, MailMessage, MailReference, MailView } from "@/lib/mail/types";
import { changeMailMessage, fetchMailFolders, fetchMailMessage, submitMail } from "./actions";
import { AccountSettings } from "./account-settings";
import s from "./mail.module.css";

const FOLDERS = [
  { id: "inbox", name: "Primite", icon: Inbox }, { id: "sent", name: "Trimise", icon: Send },
  { id: "draft", name: "Ciorne", icon: FilePenLine }, { id: "spam", name: "Spam", icon: ShieldAlert }, { id: "trash", name: "Coș", icon: Trash2 },
] satisfies { id: MailFolder; name: string; icon: typeof Mail }[];
type Draft = { accountId: string; to: string; subject: string; body: string; deliveryId: string; reply?: MailReference; draftRef?: MailReference };
function when(timestamp: string, detailed = false) { return new Date(timestamp).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", ...(detailed ? { dateStyle: "medium", timeStyle: "short" } : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) }); }
function initials(name: string) { return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }

export function MailWorkspace({ initialAccounts }: { initialAccounts: MailAccount[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [view, setView] = useState<MailView>("unified");
  const [accountId, setAccountId] = useState("all");
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const composeRef = useRef<HTMLDialogElement>(null);
  const readVersion = useRef(0);
  const submitting = useRef(false);

  useEffect(() => { try { if (localStorage.getItem("ef-mail-view") === "accounts") setView("accounts"); } catch {} }, []);
  useEffect(() => { if (draft && !composeRef.current?.open) composeRef.current?.showModal(); if (!draft && composeRef.current?.open) composeRef.current.close(); }, [draft]);
  useEffect(() => {
    let active = true;
    setLoading(true); setErrors([]);
    if (page === 0) { setMessages([]); setSelected(null); readVersion.current++; setReading(false); }
    const visible = accounts.filter((a) => accountId === "all" || a.id === accountId);
    fetchMailFolders(visible.map((a) => a.id), folder, page).then((result) => {
      if (!active) return;
      if (result.error) { setErrors([result.error]); setLoading(false); return; }
      const rows = result.data ?? [];
      const newMessages = rows.flatMap((r) => r.data?.messages ?? []);
      setMessages((previous) => [...(page ? previous : []), ...newMessages].filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      setCounts((previous) => ({ ...previous, ...Object.fromEntries(rows.filter((r) => r.data).map((r) => [r.accountId, r.data!.unread])) }));
      setHasMore(rows.some((r) => r.data?.hasMore));
      setErrors(rows.filter((r) => r.error).map((r) => `${accounts.find((a) => a.id === r.accountId)?.address}: ${r.error}`));
      setLoading(false);
    }).catch(() => {
      if (active) { setErrors(["Conexiunea cu platforma a fost întreruptă. Reîncarcă mesajele."]); setLoading(false); }
    });
    return () => { active = false; };
  }, [accounts, accountId, folder, page, refresh]);

  const filtered = messages.filter((m) => `${m.name} ${m.address} ${m.subject}`.toLocaleLowerCase("ro").includes(query.trim().toLocaleLowerCase("ro")));
  const selectedAccount = accounts.find((a) => a.id === selected?.accountId);
  const unread = (id: string) => id === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[id] ?? 0;
  function reload() { setPage(0); setRefresh((v) => v + 1); }
  function selectAccount(id: string) { setAccountId(id); setPage(0); setSelected(null); readVersion.current++; }
  function selectFolder(id: MailFolder) { setFolder(id); setPage(0); setSelected(null); readVersion.current++; }
  function changeView(next: MailView) { setView(next); try { localStorage.setItem("ef-mail-view", next); } catch {} }
  function updateAccounts(rows: MailAccount[]) { setAccounts(rows); setCounts({}); if (accountId !== "all" && !rows.some((a) => a.id === accountId)) setAccountId("all"); setPage(0); }
  async function openMessage(message: MailMessage) {
    const version = ++readVersion.current;
    setSelected(message); setReading(true); setNotice("");
    try {
      const result = await fetchMailMessage(message);
      if (version !== readVersion.current) return;
      if (result.error) setNotice(result.error);
      else if (result.data) {
        setSelected(result.data); setMessages((rows) => rows.map((m) => m.id === message.id ? result.data! : m));
        if (message.unread && message.folder === "inbox") setCounts((v) => ({ ...v, [message.accountId]: Math.max(0, (v[message.accountId] ?? 0) - 1) }));
      }
    } catch { if (version === readVersion.current) setNotice("Mesajul nu a putut fi încărcat. Reîncearcă."); }
    finally { if (version === readVersion.current) setReading(false); }
  }
  function compose(mode: "new" | "reply" | "forward" | "edit" = "new") {
    if (!accounts.length || (mode !== "new" && (!selected || selected.body === undefined))) return;
    const m = mode === "new" ? null : selected;
    setDraft({ accountId: m?.accountId ?? (accountId === "all" ? accounts[0].id : accountId),
      to: mode === "reply" ? m?.replyTo || m?.address || "" : mode === "edit" ? m?.to || "" : "",
      subject: mode === "reply" ? `Re: ${(m?.subject || "").replace(/^Re:\s*/i, "")}` : mode === "forward" ? `Fwd: ${m?.subject || ""}` : mode === "edit" ? m?.subject || "" : "",
      body: mode === "forward" ? `\n\n—— Mesaj redirecționat ——\n${m?.body || ""}` : mode === "edit" ? m?.body || "" : "",
      deliveryId: crypto.randomUUID(), reply: mode === "reply" ? m ?? undefined : undefined, draftRef: mode === "edit" ? m ?? undefined : undefined });
  }
  function closeCompose() { if (working) return; if (draft && (draft.to || draft.subject || draft.body) && !confirm("Închizi fără să salvezi ciorna?")) return; setDraft(null); }
  async function storeDraft(saveDraft: boolean) {
    if (!draft || submitting.current) return;
    submitting.current = true; setWorking(true); setNotice("");
    try {
      const result = await submitMail(draft, saveDraft);
      if (result.error) setNotice(result.error);
      else if (result.data) {
        setNotice(result.data.warning || (saveDraft ? "Ciornă salvată pe server." : "Mesaj acceptat de serverul SMTP."));
        setAccountId(draft.accountId); setFolder(saveDraft ? "draft" : "sent"); setDraft(null); setQuery(""); reload();
      }
    } catch { setNotice(saveDraft ? "Salvarea nu a putut fi confirmată. Verifică dosarul Ciorne înainte de a salva din nou." : "Trimiterea nu a putut fi confirmată. Verifică dosarul Trimise înainte de a reîncerca."); }
    finally { setWorking(false); submitting.current = false; }
  }
  async function updateMessage(action: "unread" | "trash") {
    if (!selected || working) return;
    setWorking(true); setNotice("");
    try {
      const result = await changeMailMessage(selected, action);
      if (result.error) setNotice(result.error);
      else { setNotice(action === "trash" ? "Mesaj mutat în Coș pe server." : "Mesaj marcat ca necitit."); reload(); }
    } catch { setNotice("Operația nu a putut fi confirmată. Reîncarcă lista."); }
    finally { setWorking(false); }
  }
  function accountButtons(cards: boolean) { return <>
    <button type="button" className={`${cards ? s.accountCard : s.account} ${accountId === "all" ? s.active : ""}`} aria-pressed={accountId === "all"} onClick={() => selectAccount("all")}><span className={s.avatar}><Inbox size={17} /></span><span className={s.accountText}><strong>Toate adresele</strong><small>{accounts.length} adrese conectate</small></span><span className={s.count}>{unread("all")}</span></button>
    {accounts.map((a) => <button type="button" key={a.id} className={`${cards ? s.accountCard : s.account} ${accountId === a.id ? s.active : ""}`} aria-pressed={accountId === a.id} onClick={() => selectAccount(a.id)}><span className={s.avatar}>{initials(a.name)}</span><span className={s.accountText}><strong>{a.name}</strong><small>{a.address}</small></span><span className={s.count}>{unread(a.id)}</span></button>)}
  </>; }
  const folderButtons = FOLDERS.map((f) => <button type="button" key={f.id} className={`${s.folder} ${folder === f.id ? s.active : ""}`} aria-pressed={folder === f.id} onClick={() => selectFolder(f.id)}><f.icon size={16} />{f.name}</button>);
  const messageReady = !!selected && selected.body !== undefined && !reading;
  return <div className={s.mail}>
    <div className={s.heading}><div><h1>Mail</h1><p>Toată corespondența ElectroField, într-un singur loc.</p></div><div className={s.headingActions}>
      <div className={s.viewSwitch} role="group" aria-label="Afișarea căsuțelor"><button aria-pressed={view === "unified"} onClick={() => changeView("unified")}><MessagesSquare size={16} />Inbox unificat</button><button aria-pressed={view === "accounts"} onClick={() => changeView("accounts")}><LayoutGrid size={16} />Pe adrese</button></div>
      <button className={s.button} onClick={() => setShowAccounts(true)}><Settings2 size={16} />Adrese</button><button className={`${s.button} ${s.primary}`} disabled={!accounts.length} onClick={() => compose()}><SquarePen size={16} />Mesaj nou</button>
    </div></div>
    {!accounts.length && <div className={s.banner}><span><Mail size={18} /><span><strong>Conectează prima adresă de email.</strong> Introdu setările IMAP și SMTP din Hostico.</span></span><button onClick={() => setShowAccounts(true)}>Adaugă adresă</button></div>}
    {!!errors.length && <div className={s.connectionErrors} role="alert">{errors.map((error) => <p key={error}>{error}</p>)}<button className={s.button} onClick={reload}>Reîncearcă</button></div>}
    {view === "accounts" && <><div className={s.accountCards}>{accountButtons(true)}</div><div className={s.folderBar} aria-label="Dosare">{folderButtons}</div></>}
    <div className={`${s.workspace} ${view === "accounts" ? s.accountsView : ""} ${selected ? s.mobileReading : ""}`}>
      {view === "unified" && <aside className={s.sidebar} aria-label="Adrese și dosare"><div className={s.sectionLabel}>Căsuțe poștale</div><div className={s.accountList}>{accountButtons(false)}</div><div className={s.sectionLabel}>Dosare</div><div className={s.folders}>{folderButtons}</div><div className={s.permission}><ShieldCheck size={16} /><span>Acces exclusiv<br />Super Admin</span></div></aside>}
      <section className={s.messageList} aria-label="Lista mesajelor" aria-busy={loading}><div className={s.search}><Search size={16} /><input type="search" placeholder="Caută în mesajele încărcate…" aria-label="Caută în expeditori și subiectele mesajelor încărcate" value={query} onChange={(e) => setQuery(e.target.value)} /><button className={s.iconButton} disabled={loading || !accounts.length} onClick={reload} aria-label="Actualizează mesajele"><RefreshCw size={16} /></button></div>
        <div className={s.listHeading}><span>{accountId === "all" ? "Toate adresele" : accounts.find((a) => a.id === accountId)?.name}<small>{FOLDERS.find((f) => f.id === folder)?.name}</small></span><span>{loading ? "Se încarcă…" : `${filtered.length} mesaje`}</span></div>
        {!filtered.length && <div className={s.emptyList}><Inbox size={28} /><strong>{loading ? "Se încarcă mesajele…" : accounts.length ? "Niciun mesaj afișat" : "Conectează adresele tale"}</strong><p>{accounts.length ? "Verifică dosarul, filtrul și starea conexiunilor." : "Adaugă datele din Mail Client Manual Settings pentru a vedea corespondența reală."}</p>{!accounts.length && <button className={`${s.button} ${s.primary}`} onClick={() => setShowAccounts(true)}>Adaugă adresă</button>}</div>}
        {filtered.map((m) => <button key={m.id} className={`${s.message} ${selected?.id === m.id ? s.selectedMessage : ""}`} aria-pressed={selected?.id === m.id} onClick={() => openMessage(m)}><span className={s.messageTop}><strong>{m.name}</strong><time dateTime={m.timestamp}>{when(m.timestamp)}</time></span><span className={s.subject}>{m.subject}</span><span className={s.snippet}>{m.address}</span><span className={s.messageFoot}>{m.unread && <span className={s.unreadDot} aria-label="Necitit" />}<span>{accounts.find((a) => a.id === m.accountId)?.name}</span></span></button>)}
        {hasMore && <div className={s.loadMore}><button className={s.button} disabled={loading} onClick={() => setPage((v) => v + 1)}>{loading ? "Se încarcă…" : "Încarcă mesaje mai vechi"}</button></div>}
      </section>
      <section className={s.reader} aria-label="Citire mesaj" aria-busy={reading}>{!selected || !selectedAccount ? <div className={s.emptyReader}><MailOpen size={38} /><h2>{accounts.length ? "Alege un mesaj" : "Corespondența ta, organizată"}</h2><p>{accounts.length ? "Citește și răspunde direct de pe adresa care a primit mesajul." : "Inbox comun sau câte o adresă. Adaugă căsuțele tale Hostico pentru a începe."}</p>{!accounts.length && <button className={`${s.button} ${s.primary}`} onClick={() => setShowAccounts(true)}>Conectează o adresă</button>}</div> : <>
        <div className={s.readerToolbar}><div><button className={`${s.iconButton} ${s.backButton}`} aria-label="Înapoi la mesaje" onClick={() => { setSelected(null); readVersion.current++; setReading(false); }}><ArrowLeft size={18} /></button><button className={s.button} disabled={!messageReady || working} onClick={() => compose(selected.folder === "draft" ? "edit" : "reply")}><Reply size={16} />{selected.folder === "draft" ? "Editează ciorna" : "Răspunde"}</button></div><div><button className={s.iconButton} disabled={!messageReady || working} aria-label="Redirecționează textul mesajului" onClick={() => compose("forward")}><Forward size={17} /></button><button className={s.iconButton} disabled={working || reading} aria-label="Marchează ca necitit" onClick={() => updateMessage("unread")}><Mail size={17} /></button><button className={s.iconButton} disabled={working || reading || folder === "trash"} aria-label="Mută în Coș" onClick={() => updateMessage("trash")}><Trash2 size={17} /></button></div></div>
        <h2>{selected.subject}</h2><div className={s.sender}><span className={s.senderAvatar}>{initials(selected.name)}</span><div><strong>{folder === "sent" || folder === "draft" ? selectedAccount.name : selected.name}</strong><span>{folder === "sent" || folder === "draft" ? selectedAccount.address : selected.address}</span><span>Către: {selected.to}</span></div><time dateTime={selected.timestamp}>{when(selected.timestamp, true)}</time></div>
        <div className={s.body}>{reading ? "Se încarcă mesajul…" : selected.body ?? "Mesajul nu a fost încărcat."}</div>
        {selected.attachments?.map((a) => <a key={a.index} className={s.attachment} href={`/api/admin/mail/attachment?${new URLSearchParams({ accountId: selected.accountId, folder: selected.folder, uid: String(selected.uid), uidValidity: selected.uidValidity, index: String(a.index) })}`}><Download size={21} /><div><strong>{a.name}</strong><span>{Math.ceil(a.size / 1024)} KB · descarcă</span></div></a>)}
        <button className={s.replyBox} disabled={!messageReady || working} onClick={() => compose(selected.folder === "draft" ? "edit" : "reply")}><Reply size={17} />{selected.folder === "draft" ? "Continuă ciorna" : `Răspunde de pe ${selectedAccount.address}`}</button>
      </>}</section>
    </div>
    <div className={s.footer}><span><ShieldCheck size={14} />{accounts.length} adrese configurate · IMAP / SMTP securizat</span><span role="status" aria-live="polite">{notice}</span></div>
    {showAccounts && <AccountSettings accounts={accounts} onAccounts={updateAccounts} onClose={() => setShowAccounts(false)} />}
    <dialog ref={composeRef} className={s.dialog} aria-labelledby="mail-compose-title" onCancel={(e) => { e.preventDefault(); closeCompose(); }}>{draft && <form onSubmit={(e) => { e.preventDefault(); void storeDraft(false); }}>
      <div className={s.dialogHeading}><h2 id="mail-compose-title">{draft.draftRef ? "Editează ciorna" : "Mesaj nou"}</h2><button type="button" className={s.iconButton} disabled={working} onClick={closeCompose} aria-label="Închide compunerea"><X size={19} /></button></div>
      <fieldset disabled={working} className={s.composeFields}><label><span>De la</span><select value={draft.accountId} disabled={!!draft.reply || !!draft.draftRef} onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.address}</option>)}</select></label><label><span>Către</span><input type="email" required value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label><label><span>Subiect</span><input required maxLength={500} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label><textarea aria-label="Conținutul mesajului" placeholder="Scrie mesajul…" maxLength={200000} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /><p className={s.formNotice} role="status">{notice}</p></fieldset>
      <div className={s.dialogFooter}><button type="submit" className={`${s.button} ${s.primary}`} disabled={working}><Send size={16} />{working ? "Se procesează…" : "Trimite"}</button><button type="button" className={s.button} disabled={working} onClick={() => storeDraft(true)}>Salvează ciorna</button></div>
    </form>}</dialog>
  </div>;
}
