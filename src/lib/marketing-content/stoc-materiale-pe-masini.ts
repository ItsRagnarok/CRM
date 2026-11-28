import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul:
// - stocul pe mașină: ținta și pragul (fără prag = jumătate din țintă, rotunjit în sus), „De încărcat” până la țintă,
//   încărcarea din depozitul central într-un pas, parțială dacă nu ajunge (src/lib/vehicle-stock.ts,
//   src/app/(app)/materiale/masini, funcția load_vehicle_from_warehouse); lista se copiază între mașini;
// - tehnicianul: „Consumă” (se trece pe lucrarea pornită), „Raportează lipsă”, cererea de reaprovizionare,
//   „Cere aprobare” pentru ce lipsește la lucrare (biroul poate scrie magazinul), „Am cumpărat de la magazin” cu
//   poza bonului, devenită cheltuială „Materiale” pe lucrare (src/app/mobil/(tabs)/materiale, src/app/mobil/materiale);
//   nimic din acestea nu intră în coada fără semnal; ecranele din telefon nu citesc prețul de achiziție;
// - comanda pentru furnizor e o listă de tipărit: ce e sub stocul minim în depozitul central, cu cantitatea sugerată
//   = dublul stocului minim minus ce există (src/app/(app)/materiale/comanda); nu se trimite furnizorului;
// - registrul de scule: predare cu confirmare în aplicație, returnare confirmată de birou, istoric, PV de tipărit
//   (model de lucru), calibrarea în Conformitate cu alerte la 60, 30 și 7 zile, predare cu calibrarea expirată doar
//   cu confirmare, avertisment la programare (src/lib/tools.ts, src/app/(app)/materiale/scule, schedule-warnings.ts);
// - nu e gestiune contabilă (fără NIR, bon de consum, fișă de magazie, evaluare), nu importă materiale din fișier
//   (doar catalogul standard), nu citește coduri de bare la stoc, nu are transferuri între mașini sau depozite.
// Fără afirmații legale: ce aparate se verifică metrologic și cât de des rămâne la responsabilul tehnic.
const page: MarketingPage = {
  slug: "stoc-materiale-pe-masini",
  title: "Stoc pe mașini și gestiune de materiale pentru instalații",
  description: "Gestiune de materiale pentru firme de instalații: stocul fiecărei mașini cu țintă și prag, consum pe lucrare, reaprovizionare și scule cu calibrare.",
  kicker: "Funcționalitate",
  h1: "Stoc de materiale pe mașini și registru de scule",
  lead: "Stocul de materiale pe mașini din ElectroField îți arată ce are fiecare mașină, ce s-a consumat pe fiecare lucrare și ce trebuie încărcat sau cumpărat, înainte ca omul să rămână fără material la client. E gestiunea de materiale a unei firme de instalații, văzută din teren: depozit, mașini, lucrări și scule. Nu e gestiune contabilă.",
  sections: [
    {
      h: "Ce înseamnă stocul de materiale pe mașini?",
      id: "ce-este",
      answer: "Înseamnă că fiecare mașină e tratată ca un mic depozit. Pentru fiecare mașină stabilești ce trebuie să aibă în ea (ținta), de la ce cantitate o reaprovizionezi (pragul) și vezi ce are acum. Tehnicianul scade din stocul mașinii ce folosește pe lucrare, iar biroul vede ce trebuie încărcat.",
      p: [
        "Pierderile apar de obicei la ce se cumpără de două ori, la drumurile în plus la depozit și la ce s-a folosit, dar n-a ajuns în factură. Cât te costă, pe cifrele tale, arată calculatorul din ghidul despre [gestiunea materialelor: ce ai cumpărat, ce ai folosit și ce a rămas](/blog/gestiune-materiale-ce-ai-cumparat-ce-ai-folosit). Stocul face parte din [software-ul de management pentru echipe de teren](/software-management-echipe-teren).",
      ],
    },
    {
      h: "Cum funcționează lista țintă și pragul minim?",
      id: "tinta-prag",
      answer: "Pentru fiecare material din lista mașinii treci ținta și, dacă vrei, pragul. Când cantitatea scade sub prag, materialul intră la „De încărcat”, cu cât lipsește până la țintă. Fără prag, pragul e jumătate din țintă, rotunjit în sus. Mașinile care fac aceleași lucrări pot primi aceeași listă, copiată.",
      blocks: [
        {
          type: "table",
          caption: "Exemplu, cu cifre inventate: lista unei mașini de electricieni",
          head: ["Material", "Țintă / prag", "În mașină", "Stare", "De încărcat"],
          rows: [
            ["Cablu CYY-F 3×2,5", "100 m / 40 m", "35 m", "Sub prag", "65 m"],
            ["Doze de aparat", "20 buc / prag implicit 10", "12 buc", "OK", "—"],
            ["Siguranțe automate 16 A", "10 buc / 4 buc", "0 buc", "Lipsă", "10 buc"],
          ],
        },
        {
          type: "p",
          text: "„Încarcă din depozit” mută în mașină, dintr-un pas, tot ce e la „De încărcat”, din depozitul central. Dacă în depozit nu e destul, se încarcă ce există, iar cantitatea din depozit apare cu roșu: atunci comanzi de la furnizor.",
        },
      ],
    },
    {
      h: "Ce face tehnicianul cu materialele, pas cu pas",
      id: "pas-cu-pas",
      answer: "Tehnicianul nu ține caiet de materiale. În aplicație vede ce are de luat pentru lucrare și ce are deja în mașină, scade ce folosește, cere ce îi lipsește și trimite bonul când cumpără ceva pe drum. Biroul vede aceleași date pe mașină și pe lucrare, fără să le adune cineva seara.",
      blocks: [
        {
          type: "steps",
          items: [
            "Deschide lucrarea în [aplicația pentru tehnicieni](/aplicatie-tehnician): aplicația Android (APK, descărcată de pe site) sau, pe iPhone, din browser. Lista „Ia cu tine” arată ce trebuie luat și cât are în mașină.",
            "Ce lipsește din mașină, dar există în depozit, e marcat „La depozit”, cu navigare până acolo în Google Maps sau Waze.",
            "Ce nu găsește nici în depozit cere cu „Cere aprobare”. Biroul aprobă sau respinge și poate scrie magazinul de unde se ia.",
            "La lucru apasă „Consumă”, cu cantitatea. Stocul mașinii scade, iar consumul se trece pe lucrarea pornită.",
            "Ce s-a terminat marchează cu „Raportează lipsă”; când mai multe sunt sub prag, cere reaprovizionarea mașinii.",
            "Dacă a cumpărat de la magazin, trimite poza bonului, suma, articolele și lucrarea. Cu citirea AI pornită de firmă, bonul se completează din poză, iar el verifică.",
          ],
        },
        {
          type: "callout",
          title: "Fără semnal",
          text: "Consumul, cererile, reaprovizionarea și bonurile cer semnal. Pozele, semnătura, sosirea, începutul și finalul lucrării se salvează pe telefon și pleacă singure când revine semnalul.",
        },
      ],
    },
    {
      h: "Ce vede biroul: reaprovizionare, cereri și comanda la furnizor",
      id: "birou",
      answer: "Pe ecranul „Stoc pe mașini” biroul vede, pentru fiecare mașină, ce lipsește, cât trebuie încărcat și cât e în depozit. Cererea de reaprovizionare apare pe mașina respectivă, cu lista trimisă de tehnician, și se închide singură la încărcare. Cererile de achiziție se aprobă la „Cereri de materiale”, iar bonurile la Cheltuieli.",
      list: [
        "La programare vezi avertisment când un material trecut pe lucrare nu e nici în depozit, nici pe mașina echipei.",
        "Lista de comandă pentru furnizor iese din ce e sub stocul minim în depozitul central, cu o cantitate sugerată: dublul stocului minim, minus ce ai. O tipărești și o trimiți tu.",
        "Achizițiile urgente din ultimele 30 de zile stau lângă mașini, cu omul, magazinul, lucrarea și poza bonului.",
      ],
      p: [
        "Aceeași mașină are ITP-ul și RCA-ul în registrul de conformitate și [foaia de parcurs electronică](/foaie-de-parcurs-electronica), făcută din lucrările echipei.",
      ],
    },
    {
      h: "Cum ajunge consumul în costul lucrării și în factură?",
      id: "cost-factura",
      answer: "Fiecare „Consumă” apăsat pe o lucrare pornită rămâne pe lucrare, la „Materiale folosite”. Materialele intră în costul lucrării la prețul de achiziție din catalog, lângă manoperă și cheltuieli. La facturare, aceleași materiale completează rândurile facturii, cu adaosul tău. Bonul de la magazin intră în cost o singură dată, prin cheltuială.",
      blocks: [
        {
          type: "table",
          caption: "Ce iese din fiecare dată",
          head: ["Data", "Ce iese", "Unde o găsești"],
          rows: [
            ["„Consumă” pe lucrare", "Costul materialelor și rândurile din factură", "Pagina lucrării și „De facturat”"],
            ["Poza bonului", "Cheltuială „Materiale” pe lucrare", "Cheltuieli, de aprobat"],
            ["Sub stocul minim în depozit", "Lista de comandă pentru furnizor", "Pagină de tipărit"],
            ["Predarea unei scule", "Istoricul și procesul-verbal de predare-primire", "Registrul de scule"],
            ["Data calibrării", "Alertă înainte de expirare", "Registrul de conformitate"],
          ],
        },
        {
          type: "p",
          text: "Factura se emite prin [facturarea din lucrări cu SmartBill sau Oblio](/facturare-smartbill-oblio), iar profitul apare după ce facturezi lucrarea în platformă. Calculul complet: [cum calculezi profitul pe lucrare](/blog/cum-calculezi-profitul-pe-lucrare).",
        },
      ],
    },
    {
      h: "Registrul de scule: cine are fiecare sculă și în ce stare",
      id: "registru-scule",
      answer: "Fiecare sculă și fiecare aparat are o fișă în registru: tip, serie, cod de inventar, valoare și stare. Biroul o predă unui om, eventual cu mașina în care stă, iar omul confirmă primirea în aplicație și spune în ce stare a primit-o. Returnarea o anunță el, iar biroul o confirmă.",
      list: [
        "Tipuri: aparat de măsură, sculă electrică, scară sau schelă, echipament de protecție, altele.",
        "Unde e: în depozit, la om, în service, pierdută sau casată. Ce revine defect intră în service.",
        "Procesul-verbal de predare-primire se tipărește din istoric. E un model de lucru: verifică textul cu regulamentul intern și cu un jurist.",
      ],
    },
    {
      h: "Cum urmărești calibrarea aparatelor de măsură?",
      id: "calibrare",
      answer: "La aparatele care au nevoie de calibrare sau verificare metrologică treci data calibrării și data până la care e valabilă. Data intră în registrul de conformitate, cu notificări la 60, 30 și 7 zile înainte de expirare. Un aparat cu calibrarea expirată nu se predă fără confirmare, iar programarea te avertizează.",
      p: [
        "Avertismentul apare când un om de pe lucrare are un aparat cu calibrarea expirată la data lucrării sau fără dată trecută, util mai ales [firmelor de instalații electrice](/firme-instalatii-electrice). Ce aparate se verifică și cât de des confirmi cu responsabilul tehnic; pentru priza de pământ, vezi ghidul despre [verificarea PRAM și periodicitatea ei](/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate).",
      ],
    },
    {
      h: "Este ElectroField un program de gestiune a stocurilor?",
      id: "gestiune-contabila",
      answer: "În parte. ElectroField ține stocul operativ: cantitățile din depozit și din mașini, consumul pe lucrări, cererile și reaprovizionarea. Nu ține gestiunea contabilă: nu face NIR, bon de consum sau fișă de magazie și nu evaluează stocul. Pentru acestea rămâi la programul de contabilitate și la contabil.",
      p: [
        "Contabilitatea îți spune ce ai cumpărat și cât valorează stocul; ElectroField, în ce mașină și pe ce lucrare a ajuns materialul. Dacă ții stocul într-un tabel, vezi [Excel sau aplicație pentru gestionarea lucrărilor](/blog/excel-sau-aplicatie-gestionare-lucrari).",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu face NIR, bon de consum, fișă de magazie sau evaluarea stocului.",
        "Nu importă materialele firmei din Excel sau CSV; catalogul standard îl adaugi dintr-un clic, restul manual.",
        "Nu citește coduri de bare la materiale și nu trimite comanda la furnizor.",
        "Nu are recepție pe factura furnizorului: intrările în depozit le treci ca o cantitate nouă.",
        "Nu are transferuri între mașini sau între depozite: mașina se încarcă din depozitul central.",
      ],
    },
  ],
  faq: [
    { q: "Tehnicianul vede prețurile de achiziție?", a: "Nu. În aplicația tehnicianului apar materialele și cantitățile, fără prețuri de achiziție; costul pe lucrare se vede la birou. La un bon de la magazin, tehnicianul scrie doar suma plătită." },
    { q: "Pot importa materialele firmei din Excel?", a: "Încă nu. Catalogul standard, cu materialele și sculele obișnuite ale unei echipe de electricieni, îl adaugi dintr-un clic și îl modifici apoi. Celelalte materiale le adaugi manual, cu unitatea, categoria și stocul minim." },
    { q: "Merge cu coduri de bare?", a: "Nu. Materialele se aleg din listă în telefon; acum nu se scanează coduri de bare pentru stoc." },
    { q: "Ce se întâmplă dacă în depozit nu e destul pentru reaprovizionare?", a: "Se încarcă în mașină cât există, iar platforma îți spune ce n-a ajuns întreg. Restul îl comanzi de la furnizor, din lista de comandă de tipărit." },
    { q: "Pot folosi aceeași listă pe mai multe mașini?", a: "Da. Copiezi ținta și pragul de la o mașină la alta, de exemplu între mașinile care fac același tip de lucrări. Cantitățile aflate deja în cealaltă mașină nu se schimbă." },
    { q: "Cum știu cine are acum un aparat de măsură?", a: "În registrul de scule fiecare aparat arată unde e: în depozit, la un om, în service, pierdut sau casat. Lângă el vezi istoricul predărilor și data până la care e valabilă calibrarea." },
  ],
  related: [
    "gestiune-materiale-ce-ai-cumparat-ce-ai-folosit",
    "cum-calculezi-profitul-pe-lucrare",
    "reducere-timpi-deplasare-lucrari",
    "verificare-pram-rezistenta-priza-de-pamant-periodicitate",
    "priza-de-pamant-valori-masurare",
    "excel-sau-aplicatie-gestionare-lucrari",
  ],
  updated: "2026-11-28",
  ogImage: "/og/stoc-materiale-pe-masini.jpg",
  breadcrumb: "Stoc pe mașini",
};

export default page;
