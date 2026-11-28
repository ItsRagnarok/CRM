import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul:
// pontajul e pe lucrare (plecare, sosire cu locație, început, final), fără buton de pauză și fără pontaj de
// prezență în afara lucrărilor; biroul vede ziua sau săptămâna (luna e „în curând”), iar exportul e CSV pe
// aceeași perioadă; offline pleacă doar sosirea, pornirea și închiderea; nu face salarizare.
// Regula legală (Codul muncii, art. 119) e citată din clarificarea Inspecției Muncii, fiindcă
// legislatie.just.ro nu s-a deschis la 28 nov 2026.
const page: MarketingPage = {
  slug: "pontaj-tehnicieni",
  title: "Pontaj online pentru echipe de teren, din telefon",
  description: "Pontaj online pe lucrare pentru echipe de teren: plecare, sosire cu locație, început și final din telefon. Corecții aprobate de birou, concedii și export.",
  kicker: "Funcționalitate",
  h1: "Pontaj online pentru tehnicienii din teren",
  lead: "Pontajul online din ElectroField e pontaj pe lucrare pentru echipe de teren: tehnicianul apasă în telefon când pleacă, când ajunge, când începe și când termină, iar orele se adună singure, pe om și pe lucrare. Nu e un program de salarizare sau de resurse umane. E evidența orelor legată de lucrările pe care le programezi.",
  sections: [
    {
      h: "Ce este pontajul online pe lucrare?",
      id: "ce-este",
      answer: "Pontajul online pe lucrare înseamnă că orele nu se trec la final de zi sau de lună, ci se înregistrează din telefon în momentul în care se întâmplă, pe lucrarea la care e omul. Afli cât a durat drumul, cât a durat lucrul și la ce client, nu doar că omul a fost la program.",
      blocks: [
        {
          type: "table",
          caption: "Pontaj de prezență și pontaj pe lucrare",
          head: ["", "Pontaj de prezență", "Pontaj pe lucrare"],
          rows: [
            ["Ce înregistrează", "Intrarea și ieșirea din program", "Plecarea, sosirea, începutul și finalul fiecărei lucrări"],
            ["Timpul de drum", "De obicei nu apare separat", "Separat de timpul de lucru"],
            ["Legătura cu clientul", "Nu există", "Fiecare oră e pe o lucrare"],
            ["Salarii", "Uneori, în același program", "Nu; le face contabilul"],
          ],
        },
        {
          type: "p",
          text: "Dacă oamenii lucrează la sediu, îți ajunge o aplicație de pontaj obișnuită. Pontajul pe lucrare are sens când echipele pleacă la clienți diferiți, cum fac [firmele de instalații electrice](/firme-instalatii-electrice), de [verificări și revizii gaze](/firme-gaze-verificari-revizii) sau de [montaj fotovoltaic](/firme-fotovoltaice). Imaginea completă e pe pagina despre [software de management pentru echipe de teren](/software-management-echipe-teren).",
        },
      ],
    },
    {
      h: "Cum se pontează din aplicația de pontaj, pas cu pas",
      id: "pas-cu-pas",
      answer: "Tehnicianul nu completează nicio foaie. Apasă butoanele lucrării în ordinea în care lucrează: plecare, sosire, pornire și închidere. Fiecare apăsare salvează ora, iar sosirea salvează și locația. Din aceste ore se face pontajul pe zi, pe săptămână și pe lucrare, fără să le adune cineva la birou.",
      blocks: [
        {
          type: "steps",
          items: [
            "Vede lucrările zilei în [aplicația pentru tehnicieni](/aplicatie-tehnician): aplicația Android (APK, descărcată de pe site) sau, pe iPhone, platforma din browser.",
            "Apasă „Plec spre locație”. De aici curge timpul de deplasare.",
            "La adresă apasă „Am ajuns la locație”. La cel mult 50 de metri de adresă, sosirea se confirmă direct; mai departe sau fără GPS, tehnicianul confirmă manual.",
            "Face poza de sosire, dacă lucrarea o cere, bifează verificarea de siguranță și apasă „Pornește lucrul”.",
            "La final apasă „Închide lucrarea” și ia semnătura clientului.",
            "În telefon își vede orele din fiecare zi, față de norma săptămânală a firmei.",
          ],
        },
        {
          type: "callout",
          title: "Fără semnal",
          text: "Sosirea, pornirea și închiderea lucrării se salvează pe telefon și pleacă singure când revine semnalul, cu ora reală a apăsării. Plecarea spre client, corecțiile și cererile de concediu cer semnal.",
        },
      ],
    },
    {
      h: "Ce vede biroul în pontaj?",
      id: "ce-vede-biroul",
      answer: "Biroul vede, pe zi sau pe săptămână, pentru fiecare om: orele lucrate, orele de deplasare, numărul de lucrări și ce face acum (în drum, la lucru, programat sau disponibil). Pe pagina fiecărei lucrări vede apăsările cu ora lor și costul manoperei pe fiecare om.",
      list: [
        "Cererile de corecție de aprobat, cu ora inițială, ora cerută și motivul.",
        "Export CSV pentru ziua sau săptămâna aleasă.",
        "Durata obișnuită a fiecărui tip de lucrare, din pontajul lucrărilor finalizate, afișată când programezi una nouă.",
      ],
      p: [
        "Kilometrii nu intră în pontaj, ci în [foaia de parcurs electronică](/foaie-de-parcurs-electronica).",
      ],
    },
    {
      h: "Locația la pontaj: ce se salvează și ce nu?",
      id: "locatie",
      answer: "La pontaj se salvează locația o singură dată: când tehnicianul apasă „Am ajuns la locație”, dacă telefonul o poate da. Plecarea, pornirea și închiderea lucrului se salvează doar cu ora. Urmărirea continuă pe hartă e o opțiune separată, pe care o pornește firma și o acceptă angajatul.",
      p: [
        "Acordul pentru urmărire se poate retrage oricând din aplicație. Cu ecranul blocat, poziția se trimite doar din aplicația Android. Ce spune GDPR și cum îți informezi echipa: în ghidul despre [urmărirea echipelor cu GPS și GDPR](/blog/urmarire-gps-echipe-teren-gdpr).",
      ],
    },
    {
      h: "Ce faci când un tehnician uită să ponteze?",
      id: "corectii",
      answer: "Tehnicianul nu își poate schimba singur orele. Din telefon cere o corecție pentru ora de început sau de final, cu ora corectă și motivul. Biroul primește notificare, vede ora inițială lângă cea cerută și aprobă sau respinge. Pontajul se schimbă doar după aprobare, iar cererea păstrează ora inițială.",
      list: [
        "Corecția se cere pentru ultimele 31 de zile, cu motive gata scrise, de tipul „Am uitat să apăs butonul”.",
        "Cât timp cererea e în așteptare, tehnicianul o poate retrage.",
        "Dacă aplicația e deschisă și telefonul stă cinci minute lângă adresă fără sosire apăsată, aplicația îi amintește și vibrează.",
      ],
    },
    {
      h: "Din ore în bani: costul manoperei pe lucrare",
      id: "cost-manopera",
      answer: "Orele lucrate pe o lucrare, înmulțite cu tariful orar al fiecărui om, dau costul manoperei pe pagina lucrării. Lângă el stau materialele consumate și cheltuielile. Profitul apare după ce facturezi lucrarea în platformă. Aceleași ore completează rândul de manoperă din factură, cu tariful tău de facturare.",
      blocks: [
        {
          type: "table",
          caption: "Ce iese din orele pontate",
          head: ["Din ce", "Ce iese", "Unde îl vezi"],
          rows: [
            ["„Plec spre locație” → „Am ajuns la locație”", "Orele de deplasare", "Pontajul și exportul CSV"],
            ["„Pornește lucrul” → „Închide lucrarea”", "Orele lucrate", "Pontajul, exportul CSV și pagina lucrării"],
            ["Ore lucrate × tariful orar al omului", "Costul manoperei", "Pagina lucrării"],
            ["Ore lucrate × tariful tău de facturare", "Rândul de manoperă din factură", "La „De facturat”"],
          ],
        },
        {
          type: "p",
          text: "Tariful îl stabilești cu [calculatorul de tarif pe oră pentru electricieni și instalatori](/blog/calculator-tarif-ora-electrician-instalator), iar calculul complet e în ghidul [cum calculezi profitul pe lucrare](/blog/cum-calculezi-profitul-pe-lucrare). Factura pleacă prin [facturarea din lucrări cu SmartBill sau Oblio](/facturare-smartbill-oblio).",
        },
      ],
    },
    {
      h: "Concedii și învoiri: cum se cer și cine le aprobă?",
      id: "concedii",
      answer: "Tehnicianul cere din telefon concediu de odihnă, concediu medical sau învoire. Cererea pornește „în așteptare”, iar biroul o aprobă sau o respinge; o absență o poate trece și direct. Cine e în concediu apare ca avertisment când îl programezi pe o lucrare. La fel se aprobă cheltuielile din teren.",
      p: [
        "Nimeni nu își aprobă singur concediul sau cheltuiala.",
      ],
    },
    {
      h: "E legal pontajul electronic?",
      id: "legal",
      answer: "Codul muncii (Legea nr. 53/2003, art. 119) îi cere angajatorului să țină evidența orelor lucrate efectiv de fiecare salariat. Inspecția Muncii arată că legea nu impune forma: evidența poate fi ținută pe hârtie sau electronic, și pentru locurile de muncă mobile. Forma folosită la tine o confirmi cu contabilul.",
      p: [
        "Pontajul pe lucrare înregistrează orele când se lucrează, nu reconstituite la final de lună. Nu ține locul statului de salarii și nu stabilește sporurile. Ce trebuie să conțină evidența: în articolul despre [evidența orelor tehnicienilor din teren](/blog/evidenta-orelor-tehnicieni-teren-pontaj).",
      ],
    },
    {
      h: "Ce nu face pontajul (încă)",
      id: "ce-nu-face",
      list: [
        "Nu face salarizare: state de plată, contribuții sau sporuri.",
        "Nu are încă afișare și export pe lună; exportul e în CSV, nu în PDF.",
        "Nu are pontaj de prezență în afara lucrărilor programate.",
        "Nu are buton de pauză: timpul dintre pornire și închidere intră întreg la ore lucrate.",
        "Nu salvează locația la pornirea și la închiderea lucrului, doar la sosire.",
      ],
    },
    {
      h: "Surse, verificate la 28 noiembrie 2026",
      id: "surse",
      p: [
        "Legea nr. 53/2003 – Codul muncii, art. 119, modificat prin OUG nr. 53/2017. Pe legislatie.just.ro textul nu s-a deschis la data verificării; am folosit clarificarea Inspecției Muncii.",
      ],
      list: [
        "[Inspecția Muncii: clarificări privind obligația angajatorului de a ține evidența orelor de muncă prestate de salariați](https://www.inspectiamuncii.ro/documents/606948/47538922/Clarificari+privind+obligatia+angajatorului+de+a+tine+evidenta+.pdf/595c318a-9ece-4163-baaf-d7bf83169cec)",
      ],
    },
  ],
  faq: [
    { q: "Ce este o aplicație de pontaj pentru angajații din teren?", a: "E o aplicație în care omul își înregistrează orele din telefon, acolo unde lucrează. În ElectroField orele sunt pe lucrare: plecare, sosire cu locația, început și final. Merge pe aplicația Android (APK, descărcată de pe site) și, pe iPhone, din browser." },
    { q: "Pot folosi doar pontajul, fără restul platformei?", a: "Pontajul pornește din lucrări: omul apasă pașii pe lucrarea programată pentru el. Dacă vrei doar prezența la program, fără lucrări și clienți, o aplicație de pontaj obișnuită ți se potrivește mai bine." },
    { q: "Tehnicianul își poate modifica singur orele?", a: "Nu. Cere din telefon o corecție cu motiv, iar ora se schimbă doar după ce o aprobă biroul. Cererea păstrează ora inițială." },
    { q: "Localizarea e permanentă?", a: "Nu. La pontaj se salvează locația doar la sosire. Urmărirea continuă e o opțiune separată, pe care o activează firma și care cere acordul angajatului." },
    { q: "Se vede timpul de drum separat de timpul de lucru?", a: "Da. Drumul, de la plecare la sosire, apare la orele de deplasare, iar lucrul, de la pornire la închidere, la orele lucrate. Le vezi separat în pontaj și în export." },
    { q: "Merge pontajul fără semnal?", a: "În mare parte, da. Sosirea, pornirea și închiderea lucrării pleacă singure când revine semnalul, cu ora reală a apăsării. Plecarea spre client și corecțiile cer semnal." },
    { q: "Pot exporta pontajul pentru contabilitate?", a: "Da, în CSV, pentru ziua sau săptămâna aleasă, cu orele lucrate, orele de deplasare și lucrările fiecărui om. Exportul pe lună nu există încă. Ce formă îi trebuie contabilului confirmi cu el." },
    { q: "Cum se calculează orele suplimentare?", a: "Platforma nu face salarizarea. Vezi orele lucrate pe fiecare zi, deci se vede cine a lucrat peste program. Ce se plătește ca oră suplimentară și cu ce spor stabilește contabilul, după contractul de muncă și Codul muncii." },
  ],
  related: [
    "evidenta-orelor-tehnicieni-teren-pontaj",
    "urmarire-gps-echipe-teren-gdpr",
    "calculator-tarif-ora-electrician-instalator",
    "cum-calculezi-profitul-pe-lucrare",
    "gestionare-echipe-de-teren",
    "reducere-timpi-deplasare-lucrari",
  ],
  updated: "2026-11-28",
  ogImage: "/og/pontaj-tehnicieni.jpg",
  breadcrumb: "Pontaj tehnicieni",
};

export default page;
