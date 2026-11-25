# Analiza platformei ElectroField și planul de îmbunătățiri

Data: 2026-11-24. Bazată pe: analiza codului (rute, tabele, fluxuri, build) și pe 12 rapoarte noi din `docs/cercetare-2026-11-d/` (ziua electricianului, a echipei fotovoltaice, a instalatorului de gaze, biroul/dispeceratul, patronul, UX-ul aplicațiilor concurente, documente și semnături, SSM, stoc/scule/mașini, experiența clientului, telefoane/offline, AI). Nu repetă `sinteza-cercetare-si-optimizare-platforma.md`.

**Cum citești:** [C] confirmat pe un text citit (inclusiv cod), [S] din rezumat sau sursă secundară, [E] estimare. Aproape toate sursele despre firme românești mici sunt [S]/[E]; textele de lege citite direct sunt marcate [C]. Nimic de aici nu înlocuiește interviurile cu firme reale.

---

## 1. Concluzia în 7 puncte

1. **Cea mai mare lipsă: modulele noi există doar la birou, nu și în aplicația tehnicianului [C, cod].** Scadențarul de gaze, dosarul fotovoltaic, măsurătorile electrice și conformitatea se completează doar din platformă (`src/app/(app)/gaze|fotovoltaic|electric|conformitate`). În `src/app/mobil` nu apare niciuna dintre tabelele lor. Deci datele de teren ajung tot pe hârtie și sunt retranscrise la birou. Toate cele trei rapoarte pe domenii cer exact ecranele de teren care lipsesc.
2. **Două sisteme paralele pentru formulare tehnice [C, cod].** Aplicația salvează formularele în `job_forms` (șabloane din `src/lib/forms/templates.ts`), iar modulul Electric de la birou citește `electric_measurements`. Ce măsoară tehnicianul nu apare în pagina Electric. Trebuie unificate înainte de a adăuga formulare noi.
3. **Fără mod offline [C, cod].** Aplicația e un WebView al site-ului live, fără service worker. Fără semnal apare eroarea Chrome. Offline e cel mai repetat reproș în recenziile aplicațiilor concurente [S]. La subsoluri și blocuri e o problemă reală [E].
4. **Gazele au acum o bază legală citită, nu doar estimată [C, Ord. ANRE 179/2015 consolidat].**
   - Fișa de evidență are 15 operațiuni la verificare și 17 la revizie (forma consolidată după Ord. 96/2023; 14/16 în forma din 2020), cu 3 semnături.
   - Firma o înregistrează la operator în 5 zile lucrătoare, iar clientul primește exemplarul în încă 2 zile lucrătoare.
   - Firma ține un registru anual electronic.
   - E cel mai bine documentat și mai diferențiator lucru pe care îl putem construi.
5. **Biroul are deja toate datele pentru „avertizări la programare”, dar nu le folosește [C, cod; S, concurență].** Calendarul nu verifică:
   - dacă echipa are autorizație valabilă pentru domeniu;
   - dacă mașina are ITP sau RCA expirat;
   - dacă lipsesc materialele;
   - dacă echipa e supraîncărcată.

   Concurenții nu leagă programarea de stoc și autorizații [S].
6. **Patronul vrea 3 cifre, nu 30 [S].** Un ecran „luni dimineața” cu cifrele alese de el, praguri cu alertă, restanțe pe vechime (0–30/31–60/61–90/90+) și marjă pe tip de lucrare. Marja pe lucrare și „Bani de recuperat” există deja; lipsesc pragurile, vechimea restanțelor și marja agregată pe tip/echipă.
7. **Riscuri tehnice care pot strica totul [C].**
   - **Fără teste automate și fără verificare la fiecare push:** există doar `lint` și workflow-ul iOS.
   - **Ramura de lucru e și ramura de producție:** am avut deja o suprascriere a producției cu cod vechi.
   - **Un proiect Vercel duplicat (`crm`)** construiește la fiecare push.
   - **Advisorii de securitate Supabase nu i-am putut rula** de data asta (permisiune refuzată).

---

## 2. Ce construim, în ordine (plan propus)

Efort: **S** = câteva zile, **M** = 1–2 săptămâni, **L** = peste 2 săptămâni [E]. „Dovadă” = de unde vine nevoia.

### Etapa 1 — Fundație (înainte de funcții noi)
| # | Ce | Pentru cine | Dovadă | Efort |
|---|---|---|---|---|
| 1 | Teste automate (suita E2E de 60 de verificări, mutată în repo) + CI care rulează `tsc`, `lint`, build și testele la fiecare push | toți | incidentele de regresie [C] | S |
| 2 | Producția doar din `main`, ramurile de lucru doar previzualizare; ștergerea proiectului Vercel `crm` | toți | suprascrierea producției [C] | S |
| 3 | Unificarea formularelor tehnice: un singur model de date pentru măsurători, folosit și în aplicație și la birou | tehnician, birou | două sisteme paralele [C] | M |
| 4 | Offline de bază: pagină „fără semnal” + coadă locală pentru poze, semnătură, pontaj și închiderea lucrării, cu reîncercare și indicator vizibil | tehnician | rapoartele 06, 11 [S] | L |

### Etapa 2 — Teren: modulele pe domenii ajung în aplicație
| # | Ce | Pentru cine | Dovadă | Efort |
|---|---|---|---|---|
| 5 | **Gaze:** fișa de evidență pe telefon (operațiunile da/nu/nu e cazul, justificare la „nu”, aparate, defecte, 3 semnături, PDF), ceas 5+2 zile lucrătoare, registru anual generat automat | tehnician, birou | Ord. 179 [C] | L |
| 6 | **Gaze:** lista de pe bloc pe telefon (făcut/absent/refuzat/de reprogramat), documente pe apartament cu expirări (coș ≤6 luni, ISCIR, racord, detector), flux urgent „scăpare/sistat” | tehnician | raportul 03 [C]/[S] | M |
| 7 | **Fotovoltaic:** fișă de punere în funcțiune pe string (Voc, Isc, izolație), scanare serii panouri, invertor și baterie, poze pe categorii | tehnician | raportul 02 [S] | M |
| 8 | **Electric:** buletin pe circuit cu observații codificate (model EICR: C1/C2/C3), poze „ascuns” pentru lucrări ascunse și proces-verbal generat din ele | tehnician | raportul 01 [S] | M |
| 9 | Poze în 2 atingeri, încărcare în fundal, etichete preselectate (înainte, după, ascuns, bon) | tehnician | rapoartele 01, 06 [S] | S |
| 10 | Pontaj în 2 atingeri pe lucrare; GPS doar ca dovadă, corecție manuală cu motiv | tehnician | raportul 06 [S] | S |

### Etapa 3 — Birou și patron
| # | Ce | Pentru cine | Dovadă | Efort |
|---|---|---|---|---|
| 11 | Avertizări la programare: autorizație expirată, mașină cu ITP/RCA expirat, material lipsă, echipă supraîncărcată, suprapunere | birou | raportul 04 [S], date existente [C] | M |
| 12 | Durata pe tip de lucrare, calculată din istoricul de pontaj (nu AI) | birou | rapoartele 04, 12 [S] | S |
| 13 | Coadă unică „Cereri noi” (site, telefon notat, programări) + reprogramare cu motiv și mesaj gata pentru client | birou | raportul 04 [S] | M |
| 14 | Ecran „Luni dimineața”: 3 cifre alese de patron, praguri cu alertă, restanțe pe vechime, marjă pe tip de lucrare și pe echipă | patron | raportul 05 [S] | M |
| 15 | Stoc pe mașină: listă țintă și prag per mașină, consum bifat pe lucrare, cerere de reaprovizionare, „achiziție urgentă” (poză bon + lucrare) | tehnician, birou | raportul 09 [S] | L |
| 16 | Registru de scule cu predare-primire și calibrare legată de Conformitate | birou | raportul 09 [S] | S |

### Etapa 4 — Client, siguranță, AI (după pilot)
| # | Ce | Pentru cine | Dovadă | Efort |
|---|---|---|---|---|
| 17 | Fereastră de sosire, mesaj „echipa e pe drum”, card tehnician pe linkul de status, poze înainte/după și pachet de documente la închidere | client | raportul 10 [S] | M |
| 18 | Canal preferat și consimțământ pe client (mesaje operaționale separat de marketing) | client, birou | Legea 506/2004 [S], de validat juridic | S |
| 19 | SSM: evidență instruire cu scadență, blocare alocare pe acoperiș fără „apt înălțime”, checklist înainte de lucru, raport incident în 3 atingeri | tehnician, patron | raportul 08 [C]/[S] | M |
| 20 | AI cu confirmare umană: poza bonului pre-completează cheltuiala, poza plăcuței pre-completează marcă, model și serie; comutator AI pe firmă și jurnal | tehnician, birou | raportul 12 [C] pentru OCR | M |

---

## 3. Ce NU construim acum (și de ce)

- **Recepționer AI și răspuns automat la clienți:** concurenții le au, dar utilizatorii le numesc „rigide”, iar valoarea pentru instalatorii români e probabil mică [S].
- **Dictare vocală ca sursă de valori măsurate:** eroarea pe limba română e de 10–20% în teste publice, iar pe șantier nu e testată [S]. Doar ca ciornă editabilă, mai târziu.
- **„Man-down” și detecția căderii pe telefon:** chiar și vânzătorii admit că pe telefon obișnuit nu e de încredere [S]. Check-in cu timer, eventual după pilot.
- **Integrări cu API-urile producătorilor de invertoare:** doar după ce clienții le cer.
- **Promisiunea „semnătură valabilă juridic”:** semnătura desenată pe ecran e cel mai probabil semnătură electronică simplă; nu înlocuiește hârtia sau semnătura calificată când legea cere formă [S]. Formularea din aplicație trebuie să fie „dovadă de acceptare”, nu „document semnat legal”.

---

## 4. Ce trebuie validat cu firme reale (o singură listă de întrebări)

1. **Gaze (3–5 instalatori):** ritmul real pe un bloc, ce fac cu apartamentele absente, cum încasează pe loc, ce apare în fișa lor actuală.
2. **Fotovoltaic (2–3 echipe):** ce poze și ce valori cer de fapt operatorii pentru dosar, ce notează la punerea în funcțiune.
3. **Electric (3–5 electricieni):** ce conține buletinul lor de măsurători, cine îl semnează, dacă acceptă să bifeze materialele pe lucrare.
4. **Patroni (8–15):** care sunt cele 3 cifre pe care le vor luni dimineața și ce praguri reale au pentru marjă și restanțe.
5. **Jurist:**
   - șabloanele de fișe și procese-verbale;
   - formularea despre semnătură;
   - SMS și WhatsApp către clienți (consimțământ);
   - GPS pe telefoane personale.

---

## 5. Limite

- Sursele concurenților sunt în mare parte bloguri de vânzători (SUA); cifrele lor nu se aplică direct în România.
- Mai multe pagini oficiale nu s-au putut citi (legislatie.just.ro, ghiduri ale operatorilor de distribuție); ce s-a citit direct e marcat [C].
- Estimările de efort sunt orientative și presupun că modelul de date de la punctul 3 se face întâi.
- Rapoartele complete, cu sursele lor: `docs/cercetare-2026-11-d/01` … `12`.
