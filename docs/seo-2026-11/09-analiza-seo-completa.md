# ElectroField: analiza SEO completă și ce s-a implementat

Site: https://www.electrofield.ro. Data analizei și a implementării: 28 noiembrie 2026.
Branch cu modificările: `claude/charming-goldberg-w01eye` (commiturile `a4b15cb` și `0c8343b`, repo ItsRagnarok/CRM). Modificările nu sunt încă live: ajung pe site după merge în ramura principală.

Documentul are două părți:
- **Partea A**: sinteza, adică diagnosticul, deciziile, ce s-a schimbat, ce au găsit recenzorii și ce rămâne de făcut. Se citește singură.
- **Partea B**: anexele, adică rapoartele de cercetare complete (R1–R6), scrise înainte de implementare. Unele recomandări din ele au fost respinse prin deciziile proprietarului (vezi A.3). Când anexele contrazic Partea A, are dreptate Partea A.

---

# PARTEA A. SINTEZĂ

## A.1 Contextul și cererea

- **Produsul.** ElectroField e o platformă SaaS românească pentru firme de instalații electrice, gaze și fotovoltaice care au echipe de teren. Are partea de birou pe web, aplicație Android (APK descărcat de pe site) și varianta pentru iPhone, din browser.
- **Tehnic.** Next.js 15.5 (App Router), găzduire pe Vercel (fra1) și backend Supabase. Paginile comerciale sunt generate din date (`src/lib/marketing-content/*.ts`). Blogul e HTML static în `public/blog/*.html`.
- **Cererea proprietarului:** „SEO perfect”. Căutarea de referință a fost „software de management electricieni și echipe mobile” pe Google.ro:
  - AI Overview recomanda GoManager, Aktio, Electrogest, WorkApp și Om Pe Teren.
  - Rezultatele organice erau electrogest.ro, workapp.ro, gomanager.ro, crewhub.ro, un video Softimpera și softimpera.ro.
  - ElectroField nu apărea deloc.

## A.2 Diagnosticul: de ce nu apărea ElectroField

1. **Site nou.** Avea aproximativ o săptămână, ~29 de pagini indexate și zero backlinkuri. Concurenții au ani de istoric și linkuri.
2. **Titluri exact pe interogare la concurenți.** GoManager: „Program de management pentru echipe din teren”. WorkApp: „Software Echipe Teren”. Aktio: „Software field service (FSM) pentru echipe de teren”. Om Pe Teren: „Aplicație pentru firme cu echipe de teren”. Cel mai probabil, AI Overview a sintetizat răspunsul din aceste pagini de vânzător. Nu am găsit nicio listă independentă în română care să-i compare.
3. **Cererea reală e în altă parte.** Interogările de categorie („software management echipe teren”, „program pentru electricieni”, „aplicație gestionare lucrări”, „crm instalații”) au volum măsurat aproape zero. Volumul real e la documente și obligații. Niciun concurent nu acoperă stratul acesta.
4. **Concurenții au prețuri publice și perioadă de probă.** GoManager are planuri de la ~15,80 €/lună și 14 zile gratuite. Aktio are planuri pe utilizator și probă de 15 zile. Electrogest are 1.000 lei/lună. ElectroField nu publică prețuri, iar proprietarul a decis să rămână așa (A.3).
5. **Probleme tehnice:**
   - Orice adresă necunoscută făcea redirect 307 la /login în loc de 404, deci Google vedea soft-404 și zgomot în Search Console.
   - Pagina principală și /software-management-echipe-teren aveau același H1 (canibalizare).
   - Paginile importante primeau puține linkuri interne.
   - Blogul nu avea autor sau dată vizibile.
   - Aproape toate paginile foloseau aceeași imagine de previzualizare (OG).
   - Sitemap-ul nu avea lastmod pe câteva adrese.
   - /llms.txt nu exista.
   - IndexNow avea doar fișierul-cheie, fără apeluri efective.
6. **Afirmații exagerate despre produs** (vezi A.5). Erau un risc de încredere, inclusiv pentru AI Overview, care repetă ce scrie pe site.
7. **Performanța nu e o problemă.** Lighthouse dă 93–100 la performanță și 100 la SEO pe toate paginile testate. TTFB e de 20–30 ms.

### Volume lunare de căutare (Google Ads, RO, prin DataForSEO)

| Interogare | Volum/lună | Cine o deține acum pe site |
|---|---|---|
| foaie de parcurs | 1.600 | /blog/model-foaie-de-parcurs (nou) |
| revizie instalație gaze | 720 | /blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti |
| verificare pram | 590 | /blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate |
| model proces verbal | 590 | /blog/model-proces-verbal-raport-lucrare |
| program facturare | 590 | nu o țintim (o dețin SmartBill, Oblio, FGO) |
| priza de pământ | 480 | /blog/priza-de-pamant-valori-masurare (nou) |
| autorizație ANRE electrician | 480 | /blog/autorizatie-anre-electrician (nou) |
| verificare instalație gaze | 390 | articolul despre revizia de gaze |
| buletin pram | 260 | articolul PRAM |
| model foaie de parcurs | 260 | /blog/model-foaie-de-parcurs |
| dosar prosumator | 260 | /blog/dosar-prosumator-etape-termene-atr |
| pontaj online | 110 | /pontaj-tehnicieni |
| program devize | 90 | nu o țintim (produsul nu face devize) |
| crm romania | 90 | nu o țintim |
| măsurători pram | 90 | articolul PRAM |
| proces verbal recepție lucrări | 90 | articolul despre procesul-verbal |
| aplicație pontaj | 70 | /pontaj-tehnicieni |
| model ofertă | 70 | /blog/model-oferta-lucrari-electrice-fotovoltaice |
| program gestiune stocuri | 70 | /stoc-materiale-pe-masini |
| verificare gaze la 2 ani | 70 | articolul despre revizia de gaze |
| program pontaj / aplicație pontaj angajați | 40 / 30 | /pontaj-tehnicieni |
| legitimație ANRE | 20 | articolul despre autorizația ANRE |
| field service management / foaie de parcurs electronică | 10 / 10 | /software-management-echipe-teren / /foaie-de-parcurs-electronica |
| software management echipe teren, program pentru electricieni etc. | ~0 măsurat | pagina principală + /software-management-echipe-teren |

Concluzia strategică:
- **Paginile comerciale nu aduc trafic din căutări de categorie.** Rostul lor e să fie citate în AI Overview și în liste, să convingă vizitatorul adus de articole și să prindă căutările de brand.
- **Traficul vine din articole și modele descărcabile** pe teme de documente și obligații (foaie de parcurs, PRAM, gaze, ANRE, proces-verbal, prosumator). La acestea niciun concurent nu are conținut.

## A.3 Deciziile proprietarului (obligatorii)

1. **Fără pagină de prețuri și fără prețuri nicăieri pe site.** Nici în JSON-LD (fără `Offer`, `price`, `aggregateRating`). Sumele din `docs/abonamente-si-valoare.md` (299/599 lei) sunt propuneri interne și nu se publică.
2. **Pagina de comparație există, dar fără nume de concurenți.** Se compară tipuri de soluții (Excel + WhatsApp, aplicații de pontaj, FSM generic, programe de devize/ERP, platforme pe meserie). Nicio pagină „ElectroField vs X” și nicio pagină „alternativa la X”.
3. **Numele persoanei nu se publică.** Identitatea juridică apare ca PFA, cu CUI, Registrul Comerțului și sediu, fără nume.
4. **Google Search Console nu era configurat.** Pașii exacți sunt în planul pentru proprietar (A.8).

## A.4 Cine deține ce interogare (anti-canibalizare)

- **`/` (pagina principală)** deține „software de management pentru electricieni și echipe de teren/mobile”, brandul și „program pentru firme de instalații”:
  - Titlu: „Software de management pentru electricieni și echipe mobile” (59 de caractere).
  - H1: „Software de management pentru electricieni și echipe de teren”, vizibil imediat, fără animația care întârzia LCP.
- **`/software-management-echipe-teren`** deține „ce este un software de management pentru echipe de teren (FSM) și cum alegi”. Are alt H1 decât pagina principală și un tabel cu criterii pe tipuri de soluții.
- **Paginile pe meserii:**
  - `/firme-instalatii-electrice`: spune clar că e software de management, nu de proiectare electrică.
  - `/firme-gaze-verificari-revizii`: scadențar și fișa din Ord. ANRE 179/2015.
  - `/firme-fotovoltaice`: dosar pe etape și termene la operator.
- **Paginile pe funcții:**
  - `/pontaj-tehnicieni`: „pontaj online / aplicație pontaj”, ca pontaj pe lucrare. Spune explicit că nu e salarizare.
  - `/foaie-de-parcurs-electronica`: doar „foaie de parcurs electronică”. Termenul „foaie de parcurs” îl deține articolul-model.
  - `/aplicatie-tehnician`: aplicația pentru tehnicieni și fișa de intervenție digitală.
  - `/facturare-smartbill-oblio`: „facturare din lucrări”. Nu țintește „program facturare”.
  - `/stoc-materiale-pe-masini`: stoc operativ, cu precizarea că nu e gestiune contabilă.
- **`/despre`** (nouă): pagina entității. Spune ce e platforma, pentru cine, în ce stadiu e (nouă, 2026, fără clienți declarați), identitatea juridică fără nume, contactul și cum se prelucrează datele.
- **Articolele** dețin interogările informaționale din tabelul A.2.
- **Nu țintim** „program devize”, „program crm” sau „program facturare”, pentru că produsul nu face asta. Sunt tratate onest în FAQ.

## A.5 Adevărul despre produs: ce poate scrie site-ul

Am făcut un inventar al afirmațiilor pe baza codului (raportul R3, anexa B.5). Reguli:

- **Mobil:** „aplicația Android (APK, descărcată de pe site)” și „pe iPhone, din browser”. Nu scriem App Store, Google Play sau „aplicație iPhone” până nu există.
- **Offline:** doar lista verificată. Pozele, semnătura, sosirea, pornirea, închiderea, formularele și fișele de gaze se salvează pe telefon și pleacă singure când revine semnalul. Plecarea, cheltuielile, concediile și consumul de materiale cer semnal.
- **Ce nu există și nu se scrie:**
  - modul de oferte/devize;
  - import de clienți sau materiale din fișier;
  - SMS automat „echipa e pe drum” (e un buton manual de SMS/WhatsApp);
  - buletin PRAM sau PV de PIF generat automat;
  - recurență automată a reviziilor în calendar.
- **e-Factura/SPV:** doar prin Oblio. SmartBill emite factura, dar platforma nu o trimite în SPV.
- **Fără afirmații de încredere neadevărate:** fără număr de clienți, recenzii, studii de caz sau „economisești N ore”. Codul însuși notează că nimic nu e încă testat cu o firmă reală.
- **Corectate în verificare (A.7):**
  - Raportul PDF al lucrării nu conține orele. Conține checklistul, cheltuielile, numărul de poze și semnătura.
  - Foaia de parcurs nu are kilometri introduși. Câmpul `jobs.distance_km` și costul pe km nu sunt completate de nicio funcție din aplicație, doar de datele demo.
  - Pozele merg simultan la Gemini și la Groq, nu la Groq „de rezervă”.

## A.6 Ce s-a implementat

### Partea tehnică
- **404 real în loc de redirect la login.** Noul `src/lib/route-access.ts` clasifică fiecare cale ca publică, privată sau inexistentă. Doar căile private trimit la /login (sau la /mobil-login). Restul ajung la o pagină 404 în română, cu noindex (`src/app/not-found.tsx`).
- **Siguranța rutelor private:**
  - Clasificarea închide accesul și pentru variante cu majuscule, %-encoding, `//`, backslash, segmente `(grup)` și `..` codificat.
  - Testul `scripts/middleware-routes.test.mts` parcurge `src/app` și pică dacă apare o rută neclasificată.
  - Testul rulează la fiecare `npm run build`, deci o rută nouă uitată oprește deploy-ul.
  - Matcherul middleware-ului a fost restrâns ca cererile cu sufix de imagine pe rute private să treacă și ele prin verificare.
- **Sitemap:** lastmod pe toate cele 45 de adrese.
- **`public/llms.txt`** nou, pentru motoarele cu AI.
- **IndexNow:** `npm run seo:indexnow` (are și `--dry-run`) anunță Bing și celelalte motoare după un deploy.
- **`scripts/check-seo.mjs`:** verifică sitemap-ul, statusurile, canonical, indexarea, H1, og:image, 404-urile, rutele private și llms.txt.
- **JSON-LD:**
  - WebSite, Organization și SoftwareApplication sunt definite centralizat în `src/lib/seo.ts`.
  - Lista de funcții conține doar ce e verificat.
  - Nu există `offers`, rating, `legalName` sau `sameAs` (până există profiluri reale).
  - Paginile mai au WebPage, BreadcrumbList și FAQPage, iar articolele BlogPosting.
- **Imagini OG:** 41 de imagini 1200×630, una pentru fiecare pagină și articol (`public/og/`).
- **Șablonul paginilor comerciale** suportă acum blocuri (paragraf, listă, pași, tabel, notă), răspuns direct de 40–60 de cuvinte sub H2-urile-întrebare, legături în text, breadcrumb și data actualizării vizibilă.
- **Blogul:** byline vizibil („Echipa ElectroField · Publicat …”), `meta author`, BlogPosting corect, dimensiuni pe toate imaginile, descrieri de 140–155 de caractere și fixuri de accesibilitate.
- **Descrieri noi** pe /programare, /termeni și /confidentialitate.

### Conținut
- **Pagina principală:** rescrisă, cu formulări corecte pentru mobil și offline, FAQ corectat și H1 vizibil imediat.
- **10 pagini comerciale** de 1.500–2.500 de cuvinte fiecare:
  - pe meserii: electrice, gaze, fotovoltaice;
  - pe funcții: pontaj, foaie de parcurs, aplicația tehnicianului, facturare, stoc;
  - ghidul FSM;
  - /despre.

  Fiecare are întrebări în H2 cu răspuns direct, tabel sau pași, o secțiune onestă „Ce nu face (încă)”, 6–8 întrebări frecvente, legături interne și surse oficiale acolo unde e vorba de lege.
- **3 articole noi**, de 3.000–3.700 de cuvinte:
  - model de foaie de parcurs;
  - autorizația ANRE de electrician (grade, acte, examen, tarife, viză);
  - priza de pământ (valori, măsurare).
- **6 articole rescrise, cu aceleași URL-uri:** revizia și verificarea de gaze, PRAM, modelul de proces-verbal, dosarul de prosumator (actualizat la Legea 160/2026 și Ord. ANRE 67/2026), modelul de ofertă, evidența orelor și pontajul.
- **20 de modele gratuite Word/Excel** în `public/blog/modele/`: foaie de parcurs, foaie de pontaj, buletin PRAM, fișa și registrul de măsurători pentru priza de pământ, evidența și checklistul de gaze, ofertă, procese-verbale (recepție, predare-primire, lucrări ascunse), fișă de intervenție, registrul de autorizații ANRE ale echipei, checklist pentru dosarul de prosumator și registrul de termene. Fișierele Excel au formule și s-au recalculat fără erori.
- **Celelalte articole:** afirmațiile exagerate despre produs au fost corectate și s-au adăugat legături în text cu ancore descriptive.
- **Index /blog:** 5 grupe tematice (Electrice/ANRE, Gaze, Fotovoltaice, Echipe-pontaj-mașini, Bani-oferte-documente), plus un bloc „Modele descărcabile”, cu CollectionPage și ItemList în JSON-LD. Blogul are acum 30 de articole.
- **Surse:** afirmațiile legale vin din surse oficiale (anre.ro, legislatie.just.ro, Monitorul Oficial, ANAF, operatori de distribuție). Fiecare articol are la final secțiunea „Surse, verificate la 28 noiembrie 2026”.

### Cum s-a lucrat
- Un flux de 68 de agenți, în 6 etape: pregătire, scriere, integrare, verificare cu 5 recenzori independenți, corecturi și verificare finală.
- La final am rulat eu build-ul și verificarea de SEO.

## A.7 Verificarea: rezultate

**Rezultatul final:**
- `tsc` și toate testele unitare trec.
- Build-ul de producție merge.
- Toate cele 45 de adrese din sitemap: 200, canonical, indexabile, un singur H1, og:image prezent, JSON-LD valid.
- Nu apar `offers`, `price` sau `aggregateRating` și nici nume de concurenți.
- O adresă inexistentă dă 404. Rutele private (/start, /lucrari, /admin, /calendar, /mobil) cer cont.
- Toate cele 20 de modele descărcabile răspund cu 200.
- Toate titlurile au cel mult 60 de caractere și toate descrierile între 140 și 155.

**Recenzorii au găsit 49 de probleme:**

| Recenzor | Probleme |
|---|---|
| build și parcurgere | 3 |
| fapte despre produs | 17 |
| legislație | 8 |
| securitatea rutelor | 4 |
| limbă și SEO | 17 |

Cele mai importante, toate corectate:
- „Raportul PDF conține orele” era fals în ~7 locuri, inclusiv în FAQ-ul paginii principale și în llms.txt.
- Kilometrii și costul pe km din foaia de parcurs nu pot fi introduși în aplicație.
- Gaze: revizia ține locul verificării doar dacă se face în anul în care verificarea era datorată (art. 3² alin. 1–2 din Ord. ANRE 179/2015). Corectat pe pagina de gaze, în articol și în modelul Excel.
- Prosumator: contorul poate fi cumpărat și de prosumator (art. 27). Exemplul din registru era incoerent (8 kW pe ruta pentru peste 10,8 kW) și nu ținea cont de sărbătorile legale.
- ANRE:
  - Măsurătorile le fac doar autorizații de tip B (IIB/IIIB/IVB).
  - Detectorul de gaze se schimbă doar prin firmă autorizată.
  - Cursul de 20 de ore trebuie făcut în cele 12 luni dinaintea cererii de viză, nu raportat la data de azi.
- HG 343/2017: termenul de remediere se poate prelungi cu încă 90 de zile.
- Canibalizare:
  - Articolul „program management firmă instalații” s-a suprapus cu ghidul FSM. A fost reorientat pe „cum testezi un program înainte să semnezi”.
  - Articolul vechi despre autorizații concura cu cel nou. A fost reorientat pe „cine semnează lucrarea și când expiră autorizația”.
  - Ancorele din tot site-ul au fost actualizate.
- Articolul despre e-Factura avea text vechi și nesusținut. A fost rescris din surse oficiale: termenul de 5 zile lucrătoare, amenzile din OUG 120/2021 și schimbarea pentru CNP.
- Mai multe formulări care sugerau o aplicație de iPhone au fost corectate.

**Neverificat, de confirmat:**
- Termenele implicite din baza de date (ATR 15 zile, certificat 10 zile) și intervalele de gaze implicite (24/120 de luni). Sunt valori din baza de date și nu apar în cod.
- Integrările SmartBill și Oblio nu au fost testate pe o firmă reală.
- Normativul I7-2011: nu am găsit copie oficială online, valorile sunt citate din reproduceri neoficiale (articolul spune asta).

## A.8 Ce rămâne de făcut

### Pe site / în produs
1. Merge pe ramura principală, ca modificările să ajungă live.
2. Mai multe articole spun deschis că o sursă oficială nu s-a deschis în ziua verificării. E onest, dar sună a jurnal de lucru, așa că trebuie reformulat.
3. 8–10 articole vechi au doar 450–800 de cuvinte și trebuie extinse sau comasate: gestionare-echipe-de-teren, cum-calculezi-profitul, documente-predare-client, checklist-instalare-fotovoltaic, service-sezonier-centrale, gestiune-materiale, excel-sau-aplicatie, tehnician-vs-administrator, reducere-timpi-deplasare.
4. Dacă proprietarul vrea kilometri reali în foaia de parcurs, trebuie adăugat în produs câmpul km pe lucrare (sau o citire de odometru) și costul pe km în setări.
5. Ancora „aplicația pentru tehnicieni” e folosită de prea multe ori identic. Trebuie variată.
6. Când apar profiluri reale (Google Business, LinkedIn, YouTube, directoare), le trecem în `sameAs`. Când există video, adăugăm VideoObject.
7. Credit DataForSEO epuizat (HTTP 402). Pentru volume și SERP noi trebuie reîncărcat.

### Pentru proprietar, în afara site-ului
Pașii completi sunt în `docs/seo-2026-11/08-plan-actiuni-proprietar.md`:
1. **Google Search Console** (proprietate de tip Domeniu, verificare prin DNS TXT): trimite `https://www.electrofield.ro/sitemap.xml` și cere indexarea celor 10 pagini principale.
2. **Bing Webmaster Tools** (import din GSC) și `npm run seo:indexnow` după fiecare deploy.
3. **Google Business Profile** (verifici întâi dacă ai voie fără sediu de primire clienți), cu aceleași date de contact peste tot.
4. **Listări gratuite:** Capterra/GetApp/Software Advice, SaaSHub, AlternativeTo, SourceForge, Crozdesk, SoftwareSuggest, G2.
5. **Parteneri de facturare:** pagina de integrări Oblio și SmartBill (vreauapi@smartbill.ro).
6. **Presă** (StartupCafe, start-up.ro), asociații și furnizori de cursuri ANRE. E-mailurile sunt gata scrise, cu subiect. Softlead e plătit, deci rămâne pentru mai târziu.
7. **Google Play:** listing pregătit. Pe site scriem „Google Play” doar după ce aplicația e live.
8. **YouTube:** 3–5 videoclipuri, primul pe interogarea principală.
9. **Recenzii reale** de la primele firme pilot (niciodată false).
10. **Ce urmărim în GSC** la 2, 4, 8 și 12 săptămâni.

**Ce se poate aștepta realist:** nimeni nu poate garanta poziții. Site-ul e nou și nu are încă backlinkuri. Primele semnale (impresii pe articole și modele) apar de obicei în câteva săptămâni. O poziție stabilă pe interogarea principală vine în luni, mai ales prin mențiuni externe (punctele 3–8). Pentru AI Overview contează mențiunile în liste și articole ale altora, nu doar site-ul propriu.

## A.9 Paginile după implementare

Lungimea titlului și a descrierii e în caractere. Numărul de cuvinte include meniul și subsolul.

| Pagină | Titlu | Descriere | Cuvinte |
|---|---|---|---|
| / | 59 | 154 | 1.776 |
| /software-management-echipe-teren | 59 | 152 | 2.516 |
| /firme-instalatii-electrice | 45 | 155 | 1.893 |
| /firme-gaze-verificari-revizii | 55 | 154 | 1.935 |
| /firme-fotovoltaice | 55 | 153 | 2.153 |
| /pontaj-tehnicieni | 49 | 154 | 1.682 |
| /foaie-de-parcurs-electronica | 51 | 155 | 1.944 |
| /aplicatie-tehnician | 54 | 155 | 1.730 |
| /facturare-smartbill-oblio | 46 | 148 | 1.550 |
| /stoc-materiale-pe-masini | 57 | 148 | 1.693 |
| /despre | 53 | 154 | 1.488 |
| /blog | 59 | 152 | 1.761 |
| /blog/autorizatie-anre-electrician | 57 | 148 | 3.632 |
| /blog/dosar-prosumator-etape-termene-atr | 48 | 151 | 3.672 |
| /blog/model-oferta-lucrari-electrice-fotovoltaice | 59 | 153 | 3.406 |
| /blog/model-proces-verbal-raport-lucrare | 55 | 146 | 3.330 |
| /blog/evidenta-orelor-tehnicieni-teren-pontaj | 55 | 153 | 3.180 |
| /blog/model-foaie-de-parcurs | 57 | 150 | 3.101 |
| /blog/priza-de-pamant-valori-masurare | 57 | 148 | 2.975 |
| /blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate | 58 | 148 | 2.957 |
| /blog/verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti | 54 | 154 | 2.653 |
| /blog/fisa-evidenta-verificare-revizie-gaze-scadentar | 58 | 155 | 2.318 |

Măsurătorile sunt făcute înainte de ultimele corecturi de descriere, care au adus /programare, /termeni și /confidentialitate în intervalul 140–155.

## A.10 Concurenții, pe scurt (doar pentru analiză internă, nu pentru site)

| Concurent | Poziționare | Preț public | Observații |
|---|---|---|---|
| GoManager | „Program de management pentru echipe din teren” | da (planuri în euro, 14 zile probă) | CRM, oferte + e-Factura, proiecte, ticketing, pontaj; pagină pentru electricieni; studii de caz marcate ca ilustrative |
| Electrogest | program de devize și costuri pentru instalații | da (1.000 lei/lună) | devize din Excel/PDF cu AI; singurul concurent direct pe electricieni, dar pe partea de ofertare și costuri, nu pe teren |
| Aktio | „Software field service (FSM)” | da (pe utilizator, 15 zile probă) | offline, formulare, import Excel; are pagina „vs hârtie și Excel” |
| WorkApp | „Software Echipe Teren” / timesheets | neclar: un raport a găsit ~6 €/utilizator, altul niciun preț; probă 14 zile | pagină subțire, fără FAQ; are pagini „vs” cu produse străine |
| CrewHub | platformă de management al echipelor | neclar: un raport a găsit 105–545 lei, altul niciun preț; probă 14 zile | generic; CRM cu pipeline și oferte; rating fără sursă |
| Om Pe Teren | „Aplicație pentru firme cu echipe de teren” | da (pe firmă) | singurul cu o pagină de fotovoltaic și mențiuni ANRE (remindere) |
| Zarina CRM | CRM complet, licență definitivă | da (licență) | secțiune bună „pentru cine nu este potrivit” |
| Softimpera | agenție software din Cluj, cu pagină FSM și video | — | citat în AI Overview |

Lacuna comună: niciunul nu leagă autorizațiile ANRE, PRAM, scadențarul de gaze (Ord. 179/2015), dosarul fotovoltaic cu termene și foaia de parcurs, și niciunul nu are modele descărcabile pentru aceste documente. Acesta e unghiul ElectroField.

---

# PARTEA B. ANEXE: RAPOARTELE DE CERCETARE COMPLETE

Sunt scrise înainte de implementare. Notă de citire:
- Recomandările despre prețuri publice, pagina /preturi, `Offer` în JSON-LD și paginile „vs” sau „alternativa la” cu nume de concurenți au fost **respinse** de proprietar (A.3).
- Marcajele [V] înseamnă verificat, [N] neverificat, [U] dedus.



---

## B.1 Raport R1a-competitors

### R1a - Competitor teardown A: Electrogest, GoManager, WorkApp, CrewHub
Checked: 28 Nov 2026. Method: curl + WebFetch on public pages, sitemaps, JSON-LD. "V" = verified (fetched, URL given). "U" = unverified/inferred.
Limits: WebSearch is US-only and returned almost nothing about these brands, so third-party mentions are thin (stated honestly below). No Google.ro SERP access in this phase. DataForSEO not used.
Raw HTML saved in .../research/raw/.
Note: docs/seo-2026-11/07-concurenti.md mentions none of these four (grep count 0) - confirmed gap.

---------------------------------------------------------------------
#### 1. ELECTROGEST (electrogest.ro)
**Target:** ONLY electrical installation firms, 5-50 people (V, https://electrogest.ro/ "firme de instalații electrice ... de regulă cu 5–50 de oameni").
**Company (V, JSON-LD + /despre):** S.C. Electrogest Project S.R.L., CUI 55314400, Reg. Com. J2026046674001 (the "J2026" prefix = registered in 2026; inference U that firm is <1 year old), Glina, Ilfov. iOS app published by COLIBRISOFT S.R.L. (App Store page) - a different legal entity, so likely a dev partner/sister firm (U).
**Homepage:** title "Program devize și gestiune lucrări instalații | Electrogest" (V). Meta: "Software de ofertare și gestiune a lucrărilor pentru instalații electrice: deviz, achiziții, pontaj mobil, e-Factura și bugetul la zi. Cere un demo." H1 "Program de devize și costuri pentru instalații". H2: "De la cererea beneficiarului la factură, pe aceeași lucrare" / "Pentru firme de instalații care lucrează pe mai multe șantiere" / "Oferta, bugetul și costurile lucrării, în același loc" / "Pontajul, de pe telefon" / "Înainte de demonstrație" / "Aplicația mobilă".
**JSON-LD (V home):** Organization, PostalAddress, WebSite, SoftwareApplication, Offer, UnitPriceSpecification, FAQPage (5 Q).
**Sitemap (V https://electrogest.ro/sitemap.xml):** 14 URLs: home; 5 money pages (program-devize-instalatii-electrice, functionalitati, profitabilitate-proiecte, costuri-proiecte, erp-firme-instalatii); 2 resource pages (erp-vs-excel, efactura); about/contact; 4 legal/account-deletion. lastmod 2026-11-10 (contact 2026-05-23, i.e. site existed in May 2026). NO blog, NO case studies, NO testimonials, NO "alternative" pages. Each page ~700-1000 words (WebFetch estimate, U).
**Page titles (V via WebFetch):** "Program devize instalații electrice, din Excel | Electrogest"; "Software gestiune pentru firme de instalații | Electrogest"; "e-Factura și facturi furnizori pe lucrare | Electrogest". H1s: "Program de devize pentru instalații electrice", "Software de gestiune pentru firme de instalații", "e-Factura conectată la costurile fiecărei lucrări".
**Keywords targeted:** program devize (instalații electrice), software gestiune firme instalații, ERP firme instalații, e-Factura pe lucrare, costuri/profitabilitate proiecte. Does NOT target "echipe teren/mobile", "pontaj online", or ANRE.
**Pricing (V):** 1.000 RON/lună, "fără limite", RO e-Factura inclusă (home, /despre, FAQ). Activation only via demo ("La demonstrație îți spunem cum se activează"). No trial. No VAT statement found.
**Features claimed (V):** Excel/PDF request import + AI assistant proposes devize lines; offer PDF/Excel; budget vs real cost with "Buget depășit" alert; supplier RFQs/orders/receptions; supplier invoices incl. imported from SPV allocated per job; situații de lucrări -> invoice -> SPV status; mobile pontaj (hours per project, calendar, leave balance); roles (admin, estimator, PM/purchaser, invoicing, electrician). NOT claimed anywhere fetched: GPS, offline, e-signature, stock/inventory, ANRE docs, gas, PV, SmartBill/Oblio.
**Mobile apps (V):** Play https://play.google.com/store/apps/details?id=app.electrogest.mobile ("Electrogest Mobile"); App Store https://apps.apple.com/ro/app/electrogest-mobile/id6795530421 (COLIBRISOFT S.R.L.). Ratings/installs not extractable.
**Anti-bot:** electrogest.ro serves a JS "One moment, please..." challenge to curl on most pages (Cloudflare-style); Googlebot likely allowed. Irrelevant for us except it blocks simple scrapers.
**Third-party mentions:** none found (U - weak search tool). Google AI Overview cites electrogest.ro as a source (user's observation).
**Why it ranks for the query:** exact semantic match "electricieni + instalații + devize + pontaj mobil + e-Factura"; homepage title says "Program ... gestiune lucrări instalații"; SoftwareApplication+Offer+FAQ schema (rich, parseable facts for AI Overview); clean niche focus; apps in both stores; transparent single price. Small domain but extremely tight topical match, so it beats broader/older sites. Also the only one of the four that is electrician-only.
**To beat it:** (1) Match its entity clarity: one-sentence definition "ElectroField este un software ... pentru firme de electrice, gaze și fotovoltaice cu echipe pe teren" in H1/meta/JSON-LD/FAQ. (2) Win on what it lacks: field-team side (GPS/offline/e-signature/foaie de parcurs), ANRE/PRAM/gaze/PV documents, stock, public pricing + free trial (Electrogest = demo only, 1.000 RON flat, a high wall for 3-10 person firms). (3) Publish content it has none of: blog, comparison pages, templates. (4) Add SoftwareApplication+Offer+FAQPage JSON-LD and store links.

---------------------------------------------------------------------
#### 2. GOMANAGER (gomanager.ro)
**Target:** broad field-service SMEs: security systems, maintenance/installations, electricians & automation, IT/IoT, HVAC, cleaning (V /industrii). Has a dedicated electricians landing page.
**Company (V /despre-noi, footer):** Algo MediaSOFT (Rădăuți, Suceava), "20 de ani" in security/IT/IoT, own data center; GoManager started as internal tool. Home claims "150+ firme folosesc GoManager" and "zeci de mii de facturi" (self-reported, U). Footer © 2026; GoodFirms lists Algo MediaSOFT incl. GoManager (V via search: https://www.goodfirms.co/company/algo-mediasoft-srl).
**Homepage (V):** title "Program de management pentru echipe din teren | GoManager"; meta "Digitalizează-ți afacerea cu GoManager: facturare e-Factura SPV, CRM, management echipe pe teren și arhivă digitală într-o singură aplicație românească."; H1 "Lucrarea se închide azi. Factura pleacă tot azi."; H2 incl. "Făcut pentru firme care lucrează la client", "Cum se aplică GoManager pe industrii", "Cât costă pentru echipa ta", FAQ (8 Q, answers keyed to pain-point queries e.g. "M-am săturat de Excel-uri și hârtii!").
**Key pages:** /industrii/electricieni - title "Program pentru electricieni și automatizări | GoManager", H1 "Soft de management pentru electricieni și firme de automatizări" (V). /module/devize - "Program de devize și e-Factura pe mobil | GoManager". /pret - "Preț GoManager - Abonamente de la 9.95€/lună".
**JSON-LD (V):** SoftwareApplication+AggregateOffer, Organization x3, ContactPoint, WebSite, FAQPage (home); BreadcrumbList (industry pages); Product/Offer x3 (pricing).
**Sitemap (V https://www.gomanager.ro/sitemap-0.xml):** 36 URLs: 13 blog, 1 help article, 10 module pages (contacte, crm, devize, dispecerizare, documente, hr, incasari, planificare, semnatura-documente, ticketing), 4 industry pages, 4 case-study pages + index, pricing, about, contact, home.
**Blog (V, 13 posts, targeting field-service long tails):** "Software pentru firme de mentenanță și instalații: cum alegi fără să regreți" (8-criteria listicle), "Pontaj digital cu geolocație pentru echipe din teren", "Fișa de intervenție digitală cu semnătură electronică", "Aplicație de dispecerat pentru echipe din teren", "Program facturare e-Factura pentru firme de servicii", "Marja pe lucrare", "Pontaj sau ore facturabile?", "Mentenanță preventivă și reviziile periodice", "Documentația de recepție: de ce clientul nu semnează procesul-verbal", plus 4 generic management essays. Note overlap with Ads-volume terms: program facturare (590), pontaj online (110), fișă de intervenție (20), proces verbal recepție (90).
**Pricing (V https://www.gomanager.ro/pret, JSON-LD EUR, priceValidUntil 2027-12-31):** Esențial 9.95 EUR/lună (2 users, 100 invoices/mo, 15 GB); Profesional 19.95 EUR (10 users, 500 inv., 200 GB); Premium 39.95 EUR (30 users, 1.000 inv., 500 GB); extra user 1.95 EUR/lună; annual = 2 months free. All features in all plans. 14-day free trial, no card. VAT status not stated (U). Home calculator: 5 users = 15.80 EUR/lună.
**Features claimed (V):** CRM/contacte, devize generated on mobile from product catalog, client e-signature of deviz and proces-verbal, e-Factura SPV, stock & inventory, pontaj & concedii (HR), planning drag-and-drop, GPS/map of teams (module page), dispatch, ticketing, document archive, Google integration, Excel/CSV import-export. NOT found: offline mode, ANRE/PRAM/gaze/PV-specific documents, SmartBill/Oblio, native app-store links (no Play/App Store URL found on home/module/industry pages - "devize pe mobil" implies PWA/web-mobile, U).
**Case studies (V):** 4 pages, but the electricians one explicitly says "Exemplu ilustrativ ... nu este citatul sau cifrele măsurate ale unui client anume" - i.e. no real named customers. Honest label, but weak social proof.
**Reviews:** none found on third-party sites (U).
**Why it ranks:** title literally "Program de management pentru echipe din teren" (exact-match head term), 36 indexable pages, rich schema, industry+module+blog+case-study architecture, 13 blog posts, public low price, 20-year-old company entity, directory listing (GoodFirms). Likely the strongest topical authority of the four.
**To beat it:** do not fight head-term breadth; go deeper in electric/gas/PV (ANRE, PRAM, instalații gaze, dosar prosumator documents that GoManager lacks), publish honest comparison vs GoManager, ship real named case studies (they have none), native apps + offline (they show neither), and equal-or-better public pricing. Mirror its strengths: pricing page with Product/Offer schema, per-module and per-industry pages, 10+ blog posts on pontaj/fișă intervenție/proces verbal/foaie de parcurs.

---------------------------------------------------------------------
#### 3. WORKAPP (workapp.ro)
**Target:** 3-300 employee firms: HVAC, electrical (CAEN 4321 page), plumbing, construction, maintenance, security, cleaning, auto service. English+Romanian.
**Company (V):** PODINA SMART TECH SRL, Tămaia, Maramureș, CIF RO28389383. Story via SaaSHub snippet (search tool, U): born as internal software at Optix Security (3 crews). Site has a case study "studiu-de-caz-optix-security-system" (URL in sitemap, V; not read).
**Tech/SEO risk (V):** React SPA; curl returns a shell plus a `<noscript>` block; WebFetch (renders) sees full content. Title tag of home: "WorkApp - Software Echipe Teren · Employee Task Management"; meta: "WorkApp.ro este platforma completă pentru gestionarea echipelor din teren: rapoarte zilnice, pontaj digital, profitabilitate per client și control costuri în timp real. Testează gratuit 14 zile." H1 "WorkApp — Software pentru Gestionarea Echipelor din Teren" (noscript). No JSON-LD found in raw HTML (V negative).
**Sitemap (V https://workapp.ro/api/sitemap.xml via index):** 65 URLs: home, ~10 landing pages incl. RO/EN pairs - /pontaj-digital-echipe-mobile, /firme-instalatii-electrice (title "Aplicație Management Echipe pentru Firme Instalații Electrice (CAEN 4321) | WorkApp"), /firme-instalatii, /firme-securitate, /firme-constructii; ~48 blog posts (mostly English: "workapp-vs-monday", "-vs-trello", "-vs-servicetitan", "-vs-papervee", "-vs-clockify", "-vs-iflow", "monday-alternatives", "best-field-service-management-software", "electrical-contractor-software", "daily-work-report-template", templates for schedule/job tracking/service checklist; a few Romanian: "cum-sa-gestionezi-echipe-teren", "raport-activitate-santier-zilnic", "digitalizare-companii-servicii", "aplicatii-pentru-constructii..."), tutorial, partners, legal. Blog sample thin: electrical-contractor-software dated 2026-03-22, ~220 words body (V WebFetch). Heavy programmatic/AI-style volume, thin per page (U on method).
**Pricing (V):** 6 EUR + VAT per user/month (home noscript, /pontaj-digital-echipe-mobile, blog). 14 days free, no card; 30-day refund promise on the electrical page.
**Features claimed (V):** daily reports with photos, timer, optional GPS; pontaj per Codul Muncii (overtime 75%); weekly dashboard (margin per client); PDF/Excel export; native FGO integration for e-Factura (NOT SmartBill/Oblio, NOT direct SPV); estimate library for electrical jobs with markup; crew rotation/leave approvals; mentions ANRE only as a topic (branșament authorization, PV "dosar ANRE"), not as generated documents (U). Offline: not stated (FAQ answer blank on fetched render). No app-store links found.
**Third-party mentions:** SaaSHub listing https://www.saashub.com/workapp-ro (seen in search; page itself 403 to fetch). No press/listicles found.
**Why it ranks:** anchor page title contains "Software Echipe Teren", RO+EN content volume (65 URLs), explicit electrical landing page with CAEN 4321, comparison pages, SaaSHub listing; also user's SERP shows a workapp.ro result titled "WorkApp — Digital Timesheets & Field Service Management" (a second title variant - Google rewrote or there are two versions).
**To beat it:** produce Romanian-first, deeper pages (their blog is mostly English, thin); real ANRE/PRAM/gaze/PV documents; direct SPV or SmartBill/Oblio integration if ElectroField has it; native apps with offline; per-user price transparency (6 EUR is cheap, so compete on trade-specific depth not price). Their electrical page FAQ answers are blank in render - a weakness.

---------------------------------------------------------------------
#### 4. CREWHUB (crewhub.ro)
**Target:** generic service firms: cleaning, HVAC, sanitary plumbing, electricians (one tile, no depth), landscaping, mobile auto service, facility mgmt, handyman (V home).
**Company (V footer):** © 2026 AIT Interface Consultancy; contact@crewhub.ro, +40 786 984 059, location only "România". No legal details found beyond that. Name collision: an unrelated Canadian CrewHub (crew-hub.ca) exists (search result, U).
**Homepage (V https://www.crewhub.ro/):** title "CrewHub - Software Management Echipe Servicii | Programare Lucrători & Profitabilitate"; H1 "Platforma Completă pentru Managementul Echipelor"; H2: "Exact ce primești cu CrewHub", "Soluții pentru Orice Industrie", "Vedeți CrewHub în acțiune", "Rezultate reale...", FAQ.
**JSON-LD (V):** Organization, ImageObject, SoftwareApplication (featureList, 3 Offers), AggregateRating (4.9/5, ratingCount 127), WebSite, WebPage+SpeakableSpecification, FAQPage. **The 4.9/127 rating is self-declared with no visible reviews or source - treat as unverified/possibly unsupported; do not copy this tactic (Google rich-result policy risk).** Also claims "99.9% uptime", "ROI garantat", "5h/zi economisit", "99.9% satisfacție" (unsubstantiated, U).
**Pricing (V JSON-LD; the visible pricing section is rendered client-side, only "275-550 RON economii" text seen in HTML):** Starter 105 RON/lună (1-3 persoane), Profesional 270 RON (4-10), Expert 545 RON (10-20). VAT not stated. 14-day trial, no card.
**Features claimed (V):** scheduling with conflict detection, jobs/recurring, client DB with geocoding, photos/documents, CRM+offers+pipeline, profit per job, KPI dashboard, PDF/Excel export, leave requests, materials per job, iOS/Android app "100% offline"/"offline-first", GPS tracking (featureList). NOT claimed: devize, e-Factura/SPV, pontaj as such (home mentions "Rapoarte & Pontaje" demo tab only), ANRE, stock, e-signature. No store links found.
**Sitemap (V https://www.crewhub.ro/sitemap.xml):** 9 anchor/#fragment entries (non-indexable duplicates of home) + home, /blog, /despre + 14 blog posts. Blog dates: Jan 2025 (V blog index "12 ianuarie 2025"; 15 ian, 18 ian...). Topics generic: cleaning, HVAC, DDD, security guard, landscaping, costs, Excel vs software, WhatsApp vs app, "ghid digitalizare firma instalatii" (title "Ghid Complet pentru Digitalizarea Firmei de Instalații"). Dated oddly: sitemap lastmod 2026-05-21 for site, blog 2025.
**Technical flaw (V):** sitemap lists apex `https://crewhub.ro/blog/...` which returns 404; only `www.` works (apex home 301s to www). All 14 blog URLs in the sitemap therefore point at 404s. Canonical/sitemap host mismatch will hurt its blog indexing.
**Third-party mentions:** none found (U).
**Why it ranks:** exact title phrase "Software Management Echipe" + "Servicii", Organization/SoftwareApplication/FAQ/Speakable schema, long keyword-rich meta, very low competition on the long phrase. It is the weakest of the four on product-fit (nothing electrician-specific, no devize/e-Factura).
**To beat it:** easy. Be explicitly electrician/gas/PV-specific; add real proof; fix nothing needed on our side except having real content. Do not imitate its fake-looking rating/ROI claims.

---------------------------------------------------------------------
#### 5. CROSS-CUTTING FINDINGS
1. Nobody owns the "instalații electrice + gaze + fotovoltaic + ANRE" documentary layer (PRAM/proces-verbal/fișă intervenție/foaie de parcurs/dosar prosumator). Those are exactly the Ads-volume terms (revizie gaze 720, verificare PRAM 590, model proces verbal 590, dosar prosumator 260, foaie de parcurs 1.600). None of the four have pages for them (V from sitemaps; GoManager nearest with proces-verbal recepție and fișă de intervenție posts).
2. Electrogest is the only direct electrician competitor; GoManager the only one with a dedicated electrician page + big architecture; WorkApp has volume; CrewHub is generic.
3. Nobody publishes verifiable customer proof: GoManager's case studies are labeled illustrative, CrewHub's rating is unsourced, WorkApp's single case study (Optix, its own origin firm). Real named references = differentiator.
4. Nobody has a visible "alternative to X" page except WorkApp (vs Monday/Trello/ServiceTitan/Papervee/Clockify/iFlow), none in Romanian vs these Romanian rivals. A factual "ElectroField vs GoManager/Electrogest/WorkApp/CrewHub" page is an open slot, also useful for AI Overview citation.
5. All four use Product/SoftwareApplication+Offer+FAQ schema except WorkApp (none found). Adding it is table stakes.
6. Public pricing spread: CrewHub 105-545 RON; WorkApp 6 EUR/user; GoManager 9.95-39.95 EUR flat plans; Electrogest 1.000 RON flat. Set ElectroField's price visibly and justify vs these.
7. Third-party signals are thin for everyone (GoodFirms for Algo MediaSOFT, SaaSHub for WorkApp). Cheap wins for ElectroField: listings on SaaSHub, GoodFirms, Capterra/GetApp RO, Google Business Profile, Play/App Store pages, Softimpera-style listicle outreach.

---------------------------------------------------------------------
#### 6. ACTION LIST (priority)
1. Homepage title/H1/meta containing "program/software management echipe teren" + "electricieni, gaze, fotovoltaic" (query phrase) and a plain-language entity definition sentence (copy Electrogest's pattern).
2. SoftwareApplication + Offer + FAQPage + Organization JSON-LD with real price; no AggregateRating until real reviews exist.
3. Public /preturi page, free trial CTA (beats Electrogest demo-only).
4. Dedicated pages: /electricieni, /gaze, /fotovoltaic, /pontaj-echipe-teren, /devize-instalatii-electrice, /e-factura-instalatii; plus doc-template pages for PRAM, proces-verbal, foaie de parcurs, fișă intervenție, dosar prosumator (all quantifiable demand, nobody else covers).
5. Comparison page "ElectroField vs GoManager, Electrogest, WorkApp, CrewHub" using only the table below, with date checked and "verifică la sursă" note.
6. Real, named case studies and testimonials (permission needed); do not copy illustrative ones.
7. Store badges + Play/App Store links on site; mention offline only if truly supported.
8. Directory/listing submissions (SaaSHub, GoodFirms, Capterra/GetApp, Google Business Profile) and 1-2 listicle outreach targets (Softimpera).
9. Blog in Romanian, 10+ posts on GoManager-style long tails but electrician-specific.

---------------------------------------------------------------------
#### 7. FACTUAL COMPARISON TABLE (competitors only; date checked 2026-11-28)
Legend: Da = stated on vendor page; Nu menționat = not found on pages we read (not proof of absence). ElectroField row must be filled from product owner (not verified here).

| Criteriu | Electrogest | GoManager | WorkApp | CrewHub |
|---|---|---|---|---|
| Preț public | 1.000 RON/lună, fără limite (electrogest.ro/) | 9,95 / 19,95 / 39,95 EUR/lună, utilizator extra 1,95 EUR (gomanager.ro/pret) | 6 EUR + TVA /utilizator/lună (workapp.ro/pontaj-digital-echipe-mobile) | 105 / 270 / 545 RON/lună după nr. persoane (date structurate pe crewhub.ro; TVA nespecificat) |
| Trial gratuit | Nu (doar demo) | Da, 14 zile, fără card | Da, 14 zile, fără card | Da, 14 zile, fără card |
| Focus | Doar electricieni/instalații | Servicii tehnice generale, pagină pentru electricieni | Servicii generale, pagină electricieni (CAEN 4321) | Servicii generale (curățenie, HVAC etc.) |
| Devize/oferte | Da (import Excel, asistent AI) | Da (pe mobil, din catalog) | Da (bibliotecă devize electrice) | Oferte în modul CRM; devize nementionate |
| Pontaj | Da (mobil, pe proiect) | Da (pontaj și concedii) | Da (Codul Muncii, ore suplimentare) | Pontaje/rapoarte menționate, detalii limitate |
| GPS | Nu menționat | Da (hartă echipe) | Opțional în rapoarte | Da (GPS tracking, geocodare adrese) |
| Offline | Nu menționat | Nu menționat | Nu menționat | Da (declarat "offline-first") |
| Semnătură electronică client | Nu menționat | Da | Nu menționat | Nu menționat |
| e-Factura/SPV | Da, inclusă, primite+emise | Da, SPV direct | Da, prin integrare FGO | Nu menționat |
| Stoc | Nu menționat (achiziții/comenzi da) | Da | Nu menționat | Materiale pe lucrare |
| Documente ANRE/PRAM/gaze/PV | Nu menționat | Nu menționat | Doar ca subiect (ANRE/PV) | Nu menționat |
| Aplicații mobile | Android + iOS (linkuri în site) | Fără linkuri de magazin găsite | Fără linkuri găsite | iOS/Android declarate, fără linkuri |
| Studii de caz | Nu | 4 ilustrative (declarate ca atare) | 1 (Optix Security) | Nu |
| Blog | Nu | 13 articole | ~48 articole (majoritar EN) | 14 articole (ian. 2025) |

Sources: https://electrogest.ro/ ; https://electrogest.ro/despre ; https://www.gomanager.ro/pret ; https://www.gomanager.ro/industrii/electricieni ; https://www.gomanager.ro/module/devize ; https://workapp.ro/ ; https://workapp.ro/firme-instalatii-electrice ; https://workapp.ro/pontaj-digital-echipe-mobile ; https://www.crewhub.ro/ ; https://www.crewhub.ro/despre
Caution for publishing: use "nu menționat pe site-ul lor la data verificării" rather than "nu are"; link each source; re-check monthly; get legal-style neutrality (no disparagement, no unverifiable claims).

#### 8. Gaps in this research
- Electrogest subpages beyond the 4 fetched via WebFetch (functionalitati, costuri-proiecte, profitabilitate-proiecte, erp-vs-excel) not read; meta descriptions of subpages not returned by WebFetch.
- WorkApp blog quality sampled on one post; Optix case study unread; Play/App Store listing unchecked.
- GoManager mobile delivery (PWA vs app) unconfirmed.
- No backlink data (credit exhausted); no SERP position data; no review-site data beyond what search surfaced.


---

## B.2 Raport R1b-competitors

### R1b - Competitor teardown part B (checked 2026-11-28)
Method: curl with browser UA on public pages (verified = fetched by me; raw HTML saved in this folder). WebSearch is US-only and returned almost nothing for Romanian queries, so "AI Overview sources" section is inference, marked as such. electrogest.ro, zarinacrm.ro/recenzii and tiscontrol-type pages were behind a bot challenge or irrelevant (tiscontrol.com = smart-home vendor, NOT an FSM competitor; verified title "Smart Home Automation").

#### 1. Aktio - https://www.aktio.ro (Next.js; product by "casprsoft.com"; app.aktio.ro; Android app id caspr.app; also aktio.app exists in search results, unverified)
- Title: "Aktio | Software field service (FSM) pentru echipe de teren"
- Meta: "Software romanesc de field service management (FSM): fise de interventie, task-uri si rapoarte PDF pe telefon, online si offline. De la 15 EUR/utilizator/luna."
- H1: "Software field service management (FSM) Vezi tot ce se intampla pe teren."
- H2s (home): Lucrarile din teren nu mai trebuie sa se piarda pe drum; Incepi sa lucrezi cu Aktio de maine; Ce castigi; Rapoarte PDF gata de trimis la client; Software pentru industria ta; Securitatea datelor; Preturi transparente; Cum functioneaza trial-ul; FAQ.
- JSON-LD (home): Organization, WebSite, SoftwareApplication+Offer/AggregateOffer, FAQPage. Blog posts: BlogPosting + BreadcrumbList. 1472 words on home.
- Pricing (https://www.aktio.ro/preturi, verified): Starter 15 EUR/user/luna (max 5 users); Professional 27 EUR (0-5 users) / 25 (5-15) / 23 EUR (15+); Enterprise custom. -10% la 6 luni, -20% la 12 luni; "-20% Early Access". Trial 15 zile (home/pricing say 15; a search snippet said 14 - inconsistent, use 15). Services: training online 50 EUR/ora, on-site 300 EUR/vizita + 1 EUR/km, setup sablon 100 EUR/sablon, dezvoltari 80 EUR/ora + estimare.
- Features (verified on home): fise de interventie, formulare proprii (Template Builder), poze, semnatura client, offline, rapoarte PDF cu logo, harta cu pozitia echipei (GPS optional, cu acordul operatorului), gestiune materiale si consum, notificari, import Excel, API/export pentru ERP/contabilitate. NOT found on site: SmartBill/e-Factura, ANRE, gaze/fotovoltaic specific, pontaj, devize/oferte, stoc (grep = 0). Mobile: Android only (Play: caspr.app); no iOS mentioned. 
- Targets: 8 industries (service/mentenanta, constructii, facility, calitate, logistica, retail audit, SSM, evenimente) - horizontal, not electricians. Service page lists "HVAC, instalatii, electric, lifturi, PSI, IT" in meta/body.
- Content: sitemap = 34 URLs: /field-service-management, /software-activitati-de-teren, /functionalitati, /preturi, 8 /solutii/*, 8 /modele/* (free PDF templates: fisa interventie, bon de lucru, jurnal santier, ...), /aktio-vs-hartie-excel-whatsapp (comparison vs paper), blog with 5 posts (e.g. /blog/software-instalatori-hvac-centrale-gaze dated 10 Oct 2026, 881 words). No "alternative to X" competitor pages. No testimonials seen on home (only trust/GDPR). Demo: 30 min booking + self-serve trial.
- Third party: LinkedIn showcase page; Google Play. No press found.

#### 2. Om Pe Teren - https://www.ompeteren.ro (omperteren.ro does NOT resolve; correct domain is ompeteren.ro)
- Title: "Om Pe Teren - Aplicatie pentru firme cu echipe de teren"
- Meta: "Om Pe Teren e aplicatia in care firmele cu echipe de teren tin clientii, programeaza lucrarile si urmaresc incasarile. In romana, cu toate locurile incluse."
- H1: "Clientii, echipele si lucrarile firmei tale, intr-o singura aplicatie". H2s: Ce faci de la prima cerere pana la incasare; Trei locuri unde se pot pierde banii; Fereastra ASO a inceput cu Start...; Vezi aplicatia explicata in 7 minute; Alegi problema pe care o rezolvi prima; Cum incepem; Ce iti garantam; Intrebari frecvente.
- JSON-LD: Organization, WebSite, SoftwareApplication + 3 Offer, FAQPage (home). Sub-pages (fotovoltaic, software-echipe-teren) have NO JSON-LD.
- Pricing (home, verified): Start 140 lei/luna + 1.500 lei pornire; Standard 280 lei/luna + 3.000 lei; Complet 490 lei/luna + 6.000 lei; TVA extra; toate locurile incluse (fara tarif pe user); plata anuala = 3 luni gratis; 14 zile demo cu toate functiile (nu se cumpara online); "banii inapoi 100%" in primele 3 luni la plata anuala.
- Features: Start = recepție/CRM prospecti + lista de sunat zilnica, oferte pe link/portal client, contracte. Standard = programare lucrari, calendar echipe, tehnicianul vede lucrarile pe telefon, semnatura client. Complet = stoc si cumparari materiale, incasari, cereri clienti in aplicatie + WhatsApp, facturare SmartBill (limita lunara), vizite masuratori platite online, "reamintiri pentru verificarile ANRE la gaze" (limita lunara). NOT found: GPS, offline, pontaj, devize, iOS/Android specifics, e-Factura.
- Targets: tamplarie, HVAC, instalatii sanitare & electrice, alarme, renovari, fotovoltaic (dedicated page /fotovoltaic "Software pentru echipe de montaj fotovoltaic", 1270 words; this is the one competitor with a PV landing page).
- Content/SEO: 18 sitemap URLs: /software-echipe-teren, /fotovoltaic, /modul/{follow-up,portal-client,echipe,profitabilitate,materiale,cereri-clienti}, city pages /oras/{cluj-napoca,baia-mare,oradea}, /ghid-digitalizare, /consultatie. No blog. Only one case study: "Fereastra ASO" (tamplarie, own numbers 33/118, +81% apeluri) - not independently verifiable. 7-min YouTube explainer. Phone 0744 398 050. Small, local (Baia Mare) vendor, very new (case data to 23 Nov 2026).
- Why notable: despite tiny size it is cited by AI Overview; its pages are "problem -> package" focused with FAQPage schema and explicit "software echipe teren" URL/H1-ish phrasing.

#### 3. Softimpera - https://www.softimpera.ro (Cluj web agency, 14 yrs) - FSM page https://www.softimpera.ro/servicii/aplicatii-software/fsm-aplicatie-tehnicieni-service
- Home title: "Firma Creare Site Web Cluj Napoca Romania - Dezvoltare Aplicatii Mobile App si Realizare Magazine Online"; no JSON-LD.
- FSM page title: "Dezvoltare Soft FSM Programari Interventii Tehnicieni Service - Aplicatie Management Servicii pe Teren"; H1: "Dezvoltare Aplicatie pentru Management Activitati Servicii pe Teren pentru Tehnicieni - FSM Programari Interventii si Lucrari Tehnice"; H2: "Soft FSM Personalizat nevoilor tale", "Ce poate sa contina platforma pentru Service". 1174 words, no JSON-LD.
- It is CUSTOM DEVELOPMENT, not a SaaS: web app for office + Android/iOS app (Play/App Store), offline, ERP integration, route optimisation, fise de interventie, materials, invoices/receipts, real-time parts stock. No public price, no trial, no electrician/ANRE/gaze content. Exact-match keyword-stuffed title ("Programari Interventii Tehnicieni", "Management Servicii pe Teren") explains why it ranks/gets cited for generic queries. YouTube video "FSM - Soft Aplicatie de Management si Programari Interventii Tehnicieni" exists per task context; I could not fetch YouTube (unverified).

#### 4. Zarina CRM - https://www.zarinacrm.ro (WordPress; Cloudflare-style challenge on some pages, www host works)
- Title: "Soft CRM Romania | Program de Vanzari | Aplicatie CRM"; meta: "Soft CRM romanesc pentru vanzari, fara abonament lunar. Licenta platita o singura data, utilizatori nelimitati, instalat pe gazduirea companiei."; H1: "Soft CRM complet: lead-uri, oferte, facturare, stocuri si service, o singura platforma."; 5586 words home; JSON-LD WebPage, BreadcrumbList, WebSite+SearchAction, Organization, ReadAction.
- Pricing (home + /preturi, verified): one-time licence START 2.490 EUR, PRO 2.990 EUR, BUSINESS 3.990 EUR + TVA, unlimited users, installed on client's hosting, 6 luni garantie; extras not in price listed on /preturi. Grants angle: page about fonduri digitalizare IMM (15.000-200.000 EUR).
- Vertical pages: /crm-constructii/ ("Software constructii: devize, management santier, situatii" - devize pe capitole, pontaj GPS incl. offline, jurnal zilnic foto, semnatura client pe link, e-Factura/SmartBill/Oblio/FGO integrations, "Fisa verificare PV lucrari ascunse", mentions electrice/sanitare/HVAC/fotovoltaice), /crm-servicii/ ("Software mentenanta si interventii": contracte cu revizii automate, dispecerat, aplicatie de teren cu PV semnat si plata pe loc, ISCIR/HVAC), also CRM imobiliare/retail/medical/hoteluri; "Instalatori" appears in the nav but /crm-instalatori/ returns 404 (verified).
- Content: large site (hundreds of URLs: module pages, glosar, academie, blog, studii de caz, "Aparitii in presa", /recenzii-zarina-crm/ (blocked to me)). Strongest SEO muscle of this group but a generic CRM; ANRE/gaze = 0 mentions on constructii page. Demo/test: /testeaza-crm/, "Comanda DEMO".

#### 5. Other Romanian FSM / field software discovered
- Bento FSM (bento.ro) - enterprise FSM; has a dedicated "Bento FSM: Electricity and Gas" page (meters, connections/disconnections, interventions) - aimed at utilities, not SMB installers. No public price. Verified title/meta.
- GoManager (gomanager.ro, Algo MediaSOFT) and WorkApp (workapp.ro) are R1a scope, but facts I saw: GoManager title "Program de management pentru echipe din teren", "150+ firme", e-Factura SPV, CRM, SoftwareApplication+AggregateOffer+FAQPage; WorkApp meta explicitly names "instalatori HVAC, electricieni, firme de mentenanta", 14-zile trial. Electrogest.ro blocked by bot challenge for me.
- Softlead.ro marketplace (verified category pages /aplicatii-software/{servicii,reparatii-si-intretinere,constructii}): lists FieldOS (from 2.500 EUR), KIM for Field Services (from 10.000 EUR), ERP CloudSales dispecerat service, PlanRadar, OkDesk (from 100 EUR), Innoplanner, Smartiera. None of Aktio, Om Pe Teren, Zarina, GoManager, WorkApp, Softimpera appear on those pages (grep=0) - so softlead is a ranking competitor for the SERP, not the AI Overview source.
- Siemens OverIT (siemens.com/ro-ro), SAP, Odoo Field Service, Fieldcode, Synchroteam: enterprise/global, surfaced by WebSearch, irrelevant to SMB electricians.

#### 6. Why the AI Overview lists GoManager/Aktio/Electrogest/WorkApp/Om Pe Teren (INFERENCE - no listicle found)
- I could NOT find any independent Romanian listicle/comparison naming these products (searches for the product combination returned only the vendors' own pages; US-only WebSearch limits this). Per task context, AI Overview cited Softimpera and electrogest.ro, i.e. vendor pages, not third-party articles. So the Overview is most likely synthesized from vendor landing pages whose title/H1/URL literally match the query tokens: "management", "echipe", "teren", "software/program", "electricieni/instalatori", "intervent(ii)", "tehnicieni".
- Verified token matches: GoManager title "Program de management pentru echipe din teren" (+ "electrice" in demo data); WorkApp title "Software Echipe Teren" and meta "instalatori HVAC, electricieni"; Aktio title "Software field service (FSM) pentru echipe de teren" + dedicated posts on instalatori HVAC/gaze, solutii/service-mentenanta listing "electric"; Om Pe Teren title "Aplicatie pentru firme cu echipe de teren" + /software-echipe-teren + /fotovoltaic + "instalatii sanitare & electrice"; Softimpera exact-match "Management Servicii pe Teren ... Programari Interventii Tehnicieni".
- Common success pattern across all: (a) exact-phrase "echipe de teren" in title/H1/URL, (b) SoftwareApplication/Offer + FAQPage JSON-LD with plain-text prices and "de la X" in meta, (c) industry sub-pages, (d) visible pricing. ElectroField's weakness vs them: no "echipe de teren / management" phrase prominence, brand-new domain with 0 backlinks. Recommendation: add pages/titles using "software management echipe de teren electricieni" wording, FAQPage + SoftwareApplication schema with Offer prices, and dedicated pages for gaze (ANRE) + fotovoltaic, where Aktio has none and Om Pe Teren has only light coverage.

#### 7. Gaps/opportunities (verified absences)
- ANRE documents/gaze: only Om Pe Teren mentions it (reminders, Complet plan); Aktio/Zarina/Softimpera 0 mentions. 
- Fotovoltaic: only Om Pe Teren (/fotovoltaic) and Zarina (one list item).
- Nobody has "alternativa la X" / comparison pages; Aktio only has vs paper/Excel.
- Nobody (of this group) shows reviews/third-party mentions; trial lengths 14-15 days; per-seat 15-27 EUR (Aktio) vs flat per-firm 140-490 lei (Om Pe Teren) vs one-time licence 2.490-3.990 EUR (Zarina).

#### 8. Factual comparison table (checked 2026-11-28)
| Product | Price (public) | Model | Trial | Offline | GPS | Client signature | SmartBill/e-Factura | ANRE/gaze | Fotovoltaic page | Mobile | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Aktio | 15 EUR/user/luna (Starter, max 5); 23-27 EUR Professional; Enterprise custom | SaaS per user | 15 zile, no card | Yes | Optional map, 1-60 min | Yes | Not stated (API/export only) | No | No | Android (iOS not stated) | https://www.aktio.ro/preturi , https://www.aktio.ro/ |
| Om Pe Teren | 140 / 280 / 490 lei/luna + 1.500 / 3.000 / 6.000 lei setup, TVA extra | SaaS per firm (no per-seat) | 14 zile demo | Not stated | Not stated | Yes (Standard+) | SmartBill invoicing (Complet, monthly cap) | ANRE gaze reminders (Complet) | Yes /fotovoltaic | Not stated (phone) | https://www.ompeteren.ro/ |
| Softimpera FSM | No public price | Custom development | None | Yes | Route optimisation | Not stated | ERP integration | No | No | Android + iOS | https://www.softimpera.ro/servicii/aplicatii-software/fsm-aplicatie-tehnicieni-service |
| Zarina CRM | 2.490 / 2.990 / 3.990 EUR one-time + TVA | Perpetual licence, self-hosted | Demo on request | Yes (pontaj) | Yes (pontaj GPS) | Yes (PV, devize link) | SmartBill, Oblio, FGO, e-Factura | No | Mention only | Mobile app (CRM) | https://www.zarinacrm.ro/ , /crm-constructii/ |
| Bento FSM | No public price | Enterprise | n/a | Yes | Yes | forms printing | invoicing | Gas/electric meters (utilities) | No | Yes | https://www.bento.ro/en/field-service-management-en/ |
| FieldOS (softlead) | from 2.500 EUR (marketplace) | SaaS | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | https://softlead.ro/aplicatii-software/fieldos.html (via search snippet, unverified date) |

Raw HTML evidence saved alongside in /tmp/claude-0/-home-user-CRM/bf78b7b1-b8bb-53ac-9009-54dcd55acec8/scratchpad/research/ (ak_*.html, x_ompeteren.ro.html, opt_*.html, si_fsm.html, z_*.html, s_*.html).


---

## B.3 Raport R2-offpage-geo

### R2 - Autoritate off-page + GEO pentru ElectroField (28 Nov 2026)

Legenda: [V] verificat (am deschis pagina / fisierul), [N] neverificat (din cautare web sau memorie). WebSearch nu reflecta exact Google.ro.

#### 0. Rezumat
1. Cel mai rapid castig tehnic: linkuri/mentiuni din ecosistemul facturare (SmartBill, Oblio) si 2-3 directoare gratuite (Capterra/GetApp/Software Advice, SourceForge, AlternativeTo, SaaSHub, Crozdesk). Softlead este singurul marketplace romanesc relevant, dar e PLATIT (de la 900 EUR/an).
2. robots.txt NU blocheaza niciun crawler AI [V]: `User-agent: *  Allow: /  Disallow: /api/ , /downloads/`. Am testat si cu User-Agent GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot, OAI-SearchBot: toate 200 pe /software-management-echipe-teren [V]. `/llms.txt` raspunde 307 (redirect, probabil spre login/home), deci nu exista [V]. Nu exista `sameAs` in Organization JSON-LD (am cautat in src/app/page.tsx: doar email/telefon) [V].
3. Pentru AI Overview contează marca si mentiunile externe, nu autopromovarea: studii din industrie arata ca listiclurile proprii sunt citate, dar Google recomanda concurentii in ~69% din cazuri [N, Search Engine Land via WebSearch]. Deci: pagina de comparatie e utila, dar fara mentiuni terte nu va fi recomandata.
4. Afirmatii de verificat inainte de a le pune in directoare: integrarea SmartBill/Oblio (docs/abonamente-si-valoare.md, 2 nov, o numea "in curand"; in cod exista src/app/(app)/setari/invoicing-actions.ts si paginile de marketing o dau "Da"), disponibilitatea pe iPhone (repo contine doar android-app/ Capacitor; paginile spun "Android si iPhone"), pretul (nu e publicat nicaieri pe site; docs spune 299/599 lei fara TVA = "oferta propusa").

#### 1. Unde se poate obtine listare/mentiune/link

##### 1A. Directoare de software (prioritate mare, efort mic)
| # | Loc | Cum | Cost | Link | Prioritate |
|---|-----|-----|------|------|-----------|
| 1 | Capterra / GetApp / Software Advice (acelasi cont vendor, parte din G2) https://www.capterra.com/vendors/ | buton "Get Your Product Listed" [V pagina exista]. O singura inregistrare apare pe cele trei site-uri [N] | listare de baza gratuita, PPC optional [N] | de obicei nofollow/redirect [N] | MARE: sunt printre domeniile cele mai citate de AI pt "best software" [N]. Categorii: Field Service Management, Time Tracking, Work Order |
| 2 | G2 https://www.g2.com (products/new) | cont vendor + pagina produs; curl a primit 403 Cloudflare, deci formularul nu e verificat | gratuit [N] | nofollow [N] | MEDIE-MARE; aduna recenzii |
| 3 | SourceForge Business Software https://sourceforge.net/software/ | cont + "Add product"; 403 la curl [N] | gratuit [N] | nofollow/dofollow nesigur | MEDIE |
| 4 | AlternativeTo https://alternativeto.net | "Add application"; 403 la curl [N]. Se leaga ca alternativa la GoManager, WorkApp, Jobber etc. | gratuit | de obicei nofollow [N] | MEDIE (pagini "alternative la X" apar des in Google si AI) |
| 5 | SaaSHub https://www.saashub.com | "Submit your product"; 403 la curl [N] | gratuit | dofollow pe pagina produsului [N] | MEDIE |
| 6 | Crozdesk https://www.crozdesk.com [V 200] | vendor signup | gratuit baza [N] | nesigur | SCAZUTA-MEDIE |
| 7 | SoftwareSuggest https://www.softwaresuggest.com [V 200] | vendor signup | gratuit baza [N] | nesigur | SCAZUTA |
| 8 | GoodFirms, Product Hunt | GoodFirms 403, Product Hunt 403 [N] | gratuit | PH: link catre site, vizibilitate scurta | SCAZUTA pt piata RO; Product Hunt doar daca se face lansare |
| 9 | Softlead https://softlead.ro | "Listeaza-ti aplicatia" la /companii-software [V]; contact vanzari furnizori prin /contact (formular, tip "Furnizor software") [V]. | Visibility Basic 900 EUR/an; Pro 2.500 EUR/an (poziționare, link direct catre site, lead form); AI Visibility 1.300 EUR/an; advertorial 250 EUR; banner newsletter 400 EUR; toate fara TVA [V pe pagina, 28 nov 2026] | Pro include "link-uri directe catre website" [V] => Basic probabil fara link dofollow [N] | Categorie potrivita: nu exista "Field Service" in lista de 56 de categorii vazute pe prima pagina; cele apropiate: Project management, Monitorizare flota, HR, CRM, Constructii (industrie) [V partial]. DECIZIE: nu acum (cost mare, zero trafic inca). Reevalueaza dupa primii clienti. Apar totusi in AI Overview ca sursa [din brief] |

Nota: nu am gasit capterra.ro/comparasoftware echivalent romanesc; softlead e singurul marketplace RO relevant gasit [V/N].

##### 1B. Parteneri facturare si fiscal
- Oblio https://www.oblio.eu/integrari [V]: pagina listeaza integrari (SPV e-Factura, Saga, WinMentor, Ciel, WooCommerce, eMag, Base, easySales, Make.com etc.) si spune "Toate integrarile cu Oblio sunt gratuite. Contacteaza-ne". Exista pagina API https://www.oblio.eu/api [V]. Nu exista formular public "devino partener"; abordare: email/contact catre Oblio cu cererea de a fi listat la "Integratori"/aplicatii. Link: probabil dofollow normal (pagina proprie) [N]. PRIORITATE MARE (domeniu de autoritate, public tinta = firme mici).
- SmartBill https://www.smartbill.ro/resurse/integrari [V]: listeaza API, eCommerce (Prestashop, Magento, WooCommerce), NETOPIA, contabilitate. Contact pentru API: mailto vreauapi@smartbill.ro [V in sursa paginii api.smartbill.ro / pagina integrari]. Nu am gasit pagina publica de parteneri (/parteneri = 404) [V]. Abordare: email la vreauapi@smartbill.ro prezentand integrarea si cerand listare ca "aplicatie integrata" si, in paralel, articol pe blogul lor. PRIORITATE MARE.
- FGO: nu am cercetat (mentionat in docs ca "in curand"); neverificat.
- ANAF e-Factura: nu am gasit o lista oficiala de "software certificat" pentru aplicatii non-facturare [N]; nu e o cale de link relevanta.
- Blogurile/comunitatile contabililor: articolul existent despre e-Factura B2B (public/blog/e-factura-b2b-2026-...html) e un bun material de "link bait" pt contabili [V fisierul exista]. Contacteaza 3-5 bloguri/grupuri de contabili cu ghidul, fara a cere link explicit.

##### 1C. Directoare de firme / local
| Loc | Verificat | Ce | Nota |
|-----|-----------|----|------|
| Google Business Profile | [V pagina de ajutor] | profil pentru "Software company" cu adresa/serviciu; poate necesita verificare (video/postal) si adresa fizica | NAP identic peste tot. Daca nu exista adresa publica a firmei, vezi ghidul "service-area business" [N] |
| Bing Places https://www.bing.com/forbusiness | [V 200] | import din GBP | rapid, ajuta Bing/Copilot/ChatGPT search [N] |
| listafirme.ro, firme.info | [V 200 homepage] | pagina firmei apare automat din date publice (MFinante); se poate revendica/edita contact [N] | nofollow probabil; valoare = coerenta NAP/entitate |
| Kompass (ro.kompass.com) | aparut in cautare [V rezultat] | profil gratuit/platit [N] | scazut |
| LinkedIn Company Page, Facebook Page, YouTube channel | - | sameAs in schema | OBLIGATORIU pt entitate; adauga URL-urile in JSON-LD Organization `sameAs` |

##### 1D. Asociatii, scoli, furnizori formare (relevant pt electricieni/instalatori)
- ANRE https://anre.ro: autorizatiile electricienilor (Ord. 66/2023 [N via WebSearch]) si listele publice de operatori autorizati; nu e partener de linkuri; foloseste ca sursa de citat in continut. [N]
- PSR - Photovoltaic & Storage Romania (fost RPIA) https://rpia.ro/membership/ [N din cautare; pagina de membership exista in rezultate]: peste 70 membri; contact Office@rpia.ro, +40 731 084 471 [N]; beneficii listate: listare proiecte/ stiri membri pe site. Nu am confirmat daca instalatorii/furnizorii de software pot adera si cu ce taxa. Efort mediu, valoare medie (link + credibilitate in fotovoltaic).
- Asociatia Energia Inteligenta (AEI) [N, din articole]: apare ca organism profesional pe gaze/energie; nu am verificat site, taxe sau contact. De verificat.
- ANIE, AIIR, OAER, ARIES: cautarile NU au confirmat rolul sau datele de contact; nu le trec ca tinte verificate. De cercetat manual (Google "ANIE membri", etc.).
- Scoli/furnizori de curs ANRE: am gasit doar un document UPET (https://www.upet.ro/cursanre/ - tematica examen autorizare electricieni) [N]. Abordare: lista furnizorilor autorizati ANRE de formare, apoi email de colaborare: ghiduri gratuite (model PV de receptie, fisa gaze) pentru cursanti in schimbul unei mentiuni. Efort mare, potential mediu.
- Distribuitori de materiale electrice cu blog (ex. cei din Romania cu bloguri tehnice): nu am verificat nume concrete; de cautat manual. Abordare: ghid gazduit/ citat (calculator tarif ora, checklist PV).

##### 1E. Presa si comunitati
| Loc | Verificat | Cum | Nota |
|-----|-----------|-----|------|
| StartupCafe.ro | [V] redactie@startupcafe.ro; publicitate separata cu tarife; >1 mil. utilizatori unici nov. 2025 (BRAT/SATI, declarat de site) | trimite comunicat/lansare la redactie@ | editorial gratuit nu e garantat; advertorial platit |
| start-up.ro | [V] https://start-up.ro/contact/ exista | formular/contact | idem |
| wall-street.ro, economica.net, ZF, techcafe | [N] | cautare in surse; pagini "advertorial" platit sunt frecvente in RO | doar daca exista o poveste (primul client, studiu) |
| Facebook groups (electricieni, instalatori, fotovoltaic Romania) | [N] nu am putut accesa | participa cu raspunsuri utile + ghidurile din /blog; fara spam; citeste regulile fiecarui grup | dofollow nu conteaza; conteaza mentiuni de brand si trafic |
| Softpedia forum | forum.softpedia.com/topic/1254412-devizerooro/ apare in cautare [V rezultat] | un thread despre "devizeroo.ro" arata ca exista discutii despre softuri de devize | de verificat regulile |
| YouTube | - | canal brand + 3-5 video-uri scurte (demo 2 min pe aplicatia tehnicianului, "cum se completeaza fisa gaze", "PRAM pas cu pas"). Ahrefs: mentiunile in YouTube corelaza cel mai puternic cu vizibilitatea in AI Overview [N, via WebSearch]; In SERP-ul vostru un video Softimpera e deja pe prima pagina | PRIORITATE MARE-MEDIE |

##### 1F. Concurenti noi gasiti in cautare (nu erau in 07-concurenti.md) - doar pentru context [V rezultate]
Zarina CRM Constructii (zarinacrm.ro, modul Devize/profil Instalatii, licenta lifetime), Devizeroo.ro (devize electricieni, gratuit pana la 5 devize, Pro cu logo), Gewiss Projex (proiectare). Nu ajung direct in aceeasi intentie, dar apar la "program devize".

#### 2. Prioritati (impact x efort)
Faza 1 (saptamana 1-2, fara cost): Google Business Profile + Bing Places; canal YouTube + LinkedIn + Facebook Page; `sameAs` in schema; Capterra/GetApp/Software Advice; SourceForge, AlternativeTo, SaaSHub, Crozdesk; email Oblio + email vreauapi@smartbill.ro; StartupCafe/start-up.ro comunicat.
Faza 2 (luna 1-2): PSR/RPIA (verifica eligibilitate), cursuri ANRE, 2-3 bloguri de contabili, primele 3 recenzii reale (cere clientilor pilot; nu inventa recenzii), articol invitat.
Faza 3 (dupa primii clienti): Softlead Basic/AI Visibility daca CAC se justifica; studiu de caz cu client real, apoi PR.

#### 3. GEO (AI Overview / ChatGPT / Perplexity)

##### 3.1 Ce se stie (surse via WebSearch, [N]; directional, esantioane mici)
- Pentru "best X software", sursele citate sunt in mare parte listicluri/roundup-uri (46% din citari software in studiul Lilach Bullock) si pagini de review; companiile scriu 64% dintre roundup-urile citate (Bullock). Search Engine Land/Lily Ray: Google cita paginile "cele mai bune" ale brandului, dar recomanda concurenti in ~69% din cazuri; rezultatul depinde de cat de stabilit e brandul.
- Ahrefs: doar 38% din paginile citate sunt in top 10 pentru aceeasi interogare (query fan-out); mentiunile in YouTube corelaza puternic. Position Digital: sursele se schimba pentru 52% din cuvintele-cheie la repetarea cautarii (volatilitate).
- Consecinta pentru ElectroField: AI Overview-ul din piata voastra a recomandat GoManager, Aktio, Electrogest, WorkApp, Om Pe Teren din surse terte (Softimpera, electrogest.ro). Trebuie sa intrati in acele liste (articole terte "cele mai bune programe") si sa aveti entitate clara.

##### 3.2 Recomandari on-site
1. Pagina fapte despre entitate (/despre sau sectiune pe homepage): denumire juridica, CUI, adresa, email contact@electrofield.ro, telefon +40750425670 (din src/app/page.tsx [V]), an lansare, domenii (electrice, gaze, fotovoltaice), platforme. Aceleasi date pe toate directoarele.
2. Preturi publice: acum nu exista nicio pagina de pret [V - grep fara rezultate]. LLM-urile si comparatorii favorizeaza paginile cu pret. Publica 299 / 599 lei/luna fara TVA doar dupa ce proprietarul confirma (docs/abonamente-si-valoare.md le numeste "oferta" si limitele "propuneri").
3. Pagina de comparatie neutra: "Cum alegi un software pentru echipe de teren: criterii + tabel cu categorii (nu cu numele concurentilor la inceput)". Partea de "ElectroField vs X" doar cu fapte verificabile din site-ul X, data verificarii, fara superlative. Evita "cel mai bun".
4. Raspunsuri scurte la inceputul paginilor (primele 2 randuri = definitie + pentru cine). Deja bine pe /software-management-echipe-teren; foloseste aceeasi structura peste tot.
5. Schema: Organization cu sameAs (LinkedIn, Facebook, YouTube, Google Business, directoare), SoftwareApplication cu applicationCategory=BusinessApplication, operatingSystem, offers (cand pretul e public), publisher; FAQPage deja prezent [V]. Adauga `dateModified` si autor/organizatie pe articolele de blog.
6. llms.txt: optional. /llms.txt nu exista [V]. Costul e mic: un fisier text cu descriere + linkuri catre paginile cheie; nu exista dovada solida ca influenteaza Google [N].
7. Pastreaza robots.txt deschis [V]; nu adauga Disallow pe GPTBot/PerplexityBot/Google-Extended. Verifica periodic in Search Console/Bing Webmaster.
8. Continut original citabil: calculatorul de tarif/ora, scadentarul gaze, modele de proces-verbal (sunt deja in /blog [V]); adauga date proprii (anonimizate) abia dupa ce exista, nu inventa cifre.
9. Intrebari in forma naturala ("Ce program folosesc electricienii pentru lucrari?"), pe H2/H3, cu raspuns de 40-60 cuvinte.
10. Recenzii: pagina "Clienti"/testimoniale doar reale.

##### 3.3 Recomandari off-site
- Sa apara in articole terte de tip "programe pentru firme de instalatii" (Softlead articole, bloguri de nisa): propune ghid de continut sau interviu, nu advertorial deghizat.
- Aceleasi descrieri/NAP pe toate directoarele; incepe cu un singur set de fapte (sectiunea 4).
- Review-uri pe Capterra/G2 de la clienti pilot; YouTube; mentiuni in comunitati.
- Evita retele de linkuri/PBN, comentarii spam, schimburi masive de linkuri: risc de penalizare.

#### 4. Texte gata de folosit (RO)
Baza: src/lib/marketing-pages.ts, docs/abonamente-si-valoare.md, home-faq.ts. Nu includ cifre de clienti, economii sau recenzii (nu exista dovezi).

##### 4.1 Descriere scurta (1 paragraf, ~120 cuvinte)
ElectroField este o platforma romaneasca pentru firmele de instalatii electrice, gaze si fotovoltaice cu echipe in teren. Biroul programeaza lucrarile in calendar si pe harta, iar tehnicianul le vede in aplicatia de pe telefon, cu adresa, pasii, pozele, checklistul si semnatura clientului; aplicatia functioneaza si fara semnal. Platforma include pontaj pe lucrare, evidenta materialelor pe masini, documente generate din datele din teren (buletine PRAM si de izolatie, procese-verbale, fisa de evidenta gaze, raport de lucrare) si pregatirea facturii din ore si materiale, cu emitere prin SmartBill sau Oblio. Cont de test si prezentare pe lucrarile firmei, la cerere.

##### 4.2 Descriere lunga (3 paragrafe)
P1. ElectroField (https://www.electrofield.ro) este un software de management pentru firmele de instalatii electrice, gaze si fotovoltaice din Romania. Reuneste intr-un singur loc clientii, lucrarile, echipele, materialele, pontajul si documentele, astfel incat biroul si oamenii din teren sa lucreze pe aceleasi date. Platforma de birou ruleaza in browser, iar tehnicienii folosesc o aplicatie mobila.

P2. In teren, tehnicianul vede lucrarile zilei si pasii lor, face poze inainte si dupa, bifeaza checklistul, trece masuratorile si ia semnatura clientului pe ecran; pontajul se face pe lucrare (plecare, sosire, inceput, final, cu locatia la sosire), iar datele se salveaza pe telefon si se trimit cand revine semnalul. Biroul vede echipele pe harta, orele pe om si pe lucrare, concediile si cheltuielile si poate calcula marja pe fiecare lucrare.

P3. Pentru fiecare domeniu exista fluxuri dedicate: buletine PRAM si de izolatie semnate de persoane cu autorizatie ANRE valabila si evidenta autorizatiilor; scadentar pe bloc/scara/apartament si fisa de evidenta pentru verificari si revizii gaze; dosar pe etape, termene ale operatorului si proces-verbal de punere in functiune pentru fotovoltaice. Factura se completeaza din ore si materiale si poate fi emisa prin contul SmartBill sau Oblio al firmei.
[Claim de confirmat inainte de publicare: integrarea SmartBill/Oblio functionala, aplicatia pe iPhone, autorizari/termene ANRE, "merge fara semnal" (offline), pret.]

##### 4.3 Email de pitch (asociatii, scoli, presa)
Subiect: ElectroField - program romanesc pentru firme de instalatii electrice, gaze si fotovoltaice

Buna ziua,

Ma numesc [Nume], de la ElectroField (https://www.electrofield.ro), o platforma romaneasca pentru firmele de instalatii electrice, gaze si fotovoltaice cu echipe in teren: programarea lucrarilor, aplicatia pe telefon pentru tehnicieni, pontaj, materiale si documentele predate clientului.

Va scriu pentru ca publicul dumneavoastra [membri / cursanti / cititori] lucreaza exact cu aceste documente si termene (PRAM, fisa de evidenta gaze, dosar prosumator). Am pregatit ghiduri gratuite si modele (ex. https://www.electrofield.ro/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate) pe care le puteti folosi sau cita, iar pentru [membri/cursanti] pot oferi o prezentare scurta, pe lucrarile firmei, programata prin https://www.electrofield.ro/programare.

Daca este util, va trimit un comunicat scurt sau o descriere a produsului pentru [site/newsletter]. Multumesc pentru timp.

[Nume, functie, contact@electrofield.ro, +40750425670]

(Notita: mesajele catre lead-uri se trimit pe email cu subiect, iar apelurile se programeaza prin linkul de programare - conform notelor stocate; conturi demo doar la cerere, dupa verificarea firmei.)

#### 5. Neverificat / limite
- Nu am putut deschide G2, AlternativeTo, SaaSHub, SourceForge, GoodFirms, Product Hunt (Cloudflare 403 la curl): existenta lor e cunoscuta, dar fluxul de listare, costul si tipul de link nu sunt verificate.
- Tipurile de link (dofollow/nofollow) sunt in general neverificate.
- ANIE, AIIR, OAER, ARIES, AEI: roluri, taxe de aderare si contacte neconfirmate.
- Statisticile GEO provin din rezultate WebSearch ale unor studii de industrie, nu din sursa Google.
- Cifrele Softlead (25.000 utilizatori, 82% manageri etc.) sunt afirmatii ale site-ului, nu verificate independent.


---

## B.4 Raport R3-product-truth

### R3 Product-truth inventory (28 Nov 2026)

Method: read code in /home/user/CRM (read-only). "V" = verified in code (file:line given). "U" = unverified / cannot be proven from the repo.
Git: only 65 commits exist (first 2026-11-25, last 2026-11-28), not 150. Repo has 54 migrations (recent only; base schema not in repo).
Important caveat from the repo itself: src/lib/platform-capabilities.ts:2 says "nimic nu e încă testat cu o firmă reală" and every module is marked "exista-netestat". docs/abonamente-si-valoare.md says the product is a sample of 3 orgs / 23 jobs. So "exists in code" is not "proven at a paying customer".

#### 1. Feature inventory (answers)

| Question | Answer | Evidence |
|---|---|---|
| SmartBill integration | YES in code (real API calls: catalog/series, issue, PDF, collect, cancel, storno, e-mail, payment status, product search). Never tested with a real account per repo (mock tests only). Has a "simulated/demo" mode. | src/lib/invoicing/smartbill.ts:6 (BASE https://ws.smartbill.ro/SBORO/api), :110 issue, :127 pdf, :165 sendEmail; scripts/invoicing-providers.test.mts; commit 9348878 (26 Nov 2026) |
| Oblio integration | YES in code (same set + link + e-Factura send). Same "untested with real firm" caveat. | src/lib/invoicing/oblio.ts:6, :116 issue, :166 oblioEinvoice (POST /docs/einvoice) |
| FGO | NO. Zero code. Not in provider type (`Provider = smartbill|oblio`). | src/lib/invoicing/index.ts:16; grep "fgo" over src/db/supabase = 0 hits |
| e-Factura / SPV upload | PARTIAL. Only through Oblio (button sends doc to SPV via Oblio API; status codes netrimisă/în prelucrare/trimisă/erori). With SmartBill: NOT from platform ("se trimite din setările contului"). No direct ANAF SPV/UBL upload by ElectroField. ANAF is only used for CUI lookup (PlatitorTvaRest). | index.ts:99-104 (capabilities einvoice = provider==="oblio"), :140-145 sendEinvoice error text; anaf.ts:4 |
| Offers / quotes / devize module | NO. There is no quote/deviz document, builder, PDF or client acceptance. "Ofertă" exists only as (a) a date field `offer_sent_on` and stage "Ofertă" in the PV dossier, (b) client "acord oferte" marketing-consent CSV export. Platform proforma (invoice-type document) exists, which is not a quote/deviz. | src/lib/pv.ts:4; src/app/(app)/fotovoltaic/pv-forms.tsx:54; src/app/(app)/clienti/oferte-export/route.ts:1-12; grep deviz/ofert = no module |
| Client signature on phone | YES. Job-level signature pad (saved as image, in PDF report) + signature fields inside gas fișa (client, installer, representative). PV form and electric form have NO signature field (job-level signature only). | src/app/mobil/lucrari/[id]/semnatura/signature-pad.tsx; src/lib/forms/gas-record.ts:259-262; templates.ts has no "signature" in pv/electric; api/rapoarte-lucrare/[id]/route.tsx:144-156 |
| Offline on mobile | YES, partial and well defined. Service worker caches already-opened /mobil pages + job step pages pre-warmed (WarmJobPages) and shows an offline page; IndexedDB queue sends in order when signal returns. QUEUED kinds only: photo, signature, event (arrival, work_start), finalize, form (incl. PIF/PRAM-like forms, drafts), gas fișa, SSM incident, gas visit (absent/refuz/reprogramat). NOT queued: departure/travel_start, material consumption, expenses, leave requests, pontaj corrections, purchase requests, messages, new job. | src/lib/offline/queue.ts:10-17 (QueuedOp), send.ts:1-60, public/sw.js:1-25, src/app/mobil/lucrari/[id]/job-footer.tsx:171 |
| iPhone app on App Store | NO. Only a Capacitor iOS project; build is an UNSIGNED IPA via GitHub Action, installed by sideloading with a free Apple ID (7-day expiry, 3 apps limit, no push). Not on TestFlight/App Store. A PWA manifest + SW exist (scope /mobil), so iPhone users can only "Add to Home Screen". | android-app/README.md "iOS (sideload with a free Apple ID)"; android-app/ios/; docs/plan-aplicatie-v2.md:87 (App Store/TestFlight is a PLAN); public/manifest.json |
| Android on Google Play | NO. Not published. Distribution = APK download button on /login ("Descarcă aplicația Android v0.3"). Package id com.electrofield.app, versionName 0.3, versionCode 3. README lists "Signing + Play Store listing" under "What's NOT done yet". | android-app/capacitor.config.ts:10; android-app/android/app/build.gradle:7-11; src/app/login/page.tsx:88-90; public/downloads/electrofield.apk (6.8 MB); android-app/README.md "What's NOT done yet" #4 |
| GPS live tracking | YES but opt-in: needs org setting `gps_continuous_tracking_enabled` AND per-user `location_consent_at`. Position every >=30 s into technician_positions (live dot) + trail log (only while moving). True background GPS only inside the Android APK (foreground service). In a browser tab it is best-effort and stops when screen locks. iOS sideload declares background location but is untested. Live map in office shows teams/jobs/depots, last known position even when quiet. Arrival time entries carry lat/lng. | src/app/mobil/layout.tsx:26,38; src/app/mobil/location-tracker.tsx:14-39; location-actions.ts:5-47; src/app/(app)/harta/page.tsx:78-90; android-app/README.md "Why this exists" |
| Route generation / foaie de parcurs | PARTIAL. Monthly sheet per vehicle generated from FINISHED jobs of the vehicle's assigned team: date, "Sediu → address", purpose, km, total km, fuel cost = km × org fuel_cost_per_km. No route optimization, no real GPS-trace km, no fiscal-format/PDF export. km come from `jobs.distance_km`; I found NO code in the repo that writes `distance_km` or `fuel_cost_per_km` (only seeds set distance_km) => U: how km get filled in a real org (may be DB trigger in base schema, not in repo). Page itself says confirm final form with accountant. | src/app/(app)/foaie-parcurs/page.tsx:17-18,42,75,95,108; grep distance_km writes = only supabase/demo/*.sql |
| PRAM / insulation reports | PARTIAL. Technician fills "Verificare tablou electric" form on phone (per circuit: insulation MΩ, loop impedance Ω, PE continuity Ω, RCD ms, C1/C2/C3 code, finding) and office can add measurements; PRAM/earth resistance is a field only in the PV form (`priza_pamant`), and a job template titled "Verificare rezistență priză de pământ (PRAM)" exists. Office "Buletine și procese-verbale" = a record (title + signer + signed date) signed only by someone with valid ANRE authorization in Conformitate. I found NO printable/PDF buletin generated from the measurements (only the hidden-works PV is a print page). Codes C1-C3 are "after the EICR model, as firm observations". | src/lib/forms/templates.ts:166-206, :148; src/app/(app)/electric/[jobId]/page.tsx:71-83,98-117; electric/actions.ts:67-80; src/app/(app)/lucrari/job-templates.ts:83; no pdf route for electric |
| Hidden-works PV | YES: printable page (browser print to PDF) built from "Ascuns" photos + hidden-works list. Marked "model de lucru". | src/app/pv-lucrari-ascunse/[jobId]/page.tsx:12-17; electric/[jobId]/page.tsx:62 |
| Gas verification/revision scadențar + fișă | YES. Building > scară > apartment; last verificare/revizie dates; next due computed (verificare 24 mo?, revizie 120 mo? configurable via settings.inspectionMonths/revisionMonths); import from Excel/CSV paste (max 2000 rows); statuses neprogramat/programat/nu răspunde/refuz/efectuat/sistat; fișă filled on phone with client signature; printable fișă page; 5+2 working-days deadlines after each fișă (register to operator, hand to client) excluding weekends/holidays; annual register CSV (Ord. 179/2015 annex 6 layout). | src/lib/gas.ts:1-41,64-90; src/app/(app)/gaze/fise/page.tsx:28,57; src/lib/working-days.ts; src/lib/gas-register.ts:1-64; src/app/fise-gaze/[id]/page.tsx:115,173-175 |
| Gas scadențar ALERTS | PARTIAL/NO push-like alerts for gas units: colour levels and "scadent luna aceasta/întârziat" lists exist; automatic notification alerts (60/30/7 days) exist only for Conformitate items (people authorizations, vehicles, devices). | src/lib/compliance-alerts.ts:9-34 (compliance_items only); grep notifications in gaze = none |
| PV dossier stages + PIF report | PARTIAL. Stages: Ofertă, Contract și avans, Montaj, ATR/avize, Punere în funcțiune, AFM/garanție, Finalizat, Anulat. Clocks for ATR, certificat racordare, AFM; terms editable; auto-drafted message to operator when overdue. PIF = phone form (inverter, panels, battery, serials via camera scan, per-string Voc/Isc/insulation/polarity, earth resistance, result). Form is stored on the job; I found NO dedicated PIF PDF/print (only generic job report PDF). There is no "dosar prosumator" stage name. | src/lib/pv.ts:3-12,25-56; src/lib/forms/templates.ts:96-160; src/app/(app)/fotovoltaic/pv-forms.tsx:51-56 |
| Stock per vehicle; tools register | YES. Vehicle stock with target list + min threshold, restock requests, urgent purchase with receipt; tools register with handover (predare-primire) and calibration; tool PV page. | src/app/(app)/materiale/masini/page.tsx; src/lib/vehicle-stock.ts; migration vehicle_restock_requests/tools/tool_handovers; src/app/pv-scule/[id]; commits 4a195f3, 1fe3c27 |
| Pontaj with location | YES per-job events: travel_start, depot_arrival, arrival (lat/lng saved), work_start, work_end; hours pairing; CSV export per range; corrections request with reason approved by office (no self-approval). Location is saved only at arrival (and arrival geofence check) unless continuous tracking enabled. | src/app/mobil/lucrari/[id]/actions.ts:58,116,159,181,213,262; src/app/(app)/pontaj/export/route.ts; src/lib/time-corrections.ts; commit 9555ebd |
| Leave | YES: request from phone (/mobil/concediu), approval at /pontaj/concedii and /aprobari; self-approval blocked. | src/app/mobil/concediu; src/app/(app)/pontaj/concedii; commit 9555ebd |
| Expenses and approvals | YES: expenses from job/phone with receipt photo (AI reads receipt, human confirms), approvals queue. | src/app/(app)/cheltuieli, aprobari; src/app/mobil/cheltuieli; commit a05b857 |
| Profit per job | PARTIAL. Job page "Cost & profit lucrare": revenue − (labor from pontaj×rate + materials + expenses + km×fuel). Profit only after an invoice exists ("profitul se calculează după facturare"). Reports: margin by domain only when job cost linked to invoice. "Luni dimineața" screen: margin by type and team. | src/app/(app)/lucrari/[id]/page.tsx:212-247,532-555; src/app/(app)/rapoarte/page.tsx:122; src/app/(app)/luni; commit 137772a |
| PDF reports | PARTIAL. Real server PDF (pdfkit): job report (job data, hours, expenses, photo COUNT not photos, signature) and invoice PDF (internal copy or provider PDF). Everything else (gas fișă, hidden-works PV, annual job report page, PV scule) = HTML print pages ("Print / Save as PDF"). Gas register = CSV. | src/app/api/rapoarte-lucrare/[id]/route.tsx:141,171; src/app/api/facturi/[id]/pdf/route.ts:34,110; src/app/rapoarte-lucrare/[id]/print-button.tsx |
| Client portal | PARTIAL, no login. Public status link per job (/status/[token]): steps Programată/Pe drum/În lucru/Finalizată, arrival window, who comes (team + badges), before/after photos, documents, signature info, contact-preference form. Public request form per company (/solicitare/[token]) creates a service request in office. No customer account, no invoices/payments/quote approval. | src/app/status/[token]/page.tsx:12-35,88-93; src/app/solicitare/[token]/page.tsx:1-14 |
| "Echipa e pe drum" message to client | MANUAL. Technician taps "Anunță clientul" and the phone opens SMS/WhatsApp/call with a prefilled text + status link (e-mail not offered on the road). The status page does show "Echipa este pe drum" when status is in_drum. Booking confirmation text is also prefilled for the office. Not an automatic server-sent SMS. | src/app/mobil/lucrari/[id]/notify-client.tsx:8-27; src/lib/client-messages.ts:15-30; status/[token]/page.tsx:40 |
| Notifications / push | YES on Android APK (FCM; needs Firebase env vars; silently no-op otherwise). In-app bell/notifications everywhere. iOS sideload: no push. Browser PWA push: not implemented. | android-app/README.md "Push notifications"; src/lib/push.ts; src/app/mobil/push-registration.tsx:25-27 |
| Multi-company | PARTIAL. Multi-tenant (each profile belongs to ONE organization; RLS per org). Platform Super Admin panel manages many companies, plans, demo accounts, leads, mail. A user cannot belong to several firms. | src/lib/auth.ts:34; src/app/admin/companii; src/app/admin/* |
| Demo accounts | YES (Super Admin-created demo companies; per-section/sub-function locks "se configurează pe firma ta"; demo invoicing runs in simulated mode; seed SQL). Note from stored user feedback: demo accounts are offered only to firms that ask and after verifying the firm. | src/lib/demo.ts:1-25; supabase/demo/seed_*.sql; commits d1f2263, 8334857 |
| Plans / pricing in app | In-app (login only) Setări → Abonament shows hard-coded "Abonament ElectroField 599 lei / lună, per companie, fără TVA" + jobs this month + active users. Client can submit "subscription requests" (feature/cancel). No payment/recurring billing. Internal doc proposes Standard 299 / Pro 599 lei/lună (proposal only; limits unimplemented). Admin company list has a Plan column (old 4 plans per doc). | src/app/(app)/setari/page.tsx:333-352; docs/abonamente-si-valoare.md:3,34-38; src/app/(app)/setari/subscription-request-form.tsx |
| Price shown publicly | NO. No price, trial or "gratuit" text on marketing pages, homepage, blog or /programare (greps over marketing-pages.ts, components/marketing, public/blog, programare.html). No /preturi page. Public CTA = book demo (15-min call or 30-min Google Meet). | greps; crawl pages.json (no pricing URL) |
| AI | YES but narrow, human-confirmed: receipt photo → expense fields; data-plate photo → make/model/serial; barcode scan; job creation helper; analytics recommendations. Providers Gemini/Groq. Settings switch per company. | src/lib/ai-vision.ts, ai-extract.ts; src/app/(app)/setari/ai-tab.tsx:41-43; commits a05b857, dd3664d |
| Other real extras | SSM on field (instruction expiry, work at height, pre-work check, incidents, offline queue), schedule warnings (expired authorization/ITP/RCA, overlaps, leave, missing stock, tool calibration), Conformitate registry with 60/30/7-day alerts, "Luni dimineața" owner screen, mod soare/mod mănuși, mobile scan, client contact preferences + consent. | src/lib/schedule-warnings.ts:7-14,63-141; src/lib/ssm.ts; src/app/mobil/(tabs)/setari/display-toggles.tsx:39-40; commits 07a1dc5, 79bbbdb |

#### 2. Public-site claim audit
Legend: yes / partial / no / U (unverified). "Fix" = suggested correction.

| # | Claim | Location | Supported? | Evidence | Suggested correction |
|---|---|---|---|---|---|
| 1 | "Aplicația tehnicianului pe Android și iPhone" / "Android și iPhone, cu același cont" | marketing-pages.ts:48 (software page), :263 (aplicatie-tehnician), FAQ :73 "Pe Android și pe iPhone"; src/app/page.tsx:42 featureList "(Android, iPhone)" | PARTIAL / misleading | Android = APK sideload; iPhone = unsigned sideload IPA or PWA home-screen. No App Store. | "Aplicație pentru Android (descărci APK-ul), iar pe iPhone merge din browser (adaugi pe ecranul principal). Aplicație în App Store: în pregătire." Remove "(Android, iPhone)" from JSON-LD or say "Web, Android". |
| 2 | "Pe Android se instalează aplicația; pe iPhone merge din browser sau ca aplicație" | marketing-pages.ts FAQ aplicatie-tehnician | PARTIAL | "ca aplicație" on iPhone is only a dev sideload | Drop "sau ca aplicație" |
| 3 | operatingSystem "Web, Android" | page.tsx:41 | yes | | keep |
| 4 | "Merge fără semnal" / "Pontajul merge și fără semnal: se trimite când revine conexiunea" | many (aplicatie-tehnician, pontaj-tehnicieni, firme-instalatii-electrice FAQ, software page criteria) | PARTIAL | Queue covers photos, signature, arrival, work start, finish, forms, gas fișe, incidents. Not departure, material use, expenses, leave. | "Pozele, sosirea, începutul și finalul lucrării, formularele, fișele de gaze și semnătura se salvează pe telefon și pleacă singure când revine semnalul. Plecarea, cheltuielile și cererile de concediu cer semnal." |
| 5 | "Plecarea, sosirea, începutul și finalul ... pontaj" | pontaj-tehnicieni | yes | actions.ts:58,181,213,262 | keep; avoid claiming departure offline |
| 6 | "La sosire se salvează locația, ca dovadă" | pontaj, scene-live-map, scene-job-journey | yes | actions.ts:186-187 (lat/lng) | note: location may be missing if user denies GPS (lat optional) |
| 7 | "Urmărirea continuă pornește doar cu acordul angajatului" | scene-live-map, pontaj FAQ | yes | mobil/layout.tsx:26 (org setting AND consent) | keep |
| 8 | "Harta live arată echipele (în drum, la lucrare, disponibilă)" | software page FAQ, scene-live-map | yes/partial | harta/page.tsx:35-90 (job statuses + positions). Live dots need tracking on. | add "poziția live apare dacă firma activează urmărirea" |
| 9 | "Facturare prin SmartBill sau Oblio" / "Se leagă de SmartBill sau Oblio? Da." | home FAQ, hero meta, facturare page, software page, 8+ places, JSON-LD featureList | PARTIAL | Code exists (smartbill.ts, oblio.ts) but untested on a real firm (platform-capabilities.ts:2,13), commit only 26 Nov | Keep but do not add "certified/official integration" wording; internally validate with one real SmartBill and Oblio account before pushing harder. |
| 10 | "Datele clientului luate de la ANAF după CUI" | facturare page, home FAQ | yes | anaf.ts:4-30 (public ANAF endpoint) | keep |
| 11 | "Trimitere pe e-mail (SmartBill) și în SPV / e-Factura (Oblio)" | facturare page | yes (as written) | index.ts:99-104,140-145 | good; ensure nobody generalizes to "e-Factura din platformă" |
| 12 | "Facturile ajung în e-Factura? Prin Oblio, da, direct din platformă." | facturare FAQ | yes | oblio.ts:166 | keep |
| 13 | blog e-factura: "se conectează cu Oblio sau SmartBill ... ambele susțin trimiterea facturilor în SPV — direct din lucrarea finalizată" | public/blog/e-factura-b2b-2026-... "Ce poți face din ElectroField" | PARTIAL | Via platform only Oblio sends to SPV; SmartBill does it from its own account. | "Cu Oblio trimiți în SPV direct din platformă; cu SmartBill, e-Factura se trimite din contul SmartBill." |
| 14 | "Anulare, storno, proformă transformată în factură", "încasări parțiale, chitanță" | facturare page | yes | invoicing/index.ts cancel/reverse/collect; actions.ts:36,63 fromProformaId | keep |
| 15 | "Fără furnizor conectat: evidență internă, PDF marcat ca document intern" | facturare page | yes (verify text in pdf route) | invoicing/index.ts:80-82; api/facturi/[id]/pdf/route.ts:110 | keep |
| 16 | "Lucrarea terminată apare la De facturat; rândurile se completează din ore pontate și materiale (ore × tarif, materiale cu adaos)" | facturare page, journey, FAQ | yes | facturare/page.tsx:106,116; actions.ts:359-375 (rate, markup) | keep |
| 17 | "Restanțele pe vechime" | facturare page | partial | facturare/page.tsx:16,55 filter "Restante"; aging by vechime appears in "Luni dimineața" (commit 137772a) | say "restanțe" or "lista restanțelor" |
| 18 | "Buletine PRAM și de izolație ... se generează cu valorile măsurate și semnatarul ales" | firme-instalatii-electrice FAQ + sections, software page, home TRADES, JSON-LD "Buletine PRAM și de izolație" | PARTIAL / overclaim | Measurements are captured and an authorized signer is recorded, but no buletin document (PDF/print) built from them was found. | "Tehnicianul trece măsurătorile în telefon, iar buletinul se înregistrează pe lucrare, semnat doar de o persoană cu autorizație ANRE valabilă. Document tipărit/PDF cu valorile: în lucru." (or build the print page first) |
| 19 | "Semnat doar de cine are autorizație ANRE valabilă" | electrice page | yes | electric/actions.ts:67-76 (checks compliance item title ILIKE %ANRE%, expires >= today) | keep (note: requires Conformitate module and the title containing "ANRE") |
| 20 | "Lucrări ascunse documentate cu poze, procesul-verbal iese din aplicație" | electrice page | yes | pv-lucrari-ascunse/[jobId]/page.tsx | say "pagină de proces-verbal pe care o tipărești / salvezi PDF" |
| 21 | "Programarea te avertizează: om fără autorizație, ITP/RCA expirat, material lipsă din stoc" | electrice + gaze + foaie de parcurs | yes | schedule-warnings.ts:63-141 | keep |
| 22 | "Raport de lucrare semnat de client, cu ore, materiale și observații" | electrice "Documentele" | partial | PDF has job data, hours, expenses, photo count, signature, NOT material list (route.tsx:26-36,141) | "cu ore, cheltuieli, observații și semnătura clientului" |
| 23 | "Pachetul pentru client pe un link: pozele înainte și după și documentele" | electrice, aplicatie-tehnician | yes | status/[token]/page.tsx:19-20,88-93 | keep; it is a link, not a client account |
| 24 | "Clientul primește fereastra de sosire, 'echipa e pe drum', cine vine" | aplicatie-tehnician; journey "clientul primește 'echipa e pe drum'" | PARTIAL | status page shows these; the "pe drum" SMS/WhatsApp is sent by the technician via phone app, not automatically by the server (notify-client.tsx:8-27) | "Tehnicianul trimite clientului cu o atingere (SMS/WhatsApp) mesajul 'am plecat' cu linkul de status; clientul vede fereastra de sosire și cine vine." |
| 25 | "Fără cont și fără aplicație" (client) | aplicatie-tehnician | yes | status page is public by token | keep |
| 26 | Gaze: "verificarea la 2 ani și revizia la 10 ani calculate automat, revizia ține locul verificării" | gaze page, home | partial/yes | gas.ts:35-51 uses settings (inspectionMonths/revisionMonths); revision-replaces-inspection logic: dates computed independently, earliest wins; text "revizia ține locul verificării" is the company's rule, check gas settings defaults | Verify defaults (24/120) in settings code before keeping the wording; U |
| 27 | "Lista se importă din Excel" | gaze page, home FAQ | yes | gas.ts:64-90 (paste/CSV, 2000 rows, invalid dates rejected) | say "lipești din Excel/CSV" |
| 28 | "Clienții ... și materialele se pot importa" | home FAQ | PARTIAL / no for clients | No client import found (clienti actions have only create/edit; oferte-export is an export). Materials: only "Importă catalog standard" button; no file import. Gas apartments: yes. | "Apartamentele din scadențarul de gaze se importă din Excel; catalogul standard de materiale se importă dintr-un clic; clienții și materialele firmei le încărcăm noi la prima configurare." (only if true operationally) |
| 29 | "Fișa de evidență completată din telefon, clientul semnează pe ecran" | gaze page | yes | gas-record.ts:259-262 | keep |
| 30 | "5 zile lucrătoare la operator + 2 la client, fără weekenduri și sărbători; registrul anual din fișe" | gaze page, blog | yes | gaze/fise/page.tsx:28,57; working-days.ts; gas-register.ts | keep |
| 31 | "alerte înainte de scadență" (scadențar gaze) | blog fisa-evidenta ... "cu alerte înainte de scadență" | PARTIAL / unproven | Scadențar colors/lists; automatic notifications exist only for Conformitate | "cu lista scadențelor pe luni și restanțele" |
| 32 | "Oamenii și autorizațiile: alertă înainte de expirare" | gaze, electrice | yes | compliance-alerts.ts:9-34 (60/30/7) | keep |
| 33 | Fotovoltaic: "Etapele (ofertă, contract, ATR, montaj, punere în funcțiune, dosar prosumator)" | firme-fotovoltaice | PARTIAL | actual stages: Ofertă, Contract și avans, Montaj, ATR/avize, Punere în funcțiune, AFM/garanție, Finalizat (pv.ts:3-12) | Use the real names (replace "dosar prosumator" with "AFM / garanție") |
| 34 | "Ceas pentru termenele operatorului, modificabile; mesaj gata pentru operator la depășire" | firme-fotovoltaice | yes | pv.ts:25-56 (openClocks, complaintDraft) | keep; it is a draft text, not sent to operator |
| 35 | "Procesul-verbal de punere în funcțiune se completează cu valorile din teren și se semnează la fața locului" | firme-fotovoltaice; blog proces-verbal-punere-in-functiune ("clientul semnează pe ecran") | PARTIAL | PIF form has no signature field; the job-level client signature exists separately; no dedicated PIF PDF found | "Fișa de punere în funcțiune (valori pe string) se completează pe telefon; semnătura clientului se ia la finalul lucrării." |
| 36 | "Reviziile periodice intră în calendar; reclamație devine lucrare cu istoric complet" | firme-fotovoltaice "Service și reclamații" | PARTIAL / U | No recurring-job or periodic-calendar feature found (only a "Mentenanță periodică" job template, job-templates.ts:78). Manual jobs with history per client: yes. | "Programezi manual reviziile în calendar; istoricul clientului păstrează ce s-a montat și ce s-a măsurat" |
| 37 | "Măsurători pe string se salvează pe proiect și apar în proces-verbal" | firme-fotovoltaice FAQ | PARTIAL | stored in job form (job_forms) not on pv_projects; shown in Dosar panel; no PIF document | say "pe lucrare" |
| 38 | Foaie de parcurs "generată automat, nu trebuie completat nimic de mână" | foaie-de-parcurs page | PARTIAL / U | km from jobs.distance_km; no code in repo sets it (only seed) | Before keeping "nimic de mână", confirm in the live DB how distance_km is filled; otherwise say "kilometrii introduși pe lucrare" |
| 39 | "Costul estimat din costul pe kilometru setat de firmă" | foaie-de-parcurs | U | fuel_cost_per_km read in page.tsx:46 but no settings form writes it | confirm a setting exists in UI (Setări) |
| 40 | "Mașina ca depozit mobil: listă țintă, prag minim, reaprovizionare, achiziție urgentă" | foaie + stoc pages | yes | masini/page.tsx; commits 4a195f3, a3d5935 | keep |
| 41 | "ITP/RCA în Conformitate cu alertă" | foaie, stoc | yes | schedule-warnings.ts:72; compliance-alerts | keep |
| 42 | "Registrul de scule: predare-primire, calibrare" | stoc | yes | commit 1fe3c27; materiale/scule | keep |
| 43 | "Comanda către furnizor se face din ce lipsește" | stoc "Depozite și comenzi" | partial | /materiale/comanda is a printable order list (print-button), no sending to supplier | "Lista de comandă pentru furnizor se tipărește din ce lipsește" |
| 44 | "Depozite cu adrese vizibile pe hartă și în navigarea tehnicianului" | stoc | yes | harta/page.tsx:283; mobil/lucrari/[id]/depozit/page.tsx | keep |
| 45 | "Tehnicianul nu vede prețurile de achiziție" | stoc FAQ, aplicatie-tehnician FAQ | U | RLS/mobile views not audited line by line; materials mobile pages not checked for cost fields | verify before keeping (grep unit_cost in src/app/mobil) |
| 46 | "Corecția intră în pontaj doar după ce o aprobă biroul; nimeni nu își aprobă singur concediul/cheltuiala" | pontaj | yes | commit 9555ebd; time-corrections.ts | keep |
| 47 | "Export pontaj pe lună, pe fiecare om" | pontaj FAQ | PARTIAL | export route is CSV with range/view params (pontaj/export/route.ts), not per-month PDF | "export CSV" |
| 48 | "Durata medie pe tip de lucrare din ore, pentru programări realiste" | pontaj | yes | lib/job-durations.ts + server | keep |
| 49 | "Mod mănuși și mod soare" | aplicatie-tehnician | yes | display-toggles.tsx:39-40 | keep |
| 50 | "Notificări când biroul îi schimbă programul sau îi trimite un mesaj" | aplicatie-tehnician | PARTIAL | push only on Android APK; in-app bell elsewhere; iOS none | "Notificări push pe Android; pe iPhone în aplicație" |
| 51 | "Face poze în două atingeri, etichetate; se încarcă în fundal" | aplicatie-tehnician | yes | mobil/lucrari/[id]/foto (categories: sosire, în timpul, final, ascunse, bonuri, problemă), queue | keep |
| 52 | "Cere materiale, înregistrează cheltuieli cu poza bonului, cere concediu" | aplicatie-tehnician | yes | mobil/materiale, cheltuieli, concediu | keep (online only) |
| 53 | "Navigare spre adresă" | software + journey | yes | maps links in mobil/lucrari | keep |
| 54 | "Marja pe fiecare lucrare" / "profit pe lucrare" | electrice, home modules, blog | PARTIAL | Needs linked invoice; "Rapoarte: marja pe domeniu apare când costul e legat de factură" (rapoarte/page.tsx:122) | "Costul și profitul unei lucrări apar după ce lucrarea e facturată în platformă" |
| 55 | "Rapoarte: ce ai facturat, ce e de încasat și marja pe fiecare domeniu" | scene-modules | partial | same as #54 | soften |
| 56 | "Documente: buletine, procese-verbale și fișe, generate din datele de pe teren" | scene-modules; home-seo lead ("Documentele cerute de ANRE și de operatori ies din datele de pe teren") | PARTIAL | Gas fișă (print page) and hidden-works PV yes; PIF/PRAM buletin no dedicated doc; job report PDF yes | "Fișa de gaze și procesul-verbal de lucrări ascunse se generează din datele de pe teren; raportul lucrării în PDF" |
| 57 | "Calendar și echipe: avertismente pentru autorizații și materiale" | scene-modules | yes | schedule-warnings.ts | keep |
| 58 | "Clienți: adrese, contacte, istoricul lucrărilor" | scene-modules | yes | clienti/[id]/page.tsx | keep |
| 59 | "Programezi o discuție: apel 15 min sau Meet 30 min" | home FAQ, FAQs | yes | commit c53bbcf; src/app/api/programari | keep |
| 60 | Hero/journey: "Fiecare etapă urmărită automat, fără hârtii și fără telefoane" | scene-job-journey subtitle | partial | the "pe drum" message is a manual tap; some steps need signal | "fără hârtii și cu mai puține telefoane" |
| 61 | scene-phone-dashboard mock data ("Cablu CYABY 3x2.5 — 20m", "#2487 Casa Popescu", "24.800 lei Venituri lunare", "Istoric: 3 lucrări finalizate", "Navigație → 12 min", "6 fotografii", "Semnătură client capturată") | scene-phone-dashboard.tsx:122,144-148,160,169,194-214 | illustrative, not real data | hard-coded sample content inside a phone mockup | add a visible "exemplu" / "date demonstrative" label |
| 62 | "Materiale verificate înainte de drum. Dacă lipsește ceva, tehnicianul merge la depozit" | scene-phone-dashboard caption | yes | depozit flow exists (mobil/lucrari/[id]/depozit) | keep |
| 63 | "Merge pe telefoane ... Android și iPhone" in software page lead "aplicația tehnicianului pe Android și iPhone" | marketing-pages.ts:47 (Pentru cine e) | PARTIAL | see #1 | see #1 |
| 64 | Software page: "Pontaj din teren ... cu locația la sosire" | software list | yes | #6 | keep |
| 65 | Software page: "Gaze: ... verificarea la 2 ani și revizia la 10 ani" | same | see #26 | | |
| 66 | Software page "Merge fără semnal? În subsoluri și pe șantiere..." | criteria list | partial | see #4 | |
| 67 | Blog: "raportul poate fi descărcat ca PDF" | model-proces-verbal-raport-lucrare | yes | api/rapoarte-lucrare/[id]/route.tsx | keep |
| 68 | Blog calculator: "ElectroField leagă orele pontate și cheltuielile de fiecare lucrare, vezi costul real, marja pe lucrare și pe echipă și cât din timp a fost facturabil" | calculator-tarif-ora... | PARTIAL | cost/profit per job yes; margin by team yes (luni/); "cât din timp a fost facturabil" (billable-hours ratio) not found | drop "cât din timp a fost facturabil" |
| 69 | Blog evidenta-orelor: "timpul de execuție se măsoară automat; pontajul, concediile și absențele în același loc" | evidenta-orelor... | partial | pontaj + leave yes; "absențe" as distinct type not found | say "pontajul și concediile" |
| 70 | Blog urmarire-gps: "setări dedicate pentru GPS și confidențialitate" | urmarire-gps-echipe-teren-gdpr | yes | org setting + user consent + privacy page | keep |
| 71 | Blog contract-mentenanta: "programezi vizitele în calendar" | contract-mentenanta... | yes | calendar | keep; do not imply recurring contracts |
| 72 | Blog model-oferta: "De la ofertă la lucrare, fără să rescrii nimic" | model-oferta-lucrari... | PARTIAL / misleading by implication | There is no offer module; you create the job manually (no offer-to-job conversion) | "Creezi lucrarea cu clientul, echipa și materialele; oferta o scrii separat (model în articol)" |
| 73 | Blog gaze fisa: "Ceasul de 5 + 2 zile nu mai rămâne în buzunarul nimănui", "completează fișa pe telefon, cu poze și semnătura clientului" | fisa-evidenta... | yes (poze: photos exist on job; fișă itself has signatures) | gaze/fise/page.tsx | keep |
| 74 | Blog documente-predare / checklist / cum-gestionezi / cat-avans / panouri-produc-putin CTAs ("organizează lucrările pe etape și echipe", "păstrează lucrările, fotografiile și notițele") | several blog files | yes (generic) | | keep |
| 75 | Blog program-management-firma-instalatii: "Vezi cum răspunde ElectroField la cele 8 criterii" | program-management... | PARTIAL | criteria include "Documente și rapoarte", "Datele tale: le poți exporta oricând?" (export exists only partially: pontaj CSV, gas register CSV, marketing consent CSV; no full data export), "Cum testezi în 14 zile" (no self-serve trial exists; demo only) | Do not promise full export or a 14-day trial for ElectroField; the article text itself is generic advice, only the closing line claims coverage |
| 76 | home FAQ: "Aplicația merge și fără semnal" | home-faq.ts:5 | partial | see #4 | |
| 77 | home FAQ: "Alegi domeniile firmei, iar meniul arată doar ce folosești" | home-faq.ts:3 | yes | modules.ts + domains.ts | keep |
| 78 | JSON-LD featureList: "Dosar fotovoltaic pe etape", "Scadențar...", "Stoc pe mașini și registru de scule", "Foaie de parcurs" | page.tsx:42 | yes (see 38 for foaie) | | |


#### 3. Highest-risk overclaims (fix first)
1. iPhone/"Android și iPhone" everywhere (App Store does not exist; iOS = sideload).
2. "Buletine PRAM... generate" and "Documentele cerute de ANRE ies din datele de pe teren": no buletin/PIF document is generated from measurements.
3. "Merge fără semnal" blanket claim (departure, expenses, leave, material use need signal).
4. "Clienții și materialele se pot importa" (no client/material file import).
5. "Echipa e pe drum" shown as automatic (manual SMS/WhatsApp tap).
6. "e-Factura" via SmartBill from the platform (only Oblio).
7. Offer/quote implications ("de la ofertă la lucrare", FAQ "devize" in earlier SEO docs): no quote/deviz module. Do not target "program devize" with product claims.
8. "Reviziile periodice intră în calendar" (no recurrence).
9. Foaie de parcurs "nimic de mână" (distance_km source unknown).
10. Integrations never tested on a real firm: do not write "certificat", "oficial" or customer counts.

#### 4. ElectroField fact sheet (writers must follow)

##### 4.1 What it is
Web platform for offices (browser) + mobile web app/Android APK for technicians, for Romanian firms doing electrical, gas and photovoltaic (also climatizare/securitate) installation work. Multi-tenant: one firm = one organization; roles: administrator, manager/dispatcher, team leader, technician, client (status link only). Demo via 15-min call or 30-min Google Meet. No public price, no self-serve signup trial advertised.

##### 4.2 Verified features (safe to claim, use the wording limits)
- Jobs, clients, locations, contacts, calendar (week/day), teams, assigning technicians; schedule warnings (expired authorization, ITP/RCA/rovinietă, leave, overlap, overload, missing stock, tool calibration, SSM).
- Mobile app for technicians: today's jobs, job steps (depot pick-up, travel, arrival, work, finish), labelled photos (sosire, în timpul lucrării, finalizare, lucrări ascunse, bonuri, problemă), checklists, forms with measurements, client signature on screen, material requests, expenses with receipt photo, leave requests, SSM checks/incidents, barcode/plate scan, mod soare / mod mănuși, navigation link to address.
- Offline (queue): photos, signature, arrival, work start, finish, forms, gas fișe, gas visits, SSM incident. Already-opened pages are cached. Requires signal: departure, expenses, leave, material use, new data from office.
- Pontaj per job (departure, depot, arrival with location, start, end), corrections with reason approved by office, leave with approval, CSV export, average job duration per type.
- Live map for office: active jobs, teams, depots, last known positions; continuous GPS only with firm setting + employee consent; true background GPS only in the Android APK.
- Gas: building/scară/apartment scadențar, Excel/CSV paste import (2000 rows), contact statuses, fișă on phone with signatures and printable page, 5+2 working-day deadline clocks, annual register CSV (Ord. ANRE 179/2015 layout).
- Electric: circuit measurement form on phone (insulation, loop, PE continuity, RCD ms, C1/C2/C3), measurements table in office, report record signed only by someone with valid ANRE authorization in Conformitate, hidden-works list + photos + printable proces-verbal.
- Photovoltaic: project dossier with stages (Ofertă, Contract și avans, Montaj, ATR/avize, Punere în funcțiune, AFM/garanție, Finalizat), dates, operator-term clocks, drafted message to operator, PIF phone form (inverter, panels, battery, serials via scan, per-string Voc/Isc/insulation/polarity, earth resistance, result).
- Conformitate: authorizations/legitimations, vehicles (ITP, RCA), devices with calibration, alerts at 60/30/7 days.
- Stock: warehouses, materials, standard catalog import, stock per vehicle with target list and minimum, restock requests, urgent purchase, printable order list, tools register with handover and calibration.
- Foaie de parcurs: monthly per vehicle from finished jobs of its team (date, address, purpose, km, estimated fuel cost); confirm fiscal form with accountant. (km source to be confirmed.)
- Invoicing: invoices and proformas with lines, from "De facturat" jobs (hours × firm rate, materials + markup), ANAF CUI lookup, VAT-payer flag, collections (cash with receipt, card, OP), cancel/storno, PDF, restanțe; via SmartBill (PDF, e-mail) or Oblio (link, e-Factura/SPV send) or internal-only evidence (marked not a fiscal invoice). Integrations are untested on real firms.
- Client link (no login): status steps, arrival window, who is coming, before/after photos, documents, signature; contact preferences and marketing consent; public request form per firm.
- Reports: job report PDF (job, hours, expenses, photo count, signature), job profit (after invoice), "Luni dimineața" owner screen (restanțe, margin by type and team), expenses/approvals queue.
- AI, human-confirmed only: receipt → expense, data plate → make/model/serial, scan; firm can switch AI off.
- Push notifications: Android APK only.

##### 4.3 Coming soon / planned (never state as available)
- iPhone app on App Store/TestFlight, Android on Google Play (plans only: docs/plan-aplicatie-v2.md:87).
- Printable/PDF PRAM-electric buletin and PIF report generated from measurements.
- FGO integration; SPV upload from SmartBill; direct ANAF e-Factura.
- Offers/quotes/deviz module; client portal with login/payments; recurring maintenance contracts; client/material file import; automated "pe drum" SMS; route optimization; operator-network submission (platform-capabilities.ts:13 "lipsa"); payments/recurring billing; Standard/Pro plans (299/599, proposal only); in-app prices today: 599 lei/lună shown only inside Setări.
- Native iOS push; browser/PWA push.

##### 4.4 Wording rules
- Say "Android (APK) și din browser pe iPhone", never "iPhone app".
- Say "se salvează pe telefon și se trimit când revine semnalul" only for the list in 4.2.
- Never name customers, review counts or "folosit de X firme": no real-firm validation in the repo.
- Never publish prices unless the owner decides (internal numbers: 599 lei/lună shown in app, 299/599 proposal).
- Demo accounts: only for firms that ask and are verified (stored user feedback).
- Legal/ANRE statements must keep the "confirmă cu responsabilul tehnic/contabilul" caveat the pages already use.

#### 5. Unverified items to confirm with the owner/DB
1. Who fills jobs.distance_km and organizations.fuel_cost_per_km (no code writes them).
2. Defaults of gas inspectionMonths/revisionMonths (24/120?).
3. Whether technician mobile views hide purchase prices (claims on stoc and aplicatie pages).
4. Whether any real SmartBill/Oblio account was ever connected (platform-capabilities.ts says no real-firm test).
5. Whether a PRAM/buletin print view exists in the base schema pages not in repo (none found in src).
6. Live state of the Supabase DB (not queried; research phase).


---

## B.5 Raport R4-technical

### R4 - Technical SEO + performance audit (28 Nov 2026)
Legend: [V] verified (measured/fetched/read; source given), [U] unverified/inference. Nothing in /home/user/CRM was modified. Raw data: scratchpad/research/lh/*.json (Lighthouse 13-style output, summary script lh/summ.py), research/html/*.html (fetched pages).
Lighthouse ran fine (chromium-1243, headless, from the sandbox network, simulated throttling for mobile). Lab data only: no CrUX/field data exists for a 1-week-old site.

#### 1. Lighthouse results [V]
| URL | Form | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT | JS transfer | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| / | mobile | 93 | 92 | 100 | 100 | 1.4s | 1.4s | 0 | 310ms | 180 KiB | 546 KiB |
| / | desktop | 100 | 92 | 100 | 100 | 0.3s | 0.3s | 0 | 0 | 185 KiB | 582 KiB |
| /software-management-echipe-teren | mobile | 96 | 100 | 100 | 100 | 0.9s | 0.9s | 0 | 230ms | 179 KiB | 443 KiB |
| same | desktop | 100 | 100 | 100 | 100 | 0.3s | 0.3s | 0 | 20ms | 184 KiB | 468 KiB |
| /blog/calculator-tarif-... | mobile | 100 | 100 | 100 | 100 | 1.0s | 1.0s | 0 | 20ms | 4 KiB | 256 KiB |
| same | desktop | 100 | 96 | 100 | 100 | 0.3s | 0.5s | 0.026 | 0 | 4 KiB | 256 KiB |
| /blog | mobile | 98 | 100 | 100 | 100 | 0.9s | 2.5s | 0.007 | 0 | 4 KiB | 342 KiB |
| /blog | desktop | 100 | 100 | 100 | 100 | 0.2s | 0.5s | 0.001 | 0 | 4 KiB | 342 KiB |
(INP cannot be measured in lab; proxies: max-potential-FID 380ms home-mobile, 270ms marketing-mobile, 50-90ms blog. TTFB 20-30 ms root document everywhere: Vercel fra1 static/CDN is excellent.)

Key findings
- Performance is NOT an SEO problem. All pages 93-100; CWV lab values pass. Do not spend priority budget here beyond the cheap items below.
- Homepage hero image question: `src/components/marketing/hero.tsx:44-50` uses next/image `fill priority sizes="100vw"`. Served HTML has `<link rel="preload" as="image" imageSrcSet=... imageSizes="100vw">` and the <img> srcset spans w=640..3840. `src=...w=3840` is only the legacy fallback; modern browsers pick from srcset (640-1080 on phones, 1920 on desktop). The <img> carries no explicit fetchpriority attribute, but the preload link makes it high priority [V html/home.html]. Lighthouse reports no `prioritize-lcp-image`/`lcp-discovery` failure on the homepage, and the hero image is NOT the LCP element: LCP is a text node (mobile: `p.heroSub`; desktop: `p.heroTitle`), see lcp-breakdown-insight. So the "3840" worry is a false alarm; image-delivery savings on / are 13-19 KiB and point to the lazy `screen-harta.webp` screenshot, not the hero.
- Real LCP lever on home/marketing: "element render delay" 380-560 ms vs TTFB ~100 ms. Cause [U, strongly indicated by class names]: hero text uses `mk-reveal-1/2/3` entrance animations (hero.tsx:55-70) + font swap (Inter/Unbounded `display: swap`, preloaded). Fix: no opacity/transform reveal on above-the-fold text (or only CSS animation w/o opacity:0 start). Gain ~0.3-0.5 s LCP mobile; low SEO value but cheap.
- JS: ~180 KiB transfer on / and marketing pages; unused JS 20 KiB (/ chunk 1255) and 43 KiB (marketing: chunks 7608 80% unused, 4bd1b696 37% unused); legacy JS 12 KiB (polyfills Array.at/flat). Mobile TBT 230-310 ms comes from script evaluation 1.1 s + "other" 1.0 s (webpack chunk 760 ms total, c15bf2b0 774 ms: GSAP/scroll hero, SiteTracker, PreventZoom, PublicWebAnalytics all in root layout.tsx). Marketing /software-management-echipe-teren is a plain content page yet ships the same 180 KiB because the root layout loads app-wide client components. Fix: move PreventZoom/GSAP-dependent code out of root layout into (app)/mobil layouts (see src/app/layout.tsx imports: PreventZoom, PublicWebAnalytics, SiteTracker). Effort M, impact low-medium (TBT 230ms -> ~50ms).
- Render-blocking: 2 CSS files (15 KB shared + page css), est. 30-140 ms mobile. Minor. Blog CSS: blog-style/blog-tools/blog-guides.css separate (3 requests, 1-2 KB each; merge to 1).
- Fonts: 3 local variable fonts via next/font/local, `display: swap`, two preloaded (home) ; ~190-233 KiB font transfer on every page incl. blog (blog static HTML loads fonts ~190 KiB, 4 KiB JS only). jetbrains-mono preload:false. OK. Optional: subset Unbounded to latin + latin-ext (RO diacritics ș ț ă î â) to cut font bytes.
- Blog /blog mobile LCP 2.5 s (borderline "good" limit): `lcp-discovery-insight` fails: LCP image in blog index (first card image, 135 KiB images on page) is discovered late (resource load delay 170 ms) - add `fetchpriority="high"` + no `loading="lazy"` on the first card image in public/blog/index.html and width/height on images (unsized-images fails on /blog and posts).
- Blog post: cover `<img class="cover" src=".webp">` has no width/height (unsized-images, CLS 0.026 desktop), image-delivery savings 30-33 KiB (image larger than displayed; serve 800 w variant / `srcset`). `label-content-name-mismatch` fails on blog pages (a link with visible text whose aria-label differs; find via Lighthouse JSON `label-content-name-mismatch` items) and `target-size` (desktop post).
- Accessibility failing on `/` (92): color-contrast (hero phone mockup list roles, tab bar 15 px labels, figcaption "Harta live, din platformă", "03 / APLICAȚIA TEHNICIANULUI" index label in `.pdIdx`), aria-prohibited-attr (footer logo `<span aria-label="ElectroField">` with no role -> add role="img" or drop aria-label). Marketing pages 100.
- SEO category = 100 on all 8 runs. Agentic-browsing 25-50 category (llms.txt missing -> /llms.txt is 307 -> /login [V curl]; "ARD manifest invalid"): experimental, ignore, but llms.txt is cheap (see fix list).
- Hero text structure note: homepage `<h1>` is the small kicker text above the big `<p class=heroTitle>` ("Din birou. Direct în teren.") - h1 = "Software de management pentru electricieni și echipe de teren" (hero.tsx:55-58). Good for keywords, but the visually dominant heading is a <p>.

#### 2. Structured data [V: parsed from fetched HTML]
Homepage (WebSite, Organization, SoftwareApplication, FAQPage[5]):
- Organization: has name,url,logo(icon-512.png as plain URL string),email,telephone,areaServed. MISSING: sameAs (no profiles at all: add LinkedIn/Facebook/Google Business Profile/Play Store listing when they exist), address (PFA registered office is in the footer/Termeni per commit ba9825d; PostalAddress with addressLocality "București Sector X"/addressCountry RO), legalName, vatID/taxID (CUI), contactPoint. `logo` should be an ImageObject or URL of a >=112x112 PNG: icon-512.png is OK but a wordmark logo (logo-wordmark-field.png) is more representative.
- SoftwareApplication: has name,url,description,applicationCategory,operatingSystem,featureList,publisher. MISSING for Google software-app rich result: `offers` (price/priceCurrency, or Offer price 0 for trial) AND/OR `aggregateRating`/`review`. Without either, Google will NOT show the rich result (and requires one of them). Do not fabricate ratings. If there is a public price or free trial, add `offers`: {"@type":"Offer","price":"...","priceCurrency":"RON"}. If pricing is quote-only, rich result is not available; keep the markup for entity understanding. Add `screenshot` (marketing/screen-harta.webp), `downloadUrl`/`installUrl` (Play Store link if public), `softwareVersion`, `image`. `operatingSystem` says "Web, Android" but copy says iPhone too ("Android, iPhone" in featureList) -> make consistent ("Web, Android, iOS").
- FAQPage: 5 Q&A valid. NOTE: since Aug 2023 Google shows FAQ rich results only for well-known government/health sites -> no rich-result benefit for this site; still harmless for AI/entity understanding. Do not invest further.
- WebSite: no `potentialAction` SearchAction (not needed, no site search). `url` has no trailing slash vs @id; fine.
Marketing pages (/software-management-echipe-teren and 8 siblings): WebPage + BreadcrumbList + FAQPage (src/app/[slug]/page.tsx:46-72).
- BreadcrumbList valid (2 levels). Breadcrumb item 2 `name` = H1 (long, e.g. "Software de management pentru electricieni și echipe de teren"); use short label.
- WebPage `about`/`isPartOf` reference `#software` and `#website`, which exist only on the homepage graph: unresolved references on other URLs. Fix: also emit Organization + SoftwareApplication nodes (or full nodes) in the graph, or point `@id` to https://www.electrofield.ro/#software and accept. No `datePublished`, no `primaryImageOfPage`/image, no `breadcrumb` property link. No Service/Product schema for the trade pages (firme-instalatii-electrice etc.) - could add `Service` with `provider` Organization, `areaServed` RO.
Blog post (calculator-tarif..., checklist-instalare...): BlogPosting + BreadcrumbList (+FAQPage[6] on 3 long guides).
- BlogPosting has headline, description, image, datePublished/dateModified (date-only "2026-11-25", no time/timezone: valid but add +02:00 time), inLanguage, author, publisher (Organization with logo ImageObject), mainEntityOfPage (string URL: should be {"@type":"WebPage","@id":url}), isPartOf.
- Gaps: author is the Organization (acceptable for Google but weak E-E-A-T; add a named Person author with `url`/`jobTitle` + `sameAs` if there is one - specially for legal/ANRE/GDPR content (YMYL-ish)); `image` is a single string, on 26 of 29 posts it is a shared marketing og image (og-technician-phone.jpg etc.) not an article-specific image; Google recommends array of 16:9, 4:3, 1:1 images >=1200 px wide; `wordCount`, `articleSection`, `keywords`, `speakable` absent (optional); dateModified == datePublished everywhere (never updated; real freshness signals missing; the tariff/e-Factura articles cite 2026 data and should carry honest dateModified when revised); `@id` ok. No visible byline/date in the article body: grep for `<time>` returns none in 28/29 files; Google wants visible dates matching structured data -> add "Publicat: 25 noiembrie 2026 · Actualizat: ..." line in the template.
- Breadcrumb: valid 3 levels on posts.
/blog: CollectionPage + ItemList (url only, 29 items) + BreadcrumbList. ItemList items lack `name`/`image` (ok but add name). No gaps for Google.
Other: /programare (public conversion page), /termeni, /confidentialitate carry no JSON-LD (fine); /programare lacks `ContactPage`/Organization (optional).

#### 3. Crawl / indexing
##### 3.1 Unknown URLs -> 307 /login (soft-404-like) [V]
- `curl -I /pagina-inexistenta` -> `307 location: /login`. Same for /dashboard (legit), /llms.txt (307), `/wp-admin`, any path not under PUBLIC_PATHS or MARKETING_SLUGS. Counter-example: `/blog/inexistent` -> real 404 (noindex), `/blogfoo` -> 404 and `/status-x` -> 404, because middleware treats them as public by `startsWith` ("/blog","/status") and Next's notFound runs (default English 404 page with `<meta robots noindex>`).
- Cause: src/middleware.ts lines ~53-58: `isPublicPath = pathname==="/" || PUBLIC_PATHS.some(p=>pathname.startsWith(p)) || MARKETING_SLUGS.includes(...)`; `if (!user && !isPublicPath) redirect(/login)` for everything else, including paths that do not exist. The matcher (bottom of file) runs middleware on all non-static paths. So Googlebot sees 307 (temporary) to /login (which is noindex,nofollow [V]). It is not a classic soft-404 (status 307, not 200), but GSC reports "Page with redirect"/"Excluded by noindex", wastes crawl budget, gives no 404 signal for removed URLs, and any typo'd backlink resolves to a login page. Also the prefix matching is sloppy: "/blog" matches /blogfoo, "/auth" matches /authxyz, "/status", "/sitemap", "/solicitare", "/programare".
- src/app/not-found.tsx does NOT exist [V: `ls src/app/not-found*` fails]. Default Next 404 is shown (English: "404: This page could not be found.", title "404: ..."; page title tag also shows "ElectroField" duplicate title). A Romanian branded not-found with links to / , /blog, /programare is missing.
- SAFEST fix (does not weaken auth): keep the existing `PUBLIC_PATHS` logic, and add an explicit allow-list of PRIVATE route prefixes derived from src/app. Only those redirect when unauthenticated; any other unknown path falls through (`NextResponse.next`) to Next, which returns 404 + noindex (root layout sets robots noindex). Private prefixes (from the route tree, verified list of page.tsx/route.ts): `/aprobari /calendar /cereri /cheltuieli /clienti /conformitate /dashboard /echipe /electric /facturare /foaie-parcurs /fotovoltaic /gaze /harta /lucrari /luni /materiale /mesaje /notificari /pontaj /rapoarte /setari /ssm /start /admin /mobil /fise-gaze /pv-lucrari-ascunse /rapoarte-lucrare /accepta-termeni /cont-suspendat /api` (note `/mobil` keeps redirecting to /mobil-login). Code:
```ts
// src/middleware.ts
const PRIVATE_PREFIXES = ["/aprobari","/calendar","/cereri","/cheltuieli","/clienti","/conformitate","/dashboard","/echipe","/electric","/facturare","/foaie-parcurs","/fotovoltaic","/gaze","/harta","/lucrari","/luni","/materiale","/mesaje","/notificari","/pontaj","/rapoarte","/setari","/ssm","/start","/admin","/mobil","/fise-gaze","/pv-lucrari-ascunse","/rapoarte-lucrare","/accepta-termeni","/cont-suspendat","/api"];
const underPrefix = (p: string, base: string) => p === base || p.startsWith(base + "/");
// replace startsWith matching for public paths too:
const isPublicPath = pathname === "/" || PUBLIC_PATHS.some(b => underPrefix(pathname, b)) || MARKETING_SLUGS.includes(pathname.slice(1));
const isPrivate = PRIVATE_PREFIXES.some(b => underPrefix(pathname, b));
if (!user && !isPublicPath && isPrivate) { ...existing redirect... }
// unknown, non-private path: fall through -> Next 404
```
  Risk: a NEW app route added later and not listed would be reachable unauthenticated at the middleware level (pages may still check auth themselves: [U], not audited). Mitigation (safe default): add a unit/CI check (scripts/check-seo.mjs style) that fails if a top-level dir in src/app is not in PUBLIC_PATHS, MARKETING slugs or PRIVATE_PREFIXES; AND/OR keep fail-closed for everything with a dot-less single segment? Alternative equally safe: keep current behaviour but resolve existence first: `if (!isPublicPath && !isPrivate) return NextResponse.rewrite(new URL("/__not-found", request.url), {status:404})`. Preferred = fall-through + CI guard. Also note `/sitemap` prefix in PUBLIC_PATHS matches nothing useful (sitemap.xml is exact-listed above).
- Add src/app/not-found.tsx (Romanian, `export const metadata = { title: "Pagina nu există", robots: {index:false} }`, links to /, /blog, /programare, a few marketing pages) - helps users and internal-link recovery.
##### 3.2 Redirect chains [V]
- `http://electrofield.ro/` -> 308 `https://electrofield.ro/` -> 308 `https://www.electrofield.ro/` (two hops). `http://www.` -> 308 https://www. (one hop). Config: NOT in code (vercel.json only `{"regions":["fra1"]}`; next.config.ts redirects have no host rules). Vercel API [V mcp list_project_domains, project electrofield]: `electrofield.ro` has `redirect: www.electrofield.ro, 308`; `www.electrofield.ro` is the production domain. The http->https hop is Vercel's forced HTTPS; it cannot be merged by config (Vercel does protocol upgrade first then the domain redirect). Impact negligible (response HSTS `max-age=63072000` [V] present, no includeSubDomains/preload). Optional: add `includeSubDomains; preload` header only after confirming all subdomains are HTTPS. Do nothing else; only ensure external profile links use the https://www URL.
- Trailing slash: `/blog/` and `/software-management-echipe-teren/` -> 308 to no-slash [V], canonical no-slash. Good, consistent. `/blog/index.html`, `/blog/:slug.html`, `/programare.html` redirect permanently via next.config.ts [V in code].
##### 3.3 Sitemap [V]
- 41 `<url>` entries live (1 home + 9 marketing + /blog + 29 posts [index excluded] ... count matches crawl of 41 incl. /programare,/termeni,/confidentialitate; crawl shows 41 pages, task said 40). Homepage has no `<lastmod>` and `/programare`, `/termeni`, `/confidentialitate` neither (src/app/sitemap.ts:30-38). Marketing lastmod = `page.updated` (2026-11-27/28) set manually; blog lastmod = dateModified from JSON-LD = datePublished (never updated). `<priority>` emitted but ignored by Google; harmless. `changefreq` absent (ignored anyway).
- Fix: homepage lastmod = max(marketing updated, newest article) ; for /programare,/termeni,/confidentialitate use real dates. Use lastmod only when truthful (Google distrusts constant "now").
- scripts/check-seo.mjs is stale: it asserts `urls.length === articles.length + 5` (now articles+12) and requests `/sitemap-blog.xml` (404 [V]) -> the script fails today; update it (also lists /signup etc.).
##### 3.4 IndexNow [V]
- Key file `public/d40280e4de21e42ba69e38e8aaa74cdc.txt` (content = the key, 32 hex chars) is served `200 text/plain` at https://www.electrofield.ro/d40280e4de21e42ba69e38e8aaa74cdc.txt, whitelisted in middleware. NOTHING pings IndexNow: grep for "indexnow" in src/scripts/docs/package.json only hits middleware.ts; scripts/publish-blog.mjs has no fetch/ping. Commit baba889 message ("site-ul să anunțe singur Bing") overstates: only the key exists. Fix: add a post-deploy step (GitHub Action on push to main, or end of scripts/publish-blog.mjs) that POSTs `https://api.indexnow.org/indexnow` JSON `{host:"www.electrofield.ro", key:"d40280...", keyLocation:"https://www.electrofield.ro/d40280e4de21e42ba69e38e8aaa74cdc.txt", urlList:[changed urls]}` (max 10k/URL batch). Note: Google does NOT support IndexNow (Bing/Yandex/Seznam/Naver do) - for Google use GSC sitemap submit + URL Inspection requests. Impact: Bing/Copilot/DuckDuckGo-ish discovery; Effort S.
##### 3.5 robots.txt [V]
`User-agent: * Allow: / Disallow: /api/ Disallow: /downloads/ Sitemap: https://www.electrofield.ro/sitemap.xml`. No per-bot rules: AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, OAI-SearchBot) are implicitly allowed. Good for AI Overview/LLM visibility (AI Overview cites sources). No change needed; if AI citation is a goal, ensure `OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User` stay allowed. Missing `/llms.txt` (307 to login [V]); add a static `public/llms.txt` (+ whitelist in middleware exact list) summarizing product and key URLs: cheap, speculative value [U].
Note: `/downloads/` is disallowed but listed in PUBLIC_PATHS; fine. /login,/signup etc. are noindex via root layout (robots noindex default) [V /login].
##### 3.6 Static blog HTML heads (public/blog/*.html, 29 files + index) [V, parsed all]
- lang="ro" on all; canonical present on all and equals the URL without .html; viewport present; no `<meta name="robots">` (indexable by default; fine); og:type article (index: website); og:locale ro_RO; og:image 1200x630 declared on all; twitter:card summary_large_image on all; twitter:image = og:image on all.
- og:image uniqueness: only 3 of 29 posts have a unique image (calculator-tarif, fisa-evidenta-gaze, proces-verbal-fotovoltaic: /blog/img/<slug>.jpg); the other 26 reuse 4 shared images: og-technician-phone.jpg 9x, og-van-dusk.jpg 7x (+ index), og-pylons.jpg 6x, og-city-night.jpg 3x. Site-wide (crawl, 41 pages): 20 pages use og-van-dusk.jpg, all 9 marketing pages + /programare,/termeni,/confidentialitate + blog index share it [V crawl pages.json]. Low direct ranking effect, but weak Discover/social CTR & image-search; generate per-article cover (the 3 long guides already have).
- No `<meta name="author">`, no visible byline, no visible date (no <time>) - see section 2. article:published_time/modified_time present, date-only, modified==published in all.
- Meta description lengths (chars): 145-163 on posts; >155 on 15 of 29 posts (max 163), >160 on 13 pages total in the 41 [V]. Google truncates by pixel width (~920 px ≈ 155-160 chars) so 160-163 will cut occasionally; not critical. Marketing/home descriptions are the long ones: home 179, /firme-fotovoltaice 177, /foaie-de-parcurs-electronica 176, /stoc-materiale-pe-masini 172, /aplicatie-tehnician 170, /software-management-echipe-teren 168, /firme-gaze 167, /facturare 167, /firme-instalatii-electrice 161. 9 of 10 of them exceed 160: trim to <=155 keeping the keyword first (src/lib/marketing-pages.ts description fields; homepage in src/app/page.tsx metadata).
- Titles: all <=60 chars (max 60), none duplicated [V]. Descriptions: no duplicates [V]. <title> on posts differs from H1 intentionally (short title + " | ElectroField"); og:title != headline: ok.
- H1: exactly 1 per page (41/41) [V].
##### 3.7 Cannibalization: homepage vs /software-management-echipe-teren [V]
- Identical H1 "Software de management pentru electricieni și echipe de teren" (the only duplicated H1 of 41). Titles differ: home "Software management electricieni și echipe de teren" (51), page "…" (45). Meta descriptions begin identically ("Software de management pentru electricieni, instalatori și echipe mobile:"). Both pages target the same query -> Google must pick; both are 1 week old. Recommendation: homepage = brand + category umbrella ("ElectroField - program pentru firme de instalații cu echipe în teren"), keep /software-management-echipe-teren for the generic head term; differentiate H1 of one (e.g. home H1 "ElectroField: programul firmei de instalații, de la birou la teren" / page H1 stays) and cross-link with exact-match anchor from home (link exists). Note research data: this head query has ZERO measured volume, so the cannibalization is cheap to resolve; the high-volume terms (foaie de parcurs 1600, PRAM 590, revizie gaze 720) are served by blog posts, not by money pages.
##### 3.8 Internal link graph (from crawl pages.json: 41 pages, links deduped per source page) [V]
- No orphans (every URL has >=2 inlinks). Inlink counts: /confidentialitate 39, /termeni 38, /blog 38, / 38, /programare 35 (footer/nav sitewide), /firme-instalatii-electrice 28, /firme-fotovoltaice 28, /firme-gaze-verificari-revizii 27, /aplicatie-tehnician 25, /facturare-smartbill-oblio 13, then 11 (cum-calculezi-profitul), 10 (/foaie-de-parcurs-electronica), 9 each (/stoc-materiale-pe-masini, /pontaj-tehnicieni, /software-management-echipe-teren, gestionare-echipe-de-teren).
- Weakest: /blog/tehnician-vs-administrator 2; 3 each: e-factura-b2b, verificare-pram (the 590/mo-search topic!), gestiune-materiale, contract-mentenanta-camere, urmarire-gps; 4: verificare-revizie-gaze (720/mo), service-sezonier, model-oferta, clientii-dificili, fisa-evidenta-gaze (a flagship guide, only 4 inlinks).
- Priority mismatch: the page meant to rank for the main query, /software-management-echipe-teren, has just 9 inlinks (vs 28 for the three trade pages and 25 for aplicatie-tehnician): not in the sitewide nav/footer? (it appears from home + marketing "others" list). High-demand money-adjacent topics (PRAM 590, revizie gaze 720, foaie de parcurs 1600) have 3-5 inlinks. Fix: put /software-management-echipe-teren in header/footer nav sitewide; in each blog post add contextual links to the trade page + 2-3 sibling posts (related lists exist via `page.related` for marketing pages: src/lib/marketing-pages.ts `related`; blog posts link out mainly to marketing pages). Anchor texts: not captured in pages.json (hrefs only) [unverified]; spot check in the fetched home.html shows nav/footers use brand-like labels ("Electrice","Gaze","Fotovoltaice","Blog","Programează un demo") - descriptive keyword anchors ("software management echipe teren", "foaie de parcurs electronică") should be used in body links.
- Images without alt (crawl `noalt`): 7 on home (logos x4, 3 hero/bg images with alt="" decorative: acceptable), 1 per marketing page (logo-mark in header, decorative). No real issue.

#### 4. Prioritized fix list
| # | Issue | Evidence | Files | Change | Impact | Effort |
|---|---|---|---|---|---|---|
| 1 | Unknown URLs 307 to /login instead of 404 | curl /pagina-inexistenta=307; /blogfoo=404 | src/middleware.ts (isPublicPath/redirect block), new src/app/not-found.tsx | PRIVATE_PREFIXES list + segment-aware `underPrefix`; only redirect private prefixes; others fall through to 404/noindex; CI guard that every top-level app dir is classified; RO not-found page | High (crawl hygiene, GSC "redirect" noise, correct 404) | S |
| 2 | IndexNow never pinged | only key file; no code calls api | new .github/workflows/indexnow.yml or scripts/publish-blog.mjs | POST changed URLs after deploy | Medium (Bing) | S |
| 3 | Home vs /software-management-echipe-teren duplicate H1 + intro | crawl: identical H1, similar desc | src/components/marketing/hero.tsx:55, src/app/page.tsx metadata, src/lib/marketing-pages.ts | Differentiate H1/description; one page per intent | Medium-High | S |
| 4 | Internal links to key pages thin | 9 inlinks to main target; PRAM 3, revizie gaze 4, gaze fișă 4 | header/footer components (src/components/marketing/*, src/app/[slug]/page.tsx top nav, public/blog/*.html template/nav), blog posts | Add the target page to sitewide nav/footer; add 3 contextual links per post with keyword anchors; link PRAM/gaze posts to each other & to trade page | Medium-High | M |
| 5 | SoftwareApplication has no offers/rating; Organization lacks sameAs/address | JSON-LD parse | src/app/page.tsx (JSON-LD), src/lib/seo.ts | Add offers (if public price/trial), screenshot, installUrl/downloadUrl; Organization address, legalName, taxID, sameAs; no fake ratings | Medium (rich result only if offers/rating) | S |
| 6 | Blog posts: no visible byline/date, author = Organization, mainEntityOfPage as string, modified==published | HTML grep, JSON-LD | public/blog/*.html (+ scripts/seo-blog-normalize.py, scripts/publish-blog.mjs templates) | Visible "Publicat/Actualizat" + `<time>`; Person author w/ sameAs; mainEntityOfPage {"@type":"WebPage","@id"}; image array; true dateModified | Medium (E-E-A-T, freshness) | M |
| 7 | 26/29 posts share 4 og images; all marketing share 1 | crawl og | public/blog/*.html, publicPageMetadata in src/lib/seo.ts (hardcoded og-van-dusk.jpg) | Per-page og image (even template-generated with title) | Low-Medium (CTR social/Discover) | M |
| 8 | Sitemap lastmod missing for /, /programare, /termeni, /confidentialitate; stale check-seo.mjs | sitemap.xml | src/app/sitemap.ts:30-38, scripts/check-seo.mjs | Add true lastmod; fix test expectations (articles+12, no sitemap-blog.xml) | Low | S |
| 9 | Meta descriptions >160 (13 pages) | crawl | src/lib/marketing-pages.ts, src/app/page.tsx, public/blog/*.html | Trim to <=155 | Low | S |
| 10 | Mobile LCP: reveal animations + render delay 380-560 ms; /blog LCP 2.5 s | Lighthouse | src/components/marketing/hero.tsx (mk-reveal-*), public/blog/index.html first card img | No opacity reveal on above-fold text; fetchpriority=high + width/height on first blog card image | Low-Medium (CWV buffer) | S |
| 11 | JS 180 KiB on content pages; TBT 230-310 ms mobile; unused 20-43 KiB | Lighthouse | src/app/layout.tsx (PreventZoom, SiteTracker, PublicWebAnalytics), marketing client components | Move app-only components to (app)/mobil layouts; lazy load GSAP/scroll code; browserslist modern to drop 12 KiB polyfills | Low (CWV already green) | M |
| 12 | A11y: contrast on home mockup labels, aria-label on span, blog link label mismatch/target-size, unsized images | Lighthouse | marketing css modules (phoneListRole, phoneTab, pdIdx, figcaption), footer logo component, public/blog/*.html | Raise contrast; role="img"; add width/height; fix aria-label vs text | Low | S |
| 13 | /llms.txt 307, no AI-specific signals | curl | public/llms.txt, middleware exact-list | Add concise llms.txt | Low (speculative) | S |
| 14 | Apex->www 2 hops | curl; Vercel domain redirect 308 | Vercel dashboard (not code) | Leave; ensure all external links use https://www | Negligible | - |
| 15 | Webpage JSON-LD on marketing refs unresolved #software/#website; breadcrumb names long | page parse | src/app/[slug]/page.tsx:46-72 | Include nodes or reference; short crumb name; add image/datePublished | Low | S |

Caveats: Lighthouse lab runs from one sandbox location (simulated throttling), not field data; GSC reporting classification of the 307 is inferred from Google's documented behavior [U]; Google rich-result eligibility statements are from general knowledge (FAQ restriction since 2023, SoftwareApplication requires offers or aggregateRating) not re-fetched today [U].
Report path: /tmp/claude-0/-home-user-CRM/bf78b7b1-b8bb-53ac-9009-54dcd55acec8/scratchpad/research/R4-technical.md


---

## B.6 Raport R5a-content-blog

### R5a - Audit de conținut blog ElectroField (28 articole + index) - 28 nov 2026

Legendă: [V] verificat (am citit fișierul / pagina, sursa dată); [N] neverificat (din memorie sau sursă secundară slabă - de confirmat înainte de publicare).
Date brute extrase din public/blog/*.html: scratchpad/research/blogdata.txt (titlu, meta, H1, H2, linkuri, schema pe articol).
Notă: "29 articole" = 28 articole + blog/index.html (29 fișiere). WebSearch-ul de aici e US-only și NU reflectă Google.ro; pentru SERP-ul real RO nu pot afirma poziții. Nu am putut extrage tabele de volum noi (DataForSEO epuizat) - folosesc doar lista de volume din brief.

#### 1. Constatări transversale [V, din HTML]
1. Autor = doar Organization "ElectroField" în BlogPosting (public/blog/model-oferta-...html, JSON-LD). Niciun autor persoană, nicio pagină "despre autor/revizuit de electrician autorizat ANRE". E-E-A-T (YMYL-adiacent: lucrări electrice/gaze, ANRE, fiscal) e punctul slab nr. 1.
2. dateModified == datePublished la toate (publicate 19 oct - 25 nov 2026). Nu există "actualizat la" vizibil + istoric. Pentru subiecte legislative (e-Factura, prosumator, gaze) trebuie dată de revizuire.
3. Lungime: 14 articole au 350-700 cuvinte (subțiri față de ce se vede în SERP; competitorii contabili au 550-1400). Doar 4 sunt "profunde": fisa-evidenta gaze (~2100 w), proces-verbal PIF fotovoltaic (~1860), calculator tarif (~1990) - restul 400-1000 (numărătorile includ footer/CTA, deci ~10% mai puțin).
4. Schema: BlogPosting + BreadcrumbList peste tot; FAQPage doar la 3 articole (tarif, fisa gaze, PV PV). Lipsesc: HowTo nu (Google l-a retras din rich results), dar lipsesc FAQ pe articolele cu volum (PRAM, gaze, ANRE, prosumator, oferta) și SoftwareApplication/WebApplication pentru calculatoare.
5. Linkuri interne: aproape toate articolele (cele din octombrie) au același bloc generic: /aplicatie-tehnician, /firme-*, /programare, /login, /termeni, /confidentialitate. Link-uri contextuale între articole sunt rare și la ancore generice. Hub-uri lipsă: nu există pagină-pilon pe "documente ANRE" / "gaze" / "fotovoltaic" care să adune clusterul. Singurul link spre /foaie-de-parcurs-electronica e din reducere-timpi-deplasare (1 link).
6. Titluri: toate <=60 caractere (ok), meta 145-163 (6 peste 160: autorizatii 160, profit 160, clienti 160, gestiune 160, garantie 163, excel 162, panouri 163, tehnician 162, gestionare 160 -> trunchiate în SERP; scurtează la <=155).
7. Calculatoare/instrumente: 13 articole au un calculator JS (avantaj real, unic față de competitorii text). Dar niciunul nu e descărcabil (PDF/XLSX) în afara PV PV (generator PDF) și scadențarul gaze. Descărcările (model Word/PDF/XLSX) sunt ce rankează pe "model ..." în RO.
8. Imagini: 2-3 <img> per articol (logo/hero), fără imagini originale (poze de teren, scheme, bulet. exemplu completat). Gap E-E-A-T.
9. Surse: articolele noi (nov) au secțiune "Surse și documentare", cele din octombrie nu. PRAM cită Brig.ro și Rubinian (furnizori comerciali) și recunoaște "practică de piață, nu text de lege" [V, fișier]. Insuficient pentru YMYL.
10. Canibalizări reale:
   - Gaze: verificare-revizie-instalatie-gaze (cititor final) vs fisa-evidenta-... (Ord. 179/2015, pentru firme) vs service-sezonier-centrale-termice. Sunt intenții diferite DAR primele două țintesc aceleași cuvinte ("verificare/revizie instalatie gaze"). Decizie: articolul "cititor final" = țintă pentru cele 720+390 volum; fișa = pentru firme (cuvinte "fisa de evidenta gaze" volum 0 -> rămâne ca asset de autoritate/lead, nu de trafic).
   - Proces-verbal: model-proces-verbal-raport-lucrare (generic) vs proces-verbal-punere-in-functiune-fotovoltaic-model vs documente-predare-client. "model proces verbal" (590) e generic și competiția e juridică/primării; articolul generic e subțire (771 w brut / ~420 text) și nu are fișier descărcabil.
   - Cost/bani: calculator-tarif / cum-calculezi-profitul / cat-avans / model-oferta se suprapun parțial tematic (preț/marjă) dar nu pe cuvinte-cheie; leagă-le într-un cluster "Prețuri și oferte".
   - Gestionare echipe/program management/excel-vs-aplicatie/tehnician-vs-administrator: 4 articole despre același "cum gestionezi echipe" cu zero volum măsurabil ("software management echipe teren" = 0). Consolidare recomandată (vezi tabel).

#### 2. Tabel articol cu articol

Format: keyword realist | intenție | titlu actual / H1 / meta | cuvinte | recomandare.
Volumurile sunt din lista din brief (luna, RO) dacă nu scrie altfel; "?" = necunoscut.

| # | Fișier (public/blog/...) | Keyword primar | Intenție | Titlu actual (len) | Cuv. | Recomandare |
|---|---|---|---|---|---|---|
| 1 | verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti | revizie instalatie gaze (720) + verificare instalatie gaze (390) + verificare gaze la 2 ani (70) | informațional/tranzacțional local (cititor final: când, cât costă, cine) | "Verificare și revizie gaze: când se face, ce pregătești" (55) | ~590 | EXPAND + RETITLE, prioritate maximă (brief 3.2) |
| 2 | fisa-evidenta-verificare-revizie-gaze-scadentar | fisă evidență gaze (0) | B2B: firma de verificări | "Fișa de evidență gaze și scadențar pe bloc (Ord. 179/2015)" (58) | ~2100 | KEEP; adaugă link din #1; autor persoană; descărcare XLSX scadențar. Nu o compeți pe volum, e asset de autoritate |
| 3 | verificare-pram-rezistenta-priza-de-pamant-periodicitate | verificare pram (590), buletin pram (260), priza de pamant (480), masuratori pram (90) | informațional + tranzacțional (caut firmă/preț) | "Verificarea PRAM: ce este și cât de des se face" (47) | ~580 | EXPAND + SPLIT în 2 (brief 3.3) |
| 4 | autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira | autorizatie anre electrician (480), legitimatie anre (20) | informațional (cum obțin / ce grad / cât costă) - NU se potrivește cu titlul actual ("cine semnează, când expiră") | "Autorizații ANRE: cine semnează lucrarea și când expiră" (55) | ~540 | REWRITE pe intenția reală + articol nou (brief 3.4) |
| 5 | model-proces-verbal-raport-lucrare | model proces verbal (590) | descărcare șablon | "Model proces-verbal de lucrare pentru instalații" (48) | ~420 | EXPAND + fișier descărcabil (brief 3.5) |
| 6 | proces-verbal-punere-in-functiune-fotovoltaic-model | proces verbal punere in functiune (40); long-tail PV | șablon + generator | "Proces-verbal punere în funcțiune fotovoltaic: model" (52) | ~1860 | KEEP (cel mai bun articol). Adaugă autor/revizor, imagine fișă completată, link din #5 și #10 |
| 7 | dosar-prosumator-etape-termene-atr | dosar prosumator (260) | informațional (client + instalator) | "Dosar de prosumator: etape, termene ATR și întârzieri" (53) | ~570 | EXPAND + VERIFICARE LEGISLATIVĂ urgentă (brief 3.6) |
| 8 | model-oferta-lucrari-electrice-fotovoltaice | model oferta (70) | șablon | "Model de ofertă pentru lucrări electrice și fotovoltaice" (56) | ~420 | EXPAND + șablon descărcabil (brief 3.7) |
| 9 | e-factura-b2b-2026-... | e-factura b2b (10) | informațional, volum minim | "e-Factura B2B 2026 pentru firmele de instalații" (47) | ~640 | KEEP, verifică termenele (se schimbă); nu e țintă SEO, e utilitar. Actualizează dată |
| 10 | checklist-instalare-sistem-fotovoltaic | "checklist fotovoltaic" (0) / "montaj panouri fotovoltaice" (880, intenție client!) | firmă: checklist | "Checklist instalare fotovoltaic: de la vizită la predare" (56) | ~450 | EXPAND ușor + descărcabil PDF; separat NOU articol client pentru 880 (vezi §4) |
| 11 | panouri-fotovoltaice-produc-putin-verificari | long-tail "panouri fotovoltaice produc putin" (? probabil >0, neverificat) | client + firmă | "Panouri fotovoltaice care produc puțin: ce verifici" (51) | ~650 | KEEP + expand pe fața client (cauze: umbrire, invertor, mizerie, degradare), FAQ schema |
| 12 | documente-predare-client-dupa-instalare | "documente predare instalatie" (?) | firmă | "Ce documente predai clientului după o instalare" (47) | ~380 | MERGE în #5 (proces-verbal) sau în hub "Documente"; subțire, canibalizează |
| 13 | garantie-legala-lucrari-electrice-fotovoltaice-... | "garantie lucrari electrice" (?) | informațional | "Garanția legală la lucrări electrice și fotovoltaice" (52) | ~570 | KEEP; verifică citarea Legii 10/1995 (termene pe categorii de importanță) cu text oficial; adaugă FAQ |
| 14 | calculator-tarif-ora-electrician-instalator | "tarif electrician pe ora" (0), "cat costa electrician" (? nemăsurat în brief) | calculator + preț | "Tarif minim pe oră pentru electricieni, 2026 | ElectroField" (59) | ~1990 | KEEP. Cel mai bun candidat de link-magnet (presă locală/asociații). Retitle fără brand pipe (hrănește 60 chr): "Calculator tarif orar electrician 2026" |
| 15 | cum-calculezi-profitul-pe-lucrare | "calcul profit lucrare" (?) | informațional | "Cum calculezi profitul pe o lucrare (cu exemplu)" (48) | ~400 | MERGE cu #14 și #16 în "Prețuri și marjă" sau expand cu calculator |
| 16 | cat-avans-ceri-lucrari-electrice-fotovoltaice | "avans lucrari" (?) | informațional | "Cât avans ceri la o lucrare electrică sau fotovoltaică" (54) | ~680 | KEEP (nișă, fără concurență probabilă, dar fără volum) |
| 17 | evidenta-orelor-tehnicieni-teren-pontaj | pontaj online (110, CPC 6.2), aplicatie pontaj (70, CPC 11), program pontaj (40), aplicatie pontaj angajati (30) | tranzacțional soft - intenție comercială puternică | "Pontajul tehnicienilor din teren: ce conține, fără hârtii" (57) | ~480 | EXPAND + RETITLE: singura zonă cu CPC mare (6-11 EUR) unde chiar vindem. Vezi §3.8 |
| 18 | urmarire-gps-echipe-teren-gdpr | "gps angajati gdpr" (?) | informațional/juridic | "Urmărirea angajaților cu GPS: ce cere GDPR | ElectroField" (57) | ~650 | KEEP; adaugă link către foaie de parcurs electronică; citează ANSPDCP cu URL (sursele sunt "cazuri raportate") |
| 19 | reducere-timpi-deplasare-lucrari | zero | informațional soft | 59 chr | ~410 | MERGE în #20 (gestionare echipe) sau redirect |
| 20 | gestionare-echipe-de-teren | "management echipe teren" (0) | soft-top-of-funnel | "Cum gestionezi echipele de tehnicieni din teren" (47) | ~540 | KEEP ca pilon pentru clusterul "operațiuni"; absoarbe #19, #21, #25 prin linkuri/merge |
| 21 | excel-sau-aplicatie-gestionare-lucrari | "excel gestionare lucrari" (?) | comparativ | "Excel, WhatsApp sau aplicație pentru echipe de teren?" (53) | ~390 | KEEP (BOFU, bun pentru vânzări); adaugă șablon Excel gratuit descărcabil = lead magnet |
| 22 | program-management-firma-instalatii | "program management firma instalatii" (0) | comparativ/BOFU | "Program de management pentru firme de instalații: 8 criterii" (60) | ~370 | EXPAND: în SERP apar Electrogest, GoManager, WorkApp, Om Pe Teren (brief). O pagină "Alternative/comparație" onestă, cu tabel, ar capta intenția; atenție la promisiuni nedovedite |
| 23 | gestiune-materiale-ce-ai-cumparat-ce-ai-folosit | program gestiune stocuri (70) | tranzacțional soft | 47 chr | ~410 | EXPAND + RETITLE spre "program gestiune stocuri instalații" (vezi §3.9) |
| 24 | contract-mentenanta-camere-supraveghere-securitate | "contract mentenanta camere supraveghere" (? nemăsurat) | tranzacțional B2B | 52 chr | ~510 | KEEP + expand: model contract descărcabil (ce rankează) |
| 25 | service-sezonier-centrale-termice | "revizie centrala termica" (? probabil >720-class; neverificat) | client/firmă | 57 chr | ~375 | EXPAND: intenția client ("revizie centrala termica cat costa/cand") e probabil mare; acum articolul e pe partea firmei. Nu folosi cifre de preț fără sursă |
| 26 | cum-gestionezi-clientii-dificili | zero | soft | 59 chr | ~700 | KEEP cu prioritate mică/ noindex nu e necesar; mesaje-șablon ca imagini = link-bait social |
| 27 | tehnician-vs-administrator | zero | soft | 55 chr | ~350 | MERGE în #20 (subțire, fără intenție de căutare) |
| 28 | (index.html) | blog | hub | "Ghiduri pentru firme de instalații | Blog ElectroField" (54) | ~720 | RESTRUCTURARE pe clustere (vezi §5) |

Merge/redirect propus: #12->#5, #19->#20, #27->#20, #15->#14 (sau cluster). Total consolidat: -4 pagini subțiri, mai mult link equity pe 5-6 piloni. Atenție: site-ul are doar ~1 săptămână și Google arată ~29 indexate; nu redirecționa înainte să fie indexate dacă vrei semnale curate - alternativ, lasă-le cu canonical către pilon.

#### 3. Brief-uri complete pe oportunitățile cu volum

##### 3.1 Foaia de parcurs (1600) + model foaie de parcurs (260) + foaie de parcurs electronică (10) - NU EXISTĂ articol
Context: cel mai mare volum din tot setul. Intenție: contabili/antreprenori care vor model + reguli fiscale (nu doar electricieni). Concurență [V, fișă fetch]: fiscalitatea.ro "Foaia de parcurs: condiții de întocmire, arhivare și model" (~1200-1400 w; H2: ce este / când e obligatorie / ce elemente / model / cât timp se păstrează / format electronic; citează Ordin 1296/2021 anexă și pct. 16 alin. (2) din Normele metodologice ale Codului fiscal; modelul e imagine, fără descărcare). Alte rezultate [V, WebSearch]: infotva.manager.ro (conținut obligatoriu), contabilul.manager.ro (5 condiții pentru arhivare electronică - paywall parțial), Drumio (aplicație AI, economica.net). Gap-uri pe care le putem acoperi: șablon Excel/PDF descărcabil gratuit (fiscalitatea nu oferă link), exemplu completat pentru o echipă de instalatori (mai multe opriri/lucrare), generator online, ghid pentru "mașina de serviciu cu 2-3 tehnicieni", foaia electronică (GPS + arhivare).
Atenție: competiția e în mare parte portaluri contabile cu autoritate ridicată; un site de 1 săptămână nu va intra top 10 pe "foaie de parcurs" simplu. Ținta realistă 3-6 luni: "model foaie de parcurs xlsx/word", "foaie de parcurs instalator/electrician/service", "foaie de parcurs electronică" (volum mic, dar intenție exactă pentru produs). Unverified: cerințe exacte pentru arhivarea electronică (am văzut doar titlul articolului Manager.ro) - citește Codul fiscal/Normele și OPANAF 1296/2021 înainte de a afirma.

- URL propus: /blog/foaie-de-parcurs-model-completare (+ pagina feature /foaie-de-parcurs-electronica rămâne produsul; link bidirecțional; nu face canibalizare: feature = aplicația, blog = ghid+șablon).
- Title (<=60): "Foaie de parcurs: model Excel/PDF + cum o completezi" (52)
- Meta (140-155): "Ce trebuie să conțină foaia de parcurs, model gratuit Excel și PDF, exemplu completat pentru echipe de teren și cum o păstrezi electronic." (141)
- H1: "Foaia de parcurs: model gratuit și cum o completezi corect (cu exemplu pentru echipe de instalatori)"
- Outline:
  - H2 Ce este foaia de parcurs și când e obligatorie (TVA/impozit: utilizare exclusivă vs mixtă; limitarea 50%) [fiscal - citează text legal, verifică]
  - H2 Ce trebuie să conțină (conținut minim vs recomandat) - tabel câmp / obligatoriu? / exemplu
  - H2 Model foaie de parcurs (descărcare XLSX + PDF + DOCX) + imagine model Ordin 1296/2021 (verifică forma anexei)
  - H2 Exemplu completat: tehnician cu 3 lucrări pe zi (km, consum, scop: "intervenție la client X, adresa")
  - H2 Cum calculezi consumul și norma proprie (calculator: km × normă; comparare cu alimentările)
  - H2 Foaie de parcurs pe mai multe mașini / mai mulți șoferi
  - H2 Cât timp se păstrează (5 ani prescripție fiscală - verifică) 
  - H2 Foaia de parcurs electronică: condiții, GPS, arhivare, semnătură
  - H2 Greșeli care duc la nedeductibilitate
  - H3/FAQ: Cine o semnează? Se poate completa lunar? Ce diferă la foaia de parcurs pentru ridicări de material? Se poate pe telefon?
- PAA/Întrebări de acoperit: "Ce trebuie să conțină o foaie de parcurs?", "Cât timp se păstrează foile de parcurs?", "Foaia de parcurs este obligatorie?", "Cum se completează foaia de parcurs?", "Se poate face foaia de parcurs electronic?" [N: PAA exact nu l-am putut verifica]
- Tool: generator foaie de parcurs în pagină (câmpuri minime -> PDF) + Excel descărcabil cu formule (consum, total km). Schema: Article + FAQPage + SoftwareApplication(WebApplication) pentru generator.
- Linkuri interne: către /foaie-de-parcurs-electronica, /blog/urmarire-gps-echipe-teren-gdpr, /blog/reducere-timpi-deplasare, /blog/evidenta-orelor-tehnicieni-teren-pontaj.
- Surse: Ordinul MFP nr. 1.296/2021 (model foaie de parcurs) [V ca citat în fiscalitatea.ro, de verificat în Monitorul Oficial]; Codul fiscal art. 25 alin. (3) lit. l) și Normele metodologice pct. 16 [N - verifică numerotarea actuală]; Legea contabilității 82/1991 (păstrare documente) [N].

##### 3.2 Revizie instalație gaze (720) + verificare instalație gaze (390) + verificare gaze la 2 ani (70)
Articol existent: verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti (~590 w, are calculator scadențe, are secțiune surse). Titlul actual nu conține "revizie instalație gaze" ca expresie exactă la început.
Concurență [V]: bzi.ro "Cât costă revizia la gaze de 2 ani" - ~400 w, fără bază legală numită, preț 150-250 lei apartament, consecințe: sistare furnizare, asigurare; zero citare ANRE. playtech.ro/2025 "Cât te costă revizia la gaze", profit.ro "Verificarea instalației de gaz: ce ești obligat prin lege", newsweek.ro "La câți ani trebuie să faci revizia la gaz", financiarul.ro, hornbach.ro (centrală termică), infocons.ro. Din WebSearch [V, rezumat, ne-citat din ANRE]: verificare la 2 ani, revizie la 10 ani; termenul de 2 ani se resetează după revizie; ANRE a propus ca revizia în anul respectiv să țină loc de verificare (profit.ro: "clienții nu mai sunt obligați să efectueze verificarea periodică în anul în care este programată o revizie" - verifică dacă a intrat în vigoare, e o schimbare majoră pe care competiția o tratează) ; durată 30-45 min verificare, ~1h30 revizie; autorizație ANRE tip EDIB pentru verificare/revizie [N, din rezumat]; prețuri 150-350 lei [N, estimări din presă].
Gap-uri față de ei: preț cu intervale pe situație (apartament/casă/bloc), ce se întâmplă pas cu pas, ce face clientul la vizită (acces la aragaz/centrală, ventilație), cum verifici firma (autorizație EDIB, legitimație, fișă IUGN), cine plătește (proprietar vs asociație), ce e "fișa de verificare tehnică" și ce primești (Ghid Fișe Verificare Tehnică IUGN - Distrigaz Sud Rețele, iul. 2026 [V ca URL din căutare]), diferența verificare/revizie (există), calculator scadență (există) + calendar .ics.
- Title (<=60): "Revizie instalație gaze: când, cât costă, cine o face" (52) [alternativă: "Verificare și revizie gaze: la 2 și 10 ani, prețuri"]
- Meta: "Verificarea gazelor la 2 ani și revizia la 10 ani: ce include, cât costă, ce documente primești și cum verifici dacă firma e autorizată ANRE." (142)
- H1: "Revizia și verificarea instalației de gaze: când se fac, cât costă și ce se întâmplă dacă o amâni"
- Outline: H2 Verificare la 2 ani vs revizie la 10 ani (tabel) | H2 Cine trebuie să o facă (proprietar, asociație, chiriaș) | H2 Cât costă (intervale, ce influențează; marcat "orientativ, [lună an]") | H2 Cum decurge vizita (pas cu pas, 30-90 min) | H2 Ce pregătești | H2 Ce primești (fișa/procesul-verbal) | H2 Ce se întâmplă dacă nu o faci (sistare, răspundere) | H2 Cum verifici firma (autorizație ANRE, legitimația instalatorului, EDIB) | H2 Modificări recente 2026 (revizia înlocuiește verificarea? - doar dacă e confirmat) | H2 Calculator scadență | H2 FAQ.
- PAA: "La cât timp se face revizia la gaze?", "Cât costă revizia gaze?", "Ce se întâmplă dacă nu fac revizia?", "Cine plătește verificarea la bloc?", "Verificarea gazelor e obligatorie?" 
- Schema: Article + FAQPage + WebApplication (calculator) + (opțional) LocalBusiness NU.
- Linkuri: out -> /blog/fisa-evidenta-... ("pentru firme"), /blog/autorizatii..., /firme-gaze-verificari-revizii (landing B2B); in <- service-sezonier, autorizatii, documente-predare.
- Surse: Ordinul ANRE nr. 179/2015 (Procedura privind verificările și reviziile tehnice ale instalațiilor de utilizare a gazelor naturale), forma actualizată (PDF axpo.com, 2020, citat în rezultate [V ca existent, de verificat versiunea curentă]); Legea energiei electrice și a gazelor naturale nr. 123/2012 [N]; Ord. ANRE 98/2015 și 83/2014 (autorizarea operatorilor / instalatorilor) [V ca citate de legeaz.net]; Ghid Fișe Verificare Tehnică IUGN, distrigazsud-retele.ro 2026 [V URL].
- Audiență dublă: scrie pentru client (volumul), dar include box "Ești firmă? vezi fișa de evidență/scadențar" = pasaj spre produs.

##### 3.3 PRAM: verificare pram (590) + buletin pram (260) + priza de pamant (480) + masuratori pram (90)
Articol existent: ~580 w, are calculator. Probleme [V]: surse = furnizori comerciali; valorile (4 ohmi priză, 10 ohmi paratrăsnet) prezentate ca "uzuale"; periodicitate vagă (6/12/24 luni). Competiție [V]: spotmedia.ro (advertorial 2022, ~600 w, 4 H2, FĂRĂ referințe legale), evz.ro (revizii la bloc), rubinian.com/brig.ro (furnizori). Nimeni nu citează normativ -> loc liber pentru un articol cu bază tehnică corectă. Dar atenție: eu nu am găsit surse românești verificabile pentru valori/periodicitate (WebSearch a dat doar ANRE Moldova, irelevant). Presupuneri de verificat înainte de publicare [N]: PRAM = "Probe, Reglaje, Automatizări, Măsurători"/"Protecții prin relee, automatizări și măsurători" (spotmedia dă a doua; denumirea e folosită în exploatare); Normativ I7/2011 (cu completări 2023) - capitolul de verificări; NTE 007/08/00; PE 116/94 (încercări și măsurători); I20-2022 (paratrăsnet); SR HD 60364-6 (verificare inițială și periodică); NP 061/2002 (?); Normele ANRE pentru exploatarea instalațiilor electrice ale consumatorilor. Cere unui electrician autorizat să valideze valorile (R ≤ ... ohmi pe tip de schemă TT/TN) și periodicitățile.
Recomandare: SPLIT în două pagini cu intenții diferite:
 A) /blog/verificare-pram-ce-este-cand-se-face-cat-costa (verificare pram + masuratori pram) - ghid + calculator existent.
 B) /blog/priza-de-pamant-rezistenta-masurare-valori (priza de pamant 480) - "ce este", tipuri, cum se măsoară (metoda în 3 puncte, 2 electrozi auxiliari), valori, cum se îmbunătățește, când se verifică.
 C) secțiune/un fișier: "Buletin PRAM: model + ce conține" (buletin pram 260) - preferabil o pagină cu model descărcabil (imagine completată + DOCX).
- Title A (<=60): "Verificare PRAM: ce este, cât costă, la cât timp se face" (54)
- Meta A: "Verificarea PRAM: ce măsoară, ce conține buletinul, la ce interval se repetă și cât costă. Cu lista de documente și un calculator de scadență." (140)
- H1 A: "Verificarea PRAM: ce este, ce conține buletinul și cât de des se face"
- Outline A: H2 Ce înseamnă PRAM (definiție + ce nu e) | H2 Ce se măsoară (rezistența prizei, continuitate PE, rezistența izolației, declanșare DDR/protecții, paratrăsnet) | H2 Cine poate emite buletinul (autorizare ANRE/laborator; metrolog: aparatul etalonat) | H2 Când e obligatoriu (punere în funcțiune, periodic, după modificări; la preluare de operator, asigurări) | H2 Cât costă (intervale pe tip: apartament/casă/firmă; marcat orientativ) | H2 Cum arată buletinul + exemplu completat | H2 Calculator | H2 Evidența pentru firme (link produs) | H2 FAQ.
- Title B: "Priza de pământ: valori, măsurare și când se verifică" (54); meta: "Cum se măsoară rezistența prizei de pământ, ce valori sunt acceptate, cum o îmbunătățești și cât de des se verifică. Explicat pe înțelesul clientului." (150)
- PAA: "Ce este verificarea PRAM?", "Cât costă PRAM?", "Cât de des se face PRAM?", "Ce valoare trebuie să aibă priza de pământ?", "Cine poate face buletin PRAM?", "Ce se întâmplă dacă nu am PRAM?"
- Tool: generator buletin-model (fără valoare juridică, "model orientativ"), tabel conversie. Schema: Article + FAQPage + WebApplication.
- Linkuri: <- autorizatii (cine semnează), contract-mentenanta (mentenanță = PRAM periodic), checklist; -> /firme-instalatii-electrice.
- Riscul editorial: afirmații despre valori/periodicitate fără normativ = sub standardul YMYL; fără validare ANRE-autorizat nu publica cifre ca "norma".

##### 3.4 ANRE: autorizatie anre electrician (480) + legitimatie anre (20)
Gap de intenție: oamenii caută "cum obții autorizația ANRE de electrician" (grade, examen, acte, cost). Articolul existent răspunde "cine semnează și când expiră" (public diferit, deja are calculator de alertă - bun pentru firmă).
Concurență [V]: infocontact.ro "Ghid 2026: Obținerea Autorizației ANRE pentru Electricieni" (~1100-1300 w; H2: de ce, grade I-IV A/B, studii și experiență, înregistrare online POSF, examen, costuri, valabilitate 5 ani, greșeli) - PROBLEMĂ: site-ul își declară conținutul "informativ", nu citează numere de ordin; grade/taxe/POSF din acest articol sunt NEVERIFICATE de mine (WebSearch nu a confirmat IA/IB/IIA/IIB din sursă oficială). Cursuri: upet.ro/cursanre (tematică și bibliografie). Gap: nimeni nu pare să explice clar autorizația persoană fizică vs atestat vs autorizația firmei/operatorului economic, ce poate semna fiecare grad, diferența electrice vs gaze (legitimație instalator gaze ≠ autorizație electrician), cum verifici online dacă cineva e autorizat (registrul ANRE), valabilitate (Ordinul ANRE 66/2023? apare în căutare ca "ordin anre 66 2023" legeaz.net - [N], verifică dacă e regulamentul de autorizare electricieni).
- URL: /blog/autorizatie-anre-electrician-grade-examen-cost (NOU) ; articolul existent rămâne cu titlul "Cine poate semna o lucrare electrică și când expiră autorizația ANRE" și devine copil al noului.
- Title (<=60): "Autorizație ANRE electrician: grade, examen, cost, valabilitate" (62 - scurtează) -> "Autorizație ANRE electrician: grade, examen și cost" (51)
- Meta: "Cum obții autorizația ANRE de electrician: ce grad ți se potrivește, actele, examenul, cât costă și cât e valabilă. Ghid actualizat noiembrie 2026." (147)
- H1: "Autorizația ANRE pentru electricieni: grade, acte, examen, costuri și valabilitate"
- Outline: H2 Cine are nevoie de autorizație (și cine nu) | H2 Persoană fizică vs firmă (operator economic) | H2 Gradele și ce poți semna (tabel, din regulamentul în vigoare) | H2 Condiții de studii și vechime | H2 Pași: dosar, depunere (portal), examen, eliberare | H2 Tematica examenului și bibliografie | H2 Taxe (doar din tarifele oficiale, cu data) | H2 Valabilitate, reautorizare, ce faci dacă expiră | H2 Cum verifici o autorizație (registru ANRE) | H2 Diferența cu legitimația ANRE de instalator gaze | H2 FAQ.
- PAA: "Cât costă autorizația ANRE?", "Ce grade are autorizația ANRE?", "Cât timp e valabilă?", "Cum devin electrician autorizat?", "Pot lucra fără autorizație ANRE?"
- Legitimatie anre (20): secțiune în acest articol, nu pagină separată.
- Surse: Regulamentul pentru autorizarea electricienilor (ordinul ANRE în vigoare - de identificat exact în Monitorul Oficial; "Ordin ANRE 66/2023" apare în rezultate - NECONFIRMAT), Legea 123/2012, Normativ I7/2011 (tematică examen), site anre.ro (tarife). NU folosi anre.md (Moldova) - rezultatele din căutare sunt amestecate cu Republica Moldova; riscul real de a cita greșit.

##### 3.5 Model proces verbal (590) + proces verbal receptie lucrari (90)
Articol existent: model-proces-verbal-raport-lucrare (~420 w text; "Model gata de copiat" în pagină, fără fișier). Intenția pentru "model proces verbal" (590) e foarte largă (juridic, școală, primărie) - nu o putem câștiga generic; câștigabil: "model proces verbal predare primire lucrări / receptie lucrari instalatii / punere in functiune". Concurență [V, rezultate]: zarinacrm.ro "Model Proces Verbal de Recepție a Lucrărilor" (staged vs final, comisie, constatări, perioadă de garanție), portalformulare.ro (June 2019), PDF-uri de primării (Buftea, Câmpia Turzii), HG regulament recepție construcții (anexele oficiale), signnow. Nimeni nu are modelul specific instalații electrice/PV/gaze.
Atenție legal [N]: recepția la terminarea lucrărilor de construcții în sens HGR 343/2017 (modifică HG 273/1994) are formular și comisie - diferit de un simplu proces-verbal de predare între firmă și client. Explică distincția ("PV de predare-primire" vs "recepție la terminarea lucrărilor" vs "recepție finală").
- Variante: 1 articol pilon "Proces-verbal: modele pentru instalații (predare-primire, recepție, punere în funcțiune, intervenție)" + descărcări DOCX/PDF pentru fiecare, link către PIF fotovoltaic. Absoarbe documente-predare-client.
- Title (<=60): "Model proces-verbal de recepție lucrări instalații (DOCX/PDF)" (60)
- Meta: "Modele gratuite de proces-verbal pentru lucrări electrice, gaze și fotovoltaice: predare-primire, recepție și punere în funcțiune. Ce trebuie să conțină." (151)
- H1: "Model de proces-verbal de recepție pentru lucrări de instalații (electrice, gaze, fotovoltaice)"
- Outline: H2 Ce este un PV de recepție/predare și când îl faci | H2 Diferența dintre PV de predare-primire, recepție la terminare și recepție finală | H2 Ce trebuie să conțină (tabel) | H2 Model 1: lucrare electrică (descarcă) | Model 2: gaze | Model 3: fotovoltaic (link) | H2 Anexe obligatorii (buletin PRAM, certificate, garanție) | H2 Semnături: cine, în câte exemplare | H2 Greșeli | H2 Varianta digitală cu semnătură pe telefon (produs) | H2 FAQ.
- Schema: Article + FAQPage; tool: generator PDF reutilizând componenta din PIF fotovoltaic (există deja).
- Surse: HG 343/2017 (regulament recepție lucrări de construcții - verifică numărul), Legea 10/1995 [N], anexele oficiale. 
- PAA: "Ce trebuie să conțină un proces verbal de recepție?", "Cine semnează PV de recepție?", "Care e diferența între recepție la terminarea lucrărilor și finală?"

##### 3.6 Dosar prosumator (260)
Articol existent ~570 w + calculator termen. ATENȚIE MARE: legislația s-a mutat. Din WebSearch [N, sursă secundară - de verificat urgent]: Legea 160/2026 și noul regulament ANRE ar înlocui Ordinul ANRE 15/2022; compensare lunară din 26 iulie 2026; compensarea cantitativă pentru ≤200 kW încetează la 31 dec 2030. Articolul actual nu poate fi corect dacă citează ord. 15/2022 sau termene vechi - verifică fișierul (nu am verificat ce ord. citează). Rețele Electrice România [V, pagina "how to become a prosumer"]: pași = instalare ≤400 kW, racordare, contract de vânzare-cumpărare cu furnizorul; inverter din lista ANRE de invertoare certificate; sub 200 kW compensare cantitativă; 200-400 kW surplus vândut la prețul din contract; fără termene în zile pe pagină. Un ghid secundar dă ATR 30 zile vs "15 zile lucrătoare" în altă sursă - contradicție [N] => nu pune cifre până nu citești regulamentul. 
Concurență: reteleelectrice.ro (oficial), distributie-energie.ro "Ghidul prosumatorului" (PDF), engie.ro ghid, folositor.ro, financiarul.ro, AFM Casa Verde Baterii 2026 (ghid; sesiune neconfirmată [N]).
- Title (<=60): "Dosar prosumator 2026: pași, acte, termene ATR" (46)
- Meta: "Cum devii prosumator în 2026: actele pentru ATR, ordinea pașilor, termenele operatorului și ce faci dacă întârzie. Actualizat după noul regulament ANRE." (150) [doar dacă confirmi regulamentul]
- H1: "Dosar de prosumator 2026: pașii, actele și termenele pentru ATR și punerea în funcțiune"
- Outline: H2 Ce s-a schimbat în 2026 (lege + regulament; tabel înainte/după) | H2 Pașii (ofertă -> studiu -> ATR -> montaj -> PIF -> contract) | H2 Lista actelor (client / instalator / proiectant) | H2 Termenele (cu articol de regulament) | H2 Ce faci dacă operatorul întârzie | H2 Compensare vs vânzare (≤200 kW / 200-400 kW) | H2 Baterii și AFM (doar cu data și sursă) | H2 Calculator termen (există) | H2 FAQ.
- PAA: "Ce acte trebuie pentru prosumator?", "Cât durează ATR?", "Cât costă dosarul?", "Cine depune dosarul, instalatorul sau clientul?" 
- Linkuri: <- checklist PV, PIF; -> /firme-fotovoltaice. Surse: Legea 160/2026 [N], regulamentul ANRE nou [N, număr necunoscut], reteleelectrice.ro [V], Ord. ANRE 15/2022 doar istoric. Menționează data verificării.

##### 3.7 Model ofertă (70) (+ "model oferta" lucrări)
Articol existent ~420 w, calculator preț/marjă. Volum mic, dar CPC probabil moderat și ofertă = intenție exactă produs (ofertare în ElectroField). WebSearch nu a găsit șablon românesc standard [V: rezultate dominate de tendere Moldova] = loc liber. Competiție reală sunt probabil PDF/Word gratuite de pe site-uri de formulare și devize (de verificat în SERP RO real).
- Title (<=60): "Model ofertă lucrări electrice: Word/Excel gratuit" (50)
- Meta: "Model de ofertă pentru lucrări electrice, fotovoltaice și supraveghere: ce trebuie să conțină, clauze de preț și garanție, cu fișier Excel descărcabil." (151)
- H1: "Model de ofertă pentru lucrări electrice și fotovoltaice (Word/Excel) + cum o prezinți clientului"
- Outline: H2 Ce conține o ofertă bună (checklist) | H2 Model descărcabil: ofertă electrică / fotovoltaic / video (3 foi) | H2 Cum calculezi prețul (manoperă, materiale, deplasare, marjă; link la calculator tarif) | H2 TVA 21%/cota aplicabilă la instalare fotovoltaică (verifică cota 2026 - e subiect schimbat în 2025) [N] | H2 Valabilitatea ofertei, avans, garanție (link la cat-avans și garanție) | H2 Greșeli | H2 Din ofertă în lucrare (produs) | H2 FAQ.
- Tool: ofertă generator -> PDF; nu necesită login. Schema: Article + WebApplication + FAQPage. 
- PAA: "Ce trebuie să conțină o ofertă de preț?", "Cât timp e valabilă o ofertă?", "Diferența dintre ofertă și deviz?" (acoperă "program devize" 90 ca secțiune).

##### 3.8 Pontaj (110/70/40/30) - Intenție comercială, CPC 6.2-11 EUR
Concurență din briefing: leaveboard, papervee, App Store, Play, antreprenorinromania.ro, pluriva, avitech (aplicații generale, nu pe teren). Articolul existent (~480 w) e orientat pe "ce cere Codul muncii" + calculator, bun ca bază. Recomand: retitle pe "pontaj online" + "aplicație pontaj" cu secțiuni noi: model foaie colectivă de prezență (Excel descărcabil) , pontaj pe lucrare vs pontaj de prezență, GPS+GDPR (link), calcul ore suplimentare/ore de noapte (verifică Codul muncii art. 111-122 - [N]), registrul Revisal (REGES) - atenție la afirmații.
- Title: "Pontaj online pentru echipe din teren: ce trebuie să conțină" (59)
- Meta: "Cum faci pontajul online pentru tehnicieni din teren: ce cere legea, model foaie de prezență Excel, ore suplimentare și diferența dintre pontaj și pontaj pe lucrare." (~160 - scurtează la 150)
Link spre pagina marketing de pontaj (verifică dacă există /pontaj-... în src/lib/marketing-pages.ts; nu am verificat) pentru a evita canibalizarea. 

##### 3.9 Gestiune materiale (program gestiune stocuri 70) - similar: retitle "Program de gestiune stocuri pentru firme de instalații: ce trebuie să poată" + secțiuni: stoc în mașină, inventar, alertă minim, NIR/bon de consum (nu inventa conformitate fiscală), Excel gratuit. Intenție comercială.

#### 4. ARTICOLE NOI recomandate, ordonate după oportunitate
Scor = volum agregat × potrivire produs × șansă realistă la rank (site nou) - subiectiv, marcat.

1. foaie-de-parcurs-model-completare (1600 + 260 + 10): volum maxim, produs direct (foaie electronică). Ținta: long-tail "model foaie de parcurs excel". Șansă medie (portale contabile mari).
2. priza-de-pamant-rezistenta-masurare-valori (480) + split PRAM/buletin (590+260+90): total ~1400. Concurență slabă calitativ (advertoriale fără surse), dar necesită validare tehnică.
3. autorizatie-anre-electrician-grade-examen-cost (480+20).
4. revizie-instalatie-gaze (720+390+70) - rewrite articol existent (=1180 total, cel mai mare cluster după foaie de parcurs). Concurență: presă generalistă (profit.ro, playtech, bzi) - bătăliile se câștigă cu actualitate (modificarea ANRE 2026), preț transparent, firmă autorizată.
5. montaj-panouri-fotovoltaice-cost-etape-documente (880): intenție CLIENT (cât costă, cât durează, ce acte). Concurență probabil foarte mare (instalatori, comparatoare) - dificil; ținta mai realistă: long-tail local/tehnic ("montaj panouri fotovoltaice pe acoperiș tablă/ țiglă", "cât durează montajul"). [N: nu am verificat SERP]
6. model-proces-verbal-receptie-lucrari-instalatii (590+90).
7. dosar-prosumator-2026 (260) - rewrite + verificare legislativă.
8. model-oferta-lucrari-electrice (70) + program devize (90): secțiune "deviz" în aceeași pagină sau pagină separată "Deviz lucrări electrice: model" (program devize 90).
9. pontaj-online-echipe-teren-model-foaie-prezenta (110+70+40+30) - retitle articol existent.
10. revizie-centrala-termica-cand-cat-costa (volum necunoscut - de verificat în Keyword Planner; probabil mare, dar nu e în lista de volume): reutilizează service-sezonier; concurență hornbach etc.
11. verificare-gaze-bloc-asociatie-de-proprietari (long-tail din fișa gaze: cine plătește, programare scări) - leagă la fișa evidență; pentru "verificare gaze la 2 ani" (70).
12. fisa-de-interventie-raport-de-lucru-model (20+20) - volum mic dar produsul îl are direct (rapoarte de lucru); un pachet de 2 modele ("fișă de intervenție", "raport de lucru") descărcabile. Merge cu PV generic (#5) ca anexă.
13. crm-pentru-firme-de-instalatii (crm romania 90, program crm 50): BOFU, dar mai bine ca pagină de marketing decât blog.
14. firma-instalatii-electrice (110): pagină/landing, nu blog (există /firme-instalatii-electrice).
15. e-factura / SmartBill-Oblio integrare: articol utilitar, exploatează /facturare-smartbill-oblio.
16. Zero-volum (nu prioritizați pentru SEO, dar utile pentru produs/outreach): checklist fotovoltaic, tarif electrician/oră (există).
Aviz: nu inventa cifre de cost/preț pentru servicii în articole noi fără sursă verificabilă; folosește intervale cu "sursa X, dată".

#### 5. Index blog (index.html)
- H1 "Resurse pentru firme de teren" - nu conține keyword. Propus: "Ghiduri și modele pentru firme de instalații: ANRE, gaze, fotovoltaic". Meta ok (155).
- Organizează pe 5 clustere cu subtitluri H2 și linkuri către piloni: Documente și ANRE | Gaze | Fotovoltaic și prosumator | Prețuri, oferte, facturare | Echipe și operațiuni. Adaugă filtrul și un bloc "Modele descărcabile" (foaie de parcurs, PV, ofertă, scadențar).
- ItemList există (ok). Fără paginare problemă la 28 articole.
- Adaugă pagini autor (/echipa sau /autor/...), cu bio, calificare ANRE reală (doar dacă există; NU fabrica persoane/credențiale), "revizuit tehnic de ..." pe articolele ANRE/gaze/PRAM.

#### 6. E-E-A-T - plan minim
1. Autor persoană reală + revizor tehnic (electrician/instalator autorizat ANRE) pe articolele YMYL (gaze, PRAM, ANRE, PV, prosumator). Fără asta, riscul de calitate pe aceste subiecte e mare indiferent de lungime.
2. "Actualizat la [dată]" vizibil + dateModified real + jurnal de modificări pe cele legislative.
3. Surse: link spre textul oficial (legislatie.just.ro / Monitorul Oficial / anre.ro), nu spre furnizori; la fiecare cifră de cost/valoare, sursa și data.
4. Imagini originale: buletin PRAM completat (anonimizat), fișă PIF completată, foto tablou/priză de pământ, captură ecran produs. Alt text descriptiv.
5. Instrumente/șabloane descărcabile = diferențiator real (competitorii dau doar text/imagini).
6. Links din exterior: calculatorul de tarif, scadențarul gaze și generatorul PIF PV sunt cele mai "linkabile" - outreach către asociații (ex. patronate, forumuri de electricieni), nu spam.
7. Fără review-uri/claims inventate; nu pune "mii de firme folosesc" fără dovadă.

#### 7. Prioritizare pe 4 săptămâni (impact/efort)
S1: verificare legislativă prosumator + gaze (2026), adaugă dată actualizare, autor/revizor; retitle/meta (14 pagini) - efort mic.
S2: articol nou foaie de parcurs + Excel; rewrite gaze (#1).
S3: split PRAM + priza de pământ; articol ANRE grade/examen; model PV generic cu DOCX.
S4: ofertă + pontaj retitle; consolidări (#12, #19, #27); index restructurat; schema FAQ.
Măsură: GSC (impresii/poziții pe cele 10 cuvinte-cheie) la 4 și 8 săptămâni; site-ul are 0 ranked keywords azi.

#### 8. Ce NU am putut verifica (de tratat ca ipoteze)
- Poziții reale pe Google.ro (WebSearch US-only).
- Valori și periodicități PRAM din normative românești (nicio sursă RO fiabilă găsită).
- Gradele ANRE IA/IB/IIA/IIB, taxe, durată autorizație RO (doar sursă secundară infocontact; ANRE Moldova irelevantă).
- Numărul și conținutul exact al Legii 160/2026 / regulamentul ANRE prosumatori și termenele ATR.
- Dacă propunerea ANRE "revizia înlocuiește verificarea în anul respectiv" a intrat în vigoare.
- Volume pentru: montaj fotovoltaic client-intent long-tail, revizie centrală termică, tarif electrician (zero în brief).
- Ce citează exact articolul curent de prosumator și de garanție (nu am citit corpul complet al fiecărui articol; am extras structura, meta, linkuri și schema).

#### Surse folosite [V ca pagini deschise/rezultate]
- https://www.fiscalitatea.ro/foaia-de-parcurs-regim-de-intocmire-si-exemplu-de-completare-18588/ (fetch)
- https://www.bzi.ro/cat-costa-revizia-la-gaze-de-2-ani-afla-cateva-informatii-utile-pentru-siguranta-locuintei-tale-5236418 (fetch)
- https://spotmedia.ro/stiri/economie/despre-verificarea-pram-ce-este-si-cat-costa (fetch)
- https://www.infocontact.ro/obtinerea-autorizatiei-anre-pentru-electricieni (fetch)
- https://www.reteleelectrice.ro/en/information/how-to-become-a-prosumer/ (fetch)
- WebSearch (rezultate listate, nefetchate): profit.ro, playtech.ro, newsweek.ro (gaze); zarinacrm.ro, portalformulare (PV recepție); infotva.manager.ro, contabilul.manager.ro, economica.net/Drumio (foaie de parcurs); legeaz.net Ord. ANRE 83/2014 și 98/2015; distrigazsud-retele.ro Ghid Fișe Verificare Tehnică IUGN (2026).
- Fișiere locale: /home/user/CRM/public/blog/*.html; date extrase: /tmp/claude-0/-home-user-CRM/bf78b7b1-b8bb-53ac-9009-54dcd55acec8/scratchpad/research/blogdata.txt


---

## B.7 Raport R5b-content-commercial

### R5b — Strategia de conținut pentru paginile comerciale (ElectroField), 28 nov 2026

Legendă: [V] verificat (cod: fișier:linie / pagină citită azi / URL), [N] neverificat sau de confirmat. Sinteza concurenților vine din WebFetch (rezumat automat al paginii, deci reconfirmă manual înainte de publicare). WebSearch nu reflectă exact Google.ro.

#### 0. Constatări care schimbă strategia

1. **Volumele reale stau în documente și obligații, nu în „soft”.** Interogările de categorie („software management echipe teren”, „program pentru electricieni”, „aplicație gestionare lucrări”, „crm instalații”) au volum 0 măsurabil. Paginile comerciale nu vor aduce trafic din ele; rostul lor e (a) să fie citate/recomandate în AI Overview și în liste „cel mai bun soft”, (b) să convingă vizitatorul adus de articole/modele (foaie de parcurs 1600, PRAM 590, revizie gaze 720...), (c) să capteze căutările de brand și de comparație. Deci: puține pagini comerciale, foarte bune, bine legate din articole, nu 30 de pagini subțiri.
2. **Produsul NU face devize, oferte, CRM de vânzări sau gestiune contabilă.** [V] `grep -i deviz src` dă un singur rezultat: un placeholder într-un câmp de mențiuni (`src/app/(app)/facturare/noua/invoice-editor.tsx:214`). „Ofertă” apare doar ca dată în dosarul fotovoltaic (`pv-forms.tsx:54`) și ca export CSV al clienților cu acord de marketing (`clienti/oferte-export/route.ts`). Facturare internă + proformă + emitere prin SmartBill/Oblio există (`src/lib/invoicing/{smartbill,oblio,index}.ts`). Concluzie: **nu se face pagină „program devize” și nu se țintește „program crm / crm romania”** (altă intenție; Zarina CRM și GoManager o dețin). Se spune onest în FAQ ce NU face.
3. **Nimic nu e testat cu o firmă reală.** [V] `src/lib/platform-capabilities.ts:1-3`: „nimic nu e încă testat cu o firmă reală”, toate modulele „exista-netestat”. Consecințe pentru conținut: fără „folosit de X firme”, fără recenzii, fără studii de caz inventate, fără „economisești N ore” ca fapt. Verbele sunt „are / permite / calculează”, nu „dovedit”. Memoria proiectului (nota despre conturile demo, 26 nov) spune același lucru din perspectiva proprietarului: vrea discuție de descoperire, nu demo din oficiu. Recomand ca CTA-ul de pe site să devină „Programează o discuție” (pagina /programare se numește deja așa), nu „Programează un demo”.
4. **Inconsecvențe de verificat înainte de a scrie mai mult text de vânzare:**
   - `docs/abonamente-si-valoare.md` (2 nov): integrările SmartBill/Oblio erau „în curând”, „nu este demonstrată o integrare fiscală/e-Factura”. Azi codul le are (`smartbill.ts`, `oblio.ts`, `oblioEinvoice` la `oblio.ts:166`), iar paginile le prezintă ca funcționale. [N] dacă au fost rulate pe conturi reale; formulează „se emite prin contul tău” și evită „testat”.
   - iPhone: paginile spun „Android și iPhone”; schema de pe home are `operatingSystem: "Web, Android"` (`src/app/page.tsx`); FAQ-ul `aplicatie-tehnician` zice „pe iPhone merge din browser sau ca aplicație”. Există `android-app/ios` [V director], dar [N] dacă e publicată în App Store. Alege o formulare: „Android (aplicație) și iPhone (în browser, ca aplicație instalată din pagină)” până se confirmă.
   - „Export pontaj pe lună, pe om” și „corecții aprobate” sunt afirmate pe pagină; nu le-am re-verificat în cod [N].
   - Limite 5/15 utilizatori și suport 2 zile/1 zi din documentul de abonamente sunt **propuneri**, neimplementate.
5. **Concurența care apare efectiv pe Google.ro** (citită azi, [V] prin WebFetch; rezumate):
   | Concurent | Poziționare | Preț public | Note utile |
   |---|---|---|---|
   | gomanager.ro | „Program de management pentru echipe din teren”; H1 „Lucrarea se închide azi. Factura pleacă tot azi.” | Da: Essential 15,80 €/lună (2 utilizatori incluși), Professional 19,95 € (10), Premium 39,95 € (30), utilizator extra 1,95 €; 14 zile gratuite | module: contacte, CRM, oferte+e-Factura, proiecte, documente, ticketing, pontaj/concedii; țintă: electrice, securitate, climatizare, construcții; ~1200–1400 cuvinte; are FAQ cu 8 întrebări, are secțiune de prețuri; fără pagini de comparație |
   | electrogest.ro | „Program de devize și costuri pentru instalații” | Da: 1.000 lei/lună, „fără limite” | devize din Excel/PDF cu AI, buget, achiziții, costuri reale, facturare din situații prin SPV, mobil pentru pontaj; țintă electricieni 5–50 angajați. Concurent direct pe latura de ofertare/costuri, nu pe teren |
   | aktio.ro | „Software field service (FSM)”, H1 „Vezi tot ce se întâmplă pe teren” | Da: Starter 15 €/utilizator/lună (max 5), Professional de la 23 €, Enterprise la ofertă; probă 15 zile | offline, poze/checklist/semnătură, GPS opțional, PDF cu logo, constructor de formulare, import Excel; **are pagină „Aktio vs hârtie & Excel”**, nu compară nominal alți furnizori |
   | crewhub.ro | „Platforma completă pentru managementul echipelor” | Nu (probă 14 zile) | programare, mobil offline, CRM cu pipeline și oferte, profit pe lucrare; onboarding „~24 h” |
   | workapp.ro | „Digital Timesheets & FSM” (engleză) | Nu (probă 14 zile) | pagină subțire, fără FAQ |
   | zarinacrm.ro | „Soft CRM complet” | Licență definitivă 2.490–3.990 € + TVA | auto-găzduit, 28+ module; are secțiune „față de celelalte variante de pe piață” și „pentru cine nu este potrivit” (model bun de onestitate) |
   | Om Pe Teren, Softimpera | [N] nu am găsit pagina produsului. softimpera.ro (homepage) apare ca agenție de dezvoltare software din Cluj, nu ca produs FSM; AI Overview îl citează probabil prin pagina/YouTube-ul lor de FSM, nevăzută de mine. Căutarea „Om Pe Teren” nu a returnat nimic relevant |
   Lacuna reală: **niciunul dintre cei fetch-uiți nu leagă ANRE (autorizații cu avertisment la programare, buletine PRAM semnate doar de autorizat), gaze (scadențar Ord. 179/2015), fotovoltaic (dosar ATR cu ceasuri) și foaie de parcurs** [N: bazat pe paginile principale, nu pe tot site-ul lor]. Asta e unghiul de comparație; nu „mai bun la toate”.
6. **Prețuri publice la 3 din 5 concurenți.** Lipsa unei pagini de preț e o slăbiciune față de AI Overview și față de cumpărătorul care compară. Vezi §3.1.

#### 1. Cine deține ce interogare (anti-canibalizare)

Principiu: o interogare = o pagină „proprietar”; celelalte pagini o pot conține doar ca termen secundar în H2/FAQ, fără să o repete în title/H1.

| Interogare (volum RO) | Pagina proprietar | Pe ce o susținem | Comentariu |
|---|---|---|---|
| ElectroField (brand) | `/` | title începe cu „ElectroField” după model, Organization | |
| program pentru firme de instalații (0/necunoscut; SERP slab: Play, Microsoft Store, HammerTech) | `/` | H1, primul paragraf, secțiunea de meserii | oportunitate realistă: SERP-ul nu are firme românești dedicate |
| software de management electricieni și echipe mobile; program management echipe teren; field service management (10); software management echipe teren | `/software-management-echipe-teren` (pilonul) | title/H1/definiție; secțiune „field service management”; FAQ | AI Overview citează liste de soft: aici punem definiția + criterii + tabel de comparație ușor (vezi §2.1) |
| software instalații electrice (sugestie autocomplete) / soft electric | `/firme-instalatii-electrice` | title „Software pentru firme de instalații electrice” | **risc de intenție**: autocomplete mai arată „soft proiectare electrică”; o parte din căutători vor soft de proiectare/calcul (nu e produsul nostru). Pagina trebuie să spună din primul paragraf „nu e soft de proiectare” ca să filtreze și să nu strice semnalele de angajament. Nu fac pagină separată |
| aplicație pentru tehnicieni / aplicație electricieni (0) | `/aplicatie-tehnician` | | |
| pontaj online (110, CPC 6,2), aplicație pontaj (70, CPC 11), program pontaj (40), aplicație pontaj angajați (30) | `/pontaj-tehnicieni` | title „Pontaj online pentru echipe de teren…” | SERP-ul pentru „pontaj online” e dominat de HR generic (Leaveboard, Papervee, pluriva). Ne diferențiem pe „pe lucrare, cu locația la sosire”; nu promite state de plată/salarizare. CPC mare = valoare comercială, nu neapărat ranking realist. Nu fac pagină separată „aplicație pontaj angajați teren”: se acoperă prin H2 și FAQ |
| foaie de parcurs (1600), model foaie de parcurs (260), foaie de parcurs electronică (10) | **articol/model**: de creat `/blog/foaie-de-parcurs-model-completat` (nu există; verifică dacă R-ul pe blog îl are); pagina comercială `/foaie-de-parcurs-electronica` deține doar „electronică/aplicație” | pagina comercială primește link din articol | cel mai mare volum din toată lista; nu-l da paginii comerciale, ar fi intenție greșită (informațională, model descărcabil) |
| program facturare (590, CPC 6,2) | **nu țintim**. `/facturare-smartbill-oblio` deține „facturare din lucrări / factură din ore și materiale” | | ElectroField nu e program de facturare generic (emite prin SmartBill/Oblio). SERP-ul îl dețin SmartBill, Oblio, FGO, Facturis. Termenul „program facturare” apare o singură dată, într-un H2 de poziționare onestă |
| program gestiune stocuri (70) | `/stoc-materiale-pe-masini` | title „Stoc de materiale pe mașini…” | nu e gestiune contabilă (NIR, inventar legal) [N: nu am găsit NIR în cod]; spune „stoc operativ pe mașină și depozit” |
| program devize (90), program devize electrice (0) | **nicio pagină**. Electrogest îl deține și produsul nu face devize | | menționat în FAQ „Faceți devize?” cu răspuns onest + link către articolul `model-oferta-lucrari-electrice-fotovoltaice` |
| crm romania (90), program crm (50), crm instalații (0) | **nicio pagină**. FAQ pe pilon: „E ElectroField un CRM?” | | clienții, contactele și istoricul lucrărilor există; pipeline de vânzări/lead-uri nu |
| aplicație gestionare lucrări (0), program planificare lucrări (0) | pilonul (H2 „gestionare și planificare lucrări”) + articolul existent `excel-sau-aplicatie-gestionare-lucrari` | | volum zero: nu justifică pagină proprie |
| ElectroField vs ..., alternative, „ce soft aleg” | `/comparatie-software-echipe-teren` (nouă) | | vezi §3.2 |
| preț ElectroField, cât costă (brand) | `/preturi` (nouă) | | vezi §3.1 |

##### 1.1 Home vs pilon: H1 și title propuse (acum au același H1 [V] crawl + `hero.tsx`)

**Home `/`** (rol: brand + categorie largă + hub de meserii)
- Title (53): `Program pentru firme de instalații cu echipe în teren`. Variantă cu brand: `ElectroField: program pentru firme de instalații` (47).
- Meta (154): `Program pentru firme de instalații electrice, gaze și fotovoltaice: lucrări, echipe pe hartă, aplicație pentru tehnicieni, pontaj și facturare. Cere demo.` Recomand „Programează o discuție.” în loc de „Cere demo” (aliniere la poziția proprietarului); verifică lungimea (≤155) după alegere.
- H1 (în `hero.tsx`, acum H1 e textul mic din `heroKicker`): `Program pentru firme de instalații: lucrări, echipe și documente, din birou și din teren`. Titlul vizual mare („Din birou. Direct în teren.”) rămâne `<p>`; e ok SEO, dar nu e nevoie să fie H1.
- Primul paragraf vizibil (în loc de `heroSub`): 2 propoziții cu: instalații electrice, gaze, fotovoltaice, echipe în teren, aplicație pentru tehnicieni, facturare SmartBill/Oblio.

**Pilon `/software-management-echipe-teren`**
- Title (50): `Software management echipe de teren | ElectroField` (brand la final, termenul în față; se potrivește cu formatul SERP al lui GoManager/CrewHub). Alternativă fără brand: `Software de management pentru echipe de teren` (45, titlul actual; e deja corect, nu-l schimba dacă nu vrei brand).
- Meta (155): `Ce este un software de management pentru echipe de teren, ce trebuie să conțină și cum alegi: programare, aplicație mobilă, pontaj, documente, facturare.`
- H1: `Software de management pentru echipe de teren: ce trebuie să conțină și cum alegi` sau mai scurt `Software de management pentru echipe de teren (field service management)`. H1 diferit de home; „electricieni” rămâne în H2 și lead, nu în H1.
- Lead (definiție citabilă, 45–55 cuvinte, prima propoziție răspunde direct): „Un software de management pentru echipe de teren (field service management, FSM) este un program care leagă biroul de tehnicienii din teren: programează lucrările, trimite sarcinile în telefon, ține pontajul, materialele și documentele și pregătește factura. ElectroField îl face pentru firme de instalații electrice, gaze și fotovoltaice din România.” Structura „ce este + ce face + pentru cine” e cea pe care AI Overview o preia.

#### 2. Pagini existente: briefuri de extindere (țintă 900–1500 cuvinte)

Reguli comune (de pus în șablonul `src/app/[slug]/page.tsx`, pentru implementator; eu nu modific nimic):
- Tipul `MarketingSection` permite doar `p` și `list`. Pentru a ajunge la 900+ cuvinte utile: adaugă tipuri `table` (comparații, termene), `steps` (listă numerotată `<ol>`), `callout` („De știut / ce nu face”), `image` (capturi cu `alt` descriptiv; există `public/marketing/screen-harta.webp` și `screen-panou.webp`, restul trebuie făcute) și `updatedLabel` vizibil („Actualizat 28 nov 2026”, acum e doar în JSON-LD).
- Fiecare pagină: 1 captură reală din aplicație (nu mock) cu alt text; 1 listă „ce nu face” (onestitate = diferențiator); link către /programare și, după ce există, /preturi și /comparatie; 3–5 link-uri contextuale către articole (acum doar lista „Ghiduri legate” la sfârșit); breadcrumb vizibil.
- FAQ: 6–8 întrebări reale per pagină, răspuns de 40–80 cuvinte, prima propoziție = răspunsul. Notă: [N, din cunoștințe generale] Google a restrâns din 2023 rich result-ul FAQ la site-uri guvernamentale/de sănătate; marcajul FAQPage nu va aduce snippet extins, dar textul vizibil rămâne util pentru AI Overview. Nu elimina marcajul, nu mizezi pe el.
- Câmp nou `ogImage` în `MarketingPage`; `publicPageMetadata` acceptă acum doar `og-van-dusk.jpg` (hardcodat în `src/lib/seo.ts`). Toate cele 41 de pagini au același OG [V crawl]. Sunt doar 4 imagini disponibile (`og-city-night`, `og-pylons`, `og-technician-phone`, `og-van-dusk`), deci nu pot fi 9 unice; atribuire minimă fără repetare în același cluster:
  pilon → og-van-dusk; electrice → og-pylons; gaze → og-city-night; fotovoltaic → og-pylons (diferă de gaze/electrice doar dacă se generează variantă; altfel og-city-night); pontaj → og-technician-phone; foaie de parcurs → og-van-dusk; aplicație tehnician → og-technician-phone; facturare → og-city-night; stoc → og-van-dusk. Recomandare reală: generează OG cu titlul paginii suprapus (Canva/`next/og` ImageResponse) pentru unicitate; 9 repetiții din 4 imagini nu sunt unice.
- Titluri ≤60, meta 140–155, verificate cu script (mai jos).

##### 2.1 `/software-management-echipe-teren` (acum 740 cuvinte)
- Title/meta/H1: vezi §1.1.
- Contur nou:
  1. Lead cu definiție (mai sus).
  2. **Ce face un software pentru echipe de teren** (păstrează lista, adaugă o propoziție per element).
  3. **Field service management în România: ce înseamnă pentru o firmă de instalații** (200 cuvinte; diferența FSM/CRM/ERP/pontaj general; „unde se oprește ElectroField”).
  4. **De ce nu mai ajung Excelul și WhatsApp-ul** (păstrează; adaugă un exemplu numeric etichetat „exemplu”, nu rezultat).
  5. **8 criterii pentru a alege un software** (tabel: criteriu | întrebarea de pus | cum verifici într-un demo). Legătură către articolul `program-management-firma-instalatii` (8 criterii) fără a-l duplica: aici varianta scurtă, acolo detaliul.
  6. **Ce are ElectroField în plus pentru instalații** (păstrează).
  7. **Ce NU face ElectroField** (devize/oferte, CRM de vânzări, contabilitate, soft de proiectare): 80–120 cuvinte.
  8. **Cum îl compari cu alte soft-uri** → link la `/comparatie-software-echipe-teren` și la `/preturi`.
  9. **Cum începi**: discuție, import din Excel, configurare (pașii din `home-faq.ts`: „te ajutăm la prima configurare”); fără promisiuni de durată (nu am dovezi).
- FAQ nou (8): Ce este FSM? Cât costă un software pentru echipe de teren (vezi /preturi)? Ce diferență e între FSM și CRM? Ce diferență e între FSM și pontajul clasic? Merge fără semnal? Cum migrez din Excel? Se leagă de SmartBill/Oblio? E potrivit pentru 3 oameni?
- Linkuri interne: către fiecare din cele 8 pagini de funcție/meserie și 4 articole; către /preturi, /comparatie, /despre.
- Țintă: 1100–1300 cuvinte.

##### 2.2 `/firme-instalatii-electrice` (577 cuvinte)
- Title (45): `Software pentru firme de instalații electrice`. Meta (153): `Software pentru firme de instalații electrice: lucrări pe echipe, buletine PRAM și izolație, lucrări ascunse cu poze, autorizații ANRE. Birou și telefon.`
- H1: `Software pentru firme de instalații electrice` (aliniază cu title; păstrează „Program pentru…” în text).
- Lead: începe cu clarificarea de intenție: „ElectroField nu e soft de proiectare sau de calcul electric: e programul cu care o firmă de electrice își conduce lucrările, echipele și documentele de predare.”
- Secțiuni noi: (1) **Ce nu e** (proiectare, devize); (2) **Fluxul unei lucrări electrice, pas cu pas** (steps: programare → avertisment autorizație → drum/sosire → măsurători → lucrări ascunse cu poze → buletin → predare); (3) **Buletinul PRAM și de izolație: ce se completează unde** (tabel: măsurătoare | unde se introduce | în ce document apare), cu link către `verificare-pram-rezistenta-priza-de-pamant-periodicitate`; (4) **Autorizații ANRE: cine poate semna** (link către articolul de autorizații); (5) **Marja pe lucrare**; (6) **Pentru ce tipuri de lucrări**: instalații noi, mentenanță, verificări periodice, intervenții.
- Nu afirma grade de autorizare specifice (ex. „grad IIB”) decât dacă verifici în `src/lib/compliance.ts` [N: nu citit].
- FAQ (adaugă la cele 4): E soft de proiectare? Face devize? Cine semnează buletinul? Cât de des se verifică PRAM (răspuns scurt + link, cu avertisment că periodicitatea se confirmă din normativ)? Pot lucra și pe gaze/fotovoltaice în același cont?
- OG: og-pylons. Țintă: 1000–1200 cuvinte.

##### 2.3 `/firme-gaze-verificari-revizii` (502)
- Title/meta ok; păstrează titlul (41), meta propusă (151): `Scadențar pe bloc, scară și apartament, verificare la 2 ani și revizie la 10 ani calculate automat, fișă de evidență din telefon, termene după lucrare.`
- H1 fix: păstrează. Adaugă în lead cuvintele „verificarea la 2 ani” și „revizia la 10 ani” (volume: revizie instalație gaze 720, verificare instalație gaze 390, „verificare gaze la 2 ani” 70) fără a concura cu articolele (proprietarul casei caută „preț/cum”; aici firma).
- Secțiuni noi: (1) **Cum arată o campanie pe un bloc** (steps: import Excel → scadențar → programare pe scară → fișe → apartamente absente → reprogramare → registru); (2) **Termene și registre** (tabel cu cele 5 + 2 zile lucrătoare din textul actual, cu notă „verifică în Ord. 179/2015 consolidat”; nu adăuga termene noi neverificate); (3) **Ce stă pe responsabilul tehnic** (aplicația nu înlocuiește răspunderea); (4) **Ce NU face** (nu depune dosare automat la operator: `platform-capabilities.ts` marchează „Integrare cu operatorii” ca „lipsa”).
- FAQ nou: Cine poate executa verificarea? [N: răspuns doar cu sursă ANRE; altfel omite]. Cum import lista? Ce înseamnă „absent/refuz/defect”? Se trimit notificări locatarilor? [N: verifică înainte; există `client-messages.ts`/`status`].
- Interne: articolul fișă de evidență, articolul „verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti” (public: proprietari, de aceea pagina comercială doar menționează), `service-sezonier-centrale-termice`.
- OG: og-city-night. Țintă 900–1100.

##### 2.4 `/firme-fotovoltaice` (369 cuvinte, cea mai subțire)
- Title (42) păstrat; meta (153): `Dosar pe etape pentru fiecare proiect fotovoltaic, termenele operatorului cu ceas, măsurători pe string, PV de punere în funcțiune și echipele de montaj.`
- Secțiuni noi: (1) **Etapele dosarului** (tabel: etapă | document | termen urmărit); folosește etapele din `pv-forms.tsx:54` [V: ofertă trimisă, contract semnat, avans încasat, montaj...], nu inventa altele; (2) **Ce vrea piața: montaj panouri fotovoltaice (880), dosar prosumator (260), firme fotovoltaice (40)**: scurt „de ce dosarele se blochează” (link către `dosar-prosumator-etape-termene-atr`); (3) **Echipa de montaj în teren** (checklist, poze etichetate, măsurători pe string, link `checklist-instalare-sistem-fotovoltaic`); (4) **PV de punere în funcțiune** (link la articolul cu 1832 cuvinte + generatorul); (5) **Ce nu face** (nu proiectează sistemul, nu depune la operator; AFM/Casa Verde doar ce există în `modules.ts`: „AFM” e în descrierea modulului [V `modules.ts`], [N] cât de adânc).
- FAQ: Face ofertă pentru client? (Nu; dată de ofertă în dosar.) Urmărește garanția? Cum se leagă de service? Pot importa proiecte existente?
- OG: og-city-night (sau generat). Țintă 900–1100.

##### 2.5 `/pontaj-tehnicieni` (331)
- Title (49): `Pontaj online pentru echipe de teren, din telefon`. Meta (155): `Pontaj pe lucrare din telefon: plecare, sosire, început și final, cu locația la sosire. Corecții aprobate de birou, concedii, ore pe om, echipă și lucrare.`
- H1: `Pontaj online pentru tehnicienii din teren` (conține „pontaj online”, 110 căutări, CPC 6,2).
- Secțiuni noi: (1) **Pontaj pe lucrare, nu doar prezență** (de ce diferă de pontajul HR: tabel „pontaj clasic vs pe lucrare”; cinstit: nu face state de plată/salarizare [N confirm]); (2) **Cum se pontează în teren** (steps: plecare/sosire/început/final); (3) **Locația: ce se salvează și ce nu** (la sosire; continuu doar cu acord; link către `urmarire-gps-echipe-teren-gdpr`; GDPR din `confidentialitate/page.tsx:59-61` [V]); (4) **Corecții și aprobări**; (5) **Din ore în cost: manopera pe lucrare** (link `calculator-tarif-ora-electrician-instalator`, `cum-calculezi-profitul-pe-lucrare`); (6) **Fără semnal**.
- FAQ: Pot folosi doar pontajul fără restul platformei? [N: întreabă proprietarul; răspunsul determină dacă pagina poate vinde „aplicație pontaj” separat]. Cum se calculează orele suplimentare? (probabil: nu se calculează; verifică). E legal pontajul electronic? [N: nu afirma; trimite la contabil/ITM]. Se exportă pentru contabil?
- OG: og-technician-phone. Țintă 900–1000. Atenție: dacă „aplicație pontaj” (CPC 11) e ținta de PPC, pagina cere landing separat, nu aceasta; decizie de buget, nu de SEO.

##### 2.6 `/foaie-de-parcurs-electronica` (312)
- Title (51) păstrat; meta (154): `Foaie de parcurs lunară pe fiecare mașină, generată din lucrările echipei: zi, client, adresă, kilometri. Plus ITP, RCA și stocul din mașină, într-un loc.`
- Intenție: cele 1600 de căutări „foaie de parcurs” sunt informaționale/model. Pagina comercială răspunde „electronică”. Pentru volum, articolul-model e prioritar (vezi §4); aici bloc scurt „Ce trebuie să conțină o foaie de parcurs” (≤120 cuvinte, cu avertismentul din textul actual: „confirmă forma cu contabilul”) și link către articol.
- Secțiuni noi: (1) **Ce conține, câmp cu câmp** (tabel: câmp | de unde vine în aplicație); (2) **Cum se generează** (steps); (3) **ITP, RCA, stoc**; (4) **Ce nu face** (nu calculează deductibilitatea; nu citește odometrul; kilometrii vin din ce se înregistrează pe lucrare [V text actual]; [N] dacă se calculează din GPS).
- FAQ: Este obligatorie foaia de parcurs? [N: nu răspunde fără sursă fiscală; trimite la articol cu surse]. Pot tipări/exporta? [N]. Merge pentru mai multe mașini/șoferi? Cum se schimbă șoferul (`driver-select.tsx` există [V director])?
- OG: og-van-dusk. Țintă 800–950.

##### 2.7 `/aplicatie-tehnician` (356)
- Title (53) păstrat; meta (155): `Aplicația pentru tehnicieni: lucrările zilei, poze înainte și după, checklist, măsurători și semnătura clientului. Funcționează și fără semnal, pe Android.`
- Secțiuni noi: (1) **O zi în aplicație** (steps cu capturi); (2) **Fără semnal**: ce se salvează local, ce nu (verifică `src/lib/offline/queue.ts` [N citit]; `mobil-offline.html` există [V]); (3) **Ce vede tehnicianul și ce nu** (prețuri de achiziție ascunse: din textul actual; link `tehnician-vs-administrator`); (4) **Instalare**: Android (APK/Play? [N: `android-release.ts`, `public/downloads` există; nu afirma Google Play]) și iPhone (clarifică); (5) **Pentru client**: link de status fără cont (`src/app/status/[token]` [V]); (6) **Mod mănuși/soare**.
- FAQ: Cât de greu e de învățat? [N: fără cifre]. Ce telefon trebuie? Datele locale se pierd dacă se resetează telefonul? Poate lucra cu un tableta?
- Titlul „Aplicație pentru electricieni” (0 volum) nu merită.
- OG: og-technician-phone. Țintă 900–1100.

##### 2.8 `/facturare-smartbill-oblio` (356)
- Title (46) păstrat; meta (151): `Factura se completează din lucrare: ore lucrate și materiale cu adaos. Se emite prin contul tău SmartBill sau Oblio, cu date ANAF și încasări parțiale.`
- Poziționare onestă: „nu înlocuiește SmartBill/Oblio; le conectează la lucrare”. Un H2 cu „program de facturare” explicit: „Nu e un program de facturare generic” (captează puțin din 590 + filtrează).
- Secțiuni noi: (1) **Din lucrare în factură** (steps cu captură); (2) **Ce vine din SmartBill/Oblio** (serii, TVA, plătitor de TVA la neplătitori); (3) **e-Factura**: Oblio din platformă, SmartBill din contul lor [V `index.ts:124`]; link către articolul e-Factura B2B 2026; (4) **Încasări, storno, proformă** [V `oblioReverse`, `oblioCancel`]; (5) **Fără furnizor conectat**: document intern, nu fiscal [V text actual]; (6) **Ce nu face** (nu ține contabilitatea, nu depune D300 etc.).
- FAQ: Am alt program (FGO, Facturis)? [V: doar SmartBill/Oblio în cod]. Cine răspunde de corectitudinea fiscală a facturii? (firma emitentă; platforma doar transmite). Pot emite proformă? [V `DocType`]. Se văd restanțele?
- Nu afirma „testat cu SmartBill” [N].
- OG: og-city-night. Țintă 800–1000.

##### 2.9 `/stoc-materiale-pe-masini` (300)
- Title (48) păstrat; meta (147): `Stocul fiecărei mașini cu listă țintă și prag minim, consum pe lucrare, reaprovizionare și achiziții urgente, plus registrul de scule cu calibrare.`
- Secțiuni noi: (1) **Problema**: materiale cumpărate de două ori, lipsă la client (link `gestiune-materiale-ce-ai-cumparat-ce-ai-folosit`); (2) **Cum funcționează lista țintă și pragul minim** (exemplu numeric etichetat „exemplu”); (3) **Consum pe lucrare → cost în marjă**; (4) **Achiziție urgentă** (flux 4 pași); (5) **Registrul de scule și calibrarea** (legat de Conformitate); (6) **Ce nu e** (nu e gestiune contabilă/NIR/inventar legal [N]).
- FAQ: Pot importa materialele din Excel? (există catalog de pornire [V text]; importul propriu: [N]). Merge cu coduri de bare? [N]. Prețurile de achiziție le vede tehnicianul? (nu [V text]).
- OG: og-van-dusk. Țintă 800–950.

#### 3. Pagini noi (briefuri complete)

Ordine de prioritate: `/preturi` > `/despre` > `/comparatie-software-echipe-teren` > modele-șablon de studiu de caz (nepublicat până există client) > „alternativa la X” (nu acum).

##### 3.1 `/preturi`
- Obiectiv: capturează „preț/cât costă ElectroField”, intră în AI Overview pe comparații de preț (GoManager și Aktio au prețuri publice [V]), reduce frecarea în discuție.
- **Decizie a proprietarului**, nu a mea: publici sau nu cifre. Briefuri pentru ambele variante:
  - **Varianta A (cifre publice)**. Sursă: `docs/abonamente-si-valoare.md`: Standard 299 lei/lună, Pro 599 lei/lună, fără TVA (PFA neplătitor de TVA, confirmat de proprietar); implementare unică 1.000 / 1.500–2.000 / 2.000–3.000 lei; limite 5 și 15 utilizatori, suport 2 zile/1 zi lucrătoare = **propuneri neimplementate** (doc, p. „Limitele... sunt propuneri”). Publică numai ce proprietarul confirmă și poate livra. Plata se face manual (doc: „se poate factura manual”), deci nu scrie „plătești online”.
    - Title (46): `Prețuri ElectroField: abonament lunar pe firmă`. Meta (146): `Cât costă ElectroField: abonament lunar pe firmă, ce include fiecare plan, ce plătești la implementare și ce nu e inclus. Prețuri clare, fără TVA.`
    - H1: `Prețuri ElectroField`. Structură: (1) lead cu modelul „abonament lunar pe firmă, nu pe utilizator [dacă se confirmă]”; (2) tabel 2 planuri (utilizatori incluși, funcții, suport) cu coloane doar cu ce există în cod; (3) **Implementare** (ce include: configurare, import, instruire); (4) **Ce nu e inclus** (devize, CRM de vânzări, dezvoltări la comandă; peste 15 utilizatori: ofertă separată); (5) **Cum calculezi dacă merită**: calculatorul din doc („la 50 lei/oră cost intern, 299 lei = ~6 ore/lună”) ca **exemplu cu input editabil**, nu promisiune; (6) **Cum începi**: discuție → ofertă → configurare → perioadă de probă/pilot [N: pilotul de 30 de zile din doc e propunere]; (7) FAQ (TVA: „fără TVA, furnizor neplătitor de TVA” [N: formulare juridică de confirmat cu contabilul și pusă condiționat, pentru că statutul se poate schimba la depășirea plafonului; nu scrie în pagină un prag]; contract și reziliere [N: cum e în /termeni]; export datelor la anulare [N]; număr de utilizatori; plată).
    - JSON-LD: `Offer` cu `price`, `priceCurrency: "RON"` în `SoftwareApplication` **doar** dacă prețurile sunt ferme. Fără `aggregateRating`, fără recenzii.
    - Comparația cu concurenții de pe pagină: nu. Se face în pagina separată (§3.2).
  - **Varianta B (fără cifre)**: aceeași pagină, dar tabelul înlocuit cu „de ce depinde oferta”: număr de utilizatori, domenii, implementare, import. Include un **exemplu de structură** („abonament lunar pe firmă + implementare unică”) fără sume, termen de răspuns la cerere de ofertă [N: doar ce poți onora], buton „Cere o ofertă” = /programare cu `utm_source`. Title (46): `Prețuri ElectroField: cum se stabilește oferta`. Meta (142): `Cum se calculează oferta ElectroField: abonament lunar pe firmă, număr de utilizatori și implementare. Cere o ofertă pe lucrările firmei tale.` Notă: AI Overview și compararea prețurilor favorizează cifrele; B pierde acest avantaj, dar păstrează pagina indexabilă pe „prețuri”. Nu scrie „preț personalizat” fără structură: pare ascundere.
- 800–1100 cuvinte. OG: og-city-night. Interne: pilon, aplicație tehnician, comparatie, programare.

##### 3.2 `/comparatie-software-echipe-teren` (comparație românească, onestă și sigură juridic)
- Title (53): `Comparație software echipe de teren în România (2026)`. Meta (145): `Comparație între softurile pentru echipe de teren din România: ce face fiecare, cui i se potrivește, ce spun sursele publice. Datată și cu surse.`
- H1: `Cum alegi un software pentru echipe de teren: comparație între variantele din România`.
- Cadru legal [V text citit la legeaz.net, Legea 158/2008 art. 6 lit. a–h; nu sunt jurist, trece-o printr-un avocat înainte de publicare]: publicitatea comparativă e permisă dacă (a) nu e înșelătoare, (b) compară bunuri/servicii pentru aceleași nevoi, (c) compară obiectiv caracteristici esențiale, relevante, verificabile și reprezentative, (d) nu discreditează sau denigrează, (f) nu profită neloial de reputația unei mărci, (h) nu creează confuzie. Reguli de lucru:
  1. Fapte doar din pagini publice ale furnizorilor, fiecare cu URL și „verificat la: dată”; tabel cu coloana „sursă”. Nimic din „am auzit”, nimic din recenzii nesursate.
  2. Fără superlative („cel mai bun”, „singurul”) pentru ElectroField; fără adjective peiorative pentru alții. Limitări ale concurenților doar dacă sunt scrise de ei (ex.: Zarina listează singură „pentru cine nu e potrivit”).
  3. Limitările ElectroField scrise la fel de vizibil (netestat pe firme reale în producție [N: formulare de ales de proprietar, dar conținutul nu poate sugera contrariul]; fără devize, fără CRM de vânzări).
  4. Nume de firmă scrise ca text, fără logo-uri și fără mărci stilizate; fără a le folosi în title/URL/meta (reduce riscul lit. f și confuzia lit. h). Titlul rămâne generic.
  5. Un paragraf „Corecții”: email pentru ca un furnizor să semnaleze o greșeală; promisiune de corectare în X zile [N: doar ce poți respecta]. Dată „Actualizat”, reverificare la 90 de zile.
  6. Compari ce răspunde aceleiași nevoi: un tabel pentru „echipe de teren / lucrări”, un alt rând separat pentru „devize și costuri” (Electrogest) ca să nu compari mere cu pere (lit. b, c).
- Structură:
  1. Lead + „Pentru cine e pagina” + „Cum am făcut comparația” (surse, dată, reguli).
  2. **Pe ce criterii compari**: 8 criterii (aliniate la `program-management-firma-instalatii`): ce fluxuri acoperă, mobil/offline, documente specifice meseriei, preț, model de licențiere, implementare, facturare/e-Factura, date și găzduire.
  3. **Tabel** (rânduri: GoManager, Aktio, CrewHub, WorkApp, Electrogest, Zarina CRM, Excel+WhatsApp, ElectroField; coloane: tip, orientare, preț public (cu dată), mobil/offline, documente de meserie ANRE, e-Factura, probă, sursă). Date confirmate azi în §0; celulele nepublicate = „nu e afișat pe pagina publică la <dată>”, nu „nu are”.
  4. **Secțiuni scurte per variantă** („Când ți se potrivește / când nu”). Pentru fiecare concurent 2–3 propoziții din sursa lui; pentru ElectroField la fel.
  5. **Excel + WhatsApp** (secțiunea cea mai sigură juridic și cu cel mai mare interes: Aktio are deja „Aktio vs hârtie & Excel”).
  6. **Cum alegi în 30 de minute**: checklist de întrebări de pus oricărui furnizor, test pe telefonul unui tehnician, cerere de date de export.
  7. **FAQ**: Care e cel mai ieftin soft? (răspuns cu intervale publice datate, nu „X e cel mai ieftin”); Pot folosi doar Excel? Care are aplicație offline? Care are devize? Ce înseamnă licență definitivă vs abonament?
- „Om Pe Teren” și Softimpera: [N] nu includ până nu citești paginile produsului; include numai furnizori cu pagină verificată.
- JSON-LD: `Article`/`WebPage` + `ItemList` (opțional); fără `Review`/`AggregateRating`.
- Interne: pilon, preturi, excel-sau-aplicatie..., program-management-firma-instalatii. Extern: link către sursele concurenților (rel nofollow nu e necesar; linkuri spre surse cresc credibilitatea).
- Implicații AI Overview: pagina se potrivește cu interogări „cel mai bun software pentru echipe de teren / alternative”; AIO a recomandat azi GoManager, Aktio, Electrogest, WorkApp, Om Pe Teren (din datele sarcinii). Pagina nu garantează includerea; ajută și listările terțe (§5).
- 1300–1700 cuvinte, OG nou generat.

##### 3.3 Pagini „alternativa la X”
Nu acum. Motive: volum 0 estimat pentru „alternativa gomanager/aktio” [N: nu am date; verifică în GSC după 2–3 luni]; ElectroField fără clienți nu poate demonstra superioritate; risc juridic crescut (nume de mărci în title/URL). Dacă Search Console arată interogări „X alternativă” legate de site, atunci o pagină per concurent cu aceleași reguli de la §3.2 și titlu „X vs ElectroField: comparație pe criterii”.

##### 3.4 `/software-instalatii-electrice` separat
Nu: canibalizare cu `/firme-instalatii-electrice` și intenție neclară (autocomplete: proiectare). Soluția e retitlarea paginii existente (§2.2). Revizuiește după 4–6 săptămâni de date GSC.

##### 3.5 „Aplicație pontaj angajați teren” (retargeting)
Nu pagină separată. Se acoperă în `/pontaj-tehnicieni` (§2.5). Pentru retargeting (reclame) se folosește aceeași pagină cu UTM; dacă PPC-ul pe „aplicație pontaj” (CPC 11 €) devine prioritar, creează landing dedicat noindex cu mesaj unic (nu e chestiune SEO).

##### 3.6 „Program devize instalații”
Nu. Produsul nu face devize [V §0]. Dacă proprietarul vrea să capteze 90 de căutări/lună: ar fi nevoie de modul nou; până atunci doar articolul-model existent (`model-oferta-lucrari-electrice-fotovoltaice`) și rândul din FAQ.

##### 3.7 `/despre`
- Obiectiv: încredere, E-E-A-T pentru YMYL-adiacent (documente ANRE/gaze), cerut deja în planul tehnic (docs/seo-2026-11/00-sinteza.md §A5).
- Title (40): `Despre ElectroField: cine face programul`. Meta (150): `Cine stă în spatele ElectroField, de ce l-am construit pentru firme de instalații, cum ne contactezi și cum îți tratăm datele. Date legale și contact.`
- Conținut (500–800 cuvinte): (1) povestea și motivul (scrisă de proprietar; nu inventa biografii); (2) **ce facem și ce nu** (aceleași liste ca pe pilon); (3) **date legale**: persoană fizică autorizată, CUI 55851462, Reg. Com. F2026050162004, sediu București Sector 1 [V `src/lib/contact.ts`]; contact: contact@electrofield.ro, 0750 425 670, WhatsApp [V]. Atenție: `contact.ts` comentează că numele persoanei lipsește „la cererea titularului” și că denumirea e publică în ANAF/ONRC; respectă decizia; pagina nu publică numele fără acordul lui; (4) **cum tratăm datele** (link `/confidentialitate`, `/termeni`; sub-procesatori și locația datelor [N: nu am verificat unde sunt găzduite; Supabase region nespecificat în pagini, nu afirma „servere în UE”]); (5) **cum construim conținutul** (surse, date, „ce nu e verificat se spune”, politica de corecții); (6) **starea produsului** onest: „produs nou, în pregătire pentru primii clienți” [N: formularea e a proprietarului].
- JSON-LD: `AboutPage` + extinde `Organization` (legalName dacă proprietarul acceptă, `contactPoint`, `taxID`/`vatID`: doar CUI, fără VAT).
- Link din footer și din nav.

##### 3.8 Studii de caz (șablon, nepublicat)
Nu există clienți reali [V §0 pct. 3]. **Nu publica studii de caz inventate sau „scenarii” prezentate ca realitate.** Pregătește șablonul și pagina `/pilot` (sau secțiune în /preturi) care recrutează 3–5 firme pilot, cu acord scris pentru publicare.
Șablon (pentru fiecare client real, cu aprobarea lui): 1) Profil (domeniu, număr tehnicieni, regiune; nume doar cu acord); 2) Situația înainte (cum lucrau, problema măsurabilă); 3) Ce am configurat (module reale, timp de pornire real); 4) Rezultate **măsurate** înainte/după (minute planificare, apeluri de status, lucrări fără documente, întârziere finalizare→factură: indicatorii din `abonamente-si-valoare.md`), cu metodă și perioadă; 5) Ce nu a mers / ce am schimbat; 6) Citat aprobat; 7) Ce urmează. Titlu: `<Domeniu> cu <N> tehnicieni: ce s-a schimbat în <X> luni`. Schema `Article`; fără `Review` decât cu recenzie reală.

#### 4. Revizuirea paginii principale (structură HTML și text)

Verificat în `src/components/marketing/*` și `src/app/page.tsx`:
1. **H1 animat din greșeală** [V]: `hero.tsx` pune clasa `mk-reveal-1` direct pe `<h1>`, iar efectul gsap animă `".mk-reveal-1"` (`opacity: 0 → 1`), deși comentariul din cod spune „Titlul (h1) nu se animă”. După hidratare H1 pornește din opacity 0 (vizibil în HTML-ul server, dar efect de „flash” și risc de LCP/CLS pentru elementul de text). Fix: scoate `mk-reveal-1` de pe `<h1>`, păstrează-l pe elementele non-critice.
2. **H1 e textul mic, titlul mare e `<p>`** [V `hero.tsx`]. Acceptabil, dar H1-ul actual e identic cu pilonul; schimbă conform §1.1.
3. **H2-urile scenelor sunt sloganuri fără cuvinte-cheie** [V crawl]: „Știi unde este echipa ta...”, „De la prima programare până la ultima factură.”, „Un singur sistem. Întregul tău business.”. Cuvintele „electricieni/instalații/echipe de teren/program” apar în H2 doar la `HomeSeo` (la final, după 4 scene). Recomandare: păstrează sloganurile ca text vizual, dar adaugă în fiecare `section` un `<p>` introductiv cu termenul (ex. scena hărții: „Urmărirea echipelor de teren pe hartă...”) sau mută `HomeSeo` (fără FAQ) imediat sub hero.
4. **Text vizibil fără JS**: scenele sunt SSR și fără ascundere prin scroll (`scene-job-journey.tsx` comentează „fără animație legată de derulare”) [V]. Excepție: `scene-phone-dashboard.tsx` randează o singură legendă activă (în funcție de progres) și stări `opacity: 0` pe panouri (`marketing.module.css:325,334`): textul din ecranele telefonului nu e conținut indexabil util, deci nu te baza pe el. `.reveal { opacity: 0 }` (css:474) și `.moduleItem` (426) există: [N] unde sunt folosite; verifică că nu ascund conținut text important pentru crawlere fără JS.
5. **Cuvinte** [V crawl]: home ~1003 cuvinte; mare parte e UI. Adaugă un bloc „Pentru cine e / ce NU face” și un tabel scurt de poziționare (sub hero) în 120–180 cuvinte vizibile.
6. **Link-uri interne**: home are linkuri către cele 9 pagini, 6 articole și /programare, /termeni, /confidentialitate [V crawl]. Lipsesc /preturi, /comparatie, /despre (nu există încă). Primul meniu: `nav.tsx` [N: nu l-am citit]; anchor-urile `#platforma`, `#functionalitati` din footer nu sunt linkuri către pagini. Adaugă în `HomeSeo` un H2 „Cum alegi un software pentru echipe de teren” cu link către comparatie și preturi.
7. **FAQ (5 întrebări)**: acoperă meserii, telefon, facturare, Excel, demo. Adaugă: „Cât costă?”, „Faceți devize/oferte?”, „E CRM?”, „Cum sunt tratate datele angajaților (GPS)?”, „Ce se întâmplă dacă pierd semnalul?”. FAQ în `<details>` e în DOM și vizibil crawlerului [V].
8. **Schema** [V `page.tsx`]: `SoftwareApplication` fără `offers` (e corect să nu pui dacă prețul nu e public), `operatingSystem: "Web, Android"` (aliniază cu realitatea iPhone), `Organization` fără `sameAs`/legal; adaugă după /despre: `sameAs` doar pentru profile reale. Nu adăuga `aggregateRating`.
9. **Imagini**: 7 imagini fără `alt` (decorative, `alt=""`; ok pentru fundaluri), dar logo-urile din nav/footer au alt gol [V crawl `noalt`]; adaugă `alt="ElectroField"` pe logo-ul din nav. Zero capturi de produs vizibile cu alt descriptiv; adaugă 2–3 (`screen-harta.webp`, `screen-panou.webp` există).
10. **CTA**: „Programează un demo” (hero, footer, template). Aliniază la „Programează o discuție”.
11. Canonical home: `https://www.electrofield.ro` fără slash (crawl) vs URL-ul sitemap cu slash: [N: normalizare; efect minor].

#### 5. Ordine de lucru și măsurare
1. (zi 1–2) Corectări tehnice mici: H1 animat, title/H1 home vs pilon, CTA, meta lungimi, `ogImage` pe pagină.
2. (săpt. 1) Extinde cele 9 pagini în ordinea: pilon, electrice, fotovoltaice, gaze, pontaj, aplicație, facturare, stoc, foaie de parcurs; un singur commit per pagină ca să poți atribui efectele.
3. (săpt. 1–2) `/preturi` (decizia proprietarului A/B), `/despre`.
4. (săpt. 2–3) `/comparatie...` după verificarea juridică și reconfirmarea manuală a faptelor concurenților (rezumatele din §0 sunt de la un model mic).
5. Off-page pentru AI Overview (reluat din `docs/seo-2026-11/07-concurenti.md` și Google.ro azi): AIO a citat softimpera.ro, electrogest.ro, deci listările terțe contează; înscriere în Capterra/GetApp/G2/AlternativeTo cu informații reale, fără recenzii false.
6. Măsurare: Search Console (interogări, pagini), analitice proprii pentru clicuri pe /programare; prag de decizie după 4–6 săptămâni: dacă „software instalații electrice” nu aduce nimic, nu insista.
7. Lungimi title/meta propuse verificate cu script (title 40–53, meta 139–157 în ciorne; cele marcate în text au fost ajustate în tabelul §1.1 și la fiecare pagină; reverifică la implementare cu `len()`).

#### 6. Riscuri și lucruri neverificate (listă)
- Rezumatele concurenților: WebFetch cu model mic; reconfirmă manual prețurile și caracteristicile înainte de comparație.
- „Om Pe Teren” și produsul Softimpera: neidentificate.
- Limitele de utilizatori/suport/preț: propuneri neimplementate; plata automată nu există.
- Pontaj: export, corecții, locație la sosire: afirmate în pagini, nereverificate în cod de mine.
- iPhone/App Store; hosting UE; instalare Android (Play vs APK).
- Fiscal/legal (foaie de parcurs, TVA PFA, comparativă): necesită avizul unui contabil/avocat; art. 6 L158/2008 citit doar din rezumat legeaz.net, nu din Monitorul Oficial.
- Volumele în RO provin din datele sarcinii; nu am avut acces la DataForSEO.


---

## B.8 Raport R6-appstores-video

### R6: App-store și video SEO pentru ElectroField (28 nov 2026)

Legendă: [V] verificat (am citit/fetch-uit, sursa indicată), [N] neverificat / din memorie.
Limită: WebSearch e US-centric și nu reflectă exact Google.ro; paginile Play au fost luate cu curl (hl=ro, gl=RO), deci textele sunt reale, dar clasamentul Google.ro nu e reprodus.

#### 1. Starea aplicației

| Element | Valoare | Sursă |
|---|---|---|
| Nume / app id (Android și iOS) | ElectroField / `com.electrofield.app` | [V] android-app/capacitor.config.ts:8-9; strings.xml; ios project.pbxproj:312 |
| Versiune Android | versionName 0.3, versionCode 3 | [V] android-app/android/app/build.gradle:10-11 |
| Tip | Capacitor, WebView peste https://www.electrofield.ro/mobil (fără UI propriu); plugin-uri: background-geolocation, geolocation, push, splash | [V] capacitor.config.ts, package.json |
| Distribuție actuală Android | APK direct: public/downloads/electrofield.apk, link din pagina de login | [V] README release checklist pașii 5; src/lib/android-release.ts |
| Distribuție iOS | IPA nesemnat prin GitHub Actions, sideload cu Apple ID gratuit (expiră în 7 zile). Nu e în App Store | [V] android-app/README.md secțiunea iOS |
| fastlane / metadata de store / descrieri Play în repo | Nu există (căutat în tot repo-ul, fără node_modules) | [V] find |
| Google Play | https://play.google.com/store/apps/details?id=com.electrofield.app&hl=ro răspunde HTTP 404 = NEPUBLICATĂ | [V] WebFetch, 28 nov |
| App Store | Căutare web "ElectroField" + electrofield.ro: niciun rezultat. Compatibil cu faptul că nu există build semnat/publicat | [V] search negativ; [N] absența completă nu poate fi dovedită din afară |
| Permisiuni în manifestul principal | Doar INTERNET; permisiunile de locație vin (probabil) din plugin-uri la build | [V] AndroidManifest.xml:34; [N] manifestul final nu a fost compilat (README: "android/ has never actually been compiled" în faza 0.1) |
| README despre Play | "Google Play requires a declared, reviewed justification" pentru locație în fundal; keystore și cont Play Console încă lipsă | [V] README "What's NOT done yet" 3-4 |

Concluzie: pe Play și App Store ElectroField nu există. Lipsa asta e o breșă directă: pentru "aplicație pontaj" / "aplicație gestionare lucrări" Google.ro scoate liste play.google.com.

Riscuri de aprobare Play (toate [N], din cunoașterea politicilor Google; verificați în Play Console):
1. App-ul e un WebView peste un site: politica "Minimum functionality" poate respinge un wrapper fără valoare nativă. Argumente pro: GPS în fundal cu serviciu foreground, push FCM, cameră, funcționare fără semnal. Pune-le în evidență în listing și în nota către review.
2. Locație în fundal (ACCESS_BACKGROUND_LOCATION): formular Declaration + video demonstrativ + ecran de consimțământ vizibil. Aplicația are deja consimțământ GPS și retragere în Profil (confidentialitate/page.tsx:61, :86) [V].
3. Aplicația cere cont: Play cere "App access" cu date de login pentru reviewer. Notă: memoria proiectului spune că conturile demo se fac doar pentru firme care cer demo. Contul pentru reviewerul Google e altă situație, dar e decizia proprietarului; recomand un cont izolat, fără date reale, marcat clar ca "review Google Play".
4. Conturi personale noi de dezvoltator pot avea cerință de closed testing (12 testeri, 14 zile) înainte de producție [N, de verificat la creare]. Un cont de organizație (firmă cu CUI + D-U-N-S) evită de regulă asta [N].
5. Politica de confidențialitate: există (https://www.electrofield.ro/confidentialitate) [V]. Data Safety form: locație (precisă, în fundal), poze, identificatori de cont, notificări.

#### 2. Ce rankează pe Play pentru interogările țintă

Metodă: pagini Play descărcate cu curl (hl=ro). Rating/instalări doar unde apar în pagină. Titlurile sunt exact cele din listing.

| App (package) | Titlu Play | Descriere scurtă | Instalări | Rating | Observații |
|---|---|---|---|---|---|
| Planningify (com.consultali.izitime) | Planningify: Pontaj ore | Pontaj ore lucrate, calcul ore suplimentare și fișă de pontaj în format PDF | 500K+ | 4,59 (2562) | descriere 505 cuvinte; "Pontaj" în titlu și în primele cuvinte [V] |
| EzWork (com.mywo) | Salarizare și fișă de pontaj | Managementul personalului și studenților. Calculați salariul. | 100K+ | n/a | [V] |
| HRiFlow (ro.iflow) | Pontaj HRiFlow | Pontaj, planificare ture & concedii pentru echipe. | 10K+ | 4,25 (57) | brand + "Pontaj"; descriere 263 cuvinte, listă "Funcționalități principale" [V] |
| Planado (app.planado) | Planado Field Service | Aplicație pentru lucrătorii de teren ai companiilor care utilizează serviciul de câmp Planado | 10K+ | n/a | descriere tradusă automat/"instalatori, reglatori…", pași de start [V] |
| Tapapp (com.tapappcloud) | Tapapp Field Operations | Platformă multifuncțională pentru afacerea ta: Formulare, Pontaj, Programare | 10K+ | n/a | [V] |
| Timesheet (com.aadhk.time) | Timesheet: Pontaj Ore de lucru | Monitorizezi ușor orele de lucru, afli cât câștigi și faci pontajul | n/a | 4,71 (65.031) | titlu cu cuvântul RO "Pontaj" adăugat [V] |
| pontaj.eu (pontaj.eu) | pontaj.eu | soluții digitale pentru pontajul angajaților | 10+ | n/a | [V] |
| Pontaj (com.mrantal.pontaj) | Pontaj | Pontaj cu tag NFC, ture de noapte, ore suplimentare, învoiri, concedii, raport. | 10+ | n/a | [V] |
| Electrogest Mobile (app.electrogest.mobile) | Electrogest Mobile | Electrogest te ajuta sa gestionezi lucrări și facturi dintr-o singură aplicație. | 10+ | n/a | competitor direct din AI Overview; listing subțire (95 cuvinte), arată că și un listing slab apare [V] |
| JobDone Pro (com.nstudio.jobdone_pro) | Job Done Pro - Manager lucrări | Oferte, clienți și alerte | 50+ | n/a | țintește "instalatori, meseriași", "manager lucrări" [V] |
| 360°Workforce (com.qms) | 360°Workforce | New Age pentru Digital Ordine… (traducere automată) | 1K+ | n/a | [V] |

Neconfirmat: GoManager, WorkApp, CrewHub, Aktio, Om Pe Teren. Nu am găsit pachetele lor Play (căutări negative); posibil să nu aibă aplicație Play sub acele nume sau să nu apară în căutarea din afara RO [N]. Nu le-am inventat.

Ce învățăm:
- Pe cuvintele RO, ranking-ul Play pe "pontaj" e dominat de aplicații generice de pontaj, nu de FSM. Cuvântul "Pontaj" în titlu e tipar comun la cele mari. [V]
- Nicio aplicație românească pentru instalatori/electricieni cu documente ANRE/PRAM nu apare. Poziționarea liberă: "pontaj + lucrări + poze + semnătură pentru echipe de instalații" [V pentru ce am văzut; N că nu există altele].
- Ratingul contează: cele cu 500K și 65K recenzii sunt imbatabile pe "pontaj" generic. Ținta realistă e coada: "aplicație gestionare lucrări instalatori", "aplicație tehnicieni teren", "pontaj echipe teren", nu "aplicație pontaj" simplu.
- Volumele din Google Ads: aplicație pontaj 70/lună (CPC 11), aplicație programări 90, pontaj online 110 (date primite în brief). Mici; valoarea listingului Play e mai ales vizibilitate în SERP-ul de tip "aplicații" și încredere (insignă Google Play pe site), nu trafic masiv.

#### 3. Listing Google Play complet (RO)

##### Titlu (max 30; 28 caractere)
`ElectroField: Pontaj lucrări`
Alternativă (30): `ElectroField - Echipe de teren`. Recomand prima: are "Pontaj" (tiparul din top) și "lucrări" (interogarea "gestionare lucrări"). Verifică ca titlul să nu conțină cuvinte promoționale ("cel mai bun", "gratis"): Play le respinge [N].

##### Descriere scurtă (max 80; 73 caractere)
`Pontaj, lucrări și poze pentru echipe de instalații. Merge și fără semnal`

##### Descriere completă (max 4000; 2.4k caractere, doar funcții verificate)
Funcțiile sunt luate din src/lib/marketing-pages.ts (aplicatie-tehnician, pontaj-tehnicieni, stoc-materiale-pe-masini, facturare) și din rutele src/app/mobil (lucrari/[id]/{foto,checklist,semnatura,cheltuiala,achizitie,ridicare,depozit,gaze,formular}, pontaj, concediu, harta, scule, materiale, mesaje, notificari, setari cu "Mod soare"/"Mod mănuși") [V]. Funcționare fără semnal: marketing-pages.ts și src/app/mobil/ajutor/page.tsx:7 [V]; comportamentul real nu a fost testat pe telefon [N].

```
ElectroField este aplicația tehnicianului pentru firmele de instalații electrice, gaze și fotovoltaice. Primești lucrările zilei, pontezi din telefon, faci poze înainte și după, bifezi checklistul și iei semnătura clientului pe ecran. Biroul vede pe loc ce s-a făcut.

Atenție: aplicația se folosește cu un cont creat de firma ta în platforma ElectroField (www.electrofield.ro). Nu e o aplicație pentru public.

CE FACI DIN TELEFON
• Lucrările zilei, în ordine, cu adresa și navigare spre client
• Pașii lucrării: ridicarea materialelor, drumul, sosirea, lucrul, finalizarea
• Pontaj pe lucrare: plecare, sosire, început și final, în două atingeri
• Poze etichetate înainte și după, încărcate în fundal
• Checklist, măsurători și semnătura clientului pe ecran
• Materiale și scule: ce ai în mașină, ce ai consumat pe lucrare
• Cerere de materiale sau achiziție urgentă din teren
• Cheltuieli cu poza bonului și cereri de concediu
• Mesaje și notificări de la birou, inclusiv când ți se schimbă programul

GÂNDITĂ PENTRU TEREN
• Merge și fără semnal: pozele, pașii și semnăturile se trimit singure când revine conexiunea
• Mod „mănuși” (butoane mari) și mod „soare” (contrast mare)
• Hartă cu lucrările și depozitele

PENTRU INSTALAȚII
• Electrice: măsurători pentru buletine PRAM și de izolație, poze pentru lucrări ascunse
• Gaze: fișa de evidență completată din telefon, cu semnătura clientului
• Fotovoltaice: checklist de montaj, poze etichetate și măsurători pe string pentru procesul-verbal de punere în funcțiune

CE VEDE BIROUL
• Echipele și lucrările, în timp real
• Orele pontate pe om, pe echipă și pe lucrare
• Documentele lucrării generate din datele de pe teren
• Facturarea lucrării prin SmartBill sau Oblio

LOCALIZARE ȘI CONFIDENȚIALITATE
La pontaj se salvează locația doar la sosire. Urmărirea continuă, în fundal, pornește numai cu acordul tău și îl poți retrage oricând din Profil → Confidențialitate și locație. Politica de confidențialitate: https://www.electrofield.ro/confidentialitate

PENTRU CINE E
Firme de instalații electrice, gaze, fotovoltaice, climatizare și securitate, cu una până la câteva zeci de echipe în teren. Platforma de birou merge în browser.

Vrei să vezi cum arată pe lucrările și echipele firmei tale? Programează o discuție pe www.electrofield.ro/programare.
```

Nu am inclus: AI, scanare, SSM, "fără abonament", prețuri, recenzii, "disponibil pe App Store". Rutele src/app/mobil/ai, /scaneaza, /ssm există, dar scopul lor nu a fost verificat în detaliu pentru listing [N].

##### Categorie și etichete
- Categorie: Business (alternativ Productivity; competitorii relevanți sunt în Business: HRiFlow, Planado, Tapapp).
- Etichete Play (alege din lista oficială din Play Console; se pot cere "Business", "Productivity", "Time management" [N, lista variază]).
- Cuvinte cheie de pus natural în text (nu în listă): pontaj, aplicație tehnicieni, echipe de teren, gestionare lucrări, instalații electrice, gaze, fotovoltaice, semnătura clientului, foaie de parcurs (foaie de parcurs generată în platformă: marketing-pages.ts [V], dar nu o am în descriere fiindcă tehnicianul nu o completează; adaug doar dacă vrei).
- Date de contact: site https://www.electrofield.ro, e-mail de suport, politica de confidențialitate.

##### Grafică și capturi (captions în română, 1080x1920 sau 9:16, 4-8 capturi)
1. "Lucrările zilei, cu adresa și navigare" (mobil/lucrari)
2. "Pontaj pe lucrare în două atingeri" (mobil/pontaj)
3. "Poze înainte și după, etichetate" (lucrari/[id]/foto)
4. "Checklist și măsurători din teren" (checklist, formular, gaze)
5. "Semnătura clientului pe ecran" (semnatura)
6. "Materiale și scule din mașină" (materiale, scule)
7. "Merge și fără semnal" (m-offline în mobile.css:208 [V])
8. "Mod mănuși și mod soare" (setari/display-toggles)
Feature graphic 1024x500: logo + "Echipe de teren: lucrări, pontaj, poze, semnătură". Folosiți capturi cu date fictive, fără persoane/clienți reali. Pictogramă 512x512: public/icon-512.png există [V].

##### Ce trebuie să facă proprietarul în Play Console (cel mai probabil)
1. Cont dezvoltator (organizație, ca să evite testarea cu 12 testeri; verifică cerințele curente) [N].
2. Keystore de semnare + Play App Signing; build AAB (nu APK) cu `./gradlew bundleRelease`; `google-services.json` prezent (README avertizează să nu publici fără el) [V README pas 3].
3. Declarații: App access (cont reviewer), Data safety, Content rating, țintă: 18+/lucrători, ads: nu, Declarația de locație în fundal + video demonstrativ, Declarația despre serviciul foreground location [N].
4. Politica de confidențialitate: URL-ul de mai sus.
5. Listing: textele de mai sus, capturi, feature graphic. Listing separat în engleză opțional.
6. Testare internă, apoi producție (în România). Cere review explicit pentru locația în fundal, poate dura.
7. După publicare: adaugă linkul Play pe site (login, /aplicatie-tehnician, footer) și `SoftwareApplication` cu `downloadUrl`/`installUrl` în JSON-LD; schimbă formularea "pe Android se instalează aplicația" și butonul APK către Play (păstrează APK ca rezervă).
8. Cere recenzii reale de la primii clienți (în aplicație, nu cumpărate): rating și număr de recenzii decid poziția.

iOS: App Store cere cont Apple Developer plătit și build semnat; momentan e sideload. Până atunci, nu declara "iPhone în App Store" nicăieri (site-ul spune "pe iPhone merge din browser sau ca aplicație": marketing-pages.ts, aplicatie-tehnician FAQ, formulare ok dar atenție).

#### 4. Plan YouTube

Context [V]: pe YouTube, interogarea "FSM - Soft Aplicatie de Management si Programari Interventii Tehnicieni" întoarce video-ul Softimpera (v_RenC3Rp7c, embed în softimpera.ro/servicii/aplicatii-software/fsm-aplicatie-tehnicieni-service) și un video "Programări RO: aplicația pentru firmele de instalații ISCIR și ANRE (prezentare completă)", competitor nou, cu capitole numite. Softimpera e firmă de dezvoltare la comandă (.NET/Blazor, fără prețuri publice; [V] din rezumatul paginii lor). Nu am putut extrage descrierea/vizualizările video-ului lor (YouTube nu le-a returnat în HTML) [N].

Reguli comune: titlul cu interogarea la început, 55-70 caractere; primele 2 rânduri din descriere cu linkul spre site; capitole cu marcaje de timp (pornesc la 0:00, minim 3, fiecare ≥10 s); subtitrări RO (încarcă SRT); miniatură cu text mare; durata 4-8 min; fără prețuri sau funcții neimplementate; ecrane cu date fictive. Canal: "ElectroField", linkul în profil și în fiecare descriere. Postează pe canalul firmei, nu pe cont personal.

##### Video 1: demo principal (ținta: "software management echipe teren")
- Titlu: `Software management echipe de teren pentru electricieni: demo ElectroField`
- Descriere: 
```
Cum arată o zi de lucru într-o firmă de instalații care folosește ElectroField: programarea lucrărilor, aplicația tehnicianului, pontajul, poze și semnătura clientului, documentele și facturarea.
Programează o discuție: https://www.electrofield.ro/programare
Pagina produsului: https://www.electrofield.ro/software-management-echipe-teren

0:00 Problema: Excel și grupuri de WhatsApp
0:40 Biroul programează lucrările pe echipe
1:30 Tehnicianul în telefon: lucrările zilei
2:20 Pontaj în două atingeri
3:00 Poze înainte și după, checklist, semnătură
4:00 Biroul vede lucrarea închisă și documentele
4:50 Facturarea prin SmartBill sau Oblio
5:30 Pentru cine e potrivit
```

##### Video 2 (ținta: "aplicație tehnicieni" / "aplicație gestionare lucrari")
- Titlu: `Aplicație pentru tehnicieni: lucrări, poze și semnătura clientului`
- Descriere: lead "Ce face tehnicianul din telefon, inclusiv fără semnal"; link https://www.electrofield.ro/aplicatie-tehnician
- Capitole: 0:00 Lucrările zilei / 0:45 Pașii lucrării / 1:30 Poze etichetate / 2:15 Checklist și măsurători / 3:00 Semnătura clientului / 3:30 Fără semnal / 4:10 Mod mănuși și mod soare.

##### Video 3 (ținta: "pontaj online" 110/lună, "aplicație pontaj" 70, CPC 11)
- Titlu: `Pontaj pe lucrare din telefon pentru echipe de teren (nu doar ore)`
- Link: https://www.electrofield.ro/pontaj-tehnicieni
- Capitole: 0:00 De ce pontajul clasic nu merge în teren / 0:50 Plecare, sosire, început, final / 1:50 Corecții aprobate de birou / 2:40 Concedii și cheltuieli / 3:20 Export lunar. Atenție: locația se salvează doar la sosire, urmărirea continuă e separată și cere acordul angajatului [V pontaj-tehnicieni FAQ].

##### Video 4 (ținta: "foaie de parcurs electronică", volum 1600 pentru "foaie de parcurs" + 260 "model foaie de parcurs")
- Titlu: `Foaie de parcurs electronică: se face singură din lucrări`
- Link: https://www.electrofield.ro/foaie-de-parcurs-electronica
- Capitole: 0:00 Ce cere foaia de parcurs / 0:40 De unde vin datele / 1:30 Total km și cost lunar / 2:10 ITP și RCA în alerte. Spune clar că forma finală pentru deducere se confirmă cu contabilul [V marketing-pages.ts].

##### Video 5 (ținta: gaze, Ord. ANRE 179/2015; revizie instalație gaze 720, verificare instalație gaze 390)
- Titlu: `Scadențar verificări și revizii gaze: pe bloc, scară și apartament`
- Link: https://www.electrofield.ro/firme-gaze-verificari-revizii
- Capitole: 0:00 Verificare la 2 ani, revizie la 10 / 0:50 Import din Excel / 1:40 Ce e scadent luna aceasta / 2:30 Fișa de evidență din telefon / 3:20 Termenele de după lucrare. Respectă disclaimerul de pe pagină: confirmă cu responsabilul tehnic.

##### Încorporare pe site și VideoObject
Pune fiecare video pe pagina potrivită, sub primul H2, cu `youtube-nocookie.com/embed/ID` și `loading="lazy"` (iframe lazy, ca să nu strice LCP; raportul 06 cere pagini rapide). Un singur video principal pe pagină. Adaugă JSON-LD (după încărcare, înlocuiește ID-urile; nu publica schema fără video real):

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Software management echipe de teren pentru electricieni: demo ElectroField",
  "description": "Cum arată o zi de lucru într-o firmă de instalații cu ElectroField: programare, aplicația tehnicianului, pontaj, poze și semnătură, documente, facturare.",
  "thumbnailUrl": ["https://i.ytimg.com/vi/ID_VIDEO/maxresdefault.jpg"],
  "uploadDate": "2026-12-XXT09:00:00+02:00",
  "duration": "PT6M10S",
  "contentUrl": "https://www.youtube.com/watch?v=ID_VIDEO",
  "embedUrl": "https://www.youtube.com/embed/ID_VIDEO",
  "inLanguage": "ro",
  "publisher": { "@type": "Organization", "name": "ElectroField", "url": "https://www.electrofield.ro" }
}
```
Implementare în Next: câmp opțional `video?: { id; name; description; uploadDate; duration }` în tipul MarketingPage din src/lib/marketing-pages.ts și un bloc JSON-LD în src/app/[slug]/page.tsx (verificat: tipul nu are acum câmp video; crawl-ul nu arată VideoObject pe nicio pagină [V pages.json]). Nu am modificat nimic în repo.
Adaugă și video-urile în sitemap video doar dacă vrei (opțional; schema + embed ajung).

##### Ordine recomandată
1) Video 1 + pagina Play (în paralel, depind de proprietar), 2) Video 2, 3) Video 3 și 4, 4) Video 5. Un video de 5-6 min pe lună e realist; calitatea contează mai mult decât numărul.

#### 5. Decizii pentru proprietar
1. Cont dezvoltator Play (organizație) și cine ține keystore-ul.
2. Cont reviewer pentru App access: da/nu, cu ce date fictive.
3. Dacă publici pe Play înainte de a verifica manifestul final (permisiuni locație) și un build real pe telefon.
4. Canal YouTube al firmei și cine înregistrează ecranul (capturi cu date fictive).
5. App Store: plan separat (cont Apple Developer plătit, Mac sau CI); până atunci textele nu spun "App Store".

Fișiere citite: android-app/{capacitor.config.ts,package.json,README.md,android/app/build.gradle,AndroidManifest.xml,strings.xml,ios/**/Info.plist}, src/lib/{marketing-pages.ts,android-release.ts}, src/app/mobil/**, docs/seo-2026-11/00-sinteza.md, scratchpad/crawl/pages.json. Pagini Play brute: scratchpad/play/*.html.


---

## B.9 Planul de acțiuni pentru proprietar (08-plan-actiuni-proprietar.md)

### Plan de acțiuni pentru proprietar (28 noiembrie 2026)

Ce faci tu, pas cu pas, ca ElectroField să apară în Google. Bifează pe măsură ce termini.

---

#### 1. De ce nu apari încă în Google

La „software de management electricieni și echipe mobile” nu apari încă, pentru că:

- **Site-ul are o săptămână.** Google a indexat circa 29 de pagini.
- **Zero linkuri externe.** Cei de pe prima pagină au ani de istoric, linkuri și titluri cu exact cuvintele căutate.
- **Search Console nu e conectat.**
- Căutarea are volum mic. Volumul e la căutările de documente (foaie de parcurs, PRAM, revizie gaze), pe care lucrează blogul.

**Ce s-a lucrat azi pe site** (detaliile în commitul din 28 nov): pagina /despre, 3 articole noi, titluri și descrieri rescrise, imagini de distribuire pe fiecare pagină, afirmații corectate după ce face platforma acum (iPhone, fără semnal, PRAM), mai multe linkuri între pagini.

**Cât durează:** paginile noi intră în index în zile sau săptămâni. Pentru căutările generale, realist 3–6 luni sau mai mult. **Nimeni nu poate garanta poziții în Google.**

---

#### 2. Săptămâna 1: Search Console, Bing, IndexNow

##### 2.1 Google Search Console (proprietate Domeniu)

Am verificat azi în Vercel: **DNS-ul lui electrofield.ro e la Hostico** (ns1–ns4.hostico.ro), nu în Vercel.

- [ ] 1. https://search.google.com/search-console → „Adaugă o proprietate” → **Domeniu** → `electrofield.ro`
- [ ] 2. Copiază textul TXT (începe cu `google-site-verification=`).
- [ ] 3. **Drumul A (acum):** contul Hostico → domeniul → zona DNS → înregistrare nouă:
  ```
  Tip: TXT
  Nume/Host: @   (sau gol)
  Valoare: google-site-verification=...
  ```
  Nu atinge înregistrările A și CNAME: țin site-ul pornit.
- [ ] 3b. **Drumul B (doar dacă muți DNS-ul în Vercel):** Vercel → Domains → electrofield.ro → DNS Records → Add, tip TXT, nume `@`, aceeași valoare.
- [ ] 4. Search Console → **Verifică**. Poate dura până la 2–3 zile. Nu șterge apoi TXT-ul.
- [ ] 5. „Sitemapuri” → `https://www.electrofield.ro/sitemap.xml` → Trimite.
- [ ] 6. „Inspectarea adresei URL” → fiecare adresă → **Solicită indexarea**. La mesaj de cotă, continui mâine.

```
https://www.electrofield.ro/
https://www.electrofield.ro/software-management-echipe-teren
https://www.electrofield.ro/firme-instalatii-electrice
https://www.electrofield.ro/firme-gaze-verificari-revizii
https://www.electrofield.ro/firme-fotovoltaice
https://www.electrofield.ro/aplicatie-tehnician
https://www.electrofield.ro/pontaj-tehnicieni
https://www.electrofield.ro/despre
https://www.electrofield.ro/blog/model-foaie-de-parcurs
https://www.electrofield.ro/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate
```

##### 2.2 Bing Webmaster Tools
- [ ] https://www.bing.com/webmasters → „Import from Google Search Console”.

##### 2.3 IndexNow după fiecare deploy
Anunță Bing și alte motoare (nu Google) că s-au schimbat pagini.
- [ ] După ce deploy-ul e live, din folderul proiectului: `npm run seo:indexnow` (trimite tot sitemap-ul). Doar previzualizare: `npm run seo:indexnow -- --dry-run`. O dată pe deploy, nu mai des.

##### 2.4 Google Business Profile: verifică întâi dacă ai voie
Google acceptă profil doar dacă ai **o adresă unde te vizitează clienții** sau **te deplasezi la clienți**. ElectroField lucrează online, deci probabil nu e eligibil. **Nu folosi adresă virtuală sau închiriată**: e interzis și duce la suspendare.
- [ ] Dacă primești clienți la un birou: https://www.google.com/business/ → categoria **„Companie de software”**, datele de mai jos.

##### 2.5 Aceleași date peste tot
Exact ca pe /despre:
```
Nume: ElectroField
Site: https://www.electrofield.ro
E-mail: contact@electrofield.ro
Telefon: 0750 425 670 (+40 750 425 670)
Localitate: București, Sector 1, România
CUI: 55851462 · Reg. Com.: F2026050162004
```
La PFA, „denumirea legală” conține numele tău. În câmpurile publice scrie „ElectroField”.
- [ ] Fă pagini ElectroField pe LinkedIn, Facebook și YouTube și trimite-mi linkurile (le pun în schema `sameAs`).

---

#### 3. Săptămânile 1–4: listări și linkuri

Peste tot trimiți: descrierile din secțiunea 4, logo (`public/icon-512.png`), 4–6 capturi cu date fictive, contact@electrofield.ro. Preț: „la cerere” / „Contact for pricing”. Probă gratuită: nu. Platforme: Web și Android.

| # | Unde | Ce faci | Cost |
|---|------|---------|------|
| 1 | https://www.capterra.com/vendors/ (apare și pe GetApp, Software Advice) | „Get Your Product Listed”, categoria Field Service Management | gratuit, de confirmat |
| 2 | https://www.saashub.com | „Submit your product” | gratuit |
| 3 | https://alternativeto.net | „Add application” | gratuit |
| 4 | https://sourceforge.net/software/ | „Add product” | gratuit, de confirmat |
| 5 | https://www.crozdesk.com | înscriere furnizor | de confirmat |
| 6 | https://www.softwaresuggest.com | înscriere furnizor | de confirmat |
| 7 | https://www.g2.com/products/new | pagină produs | gratuit, de confirmat |
| 8 | Oblio: https://www.oblio.eu/integrari | contact, cerere de listare la integrări | gratuit |
| 9 | SmartBill: vreauapi@smartbill.ro | cerere de listare ca aplicație integrată | necunoscut |
| 10 | StartupCafe: redactie@startupcafe.ro | e-mailul 4.3 | gratuit, negarantat |
| 11 | https://start-up.ro/contact/ | același text | gratuit, negarantat |
| 12 | PSR/RPIA: https://rpia.ro/membership/ | **de verificat** dacă primesc firme de software | necunoscut |
| 13 | Cursuri ANRE (ex. https://www.upet.ro/cursanre/) | **de verificat**; e-mailul 4.4 | gratuit |
| 14 | 3–5 bloguri de contabili | ghidul e-Factura B2B, fără să ceri link | gratuit |
| 15 | https://softlead.ro/companii-software | **mai târziu**, după primii clienți | 900–2.500 EUR/an + TVA |

Înainte de 8 și 9: emite o factură de test dintr-un cont real SmartBill și unul Oblio. Integrările nu au fost încă încercate pe o firmă reală.

Alte asociații (AEI, ANIE, AIIR, OAER, ARIES): de verificat manual. Fără schimburi de linkuri sau spam: Google penalizează.

---

#### 4. Texte gata de copiat

##### 4.1 Descriere scurtă
```
ElectroField este o platformă românească pentru firmele de instalații electrice, gaze și fotovoltaice cu echipe în teren. Biroul programează lucrările în calendar și pe hartă, din browser. Tehnicianul le vede în aplicația Android (APK, descărcată de pe site) sau, pe iPhone, din browser: pașii lucrării, poze, checklist, măsurători și semnătura clientului. Pozele, semnătura, sosirea, începutul și finalul se salvează pe telefon și pleacă singure când revine semnalul. Platforma ține pontajul pe lucrare, stocul de pe mașini, autorizațiile ANRE și scadențarul de gaze. Factura se emite prin contul SmartBill sau Oblio al firmei.
```

##### 4.2 Descriere lungă
```
ElectroField (https://www.electrofield.ro) este un software de management pentru firmele de instalații electrice, gaze și fotovoltaice din România. Ține într-un singur loc clienții, lucrările, echipele, pontajul, materialele, documentele și facturarea. Biroul lucrează în browser; tehnicienii folosesc aplicația Android (APK, descărcată de pe site) sau, pe iPhone, din browser.

În teren, tehnicianul vede lucrările zilei, face poze etichetate, bifează checklistul, trece măsurătorile și ia semnătura clientului pe ecran. Pontajul se face pe lucrare: plecare, sosire cu locația, început și final. Pozele, semnătura, sosirea, începutul, finalul și formularele se salvează pe telefon și pleacă singure când revine semnalul. Biroul vede pe hartă lucrările și echipele, orele pe om și pe lucrare și stocul fiecărei mașini.

Pentru electrice: măsurători pe circuite, proces-verbal de lucrări ascunse cu poze, înregistrare semnată doar de cine are autorizație ANRE valabilă. Pentru gaze: scadențar pe bloc, scară și apartament și fișa semnată pe telefon. Pentru fotovoltaice: dosar pe etape cu termenele operatorului și formularul de punere în funcțiune. Factura se completează din ore și materiale și se emite prin contul SmartBill sau Oblio al firmei. Platforma e nouă, din 2026; o prezentare se programează pe https://www.electrofield.ro/programare.
```

##### 4.3 E-mail către presă
**Subiect:** `Platformă românească nouă pentru firmele de instalații cu echipe în teren`
```
Bună ziua,

Vă scriu de la ElectroField (https://www.electrofield.ro), o platformă românească lansată în 2026 pentru firmele de instalații electrice, gaze și fotovoltaice cu echipe în teren.

Multe firme mici de instalații țin lucrările în Excel și pe WhatsApp, deși au acte și termene stricte: autorizații ANRE, fișe de gaze, dosare de prosumator. ElectroField leagă programarea, aplicația tehnicianului, pontajul, materialele și facturarea prin SmartBill sau Oblio. Pe blog publicăm ghiduri gratuite, de exemplu https://www.electrofield.ro/blog/model-foaie-de-parcurs.

Dacă subiectul vă interesează, vă trimit o descriere sau programăm o discuție: https://www.electrofield.ro/programare?utm_source=startupcafe

Mulțumesc,
[numele tău], ElectroField
contact@electrofield.ro · 0750 425 670
```
Pentru start-up.ro: `utm_source=startupro`.

##### 4.4 E-mail către asociații și cursuri ANRE
**Subiect:** `Ghiduri gratuite pentru membri: PRAM, autorizație ANRE, foaie de parcurs`
```
Bună ziua,

Vă scriu de la ElectroField (https://www.electrofield.ro), o platformă românească pentru firmele de instalații electrice, gaze și fotovoltaice cu echipe în teren.

Membrii [cursanții] dumneavoastră lucrează cu documentele explicate în ghidurile noastre gratuite, pe care le puteți folosi sau cita:
https://www.electrofield.ro/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate
https://www.electrofield.ro/blog/autorizatie-anre-electrician

Pot face și o prezentare scurtă a platformei pentru membri. O discuție se programează aici: https://www.electrofield.ro/programare?utm_source=[asociatie]

Mulțumesc,
[numele tău], ElectroField
contact@electrofield.ro · 0750 425 670
```
`[asociatie]` = numele cu litere mici, fără spații (ex. `psr`). Vezi rezultatele în /admin/analitice.

---

#### 5. Google Play și App Store

**De decis înainte:**
- **Cont personal:** Google afișează public **numele tău legal**, țara și e-mailul. Conturile personale noi fac întâi un test închis: **minimum 12 testeri, 14 zile la rând**.
- **Cont de organizație:** cere număr D-U-N-S; afișează denumirea legală (la PFA conține numele tău), adresa și telefonul.
- Taxă unică de înregistrare (suma în Play Console).
- Mai trebuie: build AAB semnat, `google-services.json`, declarația pentru locația în fundal (cu video), Data safety, cont pentru recenzorul Google cu date fictive (decizia ta).
- Risc: Google poate respinge o aplicație care doar afișează un site. În nota pentru recenzor scrie ce face nativ: GPS în fundal cu acord, notificări push, camera. Separat: ce face tehnicianul la client se salvează pe telefon și pleacă când revine semnalul.

**Listing** (verificat pe ce face platforma):
```
Titlu: ElectroField: Pontaj lucrări
Descriere scurtă: Pontaj, lucrări, poze și semnătura clientului pentru echipe de instalații

ElectroField este aplicația tehnicianului pentru firmele de instalații electrice, gaze și fotovoltaice. Se folosește cu un cont creat de firma ta în platforma ElectroField (www.electrofield.ro).

• Lucrările zilei, cu adresa și navigare spre client
• Pontaj pe lucrare: plecare, sosire, început, final
• Poze etichetate, checklist, măsurători, semnătura clientului
• Materiale din mașină, cheltuieli cu poza bonului, concedii
• Fără semnal: pozele, semnătura, sosirea, începutul, finalul, formularele și fișele de gaze se salvează pe telefon și pleacă singure când revine semnalul
• Mod „mănuși” și mod „soare”

Locația se salvează la sosire. Urmărirea continuă pornește doar dacă firma o activează și tu îți dai acordul.
```
- [ ] Când aplicația e **live**, trimite-mi linkul. Abia atunci scriu „Google Play” pe site.

**App Store:** cere abonament anual Apple Developer și build semnat. Până atunci, pe site rămâne „pe iPhone, din browser”.

---

#### 6. YouTube

Canalul firmei, 4–8 minute, date fictive pe ecran, subtitrare în română, fără prețuri și fără funcții care nu există.

**Video 1 (căutarea principală)**
```
Titlu: Software de management pentru electricieni și echipe de teren: demo

Cum arată o zi într-o firmă de instalații cu ElectroField: programare, aplicația tehnicianului, pontaj, poze și semnătură, documente, facturare.
Programează o discuție: https://www.electrofield.ro/programare?utm_source=youtube
Pagina produsului: https://www.electrofield.ro/software-management-echipe-teren

0:00 Problema: Excel și grupuri de WhatsApp
0:40 Biroul programează lucrările pe echipe
1:30 Tehnicianul în telefon: lucrările zilei
2:20 Pontaj pe lucrare
3:00 Poze, checklist, semnătură
4:00 Biroul vede lucrarea închisă și documentele
4:50 Facturarea prin SmartBill sau Oblio
5:30 Pentru ce firme e potrivit
```

**Video 2:** `Aplicație pentru tehnicieni: lucrări, poze și semnătura clientului` → /aplicatie-tehnician. Capitole: 0:00 Lucrările zilei · 0:45 Pașii lucrării · 1:30 Poze · 2:15 Checklist și măsurători · 3:00 Semnătura · 3:30 Ce merge fără semnal.

**Video 3:** `Pontaj pe lucrare din telefon pentru echipe de teren` → /pontaj-tehnicieni.

**Video 4:** `Foaie de parcurs electronică, din lucrările făcute` → /foaie-de-parcurs-electronica. Spune că forma finală se confirmă cu contabilul.

**Video 5:** `Scadențar verificări și revizii gaze pe bloc, scară și apartament` → /firme-gaze-verificari-revizii. Spune că termenele se confirmă cu responsabilul tehnic.

- [ ] După încărcare, **trimite-mi linkul fiecărui video**: îl pun pe pagina potrivită, cu schema VideoObject.

---

#### 7. Recenzii reale

Cere recenzii doar firmelor care au folosit platforma câteva săptămâni, cu link direct (Capterra; Google, dacă ai profil). **Niciodată** recenzii scrise de tine, de prieteni, dictate sau răsplătite.

**Subiect:** `Două minute pentru o părere despre ElectroField?`
```
Salut, [prenume],

Folosești ElectroField de câteva săptămâni. Mi-ar prinde bine o părere sinceră, bună sau rea: [link recenzie]

Ce te-a încurcat mă ajută să repar.

Mulțumesc,
[numele tău]
```

---

#### 8. Ce urmărești și ce îmi trimiți

| Când | În Search Console | Ce e normal |
|------|-------------------|-------------|
| 2 săpt. | Pagini; Sitemapuri | sitemap „Succes”, paginile cheie indexate |
| 4 săpt. | Performanță → Interogări | primele afișări pe ghiduri |
| 8 săpt. | Performanță → Pagini; Linkuri | afișări pe paginile pe meserii, primele linkuri |
| 12 săpt. | Performanță, 3 luni | poziția medie scade pe căutările țintă |

**Trimite-mi:**
- [ ] exportul CSV din Performanță (Interogări + Pagini);
- [ ] captura „De ce nu sunt indexate paginile”;
- [ ] linkurile listărilor aprobate și ale profilurilor LinkedIn, Facebook, YouTube;
- [ ] linkurile video-urilor și Google Play, când există;
- [ ] sursele `utm_source` din /admin/analitice și câte programări au venit.


---

Cercetarea anterioară (25 noiembrie 2026) e în repo, în docs/seo-2026-11/00-sinteza.md … 07-concurenti.md, iar planul pentru proprietar e în 08-plan-actiuni-proprietar.md.
