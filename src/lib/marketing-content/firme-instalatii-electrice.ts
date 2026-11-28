import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4):
// măsurătorile se înregistrează pe lucrare, dar buletinul PRAM sau de izolație nu se generează încă
// ca document tipărit; semnarea verifică doar o autorizație ANRE valabilă în registru, nu gradul.
const page: MarketingPage = {
  slug: "firme-instalatii-electrice",
  title: "Software pentru firme de instalații electrice",
  description: "Software pentru firme de instalații electrice: lucrări pe echipe, măsurători de izolație din telefon, lucrări ascunse cu poze, autorizații ANRE, facturare.",
  kicker: "Pentru firme de instalații electrice",
  h1: "Software pentru firme de instalații electrice",
  lead: "ElectroField e un software pentru firme de instalații electrice: programul cu care îți organizezi lucrările, echipele, măsurătorile și documentele de predare, din birou și din telefonul electricianului. Nu e un soft de proiectare electrică. E un program de management pentru ce urmează după proiect: cine merge la lucrare, cu ce autorizație, ce măsoară și ce predai clientului.",
  sections: [
    {
      h: "Ce face un program pentru firme de instalații electrice?",
      id: "ce-face",
      answer: "Un program pentru firme de instalații electrice ține într-un singur loc lucrările, echipele, autorizațiile oamenilor, măsurătorile din teren și documentele de predare. Biroul programează din browser, electricianul vede lucrarea în telefon, trece valorile și face pozele, iar la final ai pe lucrare tot ce îți trebuie pentru predare și pentru factură.",
      list: [
        "Lucrările pe echipe și zile, în calendar, cu clientul, adresa și materialele de luat din depozit.",
        "Avertismente la programare: autorizație sau calibrare expirată la data lucrării, ITP sau RCA expirat, om în concediu sau pe altă lucrare, material lipsă din stoc.",
        "Măsurătorile pe fiecare circuit, din telefon, și pozele lucrărilor ascunse, înainte de închidere.",
        "Registrul cu autorizațiile ANRE ale electricienilor, cu alertă înainte de expirare.",
        "Factura din ore și materiale, prin [facturare din lucrări cu SmartBill sau Oblio](/facturare-smartbill-oblio).",
      ],
    },
    {
      h: "Software de management sau soft de proiectare electrică?",
      id: "nu-e-proiectare",
      answer: "ElectroField e software de management, nu soft de proiectare electrică. Programele de proiectare fac scheme monofilare, calcule de secțiuni și căderi de tensiune, la birou, înainte de lucrare. ElectroField începe de unde începe execuția: programarea echipelor, lucrul în teren, măsurătorile, documentele de predare și facturarea. Dacă proiectezi deja într-un program, îl păstrezi.",
    },
    {
      h: "Cum se desfășoară o lucrare electrică, pas cu pas",
      id: "pas-cu-pas",
      blocks: [
        {
          type: "steps",
          items: [
            "Biroul creează lucrarea, de exemplu „Instalare tablou electric nou” sau „Verificare rezistență priză de pământ (PRAM)”, și o pune pe o echipă în calendar. Avertismentele de programare nu blochează nimic; decizia e a biroului.",
            "Electricianul vede lucrarea în [aplicația pentru tehnicieni](/aplicatie-tehnician), ridică materialele din depozit și pornește spre adresă. Clientului îi trimite cu o atingere, pe SMS sau WhatsApp, mesajul că a plecat, cu linkul de status.",
            "La sosire apasă „Am ajuns la locație”: se salvează ora și locația. Din aceste apăsări se face [pontajul pe lucrare](/pontaj-tehnicieni).",
            "Înainte să închidă peretele sau șapa, face pozele cu eticheta „Ascuns”: trasee, doze, împământare.",
            "Completează formularul „Verificare tablou electric”, circuit cu circuit, apoi ia semnătura clientului pe ecran.",
            "Biroul vede măsurătorile pe lucrare, tipărește procesul-verbal de lucrări ascunse, înregistrează buletinul semnat de persoana autorizată și facturează.",
          ],
        },
      ],
    },
    {
      h: "Măsurători de izolație și PRAM: ce trece electricianul în telefon?",
      id: "masuratori",
      answer: "În formularul „Verificare tablou electric”, electricianul trece tabloul (locație, producător, serie) și, pentru fiecare circuit, protecția, rezistența de izolație, impedanța buclei de defect, continuitatea conductorului de protecție și timpul de declanșare al diferențialului. Pe circuit poate nota o observație C1, C2 sau C3 și ce a constatat.",
      blocks: [
        {
          type: "table",
          caption: "Unde se trece fiecare măsurătoare și unde o găsești apoi",
          head: ["Ce măsori", "Unde se trece", "Unde o găsești"],
          rows: [
            ["Rezistența de izolație (MΩ), pe circuit", "Telefon sau birou", "Tabelul de măsurători, cu sursa: aplicație sau birou"],
            ["Impedanța buclei de defect (Ω)", "Telefon sau birou", "Tabelul de măsurători"],
            ["Continuitatea PE (Ω)", "Telefon sau birou", "Tabelul de măsurători"],
            ["Timpul de declanșare al diferențialului (ms)", "Telefon", "Tabelul de măsurători"],
            ["Observații C1, C2, C3", "Telefon", "Sumarul lucrării: câte C1, C2 și C3 are"],
            ["Rezistența prizei de pământ (Ω)", "La observații; nu are încă un câmp separat", "Pe lucrare, la observații"],
          ],
        },
        {
          type: "callout",
          title: "Platforma nu judecă valorile",
          text: "Limitele depind de normativ și de instalație, iar rezultatul (conform sau neconform) îl stabilește persoana autorizată. Codurile C1–C3 sunt observații ale firmei, după modelul raportului EICR, și nu țin locul buletinului.",
        },
        {
          type: "p",
          text: "Cât de des se face verificarea prizei de pământ găsești în ghidul despre [periodicitatea verificării PRAM](/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate), iar cum se măsoară, în articolul despre [valorile prizei de pământ și măsurarea ei](/blog/priza-de-pamant-valori-masurare).",
        },
      ],
    },
    {
      h: "Autorizații ANRE: cine poate semna buletinul?",
      id: "autorizatii-anre",
      answer: "În ElectroField, un buletin sau un proces-verbal înregistrat pe lucrare îl poate semna doar o persoană care are în registrul de conformitate o autorizație ANRE valabilă la data semnării. Dacă nimeni din firmă nu are una valabilă, documentul rămâne nesemnat. Gradul autorizației și ce are voie să semneze fiecare om le verifici tu.",
      p: [
        "Autorizațiile electricienilor stau în secțiunea Conformitate, cu data de expirare. Platforma te anunță cu 60, 30 și 7 zile înainte și în ziua expirării, iar la programare vezi avertisment dacă autorizația unui om din echipă nu mai e valabilă la data lucrării. Avertisment primești și când un aparat de măsură al cuiva din echipă are calibrarea expirată, după datele din [registrul de scule](/stoc-materiale-pe-masini).",
        "Ce grade există, cum se obține autorizația și când se vizează: în ghidul despre [autorizația ANRE de electrician](/blog/autorizatie-anre-electrician). Regulile exacte le confirmi cu ANRE și cu responsabilul tehnic al firmei.",
      ],
    },
    {
      h: "Lucrări ascunse cu poze: cum le documentezi?",
      id: "lucrari-ascunse",
      answer: "Electricianul face pozele cu eticheta „Ascuns” înainte să închidă peretele sau șapa. Biroul trece pe lucrare lista lucrărilor care devin ascunse și deschide procesul-verbal de lucrări ascunse, cu pozele în anexă și cu data, ora și autorul fiecăreia. Îl tipărești sau îl salvezi ca PDF din browser, apoi îl semnați pe hârtie.",
      p: [
        "Procesul-verbal e un model de lucru: textul și semnatarii (executant, beneficiar sau diriginte de șantier, proiectant, dacă e cazul) îi stabilești după proiect și contract. Un model comentat găsești în articolul [model de proces-verbal și raport de lucrare](/blog/model-proces-verbal-raport-lucrare).",
      ],
    },
    {
      h: "Ce documente ies din datele din teren?",
      id: "documente",
      answer: "Din datele de pe teren ies procesul-verbal de lucrări ascunse (de tipărit), raportul lucrării în PDF, tabelul de măsurători, pagina de status pentru client și factura. Buletinul de verificare se înregistrează pe lucrare, cu semnatarul autorizat și data, dar documentul tipărit cu valorile îl faci deocamdată în afara platformei.",
      blocks: [
        {
          type: "table",
          caption: "Documentele unei lucrări electrice și datele din care se fac",
          head: ["Document", "Din ce date", "În ce formă"],
          rows: [
            ["Proces-verbal de lucrări ascunse", "Pozele „Ascuns” și lista lucrărilor ascunse", "Pagină de tipărit sau de salvat PDF, semnată pe hârtie"],
            ["Raportul lucrării", "Orele pontate, cheltuielile, numărul de poze, semnătura clientului", "PDF"],
            ["Buletin de verificare", "Denumirea, semnatarul autorizat, data semnării", "Înregistrare pe lucrare, fără document tipărit cu valorile"],
            ["Pagina de status pentru client", "Etapele lucrării, cine vine, pozele înainte și după, documentele", "Link, fără cont pentru client"],
            ["Factura", "Orele înmulțite cu tariful tău, materialele cu adaosul tău", "Emisă prin contul tău SmartBill sau Oblio"],
          ],
        },
        {
          type: "p",
          text: "Ce trebuie să primească clientul la final e explicat în ghidul despre [documentele de predare după instalare](/blog/documente-predare-client-dupa-instalare).",
        },
      ],
    },
    {
      h: "Cât câștigi pe o lucrare electrică?",
      id: "marja",
      answer: "Pe pagina lucrării vezi costul: orele pontate înmulțite cu tariful pe oră, materialele consumate și cheltuielile. Profitul apare după ce lucrarea e facturată în platformă, pentru că abia atunci se știe venitul. Ecranul „Luni dimineața” arată marja pe tip de lucrare și pe echipă, plus restanțele.",
      p: [
        "Cum îți faci singur calculul, cu un exemplu, găsești în ghidul [cum calculezi profitul pe lucrare](/blog/cum-calculezi-profitul-pe-lucrare).",
      ],
    },
    {
      h: "Pentru ce firme de electrice e potrivit?",
      id: "pentru-cine",
      answer: "Pentru firme cu una până la câteva zeci de echipe în teren, care fac instalații noi, tablouri, mentenanță, verificări periodice și intervenții. Dacă faci și gaze sau fotovoltaice, alegi domeniile firmei, iar meniul arată doar ce folosești. Lucrările, echipele, pontajul și facturarea rămân comune.",
      p: [
        "Biroul lucrează în browser. Electricienii folosesc aplicația Android (APK, descărcată de pe site) sau, pe iPhone, platforma din browser.",
        "Dacă lucrezi pe mai multe meserii, vezi și paginile pentru [firme de montaj fotovoltaic](/firme-fotovoltaice) și pentru [verificări și revizii gaze](/firme-gaze-verificari-revizii). Imaginea de ansamblu e pe pagina despre [software de management pentru echipe de teren](/software-management-echipe-teren).",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu e soft de proiectare: nu face scheme, calcule de secțiuni sau căderi de tensiune.",
        "Nu face devize sau oferte.",
        "Nu generează încă buletinul PRAM sau de izolație ca document tipărit, cu valorile completate.",
        "Rezistența prizei de pământ nu are încă un câmp separat în formularul electric.",
        "Nu spune dacă o valoare e bună și nu verifică gradul autorizației, doar că autorizația ANRE din registru e valabilă.",
        "Nu depune documente la operatorul de distribuție și nu trimite singur SMS clientului.",
        "Nu importă clienții sau materialele firmei din fișier; catalogul standard de materiale îl adaugi dintr-un clic.",
      ],
    },
  ],
  faq: [
    { q: "E ElectroField un soft de proiectare electrică?", a: "Nu. ElectroField e un program de management pentru firme de instalații electrice: programare, echipe, lucru în teren, măsurători, documente de predare și facturare. Pentru scheme, calcule de secțiuni sau căderi de tensiune folosești în continuare programul tău de proiectare." },
    { q: "Pot genera buletinul PRAM direct din aplicație?", a: "Nu încă, ca document tipărit cu valorile completate. Electricianul trece măsurătorile în telefon și ele apar pe lucrare, iar buletinul se înregistrează pe lucrare și îl semnează doar cineva cu autorizație ANRE valabilă în registru. Se tipăresc azi procesul-verbal de lucrări ascunse și raportul lucrării, în PDF." },
    { q: "Ce se întâmplă când expiră autorizația ANRE a unui electrician?", a: "Primești alertă cu 60, 30 și 7 zile înainte și în ziua expirării. După expirare, omul nu mai poate semna buletine în platformă, iar dacă îl programezi pe o lucrare de după data expirării vezi avertisment. Avertismentul nu blochează programarea: decizia e a ta." },
    { q: "Funcționează fără semnal în subsol sau pe șantier?", a: "În mare parte, da. Pozele, semnătura, sosirea, începutul și finalul lucrării și formularul de verificare se salvează pe telefon și pleacă singure când revine semnalul. Plecarea spre client, consumul de materiale și cheltuielile cer semnal." },
    { q: "Faceți devize sau oferte pentru lucrări electrice?", a: "Nu. ElectroField nu are modul de devize sau oferte. Creezi lucrarea cu clientul, echipa și materialele, iar oferta o scrii separat. Un model găsești în [ghidul despre oferta pentru lucrări electrice și fotovoltaice](/blog/model-oferta-lucrari-electrice-fotovoltaice)." },
    { q: "Pe ce telefoane merge aplicația pentru electricieni?", a: "Pe Android instalezi aplicația (APK, descărcată de pe site), iar pe iPhone folosești platforma din browser. Biroul lucrează în browser, pe calculator. Notificările push merg doar în aplicația Android; pe iPhone vezi noutățile când deschizi pagina." },
    { q: "Pot lucra și pe gaze sau fotovoltaice în același cont?", a: "Da. Alegi domeniile firmei (electrice, gaze, fotovoltaice), iar meniul arată doar ce folosești. Lucrările, echipele, pontajul și facturarea sunt comune pentru toate domeniile." },
  ],
  related: [
    "verificare-pram-rezistenta-priza-de-pamant-periodicitate",
    "priza-de-pamant-valori-masurare",
    "autorizatie-anre-electrician",
    "autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira",
    "model-proces-verbal-raport-lucrare",
    "cum-calculezi-profitul-pe-lucrare",
  ],
  updated: "2026-11-28",
  ogImage: "/og/firme-instalatii-electrice.jpg",
  breadcrumb: "Firme de instalații electrice",
};

export default page;
