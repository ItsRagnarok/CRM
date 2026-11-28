/**
 * Întrebările de pe pagina principală (afișate și în datele structurate FAQPage, fără sintaxa legăturilor).
 * Legăturile se scriu [text](/cale), ca în src/lib/inline-links.ts.
 * Răspunsurile urmează fișa de fapte verificate despre produs (cercetarea din 28 nov 2026, R3 secțiunea 4):
 * lista exactă de pași care merg fără semnal, Android (APK) și iPhone din browser, e-Factura doar prin Oblio,
 * GPS continuu doar cu setarea firmei și acordul angajatului. Fără prețuri și fără nume de alte produse.
 */
export const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "Pentru ce firme e ElectroField? Merge și pentru o firmă mică?",
    a: "Pentru firmele de instalații electrice, de verificări și revizii gaze și de montaj fotovoltaic care lucrează cu echipe în teren. Merge și pentru o firmă mică, cu doi-trei tehnicieni și un om la birou: alegi domeniile firmei, iar meniul arată doar ce folosești. Climatizarea și securitatea folosesc partea comună: lucrări, echipe, pontaj, stoc și facturare.",
  },
  {
    q: "Merge aplicația pentru tehnicieni fără semnal?",
    a: "Da, pentru ce face tehnicianul la client. Pozele, semnătura clientului, sosirea, începutul și finalul lucrării, formularele, fișele și vizitele de gaze și incidentele SSM se salvează pe telefon și pleacă singure când revine semnalul. Paginile deschise deja rămân disponibile. Plecarea spre client, cheltuielile, cererile de concediu, consumul de materiale și datele noi de la birou cer semnal.",
  },
  {
    q: "Pe ce telefoane merge aplicația: Android sau iPhone?",
    a: "Pe Android, tehnicianul folosește aplicația Android (APK, descărcată de pe site), pe Android 7 sau mai nou. Pe iPhone, lucrează din browser și poate pune pagina pe ecranul principal. Contul și lucrările sunt aceleași. Notificările push vin doar în aplicația Android; pe iPhone, le vede când deschide pagina. Biroul lucrează din browser, pe calculator. Detalii despre [aplicația pentru tehnicieni din teren](/aplicatie-tehnician).",
  },
  {
    q: "Se leagă de SmartBill, Oblio și e-Factura?",
    a: "Da, prin contul tău. Factura se completează din lucrare (orele pontate cu tariful firmei, materialele cu adaosul tău), cu datele clientului luate de la ANAF după CUI, și se emite prin SmartBill sau Oblio. Cu Oblio, o trimiți în e-Factura (SPV) direct din platformă. Cu SmartBill, trimiterea în SPV se face din contul SmartBill, nu din ElectroField. Vezi [facturarea din lucrări prin SmartBill sau Oblio](/facturare-smartbill-oblio).",
  },
  {
    q: "Pot vedea pe hartă unde sunt echipele? Cum rămâne cu GDPR?",
    a: "La sosirea la client, aplicația salvează locația, dacă telefonul o dă, ca dovadă pentru pontaj. Urmărirea continuă pe hartă pornește doar dacă firma o activează în setări și angajatul își dă acordul în aplicație; acordul se poate retrage oricând. Cu ecranul blocat, poziția se trimite doar din aplicația Android. Ce trebuie să ai în regulă: [urmărirea angajaților cu GPS și GDPR](/blog/urmarire-gps-echipe-teren-gdpr).",
  },
  {
    q: "Ce documente scot pentru lucrările electrice, de gaze și fotovoltaice?",
    a: "La gaze, fișa de evidență se completează și se semnează pe telefon, apoi o tipărești. La electrice, măsurătorile pe circuite se trec în telefon, iar procesul-verbal de lucrări ascunse, cu poze, îl tipărești sau îl salvezi PDF. La fotovoltaic, fișa de punere în funcțiune ține valorile pe fiecare string. Orice lucrare are raport PDF, cu orele și semnătura clientului. Buletinul PRAM nu se generează încă din valori. Forma fiecărui document o confirmi cu responsabilul tehnic.",
  },
  {
    q: "Pot aduce datele din Excel?",
    a: "În parte. Lista apartamentelor pentru verificări și revizii de gaze o lipești din Excel sau CSV, până la 2.000 de rânduri o dată. Catalogul standard de materiale se adaugă dintr-un clic. Clienții și materialele proprii nu se importă acum dintr-un fișier: le adaugi în platformă. Te ajutăm la prima configurare, pe datele firmei tale.",
  },
  {
    q: "Ce nu face ElectroField?",
    a: "Nu face devize și oferte, nu ține contabilitatea sau salarizarea, nu e un CRM de vânzări și nu e program de proiectare electrică. Nu trimite singur SMS clientului: tehnicianul îi trimite, cu o atingere, mesajul că a plecat spre el, cu linkul de status. Factura o emite prin contul tău SmartBill sau Oblio. Pentru oferte, pornești de la un [model de ofertă pentru lucrări electrice și fotovoltaice](/blog/model-oferta-lucrari-electrice-fotovoltaice).",
  },
  {
    q: "Cum încep și cum văd platforma înainte să mă decid?",
    a: "[Programezi o discuție](/programare): un apel de 15 minute la telefon sau o prezentare de 30 de minute pe Google Meet, cu platforma pe ecran, pe lucrările și echipele tale. Întâi vorbim despre cum lucrează firma acum și ce te încurcă. Dacă vrei să o folosești, te ajutăm la prima configurare, pe datele firmei tale.",
  },
];
