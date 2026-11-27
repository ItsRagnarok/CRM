/**
 * Paginile publice pe meserie și pe funcționalitate (SEO): fiecare răspunde la ce caută o firmă de
 * instalații și descrie doar ce face platforma acum. Le servește src/app/[slug]/page.tsx.
 * Conținutul e date simple, ca să poată fi citit și de sitemap și de middleware (rute publice).
 */
export type MarketingSection = { h: string; p?: string[]; list?: string[] };
export type MarketingPage = {
  slug: string;
  /** Sub 60 de caractere, cu termenul căutat la început. */
  title: string;
  /** 140–160 de caractere. */
  description: string;
  kicker: string;
  h1: string;
  lead: string;
  sections: MarketingSection[];
  faq: { q: string; a: string }[];
  /** Articole din /blog legate de subiect (slug-uri). */
  related: string[];
  /** Data ultimei modificări reale a textului (pentru sitemap). */
  updated: string;
};

export const MARKETING_PAGES: MarketingPage[] = [
  {
    slug: "firme-instalatii-electrice",
    title: "Program pentru firme de instalații electrice",
    description: "Lucrări, echipe, buletine PRAM și izolație, lucrări ascunse cu poze, autorizații ANRE și marjă pe lucrare, într-o platformă pentru firme de instalații electrice.",
    kicker: "Pentru firme de instalații electrice",
    h1: "Program pentru firme de instalații electrice",
    lead: "ElectroField ține într-un singur loc lucrările, echipele, măsurătorile și documentele pe care le predai clientului. Tehnicianul completează din telefon, biroul vede pe loc ce s-a făcut, iar documentele ies semnate de cine are dreptul să semneze.",
    sections: [
      { h: "Ce rezolvă pentru o firmă de electrice", list: [
        "Lucrările zilei pe echipe, cu adresa, clientul, ce e de făcut și ce materiale trebuie luate din depozit.",
        "Măsurătorile din teren (priză de pământ, rezistență de izolație, continuitate) intră direct în buletin, fără recopiere din caiet.",
        "Buletinul îl semnează doar persoana cu autorizație ANRE valabilă pentru gradul cerut; o autorizație expirată te anunță înainte de lucrare.",
        "Lucrările ascunse se documentează cu poze etichetate înainte de închidere, iar procesul-verbal iese din aplicație.",
        "Marja pe fiecare lucrare: orele lucrate, materialele consumate și ce ai facturat, ca să vezi unde pierzi bani.",
      ] },
      { h: "Cum arată o zi de lucru", p: [
        "Dimineața, biroul programează lucrările din calendar pe echipe. Programarea te avertizează dacă un om nu are autorizația potrivită, dacă mașina are ITP sau RCA expirat sau dacă lipsește un material din stoc.",
        "Tehnicianul pornește lucrarea din telefon: drumul, sosirea, începutul și finalul se pontează în două atingeri. La fața locului face pozele înainte și după, bifează checklistul, trece măsurătorile și ia semnătura clientului pe ecran.",
        "Seara, biroul are lucrarea închisă, cu documentele gata de trimis și rândurile de factură completate din ore și materiale.",
      ] },
      { h: "Documentele pe care le predai clientului", list: [
        "Buletin de verificare (PRAM, izolație) cu valorile măsurate și semnatarul autorizat.",
        "Proces-verbal de lucrări ascunse, cu pozele făcute înainte de închidere.",
        "Raport de lucrare semnat de client, cu ore, materiale și observații.",
        "Pachetul pentru client pe un link: pozele înainte și după și documentele lucrării.",
      ] },
      { h: "Pentru cine e potrivit", p: [
        "Pentru firme cu una până la câteva zeci de echipe în teren, care fac instalații noi, mentenanță, intervenții sau verificări periodice. Funcționează și pentru firmele care fac în paralel fotovoltaice sau gaze: alegi domeniile, iar meniul se adaptează.",
      ] },
    ],
    faq: [
      { q: "Pot genera buletinul PRAM direct din aplicație?", a: "Da. Tehnicianul trece valorile măsurate în telefon, iar buletinul se generează cu ele și cu semnatarul ales. Semnatarul trebuie să aibă în platformă o autorizație ANRE valabilă." },
      { q: "Ce se întâmplă când expiră autorizația ANRE a unui electrician?", a: "Platforma ține evidența autorizațiilor în secțiunea Conformitate și te anunță înainte de expirare. La programare primești avertisment dacă alegi un om fără autorizația necesară." },
      { q: "Funcționează și fără semnal în subsol sau pe șantier?", a: "Da. Aplicația tehnicianului salvează pe telefon pozele, pașii și semnăturile și le trimite când revine semnalul." },
      { q: "Pot emite factura după lucrare?", a: "Da. Factura se completează din lucrare (ore × tariful tău, materialele cu adaosul tău) și se emite prin contul tău SmartBill sau Oblio." },
    ],
    related: ["verificare-pram-rezistenta-priza-de-pamant-periodicitate", "autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira", "model-proces-verbal-raport-lucrare", "cum-calculezi-profitul-pe-lucrare"],
    updated: "2026-11-27",
  },
  {
    slug: "firme-gaze-verificari-revizii",
    title: "Program pentru verificări și revizii gaze",
    description: "Scadențar pe bloc, scară și apartament, verificare la 2 ani și revizie la 10 ani calculate automat, fișa de evidență și termenele de după lucrare (Ord. ANRE 179/2015).",
    kicker: "Pentru firme de gaze",
    h1: "Program pentru firme de verificări și revizii gaze",
    lead: "Pentru firmele care lucrează pe blocuri și asociații: scadențarul fiecărui apartament, fișa de evidență completată din telefon și termenele de înregistrare la operator, fără câte un Excel pe fiecare om.",
    sections: [
      { h: "Scadențarul, calculat din ultimele lucrări", list: [
        "Bloc, scară și apartament, cu ultima verificare și ultima revizie; lista se importă din Excel.",
        "Următoarea verificare (cel mult 2 ani) și revizia (cel mult 10 ani) se calculează singure; revizia ține locul verificării din acel an.",
        "Vezi pe fiecare bloc ce e scadent luna aceasta, ce e întârziat și ce urmează, ca să planifici scară cu scară.",
        "O dată greșită sau imposibilă e respinsă la import, nu descoperită la control.",
      ] },
      { h: "Fișa de evidență, din telefon", p: [
        "Tehnicianul completează fișa la fața locului: operațiunile bifate sau justificate pe rând, documentele de coș și ale aparatelor, observațiile. Clientul semnează pe ecran.",
        "Pentru instalația comună lucrați pe lista de pe bloc: fiecare apartament are starea lui (făcut, absent, refuz, defect), iar biroul vede pe loc ce a rămas.",
      ] },
      { h: "Termenele de după lucrare", p: [
        "Procedura pornește ceasuri după fiecare fișă: 5 zile lucrătoare pentru înregistrarea la operator și încă 2 până la emiterea documentelor. Platforma le numără de la data fiecărei fișe, fără weekenduri și sărbători, și îți arată ce expiră.",
        "Registrul anual se ține singur din fișele închise.",
      ] },
      { h: "Oamenii și autorizațiile", p: [
        "Legitimațiile instalatorilor și autorizația firmei stau în Conformitate, cu alertă înainte de expirare. La programare primești avertisment dacă un om nu are legitimația valabilă.",
      ] },
    ],
    faq: [
      { q: "Pot importa lista de apartamente dintr-un Excel?", a: "Da. Importul primește scara, apartamentul, numele și datele ultimei verificări și revizii. Rândurile cu date invalide sunt semnalate, nu importate pe ascuns." },
      { q: "Cum se calculează scadența după o revizie?", a: "Revizia ține locul verificării din acel an, iar următoarea verificare e scadentă la cel mult 2 ani de la revizie. Platforma aplică regula automat." },
      { q: "Ce fac când locatarul nu e acasă?", a: "Apartamentul rămâne pe lista blocului cu starea „absent” și motivul, iar biroul îl reprogramează. Starea se vede în scadențar." },
      { q: "Textul procedurii e verificat?", a: "Regulile sunt luate din Ord. ANRE 179/2015 în forma consolidată. Ghidul nostru despre fișa de evidență spune exact ce e verificat și ce nu; înainte de un control, confirmă cu responsabilul tehnic." },
    ],
    related: ["fisa-evidenta-verificare-revizie-gaze-scadentar", "verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti", "gestionare-echipe-de-teren", "evidenta-orelor-tehnicieni-teren-pontaj"],
    updated: "2026-11-27",
  },
  {
    slug: "firme-fotovoltaice",
    title: "Program pentru firme de montaj fotovoltaic",
    description: "Dosar pe etape pentru fiecare proiect fotovoltaic, termenele operatorului cu ceas, PIF pe string, proces-verbal de punere în funcțiune și echipele de montaj, într-un singur loc.",
    kicker: "Pentru firme de fotovoltaice",
    h1: "Program pentru firme de montaj fotovoltaic",
    lead: "Fiecare proiect are dosarul lui, de la ofertă și ATR la punerea în funcțiune: ce document lipsește, la ce etapă e și cât mai are operatorul până la termen.",
    sections: [
      { h: "Dosarul pe etape", list: [
        "Etapele proiectului (ofertă, contract, ATR, montaj, punere în funcțiune, dosar prosumator) cu documentele cerute la fiecare.",
        "Ceas pentru termenele operatorului; termenele se pot modifica dacă se schimbă regulile.",
        "Când operatorul depășește termenul, platforma îți pregătește mesajul către el.",
        "Vezi pe toate proiectele ce e blocat și la cine.",
      ] },
      { h: "Montajul și punerea în funcțiune", p: [
        "Echipa de montaj are în telefon checklistul, pozele etichetate (panouri, invertor, tablou, împământare) și măsurătorile pe fiecare string.",
        "Procesul-verbal de punere în funcțiune se completează cu valorile din teren și se semnează la fața locului.",
      ] },
      { h: "Service și reclamații după montaj", p: [
        "Reviziile periodice intră în calendar, iar o reclamație de tipul „produce prea puțin” devine o lucrare cu istoric complet: ce s-a montat, ce s-a măsurat la PIF și ce s-a schimbat de atunci.",
      ] },
    ],
    faq: [
      { q: "Pot urmări termenele operatorului de distribuție?", a: "Da. Fiecare etapă cu termen are un ceas. Termenele implicite se pot edita, pentru că se mai schimbă reglementările." },
      { q: "Măsurătorile pe string se salvează pe proiect?", a: "Da. Valorile din teren rămân pe proiect și apar în procesul-verbal de punere în funcțiune și la orice intervenție ulterioară." },
      { q: "Funcționează și pentru firmele care fac și instalații electrice?", a: "Da. Alegi domeniile firmei, iar meniul arată fotovoltaicul alături de electrice sau gaze." },
    ],
    related: ["proces-verbal-punere-in-functiune-fotovoltaic-model", "dosar-prosumator-etape-termene-atr", "checklist-instalare-sistem-fotovoltaic", "panouri-fotovoltaice-produc-putin-verificari"],
    updated: "2026-11-27",
  },
  {
    slug: "pontaj-tehnicieni",
    title: "Pontaj pentru tehnicieni în teren, din telefon",
    description: "Pontaj pe lucrare în două atingeri: plecare, sosire, început și final, cu locația la sosire. Corecții motivate aprobate de birou, concedii și export lunar.",
    kicker: "Funcționalitate",
    h1: "Pontaj pentru tehnicienii din teren",
    lead: "Orele se pontează pe lucrare, din telefon, în momentul în care se întâmplă. Biroul nu mai adună foi și mesaje la final de lună.",
    sections: [
      { h: "Cum se pontează", list: [
        "Plecarea, sosirea, începutul și finalul lucrării, fiecare în două atingeri.",
        "La sosire se salvează locația, ca dovadă că echipa a fost la adresă.",
        "Pontajul merge și fără semnal: se trimite când revine conexiunea.",
        "O oră uitată se corectează cu motiv, iar corecția o aprobă biroul.",
      ] },
      { h: "Ce vede biroul", p: [
        "Orele pe om, pe echipă și pe lucrare, concediile aprobate și cheltuielile din teren. Din aceleași ore se calculează durata medie pe tip de lucrare, ca programările următoare să fie realiste, și costul manoperei în marja lucrării.",
      ] },
      { h: "Concedii și cheltuieli", p: [
        "Tehnicianul cere concediul din telefon, iar biroul îl aprobă sau îl respinge. Cererile pornesc mereu „în așteptare”: nimeni nu își aprobă singur concediul sau cheltuiala.",
      ] },
    ],
    faq: [
      { q: "Tehnicianul își poate modifica singur orele?", a: "Nu direct. Poate cere o corecție cu motiv, iar corecția intră în pontaj doar după ce o aprobă biroul." },
      { q: "Localizarea e permanentă?", a: "Nu. La pontaj se salvează locația doar la sosire. Urmărirea continuă e o opțiune separată, care cere acordul angajatului." },
      { q: "Pot exporta pontajul pentru contabilitate?", a: "Da, pe lună, pe fiecare om." },
    ],
    related: ["evidenta-orelor-tehnicieni-teren-pontaj", "urmarire-gps-echipe-teren-gdpr", "gestionare-echipe-de-teren", "calculator-tarif-ora-electrician-instalator"],
    updated: "2026-11-27",
  },
  {
    slug: "foaie-de-parcurs-electronica",
    title: "Foaie de parcurs electronică pentru mașinile firmei",
    description: "Foaia de parcurs lunară pe fiecare mașină, generată din lucrările terminate ale echipei: zi, client, adresă, kilometri și costul drumurilor. Plus ITP, RCA și stocul din mașină.",
    kicker: "Funcționalitate",
    h1: "Foaie de parcurs electronică",
    lead: "Foaia de parcurs se face din lucrările pe care echipa mașinii le-a terminat în luna respectivă. Nimeni nu mai scrie de mână la final de lună și nu introduce nimic în plus.",
    sections: [
      { h: "Ce conține", list: [
        "Mașina, numărul de înmatriculare, echipa și șoferul.",
        "Pe fiecare zi: lucrările, clientul, adresa și kilometrii înregistrați pe lucrare.",
        "Totalul de kilometri pe lună și costul estimat, din costul pe kilometru setat de firmă.",
        "Navigare pe luni și filtru pe mașină.",
      ] },
      { h: "Mașina ca depozit mobil", p: [
        "Fiecare mașină are lista ei de materiale și scule, cu un prag minim. Când consumul pe lucrări scade stocul sub prag, apare la reaprovizionare. ITP-ul și RCA-ul sunt în Conformitate, cu alertă înainte de expirare și avertisment la programare.",
      ] },
      { h: "De știut", p: [
        "Pentru deducerea cheltuielilor cu mașinile, forma finală a foii de parcurs se confirmă cu contabilul firmei.",
      ] },
    ],
    faq: [
      { q: "De unde vin datele din foaia de parcurs?", a: "Din lucrările terminate ale echipei căreia îi e alocată mașina: data, clientul, adresa și kilometrii înregistrați pe fiecare lucrare." },
      { q: "Pot ține evidența ITP și RCA?", a: "Da. Datele de expirare stau în Conformitate, cu alertă înainte de termen și avertisment dacă programezi o mașină cu documente expirate." },
    ],
    related: ["reducere-timpi-deplasare-lucrari", "gestionare-echipe-de-teren", "gestiune-materiale-ce-ai-cumparat-ce-ai-folosit"],
    updated: "2026-11-27",
  },
  {
    slug: "aplicatie-tehnician",
    title: "Aplicație pentru tehnicieni: lucrări, poze, semnătură",
    description: "Aplicația de telefon pentru tehnicieni: lucrările zilei, pașii lucrării, poze etichetate înainte și după, checklist, semnătura clientului și pontaj. Merge și fără semnal.",
    kicker: "Funcționalitate",
    h1: "Aplicația pentru tehnicieni",
    lead: "Tehnicianul are în telefon doar ce îi trebuie azi: lucrările, adresa, ce are de luat din depozit și pașii lucrării. Tot ce face ajunge la birou în timp real.",
    sections: [
      { h: "Ce face tehnicianul din telefon", list: [
        "Vede lucrările zilei, în ordine, cu navigare spre adresă.",
        "Parcurge pașii lucrării: ridicarea materialelor, drumul, sosirea, lucrul, finalizarea.",
        "Face poze în două atingeri, etichetate înainte și după; se încarcă în fundal.",
        "Bifează checklistul, trece măsurătorile și ia semnătura clientului pe ecran.",
        "Cere materiale, înregistrează cheltuieli cu poza bonului și cere concediu.",
      ] },
      { h: "Gândită pentru teren", list: [
        "Merge fără semnal: pozele, pașii și semnăturile se trimit când revine conexiunea.",
        "Mod „mănuși” (butoane mari) și mod „soare” (contrast mare).",
        "Notificări când biroul îi schimbă programul sau îi trimite un mesaj.",
        "Android și iPhone, cu același cont.",
      ] },
      { h: "Ce vede clientul", p: [
        "Clientul primește un link cu fereastra de sosire, mesajul „echipa e pe drum”, cine vine la el și, după lucrare, pozele înainte și după și documentele. Fără cont și fără aplicație.",
      ] },
    ],
    faq: [
      { q: "Pe ce telefoane merge?", a: "Pe Android și pe iPhone. Pe Android se instalează aplicația; pe iPhone merge din browser sau ca aplicație." },
      { q: "Tehnicianul vede datele firmei?", a: "Vede lucrările lui și ce îi trebuie pentru ele. Prețurile de achiziție, tarifele colegilor și aprobările rămân la birou." },
      { q: "Ce se întâmplă dacă pierde semnalul?", a: "Lucrează mai departe. Datele stau pe telefon și se trimit singure când revine semnalul." },
    ],
    related: ["tehnician-vs-administrator", "excel-sau-aplicatie-gestionare-lucrari", "model-proces-verbal-raport-lucrare", "documente-predare-client-dupa-instalare"],
    updated: "2026-11-27",
  },
  {
    slug: "facturare-smartbill-oblio",
    title: "Facturare din lucrări prin SmartBill sau Oblio",
    description: "Factura se completează din lucrare: ore lucrate × tariful tău și materialele cu adaos. Se emite prin SmartBill sau Oblio, cu date ANAF, încasări parțiale și e-Factura.",
    kicker: "Funcționalitate",
    h1: "Facturare din lucrări, prin SmartBill sau Oblio",
    lead: "Lucrarea terminată apare la „De facturat”. Rândurile facturii se completează din orele pontate și materialele consumate, iar factura se emite în contul tău SmartBill sau Oblio.",
    sections: [
      { h: "Cum funcționează", list: [
        "Manopera: orele lucrate × tariful orar al firmei.",
        "Materialele: ce s-a consumat pe lucrare, cu adaosul tău.",
        "Datele clientului persoană juridică vin de la ANAF după CUI: denumire, adresă, Registrul Comerțului, plătitor de TVA.",
        "Seriile de facturi și cotele de TVA vin din contul tău de la furnizor; firmele neplătitoare de TVA au factura fără TVA.",
      ] },
      { h: "După emitere", list: [
        "PDF și link pentru client.",
        "Încasări parțiale, numerar cu chitanță, card sau ordin de plată.",
        "Trimitere pe e-mail (SmartBill) și în SPV / e-Factura (Oblio).",
        "Anulare, storno, proformă transformată în factură.",
        "Restanțele pe vechime, ca să știi pe cine suni întâi.",
      ] },
      { h: "Fără furnizor conectat", p: [
        "Poți ține evidența internă a documentelor până conectezi SmartBill sau Oblio. PDF-ul e marcat clar ca document intern, nu factură fiscală.",
      ] },
    ],
    faq: [
      { q: "Pot folosi și SmartBill, și Oblio?", a: "Firma conectează unul dintre ele, cel în care își ține deja facturile." },
      { q: "Facturile ajung în e-Factura?", a: "Prin Oblio, da, direct din platformă. SmartBill nu oferă trimiterea în e-Factura prin API, așa că acolo se face din contul SmartBill." },
      { q: "Ce se întâmplă cu o factură emisă greșit?", a: "O factură emisă nu se mai modifică. Se anulează sau se stornează, ca în contabilitate." },
    ],
    related: ["e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice", "cat-avans-ceri-lucrari-electrice-fotovoltaice", "cum-calculezi-profitul-pe-lucrare", "model-oferta-lucrari-electrice-fotovoltaice"],
    updated: "2026-11-27",
  },
  {
    slug: "stoc-materiale-pe-masini",
    title: "Stoc de materiale pe mașini și registru de scule",
    description: "Stocul din fiecare mașină, cu listă țintă și prag minim, consumul pe lucrare, reaprovizionare și achiziții urgente. Plus registrul de scule cu predare-primire și calibrare.",
    kicker: "Funcționalitate",
    h1: "Stoc de materiale pe mașini și registru de scule",
    lead: "Știi ce are fiecare mașină în portbagaj, ce s-a consumat pe fiecare lucrare și ce trebuie cumpărat, înainte ca echipa să rămână fără un material la client.",
    sections: [
      { h: "Stocul pe mașină", list: [
        "Lista țintă pentru fiecare mașină, cu prag minim pe fiecare material.",
        "Consumul se scade pe lucrare, din aplicația tehnicianului.",
        "Reaprovizionarea arată ce lipsește pe fiecare mașină față de lista țintă.",
        "Achiziție urgentă: tehnicianul cere din teren, biroul aprobă și spune de unde se ia.",
      ] },
      { h: "Depozite și comenzi", p: [
        "Depozitul central și depozitele secundare, cu adrese vizibile pe hartă și în navigarea tehnicianului. Comanda către furnizor se face din ce lipsește. Catalogul standard de materiale se poate importa ca punct de plecare.",
      ] },
      { h: "Registrul de scule", p: [
        "Fiecare sculă și aparat are istoricul de predare-primire între oameni și data calibrării. Aparatele de măsură cu calibrarea expirată apar în Conformitate.",
      ] },
    ],
    faq: [
      { q: "Tehnicianul vede prețurile de achiziție?", a: "Nu. Tehnicianul vede materialele și cantitățile; prețurile rămân la birou." },
      { q: "Pot importa materialele dintr-o listă?", a: "Da, există un catalog standard de pornire, iar materialele proprii se adaugă manual sau din comenzi." },
    ],
    related: ["gestiune-materiale-ce-ai-cumparat-ce-ai-folosit", "cum-calculezi-profitul-pe-lucrare", "reducere-timpi-deplasare-lucrari"],
    updated: "2026-11-27",
  },
];

export const MARKETING_SLUGS = MARKETING_PAGES.map((p) => p.slug);
export const marketingPage = (slug: string) => MARKETING_PAGES.find((p) => p.slug === slug);
