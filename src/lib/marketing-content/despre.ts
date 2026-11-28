import type { MarketingPage } from "../marketing-pages";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_URL,
  LEGAL_CUI,
  LEGAL_FORM,
  LEGAL_REG,
  LEGAL_SEAT,
  SUPPORT_EMAIL,
} from "../contact";

// Pagina „Despre”: entitatea (ce e, pentru cine, stadiul, furnizorul, contactul, datele, ce nu face).
// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4).
// Identitatea legală e cea din src/components/legal-identity.tsx, fără numele persoanei (la cererea titularului).
// Fără prețuri, fără clienți, recenzii sau cifre de economii, fără nume de alte produse.
// Datele: firma e operator, ElectroField împuternicit (/confidentialitate); izolarea pe firmă (/termeni, RLS);
// fișierele prin legături temporare (src/lib/storage.ts, createSignedUrl); GPS continuu doar cu setarea firmei și
// acordul angajatului (src/app/mobil/layout.tsx), retenție setată de firmă (gps_retention_days); AI doar la apăsarea
// butonului, cu confirmare, oprit din Setări → AI (src/app/(app)/setari/ai-tab.tsx); statisticile site-ului fără
// cookie-uri și fără IP salvat (src/app/api/analytics/route.ts). Nu afirmăm locul serverelor (neverificat).
const mail = `[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`;
const support = `[${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL})`;
const phone = `[${CONTACT_PHONE_DISPLAY}](tel:${CONTACT_PHONE_TEL})`;
const whatsapp = `[WhatsApp](${CONTACT_WHATSAPP_URL})`;
const legalForm = LEGAL_FORM.charAt(0).toUpperCase() + LEGAL_FORM.slice(1);

const page: MarketingPage = {
  slug: "despre",
  title: "Despre ElectroField: cine suntem și ce face platforma",
  description: "Despre ElectroField: ce face platforma pentru firme de instalații electrice, gaze și fotovoltaice, în ce stadiu e, cine o furnizează și cum ne contactezi.",
  kicker: "Despre noi",
  h1: "Despre ElectroField: cine suntem și ce face platforma",
  lead: "ElectroField este o platformă românească pentru firmele de instalații electrice, gaze și fotovoltaice care lucrează cu echipe în teren: biroul programează lucrările din browser, iar tehnicianul le face din telefon. Pe pagina despre ElectroField afli cine o furnizează, în ce stadiu e, ce nu face încă și cum ne contactezi.",
  sections: [
    {
      h: "Ce este ElectroField?",
      id: "ce-este",
      answer: "ElectroField (www.electrofield.ro) este un [software de management pentru echipe de teren](/software-management-echipe-teren), făcut pentru firmele de instalații din România. Ține într-un singur loc clienții, lucrările, echipele, pontajul, materialele, documentele și facturarea. Biroul lucrează în browser, iar tehnicienii folosesc aplicația Android (APK, descărcată de pe site) sau, pe iPhone, din browser.",
    },
    {
      h: "Pentru ce firme este ElectroField?",
      id: "pentru-cine",
      answer: "Pentru firmele de instalații electrice, de verificări și revizii gaze și de montaj fotovoltaic, cu 2–3 până la câteva zeci de tehnicieni, care fac multe lucrări la clienți diferiți. Alegi domeniile firmei, iar meniul arată doar ce folosești. Climatizarea și securitatea folosesc partea comună, fără formulare dedicate.",
      list: [
        "[Firme de instalații electrice](/firme-instalatii-electrice): măsurători pe circuite, lucrări ascunse cu poze, buletin semnat doar de cine are autorizație ANRE valabilă.",
        "[Firme de verificări și revizii gaze](/firme-gaze-verificari-revizii): scadențar pe apartament, fișa semnată pe telefon.",
        "[Firme de montaj fotovoltaic](/firme-fotovoltaice): dosar pe etape, cu termenele operatorului.",
      ],
    },
    {
      h: "Ce face platforma, pe scurt?",
      id: "ce-face",
      answer: "Urmărește lucrarea de la programare la factură. Biroul o programează, tehnicianul înregistrează în telefon ce face, iar din datele lui ies pontajul, documentele lucrării și rândurile facturii, fără să le scrie cineva a doua oară. Tabelul arată ce găsești în fiecare parte a platformei.",
      blocks: [
        {
          type: "table",
          caption: "Părțile platformei",
          head: ["Partea platformei", "Ce face"],
          rows: [
            ["Programare", "Calendar și hartă, cu avertisment pentru autorizații, ITP, RCA și material lipsă."],
            ["[Aplicația pentru tehnicieni](/aplicatie-tehnician)", "Pașii lucrării, poze, checklist, măsurători, semnătura clientului."],
            ["[Pontajul pe lucrare](/pontaj-tehnicieni)", "Plecare, sosire cu locația, început, final, corecții aprobate."],
            ["[Stocul pe mașini](/stoc-materiale-pe-masini)", "Stocul fiecărei mașini, cu prag minim și reaprovizionare."],
            ["Documente", "Fișa de gaze, PV de lucrări ascunse, raportul lucrării în PDF, [foaia de parcurs pe mașină](/foaie-de-parcurs-electronica)."],
            ["[Facturarea prin SmartBill sau Oblio](/facturare-smartbill-oblio)", "Din lucrarea terminată, prin contul firmei."],
            ["Clientul", "Un link fără cont: intervalul de sosire, cine vine, pozele, documentele."],
          ],
        },
      ],
    },
    {
      h: "În ce stadiu este ElectroField?",
      id: "stadiu",
      answer: "ElectroField este o platformă nouă, din 2026. Funcțiile descrise pe site există în platformă, dar nu avem încă firme-client pe care să le putem cita. De aceea nu vei găsi aici recenzii, logo-uri de clienți sau cifre de economii: le publicăm doar când vin de la firme reale, cu acordul lor.",
      p: [
        "Descriem ce face platforma acum; ce e în lucru spunem ca atare. Schimbările importante le anunțăm celor care o folosesc, cum scrie în [termenii de utilizare](/termeni).",
      ],
    },
    {
      h: "Cine furnizează ElectroField?",
      id: "furnizor",
      answer: `Serviciul ElectroField este furnizat de o ${LEGAL_FORM} înregistrată în România: CUI ${LEGAL_CUI}, nr. de ordine în Registrul Comerțului ${LEGAL_REG}, cu sediul în ${LEGAL_SEAT}. Datele complete de identificare sunt publice în registrele ANAF și ONRC, după CUI, și se comunică la cerere.`,
      blocks: [
        {
          type: "table",
          caption: "Datele de identificare ale furnizorului",
          head: ["Dată", "Valoare"],
          rows: [
            ["Forma de organizare", `${legalForm} (PFA)`],
            ["CUI", LEGAL_CUI],
            ["Registrul Comerțului", LEGAL_REG],
            ["Sediul", LEGAL_SEAT],
            ["E-mail", mail],
            ["Telefon și WhatsApp", phone],
          ],
        },
      ],
    },
    {
      h: "Cum ne contactezi?",
      id: "contact",
      answer: `Ne scrii la ${mail}, ne suni la ${phone} sau ne scrii pe ${whatsapp}. Dacă vrei să vezi platforma, [programează o discuție](/programare): un apel de circa 15 minute sau 30 de minute pe Google Meet, cu platforma pe ecran, pe lucrările și echipele firmei tale.`,
      p: [
        `Dacă firma ta folosește deja platforma și ai nevoie de ajutor în aplicație, scrie la ${support}.`,
      ],
    },
    {
      h: "Cum sunt tratate datele firmei și ale angajaților?",
      id: "date",
      answer: "Firma care folosește ElectroField rămâne proprietara datelor și este operatorul lor; ElectroField le prelucrează în numele ei, doar ca să furnizeze serviciul. Fiecare firmă vede doar datele ei, iar pozele, documentele și semnăturile se deschid prin legături temporare. Detaliile sunt în [politica de confidențialitate](/confidentialitate).",
      list: [
        "GPS continuu: doar dacă firma îl activează și angajatul își dă acordul, pe care îl retrage din aplicație. Firma alege câte zile se păstrează pozițiile. Vezi [ghidul despre urmărirea GPS și GDPR](/blog/urmarire-gps-echipe-teren-gdpr).",
        "AI (citirea bonului sau a plăcuței unui aparat, dictarea): pornește doar când cineva apasă butonul. Pozele pleacă atunci la Google Gemini sau, de rezervă, la Groq, iar textul la Groq; rezultatul îl confirmă un om. Firma îl poate opri.",
        "Site-ul public numără vizitele fără cookie-uri și fără să păstreze adresa IP.",
        "Export: pontajul și registrul fișelor de gaze, în CSV. Exportul sau ștergerea tuturor datelor le ceri, cum scrie în termeni.",
      ],
    },
    {
      h: "Ce nu face ElectroField (încă)?",
      id: "ce-nu-face",
      answer: "Nu face devize și oferte, nu e CRM de vânzări, nu ține contabilitatea și nu are aplicație în magazinele de aplicații. Buletinul PRAM și procesul-verbal de punere în funcțiune nu se generează încă ca PDF cu valorile măsurate: măsurătorile se înregistrează pe lucrare. Le spunem de la început, ca să știi dacă ne potrivim.",
      list: [
        "Devize: pornești de la [modelul de ofertă pentru lucrări electrice și fotovoltaice](/blog/model-oferta-lucrari-electrice-fotovoltaice).",
        "Fără semnal: pozele, semnătura, sosirea, începutul și finalul lucrării, formularele, fișele și vizitele de gaze și incidentele SSM se salvează pe telefon și pleacă singure când revine semnalul. Restul cere semnal.",
        "Notificări push: doar în aplicația Android.",
        "e-Factura: din platformă, prin Oblio; cu SmartBill, din contul SmartBill.",
        "Mesajul „suntem pe drum” îl trimite tehnicianul, cu o atingere; nu pleacă automat.",
        "Importuri: doar apartamentele de gaze și catalogul standard de materiale.",
      ],
    },
    {
      h: "Cum scriem ghidurile de pe blog?",
      id: "ghiduri",
      answer: "Pe [blog](/blog) explicăm documentele și obligațiile meseriei: verificările de gaze, priza de pământ, autorizațiile ANRE, foaia de parcurs. În ghidurile despre reguli, luăm regulile din actele oficiale, numite cu număr, și punem sursele la final. Ce nu am putut verifica spunem. Pentru cazul tău confirmi cu responsabilul tehnic sau cu contabilul.",
      p: [
        `Exemple: [autorizația ANRE de electrician](/blog/autorizatie-anre-electrician) și [verificarea și revizia instalației de gaze](/blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti). Ai găsit o greșeală? Scrie-ne la ${mail}.`,
      ],
    },
  ],
  faq: [
    { q: "Ce este ElectroField?", a: "ElectroField este o platformă românească de management pentru echipe de teren, făcută pentru firmele de instalații electrice, gaze și fotovoltaice. Biroul programează lucrările din browser, iar tehnicienii lucrează din telefon: pași, poze, măsurători, semnătura clientului și pontaj pe lucrare." },
    { q: "Cine furnizează ElectroField?", a: `O ${LEGAL_FORM} înregistrată în România, cu CUI ${LEGAL_CUI}, nr. de ordine în Registrul Comerțului ${LEGAL_REG} și sediul în ${LEGAL_SEAT}. Datele complete de identificare sunt publice în registrele ANAF și ONRC, după CUI, și se comunică la cerere.` },
    { q: "ElectroField are clienți sau recenzii?", a: "Nu încă. ElectroField e o platformă nouă, din 2026. Nu publicăm recenzii, logo-uri de clienți sau cifre de economii până nu vin de la firme reale, cu acordul lor." },
    { q: "Cine vede datele firmei mele?", a: "Utilizatorii firmei tale, fiecare după rolul lui: administrator, manager sau dispecer, șef de echipă, tehnician. Altă firmă nu are acces, pentru că datele fiecărei firme sunt separate în baza de date. ElectroField le prelucrează doar ca să furnizeze serviciul; detaliile sunt în [politica de confidențialitate](/confidentialitate)." },
    { q: "Pot folosi ElectroField dacă fac climatizare sau securitate?", a: "Da, partea comună: lucrări, calendar, aplicația tehnicianului, pontaj, stoc și facturare. Formulare și termene dedicate există doar pentru electrice, gaze și fotovoltaice." },
    { q: "Cum programez o discuție?", a: "Din [pagina de programare](/programare) alegi domeniile firmei, ziua, ora și felul discuției: un apel de circa 15 minute sau 30 de minute pe Google Meet, cu platforma pe ecran. Primești confirmarea pe e-mail." },
    { q: "Unde scriu dacă firma mea folosește deja platforma?", a: `La ${support}, pentru ajutor în aplicație sau cu contul. Pentru orice altceva, scrie la ${mail} sau sună la ${phone}.` },
  ],
  related: [
    "program-management-firma-instalatii",
    "excel-sau-aplicatie-gestionare-lucrari",
    "gestionare-echipe-de-teren",
    "urmarire-gps-echipe-teren-gdpr",
    "autorizatie-anre-electrician",
    "fisa-evidenta-verificare-revizie-gaze-scadentar",
  ],
  updated: "2026-11-28",
  ogImage: "/og/despre.jpg",
  breadcrumb: "Despre",
};

export default page;
