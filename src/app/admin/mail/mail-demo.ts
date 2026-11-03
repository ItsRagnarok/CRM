export type MailFolder = "inbox" | "sent" | "draft" | "spam" | "trash";
export type MailView = "unified" | "accounts";

export type MailAccount = {
  id: string;
  name: string;
  address: string;
  initials: string;
  purpose: string;
};

export type MailMessage = {
  id: string;
  accountId: string;
  folder: MailFolder;
  name: string;
  address: string;
  subject: string;
  body: string;
  time: string;
  date: string;
  unread: boolean;
  outgoing?: boolean;
  attachment?: { name: string; size: string };
};

// Fictional examples only. No Hostico credentials, mailbox connections or real
// customer messages are represented by this module.
export const DEMO_ACCOUNTS: MailAccount[] = [
  { id: "contact", name: "Contact", address: "contact@electrofield.ro", initials: "CO", purpose: "Întrebări generale și cereri noi" },
  { id: "vanzari", name: "Vânzări", address: "vanzari@electrofield.ro", initials: "VÂ", purpose: "Oferte, demonstrații și abonamente" },
  { id: "suport", name: "Suport", address: "suport@electrofield.ro", initials: "SU", purpose: "Asistență pentru companiile client" },
  { id: "facturare", name: "Facturare", address: "facturare@electrofield.ro", initials: "FA", purpose: "Facturi și plăți" },
  { id: "office", name: "Office", address: "office@electrofield.ro", initials: "OF", purpose: "Corespondență administrativă" },
];

export const DEMO_MESSAGES: MailMessage[] = [
  { id: "demo-1", accountId: "vanzari", folder: "inbox", name: "Andrei Popescu", address: "andrei@example.com", subject: "Demonstrație ElectroField pentru echipa noastră", time: "10:42", date: "Astăzi, 10:42 · exemplu", unread: true,
    body: "Bună ziua,\n\nSuntem o firmă de instalații cu două echipe și am vrea să vedem cum ne poate ajuta ElectroField în organizarea lucrărilor.\n\nNe interesează programările, materialele folosite pe lucrare și rapoartele pe care le putem trimite clientului. Putem stabili o demonstrație?\n\nMulțumesc,\nAndrei Popescu", attachment: { name: "Prezentare-echipa.pdf", size: "248 KB" } },
  { id: "demo-2", accountId: "suport", folder: "inbox", name: "Maria Ionescu", address: "maria@example.com", subject: "Configurarea checklistului de finalizare", time: "10:15", date: "Astăzi, 10:15 · exemplu", unread: true,
    body: "Bună,\n\nAm început să configurăm platforma și am vrea un checklist de finalizare diferit pentru echipa de montaj.\n\nNe puteți ajuta să stabilim pașii și documentele necesare înainte de predarea lucrării?\n\nMulțumesc,\nMaria" },
  { id: "demo-3", accountId: "contact", folder: "inbox", name: "Radu Marin", address: "radu@example.com", subject: "Informații despre platformă", time: "09:48", date: "Astăzi, 09:48 · exemplu", unread: true,
    body: "Bună ziua,\n\nPlatforma se poate folosi și pentru o echipă care face service și mentenanță? Avem intervenții programate și lucrări recurente.\n\nAș dori câteva informații despre implementare și abonamente.\n\nO zi bună,\nRadu Marin" },
  { id: "demo-4", accountId: "facturare", folder: "inbox", name: "Elena Dumitru", address: "elena@example.com", subject: "Datele firmei pentru facturare", time: "09:20", date: "Astăzi, 09:20 · exemplu", unread: false,
    body: "Bună ziua,\n\nVă trimit datele firmei pentru actualizarea informațiilor de facturare. Vă rog să confirmați primirea.\n\nMulțumesc,\nElena Dumitru", attachment: { name: "Date-facturare.pdf", size: "112 KB" } },
  { id: "demo-5", accountId: "office", folder: "inbox", name: "Alexandru Stan", address: "alex@example.com", subject: "Confirmare întâlnire", time: "Ieri", date: "Ieri, 16:30 · exemplu", unread: false,
    body: "Salut,\n\nConfirm întâlnirea. Discutăm atunci despre etapele implementării și instruirea echipei.\n\nNe auzim,\nAlexandru" },
  { id: "demo-6", accountId: "vanzari", folder: "inbox", name: "Cristian Pavel", address: "cristian@example.com", subject: "Re: Oferta de implementare", time: "Ieri", date: "Ieri, 15:05 · exemplu", unread: false,
    body: "Bună,\n\nMulțumim pentru prezentare. Ne-ar ajuta să includem și al doilea depozit în configurarea inițială.\n\nPutem discuta pașii și costul implementării?\n\nCristian" },
  { id: "demo-sent", accountId: "vanzari", folder: "sent", outgoing: true, name: "Andrei Popescu", address: "andrei@example.com", subject: "Re: Organizarea unei demonstrații", time: "Ieri", date: "Ieri, 14:10 · exemplu", unread: false,
    body: "Bună, Andrei,\n\nÎți propun o discuție în care parcurgem un flux complet: de la înregistrarea clientului până la raportul de lucrare.\n\nCu drag,\nEchipa ElectroField" },
  { id: "demo-draft", accountId: "contact", folder: "draft", outgoing: true, name: "Ciornă", address: "client@example.com", subject: "Răspuns la solicitarea de informații", time: "09:05", date: "Astăzi, 09:05 · exemplu", unread: false,
    body: "Bună ziua,\n\nVă mulțumim pentru interesul acordat platformei ElectroField.\n\n" },
  { id: "demo-spam", accountId: "contact", folder: "spam", name: "Mesaj demonstrativ", address: "demo@example.com", subject: "Exemplu de mesaj în Spam", time: "Ieri", date: "Ieri · exemplu", unread: false,
    body: "Acesta este un mesaj fictiv, folosit numai pentru demonstrarea dosarului Spam." },
];
