import type { MarketingPage } from "../marketing-pages";

// Afirmațiile despre produs urmează fișa de fapte din cercetarea din 28 nov 2026 (R3, secțiunea 4) și codul:
// src/lib/gas.ts (intervale 24/120 luni implicit, import lipit, max. 2000 de rânduri), migrarea
// 20261125100000_gas_field_records.sql (fișa de revizie mută și data verificării, stările de pe bloc),
// src/lib/working-days.ts (5 + 2 zile lucrătoare), src/lib/gas-register.ts (registrul în CSV, anexa 6).
// Regulile din Ord. ANRE 179/2015 sunt citite la 28 nov 2026 din copiile consolidate publicate de Gaz Est
// (consolidare 14.12.2025) și Distrigaz Sud Rețele (forma sintetică 07.11.2023); legislatie.just.ro și
// anre.ro nu s-au deschis în ziua verificării (erori de server), lucru spus și în pagină.
const page: MarketingPage = {
  slug: "firme-gaze-verificari-revizii",
  title: "Program pentru verificări și revizii gaze, cu scadențar",
  description: "Program pentru verificări și revizii gaze: scadențar pe bloc, scară și apartament, fișa de evidență pe telefon, termenele de după fișă și registrul anual.",
  kicker: "Pentru firme de gaze",
  h1: "Program pentru firme de verificări și revizii gaze",
  lead: "ElectroField e un program pentru verificări și revizii gaze, făcut pentru firmele autorizate ANRE care lucrează pe blocuri, la asociații și la case. Ține scadențarul pe bloc, scară și apartament, cu verificarea la cel mult 2 ani și revizia la cel mult 10 ani. Tehnicianul completează fișa de evidență pe telefon, iar biroul urmărește termenele de după ea.",
  sections: [
    {
      h: "Ce face un program pentru verificări și revizii gaze?",
      id: "ce-face",
      answer: "Ține într-un singur loc apartamentele cu ultima verificare și ultima revizie, calculează scadențele următoare, trimite lista blocului în telefonul tehnicianului și primește înapoi fișele semnate. Din fișele încheiate urmărește termenele de înregistrare la operator și de predare către client și face registrul anual. Ce scrie în fișă rămâne răspunderea firmei.",
      list: [
        "Scadențarul pe bloc, scară și apartament, cu filtrele „Depășite”, „În 60 de zile” și „Fără dată”.",
        "Lucrarea „pe bloc”: tehnicianul vede apartamentele în [aplicația pentru tehnicieni](/aplicatie-tehnician) și marchează fiecare vizită.",
        "Fișa de evidență după anexele 4 și 5 ale procedurii, semnată pe ecran, și registrul anual din fișele încheiate.",
      ],
    },
    {
      h: "Cum calculează scadențarul verificările și reviziile?",
      id: "scadentar",
      answer: "Următoarea verificare pornește de la data ultimei verificări, iar următoarea revizie de la data ultimei revizii, la intervalele setate de firmă: implicit 24 și 120 de luni. Când tehnicianul încheie o fișă de revizie, platforma mută și data verificării. Procedura prevede asta dacă revizia e făcută în anul în care era scadentă verificarea (art. 3² alin. 1–2).",
      blocks: [
        {
          type: "table",
          caption: "Ce se schimbă în scadențar după fiecare fișă încheiată",
          head: ["Fișa încheiată", "Următoarea verificare", "Următoarea revizie"],
          rows: [
            ["Verificare periodică sau la cerere", "De la data fișei", "Neschimbată"],
            ["Revizie periodică", "De la data reviziei, dacă revizia e făcută în anul în care era scadentă verificarea (art. 3² alin. 1–2)", "De la data reviziei"],
            ["Revizie la cerere, după un eveniment sau după o întrerupere de peste 6 luni", "De la data reviziei, dacă revizia e făcută în anul în care era scadentă verificarea (art. 3² alin. 1–2)", "De la data reviziei: ține locul reviziei periodice (art. 3² alin. 3–4)"],
          ],
        },
        {
          type: "callout",
          title: "Exemplu de calcul (date inventate)",
          text: "Ultima verificare pe 10.03.2025, deci următoarea e scadentă pe 10.03.2027. În același an, pe 05.02.2027, se face o revizie la cerere, care ține locul verificării din 2027. Formula „ultima verificare + 2 ani” dintr-un Excel ar rămâne la 10.03.2027. După art. 3², următoarea verificare e scadentă cel târziu pe 05.02.2029, iar următoarea revizie cel târziu pe 05.02.2037. Dacă revizia cade în alt an decât verificarea scadentă, confirmă termenul cu operatorul de distribuție și cu responsabilul tehnic.",
        },
      ],
    },
    {
      h: "Cum organizezi o campanie de verificări pe un bloc?",
      id: "campanie-bloc",
      answer: "Pornești din scadențarul blocului: vezi cine e depășit și cine urmează, fixezi data, legi o lucrare de bloc și o dai unei echipe. Tehnicianul lucrează pe lista apartamentelor din telefon, iar biroul vede, pe măsură ce vin fișele și vizitele, ce s-a făcut, cine a lipsit și pe cine mai are de programat.",
      blocks: [
        {
          type: "steps",
          items: [
            "Lipești apartamentele din Excel și te uiți, scară cu scară, la ce e depășit sau scadent în 60 de zile.",
            "Fixezi data. Pentru instalația comună, data nu poate depăși prima dată scadentă notificată vreunuia dintre locatari (art. 7 alin. 2).",
            "Legi lucrarea de bloc și o pui pe o echipă. Dacă legitimația unui om e expirată la data lucrării, vezi avertisment.",
            "Tehnicianul vede la fiecare apartament verificare sau revizie, telefonul locatarului și racordul sau detectorul expirat din fișa trecută.",
            "La fiecare ușă completează fișa sau notează „absent”, „refuz” ori „reprogramat”, cu motivul. Fișa încheiată trece apartamentul pe „Efectuat” sau „Gaz întrerupt”.",
            "Biroul vede cine a rămas cu „Nu răspunde” sau „Refuză” și reprogramează.",
          ],
        },
        {
          type: "p",
          text: "Orele de pe bloc intră în [pontajul pe lucrare](/pontaj-tehnicieni), iar lucrarea terminată ajunge la [facturare prin SmartBill sau Oblio](/facturare-smartbill-oblio). Pentru proprietari există [ghidul despre verificarea și revizia instalației de gaze](/blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti).",
        },
      ],
    },
    {
      h: "Ce completează tehnicianul în fișa de evidență?",
      id: "fisa-telefon",
      answer: "Fișa urmează anexa 4 pentru verificare și anexa 5 pentru revizie: locul de consum, instalatorul autorizat, aparatele cu documentele de coș și ISCIR, operațiunile din tabelul 3, probele de presiune la revizie, racordul și detectorul, defectele, concluzia și semnăturile. Fiecare operațiune se bifează sau, la „Nu”, se justifică pe rând.",
      blocks: [
        {
          type: "table",
          caption: "Ce se întâmplă cu datele din fișă",
          head: ["Din fișă", "Unde ajunge"],
          rows: [
            ["Data scadentă din notificare", "Scurtează, dacă e cazul, termenul de înregistrare la operator"],
            ["Legitimația instalatorului", "Se ține minte pentru fișele următoare"],
            ["Documentul de coș, verificarea ISCIR, valabilitatea racordului și a detectorului", "În scadențarul apartamentului; la vizita următoare tehnicianul vede ce a expirat"],
            ["Concluzia și întreruperea gazului", "Apartamentul trece pe „Efectuat” sau „Gaz întrerupt”"],
            ["Semnăturile și numărul de înregistrare trecut de birou", "Fișa de tipărit sau de salvat PDF din browser, numerotată pe anul întocmirii"],
          ],
        },
        {
          type: "p",
          text: "Fișa, vizitele de pe bloc, pozele și semnătura se salvează pe telefon și pleacă singure când revine semnalul, deci poți lucra și în subsol. După încheiere, fișa nu se mai modifică de pe telefon.",
        },
        {
          type: "callout",
          title: "Răspunderea rămâne a firmei",
          text: "Prin fișă, operatorul economic își asumă răspunderea pentru ce a constatat la data întocmirii (art. 12¹). Concluzia o scrie instalatorul autorizat, nu platforma. Verifică forma fișei cu textul în vigoare al procedurii.",
        },
      ],
    },
    {
      h: "Care sunt termenele după fișa de evidență?",
      id: "termene",
      answer: "Fișa se înregistrează la operatorul de sistem în cel mult 5 zile lucrătoare de la întocmire, dar nu după data scadentă din notificare. După înregistrare, clientul primește exemplarul lui în cel mult 2 zile lucrătoare, cu numărul de înregistrare sau cu dovada. ElectroField numără ambele termene separat, pentru fiecare fișă.",
      blocks: [
        {
          type: "table",
          caption: "Termenele firmei după lucrare (Ord. ANRE 179/2015)",
          head: ["Ce faci", "Termen", "Temei", "În ElectroField"],
          rows: [
            ["Înregistrezi fișa la operatorul de sistem", "5 zile lucrătoare de la întocmire, dar nu după scadența din notificare", "Art. 9 alin. (6)", "Lista „De înregistrat”, cu zilele rămase; treci numărul și data"],
            ["Trimiți clientului exemplarul", "2 zile lucrătoare de la înregistrare, pe hârtie sau electronic", "Art. 9 alin. (7)", "Lista „De predat clientului”; marchezi „Predată”"],
            ["Ții registrul anual, în format electronic", "Pentru toate verificările și reviziile din an", "Art. 12, anexa 6", "Registrul se face din fișele încheiate; îl descarci în CSV"],
          ],
        },
        {
          type: "callout",
          title: "Cum numără platforma zilele lucrătoare",
          text: "Ziua întocmirii nu se numără; weekendul și sărbătorile legale sunt excluse. Procedura nu detaliază numărarea, iar zilele libere date în plus de guvern nu sunt în calendar. Confirmă convenția cu responsabilul tehnic.",
        },
        {
          type: "p",
          text: "Situațiile grele din teren (absent, refuz, scăpare, sistare) sunt în [ghidul despre fișa de evidență și scadențarul pe bloc](/blog/fisa-evidenta-verificare-revizie-gaze-scadentar).",
        },
      ],
    },
    {
      h: "Cine poate face verificarea și ce verifică platforma la oameni?",
      id: "autorizatii",
      answer: "Verificarea și revizia le face un operator economic autorizat ANRE pentru execuția instalațiilor de utilizare, ales de client (art. 3 alin. 5): autorizație EDIB până la 6 bar, ET între 6 și 10 bar (art. 2). În ElectroField, legitimațiile instalatorilor stau în registrul de conformitate, cu alertă înainte de expirare.",
      p: [
        "Alertele vin cu 60, 30 și 7 zile înainte și în ziua expirării, iar avertismentul de la programare nu blochează nimic. Tipul autorizației nu îl verifică platforma; asta rămâne la responsabilul tehnic. Vezi și [cine semnează lucrarea și când expiră autorizațiile ANRE](/blog/autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira). Dacă faci și electrice, același cont acoperă [firmele de instalații electrice](/firme-instalatii-electrice).",
      ],
    },
    {
      h: "Ce nu face (încă)",
      id: "ce-nu-face",
      list: [
        "Nu înregistrează fișele la operatorul de distribuție; le depui tu și treci numărul și data.",
        "Nu trimite singur anunțuri, SMS sau e-mailuri locatarilor. Tehnicianul îi poate suna din lista blocului.",
        "Nu trimite alerte înainte de scadența unui apartament; scadențele le vezi în filtre.",
        "Fișa e o pagină de tipărit sau de salvat PDF, iar registrul e un CSV, nu documente generate pe server.",
        "Nu verifică tipul autorizației (EDIB, ET) și nu decide dacă instalația poate funcționa în siguranță.",
        "Nu importă clienții firmei din fișier și nu face devize sau oferte.",
      ],
    },
    {
      h: "Surse, verificate la 28 noiembrie 2026",
      id: "surse",
      p: [
        "Regulile vin din procedura aprobată prin Ord. ANRE nr. 179/2015 (Monitorul Oficial nr. 969 din 28 decembrie 2015), modificată prin Ord. ANRE nr. 71/2020 și nr. 96/2023, citită din copiile consolidate ale doi operatori de distribuție. Pe legislatie.just.ro și anre.ro textul nu s-a deschis la data verificării; înainte de un control, confirmă forma în vigoare cu responsabilul tehnic.",
      ],
      list: [
        "[Procedura din Ord. ANRE 179/2015, consolidarea din 14 decembrie 2025, copie publicată de Gaz Est](https://gazest.ro/wp-content/uploads/2025/12/Procedura-privind-verificarile-si-reviziile-tehnice-ale-instalatiilor-de.pdf): art. 2, 3, 3², 7, 9, 12, 12¹, anexele 4–6.",
        "[Ord. ANRE 179/2015, forma sintetică la 7 noiembrie 2023, copie publicată de Distrigaz Sud Rețele](https://www.distrigazsud-retele.ro/wp-content/uploads/2023/11/Ordinul-ANRE-nr.-179.2015-actualizat-07.11.2023.pdf), pentru comparație.",
      ],
    },
  ],
  faq: [
    { q: "Pot importa lista de apartamente dintr-un Excel?", a: "Da. Lipești coloanele scară, apartament, nume, telefon, ultima verificare și ultima revizie, până la 2.000 de apartamente o dată. Dacă un rând are o dată invalidă sau un apartament dublat, importul nu se face și vezi rândul cu problema." },
    { q: "Cum se calculează scadența după o revizie?", a: "Dacă revizia e făcută în anul în care era scadentă verificarea, ține locul ei, iar următoarea verificare e scadentă la cel mult 2 ani de la revizie (art. 3² alin. 1–2). Platforma mută data verificării când se încheie fișa de revizie; dacă revizia a căzut în alt an, confirmă termenul cu operatorul de distribuție. Intervalele, implicit 24 și 120 de luni, le schimbă administratorul." },
    { q: "Ce fac când locatarul nu e acasă sau refuză accesul?", a: "Tehnicianul notează „absent”, „refuz” sau „reprogramat”, cu motivul, iar apartamentul rămâne în scadențar până îl reprogramezi. Ce faci mai departe stabilești cu responsabilul tehnic; [ghidul despre fișa de evidență](/blog/fisa-evidenta-verificare-revizie-gaze-scadentar) descrie situațiile din teren." },
    { q: "Merge fișa fără semnal, în subsol?", a: "Da. Fișa, vizitele de pe bloc, pozele, semnătura, sosirea și finalul lucrării se salvează pe telefon și pleacă singure când revine semnalul. Plecarea, consumul de materiale și cheltuielile cer semnal. Deschide lista blocului cât ai semnal." },
    { q: "ElectroField înregistrează fișele la operatorul de distribuție?", a: "Nu. Le înregistrezi tu, la ghișeu sau electronic, cum cere operatorul. Treci apoi în platformă numărul și data, iar termenul de 2 zile lucrătoare pentru exemplarul clientului pornește de la acea dată." },
    { q: "Cine are voie să facă verificarea și revizia?", a: "Un operator economic autorizat ANRE pentru execuția instalațiilor de utilizare, ales de client: EDIB până la 6 bar, ET între 6 și 10 bar (art. 2 și art. 3 alin. 5 din procedură). Ce acoperă autorizația firmei confirmi cu responsabilul tehnic." },
    { q: "Pe ce telefoane lucrează tehnicienii?", a: "Pe Android, în aplicația Android (APK, descărcată de pe site); pe iPhone, din browser. Biroul lucrează în browser, pe calculator. Notificările push merg doar în aplicația Android." },
  ],
  related: [
    "fisa-evidenta-verificare-revizie-gaze-scadentar",
    "verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti",
    "autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira",
    "service-sezonier-centrale-termice",
    "gestionare-echipe-de-teren",
    "excel-sau-aplicatie-gestionare-lucrari",
  ],
  updated: "2026-11-28",
  ogImage: "/og/firme-gaze-verificari-revizii.jpg",
  breadcrumb: "Verificări și revizii gaze",
};

export default page;
