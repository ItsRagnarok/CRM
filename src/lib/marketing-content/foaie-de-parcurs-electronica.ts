import type { MarketingPage } from "../marketing-pages";

// Afirmațiile urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul din
// src/app/(app)/foaie-parcurs/page.tsx: foaia se face din lucrările terminate ale echipei căreia îi e
// alocată acum mașina. Coloana de km citește jobs.distance_km și costul organizations.fuel_cost_per_km,
// dar niciun formular, ecran mobil sau setare nu le scrie (doar datele demo): pentru o firmă reală km
// apar „—” și costul nu apare, deci nu le prezentăm ca fiind completate (R3 §5.1, de confirmat).
// Fără export PDF/Excel, fără GPS, fără kilometraj de bord. Forma fiscală o confirmă contabilul;
// regulile fiscale și modelul stau în /blog/model-foaie-de-parcurs, nu aici.
const page: MarketingPage = {
  slug: "foaie-de-parcurs-electronica",
  title: "Foaie de parcurs electronică pentru mașinile firmei",
  description: "Foaie de parcurs electronică pe fiecare mașină, făcută lunar din lucrările terminate ale echipei: dată, adresă și scopul deplasării. Plus ITP, RCA și stoc.",
  kicker: "Funcționalitate",
  h1: "Foaie de parcurs electronică pentru mașinile firmei",
  lead: "ElectroField îți face o foaie de parcurs electronică pentru fiecare mașină a firmei, din lucrările pe care echipa mașinii le-a terminat în luna respectivă. Pe fiecare rând ai data, adresa și scopul deplasării. Kilometrii nu se completează încă din platformă: îi treci tu, apoi dai foaia contabilului.",
  sections: [
    {
      h: "Ce este foaia de parcurs electronică din ElectroField?",
      id: "ce-este",
      answer: "Este evidența lunară a deplasărilor fiecărei mașini, făcută din lucrările terminate ale echipei care folosește mașina. Foaia nu are un formular separat: fiecare lucrare închisă devine un rând, cu data, adresa și scopul deplasării. O găsești în meniul Stoc și mașini, la Foaie de parcurs, pe lună și pe mașină.",
      p: [
        "Foaia o vede doar biroul: administratorul și managerul (dispecerul). Treci de la o lună la alta și alegi „Toate mașinile” sau o singură mașină; din fiecare rând ajungi direct la lucrare.",
      ],
      blocks: [
        {
          type: "callout",
          title: "Cauți un model de foaie de parcurs?",
          text: "Un model de completat și ce trebuie să conțină foaia găsești în [ghidul cu modelul de foaie de parcurs](/blog/model-foaie-de-parcurs). Pagina de față descrie varianta electronică, făcută din lucrările echipei.",
        },
      ],
    },
    {
      h: "Ce conține foaia de parcurs electronică, câmp cu câmp",
      id: "ce-contine",
      answer: "Pentru fiecare mașină, foaia arată numărul de înmatriculare, echipa și conducătorul auto, apoi câte un rând pe fiecare lucrare terminată: data, drumul „Sediu → adresa lucrării” și scopul deplasării. Sus vezi câte zile cu lucrări a avut mașina în lună. Foaia are o coloană pentru kilometri, dar platforma nu are încă un câmp în care să-i treci.",
      blocks: [
        {
          type: "table",
          caption: "Câmpurile foii de parcurs și de unde vin datele",
          head: ["Câmp", "De unde vine"],
          rows: [
            ["Mașina", "Numărul de înmatriculare și denumirea, din lista mașinilor firmei"],
            ["Echipa și conducătorul auto", "Echipa căreia îi e alocată mașina și șoferul ales pe mașină, în pagina Echipe"],
            ["Data", "Ziua în care era programată lucrarea terminată"],
            ["Plecare → destinație", "„Sediu → adresa lucrării”; dacă lucrarea nu are adresă, numele clientului"],
            ["Scopul deplasării", "Titlul lucrării, cu legătură spre pagina ei"],
            ["Kilometri", "Coloană pentru kilometri; platforma nu îi calculează și nu are încă un câmp în care să-i treci"],
            ["Total pe lună", "Numărul de zile cu lucrări ale mașinii în luna aleasă"],
          ],
        },
      ],
    },
    {
      h: "Cum se face foaia de parcurs, pas cu pas",
      id: "pas-cu-pas",
      blocks: [
        {
          type: "steps",
          items: [
            "Adaugi mașinile firmei și le aloci echipelor, în pagina Echipe. Pe fiecare mașină alegi conducătorul auto.",
            "Biroul programează lucrările pe echipe, în calendar. Dacă mașina echipei are ITP-ul, RCA-ul sau rovinieta expirate la data lucrării, vezi un avertisment; decizia rămâne a ta.",
            "Tehnicianul face lucrarea din [aplicația pentru tehnicieni](/aplicatie-tehnician) și o închide la final. Finalizarea se salvează pe telefon și pleacă singură când revine semnalul.",
            "Lucrarea terminată apare în foaia mașinii, în ziua programată, cu adresa și scopul ei.",
            "La final de lună deschizi foaia, alegi luna și mașina și verifici rândurile.",
            "Treci kilometrii și drumurile care nu țin de o lucrare în forma pe care o folosește contabilul, apoi îi trimiți foaia.",
          ],
        },
      ],
    },
    {
      h: "De unde iei kilometrii pentru foaia de parcurs?",
      id: "kilometri",
      answer: "Deocamdată nu din ElectroField. Platforma nu are încă un câmp pentru kilometri pe lucrare sau pentru costul pe kilometru, nu citește kilometrajul de bord și nu calculează distanța din traseul GPS. Kilometrii îi iei din kilometrajul mașinii sau dintr-un sistem GPS de flotă și îi treci tu, înainte să dai foaia contabilului.",
      p: [
        "Locația salvată când echipa apasă „Am ajuns la locație” ține de [pontajul pe lucrare](/pontaj-tehnicieni) și nu se folosește la kilometri. Urmărirea continuă pe hartă e o opțiune separată, care cere setarea firmei și acordul angajatului. Ce înseamnă asta pentru GDPR găsești în ghidul despre [urmărirea GPS a echipelor din teren](/blog/urmarire-gps-echipe-teren-gdpr).",
        "Cât timp lucrarea nu are kilometri, în costul ei rândul „Deplasare (combustibil)” rămâne la zero. Cum ții cont de drumuri în marjă e explicat în ghidul [cum calculezi profitul pe lucrare](/blog/cum-calculezi-profitul-pe-lucrare).",
      ],
    },
    {
      h: "Foaia de parcurs electronică e bună pentru contabilitate?",
      id: "contabilitate",
      answer: "Forma finală o stabilește contabilul firmei. ElectroField îți dă datele de bază, luate din lucrările reale: zi, adresă și scop; kilometrii îi adaugi tu. Nu verifică dacă foaia îndeplinește condițiile pentru deducerea cheltuielilor cu mașina și nu calculează partea deductibilă. Arată-i contabilului ce câmpuri are foaia și întreabă-l ce trebuie adăugat.",
      p: [
        "Dacă contabilul îți cere kilometrajul de bord sau consumul normat al mașinii, le treci separat: foaia nu are câmpuri pentru ele. Ce elemente trebuie să aibă foaia găsești în [modelul de foaie de parcurs, cu explicații pe câmpuri](/blog/model-foaie-de-parcurs).",
      ],
    },
    {
      h: "Hârtie, Excel, GPS de flotă sau foaie din lucrări?",
      id: "variante",
      answer: "Pe hârtie sau în Excel, foaia se scrie din memorie sau se copiază din calendar și din mesaje. Un sistem GPS de flotă înregistrează traseul real, dar de obicei nu știe ce lucrare ai făcut la adresă. Foaia din ElectroField pleacă de la lucrări: știe scopul fiecărei deplasări, iar kilometrii îi adaugi tu.",
      blocks: [
        {
          type: "table",
          caption: "Variantele de foaie de parcurs, pe scurt",
          head: ["Varianta", "De unde vin datele", "Ce rămâne de făcut"],
          rows: [
            ["Foaie pe hârtie", "Șoferul o scrie zilnic sau la final de lună", "Strângi foile, descifrezi scrisul, completezi ce lipsește"],
            ["Tabel Excel", "Biroul copiază din calendar, mesaje și bonuri", "Copiezi de mână, mașină cu mașină"],
            ["Sistem GPS de flotă", "Dispozitivul din mașină înregistrează traseul și kilometrii", "Legi fiecare drum de lucrarea sau de clientul lui"],
            ["Foaia din ElectroField", "Lucrările terminate ale echipei mașinii", "Treci kilometrii și adaugi drumurile fără lucrare"],
          ],
        },
        {
          type: "p",
          text: "Dacă ai deja un sistem GPS de flotă, nu trebuie să renunți la el: din el iei kilometrii reali, din ElectroField afli scopul fiecărei deplasări. Cum scurtezi drumurile dintre lucrări e explicat în ghidul despre [reducerea timpilor de deplasare](/blog/reducere-timpi-deplasare-lucrari).",
        },
      ],
    },
    {
      h: "Mașina firmei: ITP, RCA, rovinietă și stocul din portbagaj",
      id: "masina",
      p: [
        "Documentele mașinii stau în secțiunea Conformitate: ITP, RCA, rovinietă și CASCO, fiecare cu data de expirare. Platforma te anunță cu 60, 30 și 7 zile înainte și în ziua expirării. Dacă programezi echipa pe o zi în care un document al mașinii e expirat, vezi un avertisment la programare.",
        "Fiecare mașină are și stocul ei: listă țintă de materiale și scule, cu prag minim. Consumul de pe lucrări scade stocul, iar ce coboară sub prag apare la reaprovizionare. Detaliile sunt pe pagina despre [stocul de materiale pe mașini](/stoc-materiale-pe-masini).",
        "Bonurile de combustibil le trimite tehnicianul din telefon, ca cheltuială cu poza bonului, iar biroul le aprobă. Ele nu apar în foaia de parcurs; le vezi la cheltuieli.",
      ],
    },
    {
      h: "Pentru ce firme e utilă foaia de parcurs din lucrări?",
      id: "pentru-cine",
      answer: "Pentru firmele în care fiecare echipă are mașina ei și face mai multe lucrări pe zi: electricieni, echipe de verificări și revizii gaze, echipe de montaj fotovoltaic. Acolo foaia scrisă de mână se completează greu, iar lucrările din calendar spun deja unde a fost mașina și de ce.",
      p: [
        "Vezi cum arată lucrul pe fiecare meserie la [firme de instalații electrice](/firme-instalatii-electrice), [firme de verificări și revizii gaze](/firme-gaze-verificari-revizii) și [firme de montaj fotovoltaic](/firme-fotovoltaice). Imaginea de ansamblu e pe pagina despre [software de management pentru echipe de teren](/software-management-echipe-teren).",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu are un câmp pentru kilometri și nici pentru costul pe kilometru.",
        "Nu citește kilometrajul de bord și nu calculează kilometrii din traseul GPS.",
        "Nu are câmpuri pentru kilometrajul la plecare și la sosire sau pentru consumul normat.",
        "Drumurile care nu țin de o lucrare terminată (la furnizor, la service, între depozite) nu apar în foaie.",
        "Fiecare lucrare apare ca drum „Sediu → adresă”; drumul direct de la un client la altul nu are rând separat.",
        "Foaia urmează alocarea de acum a mașinii: dacă o muți la altă echipă sau schimbi șoferul, și lunile trecute se afișează pe echipa și pe șoferul noi.",
        "Dacă aloci două mașini aceleiași echipe, ambele foi arată aceleași lucrări.",
        "Nu are încă export PDF sau Excel al foii.",
        "Nu stabilește partea deductibilă a cheltuielilor cu mașina și nu optimizează traseele.",
      ],
    },
    {
      h: "Surse, verificate la 28 noiembrie 2026",
      id: "surse",
      p: [
        "Legea nr. 227/2015 privind Codul fiscal și Normele metodologice aprobate prin HG nr. 1/2016, pct. 16 alin. (2) și pct. 68 alin. (2) și (4), în textul actualizat publicat de ANAF. Pentru textul în vigoare la data la care îl folosești, verifică pe legislatie.just.ro.",
      ],
      list: [
        "[ANAF: Codul fiscal (Legea nr. 227/2015) cu Normele metodologice (HG nr. 1/2016), text actualizat](https://static.anaf.ro/static/10/Anaf/legislatie/Cod_fiscal_norme_2023.htm)",
      ],
    },
  ],
  faq: [
    { q: "Ce este o foaie de parcurs electronică?", a: "O foaie de parcurs ținută într-un program, nu pe hârtie. În ElectroField se face din lucrările terminate ale echipei fiecărei mașini: un rând pe lucrare, cu data, adresa și scopul. Kilometrii îi adaugi tu. Forma finală o stabilești cu contabilul." },
    { q: "Este obligatorie foaia de parcurs?", a: "Normele Codului fiscal cer foaia de parcurs ca dovadă când deduci integral cheltuielile și TVA-ul la o mașină de până la 3,5 tone și cel mult 9 scaune, folosită exclusiv pentru firmă (pct. 16 alin. 2 și pct. 68 alin. 2). La deducerea limitată de 50% nu e cerută ca dovadă. Varianta potrivită o stabilești cu contabilul; detalii în [ghidul cu model de foaie de parcurs](/blog/model-foaie-de-parcurs)." },
    { q: "Tehnicianul completează ceva pentru foaia de parcurs?", a: "Nu completează un formular separat. Foaia se face din lucrările pe care echipa le închide în aplicație. Kilometrii nu se completează încă din platformă; îi adaugă biroul la final de lună." },
    { q: "Pot tipări sau exporta foaia de parcurs?", a: "Nu încă, printr-un export PDF sau Excel dedicat. Foaia o vezi în platformă, pe lună și pe mașină, cu legătură spre fiecare lucrare. Raportul fiecărei lucrări se descarcă separat, în PDF." },
    { q: "Merge pentru mai multe mașini și mai mulți șoferi?", a: "Da. Fiecare mașină activă, alocată unei echipe, are foaia ei, iar sus alegi „Toate mașinile” sau una anume. Conducătorul auto se alege pe fiecare mașină. Ține o mașină pe echipă: două mașini ale aceleiași echipe ar arăta aceleași lucrări." },
    { q: "Cum schimb șoferul sau echipa unei mașini?", a: "Din pagina Echipe: muți mașina la altă echipă și alegi conducătorul auto din listă. Foaia urmează alocarea de acum, inclusiv pentru lunile trecute, așa că verifică foaia lunii încheiate înainte să faci schimbarea." },
    { q: "Kilometrii se iau din GPS-ul telefonului?", a: "Nu. Kilometrii nu se iau din GPS și nu se completează încă din platformă; îi adaugi tu. La pontaj se salvează locația doar la sosire, iar urmărirea continuă e o opțiune separată, cu setarea firmei și acordul angajatului." },
    { q: "Pot ține evidența ITP, RCA și rovinietă pentru mașini?", a: "Da, în secțiunea Conformitate, cu data de expirare a fiecărui document. Primești alertă cu 60, 30 și 7 zile înainte și în ziua expirării, iar la programare vezi avertisment dacă mașina echipei are un document expirat la data lucrării." },
  ],
  related: [
    "model-foaie-de-parcurs",
    "reducere-timpi-deplasare-lucrari",
    "urmarire-gps-echipe-teren-gdpr",
    "cum-calculezi-profitul-pe-lucrare",
    "gestiune-materiale-ce-ai-cumparat-ce-ai-folosit",
    "gestionare-echipe-de-teren",
  ],
  updated: "2026-11-28",
  ogImage: "/og/foaie-de-parcurs-electronica.jpg",
  breadcrumb: "Foaie de parcurs electronică",
};

export default page;
