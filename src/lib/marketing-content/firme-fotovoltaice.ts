import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul:
// etapele și datele dosarului din src/lib/pv.ts și src/app/(app)/fotovoltaic/pv-forms.tsx, formularul de
// punere în funcțiune din src/lib/forms/templates.ts, Voc-ul așteptat din src/lib/forms/pv.ts, verificarea SSM
// din src/lib/ssm.ts. Procesul-verbal de punere în funcțiune NU se generează ca document; mesajul către
// operator e o ciornă copiată de firmă; reviziile nu se repetă singure; dosarul și lucrarea sunt separate.
// Fără termene legale: ceasul numără după reperul ales de firmă.
const page: MarketingPage = {
  slug: "firme-fotovoltaice",
  title: "Program pentru firme fotovoltaice: dosar, montaj și PIF",
  description: "Program pentru firme fotovoltaice: dosar pe etape, ceas pentru termenele operatorului, echipe de montaj și măsurători PIF pe fiecare string, din telefon.",
  kicker: "Pentru firme de montaj fotovoltaic",
  h1: "Program pentru firme fotovoltaice: dosar, montaj și punere în funcțiune",
  lead: "ElectroField e un program pentru firme fotovoltaice care țin mai multe proiecte deodată: dosarul fiecărui proiect pe etape, de la ofertă la garanție, ceasul pentru termenele operatorului și lucrările echipelor de montaj, cu pozele și măsurătorile de punere în funcțiune (PIF) pe fiecare string. Biroul lucrează în browser, montatorii din telefon.",
  sections: [
    {
      h: "Ce face un program pentru firme fotovoltaice?",
      id: "ce-face",
      answer: "Un program pentru firme fotovoltaice, numit și software de montaj fotovoltaic, ține în același loc dosarul fiecărui proiect și lucrările echipelor de montaj. În dosar vezi etapa, datele importante și câte zile au trecut de la depunerea la operator. Pe lucrare, montatorul trece din telefon pozele, seriile și măsurătorile pe string, iar clientul semnează pe ecran.",
      list: [
        "Dosarul pe etape, cu toate proiectele pe o tablă cu coloane.",
        "Ceas pentru ATR și pentru certificatul de racordare, cu mesaj pregătit pentru operator la depășire.",
        "Montajul în calendar, pe echipe, cu avertismente pentru autorizații, lucru la înălțime și materiale lipsă.",
        "Formularul de punere în funcțiune în [aplicația pentru tehnicieni](/aplicatie-tehnician).",
        "[Pontajul pe lucrare](/pontaj-tehnicieni), [stocul din mașini și depozite](/stoc-materiale-pe-masini) și [factura prin SmartBill sau Oblio](/facturare-smartbill-oblio).",
      ],
    },
    {
      h: "Cum arată dosarul unui proiect fotovoltaic pe etape?",
      id: "dosar-pe-etape",
      answer: "Fiecare proiect are un dosar cu persoana de contact, adresa, puterea în kWp, operatorul de distribuție și numărul de înregistrare. Dosarul trece prin șapte etape: Ofertă, Contract și avans, Montaj, ATR / avize, Punere în funcțiune, AFM / garanție și Finalizat. Etapa o alegi tu, iar la fiecare notezi datele care contează.",
      blocks: [
        {
          type: "table",
          caption: "Etapele dosarului fotovoltaic și ce notezi la fiecare",
          head: ["Etapă", "Ce notezi în dosar", "Ce face platforma"],
          rows: [
            ["Ofertă", "Data la care ai trimis oferta", "Nimic automat; oferta o scrii separat"],
            ["Contract și avans", "Data contractului și data avansului", "Păstrează datele"],
            ["Montaj", "Data montajului", "Lucrarea o programezi în calendar, pe o echipă"],
            ["ATR / avize", "Operatorul, numărul dosarului, ATR depus și ATR primit", "Ceasul ATR, de la data depunerii"],
            ["Punere în funcțiune", "Certificatul de racordare cerut și primit", "Ceasul certificatului, de la data cererii"],
            ["AFM / garanție", "Dosar AFM depus, decontare primită, garanție până la", "Zilele de la depunerea la AFM, fără termen"],
            ["Finalizat", "Notele de care mai ai nevoie", "Dosarul iese din lista celor active"],
          ],
        },
        {
          type: "p",
          text: "Ecranul de dosare arată proiectele pe coloane, după etapă, plus dosarele active, termenele depășite, kWp-ul în lucru și decontările AFM așteptate. Dosarul și lucrarea de montaj sunt separate: dosarul ține etapele și termenele, iar lucrarea ține echipa, formularul, pozele și semnătura.",
        },
      ],
    },
    {
      h: "Cum urmărești termenele operatorului de distribuție?",
      id: "termene-operator",
      answer: "Când completezi data la care ai depus cererea de ATR sau cererea de certificat de racordare, pornește un ceas: câte zile au trecut și câte mai sunt până la reperul firmei. Când reperul trece, dosarul se colorează în roșu, apare pe panoul de start și primești un mesaj pregătit pentru operator.",
      p: [
        "Reperul îl setează administratorul, separat pentru ATR și pentru certificat, în zile calendaristice. Platforma pornește cu 15 zile pentru ATR și 10 pentru certificat, ca valori de început pe care le schimbi după contract sau după scrisoarea operatorului.",
        "Mesajul e factual: numărul dosarului, data depunerii, zilele trecute și ce ceri (stadiul, documentele lipsă, data de emitere). Nu pleacă singur: îl verifici, îl copiezi și îl trimiți pe canalul operatorului.",
      ],
      blocks: [
        {
          type: "callout",
          title: "Termenul legal nu îl stabilește platforma",
          text: "Ceasul numără după reperul tău. Termenul care se aplică dosarului îl confirmi din contract sau din răspunsul operatorului. Pașii, explicați pentru client, sunt în ghidul despre [etapele și termenele dosarului de prosumator](/blog/dosar-prosumator-etape-termene-atr).",
        },
      ],
    },
    {
      h: "Cum lucrează echipa de montaj fotovoltaic în teren, pas cu pas",
      id: "montaj-pas-cu-pas",
      blocks: [
        { type: "p", text: "Un exemplu de montaj pe acoperișul unei case, de la programare la semnătură:" },
        {
          type: "steps",
          items: [
            "Biroul pune lucrarea de montaj pe o echipă în calendar și o marchează ca lucrare la înălțime. Vezi avertisment dacă autorizația cuiva din echipă e expirată la data lucrării, dacă cineva nu are documentul „apt pentru lucru la înălțime” valabil sau dacă lipsește material din stoc.",
            "Montatorul vede în telefon adresa și materialele de luat, de exemplu panouri, invertor și structură. Le ridică din depozit sau din mașină și îi trimite clientului cu o atingere, pe SMS sau WhatsApp, mesajul că a plecat.",
            "La sosire apasă „Am ajuns la locație”: se salvează ora și locația. Înainte să urce, bifează verificarea SSM: hamul și ancorarea, scara sau schela, vremea, separatorul DC deschis și zona de sub acoperiș delimitată.",
            "Face pozele cu eticheta potrivită: panourile, prinderile și eticheta invertorului la „În lucru”, tabloul AC/DC și împământarea la „Ascuns”, instalația gata la „După”.",
            "Completează formularul de punere în funcțiune, apoi clientul semnează pe ecran.",
            "Biroul vede valorile și lista „Dosar complet?”: formularul, pozele, semnătura, documentele și, dacă folosești registrul de conformitate, autorizațiile valabile. Apoi facturează din orele pontate și din materialele consumate.",
          ],
        },
        {
          type: "p",
          text: "Pozele, sosirea, începutul și finalul lucrării, formularul și semnătura se salvează pe telefon și pleacă singure când revine semnalul. Plecarea spre client, consumul de materiale și cheltuielile cer semnal. Montatorii folosesc aplicația Android (APK, descărcată de pe site) sau, pe iPhone, platforma din browser.",
        },
        {
          type: "p",
          text: "Pregătirea, de la vizita la client până la predare, e în [checklistul pentru instalarea unui sistem fotovoltaic](/blog/checklist-instalare-sistem-fotovoltaic).",
        },
      ],
    },
    {
      h: "Ce se măsoară la punerea în funcțiune (PIF) pe fiecare string?",
      id: "pif-pe-string",
      answer: "În formularul de punere în funcțiune, montatorul trece pentru fiecare string numărul de panouri, tensiunea de mers în gol (Voc), curentul de scurtcircuit (Isc), rezistența de izolație și polaritatea. Formularul primește până la 12 stringuri. Separat trece temperatura celulelor la măsurare, rezistența prizei de pământ și rezultatul: conform sau neconform.",
      blocks: [
        {
          type: "table",
          caption: "Ce conține formularul de punere în funcțiune",
          head: ["Pasul din formular", "Ce trece montatorul"],
          rows: [
            ["Invertor și panouri", "Modelul și seria invertorului; numărul, puterea și modelul panourilor; Voc-ul panoului din fișa tehnică și coeficientul de temperatură"],
            ["Baterie și serii", "Modelul, seria și capacitatea bateriei, dacă există; seriile panourilor, câte una pe rând"],
            ["Măsurători pe stringuri", "Temperatura celulelor; pe fiecare string: panouri, Voc (V), Isc (A), izolație (MΩ), polaritate"],
            ["Rezultat", "Rezistența prizei de pământ (Ω), rezultatul și observațiile"],
          ],
        },
        {
          type: "p",
          text: "Seriile se scanează cu camera de pe etichetă, iar modelul și seria invertorului se pot citi din poza plăcuței, cu funcția AI, dacă firma o folosește; valorile citite le verifică montatorul. Din Voc-ul panoului și temperatură, formularul arată pe loc Voc-ul așteptat pe fiecare string și abaterea față de cel măsurat.",
        },
        {
          type: "callout",
          title: "Platforma nu judecă valorile",
          text: "Voc-ul așteptat e doar un reper calculat din fișa panoului. Rezultatul îl stabilește cel care măsoară, după fișa tehnică și normativ. Despre priza de pământ, vezi ghidul cu [valorile prizei de pământ și cum o măsori](/blog/priza-de-pamant-valori-masurare).",
        },
      ],
    },
    {
      h: "Ce documente ies din datele de pe teren?",
      id: "documente",
      answer: "Procesul-verbal de punere în funcțiune nu se generează încă din platformă: valorile din formular le vezi pe lucrare, iar procesul-verbal îl completezi după un model. Din platformă ies raportul lucrării în PDF, pagina de status pentru client, cu pozele și documentele, și factura, emisă prin contul tău.",
      blocks: [
        {
          type: "table",
          caption: "Ce rămâne pe o lucrare de montaj fotovoltaic și în ce formă",
          head: ["Ce ai", "Din ce date", "În ce formă"],
          rows: [
            ["Valorile de punere în funcțiune", "Formularul completat de montator", "Pe pagina lucrării, cu autorul și ora"],
            ["Pozele", "Pozele etichetate din telefon", "Pe lucrare, grupate după etichetă"],
            ["Raportul lucrării", "Checklistul, cheltuielile, numărul de poze, semnătura clientului", "PDF"],
            ["Pagina de status", "Etapele, cine vine, pozele înainte și după, documentele bifate „Pentru client”", "Link, fără cont pentru client"],
            ["Factura", "Orele înmulțite cu tariful tău, materialele cu adaosul tău", "Emisă prin contul tău SmartBill sau Oblio"],
          ],
        },
        {
          type: "p",
          text: "Un model completabil, cu fișa de măsurători pe string, găsești în ghidul [model de proces-verbal de punere în funcțiune fotovoltaic](/blog/proces-verbal-punere-in-functiune-fotovoltaic-model). Documentul semnat îl încarci pe lucrare și îl bifezi „Pentru client”. Restul actelor sunt în ghidul despre [documentele de predare după instalare](/blog/documente-predare-client-dupa-instalare).",
        },
      ],
    },
    {
      h: "Cum ții service-ul și reclamațiile după montaj?",
      id: "service",
      answer: "O reclamație de tipul „panourile produc puțin” devine o lucrare nouă pentru același client, programată pe o echipă. În fișa clientului găsești lucrările anterioare, cu formularul de punere în funcțiune, seriile, pozele și semnătura. Echipa pleacă știind ce s-a montat și ce s-a măsurat la punerea în funcțiune.",
      p: [
        "Reviziile le programezi tu, ca lucrări în calendar; platforma nu le repetă singură. Clientul poate cere o intervenție și din formularul online al firmei, iar cererea ajunge la birou. Înainte să trimiți echipa, vezi [ce verifici când panourile fotovoltaice produc puțin](/blog/panouri-fotovoltaice-produc-putin-verificari).",
        "Data până la care ține garanția o notezi în dosar. Cât răspunzi pentru lucrare e explicat în ghidul despre [garanția legală la lucrări fotovoltaice](/blog/garantie-legala-lucrari-electrice-fotovoltaice-cat-tii-raspunderea).",
      ],
    },
    {
      h: "Pentru ce firme fotovoltaice e potrivit?",
      id: "pentru-cine",
      answer: "Pentru firme de montaj fotovoltaic cu una până la câteva zeci de echipe, care țin în paralel mai multe dosare deschise la operator și fac și service după montaj. Dacă faci și instalații electrice sau gaze, alegi domeniile firmei, iar lucrările, echipele, pontajul și facturarea rămân comune.",
      p: [
        "Pentru partea electrică vezi pagina pentru [firme de instalații electrice](/firme-instalatii-electrice), iar imaginea de ansamblu, pe cea despre [software de management pentru echipe de teren](/software-management-echipe-teren).",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu proiectează și nu dimensionează sistemul și nu calculează producția.",
        "Nu face oferte sau devize.",
        "Nu generează încă procesul-verbal de punere în funcțiune ca document tipărit, cu valorile completate.",
        "Nu depune nimic la operator sau la AFM, nu trimite singur mesajul către operator și nu citește portalul operatorului sau monitorizarea invertorului.",
        "Nu repetă singur reviziile, nu te anunță încă la expirarea garanției și nu importă dosare din Excel.",
        "Nu spune dacă o valoare măsurată e bună: rezultatul îl stabilește cel care măsoară.",
      ],
    },
  ],
  faq: [
    { q: "Pot urmări termenele operatorului pentru ATR și certificatul de racordare?", a: "Da. Când completezi data depunerii, pornește ceasul, după reperul de zile setat de administrator. La depășire, dosarul apare în roșu și pe panoul de start, cu un mesaj pregătit pentru operator, pe care îl trimiți tu. Termenul care se aplică îl confirmi din contract sau de la operator." },
    { q: "Generează ElectroField procesul-verbal de punere în funcțiune?", a: "Nu încă, ca document tipărit cu valorile. Montatorul completează formularul în telefon, iar biroul vede valorile pe lucrare. Procesul-verbal îl faci după un model, de exemplu cel din [ghidul de proces-verbal de punere în funcțiune](/blog/proces-verbal-punere-in-functiune-fotovoltaic-model), și îl încarci pe lucrare." },
    { q: "Face oferte sau devize pentru sisteme fotovoltaice?", a: "Nu. ElectroField nu are modul de oferte sau devize și nu dimensionează sistemul. În dosar notezi data ofertei, iar oferta o scrii separat, de exemplu după [modelul de ofertă pentru lucrări electrice și fotovoltaice](/blog/model-oferta-lucrari-electrice-fotovoltaice)." },
    { q: "Depune platforma dosarul la operator sau la AFM?", a: "Nu. Platforma nu e legată de operatorii de distribuție și nici de AFM. Notezi ce ai depus și când, iar ceasul arată câte zile au trecut. Mesajul către operator îl pregătește platforma, dar îl trimiți tu." },
    { q: "Merge aplicația pe acoperiș, fără semnal?", a: "În mare parte, da. Pozele, sosirea, începutul și finalul lucrării, formularul de punere în funcțiune și semnătura clientului se salvează pe telefon și pleacă singure când revine semnalul. Plecarea spre client, consumul de materiale și cheltuielile cer semnal." },
    { q: "Pe ce telefoane merge aplicația pentru montatori?", a: "Pe Android instalezi aplicația (APK, descărcată de pe site), iar pe iPhone folosești platforma din browser. Notificările push merg doar în aplicația Android. Biroul lucrează în browser, pe calculator." },
    { q: "Pot muta în platformă proiectele pe care le țin acum în Excel?", a: "Nu din fișier. Creezi fiecare dosar din birou, cu numele, contactul, adresa și puterea, apoi treci datele pe care le ai deja, de exemplu ATR depus. Ceasurile pornesc de la aceste date, nu de la ziua în care ai creat dosarul." },
    { q: "Pot lucra și pe instalații electrice în același cont?", a: "Da. Alegi domeniile firmei (electrice, gaze, fotovoltaice), iar meniul arată doar ce folosești. Lucrările, echipele, pontajul și facturarea sunt comune. Fiecare lucrare are domeniul ei, iar telefonul îi arată montatorului formularul potrivit." },
  ],
  related: [
    "dosar-prosumator-etape-termene-atr",
    "proces-verbal-punere-in-functiune-fotovoltaic-model",
    "checklist-instalare-sistem-fotovoltaic",
    "panouri-fotovoltaice-produc-putin-verificari",
    "priza-de-pamant-valori-masurare",
    "garantie-legala-lucrari-electrice-fotovoltaice-cat-tii-raspunderea",
  ],
  updated: "2026-11-28",
  ogImage: "/og/firme-fotovoltaice.jpg",
  breadcrumb: "Firme fotovoltaice",
};

export default page;
