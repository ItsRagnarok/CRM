# Cercetare UX concurență — aplicația pentru tehnicieni ElectroField

Data cercetării: 2026-11-07. Scop: redesign simplu, aerisit, intuitiv, complet pentru aplicația mobilă a tehnicianului (electricieni, instalatori PV, instalatori gaze, România).
Metodă: pagini de help-center, fișe App Store, pagini de produs, recenzii (Capterra/G2/Trustpilot/SoftwareFinder), forumuri oficiale, + citirea codului din `/home/user/CRM/src/app/mobil`.

**Notă de încredere.** Nu am putut instala aplicațiile și nu am văzut capturi de ecran (paginile App Store nu conțin descrieri de screenshot). Structura UI de mai jos provine din documentația oficială; unde o informație vine doar din marketing sau dintr-un rezumat de căutare, e marcată `[marketing]` sau `[neverificat]`. Câteva pagini au dat 403/503 la deschidere (Workiz help, Fieldwire help, Zarina CRM, softservicecentrale.ro); pentru ele mă bazez pe rezumatele din căutare.

---

## 0. Punct de plecare: ce avem acum (din cod)

- Bara de jos cu 5 taburi: Acasă, Lucrări, Hartă, Materiale, Profil (`src/components/mobile-nav.tsx`). Etichete de 10.5px, tab inactiv `#98a2b3` pe alb (raport de contrast ~2.6:1, sub pragul WCAG AA de 4.5:1).
- Acasă are comutator Astăzi / Calendar (lună) și salut cu emoji. Calendarul e o grilă lunară cu puncte, nu o vedere pe zi.
- Detaliul lucrării redirecționează forțat tehnicianul în wizard dacă `mobile_stage` e setat (`mobile-stage.ts`: checklist → depozit → ridicare → cheltuială → ready). Wizardul are ~11 pași liniari. Alte rute: `extra` (probleme / lucrări suplimentare), `achizitie/[requestId]` (cereri de cumpărare), `foto`, `semnatura`, `finalizare`.
- Profil conține: ore luna aceasta, notificări, confidențialitate, ajutor, documente, concediu, temă. Există și `mesaje` și `notificari` ca rute separate (clopoțel în antet).
- ~63 de apariții de fonturi de 10.5–11.5px în `src/app/mobil`. Prea mic pentru soare și mănuși.
- Statusuri: programata, in_drum, ajunsa, in_lucru, pauza, finalizata, necesita_atentie, anulata. Aproape identice cu ce folosesc concurenții.

---

## 1. Arhitectura informației către care converg concurenții

### 1.1 Navigare inferioară

| Produs | Navigare (sursă) | Observații |
|---|---|---|
| ServiceTitan Field Mobile | **Home, Time, Menu**; poate fi personalizată (Customize navigation) — [help](https://help.servicetitan.com/mobile/docs/explore-the-main-layout-of-the-servicetitan-field-mobile-app-1) | 3 taburi; restul în Menu (Shortcuts / Settings / General) |
| Jobber | **Time Sheet, Schedule, Clients** (+ Home) — [help](https://help.getjobber.com/hc/en-us/articles/360042930793) | Schedule are vederi Zi / Săptămână / Listă / 3 zile / **Hartă** în același loc |
| Housecall Pro | Dashboard la deschidere; **Schedule** jos; `+` albastru sus-dreapta pentru Job nou — [help](https://help.housecallpro.com/en/articles/1029139-viewing-your-schedule-in-the-field) | Detalii de navigare incerte [neverificat] |
| Joblogic | **Visits, Routes, Scan, JL Chat, Menu** — [ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide) | 5 taburi cu Scan (cod de bare) și Chat promovate |
| BuildOps | Meniu hamburger: Dispatch, Visits, Quotes, Timesheets, Projects, Knowledge Hub; `+` jos-dreapta — [help](https://help.buildops.com/en/articles/10695165-mobile-app-overview) | Taburi de vizite: Today / Past / Future |
| Fieldwire | **Plans, Tasks** (orientat pe șantier) — [support](https://www.fieldwire.com/support/fieldwire-on-mobile) | Alt domeniu, dar modelul „task + poze pe plan" e relevant pentru PV |
| Dynamics 365 Field Service | „Refreshed experience": pornești din **agenda** zilei, **quick actions pe rezervare** — [overview](https://learn.microsoft.com/en-us/dynamics365/field-service/mobile/overview) | Modul offline încă nesuportat în noua experiență (limitare) |

**Convergență:** 3–5 taburi. Ziua tehnicianului (Home/Visits/Schedule) e mereu primul. Timpul (Time/Timesheet) e fie tab, fie în meniu. Tot restul (setări, ajutor, formulare generale, documente) stă într-un **Menu**. Harta nu e tab la majoritatea: e o vedere a programului (Jobber) sau a rutei (Joblogic Routes).

### 1.2 Ecranul Home
- ServiceTitan: „Current job + Today's schedule" cu link „View all". Evenimentele non-job (ședințe, training) intră în aceeași listă cronologică, care se reordonează automat când pornești/închei ceva. Ultima actualizare apare sus. Pull-to-refresh doar online. Banner „Not all data is available" cu Retry. Iconițe de sync pe fiecare job (Done / Downloading / Warning). [help](https://help.servicetitan.com/mobile/docs/explore-the-main-layout-of-the-servicetitan-field-mobile-app-1)
- ServiceTitan „View all" are 4 taburi: **Today / Upcoming / Previous (cu căutare și filtru de date) / Paused**.
- Jobber: ecran cu cererile, ofertele și vizitele zilei, plus „next suggested action". [pagina de funcții](https://getjobber.com/features/mobile-app)
- Joblogic: lista Visits cu **butonul verde jos care arată următorul status disponibil**, direct din listă. Căutare și filtre. [ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide)

### 1.3 Cardul de lucrare
Conținut comun: client (sau locație), descriere / tip, oră (sau fereastră de sosire), adresă, statusul (chip colorat), număr lucrare. ServiceTitan adaugă după deschidere trei butoane rapide: **Directions, Contact, Atlas**; după „Arrive" butonul Directions devine **Wrap-Up** (estimare timp rămas 15–90 min către dispecer). Joblogic: număr, descriere, dată/oră, adresă, status sus-dreapta, **buton verde cu următoarea acțiune**, „View on Map". BuildOps: iconiță de status sus-dreapta (Scheduled, Traveling, Working, Break, Paused, Completed...).

### 1.4 Detaliul lucrării
- **ServiceTitan** ([cheat sheet](https://help.servicetitan.com/docs/field-mobile-app-cheat-sheet)): tab-ul Job (nr., nume, status, oră, fereastră de sosire, durată, contact client, direcții, chat, tehnicieni, rezumat, instrucțiuni speciale, locație cu distanță/timp, note fixate, tag-uri, media, ore alocate) + taburi **Location Info, Equipment, Forms, Estimates, Invoice/Work Order**. Meniul **Add** (după Dispatch/Arrive): echipament, articole de factură, plăți, oferte, jurnal de lucru, contract, PO, constatări, notă internă, poze/video.
- **Joblogic** ([ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide)): taburi **Details / Mobile Forms / Others** (site, istoric, logbook, istoric statusuri, avertizări). Formularele de job apar doar după „On Site"; cele obligatorii sunt marcate.
- **BuildOps**: „details at a glance" (ora, nr. job/vizită, proprietate, adresă, descrierea problemei, tip job, tehnician principal). Doar tehnicianul principal poate acționa pe vizită.
- **Jobber** ([help](https://help.getjobber.com/hc/en-us/articles/360042930793)): client, titlu, adresă, dată; sună, „on my way" SMS, direcții, fereastră de sosire, Start/Complete. Checklist, note + poze, „More actions".
- **ServiceM8** ([App Store](https://apps.apple.com/gb/app/servicem8/id378062736), [photos](https://support.servicem8.com/help-center/app/basics/how-to-take-and-save-photos-to-a-job)): „Job Actions bar" cu Camera etc.; tot ce se întâmplă ajunge în **Job Diary** (cine, când, GPS); **Job Check Out Report** cu timpi, materiale, locație ([help](https://support.servicem8.com/help-center/tips-trick-more/more/how-to-find-a-job-checkout-report)).

### 1.5 „Status journey" — cum e arătat
| Produs | Succesiune | Sursă |
|---|---|---|
| Housecall Pro | **On My Way → Start → Finish**, cu timestamp automat | [help](https://help.housecallpro.com/en/articles/4711949-scheduling-dispatching-and-taking-payments) |
| ServiceTitan | **Dispatch → Arrive (Working) → Close Out** (Pause / Hold & Reschedule / Schedule another / Mark myself as done) | [cheat sheet](https://help.servicetitan.com/docs/field-mobile-app-cheat-sheet) |
| Joblogic | **Accept/Reject → Travel → On Site → Complete** (+ Leave Site, Abort, Abandon, No Access, toate cu motiv obligatoriu) | [ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide) |
| Jobber | „On my way" text → **Start timer** → **Complete visit**; vizită ≠ job; la închiderea job-ului se creează factura draft | [help](https://help.getjobber.com/hc/en-us/articles/360042930793) |
| BuildOps | Scheduled → Traveling → Working → Break/Paused → Completed → Converted (read-only după revizuirea biroului) | [help](https://help.buildops.com/en/articles/10695165-mobile-app-overview) |
| Workiz | **ETA (On my way) → Start (ceas)**, plată, schimbare status | [help](https://help.workiz.com/en/articles/4812389-managing-jobs-on-mobile) (rezumat din căutare) |

**Concluzii de design:**
1. **Un singur buton mare, a cărui etichetă se schimbă cu starea** (Plec → Am ajuns → Închei). Nu un meniu de statusuri.
2. Statusul = chip colorat pe card + (în detaliu) un stepper scurt, de 4–5 puncte, nu 11.
3. Cele 3 „ieșiri laterale" există peste tot și au **motiv obligatoriu**: client absent / fără acces, amânare / reprogramare, lipsă piese → revizită. Joblogic și ServiceTitan le au explicit.
4. Timpul se derivă din statusuri (Housecall: timestamp automat; ServiceM8: GPS check-in/out; BuildOps: Traveling/Working/Break). Tehnicianul nu apasă separat „pornește cronometru".
5. Biroul vede în timp real fiecare schimbare de status (Joblogic, ServiceTitan, Housecall).

### 1.6 Acțiuni rapide / butoane plutitoare
- Rapide pe card: Sună, Navighează (Apple/Google/Waze la Jobber), mesaj / SMS „on my way" (Jobber, Workiz, Housecall, ServiceM8). ServiceTitan: Directions / Contact / Atlas.
- **Buton `+`:** BuildOps (jos-dreapta, creează job/vizită/eveniment, doar cu permisiune), Housecall (`+ New` sus-dreapta). **În interiorul jobului**, modelul cel mai bun e meniul **Add** de la ServiceTitan (Echipament, Articole, Plată, Ofertă, Notă, Poze).
- ServiceTitan nu menționează FAB; Jobber la fel. FAB-ul e rar la tehnicieni, mai frecvent la manageri.

### 1.7 Căutare, calendar, hartă
- **Căutare:** ServiceTitan doar în „Previous"; Joblogic pe lista Visits; Fieldwire pe plan (după număr foaie, descriere, tag). Nimeni nu are căutare globală proeminentă pe Home → Home e scurt, căutarea e pentru istoric.
- **Calendar:** Jobber are cel mai complet (zi / 3 zile / săptămână / listă / hartă + selector de lună + „Today"). ServiceTitan folosește listă cronologică, nu grilă. Simpro: Schedule cu pull-to-refresh, draft-uri locale; modulul Timesheet permite vizualizare 3 săptămâni offline ([help](https://helpguide.simprogroup.com/Content/simPRO-App/Timesheet-module/Timesheet-Module-Overview.htm)).
- **Hartă:** vedere a zilei (Jobber, D365 „daily bookings on a map"), plus „View on Map" din card (Joblogic; necesită semnal). Joblogic **Routes**: ordinea optimizată din Planner.

---

## 2. Bune practici pe fiecare capitol

### 2.1 Formulare și checklist-uri
- **ServiceM8**: elementele de checklist se leagă de check-in / check-out (reamintire la sosire/plecare); cine a bifat și când se înregistrează în Diary; un element care conține cuvântul „Photo" **deschide camera** direct ([help checklists](https://support.servicem8.com/help-center/desktop/faq/how-to-create-and-use-checklists.md)).
- **Jobber**: la „Complete visit" cu checklist gol → reamintire; checklistul se poate trimite pe email clientului după previzualizare ([help](https://help.getjobber.com/hc/en-us/articles/360042930793)).
- **Joblogic**: orice checklist poate fi făcut **obligatoriu înainte de a continua**; formulare custom ([pagina app](https://www.joblogic.com/features/mobile-engineer-app/)). Atenție: la ieșirea din formular se salvează doar paginile terminate; progresul paginii curente se pierde (anti-pattern, [ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide)).
- **ServiceTitan**: formulare cu logică condițională, dar acelea pot **îngheța aplicația** pe iPad ([help](https://help.servicetitan.com/construction/docs/how-do-i-fix-forms-that-freeze-my-servicetitan-mobile-app)).
- **Aktio (RO)**: checklist configurabil drag-and-drop pentru a copia formularele pe hârtie; câmpuri „Cauză identificată", „Valoare măsurată" (ex. rezistență de izolație) ([pagina](https://www.aktio.ro/solutii/service-mentenanta)).
- **Airplay PILOT (RO)**: checklist-uri cu bife, măsurători, piese, observații; **poze obligatorii** per element ([pagina](https://airplayone.com/software-tehnicieni-service)).

**Recomandare:** un pas pe ecran sau secțiuni pliabile; autosave la fiecare câmp; câmpuri numerice cu unitate (Ω, V, mA, bar); element „cu poză obligatorie"; progres „7/12"; blocare la închidere cu listă clară a ce lipsește (nu blocaj mut); logică condițională simplă (maxim 1 nivel).

### 2.2 Poze cu adnotări
- **CompanyCam** (referința pentru poze): cerc, săgeată, text, etichete de măsură; poate deschide automat instrumentele după fiecare captură („Edit Mode"); perechi Before/After etichetate automat; checklist de poze cerute ([adnotări](https://intercom.help/companycamapp/en/articles/6828430-edit-and-add-drawings-to-your-photos), [before/after](https://intercom.help/companycamapp/en/articles/6828372-creating-a-before-after-photo)). Nu am găsit confirmat că blochează închiderea jobului când lipsește o categorie.
- **Fieldwire**: bară de markup (text, linii, forme), pini de task pe plan, poze atașate la un punct, **GPS păstrat și offline** ([support](https://www.fieldwire.com/support/fieldwire-on-mobile)). Pentru PV: poză + pin pe schiță acoperiș.
- **ServiceM8**: Camera în bara Job Actions, poze în Diary.
- **Housecall Pro**: recenzii despre încărcare/descărcare **una câte una, foarte lentă** ([Capterra](https://www.capterra.com/p/140363/HouseCall-Pro/reviews/?page=4)). Jobber: lent la poze și schimbat între joburi ([GetApp](https://www.getapp.com/operations-management-software/a/jobber/reviews)).

**Recomandare:** categorii fixe (Înainte / În timpul / După / Plăcuță echipament / Tablou / Contor), mod „rafală" (mai multe poze fără ieșire din cameră), adnotare opțională (săgeată, cerc, text, 3 culori groase), compresie locală + coadă de încărcare în fundal, timestamp + GPS în metadate, cerințe de poze per tip lucrare (ex. PV: acoperiș, invertor, plăcuță panou, priză de pământ).

### 2.3 Semnătură
- ServiceTitan: **două semnături** — autorizare înainte de lucru și confirmare la final, pe tab-ul Invoice ([cheat sheet](https://help.servicetitan.com/docs/field-mobile-app-cheat-sheet)).
- Joblogic: semnătură client + nume + funcție (pas 6/7) și semnătură tehnician (7/7); poate fi obligatorie ([ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide)).
- Commusoft: semnătură „cu degetul", certificatul se salvează și se trimite automat pe email ([pagina gaz](https://www.commusoft.com/en-gb/industries/gas-engineer-software/)).
- Aktio: semnătură în PDF trimis pe email / WhatsApp. Zarina CRM [marketing / neverificat]: proces-verbal trimis prin link sau QR.

**Recomandare:** rezumat citibil (ce s-a făcut, materiale, poze) chiar deasupra câmpului de semnat; nume client; zonă mare, peisaj opțional; **alternativă „Clientul nu e prezent / refuză"** cu motiv + trimitere link prin SMS/WhatsApp pentru semnare la distanță; PDF-ul generat imediat și partajabil (WhatsApp e canalul dominant în RO).

### 2.4 Materiale / piese
- Joblogic: piese „Used" vs „Required"; Used se pot scoate din stoc alegând locația; **Required nu scade stoc și marchează jobul „Requires revisit"**; căutare după cod / descriere; „Create" dacă lipsește; tab de Scan ([ghid](https://support.joblogic.com/docs/joblogic-mobile-user-guide)).
- Fergus: din price book și **Favourites** ([pagina](https://fergus.com/uk/features/on-the-job/)).
- ServiceM8: materialele apar în Check Out Report. Zuper: cod de bare / QR [marketing].
- BuildOps: poză la bon atașată la PO după ridicarea pieselor ([pagina](https://buildops.com/products/technician-mobile-app/)).
- Simpro: catalogul se sincronizează la login; dacă lipsesc articole → logout/login ([help](https://helpguide.simprogroup.com/Content/simPRO-App/simPRO-Mobile/Mobile-Service-Activity.htm)). Anti-pattern: sincronizare opacă.

**Recomandare:** „Folosit" vs „Necesar (lipsă)"; căutare + favorite + recente + scanare; stocul din dubă ca sursă implicită, cu cantitate ±; cerere de achiziție dintr-un tap când piesa nu e în dubă (avem deja `achizitie`).

### 2.5 Pontaj / timp
- Jobber: cronometru general (tab Time Sheet) + cronometru pe vizită; pornirea celui de vizită îl pune pe pauză pe cel general; clock-out oprește tot. Nu se pot adăuga manual în aplicație ([help](https://help.getjobber.com/hc/en-us/articles/360042930793)).
- ServiceTitan: tab **Time**, metoda depinde de firmă; „Continuous Timekeeping" cu bară de activitate.
- BuildOps: Travel / Work / Break; timesheet cu Save → Submit.
- ServiceM8: timp de drum + pe site + tură + pauze; export Xero/QBO.
- Simpro: blocuri de timp facturabile / nefacturabile, editabile după.
- Noi avem deja `time_entries` (work_start/work_end) și pagina `pontaj` în aplicația de birou.

**Recomandare:** „Începe ziua / Pauză / Termină ziua" pe Home (un control, nu un tab) + timp pe lucrare derivat automat din statusuri; ecran „Pontaj" în Meniu (ore azi/săptămână/lună, editare cu motiv, trimitere la aprobare).

### 2.6 Cheltuieli
Concurenții de field-service tratează cheltuielile slab: Joblogic le are ca pas în „Complete" (7 pași), BuildOps doar prin PO + poză bon. Avem deja un flux dedicat (`cheltuiala`). **Recomandare:** poză la bon întâi (camera deschisă direct), apoi sumă / categorie (combustibil, parcare, materiale, diurnă) / lucrare; salvare în 3 tapuri; OCR ca îmbunătățire ulterioară.

### 2.7 Offline și sincronizare
| Produs | Comportament documentat |
|---|---|
| **Zuper** ([doc](https://docs.zuper.co/Zuper_Mobile_Apps/Using_Zuper_Offline)) | Offline pornit de echipa Zuper; descarcă joburile alocate (fereastră ±3 zile) + înregistrări legate pe 2 niveluri; upload în fundal; progres pe dashboard și pe fiecare înregistrare; mesaje: „Ready for offline usage", „Poor connection. Showing saved jobs only", „Last refreshed", „Unable to load latest updates". **Nu merge offline:** acceptare/respingere job, chat, notificări, oferte/facturi, atașamentele existente. Date primare expiră după o zi. |
| **ServiceTitan** | Iconițe Done / Downloading / Warning pe card; banner Retry; **dar** forumul oficial: ecrane albe, cache, datele nu se potrivesc cu desktopul, munca nesincronizată poate dispărea ([thread](https://community.servicetitan.com/t5/Mobile/Issue-with-Mobile-app-Syncing-with-Desktop-Site/td-p/49248)). |
| **Simpro** | Primul login descarcă tot; draft-urile nesincronizate se **pierd la logout**; recenzii: pierderi de date, delogări ([SoftwareFinder](https://softwarefinder.com/field-service/simpro-enterprise/reviews)); release 13.10: statusuri care nu se sincronizau ([notes](https://helpguide.simprogroup.com/Content/Releases/simpro-mobile-13.10.htm)). |
| **Fieldwire** | Alegi proiectele disponibile offline; **Smart Sync** (sync complet doar pe Wi-Fi); GPS al pozelor păstrat offline ([support](https://www.fieldwire.com/support/fieldwire-on-mobile)). |
| **BuildOps** | Offline local, sync la reconectare ([pagina](https://buildops.com/products/technician-mobile-app/)); release 3.76 (mai 2026) permite actualizarea task-urilor offline ([notes](https://help.buildops.com/en/articles/14972462-mobile-release-3-76-may-5-2026)); un raport terț (AI, slab) vorbește de fiabilitate de câmp 3.1★. |
| **Joblogic** | Pagini oficiale: „limited offline"; terți: complet offline — contradictoriu. |
| **Aktio, Zarina (RO)** | „Offline-first", date criptate pe telefon, sync la revenirea semnalului [marketing]. |

**Recomandare (practică de UX):** scriere locală mai întâi; stare **per element** (Salvat local / Se trimite / Trimis / Eroare + Reîncearcă), nu spinner global; indicator discret „ultima sincronizare"; **coadă de acțiuni** (nu snapshot de bază de date); chei de idempotență; **niciodată „șterge la logout" cu date nesincronizate** — blochează logout-ul și arată ce așteaptă ([practici offline-first](https://appmaster.io/blog/offline-first-background-sync-conflict-retries-ux)). Conflicte: câmpuri independente (status vs notă) se îmbină; sume / prețuri → întreabă. Descărcare automată a zilei de azi + mâine la Wi-Fi. Poze: upload doar pe Wi-Fi opțional.

### 2.8 Ofertare / facturare / plată în aplicație
- ServiceTitan: tab Invoice/Work Order cu semnături, articole din pricebook, plăți, trimitere pe email sau prezentare.
- Housecall Pro: ofertă / factură din telefon; cash, cec, card (scan card), **Tap to Pay**, factură prin SMS, finanțare ([App Store](https://apps.apple.com/ca/app/housecall-pro/id692833651)).
- Jobber: Complete → factură draft → Review & Send sau Collect Payment (card reader, Apple/Google Pay, cash/cec = doar înregistrare; plată parțială) ([help](https://help.getjobber.com/hc/en-us/articles/360042930793)).
- ServiceM8: PDF-uri ofertă / factură pe loc, plată cu cardul, Tap to Pay on iPhone, Xero / QBO ([App Store](https://apps.apple.com/gb/app/servicem8/id378062736)).
- Tradify: oferte și facturi din mobil/tabletă; timesheet → factură ([pagina](https://www.tradifyhq.com/features/mobile-job-management-software)). Joblogic: oferte + facturi generate și aprobate în app ([pagina](https://www.joblogic.com/features/mobile-engineer-app/)).

**Pentru România** (date din cercetare, de validat cu un contabil / ANAF):
- **Oblio API** (documentat): proformă, aviz, factură, **încasare** (`/docs/invoice/collect`), trimitere în SPV (`POST /docs/einvoice`, statusuri -1/0/1/2), `useStock`, webhook-uri, `idempotencyKey`, limite 30 cereri / 10 sec (30 / 100 sec pentru generare documente) ([oblio.eu/api](https://www.oblio.eu/api)).
- **SmartBill:** pagină de documentație API există ([api.smartbill.ro](https://api.smartbill.ro/)), conținutul nu l-am putut citi; SmartBill trimite e-Facturi în SPV după autorizarea contului (rezumat din căutare). Trebuie verificat pe documentația lor.
- **e-Factura:** B2B/B2G obligatoriu din 2024; B2C — **surse contradictorii** (calendar 2025→2026; termen de transmitere 5 zile, nu e clar dacă calendaristice sau lucrătoare) ([ghid](https://folositor.ro/ghid/e-factura-spv-2026)). Amenzi 1.000–10.000 lei lunar pe categorii de firmă; factura emisă în afara sistemului riscă 15% (aceeași sursă, neoficială). **Nu hardcodați reguli; confirmați pe ANAF / OUG 120/2021.**
- **Implicație de produs:** tehnicianul nu ar trebui să emită factura fiscală din teren decât dacă firma o cere. Fluxul sigur: **deviz / ofertă (proformă) pe loc → încasare înregistrată → biroul emite factura în SmartBill/Oblio și o trimite în e-Factura**. Încasarea cu numerar are implicații fiscale (chitanță / bon fiscal) — [neverificat], de clarificat.

### 2.9 Notificări / inbox
- Jobber: push pentru schimbări de program, cereri noi, mesaje client, ofertă vizualizată. D365: push pentru rezervări noi. Housecall: notificări + mesagerie în app. Joblogic: JL Chat. Zuper: **chat și notificări nu funcționează offline**.
- **Recomandare:** un singur **Inbox** cu două segmente (Conversații cu biroul, Notificări), badge pe tab; notificări **acționabile** (Confirmă, Sună, Deschide lucrarea); grupare pe lucrare; mesaje „în așteptare" când ești offline; ore liniștite și prioritate (urgent / normal) în setări.

### 2.10 Setări / profil
- ServiceTitan Menu: Shortcuts (Book job, Card reader, Opportunities, Financing), **Settings** (terminologie, Customize navigation, **Appearance Light / Dark / System**, calitate upload media, Clear external media, Update Pricebook), **General** (Switch environment, Change password, Help, About, Feedback, Sign out) — [help](https://help.servicetitan.com/mobile/docs/explore-the-main-layout-of-the-servicetitan-field-mobile-app-1).
- BuildOps: Help, **Send Issue Report**, versiune aplicație.
- Joblogic: Status menu → Fetch library data / **manual sync**.

### 2.11 Stări goale și de eroare
Modele observate: banner persistent cu Retry și X (ServiceTitan); stări cu text exact (Zuper: „Poor connection. Showing saved jobs only"); raportare problemă din app (BuildOps). **Recomandare:** stare goală = ilustrație simplă + o propoziție + o acțiune (ex. „Nicio lucrare azi. Vezi mâine / Contactează biroul"); eroare = ce s-a întâmplat + ce e salvat + buton Reîncearcă; niciodată ecran alb (ServiceTitan are plângeri exact pe asta).

### 2.12 Accesibilitate: mănuși, soare, ținte mari
- Standarde: WCAG 2.2 SC 2.5.8 (AA) = minim **24×24 CSS px**, cu excepții de spațiere; WCAG 2.5.5 (AAA) = **44×44**; Apple HIG **44 pt**; Material **48 dp** ([Deque](https://dequeuniversity.com/rules/axe/4.9/target-size), [NN/g](https://www.nngroup.com/articles/touch-target-size/), [rezumat](https://frontendchecklist.io/rules/accessibility/touch-targets)).
- Mănuși: o sursă academică / militară (MIL-STD-1472) indică zone minime de **~20 mm** pentru operare cu mănuși, iar acuratețea la prima atingere scade; un producent de afișaje recomandă 25–40 mm [sursă comercială, neverificată] ([rezumat](https://katalog.lib.cas.cz/KNAV/EdsRecord/edsair,edsair.doi...........9465c900e5780072de7a168d106fd14d)). Nu am găsit sursă pentru contrast în lumină solară.
- **Propunerea mea (nu standard):** acțiuni primare full-width, înălțime 64–72 px; secundare min. 52–56 px; spațiu între ținte ≥ 12 px; text corp ≥ 16 px, etichete ≥ 13 px; contrast text ≥ 7:1 pentru informația critică (ora, adresa, butoane) și ≥ 4.5:1 minim peste tot; **mod „Soare / contrast mare"** și **mod „Mănuși"** (ținte +25%, gesturi simple, fără swipe-uri fine) ca setări. Fără informație transmisă doar prin culoare (chip cu text + icon).
- **Dark mode:** ServiceTitan are Light / Dark / System. Avem deja `ThemeToggle`. Dark util seara / în dubă; în exterior, ziua, tema luminoasă de contrast mare e mai bună. Implicit: sistem.

---

## 3. Matrice de funcționalități

Legendă: ● confirmat în documentație / listare oficială, ○ doar marketing sau terț, – nu am găsit, ? neclar. Matricea reflectă ce am găsit, nu inventarul complet al produselor.

| Funcție | ST | Jobber | HCP | Workiz | Simpro | Joblogic | SM8 | BuildOps | Zuper | Fergus | Tradify | Commusoft | Aktio (RO) | Zarina (RO) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Buton status (drum / sosit / terminat) | ● | ● | ● | ● | ? | ● | ● (check-in/out) | ● | ? | ? | ? | ? | ? | ● (GPS check-in) |
| SMS „în drum" către client | ? | ● | ● | ● | – | ? | ● | ? | ? | ? | ? | ? | – | – |
| Checklist / formulare | ● | ● | ? | ? | ● | ● | ● | ● | ○ | ? | ? | ● | ● | ● |
| Formulare / certificate de industrie (gaz, electric) | ○ | – | – | – | ○ | ● | ○ | ○ | – | – | – | ● (CP12 UK) | ○ | ○ |
| Poze | ● | ● | ● | ? | ● | ● | ● | ● | ● (markup ○) | ● | ● | ? | ● | ● |
| Adnotare poze | ? | ? | ? | ? | ? | ? | ? | ? | ○ | ? | ? | ? | – | – |
| Semnătură client | ● | ? | ○ | ? | ○ | ● | ○ | ? | ? | ? | ● | ● | ● | ○ (QR / link) |
| Materiale / piese | ● | ○ | ● | ? | ● | ● | ● | ● | ● | ● | ● | ? | ● | ● (stoc dubă) |
| Cod de bare | ? | – | – | – | ? | ● (tab Scan) | ● (QR active) | ? | ○ | – | – | – | – | – |
| Timp / pontaj | ● | ● | ● (GPS) | ● | ● | ● | ● | ● | ? | ● | ● | ? | ? | ? |
| Cheltuieli (cu bon foto) | – | – | – | – | – | ● (pas în Complete) | – | ○ (PO + bon) | – | – | – | – | – | – |
| Ofertă / factură în app | ● | ● | ● | ? | ● | ● | ● | ● | ? | – | ● | ● | ○ („gata de facturare") | ? |
| Plată în app | ● | ● | ● (Tap to Pay) | ● | ? | ○ | ● | ? | ? | – | ? | ● | – | ● (plată pe loc) ○ |
| Offline | ● (cu probleme) | ? (cerut de utilizatori) | ? | ? | ● (limitări) | ○ / contradictoriu | ? | ● | ● (documentat) | ? | ? | ○ | ○ offline-first | ○ |
| Chat cu biroul | ● | ● | ● | ? | ? | ● | ● | ? | ● | ● | ? | ? | ? | ? |
| Dark mode | ● | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| Limba română | – | – | – | – | – | – | – | – | – | – | – | – | ● | ● |
| SmartBill / Oblio / e-Factura | – | – | – | – | – | – | – | – | – | – | – | – | – (pagina nu le menționează) | ○ (ghid e-Factura pe site) |
| Documente ANRE | – | – | – | – | – | – | – | – | – | – | – | – | – | – |

Surse principale: pagini citate la §1–2 + [Zuper offline](https://www.zuper.co/mobile-app-and-offline-mode), [Commusoft formulare](https://commusoft.co.uk/jobs/custom-forms/), [Tradify](https://www.tradifyhq.com/features/mobile-job-management-software), [Workiz On My Way Pro](https://help.workiz.com/hc/en-us/articles/32686565665937), [Zarina](https://www.zarinacrm.ro/crm-prestari-servicii/) (pagina a dat verificare anti-bot; datele vin din rezumatul căutării).

### 3.1 Table-stakes (fără ele aplicația pare incompletă)
Program zilnic; card de lucrare; sună + navighează; buton de status cu timestamp; checklist; poze; note; materiale folosite; semnătură client; PDF de raport trimis pe email / WhatsApp; notificare lucrare nouă / modificată; mesagerie cu biroul; pontaj; offline cu stare de sync vizibilă.

### 3.2 Diferențiatori (puțini competitori îi au bine)
1. **Poze obligatorii per tip lucrare**, cu adnotare și categorii (PV: acoperiș / invertor / plăcuță; gaz: contor / test de presiune).
2. **Blocarea închiderii cu listă clară a cerințelor lipsă** (nu doar „checklist gol?").
3. **Stoc dubă + cerere de achiziție + ridicare** legat de lucrare. Avem deja acest flux; concurenții îl au parțial (Joblogic Used / Required, BuildOps PO).
4. **Cheltuieli cu bon foto** în același flux (aproape inexistent la concurență).
5. **Formulare-document de industrie** (certificate / procese-verbale) generate din datele colectate. Commusoft a făcut asta pentru UK (CP12), Joblogic pentru certificate gaz / electric; în RO nu am găsit nimic similar documentat.
6. **Mod mănuși / soare**.
7. **Reducerea pașilor**: wizardul nostru de 11 pași e un dezavantaj dacă nu e comprimat.
8. **Încasare + deviz extra pe loc** cu predare la birou pentru factura fiscală.

### 3.3 Unde e slabă piața (oportunitate pentru noi)
- **Calitatea mobilă a liderilor globali**: Jobber / Housecall — funcționalitate mobilă sub desktop, poze lente ([Capterra HCP](https://www.capterra.com/p/140363/HouseCall-Pro/reviews/?page=4), [GetApp Jobber](https://www.getapp.com/operations-management-software/a/jobber/reviews)); ServiceTitan — ecrane albe, cache, sync ([forum](https://community.servicetitan.com/t5/Mobile/Issue-with-Mobile-app-Syncing-with-Desktop-Site/td-p/49248)); Simpro — pierderi de date și delogări ([SoftwareFinder](https://softwarefinder.com/field-service/simpro-enterprise/reviews)). Android la Housecall: 3.3★ (sursă terță cu interes comercial — de luat cu rezervă).
- **Niciun produs global nu are limba română, SmartBill / Oblio, e-Factura sau ANRE.**
- **Produse românești găsite** (toate în afara a ceea ce voi numi „specializat pe electrician / PV / gaz"):
  - [Aktio](https://www.aktio.ro/solutii/service-mentenanta): HVAC / mentenanță / electricieni / instalatori; offline-first; PDF cu semnătură, WhatsApp; de la 15 €/utilizator/lună; pagina nu menționează SmartBill, Oblio, e-Factura, ANRE.
  - [Zarina CRM Servicii](https://www.zarinacrm.ro/crm-prestari-servicii/): GPS check-in, checklist, poze înainte / după, piese, stoc pe dubă, plată pe loc, proces-verbal PDF, link / QR; licență definitivă [marketing, neverificat].
  - [Airplay PILOT](https://airplayone.com/software-tehnicieni-service): web fără instalare, formulare cu poze obligatorii; e-Factura ca modul separat; nu menționează semnătură / offline.
  - [Bento FSM](https://www.bento.ro/en/field-service-management-en/): utilități / enterprise (DEER, contract 32 mln. lei raportat de [Energynomics](https://energynomics.ro/en/?p=179773)).
  - [FieldOS](https://bcr.ro/en/press/press-release/2024/12/10/BCR-Seed-Starter-announces-its-first-investment-five-hundred-thousant-euro-in-FieldOS): mobile-first configurabil; 500.000 € de la BCR Seed Starter (dec. 2024).
  - Nișe: [S-CRM (HVAC)](https://www.instalnews.ro/tehnologie/s-crm-software-crm-cloudon-premises-dedicat-firmelor-de-service-hvac), [Soft service centrale termice și verificări / revizii gaze](http://softservicecentrale.ro/) (stoc pe tehnician; cel mai apropiat de gaz), [Dakai (Odoo FSM)](https://dakai.ro/field-service-management-software), [BOCP WorkManager](https://bocp.ro/workmanager/).
- **Context de piață:** un cofondator FieldOS afirmă că ~90% dintre firmele de field service din RO au 1–3 tehnicieni ([Outsourcing Today](https://outsourcing-today.ro/?p=12037), rezumat din căutare, neverificat direct). Implicație: aplicația trebuie să fie utilizabilă și de **patron-tehnician**, nu doar de echipe cu dispecer.
- **Absența menționării ≠ absența funcției.** Ar trebui verificat prin demo la Aktio, Zarina, Airplay înainte de a revendica „primul".

### 3.4 Oportunitățile RO, concret
1. **Documente ANRE / dosare predate din aplicație**
   - Gaz: procedura de verificări și revizii (Ord. ANRE 179/2015, modificat de 71/2020 și 96/2023; text consolidat 14.12.2025 pe [gazest.ro](https://gazest.ro/wp-content/uploads/2025/12/Procedura-privind-verificarile-si-reviziile-tehnice-ale-instalatiilor-de.pdf)). Verificare periodică la max. 2 ani, revizie la max. 10 ani ([Profit.ro](https://profit.ro/povesti-cu-profit/energie/anre-clientii-nu-mai-sunt-obligati-sa-efectueze-verificarea-periodica-a-instalatiilor-de-gaze-in-anul-in-care-este-programata-o-revizie-tehnica-19463215)). Documente: fișă de verificare / revizie, proces-verbal, fișă de evidență; doar operatori ANRE-autorizați ([PlayTech](https://playtech.ro/2025/diferenta-dintre-verificare-si-revizie-tehnica-periodica-a-instalatiei-de-gaze-ce-spune-legea-si-cat-de-des-trebuie-facute-ca-sa-nu-iei-amenda/)).
   - PV / prosumator: aviz tehnic de racordare → contract → după probe, **proces-verbal de recepție a punerii în funcțiune** către operatorul de distribuție → certificat de racordare ([Economica](https://www.economica.net/?p=161404), cu referire la Ord. ANRE 59/2013 [sursă veche]). Buletin de măsurare a prizei de pământ de persoană atestată cu aparat verificat metrologic (sursă secundară, [dosar-prosumator](https://gitea.com/Solaris-Cet/dosar-prosumator)). ANRE a adoptat derogări pentru PIF mai rapidă ([Economedia](https://economedia.ro/anre-adopta-derogari-pentru-ca-prosumatorii-sa-poata-pune-mai-repede-in-functiune-instalatiile-de-productie-a-energiei-controale-la-distribuitori-privind-racordarea.html)).
   - **Nu am găsit lista oficială actuală de documente** (cerințele variază și pe distribuitor). Trebuie validată cu un electrician autorizat și cu operatorul de distribuție.
2. **Deviz / proformă pe loc → încasare → factură în SmartBill / Oblio + e-Factura la birou**, cu statusul e-Factura vizibil pentru birou.
3. **Română nativă**, terminologie de teren (dubă, depozit, deviz, proces-verbal, PIF, PRAM).
4. **WhatsApp ca canal de livrare** al procesului-verbal (Aktio îl folosește deja).
5. **Reamintiri de revizie / verificare periodică** (2 ani / 10 ani la gaz) generate din istoricul lucrărilor — Commusoft face echivalentul pentru boiler UK ([pagina](https://www.commusoft.com/en-gb/industries/gas-engineer-software/)).

---

## 4. Propunere: structura și lista de ecrane pentru aplicația noastră

### 4.1 Principii
1. **O acțiune primară pe ecran**, mare, jos, mereu în același loc.
2. **4 taburi** (mai puțin = mai aerisit; HIG recomandă max. 5).
3. **Wizardul devine „hub de lucrare" non-liniar**: tehnicianul vede secțiuni cu stare (Gata / De făcut / Obligatoriu) și un singur buton principal care îl duce la următorul pas. Fără redirect forțat; blocajele apar doar la „Închei lucrarea".
4. **Faze în loc de 11 pași:** Pregătire → Drum → La client → Închidere (în „La client" intră lucru + poze + checklist).
5. **Aer:** carduri cu un titlu, o linie de detaliu, un status; spațiu 16–24 px; fără emoji; text ≥ 16 px; fără mai mult de 3 culori de status pe un ecran.
6. **Offline vizibil, dar discret.**

### 4.2 Taburi inferioare

| # | Tab | Conținut | Justificare |
|---|---|---|---|
| 1 | **Azi** | ziua mea, lucrarea curentă, următoarele | Home la ServiceTitan, Jobber, Joblogic — loc de pornire |
| 2 | **Program** | Zi / Săptămână / Listă + comutator **Hartă** + căutare + istoric | Comasează actualele „Lucrări", „Hartă" și calendarul lunar (modelul Jobber) |
| 3 | **Mesaje** | Conversații cu biroul + Notificări (segmente) | Comasează cele 2 rute actuale; chat promovat ca la Joblogic |
| 4 | **Meniu** | Duba, Pontaj, Cheltuieli, Documente, Concediu, Ajutor, Setări, Profil | Modelul „Menu" de la ServiceTitan / Joblogic / BuildOps |

Alternativă (5 taburi) dacă testarea arată că **Duba** se deschide zilnic: Azi, Program, **Duba**, Mesaje, Meniu. Recomandarea mea inițială: Duba în Meniu + card scurt pe Azi (stoc scăzut, cerere aprobată pentru ridicare).

### 4.3 Ecrane și prioritate

**P0 = nucleul redesignului; P1 = imediat după; P2 = diferențiator / ulterior.**

#### A. Azi (P0)
- Antet scurt: dată + salut discret; avatar (→ Meniu); chip de sync (Sincronizat / Offline / N în așteptare).
- Control „Ziua mea": Începe ziua → Pauză → Termină ziua (cu ore cumulate azi).
- **Card erou „Lucrarea curentă"**: client, tip, adresă, oră, status; butonul mare de stare (Plec / Am ajuns / Închei); rânduri rapide: Sună, Navighează, Mesaj.
- „Urmează" — carduri compacte; „Necesită atenție" — alerte (cerere achiziție aprobată / respinsă, lucrare modificată, mesaj necitit).
- Stări goale: „Nicio lucrare azi" + „Vezi mâine".
*Rațiune:* ServiceTitan Home, Jobber Home, Joblogic Visits; ziua + o singură acțiune.

#### B. Program (P0)
- Implicit: **Zi** cu bandă de zile (săpt.) sus, „Azi" mereu vizibil; chips: Azi · Viitoare · Finalizate · Pauză (ServiceTitan).
- Comutator **Listă / Hartă** (hartă = pini colorați pe status + ordinea zilei + ETA); buton „Calendar lună" (selector).
- Căutare după client / adresă / nr. lucrare.
*Rațiune:* Jobber; în același timp elimină 2 taburi.

#### C. Card de lucrare (componentă, P0)
Oră · client (bold) · tip lucrare · adresă scurtă · chip status (text + icon) · iconițe: poze obligatorii / formular ANRE / materiale lipsă · distanță / timp. Tot cardul e țintă de atingere; buton stare doar pe cardul curent.

#### D. Detaliu lucrare = Hub (P0)
- Antet: #nr, client, chip status; stepper de 4 pași (Pregătire · Drum · La client · Închidere).
- Rând de acțiuni rapide (Sună · Navighează · WhatsApp/SMS · Mesaj birou).
- „De știut": descriere, mesaj de la birou (evidențiat), instrucțiuni de acces, istoric loc.
- Secțiuni cu stare: Checklist · Materiale · Poze · Formulare / Documente · Cheltuieli · Note · Timp.
- Buton principal fix jos (Plec / Am ajuns / Închei). Meniu „Altceva" (⋯): Client absent / fără acces · Amână / reprogramează · Am nevoie de piese · Cere ajutor (necesită atenție).
- **Buton „+ Adaugă"** (meniu ServiceTitan): Poză · Notă · Material · Cheltuială · Problemă / lucrare suplimentară.
*Rațiune:* ServiceTitan job tabs + Add menu; Joblogic formulare marcate obligatoriu.

#### E. Pregătire (P0 pentru conceptul, conținut existent)
- Checklist pre-plecare (echipament, scule, EPI) — **doar dacă tipul lucrării îl cere**.
- Materiale necesare vs. din dubă; dacă lipsesc → **Cere / Ridică** (depozit / achiziție) — ecrane existente `depozit`, `ridicare`, `achizitie`, păstrate, dar apar doar când sunt relevante.
- Cheltuială de ridicare (combustibil / parcare) — opțional.

#### F. Drum (P0)
Un singur ecran liniștit: adresa, ETA, **Navighează** (Google / Waze / Apple, preferința din Setări), „Anunță clientul că sunt în drum" (SMS / WhatsApp, șablon), buton **Am ajuns** (cu sugestie automată la geofence). Statusul „În drum" pornește pontajul de drum.

#### G. La client (P0)
- Sosire: poză de sosire dacă e obligatorie; „Client absent / fără acces" cu motiv + poză.
- Execuție: Checklist · Poze (Înainte / În timpul / După) · Materiale folosite · Măsurători / Formulare · Notițe vocale / text · Probleme / lucrări suplimentare (`extra`) · Pauză.

#### H. Închidere (P0)
1. **Rezumat**: timp, materiale, poze, formulare, cheltuieli.
2. **Ce lipsește** (listă bifabilă, fiecare cu link direct): poze obligatorii, formular, semnătură.
3. Deviz suplimentar / încasare (P2).
4. **Semnătură client** (nume, semnătură; sau „absent / refuză" cu motiv + link SMS / WhatsApp). Semnătură tehnician automată din profil.
5. **Generare PDF proces-verbal** + trimitere (email / WhatsApp / SMS cu link).
6. „Finalizează" — ecran de confirmare scurt, cu „Următoarea lucrare".

#### I. Cameră și adnotare (P0 cameră + categorii; P1 adnotare)
Cameră cu categorie preselectată din context; rafală; previzualizare; adnotare (săgeată / cerc / text, 3 culori); coadă de upload cu stare.

#### J. Semnătură (P0)
Ecran dedicat, peisaj opțional, zonă mare, „Șterge / Confirmă", nume client, rezumat deasupra.

#### K. Materiale folosite (P0)
Căutare + recente + favorite + stoc dubă; ± cantitate; „Lipsește / necesar" marchează revizită; scanare cod de bare (P1).

#### L. Cheltuială rapidă (P0 — există)
Poză bon → sumă → categorie → lucrare. Disponibilă și din Meniu (fără lucrare).

#### M. Formular / Document de lucrare (P1 → P2 diferențiator)
Șabloane per tip: electric (măsurători: izolație, priză de pământ, continuitate), PV (PIF, probe, serial invertor / panouri), gaz (verificare / revizie, test de presiune). Câmpuri numerice cu unitate, poză obligatorie, previzualizare PDF. **Conținutul trebuie validat cu un expert ANRE** (§3.4).

#### N. Deviz / ofertă pe loc și Încasare (P2)
Linii din catalog (SmartBill / Oblio), proformă, încasare înregistrată (card / numerar / OP), predare la birou pentru factură + e-Factura. Permisiuni per rol.

#### O. Mesaje (P0)
- Tab **Conversații**: birou (general) + fire pe lucrare; trimitere poză; mesaje în coadă offline.
- Tab **Notificări**: grupate pe zi / lucrare; acțiuni inline; „Marchează toate citite".
- Detaliu mesaj.

#### P. Meniu (P0)
Structură în 3 grupuri (după ServiceTitan):

**Munca mea**
- **Duba mea** — stoc, cereri de achiziție, ridicări (existente `materiale`, `achizitie`)
- **Pontaj** — azi / săptămână / lună, corecții cu motiv (P1: trimitere la aprobare)
- **Cheltuielile mele**
- **Istoric lucrări** (căutare)
- **Concediu**
- **Documente** (autorizații ANRE, atestate, instructaj; P1: alerte de expirare)

**Setări**
- **Notificări**: tipuri, sunet / vibrații, ore liniștite (existente `profil/notificari`)
- **Aspect**: Luminos / Întunecat / Auto; mărime text; **Contrast mare (soare)**; **Mod mănuși**
- **Navigație**: aplicația implicită (Google Maps / Waze / Apple Maps)
- **Date și sincronizare**: stare sync, coadă, „doar Wi-Fi pentru poze", calitate poze, golește cache (ServiceTitan are aceste opțiuni), descarcă ziua de mâine
- **Locație și confidențialitate**: când se urmărește locația (existent `confidentialitate`)
- **Securitate**: PIN / biometrie, schimbă parola
- **Limbă** (RO implicit)

**General**
- Ajutor (existent `ajutor`) + **Raportează o problemă** (BuildOps: Send Issue Report; cu jurnal atașat)
- Despre / versiune (existent `app-version`)
- Deconectare (blocată dacă există date nesincronizate; afișează ce așteaptă)

**Profil** — antet în Meniu: nume, rol, echipă, telefon, ore luna aceasta.

### 4.4 Mapare: rute actuale → noua structură

| Actual | Nou |
|---|---|
| `(tabs)/page.tsx` (Astăzi + Calendar) | **Azi** (doar ziua) + calendarul lunar mutat în **Program** |
| `(tabs)/lucrari` | **Program → Listă** |
| `(tabs)/harta` | **Program → Hartă** |
| `(tabs)/materiale` | **Meniu → Duba mea** (+ card pe Azi) |
| `(tabs)/profil`, `profil/notificari` | **Meniu** (antet profil + Setări) |
| `(tabs)/mesaje`, `(tabs)/notificari`, `mobile-bell` | **Mesaje** (2 segmente) |
| `lucrari/[id]` + `mobile-stage` redirect | **Hub lucrare** fără redirect forțat |
| `checklist`, `depozit`, `ridicare`, `cheltuiala`, `achizitie` | **Pregătire** (condițional) |
| `arrive-button`, `departure-alert`, `arrival-alert` | **Drum / La client** (butonul unic + sugestii geofence) |
| `foto`, `extra`, `semnatura`, `finalizare` | **La client** / **Închidere** |
| `documente`, `concediu`, `ajutor`, `confidentialitate` | **Meniu** |

### 4.5 Priorități

| Prioritate | Elemente | De ce |
|---|---|---|
| **P0** | 4 taburi; Azi; Program (zi / listă / hartă); card; hub lucrare + buton unic; Drum; La client (checklist, poze, materiale, note); Închidere + semnătură + PDF; Mesaje; Meniu cu Setări de bază; indicator sync; ținte mari + font ≥ 16 px + contrast | Rezolvă nemulțumirea „simplu, aerisit, intuitiv" și aduce paritatea table-stakes |
| **P1** | Adnotare poze; poze obligatorii per tip; coadă de sync detaliată; scanare cod de bare; Pontaj cu aprobare; moduri Soare / Mănuși; alerte expirare documente; formulare ANRE v1; „Cere ajutor" | Diferențiatori cu efort moderat |
| **P2** | Deviz / proformă + încasare; integrare SmartBill / Oblio + status e-Factura; șabloane complete PV / gaz / electric; reamintiri revizie; semnare la distanță prin link; OCR bon; căutare clienți | Valoare mare în RO, dar cer validare legală / fiscală și integrări |

### 4.6 Riscuri și puncte de verificat
1. **Reguli e-Factura B2C și numerar** — surse contradictorii; validare cu contabil / ANAF înainte de orice promisiune în produs.
2. **Documentele ANRE** — nu am găsit liste oficiale actuale; de lucrat cu un electrician / instalator autorizat și cu cerințele distribuitorului.
3. **Offline** — cel mai mare risc comun pentru toți concurenții (ecran alb, pierderi de date). Contează mai mult decât orice element vizual. Testare în zone fără semnal și cu poze multiple.
4. **Verificare prin demo a competitorilor RO** (Aktio, Zarina, Airplay) înainte de a spune că „nimeni nu are SmartBill / Oblio / ANRE".
5. **Test de utilizare cu mănuși, în soare**, cu 3–5 tehnicieni, înainte de a fixa dimensiunile.

---

## Surse (listă consolidată)

Global / produs:
- ServiceTitan: https://help.servicetitan.com/mobile/docs/explore-the-main-layout-of-the-servicetitan-field-mobile-app-1 · https://help.servicetitan.com/docs/field-mobile-app-cheat-sheet · https://help.servicetitan.com/release-hub/docs/see-your-schedule-sooner-with-a-faster-more-reliable-field-mobile-app · https://help.servicetitan.com/construction/docs/how-do-i-fix-forms-that-freeze-my-servicetitan-mobile-app · https://community.servicetitan.com/t5/Mobile/Issue-with-Mobile-app-Syncing-with-Desktop-Site/td-p/49248
- Jobber: https://help.getjobber.com/hc/en-us/articles/360042930793 · https://getjobber.com/features/mobile-app · https://www.getapp.com/operations-management-software/a/jobber/reviews
- Housecall Pro: https://help.housecallpro.com/en/articles/4711949-scheduling-dispatching-and-taking-payments · https://help.housecallpro.com/en/articles/1029139-viewing-your-schedule-in-the-field · https://apps.apple.com/ca/app/housecall-pro/id692833651 · https://www.capterra.com/p/140363/HouseCall-Pro/reviews/?page=4
- Workiz: https://help.workiz.com/en/articles/4812389-managing-jobs-on-mobile · https://help.workiz.com/hc/en-us/articles/32686565665937
- Simpro: https://helpguide.simprogroup.com/Content/simPRO-App/Timesheet-module/Timesheet-Module-Overview.htm · https://helpguide.simprogroup.com/Content/simPRO-App/simPRO-Mobile/Mobile-Service-Activity.htm · https://helpguide.simprogroup.com/Content/Releases/simpro-mobile-13.10.htm · https://softwarefinder.com/field-service/simpro-enterprise/reviews
- Fieldwire: https://www.fieldwire.com/support/fieldwire-on-mobile · https://help.fieldwire.com/hc/en-us/articles/202631944
- Zuper: https://docs.zuper.co/Zuper_Mobile_Apps/Using_Zuper_Offline · https://www.zuper.co/mobile-app-and-offline-mode
- Fergus: https://fergus.com/uk/features/on-the-job/ · Tradify: https://www.tradifyhq.com/features/mobile-job-management-software
- Joblogic: https://support.joblogic.com/docs/joblogic-mobile-user-guide · https://www.joblogic.com/features/mobile-engineer-app/
- ServiceM8: https://apps.apple.com/gb/app/servicem8/id378062736 · https://support.servicem8.com/help-center/app/basics/how-to-take-and-save-photos-to-a-job · https://support.servicem8.com/help-center/desktop/faq/how-to-create-and-use-checklists.md · https://support.servicem8.com/help-center/tips-trick-more/more/how-to-find-a-job-checkout-report
- Commusoft: https://www.commusoft.com/en-gb/industries/gas-engineer-software/ · https://commusoft.co.uk/jobs/custom-forms/
- BuildOps: https://help.buildops.com/en/articles/10695165-mobile-app-overview · https://buildops.com/products/technician-mobile-app/ · https://help.buildops.com/en/articles/14972462-mobile-release-3-76-may-5-2026
- Dynamics 365 Field Service: https://learn.microsoft.com/en-us/dynamics365/field-service/mobile/overview
- CompanyCam: https://intercom.help/companycamapp/en/articles/6828430-edit-and-add-drawings-to-your-photos · https://intercom.help/companycamapp/en/articles/6828372-creating-a-before-after-photo

Accesibilitate / offline:
- https://www.nngroup.com/articles/touch-target-size/ · https://dequeuniversity.com/rules/axe/4.9/target-size · https://frontendchecklist.io/rules/accessibility/touch-targets · https://katalog.lib.cas.cz/KNAV/EdsRecord/edsair,edsair.doi...........9465c900e5780072de7a168d106fd14d · https://appmaster.io/blog/offline-first-background-sync-conflict-retries-ux

România:
- https://www.aktio.ro/solutii/service-mentenanta · https://www.zarinacrm.ro/crm-prestari-servicii/ · https://airplayone.com/software-tehnicieni-service · https://www.bento.ro/en/field-service-management-en/ · https://energynomics.ro/en/?p=179773 · https://bcr.ro/en/press/press-release/2024/12/10/BCR-Seed-Starter-announces-its-first-investment-five-hundred-thousant-euro-in-FieldOS · https://outsourcing-today.ro/?p=12037 · https://www.instalnews.ro/tehnologie/s-crm-software-crm-cloudon-premises-dedicat-firmelor-de-service-hvac · http://softservicecentrale.ro/ · https://dakai.ro/field-service-management-software · https://bocp.ro/workmanager/ · https://www.revistabiz.ro/telekom-lanseaza-aplicatia-unde-mi-e-tehnicianul/
- Facturare: https://www.oblio.eu/api · https://api.smartbill.ro/ · https://folositor.ro/ghid/e-factura-spv-2026 · https://www.zarinacrm.ro/e-factura-ghid-complet/
- ANRE: https://gazest.ro/wp-content/uploads/2025/12/Procedura-privind-verificarile-si-reviziile-tehnice-ale-instalatiilor-de.pdf · https://profit.ro/povesti-cu-profit/energie/anre-clientii-nu-mai-sunt-obligati-sa-efectueze-verificarea-periodica-a-instalatiilor-de-gaze-in-anul-in-care-este-programata-o-revizie-tehnica-19463215 · https://playtech.ro/2025/diferenta-dintre-verificare-si-revizie-tehnica-periodica-a-instalatiei-de-gaze-ce-spune-legea-si-cat-de-des-trebuie-facute-ca-sa-nu-iei-amenda/ · https://www.economica.net/?p=161404 · https://economedia.ro/anre-adopta-derogari-pentru-ca-prosumatorii-sa-poata-pune-mai-repede-in-functiune-instalatiile-de-productie-a-energiei-controale-la-distribuitori-privind-racordarea.html · https://gitea.com/Solaris-Cet/dosar-prosumator
