import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul:
// src/lib/invoicing/{index,smartbill,oblio,anaf}.ts, src/app/(app)/facturare/** și src/app/mobil/lucrari/[id]/facturare.
// Manopera = durata lucrului × oamenii de pe lucrare (rotunjit la jumătate de oră) × tariful firmei; materialele =
// prețul de achiziție + adaosul firmei; cheltuielile nu intră singure pe factură. Trimiterea în SPV din platformă
// există doar cu Oblio; cu SmartBill se face din contul SmartBill (pagina smartbill.ro/e-factura, citită la 28 nov 2026,
// descrie trimitere manuală și automată). Integrările nu au fost încă folosite de o firmă reală: fără „testat” sau „oficial”.
// Fără reguli fiscale pe pagină: anaf.ro, mfinante.gov.ro și legislatie.just.ro nu s-au deschis la 28 nov 2026,
// așa că obligațiile e-Factura rămân în seama contabilului și a ghidului din blog.
const page: MarketingPage = {
  slug: "facturare-smartbill-oblio",
  title: "Facturare din lucrări prin SmartBill sau Oblio",
  description: "Facturare din lucrări: manopera vine din orele pontate, materialele din consumul de pe lucrare. Factura se emite din contul tău SmartBill sau Oblio.",
  kicker: "Funcționalitate",
  h1: "Facturare din lucrări, prin contul tău SmartBill sau Oblio",
  lead: "Facturarea din lucrări în ElectroField înseamnă că factura pornește din lucrarea terminată: manopera vine din orele pontate, iar materialele din ce s-a consumat pe lucrare, cu adaosul tău. Factura se emite în contul tău SmartBill sau Oblio, care dă și numărul fiscal. ElectroField nu înlocuiește programul de facturare, ci îl leagă de lucrări.",
  sections: [
    {
      h: "Ce înseamnă facturare din lucrări?",
      id: "ce-este",
      answer: "Înseamnă că nu mai scrii factura de la zero după ce echipa a terminat. Lucrarea închisă apare la „De facturat”, cu rândurile deja completate: manopera din orele pontate, materialele consumate și ce a încasat tehnicianul pe loc. Tu verifici, corectezi dacă e nevoie și emiți factura, fără să mai cauți bonuri.",
      blocks: [
        {
          type: "table",
          caption: "Din ce date se completează factura",
          head: ["Pe factură", "De unde vine"],
          rows: [
            ["Manopera", "Durata lucrului (de la „Pornește lucrul” la „Închide lucrarea”) × oamenii de pe lucrare, rotunjită la jumătate de oră, la tariful orar al firmei"],
            ["Materialele", "Ce a trecut tehnicianul ca folosit, la prețul de achiziție plus adaosul firmei"],
            ["Clientul", "Fișa clientului; pentru o firmă, datele de la ANAF după CUI"],
            ["Încasarea pe loc", "Suma și modul (numerar, card, transfer) trecute de tehnician la final"],
          ],
        },
        {
          type: "p",
          text: "Orele vin din [pontajul pe lucrare al tehnicienilor](/pontaj-tehnicieni), iar materialele din [stocul de materiale de pe mașini](/stoc-materiale-pe-masini). Tariful orar îl setezi o dată; ca să-l stabilești, folosește [calculatorul de tarif pe oră pentru electricieni și instalatori](/blog/calculator-tarif-ora-electrician-instalator).",
        },
      ],
    },
    {
      h: "Cum ajunge o lucrare terminată la factură, pas cu pas",
      id: "pas-cu-pas",
      answer: "Tehnicianul închide lucrarea în telefon, iar ea apare la birou, la „De facturat”. Biroul apasă „Facturează”, verifică rândurile precompletate, alege seria și emite. Factura se creează în contul SmartBill sau Oblio, cu numărul de acolo, și rămâne legată de lucrare, împreună cu încasările de pe ea.",
      blocks: [
        {
          type: "steps",
          items: [
            "La final, în [aplicația pentru tehnicieni](/aplicatie-tehnician), tehnicianul vede orele, materialele și cheltuielile lucrării, trece ce a încasat pe loc și o trimite la facturare. Pasul acesta cere semnal.",
            "Biroul primește notificare. Lucrarea apare la „De facturat”; apeși „Facturează” și găsești clientul, manopera, materialele și încasarea deja trecute. Poți modifica, șterge sau adăuga rânduri.",
            "Alegi seria, data și scadența, apoi emiți. Numărul fiscal vine de la SmartBill sau Oblio; platforma nu inventează numere.",
            "PDF-ul vine de la furnizor, iar e-mailul către client pleacă dacă ai bifat trimiterea. Pe pagina lucrării apare apoi și profitul.",
          ],
        },
        {
          type: "callout",
          title: "Cine emite factura",
          text: "Administratorul sau managerul. Tehnicianul nu emite facturi din telefon. Cum citești apoi cifrele lucrării: în ghidul [cum calculezi profitul pe o lucrare](/blog/cum-calculezi-profitul-pe-lucrare).",
        },
      ],
    },
    {
      h: "Ce face integrarea cu SmartBill și cu Oblio?",
      id: "smartbill-oblio",
      answer: "Contul de facturare rămâne al tău. Din el vin seriile, cotele de TVA și numărul fiscal al fiecărei facturi. În platformă stau lucrarea, rândurile precompletate, o copie a facturii, încasările și restanțele. Conectezi contul o singură dată, din Setări → Integrări, cu cheia API a contului.",
      blocks: [
        {
          type: "table",
          caption: "Ce faci din platformă, pe fiecare cont de facturare",
          head: ["", "SmartBill", "Oblio"],
          rows: [
            ["Factură și proformă, cu seriile și cotele de TVA din cont", "Da", "Da"],
            ["PDF-ul facturii", "PDF-ul din SmartBill", "Linkul documentului din Oblio"],
            ["E-mail către client", "La emitere sau mai târziu", "Doar la emitere; după aceea, din Oblio"],
            ["Încasări: numerar cu chitanță, card, ordin de plată", "Da", "Da"],
            ["Anulare și stornare", "Da", "Da"],
            ["Trimitere în SPV (e-Factura)", "Nu din platformă: din contul SmartBill", "Da, cu un buton"],
            ["„Sincronizează” aduce din cont", "Încasările", "Încasările, anulările și starea e-Factura"],
          ],
        },
        {
          type: "p",
          text: "Cheia API o iei din SmartBill (Cloud → Integrări → API) sau din Oblio (Setări → Date cont) și se păstrează criptată. Doar administratorul schimbă conexiunea și tarifele. Dacă firma nu e plătitoare de TVA, setezi asta o dată și facturile ies fără TVA.",
        },
      ],
    },
    {
      h: "Cum trimiți facturile în e-Factura?",
      id: "e-factura",
      answer: "Depinde de contul conectat. Cu Oblio, trimiți factura în SPV din platformă, cu butonul „Trimite în SPV (e-Factura)”, și vezi starea: netrimisă, în prelucrare, trimisă sau erori. Cu SmartBill, platforma nu trimite în SPV: factura emisă ajunge în contul SmartBill, iar de acolo o trimiți, așa cum ai setat contul.",
      p: [
        "ElectroField nu se conectează direct la SPV-ul ANAF. De la ANAF citește doar datele publice ale clientului după CUI, inclusiv dacă e inactiv fiscal sau înscris în e-Factura. Obligațiile și termenele tale le confirmi cu contabilul; contextul e în ghidul [e-Factura B2B 2026 pentru firmele de instalații](/blog/e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice).",
      ],
    },
    {
      h: "Cum urmărești încasările și restanțele?",
      id: "incasari",
      answer: "Fiecare factură arată cât s-a încasat și cât mai e de încasat. Înregistrezi și încasări parțiale, în numerar, cu cardul sau prin ordin de plată. Filtrul „Restante” arată facturile trecute de scadență, iar butonul „Sincronizează” aduce din SmartBill sau Oblio încasările pe care le-ai trecut direct acolo.",
      list: [
        "Ecranul „Luni dimineața” arată restanțele pe vechime și câte lucrări terminate nu au încă factură.",
        "Pentru numerar se emite chitanță dacă ai serie de chitanțe în cont; altfel, încasarea se trece ca „altă încasare”.",
      ],
    },
    {
      h: "Ce faci cu o factură emisă greșit?",
      id: "corecturi",
      answer: "O factură emisă nu se mai modifică. Dacă ai prins greșeala repede și nu s-a încasat nimic, o anulezi. Dacă s-a încasat ceva sau factura a ajuns la client, emiți o stornare, adică aceleași rânduri cu minus, apoi o factură corectă. Ambele se fac prin contul tău SmartBill sau Oblio.",
    },
    {
      h: "E ElectroField un program de facturare?",
      id: "program-de-facturare",
      answer: "Nu în sensul obișnuit. Un program de facturare emite facturi, ține nomenclatorul, trimite în SPV și pregătește rapoarte pentru contabil. ElectroField organizează lucrările, echipele și pontajul și pregătește factura din ele, dar emiterea rămâne în SmartBill sau Oblio. Dacă vrei doar facturi, fără lucrări și echipe, îți ajunge programul de facturare.",
      p: [
        "Unde intră factura în drumul unei lucrări vezi pe pagina despre [software de management pentru echipe de teren](/software-management-echipe-teren).",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu se leagă de alte programe de facturare: acum doar de SmartBill și Oblio.",
        "Nu trimite în SPV facturile emise prin SmartBill și nu preia din SPV facturile primite de la furnizori.",
        "Nu ține contabilitatea și nu întocmește declarații fiscale.",
        "Nu face devize sau oferte; înainte de factură ai doar proforma. Oferta o scrii după un [model de ofertă pentru lucrări electrice și fotovoltaice](/blog/model-oferta-lucrari-electrice-fotovoltaice).",
        "Nu pune singură cheltuielile pe factură și are un singur tarif de manoperă pe firmă; altfel, corectezi rândul.",
        "Nu are plată online pentru client și nici facturi recurente, de tip abonament.",
      ],
    },
  ],
  faq: [
    { q: "Pot folosi și SmartBill, și Oblio?", a: "Nu în același timp: firma conectează un singur cont de facturare. Îl poți deconecta și îl conectezi pe celălalt; facturile emise rămân în contul în care au fost emise." },
    { q: "Pot folosi facturarea fără SmartBill sau Oblio?", a: "Da, ca evidență internă: documentele primesc un număr intern, iar PDF-ul scrie clar că nu e factură fiscală și nu a fost transmis în e-Factura. După ce conectezi un cont, facturile noi se emit în el." },
    { q: "Folosesc alt program de facturare. Se poate lega?", a: "Acum, nu. Platforma se leagă doar de SmartBill și Oblio. Cu alt program, emiți factura separat, în programul tău." },
    { q: "Facturile ajung în e-Factura?", a: "Prin Oblio, da, cu un buton din platformă, și vezi starea trimiterii. Prin SmartBill, nu din platformă: factura ajunge în contul SmartBill și o trimiți de acolo." },
    { q: "Cine răspunde de corectitudinea facturii?", a: "Firma care o emite. Platforma precompletează rândurile și le trimite la SmartBill sau Oblio, dar clientul, cotele de TVA și sumele le verifici tu. Pentru regulile fiscale, întreabă contabilul." },
    { q: "Pot emite o proformă înainte de lucrare?", a: "Da, dacă ai o serie de proformă în contul SmartBill sau Oblio. Proforma nu e factură fiscală; după plată o transformi în factură cu aceleași rânduri și același client. Cum tratezi un avans în contabilitate stabilești cu contabilul." },
    { q: "Ce se întâmplă dacă tehnicianul încasează pe loc?", a: "Trece suma și modul (numerar, card sau transfer) când trimite lucrarea la facturare, iar biroul o găsește deja pe factură. Pentru numerar se emite chitanță dacă ai o serie de chitanțe în cont." },
    { q: "Datele clientului se completează singure?", a: "Pentru o firmă, da: scrii CUI-ul, iar de la ANAF vin denumirea, adresa, numărul din Registrul Comerțului și dacă e plătitoare de TVA. Dacă ANAF o arată inactivă fiscal, vezi un avertisment." },
  ],
  related: [
    "e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice",
    "cum-calculezi-profitul-pe-lucrare",
    "calculator-tarif-ora-electrician-instalator",
    "cat-avans-ceri-lucrari-electrice-fotovoltaice",
    "gestiune-materiale-ce-ai-cumparat-ce-ai-folosit",
    "model-oferta-lucrari-electrice-fotovoltaice",
  ],
  updated: "2026-11-28",
  ogImage: "/og/facturare-smartbill-oblio.jpg",
  breadcrumb: "Facturare SmartBill și Oblio",
};

export default page;
