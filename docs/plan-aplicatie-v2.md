# Plan: aplicația tehnicianului v2, facturare, AI și remedieri

Data: 2026-11-07. Bazat pe 8 rapoarte de cercetare din `docs/cercetare-2026-11/` și pe mockup-ul aplicației (13 panouri, link în secțiunea 9).

Fiecare afirmație externă din rapoarte are un nivel de încredere (verificat / secundar / neconfirmat). Tot ce e legat de legislație (ANRE, ISCIR, TVA, e-Factura) trebuie validat cu un specialist autorizat și cu contabilul înainte de a fi promis unui client.

## 1. Rezumat

1. **Platforma funcționează tehnic** (`tsc`, `eslint`, `build` fără erori), dar auditul a găsit **2 probleme P0 de securitate**: un tehnician își poate schimba singur rolul în admin și are drepturi de staff pe toată organizația. Se repară înainte de orice client nou (secțiunea 3).
2. **Proconstructo** (București, peste 20 de angajați, nucleul = gaze la blocuri și asociații) este un client potrivit. Ușa de intrare: postul de responsabil tehnic pe care îl angajează acum.
3. **Tehnologie aplicație: hibrid.** PWA + Web Push acum, apoi Capacitor iOS/Android în magazine, același cod Next.js. Fără rescriere nativă, React Native sau Flutter.
4. **Facturare: Oblio primul, SmartBill al doilea**, în spatele unei interfețe comune `InvoiceProvider`. Facturile se emit doar online, cu draft offline.
5. **AI scanare: Claude Haiku 5.5** cu structured outputs, validatori deterministi și confirmare umană obligatorie pe sume. Cost estimat ~0,7 USD / 1.000 scanări.
6. **Mockup nou**: 4 taburi + buton Scanează, hub de lucrare cu secțiuni și un singur buton principal, formulare pe domeniu, factură, AI, setări, stări offline.

## 2. Ce am descoperit pe Proconstructo (rezumat, raport 01)

- Servicii pentru instalații în clădiri existente: verificări gaze la 2 ani, revizii la 10 ani, separări, instalații de utilizare, senzori cu electrovană; plus centrale termice, hornuri, sanitare, climă.
- Piață: București și Ilfov; clienți persoane fizice, asociații de proprietari (segmentul-cheie), firme și instituții. După explozia din Rahova (oct. 2025) cererea a crescut și programările au ajuns la 2+ săptămâni.
- Motive de pitch, în ordine: (1) unealta responsabilului tehnic: ordine de lucru, echipe, scule, stoc; (2) dovadă de execuție pe fiecare apartament (foto, semnătură, PDF); (3) mai multe vizite pe zi cu aceiași oameni; (4) cost real și profit pe lucrare; (5) control pe stoc și aparate scumpe.
- Lacune ale produsului pentru ei, în ordinea impactului: mentenanță recurentă pe scadență; formulare reglementate cu câmpuri structurate; lucrări în masă pe bloc/scară/apartament; ofertare; facturare SmartBill/Oblio; offline; seria aparatelor și calibrare; pipeline lead-uri.
- Preț: planul Pro (599 lei/lună, 15 utilizatori) nu acoperă peste 20 de angajați. Ofertă personalizată sau pilot cu 2 echipe.
- Neverificat: numerele autorizațiilor, cifra de afaceri, instrumentele folosite intern.

## 3. Probleme găsite în platformă (raport 08)

### P0, de reparat imediat

| # | Problemă | Reparație propusă |
|---|---|---|
| 1 | `profiles_update` nu are `WITH CHECK`, iar rolul `authenticated` poate face UPDATE pe `role`, `organization_id`, `client_id`, `is_active`. Un tehnician se poate face admin. `updateUserRole` nu verifică rolul apelantului. | Trigger BEFORE UPDATE care blochează schimbarea acestor coloane de către non-admin; `WITH CHECK`; verificare de rol în `updateUserRole`. |
| 2 | `is_staff()` = `role <> 'client'`, deci tehnicianul are drepturi de staff: poate șterge clienți și lucrări, marca facturi plătite, citi GPS-ul, pontajele, cheltuielile, facturile, documentele HR și `hourly_rate` ale tuturor. | `is_staff()` doar pentru roluri de birou; politici separate pentru tehnician (doar propriile date și lucrările alocate). |

### P1

3. Auto-aprobare: tehnicianul își aprobă cheltuielile și concediile.
4. `next_invoice_number` (SECURITY DEFINER) apelabilă cross-tenant; `org_update` lasă adminul de tenant să-și schimbe planul și `is_active`.
5. Storage `attachments`: orice membru citește sau șterge orice fișier al organizației.
6. Ore afișate în UTC (cu 2–3 h în urmă) în pagini și în PDF-ul semnat; ferestrele „azi" din dashboard, hartă, pontaj sunt tot în UTC.
7. Tehnician adăugat în echipă nu vede lucrările echipei (`addMember`/`removeMember` nu sincronizează alocările).
8. Adminul nu e notificat pentru cereri de achiziție, alerte, note „problem", finalizări, concedii, cheltuieli; push doar pe Android.
9. `createInvoice` din `clienti/actions.ts` folosește `count+1` și intră în coliziune cu contorul atomic; nu există TVA, scadență, PDF, e-Factura.
10. `admin/actions.ts:75` hardcodează `new_plan: "pro"` la fiecare salvare a unei companii.

### P2 (selecție)

Acțiuni care ignoră erorile Supabase; `depot_arrival` încalcă CHECK-ul și nu se salvează; thread-urile de mesaje arată cele mai vechi 200 de mesaje; limita de 1000 de rânduri taie traseul GPS; 22 și 18 interogări pe dashboard și hartă; 33 FK fără index; stoc rotunjit la întreg cu race; lipsesc safe-area și `viewport-fit`; căutarea din Topbar și tab-urile „în curând" din Setări sunt moarte; statusul `anulata` nu poate fi setat; ștergere de tokenuri push pe orice `NOT_FOUND`; `notifications_insert` permite destinatari cross-tenant.

Detalii cu fișier și linie: `docs/cercetare-2026-11/08-audit-platforma.md`.

## 4. Ce face aplicația nouă (mockup)

Link: https://claude.ai/artifact/XLTdGV153m6biPsJtQXFwi (privat, doar proprietarul). Structură:

- **Bara de jos:** Acasă · Lucrări · Scanează (buton central) · Mesaje · Meniu.
- **Acasă:** următoarea lucrare cu un buton mare, acțiuni rapide, mesaj necitit, restul zilei.
- **Lucrări:** Listă / Calendar / Hartă, filtre pe domeniu, stare, interval.
- **Hub de lucrare** în loc de wizardul de pași forțați: faze Pregătire → Drum → Pe loc → Închidere, secțiuni cu stare (Formular, Fotografii, Materiale, Note, Semnătură), un buton principal fix jos. Cerințele lipsă apar doar la închidere. Excepție explicită „Nu pot finaliza" cu motiv.
- **Formulare pe domeniu** (gaze, fotovoltaic, electric) cu câmpuri tipizate, calcule automate și citire de pe aparat prin cameră.
- **Închidere:** semnătură, rezumat cu factură (SmartBill/Oblio), încasare, PDF-uri și trimitere pe email/WhatsApp/SMS.
- **AI:** cameră cu detectare document, verificare date cu semnalizarea câmpurilor nesigure, etichetă echipament cu programare automată a scadenței.
- **Resurse:** cheltuieli cu scanare bon, pontaj derivat din statusuri, documente și autorizații cu alertă înainte de expirare.
- **Comunicare:** mesaje cu răspunsuri rapide, notificări pe categorii, cerere de apel.
- **Setări:** notificări (fără ecranul confuz de test), aspect cu moduri „Soare" și „Mănuși", locație cu program și consimțământ, securitate, spațiu, sincronizare, ajutor.
- **Stări:** offline cu coadă de sincronizare vizibilă, ajutor, ziua liberă.

Insight-uri aplicate din analiza concurenței (raport 04): 4–5 taburi, buton principal cu etichetă schimbătoare, timp derivat din statusuri, offline vizibil, text minim 12–13 px și contrast bun (codul actual are text de 10,5 px în ~63 de locuri și tab inactiv la ~2,6:1).

## 5. Tehnologia aplicației (raport 07)

**Recomandare: hibrid.**

| Fază | Ce | De ce |
|---|---|---|
| Luna aceasta | Fix `middleware` (nu exclude `/sw.js` și `manifest.json`, deci instalarea PWA poate fi deja stricată); Web Push complet (VAPID, tabel `web_push_subscriptions`, `public/sw.js`, ghid „Adaugă pe ecranul principal"); outbox offline în IndexedDB pentru poze, semnătură, închidere; pornirea conturilor Apple și Google | iPhone-urile și adminii primesc push; offline pentru subsoluri; conturile au timp de așteptare |
| 3 luni | Capacitor iOS + Android cu GPS fundal, APNs prin FCM, scanner ML Kit, biometrie; TestFlight, App Store, Play | funcții native reale reduc riscul de respingere Apple (4.2) |
| Mai târziu | Doar dacă offline devine blocant: 3–4 ecrane într-un client local cu API | evită rescrierea |

Limite verificate: Web Push pe iOS merge doar pentru PWA instalat; PWA nu poate face GPS în fundal; Next static export nu suportă server actions; Google Play cere declarație, video și „prominent disclosure" pentru locația în fundal, plus 14 zile de test închis pentru conturi personale noi.

De evitat: rescrierea nativă acum, `output: export`, dependența de Background Sync sau Web NFC pe iOS, un binar iOS doar WebView.

Neconfirmat din surse primare: prețurile Apple, Google, EAS; Apple Business Manager și D-U-N-S.

## 6. Facturare (raport 05)

**Stare:** `invoices` e evidență internă (4 sume), numerotare locală, fără linii, TVA, plăți sau e-Factura. Nu există prețuri de vânzare (doar costuri).

**Furnizori:**
- **Oblio**: OAuth, `idempotencyKey`, webhook-uri, listare, endpoint e-Factura, storno și proformă→factură. 29 €/an. Rate limit 30 cereri/100 s.
- **SmartBill**: V1 Basic / V3 Bearer; fără webhook-uri, fără endpoint e-Factura, fără idempotență, documentele API consumă din cota abonamentului. Oferă `paymentUrl` pentru plata cu cardul.
- Niciunul nu are sandbox. Alegerea primului depinde de ce folosesc majoritatea clienților (Proconstructo: de întrebat).

**Design:**
1. Interfață `InvoiceProvider` (Oblio, SmartBill, apoi altele).
2. Chei API în Supabase Vault (tiparul există deja în `platform_mail_vault.sql`).
3. Draft cu linii calculate pe server din materiale, ore, km, cheltuieli; prețuri de vânzare configurabile.
4. Coadă de emitere (outbox) cu idempotență, retry pe tip de eroare, audit append-only.
5. Numărul fiscal vine doar de la furnizor.
6. Mobil: revizuire linii, semnătură legată de hash-ul liniilor, apoi proformă sau factură după politica firmei, trimitere și încasare.
7. Offline: doar draft-uri, fără emitere fiscală offline.

**De validat cu contabilul:** e-Factura B2C și termen (surse secundare: 5 zile lucrătoare), cota TVA 21% din 1 august 2025 (de confirmat) și cotele reduse pentru instalații și panouri, taxarea inversă în construcții, regula pentru casa de marcat la încasări în numerar.

## 7. AI de scanare (raport 06)

- **Stare:** AI doar prin Groq (Whisper, Llama), fără vision. Pregătite și nefolosite: `expense_receipts.ocr_data`, `subscriptions.ai_credits`. `expenses.job_id` e NOT NULL (facturile de furnizor fără lucrare cer o decizie de produs).
- **Principal:** Claude Haiku 5.5 cu structured outputs și schemă pe tip de document (bon, factură, etichetă, document); Sonnet 5.5 doar pentru documentele nesigure; clasificare separată. Apoi validatori deterministi: checksum CUI, totaluri, verificare ANAF; confirmare umană obligatorie pe sume.
- **Fallback:** Gemini Flash-Lite pe Vertex AI, endpoint UE, prin stratul `DocumentExtractor`. API-ul Anthropic direct nu are regiune UE: dacă rezidența UE e cerință contractuală, rolurile se inversează.
- **Exclus:** Textract, Document AI Expense Parser (fără română), Tesseract/PaddleOCR (fără câmpuri structurate). Plan C pentru facturi: Azure prebuilt sau Document AI Invoice Parser (mai scumpe).
- **Cost** per 1.000 scanări: Haiku ~0,7 USD; cascadă cu 20% Sonnet ~3,2 USD. Cotele pe plan servesc la oprirea abuzului.
- **Captură:** faza 1 `<input capture>` cu compresie și decupare manuală (fără APK nou); faza 2 ML Kit Document Scanner, multi-pagină, coadă offline.
- **Piese de server:** tabele `document_scans`, `document_scan_pages`, `scan_corrections`, `ai_usage_events`, `anaf_cache`; rute `/api/scans/*`; fișiere noi în `src/lib/ai/`.
- **Înainte de cod:** benchmark 1–2 zile pe 150–300 de documente românești reale (nu există benchmark public). Posibil bug latent: limita de ~4,5 MB pe corpul cererilor Vercel pentru poze prin server actions; trimitere directă în Storage cu URL semnat.

## 8. Sector: gaze, electric, fotovoltaic (rapoarte 02 și 03)

**Gaze:**
- Trei regimuri: racord (operator, Ord. 18/2021), instalație de utilizare nouă (Ord. 156/2020, cu modele oficiale), verificare la 2 ani și revizie la 10 ani (Ord. 179/2015, mod. 96/2023). Centralele țin de ISCIR.
- Autorizări: firma EDIB/ET, proiectare PDIB/PT; instalatori cu legitimație EGIU (5 ani); RTE cu studii superioare și 3 ani experiență. **Un PV semnat cu legitimație expirată duce la refuz la punerea în funcțiune.**
- ANRE a anunțat la 29.05.2026 un regulament nou care abrogă Ord. 132/2021; numărul și data intrării în vigoare nu au fost găsite.
- Probe de presiune: valorile depind de regim și amplasare; **nu se hardcodează**. Formularele cer încă „24 h", normele noi nu.
- Scadența aparține locului de consum, nu lucrării; o revizie înlocuiește verificarea din același an.
- Riscuri: semnătura „cu degetul" nu are garanția acceptării de operator; CNP, serie CI, IBAN cer minimizare și DPA; retenția documentelor.
- 20 de șabloane propuse (protocol probă, PV recepție, PV PIF, fișe VTP/RTP, registru anual, dosar instalație, registru autorizații, scadențar).

**Electric și fotovoltaic:**
- Gradele din brief erau greșite: Ord. ANRE 66/2023 are gradele I, IIA/IIB, IIIA/IIIB, IVA/IVB (A proiectare, B execuție), viză la 5 ani.
- Procesul PV: Procedura ANRE 19/2022, 6 căi (Anexele 1–5); majoritatea documentelor se pot autogenera.
- Dosarul instalației are doar 4 documente (PV recepție, buletin priză, certificate și fișe tehnice, schemă monofilară).
- AFM: garanție 200.000 lei, factură cu cod QR, plată în 60 zile; programele din 2026 neclare.
- Valorile-limită ale măsurătorilor (priză, izolație, Voc/Isc) provin din surse secundare și trebuie confirmate în normative.

## 9. Etape propuse

| Etapă | Conținut | Dependențe |
|---|---|---|
| **0. Securitate (acum)** | P0 și P1 din secțiunea 3 | nimic |
| **1. Fundamente app** | middleware/manifest; fusul orar RO; safe-area; hub de lucrare; contrast și dimensiuni text; erori Supabase tratate | 0 |
| **2. Web Push** | VAPID, service worker, tabel abonamente, notificare admini (achiziții, finalizări, alerte), ghid iPhone | chei VAPID în Vercel |
| **3. Formulare și scadențe** | șabloane gaze/electric/FV cu câmpuri tipizate; scadențar pe loc de consum; registru autorizații cu alertă | validare cu instalator/electrician autorizat |
| **4. Facturare** | `InvoiceProvider` + Oblio; linii și prețuri de vânzare; coadă de emitere; mobil: rezumat, factură, încasare | decizie furnizor, contabil |
| **5. AI scanare** | benchmark; bon/factură/etichetă; verificare ecran; cote | chei API, benchmark |
| **6. Offline** | outbox IndexedDB pentru poze, semnătură, închidere | 1 |
| **7. Capacitor iOS/Android** | GPS fundal, push nativ, scanner, biometrie; magazine | conturi Apple/Google |
| **8. Oferte, loturi pe bloc, SmartBill** | ofertare, ierarhie bloc/scară/apartament, al doilea furnizor | 4 |

## 9b. Decizii de produs de luat cu clientul (Proconstructo și alții)

Aplicația oferă mecanismul; regula o alege firma.

1. **Cine emite factura?** A: tehnicianul emite pe loc (firme mici, persoane fizice, plată la fața locului). B: tehnicianul pregătește draftul, biroul emite (firme cu contabil, asociații, B2B). C: fără factură din aplicație. Regula se setează per firmă și per tip de client, cu plafon și aprobare pentru sume mari. Implicit: B. Numărul fiscal vine mereu de la SmartBill/Oblio. Numerarul și casa de marcat: de lămurit cu contabilul.
2. **Legitimații și autorizații.** Legitimația EGIU este personală (instalatorul, 5 ani); autorizația EDIB/ET este a firmei. Aplicația alertează înainte de expirare și blochează semnarea unui PV de gaze cu legitimație expirată. De validat cu un instalator autorizat și cu regulamentul ANRE nou din 2026.
3. **Cheltuieli.** Aplicația doar înregistrează, cu câmpul „Cum ai plătit?" (din banii mei = decont / card firmă) și aprobare de birou. Reținerile din salariu nu se automatizează (contract și HR, diferă de la firmă la firmă).

## 10. Întrebări deschise pentru proprietar

1. Ce furnizor de facturare folosește Proconstructo (SmartBill sau Oblio)?
2. Cont Apple Developer și Google Play: la cine se înregistrează și cu ce entitate?
3. Chei VAPID, `FIREBASE_*` (neverificate pe Vercel), cheie Anthropic pentru AI.
4. Rezidența datelor în UE este cerință contractuală pentru clienți?
5. Cine din echipă poate valida formularele de gaze și electric (persoană autorizată)?
6. Accentul implicit: verde neon sau albastru?
