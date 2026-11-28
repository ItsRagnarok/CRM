import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul din
// src/app/mobil: Android = APK descărcat de pe site (minSdk 24, adică Android 7), iPhone = din browser, push doar
// în APK; fără semnal pleacă doar ce e în src/lib/offline/queue.ts (poze, semnătură, sosire, pornire, închidere,
// formulare, fișe și vizite de gaze, incident SSM); mesajul „am plecat” îl trimite tehnicianul cu o atingere;
// raportul de intervenție PDF are checklistul, cheltuielile, numărul de poze și semnătura (nu pozele, nu orele);
// buletinul PRAM/izolație și PV-ul de punere în funcțiune nu se generează ca document.
const page: MarketingPage = {
  slug: "aplicatie-tehnician",
  title: "Aplicație pentru tehnicieni din teren: poze, semnătură",
  description: "Aplicație pentru tehnicieni din teren: lucrările zilei pas cu pas, poze etichetate, checklist, măsurători, semnătura clientului și fișa de intervenție PDF.",
  kicker: "Funcționalitate",
  h1: "Aplicație pentru tehnicieni din teren",
  lead: "Aplicația pentru tehnicieni din ElectroField pune lucrarea în telefonul omului din teren: lucrările zilei, adresa, ce are de luat și pașii lucrării, de la depozit până la semnătura clientului. Tehnicianul face pozele, bifează checklistul, trece măsurătorile și închide lucrarea, iar biroul vede totul pe lucrare. Pe Android folosește aplicația Android (APK, descărcată de pe site), iar pe iPhone lucrează din browser.",
  sections: [
    {
      h: "Ce face o aplicație pentru tehnicieni din teren?",
      id: "ce-face",
      answer: "O aplicație pentru tehnicieni din teren îi arată omului ce are de făcut azi și păstrează ce a făcut. În ElectroField, tehnicianul vede doar lucrările lui, trece pas cu pas prin fiecare, face poze etichetate, completează checklistul și formularele cu măsurători, ia semnătura clientului și trimite biroului rezumatul pentru factură.",
      list: [
        "Lucrările zilei, cu clientul, adresa, telefonul și navigarea spre adresă cu Google Maps sau Waze.",
        "Ce trebuie făcut, mesajul de la birou și lista „Ia cu tine”, cu materialele și sculele.",
        "Materialele consumate din [stocul de pe mașină](/stoc-materiale-pe-masini), cererile de materiale și achizițiile urgente, cu poza bonului.",
        "Cheltuielile, cererile de concediu, mesajele cu biroul și orele lui din săptămână.",
      ],
      p: [
        "Programarea, calendarul și harta stau la birou, în browser: vezi pagina despre [software de management pentru echipe de teren](/software-management-echipe-teren).",
      ],
    },
    {
      h: "Cum lucrează tehnicianul în aplicație, pas cu pas",
      id: "pas-cu-pas",
      answer: "Aplicația îl duce pe tehnician prin lucrare în ordinea în care lucrează: materialele, drumul, sosirea, lucrul, finalizarea și semnătura. Pe ecran vede la ce pas a ajuns. Plecarea, sosirea, pornirea și închiderea salvează ora, iar din ele se face pontajul pe lucrare, fără foi completate la final de zi.",
      blocks: [
        {
          type: "steps",
          items: [
            "Bifează materialele și sculele. Dacă îi lipsește ceva, trece pe la depozit și face poza cu ce a ridicat.",
            "Apasă „Plec spre locație” și îi trimite clientului, cu o atingere, pe SMS sau WhatsApp, mesajul că a plecat, cu linkul de status.",
            "La adresă apasă „Am ajuns la locație”: se salvează ora și, dacă telefonul o dă, locația. Face poza de sosire, dacă lucrarea o cere.",
            "Bifează verificarea de siguranță (la electrice: circuit separat și blocat, lipsa tensiunii verificată) și apasă „Pornește lucrul”.",
            "Lucrează: face poze, completează formularul cu măsurători, scade materialele folosite și raportează biroului o problemă, dacă apare.",
            "Bifează checklistul de final, scrie observațiile, face poza finală și finalizează lucrarea. Clientul semnează pe ecran.",
            "Trimite biroului rezumatul pentru factură: timpul pe lucrare, materialele, cheltuielile și ce a încasat la fața locului.",
          ],
        },
        {
          type: "p",
          text: "Cum se adună orele, cu corecții aprobate de birou, găsești la [pontajul pe lucrare al tehnicienilor](/pontaj-tehnicieni).",
        },
      ],
    },
    {
      h: "Poze, checklist și semnătura clientului: cum funcționează?",
      id: "poze-checklist-semnatura",
      answer: "Tehnicianul face poza din ecranul pasului în care e, iar poza primește singură eticheta: ridicare de la depozit, sosire, în timpul lucrării, finalizare, lucrări ascunse, bonuri sau problemă. Pozele se încarcă în fundal. Biroul le vede pe lucrare, cu eticheta lor, iar clientul le vede pe cele de dinainte și de după.",
      list: [
        "Biroul poate cere poză obligatorie la sosire, în timpul lucrului sau la final; aplicația arată ce lipsește.",
        "Pozele „Lucrări ascunse” se fac înainte de închiderea peretelui sau a șapei și intră în procesul-verbal de lucrări ascunse (vezi pagina pentru [firmele de instalații electrice](/firme-instalatii-electrice)).",
        "Checklisturile le faci la birou, pe tip de lucrare. Semnătura se dă cu degetul, cu numele celui care semnează; data și ora apar în raport.",
      ],
    },
    {
      h: "Fișa de intervenție digitală: ce documente ies din telefon?",
      id: "fisa-de-interventie",
      answer: "Fișa de intervenție digitală e raportul lucrării făcut din ce a completat tehnicianul în telefon, nu scris pe hârtie. În ElectroField, raportul de intervenție în PDF are clientul, adresa, echipa, data, descrierea, checklistul bifat, cheltuielile, numărul de poze și semnătura clientului. Restul ajunge în documentele din tabel.",
      blocks: [
        {
          type: "table",
          caption: "Ce trece tehnicianul în telefon și ce iese din asta",
          head: ["Din telefon", "Ce iese", "Unde"],
          rows: [
            ["Checklist, cheltuieli, semnătura clientului", "Raportul de intervenție, în PDF", "Pe lucrare și în telefon"],
            ["Pozele „Lucrări ascunse”", "Procesul-verbal de lucrări ascunse (model de lucru)", "La birou, de tipărit sau de salvat ca PDF"],
            ["Formularul „Verificare tablou electric”", "Măsurătorile pe circuit", "Pe lucrare; buletinul nu se generează încă"],
            ["Fișa de verificare sau revizie gaze, cu semnăturile", "Fișa de evidență, de tipărit", "La birou, cu termenele de după fișă"],
            ["Formularul de punere în funcțiune fotovoltaic", "Valorile pe string", "Pe lucrare; procesul-verbal nu se generează încă"],
            ["Timpul, materialele, încasarea pe loc", "Cererea de facturare", "La birou, la facturare"],
          ],
        },
        {
          type: "p",
          text: "Ce conține un proces-verbal: în [modelul de proces-verbal de lucrare pentru instalații](/blog/model-proces-verbal-raport-lucrare). Fișa de gaze e descrisă la [verificări și revizii la instalațiile de gaze](/firme-gaze-verificari-revizii), iar factura pleacă prin [facturarea din lucrări cu SmartBill sau Oblio](/facturare-smartbill-oblio).",
        },
      ],
    },
    {
      h: "Merge aplicația fără semnal?",
      id: "fara-semnal",
      answer: "În parte. Pozele, semnătura, sosirea, pornirea și închiderea lucrării, formularele cu măsurători, fișele și vizitele de gaze și incidentele SSM se salvează pe telefon și pleacă singure când revine semnalul, în ordine. Plecarea spre client, bifele din checklist, consumul de materiale, cheltuielile, cererile de concediu și mesajele cer semnal.",
      p: [
        "Lucrările deschise cât a fost semnal rămân vizibile, iar pe ecran apare ce așteaptă să plece, cu butonul „Trimite acum”. Ora salvată e cea a apăsării, nu a trimiterii.",
      ],
    },
    {
      h: "Pe ce telefoane merge aplicația pentru tehnicieni?",
      id: "telefoane",
      answer: "Pe Android, tehnicianul instalează aplicația Android (APK, descărcată de pe site, din pagina de conectare), pe Android 7 sau mai nou. Pe iPhone lucrează din browser și poate pune pagina pe ecranul principal. Contul e același pe orice telefon, iar biroul lucrează în browser, pe calculator.",
      list: [
        "Notificările push (lucrări noi, mutări de program, mesaje, răspunsuri la cereri) merg doar în aplicația Android. Pe iPhone, noutățile apar la clopoțel, în aplicație.",
        "La prima instalare, Android îți cere să permiți instalarea aplicațiilor din afara magazinului de aplicații.",
        "Urmărirea continuă pe hartă cere setarea firmei și acordul angajatului; cu ecranul blocat, merge doar din aplicația Android.",
      ],
    },
    {
      h: "Ce vede tehnicianul și ce rămâne la birou?",
      id: "ce-vede-tehnicianul",
      answer: "Tehnicianul vede lucrările pe care e programat, cu clientul, adresa, telefonul, descrierea și ce are de luat. Materialele din mașină le vede cu nume și cantitate, fără prețuri de achiziție. Facturarea, rapoartele, costul și profitul lucrărilor și setările firmei nu se deschid din contul de tehnician sau de șef de echipă.",
      p: [
        "Cum împarți ce vede fiecare rol: în articolul [tehnician vs. administrator: ce trebuie să vadă fiecare](/blog/tehnician-vs-administrator).",
      ],
    },
    {
      h: "Ce primește clientul de la tehnician?",
      id: "client",
      answer: "Clientul primește un link de status, fără cont și fără aplicație. Mesajul cu linkul i-l trimite tehnicianul cu o atingere, pe SMS sau WhatsApp, când pleacă spre el. Pe link clientul vede stadiul lucrării, fereastra de sosire și cine vine, iar după lucrare pozele de dinainte și de după, documentele și semnătura.",
      p: [
        "Ce mai predai clientului la final: în ghidul despre [documentele de predare după instalare](/blog/documente-predare-client-dupa-instalare).",
      ],
    },
    {
      h: "Gândită pentru teren: mănuși, soare, scanare",
      id: "pentru-teren",
      list: [
        "Mod mănuși (butoane mai mari) și mod soare (contrast mare).",
        "Scanare pentru bonuri, facturi, etichete și documente; seriile invertorului, bateriei și panourilor se citesc cu camera, util la [montajul fotovoltaic](/firme-fotovoltaice).",
        "Citirea cu AI a plăcuței (marcă, model, serie) completează câmpurile; tehnicianul le confirmă, iar firma o poate opri.",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu se instalează dintr-un magazin de aplicații: pe Android instalezi APK-ul de pe site, pe iPhone lucrezi din browser.",
        "Mesajul „am plecat” nu se trimite singur: îl trimite tehnicianul, cu o atingere.",
        "Nu are constructor de formulare: folosești formularele cu măsurători din platformă și fișa de gaze.",
        "Nu generează buletinul PRAM sau de izolație și nici procesul-verbal de punere în funcțiune: valorile se înregistrează pe lucrare.",
        "Raportul de intervenție în PDF arată numărul de poze, nu pozele.",
      ],
    },
  ],
  faq: [
    { q: "Trebuie telefoane noi pentru tehnicieni?", a: "Nu neapărat. Aplicația Android (APK, descărcată de pe site) merge pe Android 7 sau mai nou, iar pe iPhone tehnicianul lucrează din browser. Telefonul are nevoie de cameră și de GPS pornit, pentru locația de la sosire." },
    { q: "Se pierde ce a lucrat dacă închide aplicația fără semnal?", a: "Ce așteaptă să plece rămâne pe telefon și după ce închide aplicația. Se trimite la următoarea deschidere cu semnal, în ordine și cu ora reală a fiecărei apăsări. Până nu s-a trimis tot, tehnicianul nu trebuie să se deconecteze din cont." },
    { q: "Ce face tehnicianul dacă clientul nu e acasă și nu poate semna?", a: "Pe ecranul de semnătură apasă „Clientul nu e prezent”, iar biroul primește notificare. După ce vorbește cu biroul, închide lucrarea fără semnătură. Biroul vede pe lucrare că semnătura lipsește." },
    { q: "Ce face tehnicianul dacă îi lipsește un material?", a: "Cere achiziția din aplicație sau reaprovizionarea mașinii, iar răspunsul biroului îl vede în aplicație. Dacă îl cumpără pe drum, face poza bonului, iar cheltuiala intră pe lucrare și așteaptă aprobarea biroului." },
    { q: "Pot alege ce bifează tehnicianul la fiecare lucrare?", a: "Da. Checklisturile le faci la birou, pe tip de lucrare: unul pentru plecare, cu materialele și sculele, și unul pentru final. Punctele tale nu se pot șterge din telefon; tehnicianul poate adăuga altele." },
    { q: "Pot vedea unde e tehnicianul?", a: "La sosire se salvează locația, dacă telefonul o dă. Urmărirea continuă pe hartă pornește doar dacă firma o activează și angajatul își dă acordul, pe care îl poate retrage din aplicație. Ce cere GDPR: în ghidul despre [urmărirea echipelor cu GPS și GDPR](/blog/urmarire-gps-echipe-teren-gdpr)." },
  ],
  related: [
    "tehnician-vs-administrator",
    "model-proces-verbal-raport-lucrare",
    "documente-predare-client-dupa-instalare",
    "excel-sau-aplicatie-gestionare-lucrari",
    "gestionare-echipe-de-teren",
    "urmarire-gps-echipe-teren-gdpr",
  ],
  updated: "2026-11-28",
  ogImage: "/og/aplicatie-tehnician.jpg",
  breadcrumb: "Aplicația tehnicianului",
};

export default page;
