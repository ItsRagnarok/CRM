import type { MarketingPage } from "../marketing-pages";

// Pagina-pilon: ce este un software de management pentru echipe de teren (FSM) și cum îl alegi.
// Compară doar tipuri de soluții, fără nume de produse. Afirmațiile despre ElectroField urmează fișa de produs verificată.
const page: MarketingPage = {
  slug: "software-management-echipe-teren",
  title: "Software de management pentru echipe de teren: cum îl alegi",
  description: "Ce este un software de management pentru echipe de teren (FSM), ce face, prin ce diferă de Excel, pontaj sau ERP și cum îl alegi, după 8 criterii clare.",
  kicker: "Ghid · field service management",
  h1: "Software de management pentru echipe de teren: ce face și cum îl alegi",
  lead: "Un software de management pentru echipe de teren (în engleză, field service management sau FSM) este programul care leagă biroul de tehnicienii aflați la clienți: programează lucrările, le trimite în telefon, ține pontajul, materialele și documentele fiecărei lucrări și pregătește factura. ElectroField este un astfel de software, făcut pentru firmele de instalații electrice, gaze și fotovoltaice din România.",
  sections: [
    {
      h: "Ce face un software de management pentru echipe de teren?",
      id: "ce-face",
      answer: "Ține într-un singur loc tot drumul unei lucrări: cine o face, când, la ce adresă, cu ce materiale, cât a durat, ce s-a constatat și ce e de facturat. Biroul lucrează din browser, tehnicianul din telefon, iar ce se introduce în teren nu se mai recopiază la birou.",
      list: [
        "Programare: lucrările pe echipe și zile, în calendar și pe hartă, cu avertisment pentru concedii, autorizații expirate, ITP sau RCA expirat și material lipsă din stoc.",
        "Teren: [aplicația pentru tehnicieni](/aplicatie-tehnician) arată lucrările zilei, adresa cu navigare, pașii, checklistul, formularele cu măsurători, pozele etichetate și semnătura clientului.",
        "Pontaj: [pontajul pe lucrare, din telefon](/pontaj-tehnicieni), cu plecare, sosire, început și final și locația salvată la sosire.",
        "Materiale: [stocul de materiale din fiecare mașină](/stoc-materiale-pe-masini), cu listă țintă, prag minim și cereri de reaprovizionare.",
        "Facturare: lucrarea terminată ajunge la „De facturat”, iar [factura se emite prin SmartBill sau Oblio](/facturare-smartbill-oblio).",
        "Clientul: un link fără cont, cu intervalul de sosire, cine vine și, după lucrare, pozele înainte și după și documentele.",
      ],
    },
    {
      h: "Prin ce diferă de un CRM, un ERP sau o aplicație de pontaj?",
      id: "fsm-crm-erp",
      answer: "Un CRM urmărește vânzarea, un ERP urmărește contabilitatea și gestiunea firmei, iar o aplicație de pontaj urmărește orele. Un software pentru echipe de teren urmărește lucrarea: ce se face la client, de cine, cu ce materiale și cu ce dovezi. Uneori ai nevoie de două programe care se completează.",
      list: [
        "CRM: clienți potențiali și etape de vânzare. ElectroField ține clienții, contactele și istoricul lucrărilor, fără etape de vânzare.",
        "ERP, contabilitate, NIR, salarizare: ElectroField nu le înlocuiește. Factura o pregătește din lucrare și o emite prin SmartBill sau Oblio.",
        "Pontaj: orele sunt pe lucrare, nu doar prezență, deci vezi costul manoperei la fiecare client.",
        "Devize: oferta se calculează înainte de lucrare; ElectroField pornește de la lucrarea stabilită.",
      ],
    },
    {
      h: "Cum arată gestionarea unei lucrări, de la programare la factură?",
      id: "flux-lucrare",
      answer: "În șapte pași, împărțiți între birou și teren. Biroul programează, tehnicianul înregistrează în telefon ce face, iar datele lui devin pontaj, documente și factură, fără să le scrie cineva a doua oară. Tabelul de sub pași arată ce obții din fiecare tip de date.",
      blocks: [
        { type: "steps", items: [
          "Biroul creează lucrarea (client, adresă, tip, echipă, dată, materiale) și vede în calendar avertismentele programării.",
          "Tehnicianul vede lucrarea în telefon; dacă are de ridicat materiale, primul pas e depozitul.",
          "Când pleacă, apasă „plecare” și trimite clientului cu o atingere, pe SMS sau WhatsApp, mesajul că e pe drum, cu linkul de status.",
          "La sosire apasă „am ajuns”: ora și locația intră în pontaj.",
          "Lucrează și documentează: poze etichetate, checklistul și formularul cu măsurători al meseriei.",
          "Clientul semnează pe ecran, tehnicianul închide lucrarea, iar biroul vede pe loc că e gata.",
          "Lucrarea apare la „De facturat”, cu rândurile completate din orele pontate și din materiale cu adaos.",
        ] },
        {
          type: "table",
          caption: "Ce obții din datele introduse în teren",
          head: ["Ce introduce echipa", "Ce obții"],
          rows: [
            ["Plecare, sosire, început și final pe lucrare", "Pontajul pe om și pe lucrare, cu export CSV, și costul manoperei"],
            ["Checklist, cheltuieli, poze, semnătura clientului", "Raportul lucrării în PDF (cu numărul de poze, nu pozele)"],
            ["Pozele marcate „lucrări ascunse” și lista lor", "Procesul-verbal de lucrări ascunse, de tipărit sau de salvat ca PDF"],
            ["Fișa de gaze, cu semnături", "Fișa tipăribilă, termenele de după fișă și registrul anual al fișelor, în CSV"],
            ["Măsurători pe circuite: izolație, impedanța buclei, continuitatea PE, diferențial", "Tabelul de măsurători; buletinul se înregistrează semnat doar de cine are autorizație ANRE valabilă"],
            ["Lucrările terminate ale echipei care folosește mașina", "[Foaia de parcurs electronică](/foaie-de-parcurs-electronica) a mașinii, pe lună: zi, adresă, scop"],
            ["Ore, materiale, cheltuieli", "Factura și, după facturare, costul și profitul lucrării"],
          ],
        },
      ],
    },
    {
      h: "Când nu mai ajung Excelul și WhatsApp-ul?",
      id: "excel-whatsapp",
      answer: "Când informația despre lucrări nu mai încape în capul unui singur om. Cu 2–3 tehnicieni, un tabel și un grup de mesaje pot ține. Cu mai multe echipe apar lucrări uitate la facturare, ore estimate din memorie, poze rămase în telefoanele oamenilor și materiale cumpărate de două ori.",
      p: [
        "Excelul nu știe ce se întâmplă în teren: nu primește poze, nu cere semnătura clientului și nu îți arată în ce stadiu e fiecare lucrare. Dacă nu știi sigur unde ești, fă [testul Excel, WhatsApp sau aplicație pentru echipe de teren](/blog/excel-sau-aplicatie-gestionare-lucrari).",
      ],
      blocks: [
        { type: "callout", title: "Exemplu de calcul, cu cifre ipotetice", text: "Dacă biroul pierde zilnic 30 de minute cu telefoane de tipul „unde ești?” și „ai terminat?”, la 21 de zile lucrătoare se adună 10 ore și jumătate pe lună. Pune în loc cifrele firmei tale." },
      ],
    },
    {
      h: "Ce tipuri de programe pentru echipe de teren există?",
      id: "tipuri-solutii",
      answer: "În mare, cinci: Excel cu WhatsApp, aplicațiile de pontaj, software-ul de field service generic, programele de devize și ERP-urile pentru construcții și platformele făcute pentru o meserie anume. Diferă prin ce acoperă din drumul lucrării: programarea, munca din teren, documentele meseriei și factura.",
      blocks: [
        {
          type: "table",
          caption: "Ce găsești de obicei la fiecare tip de soluție. Produsele diferă: verifică pe cel pe care îl iei în calcul.",
          head: ["Tip de soluție", "Programare și echipe", "Lucru în teren", "Documentele meseriei", "Factura", "Devize și oferte"],
          rows: [
            ["Excel și WhatsApp", "Manual, într-un tabel", "Mesaje și poze într-un grup, fără ordine", "Șabloane Word sau Excel, completate de mână", "Separat, recopiată", "Șablon propriu"],
            ["Aplicație de pontaj", "Lipsește sau e simplă", "Ore și locație", "Nu", "Nu; de obicei export pentru salarizare", "Nu"],
            ["Field service generic", "Da", "Sarcini, poze, formulare", "Formulare pe care le construiești tu", "Depinde de produs", "Unele au"],
            ["Program de devize sau ERP pentru construcții", "Pe proiecte și șantiere", "De obicei pontaj pe proiect", "Devize, situații de lucrări", "De obicei din situațiile de lucrări", "Da, e scopul lor"],
            ["Platformă pentru instalații (ElectroField)", "Calendar, hartă, avertismente", "Aplicația Android (APK, descărcată de pe site); pe iPhone, din browser", "Fișa de gaze, PV de lucrări ascunse, măsurători înregistrate pe lucrare", "Prin SmartBill sau Oblio", "Nu"],
          ],
        },
        { type: "p", text: "Dacă vinzi mai ales lucrări mari, pe bază de deviz, un program de devize îți folosește mai mult. Dacă ai multe lucrări scurte la clienți diferiți, contează mai mult partea de teren." },
      ],
    },
    {
      h: "Cum alegi un software pentru echipe mobile: 8 criterii",
      id: "criterii",
      answer: "Alegi după ce fac oamenii tăi în teren, nu după lista de funcții. Testează aplicația pe telefonul unui tehnician, cere documentele finale, fă o factură de probă și întreabă ce plătești în total. Tabelul îți dă, pentru fiecare criteriu, întrebarea și felul în care verifici răspunsul.",
      blocks: [
        {
          type: "table",
          caption: "Ce întrebi și cum verifici, la orice furnizor",
          head: ["Criteriu", "Ce întrebi", "Cum verifici"],
          rows: [
            ["Îl folosesc tehnicienii", "E mai rapid decât un mesaj pe WhatsApp?", "Un tehnician închide singur o lucrare de probă."],
            ["Lucru fără semnal", "Ce se salvează pe telefon și ce cere semnal?", "Pui telefonul în modul avion, faci poze și iei o semnătură, apoi îl reconectezi."],
            ["Documentele meseriei", "Știe fișa de gaze, măsurătorile pe circuite, procesul-verbal de lucrări ascunse?", "Ceri documentul final, tipărit sau PDF, nu doar formularul."],
            ["Factura", "Se face din lucrare sau o scrii din nou? Cu ce program de facturare se leagă?", "Faci o factură de probă din orele și materialele unei lucrări."],
            ["Pontaj și locație", "Orele sunt pe lucrare sau doar prezență? Când se salvează locația?", "Ceri să vezi ce se salvează la sosire și cum pornește urmărirea. Citește și ghidul despre [urmărirea GPS a echipelor și GDPR](/blog/urmarire-gps-echipe-teren-gdpr)."],
            ["Materiale", "Vezi ce are fiecare mașină și ce s-a consumat pe lucrare?", "Ceri stocul unei mașini și consumul unei lucrări terminate."],
            ["Costul total", "Plătești pe utilizator sau pe firmă? Ce se plătește separat? Cât durează contractul?", "Ceri oferta scrisă, cu tot ce plătești în primul an."],
            ["Datele tale", "Ce poți exporta și în ce format? Cine are acces?", "Ceri lista exporturilor și citești termenii și politica de confidențialitate."],
          ],
        },
        { type: "p", text: "Pentru întrebările de pus înainte să semnezi, vezi și [ghidul despre cum testezi un program de management pe lucrări reale](/blog/program-management-firma-instalatii)." },
      ],
    },
    {
      h: "Ce are în plus o platformă făcută pentru instalații?",
      id: "instalatii",
      answer: "Știe documentele și termenele meseriei. Un program generic îți dă formulare goale, pe care le construiești singur. O platformă pentru instalații vine cu fișa de gaze, măsurătorile pe circuite, dosarul fotovoltaic pe etape și evidența autorizațiilor, iar programarea lucrărilor ține cont de ele.",
      list: [
        "Electrice: măsurători pe circuite în telefon, lucrări ascunse cu poze și proces-verbal tipăribil, buletin înregistrat pe lucrare și semnat doar de cine are autorizație ANRE valabilă. Detalii la [software pentru firme de instalații electrice](/firme-instalatii-electrice).",
        "Gaze: [scadențarul de verificări și revizii gaze](/firme-gaze-verificari-revizii) pe bloc, scară și apartament, cu scadențele calculate la intervalele setate de firmă și fișa semnată pe telefon.",
        "Fotovoltaice: [dosarul fiecărui proiect fotovoltaic](/firme-fotovoltaice), pe etape, cu ceas pentru termenele operatorului și fișa de punere în funcțiune cu valorile pe string.",
        "Conformitate și SSM: autorizații, ITP, RCA și calibrarea aparatelor, cu alertă la 60, 30 și 7 zile înainte de expirare; instruiri și incidente din telefon.",
      ],
      p: [
        "Alegi domeniile firmei, iar meniul arată doar ce folosești. Firmele de climatizare sau securitate pot folosi partea comună (lucrări, pontaj, stoc, facturare), fără formulare dedicate meseriei lor.",
      ],
    },
    {
      h: "Unde se potrivește ElectroField și unde nu?",
      id: "potrivire",
      answer: "Se potrivește firmelor de instalații electrice, gaze și fotovoltaice cu 2–3 până la câteva zeci de tehnicieni, care fac multe lucrări la clienți diferiți și vor documentele direct din teren. Nu se potrivește dacă ai nevoie în primul rând de devize, de un CRM de vânzări sau de contabilitate.",
      blocks: [
        { type: "p", text: "Se potrivește dacă:" },
        { type: "list", items: [
          "ai echipe care pleacă zilnic la intervenții, montaje, verificări sau revizii;",
          "facturezi prin SmartBill sau Oblio ori ești dispus să lucrezi cu unul dintre ele (alt program de facturare nu se leagă);",
          "ai scadențe de gaze pe apartamente sau dosare fotovoltaice cu termene la operator.",
        ] },
        { type: "p", text: "Nu se potrivește, sau nu încă, dacă:" },
        { type: "list", items: [
          "vinzi mai ales pe bază de deviz și ai nevoie de ofertare detaliată;",
          "vrei un CRM cu etape de vânzare și urmărirea clienților potențiali;",
          "vrei o aplicație instalată dintr-un magazin de aplicații: pe Android instalezi aplicația (APK, descărcată de pe site), iar pe iPhone lucrezi din browser.",
        ] },
        { type: "p", text: "Pe site nu vei găsi recenzii sau cifre de economii: le publicăm doar când vin de la firme reale, cu acordul lor. Vezi [cine face ElectroField și cum ne contactezi](/despre)." },
      ],
    },
    {
      h: "Ce nu face ElectroField (încă)?",
      id: "ce-nu-face",
      answer: "Nu face devize și oferte, nu e CRM de vânzări, nu ține contabilitatea și nu generează încă buletinul PRAM sau procesul-verbal de punere în funcțiune ca PDF cu valorile măsurate. Le spunem de la început, ca să nu afli după o lună că lipsește tocmai ce căutai.",
      list: [
        "Devize și oferte: nu există modul de ofertare. Poți porni de la [modelul de ofertă pentru lucrări electrice și fotovoltaice](/blog/model-oferta-lucrari-electrice-fotovoltaice).",
        "Buletine PDF: măsurătorile se înregistrează pe lucrare; documentul tipăribil cu valorile lor e în lucru.",
        "SMS automat: mesajul că echipa e pe drum îl trimite tehnicianul, cu o atingere.",
        "Importuri: se importă apartamentele de gaze și catalogul standard de materiale, nu și clienții sau materialele proprii dintr-un fișier.",
        "Automatizări: nu programează singur reviziile periodice, nu optimizează traseele și nu depune dosare la operatorul de rețea.",
        "Export: azi exporți pontajul și registrul fișelor de gaze în CSV, nu toate datele.",
      ],
    },
    {
      h: "Cum începi cu ElectroField?",
      id: "cum-incepi",
      answer: "Programezi o discuție: un apel de 15 minute sau o prezentare de 30 de minute pe Google Meet. Ne spui cum lucrează firma acum, iar noi îți arătăm platforma pe lucrările tale. Dacă se potrivește, te ajutăm la prima configurare: echipe, mașini, depozite și domeniile firmei.",
      p: [
        "[Programează o discuție](/programare) și spune-ne ce lucrări faci și câte echipe ai.",
      ],
    },
  ],
  faq: [
    { q: "Ce înseamnă field service management (FSM)?", a: "Field service management (FSM) înseamnă organizarea lucrărilor făcute la client: programarea echipelor, sarcinile din telefon, pontajul, materialele, documentele și facturarea. În română îi spunem software de management pentru echipe de teren." },
    { q: "Cât durează să pornești cu un software pentru echipe de teren?", a: "Depinde de câte echipe, mașini și lucrări ai și de cât de ordonate sunt datele de azi. Cu ElectroField, după discuția de prezentare te ajutăm la prima configurare: echipele, mașinile, depozitele și domeniile firmei. Apoi tehnicienii instalează aplicația Android sau deschid pagina în browser, pe iPhone, și primesc primele lucrări." },
    { q: "Ce date trebuie să am pregătite înainte?", a: "Lista angajaților și a echipelor, mașinile cu datele de ITP și RCA, depozitele și autorizațiile ANRE ale oamenilor. Clienții și materialele proprii se adaugă în platformă, nu dintr-un fișier; materialele pornesc de la catalogul standard. Apartamentele de gaze se pot importa. Pentru facturi îți trebuie contul de SmartBill sau Oblio." },
    { q: "Ce export primesc dacă renunț?", a: "Pontajul și registrul anual al fișelor de gaze le exporți singur, oricând, în CSV. Exportul sau ștergerea tuturor celorlalte date le ceri, cum scrie în [termenii și condițiile ElectroField](/termeni). Întreabă același lucru la orice furnizor înainte să semnezi: ce primești, în ce format și în cât timp." },
    { q: "FSM sau ERP: de care am nevoie?", a: "Un ERP ține contabilitatea, gestiunea și salarizarea firmei. Un software pentru echipe de teren ține lucrarea: programarea, munca din teren, dovezile și ce e de facturat. Multe firme de instalații au nevoie de amândouă: ElectroField nu înlocuiește contabilitatea, ci emite factura prin SmartBill sau Oblio, din datele lucrării." },
    { q: "Face devize sau oferte?", a: "Nu. ElectroField pornește de la lucrarea stabilită: programare, execuție, documente și factură. Oferta o scrii separat, iar în dosarul fotovoltaic notezi data la care ai trimis-o." },
    { q: "E potrivit pentru o firmă cu 3 tehnicieni?", a: "Da, platforma e gândită pentru firme de la 2–3 tehnicieni la câteva zeci. La 2–3 oameni, Excelul și WhatsApp-ul pot încă ajunge; trecerea merită când pierzi lucrări la facturare, ore sau dovezi. Fă întâi [testul Excel, WhatsApp sau aplicație](/blog/excel-sau-aplicatie-gestionare-lucrari)." },
  ],
  related: [
    "program-management-firma-instalatii",
    "excel-sau-aplicatie-gestionare-lucrari",
    "gestionare-echipe-de-teren",
    "evidenta-orelor-tehnicieni-teren-pontaj",
    "urmarire-gps-echipe-teren-gdpr",
    "model-proces-verbal-raport-lucrare",
  ],
  updated: "2026-11-28",
  ogImage: "/og/software-management-echipe-teren.jpg",
  breadcrumb: "Software pentru echipe de teren",
};

export default page;
