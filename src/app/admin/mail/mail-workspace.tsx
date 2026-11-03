"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, FilePenLine, FileText, Forward, Inbox, LayoutGrid,
  Mail, MailOpen, MessagesSquare, Paperclip, Reply, Search, Send, Settings2,
  ShieldAlert, ShieldCheck, SquarePen, Trash2, X,
} from "lucide-react";
import { DEMO_ACCOUNTS, DEMO_MESSAGES, type MailFolder, type MailMessage, type MailView } from "./mail-demo";
import s from "./mail.module.css";

const FOLDERS = [
  { id: "inbox", name: "Primite", icon: Inbox },
  { id: "sent", name: "Trimise", icon: Send },
  { id: "draft", name: "Ciorne", icon: FilePenLine },
  { id: "spam", name: "Spam", icon: ShieldAlert },
  { id: "trash", name: "Coș", icon: Trash2 },
] satisfies { id: MailFolder; name: string; icon: typeof Mail }[];

type Draft = { accountId: string; to: string; subject: string; body: string; existingId?: string };

export function MailWorkspace() {
  const [view, setView] = useState<MailView>("unified");
  const [demo, setDemo] = useState(false);
  const [accountId, setAccountId] = useState("all");
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileReader, setMobileReader] = useState(false);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const composeRef = useRef<HTMLDialogElement>(null);
  const accountsRef = useRef<HTMLDialogElement>(null);
  const accounts = demo ? DEMO_ACCOUNTS : [];

  useEffect(() => {
    try { if (localStorage.getItem("ef-mail-view") === "accounts") setView("accounts"); } catch { /* Preference storage is optional. */ }
  }, []);
  useEffect(() => {
    const dialog = composeRef.current;
    if (!dialog) return;
    if (draft && !dialog.open) dialog.showModal();
    if (!draft && dialog.open) dialog.close();
  }, [draft]);
  useEffect(() => {
    const dialog = accountsRef.current;
    if (!dialog) return;
    if (showAccounts && !dialog.open) dialog.showModal();
    if (!showAccounts && dialog.open) dialog.close();
  }, [showAccounts]);

  const search = query.trim().toLocaleLowerCase("ro");
  const filtered = messages.filter((m) => (accountId === "all" || m.accountId === accountId) && m.folder === folder
    && (!search || `${m.name} ${m.address} ${m.subject} ${m.body}`.toLocaleLowerCase("ro").includes(search)));
  const selected = filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? null;
  const selectedAccount = accounts.find((a) => a.id === selected?.accountId);
  const unread = (id: string) => messages.filter((m) => m.folder === "inbox" && m.unread && (id === "all" || m.accountId === id)).length;
  const mailboxTitle = accountId === "all" ? "Toate adresele" : accounts.find((a) => a.id === accountId)?.name ?? "Mail";
  const currentFolder = FOLDERS.find((f) => f.id === folder)!;

  function changeView(next: MailView) {
    setView(next);
    try { localStorage.setItem("ef-mail-view", next); } catch { /* Keep the switch usable without localStorage. */ }
  }
  function toggleDemo() {
    if (demo && !confirm("Închizi demonstrația? Mesajele și ciornele simulate vor fi eliminate.")) return;
    setDemo(!demo); setMessages(demo ? [] : DEMO_MESSAGES.map((m) => ({ ...m })));
    setAccountId("all"); setFolder("inbox"); setSelectedId(null); setQuery(""); setMobileReader(false);
    setNotice(demo ? "Demonstrația a fost închisă." : "Date demonstrative. Nu se trimit sau primesc emailuri reale.");
  }
  function selectAccount(id: string) { setAccountId(id); setSelectedId(null); setMobileReader(false); }
  function selectFolder(id: MailFolder) { setFolder(id); setSelectedId(null); setMobileReader(false); }
  function openMessage(message: MailMessage) {
    setSelectedId(message.id); setMobileReader(true);
    setMessages((rows) => rows.map((m) => m.id === message.id ? { ...m, unread: false } : m));
  }
  function compose(mode: "new" | "reply" | "forward" | "edit" = "new") {
    if (!demo) return;
    const message = mode === "new" ? null : selected;
    const from = message?.accountId ?? (accountId === "all" ? accounts[0].id : accountId);
    setDraft({
      accountId: from,
      to: mode === "reply" || mode === "edit" ? message?.address ?? "" : "",
      subject: mode === "reply" ? `Re: ${(message?.subject ?? "").replace(/^Re:\s*/i, "")}` : mode === "forward" ? `Fwd: ${message?.subject ?? ""}` : mode === "edit" ? message?.subject ?? "" : "",
      body: mode === "reply" ? `Bună, ${message?.name.split(" ")[0] ?? ""},\n\n` : mode === "forward" ? `\n\n—— Mesaj redirecționat ——\n${message?.body ?? ""}` : mode === "edit" ? message?.body ?? "" : "",
      existingId: mode === "edit" ? message?.id : undefined,
    });
  }
  function storeDraft(sent: boolean) {
    if (!draft || !demo) return;
    const account = accounts.find((a) => a.id === draft.accountId);
    if (!account) return;
    const message: MailMessage = {
      id: draft.existingId ?? crypto.randomUUID(), accountId: account.id, folder: sent ? "sent" : "draft", outgoing: true,
      name: draft.to.trim() || "Ciornă", address: draft.to.trim(), subject: draft.subject.trim() || "(Fără subiect)",
      body: sent ? `${draft.body}\n\nEchipa ElectroField\n${account.address}` : draft.body,
      time: "Acum", date: "Acum · simulare", unread: false,
    };
    setMessages((rows) => [message, ...rows.filter((m) => m.id !== message.id)]);
    setAccountId(account.id); setFolder(message.folder); setSelectedId(message.id); setQuery(""); setMobileReader(true); setDraft(null);
    setNotice(sent ? "Mesaj simulat în Trimise. Nu a fost expediat niciun email real." : "Ciornă demonstrativă salvată până la reîncărcarea paginii.");
  }
  function closeCompose() {
    if (draft && (draft.to || draft.subject || draft.body) && !confirm("Închizi compunerea fără să salvezi ciorna?")) return;
    setDraft(null);
  }
  function updateMessage(action: "unread" | "trash") {
    if (!selected) return;
    const id = selected.id;
    setMessages((rows) => rows.map((m) => m.id === id ? action === "unread" ? { ...m, unread: true } : { ...m, folder: "trash" } : m));
    if (action === "trash") { setSelectedId(null); setMobileReader(false); }
    setNotice(action === "unread" ? "Mesaj marcat ca necitit în demonstrație." : "Mesaj mutat în Coș în demonstrație.");
  }

  function accountButtons(cards: boolean) {
    return <>
      <button type="button" className={`${cards ? s.accountCard : s.account} ${accountId === "all" ? s.active : ""}`} aria-pressed={accountId === "all"} onClick={() => selectAccount("all")}>
        <span className={s.avatar}><Inbox size={17} /></span>
        <span className={s.accountText}><strong>Toate adresele</strong><small>{demo ? "5 căsuțe · inbox comun" : "Nicio adresă conectată"}</small></span>
        <span className={s.count}>{unread("all")}</span>
      </button>
      {accounts.map((account) => <button type="button" key={account.id} className={`${cards ? s.accountCard : s.account} ${accountId === account.id ? s.active : ""}`} aria-pressed={accountId === account.id} onClick={() => selectAccount(account.id)}>
        <span className={s.avatar}>{account.initials}</span><span className={s.accountText}><strong>{account.name}</strong><small>{account.address}</small></span><span className={s.count}>{unread(account.id)}</span>
      </button>)}
    </>;
  }
  const folderButtons = FOLDERS.map((item) => <button key={item.id} type="button" className={`${s.folder} ${folder === item.id ? s.active : ""}`} aria-pressed={folder === item.id} onClick={() => selectFolder(item.id)}><item.icon size={16} /><span>{item.name}</span></button>);

  return <div className={s.mail}>
    <div className={s.heading}>
      <div><h1>Mail</h1><p>Toată corespondența ElectroField, într-un singur loc.</p></div>
      <div className={s.headingActions}>
        <div className={s.viewSwitch} role="group" aria-label="Afișarea căsuțelor poștale">
          <button type="button" aria-pressed={view === "unified"} onClick={() => changeView("unified")}><MessagesSquare size={16} /><span>Inbox unificat</span></button>
          <button type="button" aria-pressed={view === "accounts"} onClick={() => changeView("accounts")}><LayoutGrid size={16} /><span>Pe adrese</span></button>
        </div>
        <button type="button" className={s.button} onClick={() => setShowAccounts(true)}><Settings2 size={16} />Adrese</button>
        <button type="button" className={`${s.button} ${s.primary}`} disabled={!demo} onClick={() => compose()}><SquarePen size={16} />Mesaj nou</button>
      </div>
    </div>

    <div className={`${s.banner} ${demo ? s.demoBanner : ""}`}>
      <span><Mail size={17} /><span>{demo ? <><strong>Mod demonstrație</strong> · adrese și mesaje fictive, fără conexiune Hostico.</> : <><strong>Pregătit pentru conectarea adreselor Hostico.</strong> Nu există încă adrese conectate.</>}</span></span>
      <button type="button" onClick={toggleDemo}>{demo ? "Închide demonstrația" : "Vezi demonstrația"}<ArrowRight size={14} /></button>
    </div>

    {view === "accounts" && <><div className={s.accountCards}>{accountButtons(true)}</div><div className={s.folderBar} aria-label="Dosare">{folderButtons}</div></>}

    <div className={`${s.workspace} ${view === "accounts" ? s.accountsView : ""} ${mobileReader ? s.mobileReading : ""}`}>
      {view === "unified" && <aside className={s.sidebar} aria-label="Adrese și dosare">
        <div className={s.sectionLabel}>Căsuțe poștale</div><div className={s.accountList}>{accountButtons(false)}</div>
        <div className={s.sectionLabel}>Dosare</div><div className={s.folders}>{folderButtons}</div>
        <div className={s.permission}><ShieldCheck size={16} /><span>Acces exclusiv<br />Super Admin</span></div>
      </aside>}

      <section className={s.messageList} aria-label="Lista mesajelor">
        <div className={s.search}><Search size={16} /><input type="search" aria-label="Caută în mesaje" placeholder="Caută în mesaje…" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }} disabled={!demo} /></div>
        <div className={s.listHeading}><span>{mailboxTitle}<small>{currentFolder.name}</small></span><span>{filtered.length} mesaje</span></div>
        {!filtered.length && <div className={s.emptyList}><Inbox size={27} /><strong>{demo ? "Niciun mesaj" : "Căsuțele nu sunt conectate"}</strong><p>{demo ? "Încearcă alt dosar sau altă adresă." : "După conectarea la Hostico, mesajele vor apărea aici."}</p></div>}
        {filtered.map((message) => <button type="button" key={message.id} className={`${s.message} ${selected?.id === message.id ? s.selectedMessage : ""}`} aria-pressed={selected?.id === message.id} onClick={() => openMessage(message)}>
          <span className={s.messageTop}><strong>{message.name}</strong><time>{message.time}</time></span>
          <span className={s.subject}>{message.subject}</span><span className={s.snippet}>{message.body.replace(/\n/g, " ")}</span>
          <span className={s.messageFoot}>{message.unread && <span className={s.unreadDot} aria-label="Necitit" />}<span>{accounts.find((a) => a.id === message.accountId)?.name}</span>{message.attachment && <Paperclip size={12} />}</span>
        </button>)}
      </section>

      <section className={s.reader} aria-label="Citire mesaj">
        {!selected || !selectedAccount ? <div className={s.emptyReader}><MailOpen size={38} /><h2>{demo ? "Alege un mesaj" : "Corespondența ta, organizată"}</h2><p>{demo ? "Mesajul ales va fi afișat aici." : "Folosește inboxul comun sau lucrează separat pe fiecare adresă. Ambele afișări includ opțiunea «Toate adresele»."}</p>{!demo && <button type="button" className={`${s.button} ${s.primary}`} onClick={toggleDemo}>Explorează interfața</button>}</div> : <>
          <div className={s.readerToolbar}><div><button type="button" className={`${s.iconButton} ${s.backButton}`} onClick={() => setMobileReader(false)} aria-label="Înapoi la mesaje"><ArrowLeft size={18} /></button><button type="button" className={s.button} onClick={() => compose(selected.folder === "draft" ? "edit" : "reply")}><Reply size={16} />{selected.folder === "draft" ? "Editează ciorna" : "Răspunde"}</button></div><div><button type="button" className={s.iconButton} onClick={() => compose("forward")} aria-label="Redirecționează mesajul"><Forward size={17} /></button><button type="button" className={s.iconButton} onClick={() => updateMessage("unread")} aria-label="Marchează ca necitit"><Mail size={17} /></button><button type="button" className={s.iconButton} disabled={selected.folder === "trash"} onClick={() => updateMessage("trash")} aria-label="Mută în Coș"><Trash2 size={17} /></button></div></div>
          <h2>{selected.subject}</h2><div className={s.sender}><span className={s.senderAvatar}>{selected.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</span><div><strong>{selected.outgoing ? "Echipa ElectroField" : selected.name}</strong><span>{selected.outgoing ? selectedAccount.address : selected.address}</span><span>Către: {selected.outgoing ? selected.address : selectedAccount.address}</span></div><time>{selected.date}</time></div>
          <div className={s.body}>{selected.body}</div>
          {selected.attachment && <div className={s.attachment}><FileText size={24} /><div><strong>{selected.attachment.name}</strong><span>{selected.attachment.size} · atașament demonstrativ</span></div></div>}
          <button type="button" className={s.replyBox} onClick={() => compose(selected.folder === "draft" ? "edit" : "reply")}><Reply size={17} /><span>{selected.folder === "draft" ? "Continuă ciorna" : `Răspunde de pe ${selectedAccount.address}`}</span></button>
        </>}
      </section>
    </div>
    <div className={s.footer}><span><ShieldCheck size={14} />{demo ? "5 adrese exemplificative · doar Super Admin" : "Hostico · nicio conexiune activă"}</span><span role="status" aria-live="polite">{notice}</span></div>

    <dialog ref={composeRef} className={s.dialog} onCancel={(e) => { e.preventDefault(); closeCompose(); }} aria-labelledby="mail-compose-title">
      {draft && <form onSubmit={(e) => { e.preventDefault(); storeDraft(true); }}>
        <div className={s.dialogHeading}><h2 id="mail-compose-title">{draft.existingId ? "Editează ciorna" : "Mesaj nou"}<small>Demonstrație · fără expediere reală</small></h2><button type="button" className={s.iconButton} onClick={closeCompose} aria-label="Închide compunerea"><X size={19} /></button></div>
        <div className={s.composeFields}><label><span>De la</span><select value={draft.accountId} onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.address}</option>)}</select></label><label><span>Către</span><input type="email" required value={draft.to} placeholder="nume@companie.ro" onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label><label><span>Subiect</span><input required value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label><textarea aria-label="Conținutul mesajului" placeholder="Scrie mesajul tău…" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /><div className={s.signature}><strong>Echipa ElectroField</strong><br />{accounts.find((a) => a.id === draft.accountId)?.address}</div></div>
        <div className={s.dialogFooter}><button type="submit" className={`${s.button} ${s.primary}`}><Send size={16} />Trimite (demo)</button><button type="button" className={s.button} onClick={() => storeDraft(false)}>Salvează ciorna</button></div>
      </form>}
    </dialog>

    <dialog ref={accountsRef} className={s.dialog} onCancel={() => setShowAccounts(false)} aria-labelledby="mail-accounts-title">
      <div className={s.dialogHeading}><h2 id="mail-accounts-title">Adresele ElectroField</h2><button type="button" className={s.iconButton} aria-label="Închide adresele" onClick={() => setShowAccounts(false)}><X size={19} /></button></div>
      <div className={s.settingsBody}><div className={s.settingsPermission}><ShieldCheck size={19} /><p>Gestionarea și accesul la aceste adrese sunt rezervate contului Super Admin.</p></div><h3>Conectarea la Hostico</h3><p>Interfața este pregătită. În etapa următoare conectăm cele cinci adrese reale, apoi activăm primirea și expedierea mesajelor.</p><p>Adresele demonstrative nu reprezintă căsuțe conectate și nu sunt solicitate parole în această etapă.</p>{demo && <div className={s.settingsAccounts}>{accounts.map((a) => <div key={a.id}><Mail size={17} /><span><strong>{a.address}</strong><small>{a.purpose}</small></span><span className={s.demoTag}>Exemplu</span></div>)}</div>}<div className={s.settingsStatus}><Check size={17} />Două afișări disponibile · Toate adresele în ambele</div></div>
      <div className={s.dialogFooter}><button type="button" className={s.button} onClick={() => setShowAccounts(false)}>Închide</button></div>
    </dialog>
  </div>;
}
