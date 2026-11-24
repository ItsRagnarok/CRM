# UX în aplicațiile mobile pentru tehnicieni: ce se laudă, ce enervează

Data: 2026-11-24. Etichete: [C] confirmat pe pagină citită / [S] doar din rezumat de căutare / [E] estimare.

## 0. Limite ale cercetării (citește întâi)
- **Nicio pagină de recenzii nu a putut fi citită integral** (Capterra a răspuns 403 la fetch). Tot ce urmează este [S], din rezumate de căutare peste recenzii App Store, Google Play, Capterra, G2, Trustpilot, Xero. Zero afirmații [C].
- **Reddit (r/electricians, r/HVAC, r/solar): nu am găsit niciun thread** prin două căutări. Nu raportez nimic de acolo. Rămâne de făcut direct pe Reddit.
- **Aktio: nu am găsit recenzii.** Nu spun nimic despre el.
- Surse comparative scrise de concurenți (PoolDial, ServiceTrade, Connecteam, ServiceTitan, Housecall Pro) sunt părtinitoare; le-am folosit doar acolo unde coincid cu recenzii de utilizatori.
- Nu am găsit date despre baterie la Housecall Pro; pentru ServiceTitan există o recenzie App Store care o pomenește [S].

## 1. Tipare găsite, pe teme

**Offline (cel mai repetat reproș)**
- Jobber: recenzent Capterra (service piscine) spune că nu merge offline, iar echipa folosește calendarul în zone cu semnal slab; documentația Jobber spune că merge parțial, dar cronometrele pe locație și rapoartele cer conexiune [S] https://www.capterra.com/p/127994/Jobber/reviews/ ; https://help.getjobber.com/en/articles/jobber-app-troubleshooting/
- Tradify: „nu poți introduce nimic fără internet"; răspuns oficial 2025: offline „e pe radar", nelansat din ce am găsit [S] https://ca.trustpilot.com/review/tradifyhq.com
- Housecall Pro: o sursă terță (Connecteam) spune că nu funcționează deloc offline [S] https://connecteam.com/reviews/housecall-pro/
- ServiceTitan: un recenzent spune că offline-ul a rezolvat problema de sincronizare din trecut; altul, conectivitate lentă [S] https://www.capterra.com/p/150053/ServiceTitan/reviews/
- Fieldwire: offline pentru planuri, adnotări și markup e un punct lăudat [S] https://thedigitalprojectmanager.com/tools/fieldwire-review/
- BuildOps: se declară offline-first; singura recenzie găsită (Google Play, 2026) se plânge de blocări și cache de golit, nu de offline [S] https://play.google.com/store/apps/details?id=com.buildops

**Poze și adnotare**
- Tradify: adăugarea pozei „pe loc" e prea lentă, unii fac poza cu camera telefonului și o încarcă ulterior; pozele de la ofertă nu trec în lucrarea creată după acceptare (recenzii vechi, 2016–2019) [S] https://www.capterra.com/p/152413/Tradify/reviews/?page=4
- Fieldwire: poze și markup lăudate; reproș: zona de selectare a markup-ului e prea mare pe telefon, lipsește decuparea pozei [S] https://g2.com/products/fieldwire-by-hilti/reviews?page=5
- Fergus: poze, note, liste de verificare și formulare stau pe fișa lucrării (funcție, nu opinie) [S] https://apps.apple.com/nz/app/fergus-mobile/id557775083

**Formulare, câmpuri, atingeri**
- ServiceTitan: la scriere aplicația sare automat între ecrane și casete de text; „pare pagină web, nu aplicație nativă" [S, recenzii App Store] https://splitmetrics.com/apps/servicetitan-mobile/id1037989976 . G2: curbă de învățare abruptă [S].
- Simpro: aplicația „limitată"; nu poți rezerva o lucrare din ea; nu poți face ofertă pe fiecare activ [S] https://apps.apple.com/ca/app/simpro-mobile/id1419936837 . Mobilul se taxează separat (reclamație Xero: 50 NZD/lună pe utilizator care are nevoie de app) [S].
- Housecall Pro: „funcțiile mobile nu se compară cu desktopul"; interfață mai încărcată decât Jobber (TechRadar, prin rezumat) [S] https://www.techradar.com/pro/software-services/jobber-crm-review
- Număr de atingeri: nu am găsit nicio recenzie care să numere atingeri. Singura mențiune: Housecall Pro are ceas cu „o atingere" [S, Connecteam].

**Semnătură**
- Tradify: lăudat că clientul semnează lucrarea pe loc, înainte de plecare [S]. BuildOps: o recenzie Google Play spune că strângerea semnăturii e „jenant de lentă" [S]. Fergus listează semnătura în aplicație [S].

**Pontaj automat vs manual**
- Tradify: timesheet pe telefon „ca ceva firesc"; Fergus: timer start/stop sau manual pe lucrare [S].
- Housecall Pro: locația GPS a tehnicienilor adesea greșită; sfatul unei surse: permisiune „Always" și restart [S] https://pooldial.com/resources/articles/software-reviews/common-housecall-pro-errors . Capterra: un recenzent „nu foarte precis", altul „efectiv".
- ServiceTrade (non-listat în cerere): probleme de timp-card în timp [S].
- Tradify: orele de pe lucrare nu se propagă automat în ofertă [S].

**Sincronizare, stabilitate, login, notificări**
- Fergus (App Store): pagini care nu se încarcă, blocări, nevoia de a închide și redeschide aplicația [S].
- BuildOps: recenzii App Store/Play sub ~3,2 conform unui concurrent [S, părtinit].
- Jobber: erori de sincronizare cu QuickBooks/Google Calendar duc la corecții manuale [S].
- Housecall Pro: notificările și sincronizarea cu desktopul apar în reproșuri; **SMS-urile către client sunt lăudate** [S] https://www.getapp.com/operations-management-software/a/housecall-pro/
- Login: nicio constatare. Baterie: o singură mențiune (ServiceTitan) [S].

## 2. Concluzii (ce învățăm)
1. Offline lipsă sau parțial este reproșul numărul 1 și cel mai ușor de transformat în avantaj; contează mai ales cine îl declară dar nu îl livrează (BuildOps: instabilitate, Jobber: parțial) [S].
2. Ce se laudă este scurt: ceas pe lucrare, semnătură pe loc, poze pe fișă, SMS către client. Ce se urăște: aplicație care e „desktop micșorat", instabilitate și lentoare, bani în plus pentru mobil.
3. Pozele trebuie să nu blocheze fluxul: captare rapidă, încărcare în fundal, supraviețuire la schimbarea etapei (ofertă→lucrare).
4. GPS-ul automat pentru pontaj generează dispute dacă e imprecis; pontajul trebuie să rămână corectabil.

## 3. Ce înseamnă pentru ElectroField
(Ipoteze din recenzii [S]; de validat cu 3–5 tehnicieni înainte de efort mare.)

| # | Funcție / modificare | Prioritate | Pentru cine |
|---|---|---|---|
| 1 | **Coadă offline vizibilă:** orice acțiune (pontaj, poză, câmp, semnătură) se salvează local; indicator „3 elemente în așteptare", retry automat, fără blocarea ecranului. Sincronizarea nu are voie să piardă date | mare | tehnician, birou |
| 2 | **Pontaj în 2 atingeri pe lucrare** (Start / Stop pe cardul lucrării, din ecranul „Azi"), funcționează offline; GPS doar ca dovadă, nu ca sursă unică; corecție manuală cu motiv | mare | tehnician, patron |
| 3 | **Captare poză rapidă:** cameră direct din lucrare, încărcare în fundal, etichetă preselectată (înainte/după/tablou/aparat); pozele din ofertă/deviz rămân pe lucrare | mare | tehnician |
| 4 | **Adnotare simplă pe poză** (săgeată, cerc, text), zone de atingere mari, fără decupare obligatorie | medie | tehnician, client |
| 5 | **Formulare cu valori implicite și câmpuri obligatorii minime:** buletin/fișă precompletate din client și aparat; câmpurile opționale pliate; fără salt automat între casete | mare | tehnician |
| 6 | **Semnătura clientului pe ecran, într-o singură atingere de la „Finalizează"**, offline, atașată automat la PDF; test de viteză pe telefon ieftin | medie | tehnician, client |
| 7 | **Notificări selective:** push pentru schimbări de program și alerte de termen; SMS/WhatsApp către client cu „tehnicianul e în drum" și link de status (lăudat la Housecall Pro) | medie | client, birou |
| 8 | **Buget de performanță mobil:** timp de pornire, consum de baterie (GPS la cerere, nu continuu), fără reautentificare repetată; login cu sesiune lungă/biometrie | medie | tehnician |
| 9 | **Nicio funcție „doar desktop" pentru acțiunile zilnice:** programare lucrare nouă, ofertă pe loc, materiale folosite — toate pe mobil (reproș Simpro/Housecall Pro) | medie | tehnician, patron |
| 10 | **Mobil inclus în preț, fără taxă separată pe utilizator** (reproș Simpro) — de verificat în politica de preț | mică | patron |

## 4. De făcut în continuare
- Citit direct recenziile App Store/Google Play (Jobber, Housecall Pro, ServiceTitan) și thread-urile Reddit; abia atunci pot marca [C].
- Test intern: număr de atingeri pentru Start pontaj, poză, finalizare cu semnătură în aplicația noastră, față de ținta de 2–3.
