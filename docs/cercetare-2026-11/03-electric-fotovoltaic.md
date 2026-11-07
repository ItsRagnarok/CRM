# ElectroField: fluxul de lucru în instalații ELECTRICE și FOTOVOLTAICE (România)

Data cercetării: 2026-11-07. Raport redactat în română. Doar cercetare, nicio modificare în `/home/user/CRM`.

## 0. Cum se citește raportul

Legenda încrederii, pusă la fiecare afirmație importantă:

- **[V]** = verificat direct în text oficial sau document de operator, citit integral de mine. Exemple: Procedura ANRE 19/2022 (copie Rețele Electrice, februarie 2024), Ghidul prosumatorului E-Distribuție, Ordin ANRE 66/2023, ghidul AFM 2024 (proiect).
- **[S]** = sursă secundară (presă, firmă de instalare, ghid comercial). Plauzibil, dar de confirmat.
- **[?]** = incert sau nu l-am putut confirma. Trebuie verificat înainte de a intra în produs.

Limite ale cercetării:

- Motorul de căutare a dat rezultate slabe pentru ANRE și AFM oficial. Am compensat descărcând și citind PDF-urile primare.
- Site-ul `anre.ro` a răspuns 503 la pagina de atestare, deci tipurile de atestat vin dintr-o versiune mai veche (Ordin 45/2016).
- Textul Ordinului 19/2022 pe care l-am citit este copia consolidată de pe site-ul Rețele Electrice (tipărită în februarie 2024). Ulterior au apărut modificări în racordare, de exemplu Ordin ANRE 53/2024 și Ordin ANRE 15/2026 (MO 436/25.05.2026). Acestea modifică în principal regulile pentru producători mari (>1 MW). Nu am găsit dovada unei schimbări a pașilor pentru prosumatori mici, dar verificarea e obligatorie.
- Gaze: neacoperit aici. Am găsit incidental textul Ordinului ANRE 179/2015 (verificări și revizii instalații de utilizare gaze, modificat prin Ordin 71/2020), cu anexele 1-7. Îl puteți refolosi la cercetarea pentru gaze. Fișierul este servit la URL-ul `https://reteleelectrice.ro/content/dam/retele-electrice/Clientii-nostri/Documents/prosumatori/legislatie/Ordinul-ANRE-nr-19-2022.pdf`, deși numele sugerează altceva.

Corecție importantă față de brief: gradele ANRE „IA/IB/IC/IIA/IIB/IIC" **nu** sunt cele din regulamentul actual pentru România. Regulamentul actual folosește **I, IIA/IIB, IIIA/IIIB, IVA/IVB** (A = proiectare, B = execuție). Vezi secțiunea 2.

---

## 1. Tipuri de lucrări (taxonomie propusă pentru platformă)

### 1.1 Electric

| Cod propus | Lucrare | Note de flux |
|---|---|---|
| `EL_INT_NOU` | Instalație electrică interioară nouă (locuință, apartament, spațiu comercial) | Trasee, doze, tablou, circuite, priză de pământ, verificare inițială, PV recepție |
| `EL_INT_RENOV` | Refacere/modernizare instalație interioară | Idem, plus eventual creștere putere, deci posibil aviz la operatorul de distribuție |
| `EL_EXT` | Instalație exterioară (iluminat, alimentare anexe, pompe, porți, grădină) | Protecție IP, cabluri îngropate, protecții diferențiale |
| `EL_TABLOU` | Tablou electric (montaj, înlocuire, extindere, branșare) | Schemă monofilară, marcaje, RCD/MCB, SPD |
| `EL_BRANSAMENT` | Branșament / instalație de racordare | Dacă este nevoie de lucrări în amonte de punctul de delimitare, le face operatorul de distribuție sau un operator atestat ANRE ales de client. Procedura 19/2022 prevede explicit cele două variante [V] |
| `EL_VERIF_PRAM` | Verificări și măsurători (priză de pământ, izolație, continuitate PE, DDR/RCD, impedanță buclă) | Se emite buletin de măsurători. Poate fi lucrare de sine stătătoare, inițială sau periodică |
| `EL_EV` | Stație/wallbox încărcare EV | Procedură ANRE separată pentru racordarea punctelor de reîncărcare (2022). Număr exact de ordin neconfirmat [?]. Pentru wallbox la un loc de consum existent, fără depășirea puterii aprobate, se aplică un regim simplificat [S] |
| `EL_MENT` | Mentenanță / revizie / depanare | Contract-cadru, periodicitate, checklist scurt |
| `EL_IMBUN` | Lucrări de suplimentare: iluminat de siguranță, paratrăsnet, SPD, UPS | |

### 1.2 Fotovoltaic

| Cod propus | Lucrare | Particularități |
|---|---|---|
| `PV_ONGRID` | Sistem on-grid (injecție în rețea, prosumator) | Calea ANRE de racordare obligatorie, contor bidirecțional, calitatea de prosumator |
| `PV_HYBRID` | Sistem hibrid (invertor hibrid + baterie, on-grid) | Idem, plus datele bateriei în cerere/notificare. Contor suplimentar pe instalația de stocare [V, Ghid E-Distribuție, art. 20 Norma tehnică 228/2018] |
| `PV_OFFGRID` | Sistem izolat | Nu intră în categoria „prosumator" dacă nu are racord la rețea. Fără procedura de racordare ANRE. TVA și garanții diferă (vezi secțiunea 5) |
| `PV_BATERIE_RETRO` | Adăugare baterie la un sistem existent | Notificare de modificare către operatorul de distribuție [?]. Program AFM „Casa Verde Baterii" pentru prosumatori existenți [S] |
| `PV_EXTINDERE` | Extindere (panouri/invertor) | Se tratează ca modificare a instalației de producere, deci reia notificarea/cererea |
| `PV_EV` | PV + wallbox | Combină două fluxuri |
| `PV_SERVICE` | Service/mentenanță/depanare invertor | Garanție, schimb invertor (serie nouă, actualizare documente la operator) |

### 1.3 Căile ANRE de racordare pentru prosumator (esențiale pentru mașina de stări a unui job PV)

Sursă: Procedura ANRE 19/2022, capitolele III-VI^1 și Anexele 1-5 [V], plus Ghidul prosumatorului E-Distribuție [V].

| Cale | Situație | Document de depus | Când se depune | Termene operator (extrase) |
|---|---|---|---|---|
| **A** | Loc de consum și producere **nou** | Cerere de racordare, Anexa 1 | **Înainte** de a începe instalația (art. 7 alin. 3) | ATR ca ofertă, contract de racordare, lucrări de racordare, probe max. 5 zile lucrătoare (art. 21), certificat de racordare în max. 3 zile lucrătoare de la PV recepție punere în funcțiune (art. 22), punere sub tensiune finală în max. 2 zile lucrătoare de la certificat (art. 23) |
| **B1** | Loc de consum **existent**, fără lucrări în amonte de punctul de delimitare | Notificare, Anexa 2 | **După** realizarea instalației de producere (art. 24) | Verificare documentație în 2 zile lucrătoare (art. 25), informare contor în 3 zile lucrătoare, înlocuire/programare contor în max. 5 zile lucrătoare de la notificarea completă (art. 27 alin. 4) |
| **B2** | Loc existent, cu **creștere de putere** (lucrări în amonte) | Cerere de racordare, Anexa 1 | Înainte de execuție (cap. V) | Ca la A |
| **C** | Loc deja echipat cu RES, dar fără certificarea calității de prosumator | Notificare, Anexa 3 | Oricând | Factură tarif actualizare în 1 zi lucrătoare, certificat actualizat în max. 3 zile lucrătoare (art. 37-38) |
| **D** | **≤ 10,8 kW** (sau echivalent pentru conexiuni non-trifazate), loc existent (cap. VI^1, art. 39^1+) | Notificare, Anexa 5 | **Înainte** de realizarea instalației | Verificare în 7 zile, acord sau ATR în max. 15 zile, contor în 7 zile după dosarul instalației, certificat în max. 14 zile de la dosar |
| **E** | Program de finanțare care cere ATR **înainte** de execuție (ex. AFM) | Cerere de racordare, Anexa 4 | Înainte de execuție (art. 41^1) | Se aplică art. 6-23 |

Puncte de atenție:

- Pragul de 10,8 kW din calea D apare în textul consolidat 2024 [V]. Presa din 2024 a discutat simplificări suplimentare ale procedurii de notificare. Nu am verificat dacă pragul s-a schimbat în 2025-2026 [?].
- Operatorul de distribuție **nu are voie** să ceară alte documente decât cele din procedură și nici probe suplimentare deja confirmate prin documentele depuse (art. 41) [V]. Aceasta e o regulă utilă pentru checklisturile noastre.
- Contorul bidirecțional: îl asigură și îl plătește operatorul de distribuție. Lipsa stocurilor la operator **nu** condiționează punerea sub tensiune a instalației (art. 41^2) [V]. Prosumatorul poate cumpăra contorul și i se poate rambursa contravaloarea (art. 20 alin. 2^1 și urm.) [V].
- Operatorii de distribuție din România: E-Distribuție (Muntenia, Dobrogea, Banat), Delgaz Grid (Moldova etc.), Rețele Electrice (ex-Enel/PPC), Electrica Distribuție (Transilvania). Denumirile s-au schimbat în ultimii ani, deci operatorul trebuie să fie câmp configurabil [S].

---

## 2. Autorizări: cine poate semna ce

### 2.1 Electricieni autorizați ANRE (persoană fizică)

Sursă: Ordin ANRE 66/2023 (regulament autorizare electricieni, înlocuiește Ordin 99/2021) [V, citit prin LegeAZ, ultimele ~2.200 caractere necitite].

| Grad | Domeniu | Observații |
|---|---|---|
| I | Doar execuție, instalații **interioare**, putere instalată max. 10 kW, sub 1 kV | Poate lucra independent doar în acest cadru, în asociere cu alt electrician autorizat cu condiții similare (art. 35) |
| IIA / IIB | A = proiectare, B = execuție, orice putere, sub 1 kV | IIB/IIIB/IVB: pot executa interior până la 30 kW sub 1 kV, în asociere [art. 35, formularea e ambiguă în rezumatul meu, de recitit] |
| IIIA / IIIB | Proiectare / execuție, până la 20 kV | |
| IVA / IVB | Proiectare / execuție, orice tensiune standardizată | |

Alte reguli [V]:

- Autorizația este valabilă doar cu **viză periodică la 5 ani** (art. 18). Viza cere dovada unui curs teoretic de min. 20 ore în ultimele 12 luni (art. 30).
- Fără viză la termen, titularul nu poate proiecta, executa sau verifica.
- Electricianul nu semnează documente pentru lucrări pe care nu le proiectează, nu le execută sau nu le supraveghează direct (art. 37 f).
- IIB/IIIB/IVB pot face **măsurători de priză de pământ** și pot emite rapoarte de verificare pentru instalațiile angajatorului (art. 36 alin. 2).
- Grade II-IV pot proiecta/executa/verifica și alte instalații, doar dacă au și atestatul ANRE corespunzător (art. 35).
- Verificatori de proiecte și experți tehnici au reguli proprii: verificator = grad IIIA/IVA de min. 5 ani, expert = IIIA+B/IVA+B de min. 8 ani. Rareori relevanți pentru instalatori rezidențiali.
- Autorizația trebuie să corespundă înscrisului din registrul electronic ANRE și se poartă cu actul de identitate (art. 18 alin. 2).
- Examen: 25 de întrebări grilă, 18 puncte minim (anexa 1).

Concluzie pentru produs: stocați per tehnician **grad, serie/număr legitimație, data viză, data următoarei vize** și blocați (sau avertizați) la alocarea pe lucrări dacă viza expiră sau dacă gradul nu acoperă puterea/tensiunea lucrării.

### 2.2 Atestatul operatorului economic (firma)

Sursă: Ordin ANRE 45/2016 (versiunea 2016, văzută prin LegeAZ). Pagina de legislație racordare a operatorului citează însă „Ordinul ANRE 134/2021" ca reglementare actuală de atestare [S: pagină-index]. Posibil înlocuiește 45/2016, deci **de verificat** [?].

Tipuri de atestat (2016) [V în sursa citită, vechime de verificat]:

| Tip | Domeniu |
|---|---|
| A1 / A2 / A3 | Încercări la JT / JT+MT / certificare conformitate centrale eoliene și fotovoltaice |
| B, Bp, Be, Bi | **B** = proiectare + execuție instalații la 0,4 kV (clădiri, branșamente). Bp doar proiectare, Be doar execuție, Bi execuție în incinte/construcții |
| C1A/C1B, C2A/C2B | Proiectare/execuție linii și posturi/stații MT sau 110 kV |
| D1/D2 | Linii aeriene și subterane, orice tensiune |
| E1/E2/E2PA | Posturi, stații, partea electrică a centralelor, protecții și automatizări |

- Valabilitate: nelimitată în principiu, dar cu **viză la 5 ani**. Cererea de viză se depune cu 60-120 zile înainte de termen (art. 9, art. 22) [V].
- Structura de personal trebuie să includă electricieni autorizați cu gradul minim potrivit nivelului de tensiune, plus verificatori de proiecte și RTE autorizați (art. 14, art. 31) [V].
- Pentru PV rezidențial (JT, 0,4 kV) tipul relevant este **B/Be/Bi**. Textul 2016 nu menționează explicit PV [V], deci este inferență. Pentru AFM, instalatorul trebuie să aibă „atestat ANRE tip B sau altele care includ competențele de tip B" (ghid AFM 2024, art. 14 lit. h) [V].
- Încercări/măsurători (inclusiv buletin priză): firmă cu atestat **A1** sau B (B include A1) sau electrician IIB+ pentru instalațiile angajatorului [V pe baza Ordin 45/2016 + 66/2023].

### 2.3 „Cine semnează ce" într-un job PV (matricea documentelor)

| Document | Emitent/semnatar | Observații |
|---|---|---|
| Cerere de racordare (Anexa 1) / Notificare (Anexa 2, 3, 5) | Prosumator sau **împuternicit** (inclusiv reprezentant al operatorului economic atestat; pentru casnici și furnizorul de energie) | Semnătura e **obligatorie** (art. 7, 24, 37) [V] |
| Schema electrică monofilară (cu protecții și reglaje) | Proiectant (Bp/B sau electrician IIA+) | Parte din dosarul instalației (art. 19 lit. d) [V] |
| PV recepție la terminarea lucrărilor | **Executantul lucrării** | Anexa 2 lit. c: „întocmit de executantul lucrării" [V] |
| Buletin de încercare a prizei de pământ | Firmă atestată (A1/B) sau electrician IIB+ | [V] pe baza 66/2023 |
| Certificate de conformitate și fișe tehnice invertor/baterie | Producătorul (copie) | [V] |
| PV recepție punere în funcțiune a instalației de producere | Prosumator sau împuternicit, transmis operatorului după perioada de probe | Art. 21 alin. 2 [V] |
| ATR, contract de racordare, certificat de racordare | Operatorul de distribuție | Certificatul poartă mențiunea „prosumator" |
| Buletin de verificare reglaje protecții externe (când sunt externe) | Firmă atestată | Cerință DEER [V, document operator] |

---

## 3. Procesul PV de la capăt la capăt și documentele lui

### 3.1 Etape și documente (flux recomandat pentru platformă)

| # | Etapă | Document / eveniment | Cine | Poate fi autogenerat din platformă? |
|---|---|---|---|---|
| 1 | Lead și vizită tehnică | **Fișă de vizită/audit** (acoperiș, tablou, priză existentă, factură, consum, umbriri) | Tehnician/inginer | Șablon completat în aplicație, ieșire PDF |
| 2 | Ofertă | **Ofertă** (configurație, kWp, preț, TVA, garanții, termene, valabilitate) | Vânzări | Da, din catalog + fișa de vizită |
| 3 | Contract | **Contract de execuție** cu eșalonare plăți, anexe: oferta, specificații, garanții | Admin | Da, din ofertă (clauze standard) |
| 4 | Procură | **Împuternicire** pentru depunere la operator (dacă firma depune în numele clientului) | Client | Da, șablon cu câmpuri preluate din CRM |
| 5 | Pregătire racordare | **Cerere de racordare Anexa 1 / Notificare Anexa 2/3/5 / Anexa 4** + anexele (act identitate, extras CF, acord proprietar/asociație etc.) | Instalator în numele clientului | **Da, în mare parte**: date client, loc de consum, tabelele PV/invertoare, baterie, contor. Vezi 3.3 |
| 6 | (dacă e cazul) Aviz tehnic de racordare + contract de racordare + plată tarife | **ATR** și contract (de la operator) | Operator | Doar urmărire de stare și încărcare PDF |
| 7 | Execuție | Montaj, cablare, protecții, priză de pământ | Echipă | Checklist de execuție |
| 8 | Probe/verificări | **Buletin măsurători** (priză, izolație DC/AC, continuitate, RCD), **raport test PV** (Voc/Isc/polaritate/Riso pe șir) | Tehnician | Da, din măsurătorile introduse |
| 9 | Recepție la terminarea lucrărilor | **PV recepție la terminarea lucrărilor** (executant + beneficiar) | Executant | Da |
| 10 | Dosarul instalației de utilizare | **Pachet de 4 documente** (art. 19) transmis operatorului | Instalator | Da, bundle PDF cu tabel de conținut |
| 11 | Cerere punere sub tensiune pentru probe | Cerere + dosar; operatorul trimite „notificarea de punere sub tensiune" (acord probe) | Instalator/prosumator | Cerere: da. Notificarea: încărcare |
| 12 | Montaj/înlocuire contor | Operatorul montează contorul bidirecțional (sau prosumatorul îl cumpără și i se rambursează) | Operator | Doar stare |
| 13 | Probe (max. 5 zile lucrătoare pentru loc nou) | **PV recepție punere în funcțiune** | Instalator/prosumator | Da |
| 14 | Certificat de racordare | **Certificat de racordare cu mențiunea „prosumator"** | Operator | Încărcare |
| 15 | Punere sub tensiune finală | Max. 2 zile lucrătoare de la certificat | Operator | Stare |
| 16 | Contract vânzare-cumpărare energie | Prosumatorul solicită furnizorului. Furnizorul trimite contractul în 10 zile, prosumatorul îl returnează în 10 zile (Ord. 15/2022 art. 4) [V, Ghid E-Distribuție] | Client + furnizor | Nu (în afara noastră), dar putem genera cererea-tip |
| 17 | Predare către client | **Dosar de predare** (manuale, garanții, parole, scheme as-built, inventar seriale, instrucțiuni, program mentenanță) | Instalator | Da |
| 18 | Facturare | Facturi pe tranșe, factură finală (QR AFM unde e cazul) | Contabilitate | Parțial (vezi secțiunea 5) |
| 19 | Decontare AFM (dacă e cazul) | Cerere de decontare, listă beneficiari | Firma validată | Da (export) |

Surse pentru pașii 5-15: Procedura 19/2022 [V], Ghid E-Distribuție [V]. Pașii 1-4 și 17 sunt practică comercială [S], ex.: Genway descrie vizita de amplasament cu verificarea prizei existente, contract + avans, montaj, certificat, ultima tranșă [S].

### 3.2 Dosarul instalației de utilizare (art. 19 din Procedură) [V]

Conținutul **minim legal** pentru instalația de producere racordată prin cale A/B2/C/D:

1. procesele-verbale care confirmă recepția la terminarea lucrărilor;
2. buletinul de încercare a prizei la pământ;
3. certificatele de conformitate și fișele tehnice emise de fabricant, în copie, pentru invertoare/unități generatoare, plus fișele tehnice ale instalației de stocare, după caz;
4. schema electrică monofilară a instalației de utilizare, inclusiv tabloul general, cu protecțiile prevăzute și reglajele lor.

Operatorul are 2 zile lucrătoare să anunțe că dosarul e incomplet (art. 19 alin. 2), iar completarea nu cere o nouă cerere (alin. 3). Pentru calea B1 (Anexa 2) lista este aceeași: PV recepție, buletin priză, certificate/fișe, schema monofilară **și modul de racordare în instalația existentă**. Mai cere act de identitate/certificat de înregistrare și, pentru persoane juridice, certificat constatator (Anexa 2 lit. a-f) [V].

Practica operatorilor (DEER): cer și metodele de anti-insularizare folosite, existența și setarea protecțiilor interne (max/min U, max/min f, df/dt) și, dacă protecția e externă, **buletin de verificare emis de firmă atestată** [V, document DEER „Condiții tehnice pentru generatoare"].

### 3.3 Câmpurile Anexei 1/2 (pentru autogenerare) [V]

Modelul unic are aceste blocuri. Platforma poate ține un obiect `grid_application` din care se produc ambele PDF-uri:

- **Solicitant:** nume/denumire, domiciliu/sediu (județ, localitate, cod poștal, stradă, nr., bl., sc., et., ap.), telefon, email, CNP/CUI, nr. registrul comerțului, reprezentant și calitate, cont bancar, **împuternicit/PFA/reprezentant operator atestat/furnizor** (nume, CNP, adresă, nr./data/emitent act autorizare).
- **Tip cerere:** loc nou / loc existent (cu sau fără depășirea puterii aprobate), checkbox: ATR + certificare prosumator / înlocuire contor cu bidirecțional. Dată estimată de punere sub tensiune. Descriere alimentare actuală și modificări.
- **Obiectiv:** județ, localitate, stradă, nr. CF, nr. cadastral. Pentru notificarea Anexa 2: **cod unic de identificare (pe factura de energie)**.
- **Date locul de consum:** putere maximă simultan absorbită (kW și kVA), tip racord (monofazat/trifazat), listă receptoare (denumire, Pi kW, observații), Total Pi.
- **Date locul de producere:** putere maximă simultan evacuată (kW, kVA).
- **Tabel module PV:** nr. panouri, tip panou, **Pi panou (kW c.c.)**, Pi total panouri, Pmax debitată de panouri, Pi total panouri pe 1 invertor.
- **Tabel invertoare:** nr. invertoare, tip, Un invertor (V c.a.), Pi invertor (kW c.a.), Pmax invertor evacuată în rețea, Pmax centrală.
- **Compensare reactivă** (da/nu + tabel), **generatoare sincrone/asincrone** (dacă e cazul), **servicii interne** (Pi, Pmax absorbită).
- **Stocare:** deține/nu, detalii schemă, **capacitate baterii (Ah)**.
- **Echipamente de măsurare ale prosumatorului:** serie contor, tip, date tehnice.
- **Anexe (Anexa 1):** act identitate/CUI, certificat constatator (PJ), certificat de urbanism, plan de situație cu coordonate stereo, act proprietate (+ acord proprietar pentru spații nedeținute), autorizație de construire (doar pentru organizare de șantier). Pentru Anexa 2/5 lista este mai scurtă (vezi 3.2).
- **Declarație pe propria răspundere** și semnătură.
- **Anexa 5 (≤10,8 kW)** adaugă: opțiunea pentru contractarea proiectării/execuției instalației de racordare (operator prin achiziție publică / operator cu firma aleasă de prosumator / prosumator cu firma aleasă de el) [V].

Autogenerabil: practic toate, **cu excepția** semnăturii și a codului unic de pe factură (se ia de la client, ideal ca poză a facturii) și a CF/cadastral (din extras CF).

### 3.4 Programe AFM (stare la 2026-11) și rolul instalatorului

Stare [S, de verificat pe afm.ro]:

- **Casa Verde Fotovoltaice**: proiectul de buget AFM 2026 (mai 2026) nu îl mai include. Un ghid terț (actualizat 26 oct. 2026) spune că nu s-a anunțat sesiune nouă pentru panouri în 2026 [S].
- **Casa Verde Baterii** (prosumatori existenți): ~400 mil. lei, baterie nouă min. 10 kWh, până la 75% și max. 15.000 lei (incluzând TVA, după FAQ). Ghidul ar fi apărut în MO la 14 sept. 2026, data de înscriere neanunțată la 21 oct. 2026 [S, una singură, de confirmat pe afm.ro].
- **Electric Up** (IMM/HoReCa, până la 150.000 euro, PV + puncte de încărcare EV): ghidul e pe site-ul Ministerului Energiei. Starea 2026 neconfirmată [?]. Cunoscut ca program cu probleme de decontare [S].

Mecanica din **ghidul AFM 2024 (proiect de consultare)** [V], bună ca model de funcționalitate pentru platformă chiar dacă 2026 diferă:

- Instalatorul „validat" are contract de participare cu AFM și **garanție de 200.000 lei** (art. 15), atestat ANRE tip B (art. 14), și răspunde de conformitatea documentelor din aplicație (art. 29).
- Solicitantul selectează instalatorul în max. 90 de zile de la lista de aprobați (art. 20). Implementarea (instalare + **certificat de racordare**) în max. 12 luni (art. 25).
- Cerințe tehnice minime: panouri ≥3 kW total, invertor ≥3,0 kW, instalație de stocare, certificare SR EN ISO/IEC 17065; panouri IEC 61215 și 61730 cu garanție de degradare >90% la 10 ani și >80% la 25 de ani; invertor IEC 62109 (art. 17). Funcții: stocare 1 an a datelor de producție, citire la distanță prin protocol deschis, identificare după **serial** (art. 17 alin. 6).
- **Factura**: preț de vânzare și, distinct, mențiunea „suma de … lei se suportă de AFM…". Conține identificare instalator și beneficiar, denumire/cantitate bunuri și servicii, **nr. și data certificatului de racordare**. Poartă **cod QR** cu: nr./dată factură, adresa din extrasul CF, beneficiar, **puterea instalată, seriile panourilor și ale invertorului** (art. 26).
- **Decontare** (art. 27): cerere de decontare semnată cu semnătură electronică calificată, listă beneficiari generată de aplicație, facturi, certificate de racordare. Plata în max. **60 de zile**. AFM **nu** plătește avansuri și nici facturi de avans între beneficiar și furnizor. Minim 10 sisteme la decont dacă ai peste 10 înscriși.
- Monitorizare 1 an după certificat; eșantion 10% la verificare; dacă ≥5% sunt neeligibili, instalatorul pierde accesul 5 ani (art. 28).

Implicații pentru ElectroField: modul „AFM" cu export al listei, generare factură cu text obligatoriu și cod QR, legătură serii-panouri ↔ job ↔ client, alertă dacă lipsește numărul certificatului de racordare.

---

## 4. Ce captează tehnicianul pe teren

### 4.1 Fotovoltaic: date și măsurători

Sursă pentru câmpurile de cerere: Anexa 1/2 [V]. Pentru măsurători: IEC 62446-1 din secundare [S, vezi lista de verificat], protecții din documentul DEER [V].

**Identificare și site**

- Client, adresă, nr. CF, cod unic loc de consum (de pe factură), tip racord (mono/trifazat), putere aprobată existentă, operator de distribuție, număr contor existent (serie, tip).
- Tip acoperiș (țiglă, tablă, panou sandwich, terasă, sol), înclinare, azimut, umbriri, structură de prindere, lungimi trasee DC/AC.

**Panouri**

- Producător, model, putere nominală Wp, **număr total panouri**, **serii panouri** (scanare cod de bare/QR din cutie sau pe panou), distribuție pe șiruri/MPPT.
- Totaluri calculate: kWp DC, raport DC/AC.

**Invertor(oare)**

- Producător, model, **serie** (și versiune firmware), putere nominală c.a., număr MPPT, tensiune max. c.c. de intrare, curent max. de intrare, tip (string/hibrid/micro).
- Setări de rețea/cod de rețea și **valorile protecțiilor de interfață**. Valori de referință (tabelul 2P din Ordin ANRE 132/2020, citate de DEER): tensiune treapta I 1,15 Un / 0,5 s; treapta II 0,85 Un / 3,2 s; frecvență treapta I 52 Hz / 0,5 s; treapta II 47,5 Hz / 0,5 s; maxim tensiune mediat 10 minute 1,1 Un [V în documentul DEER, dar de confirmat în ordin consolidat înainte de a hardcoda].
- Protecții externe: obligatorii peste 30 kVA sau la MT. Sub 30 kVA și JT se pot folosi cele din invertor (art. 14 Ord. 228/2018, mod. 132/2020) [V, citat de DEER].
- Metodă de anti-insularizare, limitare de export / zero-export dacă e cazul.

**Baterie** (dacă există)

- Producător, model, **serii module**, capacitate nominală kWh și Ah, tensiune, BMS, amplasare/ventilație, invertor asociat. Contor suplimentar pe instalația de stocare, după caz [V].

**Protecții și tablouri**

- Tablou DC (SPD, siguranțe, separator), tablou AC (MCB, DDR, SPD), tip și curenți, întreruptor de interfață, 2 echipamente de comutație între unitatea generatoare și punctul de racordare (art. 14 alin. 1 lit. a) [V].
- Secțiuni de cabluri DC/AC, tip, culori, conectori, marcaje.

**Măsurători (per șir, înainte de conectare la invertor)**

| Mărime | Unitate | Notă |
|---|---|---|
| Polaritate | OK/NOK | Se face înainte de interconectarea șirurilor [S: Fluke/IEC 62446-1] |
| Tensiune în gol Voc per șir | V | Comparare cu valoarea așteptată, toleranță orientativă ±5% [S: blog, de verificat în standard] |
| Curent de scurtcircuit Isc per șir | A | Toleranță orientativă ±10% [S, de verificat] |
| Iradianță și temperatură modul | W/m², °C | Iradianță stabilă, de ordin ≥400 W/m² pentru I-V [S, de verificat] |
| Rezistență izolație c.c. activ↔PE | MΩ | Orientativ ≥1 MΩ per șir [S, de verificat; verificare de valoare în I7/2011 și HD 60364-6] |
| Continuitate PE/echipotențială | Ω | Cadre de panouri, structură |
| Tensiune pe MPPT după pornire, curent de lucru | V, A | Test funcțional |

**Măsurători instalația c.a. / de joasă tensiune (PRAM)**

- **Rezistența prizei de pământ** (Ω). Valori citate de un furnizor comercial: max. 4 Ω priză de protecție a instalației, 10 Ω paratrăsnet, 1 Ω comună [S: brig.ro, de verificat în I7/2011].
- Rezistența izolației circuitelor (MΩ), continuitatea conductorului de protecție (Ω), impedanța buclei defect (Zs, Ω), declanșare DDR (mA, ms), succesiunea fazelor, tensiuni L-N/L-L, tensiune la bornele invertorului după conectare.
- Perioadă de verificare periodică: prize și tablouri anual, priza de pământ la 2 ani în condiții normale [S: brig.ro, de verificat].

### 4.2 Electric (instalații interioare/exterioare, tablouri)

- Date identificare lucrare și beneficiar, tip instalație (nou/renovare), putere instalată, tip alimentare (mono/trifazat), schema TN-S/TN-C-S.
- Tablou: producător, nr. circuite, protecții (MCB, DDR 30 mA, SPD, protecție la supratensiuni de frecvență industrială la racord), marcaje.
- Circuite: destinație, secțiune, protecție, lungime estimată.
- Măsurători per circuit: izolație, continuitate PE, Zs, DDR. Priză de pământ. Polaritate prize.
- Materiale cu număr de lot/serie unde se aplică (tablou, contor, aparate de protecție).

### 4.3 Listă de fotografii obligatorii (propunere)

Fotografiile pot fi cerute de operator, de audit AFM sau de reclamații în garanție. Fiecare cu dată/oră, GPS și etichetă tip.

Fotovoltaic:

1. Locul înainte de lucrare (acoperiș/fațadă/sol, tablou existent, contor, priză existentă).
2. Plăcuța de identificare a **fiecărui invertor** (serie vizibilă) și a bateriei.
3. Panouri: cutie/etichetă serie (sau fotografie a listei de serii), vedere de ansamblu, structura de prindere (fixări, etanșări la penetrări).
4. Cablare DC (marcaje, conectori, trasee, protecție UV), cablare AC.
5. Tablou DC și tablou AC, deschise și închise, cu schema lipită pe capac.
6. Priza de pământ și bara de egalizare, legături echipotențiale la structură.
7. Contor bidirecțional (serie vizibilă) și punctul de delimitare.
8. Afișajul invertorului/aplicației cu valori de producție și setările protecțiilor.
9. Valorile aparatului de măsură (Voc, Isc, Riso) pentru o mostră de șiruri.
10. Etichete de avertizare (c.c. și c.a., oprire de urgență).
11. Locul după lucrare (curățenie, acoperiș integru).
12. Semnătura/predarea (opțional) și, pentru AFM, panourile cu eticheta de informare publică (art. 28 alin. 5 pct. 10) [V].

Electric:

1. Tabloul înainte/după, cu schema.
2. Fiecare circuit marcat.
3. Priza de pământ și măsurătoarea.
4. Trasee ascunse înainte de acoperire (fotografie obligatorie la lucrări noi).
5. Contor/branșament/punct de delimitare.
6. Ecranul/etichetele aparatului de măsură.

### 4.4 Pași de siguranță (checklist de început și sfârșit de lucrare)

Surse: practică generală de securitate electrică [S/general, de confirmat cu normele ANRE/ITM aplicabile; nu am citat un text oficial].

Înainte:

- Verificare grad/viza electricianului și acoperirea lucrării (autorizare în termen).
- Evaluare riscuri, delimitarea zonei, **lucru la înălțime** (ancore, ham, parapet, scări), vreme (vânt, ploaie, gheață).
- Separare completă de rețea, blocare/etichetare (LOTO), verificarea absenței tensiunii, legare la pământ și scurtcircuitare unde se aplică, delimitare.
- DC: panourile produc tensiune cât timp sunt luminate. Se deconectează invertorul și separatorul c.c., se marchează „nu conectați".
- EIP: cască, mănuși izolante, încălțăminte, ochelari. Detector/tester calibrat.

La sfârșit:

- Verificare vizuală generală, strângere borne cu cuplu, etichete, scheme as-built la tablou.
- Teste c.c. înainte de conectare, apoi teste c.a., apoi punere în funcțiune și verificare protecții.
- Instruirea clientului (oprire de urgență, aplicație, nu se intervine în tablou/invertor).
- Curățenie și predare.

### 4.5 Garanții și mentenanță (valori de pornire, configurabile)

- Panouri: garanție de performanță cu degradare >90% la 10 ani și >80% la 25 de ani (cerință AFM 2024) [V]. Exemple de oferte: panouri 12 ani produs, invertoare Fronius 7 ani și Huawei 10 ani, echipamente auxiliare și montaj 2 ani [S: Genway].
- Garanție legală de conformitate pentru consumatori: 2 ani pentru bunuri (OUG 140/2021) [?, de verificat].
- Verificările calității energiei livrate: operatorul poate verifica periodic, la max. 1 an (art. 40 Procedură) [V]. Nu se confirmă că verifică efectiv în fiecare an.
- Program de mentenanță sugerat pentru șablon (practică industrie [S]): inspecție anuală (vizual, cuplu borne, SPD, conectori, termografie, Riso, DDR), curățare după nevoie, actualizare firmware invertor, verificare baterie (SoH), verificare periodică a prizei la 2 ani.

---

## 5. Materiale/stoc și facturare

### 5.1 Materiale tipice și urmărire seriale

| Categorie | Exemple | UM | Serial/lot |
|---|---|---|---|
| Panouri PV | 400-450 Wp | buc | **Serial per panou** (necesar pentru QR-ul AFM) |
| Invertor (string/hibrid/micro) | | buc | **Serial per unitate** + firmware |
| Baterie | module | buc | **Serial per modul** |
| Smart meter/contor consum | | buc | Serial |
| Structură de montaj | șine, cleme, cârlige, balast | buc/set | Lot (opțional) |
| Cablu solar DC | 4-6 mm², roșu/negru | m | Bobină/lot |
| Cablu AC | CYY-F 3x2,5…5x10 | m | Lot |
| Conectori MC4 | | buc | Lot |
| Tablou DC | separator, siguranțe fuzibile, SPD tip 2 c.c. | buc/set | Lot |
| Tablou AC | MCB, DDR 30 mA, SPD, contactor | buc | Lot |
| Priză de pământ | electrod, platbandă OLZn, bandă, bară egalizare | buc/m | Lot |
| Accesorii | tuburi, jgheaburi, presetupe, papuci, etichete | buc/m | — |
| Electric | cablu, doze, tablouri, aparataj, corpuri iluminat, prize, întrerupătoare | buc/m | Lot/serial pentru contor, tablou |
| EV | wallbox | buc | Serial |

Reguli de produs: seria se asociază la **job** și la **client/loc** pentru garanție și pentru QR AFM. Scanare multiplă (listă de serii dintr-un document de livrare sau import CSV), alocare din stoc la livrare, retur parțial.

### 5.2 Facturare (cum se face de obicei)

- **Etapizare tipică (ofertă comercială, [S])**: 10% avans la semnare, 80% după montaj, 10% după obținerea certificatului de racordare [Genway]. Variază între firme. Alte variante (50/40/10 etc.) nu le-am găsit documentate, deci schema trebuie configurabilă.
- **AFM**: instalatorul facturează întreaga valoare, cu mențiunea sumei suportate de AFM, iar beneficiarul plătește diferența. AFM plătește instalatorul în max. 60 zile și nu finanțează avansuri [V, ghid 2024 proiect]. Factura se emite **după** aprobarea solicitantului și înainte de cererea de decontare.
- **Prosumator persoană fizică ≤27 kW**: nu emite factură pentru energia livrată furnizorului și nu depune declarație unică pentru acest venit (Cod fiscal) [V, Ghid E-Distribuție]. Nu e un subiect pentru facturarea instalatorului, dar e bun de explicat în oferta către clienții casnici.
- **Prosumatori peste 200 kW până la 400 kW**: regularizare financiară, cu factură emisă de prosumator [V]. Rar pentru instalatori rezidențiali.

### 5.3 TVA (de verificat obligatoriu)

- Până în 2025, livrarea și instalarea de panouri solare/PV și pompe de căldură **destinate locuințelor** aveau cota redusă (5% în 2023, apoi 9%, art. 291 alin. 2 lit. n Cod fiscal), cu **declarație pe propria răspundere** a cumpărătorului (model în anexă) [S: infotva.manager.ro, mai 2025]. Pentru alte clădiri se aplica cota standard.
- **Bateriile**: aceeași sursă spune că 9% se aplica doar pentru baterii din sisteme **off-grid**, iar on-grid 19% [S, opinia autorului, de verificat în text].
- Din 1 august 2025, cota standard a devenit 21% și cea redusă 11%. Aceasta este din cunoștințele mele, **nu am putut-o confirma în sursele găsite** și nu știu dacă și cum s-a aplicat la PV rezidențial [?]. Marcat ca **de verificat cu un contabil/ANAF** înainte să fie hardcodat.
- Produs: câmpul TVA pe linie de factură trebuie să fie configurabil cu regimuri: standard, redus (cu declarație), scutit, off-grid. Atașare declarație pe propria răspundere ca document al jobului.

---

## 6. Șabloane de checklist și formulare pentru platformă

Convenții: `T` = tip câmp (`text`, `num`, `enum`, `bool`, `date`, `photo`, `serial_list`, `signature`, `measure`). `Obl` = obligatoriu. Pentru `measure` se definește unitatea, limita (configurabilă) și pass/fail automat. Etichetele de sursă `[V]/[S]/[?]` sunt doar pentru dezvoltatori.

### 6.1 Șablon „Electric" (job tip `EL_*`)

**Secțiunea 0: Antet (auto din CRM)**

| Câmp | T | Obl |
|---|---|---|
| Job ID, client, adresă, loc de consum (cod unic), operator distribuție | text | da |
| Tip lucrare (`EL_INT_NOU`, `EL_TABLOU`, …) | enum | da |
| Echipă, electrician responsabil (grad, nr. legitimație, viză valabilă până la) | text/date | da |
| Firmă executantă (atestat tip, nr., valabilitate viză) | text/date | da |
| Putere instalată (kW), alimentare (mono/trifazat) | num/enum | da |

**Secțiunea 1: Siguranță înainte de start** (toate `bool`, toate obligatorii)

1. Autorizație electrician în termen și potrivită lucrării.
2. Evaluare riscuri efectuată, zona delimitată.
3. Separare de rețea efectuată, blocare/etichetare.
4. Absența tensiunii verificată cu tester.
5. EIP purtat. Lucrări la înălțime: ancorare/ham verificate (dacă e cazul).
6. Fotografie „înainte de lucrare" (`photo`).

**Secțiunea 2: Execuție** (bifare + observații + foto unde e cerut)

| Pas | T | Foto |
|---|---|---|
| Trasee și doze conform plan (secțiuni conform proiect) | bool | Da, înainte de acoperire |
| Tablou electric montat, marcat, schemă lipită | bool | Da |
| Protecții: MCB, DDR 30 mA pe circuite prize/baie/exterior, SPD | bool + enum | Da |
| Legături echipotențiale (baie, conducte, structuri) | bool | Da |
| Priză de pământ realizată/verificată | bool | Da |
| Marcaje circuite și avertizări | bool | Da |
| Contor/punct de delimitare neatins sau pregătit pentru operator | bool | Da |

**Secțiunea 3: Măsurători**

| Măsurătoare | T | Unitate | Limită (config) | Obl |
|---|---|---|---|---|
| Rezistență priză de pământ | measure | Ω | ≤4 (de confirmat în I7/2011 [?]) | da |
| Rezistență izolație, per circuit | measure | MΩ | ≥1 (de confirmat [?]) | da |
| Continuitate PE per circuit | measure | Ω | conform proiect | da |
| Impedanță buclă defect Zs | measure | Ω | conform protecție | da |
| Test DDR (curent/timp) | measure | mA/ms | ≤30 mA, ≤300 ms [?] | da |
| Aparat de măsură: model, serie, data calibrării | text/date | | | da |

**Secțiunea 4: Recepție și semnături**

| Câmp | T |
|---|---|
| Observații, defecte constatate, remedieri | text |
| Fotografii finale | photo |
| Semnătură executant | signature |
| Semnătură beneficiar | signature |
| Generare PV recepție la terminarea lucrărilor și buletin măsurători (PDF) | acțiune |

**Secțiunea 5: Predare**: schemă as-built, instrucțiuni, periodicitate verificări, garanție lucrare. Materiale consumate cu serii unde e cazul.

**Șablon separat `EL_VERIF_PRAM` (buletin de măsurători)**: antet beneficiar, instalație (denumire, adresă, tip), aparate (model, serie, calibrare), tabel de măsurători pe element verificat cu **valoare măsurată vs. valoare maximă admisă** și concluzie (conform/neconform), data următoarei verificări, semnătura electricianului/firmei atestate (atestat/grad). Conținutul urmează descrierea tipică a unui buletin PRAM de la furnizori [S].

### 6.2 Șablon „Fotovoltaic" (job tip `PV_*`)

**Secțiunea 0: Antet** — ca la electric, plus: tip sistem (`on-grid`/`hybrid`/`off-grid`), **cale de racordare** (A/B1/B2/C/D/E), nr. dosar la operator, nr. ATR (dacă e cazul), AFM (da/nu, nr. dosar), kWp planificat.

**Secțiunea 1: Vizită tehnică/audit** (poate fi un job separat)

| Câmp | T |
|---|---|
| Factură de energie (poză), cod unic loc de consum, putere aprobată, tip racord | photo/text/num/enum |
| Tablou existent (poze), contor (serie, tip), priză de pământ existentă (măsurătoare) | photo/measure |
| Acoperiș: tip, înclinare, azimut, suprafață utilă, umbriri, stare structură | enum/num/photo |
| Distanță acoperiș-tablou (m), traseu cabluri | num |
| Consum anual (kWh), profil de consum | num |
| Observații pentru ofertă | text |

**Secțiunea 2: Siguranță** — ca la electric, plus: lucru pe acoperiș (parapet/ham/scară), separator c.c. deschis și etichetat, vânt/ploaie verificate, tensiune c.c. prezentă când panourile sunt luminate (avertizare).

**Secțiunea 3: Echipamente instalate**

| Câmp | T | Obl |
|---|---|---|
| Panouri: producător, model, Wp | text/num | da |
| **Număr panouri** | num | da |
| **Serii panouri** | serial_list (scanare/CSV, validare unicitate și cantitate = număr panouri) | da |
| Șiruri: nr. șir, nr. panouri/șir, MPPT | tabel | da |
| Invertor: producător, model, **serie**, putere kW, nr. MPPT, firmware | text/serial | da |
| Setări rețea: cod de rețea, valori protecții (U>, U<, f>, f<, mediere 10 min) | tabel num | da |
| Limitare export/zero-export (da/nu, valoare) | bool/num | nu |
| Baterie: producător, model, nr. module, **serii**, kWh, Ah | tabel/serial_list | dacă `hybrid` |
| Contor/smart meter: model, serie | text | da |
| Tablou DC: separator, SPD, siguranțe | enum | da |
| Tablou AC: MCB, DDR, SPD, întreruptor de interfață | enum | da |
| Priză de pământ: nouă/existentă, bară de egalizare, echipotențiale | enum | da |
| Paratrăsnet/protecție la trăsnet (există/nu) | enum | nu |

**Calcule automate (validări)**

- kWp DC = Σ panouri × Wp. Raport DC/AC.
- **Voc maxim la temperatura minimă locală** (Voc × nr. panouri în șir × (1 + coef. Voc × (Tmin − 25 °C))) comparat cu tensiunea maximă de intrare a invertorului. Avertizare dacă depășește.
- Isc total pe MPPT comparat cu curentul maxim de intrare.
- Verificare cantitate serii = nr. panouri.
- Puterea de evacuare în rețea (kW/kVA) comparată cu puterea aprobată și, dacă depășește, se cere calea B2/A.

**Secțiunea 4: Măsurători pe șir (înainte de conectarea la invertor)**

| Câmp | T | Unitate | Limită |
|---|---|---|---|
| Polaritate șir | enum | OK/NOK | OK |
| **Voc** per șir | measure | V | ±5% față de calculat [S, de verificat] |
| **Isc** (sau Imp) per șir | measure | A | ±10% față de așteptat [S, de verificat] |
| Iradianță, temperatură modul | num | W/m², °C | iradianță stabilă [S] |
| **Riso c.c.** (+ ↔ PE și − ↔ PE) | measure | MΩ | ≥1 MΩ [S, de verificat] |
| Continuitate PE cadre/structură | measure | Ω | conform proiect |
| Marcare șir, conectori verificați | bool | | |

(La mai multe șiruri, interfața trebuie să permită introducere pe rând, import din aparat de măsură sau CSV.)

**Secțiunea 5: Măsurători c.a. și priză**

| Câmp | T | Unitate |
|---|---|---|
| **Rezistență priză de pământ** | measure | Ω |
| Rezistență izolație circuite AC | measure | MΩ |
| Continuitate PE AC | measure | Ω |
| Zs buclă defect la punctul de racord al invertorului | measure | Ω |
| Test DDR | measure | mA/ms |
| Tensiuni de rețea la invertor (L-N, L-L) | measure | V |
| Aparat de măsură (model, serie, calibrare) | text/date | |

**Secțiunea 6: Punere în funcțiune (test funcțional)**

| Pas | T |
|---|---|
| Pornire invertor, fără alarme | bool |
| Putere c.a. la momentul testului, producție instantanee | num (kW) |
| Verificare funcții de protecție (conform setărilor din Secțiunea 3) | bool |
| Monitorizare conectată (aplicație/portal, cont client creat) | bool |
| Acces operator la setări: parolă de service păstrată de instalator/operator conform cerinței operatorului (vezi art. 14 alin. 3 Ord. 228/2018) | bool/text |
| Fotografie ecran de producție | photo |

**Secțiunea 7: Dosarul instalației de utilizare (bundle automat, art. 19)**

Checklist de existență a celor 4 documente, cu încărcare/generare:

1. PV recepție la terminarea lucrărilor (generat din Secțiunile 3-6, semnat de executant și beneficiar).
2. Buletin încercare priză de pământ (generat din Secțiunea 5, cu semnătura firmei atestate/electricianului).
3. Certificate de conformitate și fișe tehnice invertor/baterie (upload; platforma poate ține o bibliotecă pe model).
4. Schema monofilară cu protecții și reglaje (upload sau generare dintr-un editor simplu).

La nevoie și: buletin verificare protecții externe (firmă atestată).

**Secțiunea 8: Racordare (urmărire administrativă)**: statusuri cu termene: depunere cerere/notificare, completări cerute de operator (2 zile lucrătoare), ATR emis, plată tarife, contract racordare, cerere de punere sub tensiune pentru probe, notificare acord probe, contor montat, PV recepție punere în funcțiune depus, certificat de racordare primit (nr., dată), punere sub tensiune finală, cerere contract vânzare energie la furnizor.

**Secțiunea 9: Predare și semnături**: instruire client, dosar de predare (manuale, garanții, parole, scheme, inventar serii), semnătură beneficiar, fotografii finale.

**Secțiunea 10: Facturare/AFM**: tranșe de plată cu stări, declarație TVA (dacă e cazul), factură finală cu nr./data certificatului, serii panouri/invertor (QR pentru AFM), cerere decontare, listă beneficiari.

### 6.3 Documente ce pot fi generate de platformă (lista de livrat)

1. Fișă de vizită/audit (PDF).
2. Ofertă PV/electric (din catalog).
3. Contract de execuție cu eșalonare plăți.
4. Împuternicire pentru operator.
5. Cerere de racordare Anexa 1 / Notificare Anexa 2, 3, 5 / Anexa 4 (formulare operatori, completate din date).
6. PV recepție la terminarea lucrărilor.
7. Buletin de măsurători (priză, izolație, continuitate, DDR) electric și PV.
8. Raport de verificare PV (Voc/Isc/Riso/polaritate pe șir, inspecție).
9. Dosarul instalației (bundle art. 19).
10. Cerere de punere sub tensiune pentru probe.
11. PV recepție punere în funcțiune.
12. Dosar de predare către client (garanții, serii, instrucțiuni, mentenanță).
13. Factură cu text/QR AFM și export decontare (dacă modulul AFM e activ).
14. Raport de service/mentenanță cu checklist anual.

### 6.4 Observații de implementare

- **Offline-first** pentru aplicația de teren: acoperișurile și subsolurile au acoperire slabă. Seriile (zeci de panouri) se scanează în lot.
- **Serii unice** pe tenant, cu alertă dacă o serie apare pe două joburi.
- **Valori limită configurabile** (nu hardcodate), cu referință și dată a reglementării.
- **Autorizații persoane/firme** ca entități cu expirare și alerte (viza la 5 ani).
- **Legare între documente**: nr./data certificatului de racordare alimentează automat factura AFM și dosarul clientului.
- Condiționări: `off-grid` ascunde Secțiunea 8 și anexele de racordare. `hybrid` cere date baterie și contor pe stocare.
- Modul gaze: reutilizabil cadrul generic (checklist + măsurători + buletin + serii), dar reglementarea e separată (vezi nota din secțiunea 0).

---

## 7. Puncte incerte, de verificat înainte de implementare

1. **Tipuri de atestat actuale** (Ordin 45/2016 vs. Ordin 134/2021): citește textul actual pe anre.ro, pagina de atestare dădea 503 [?].
2. **Prag 10,8 kW (calea D)** și eventualele modificări din 2025-2026 ale Procedurii 19/2022 [?].
3. **Număr și text** ale procedurii ANRE pentru racordarea punctelor de încărcare EV (am găsit doar referințe indirecte, nu confirm „Ordin 103/2022") [?].
4. **TVA** PV rezidențial după 1 august 2025 (11%/21%) și regimul bateriilor on-grid [?].
5. **AFM 2026**: Casa Verde Fotovoltaice probabil nu are sesiune. Casa Verde Baterii și Electric Up trebuie confirmate pe afm.ro/energie.gov.ro [S/?]. Ghidul 2024 pe care l-am citit este un **proiect de consultare**, nu varianta finală.
6. **Valori limită de măsurători** (priză, izolație, Voc/Isc, DDR, periodicitate): vin din surse comerciale sau din IEC 62446-1 prin site-uri secundare. Verifică în I7/2011, SR HD 60364-6, SR HD 60364-7-712, IEC 62446-1 [?].
7. **Valorile tabelului 2P** (1,15 Un / 0,5 s etc.): citate din documentul DEER, nu din ordinul consolidat [V în DEER, ?-ordin].
8. **Autorizația de construire pentru PV pe acoperiș**: sursele de presă spun că montajul pe clădiri existente pentru autoconsum, fără modificarea structurii, este în general scutit (Legea 50/1991 modificată prin Legea 166/2023), dar nu am găsit un prag în kW și există mențiuni de notificare prealabilă [S/?]. Operatorii cer totuși, în Anexa 1, certificat de urbanism/plan de situație pentru loc nou.
9. **Garanția legală de 2 ani** și clauzele de garanție comerciale [?].
10. **Procedura exactă fiecărui operator** (formulare proprii, portaluri online de depunere): Anexele sunt unice la nivel național, dar fluxul digital diferă pe operator [S].
11. **Art. 35 din Ordin 66/2023** (limite de putere pentru IIB/IIIB/IVB): rezumatul meu este ambiguu, de recitit în text.
12. **Termenele de la art. 28-29 și 31-36** din Procedură (caz B1/B2): le-am citit parțial. Cele din tabelul 1.3 pentru B1 și A sunt din articolele citite integral (22, 23, 25, 27, 38, 39^2).

---

## 8. Surse (URL-uri)

**Primare/oficiale, citite integral sau în extrase mari**

- Procedura ANRE 19/2022 (prosumatori), copie Rețele Electrice, tipărită feb. 2024: https://www-prod.reteleelectrice.ro/wp-content/uploads/procedura-prosumatori-2022.pdf
- Ghidul prosumatorului, E-Distribuție (2023): https://www.distributie-energie.ro/wp-content/uploads/2023/12/Ghidul-prosumatorului.pdf
- Condiții tehnice pentru generatoare statice și sincrone, DEER (v8, 2022; citează Ord. 228/2018 mod. 132/2020 și tabelul 2P): https://www.distributie-energie.ro/wp-content/uploads/2022/05/CONDITII-TEHNICE-GENERATOARE-Versiune8.pdf
- Ordin ANRE 66/2023 (regulament autorizare electricieni, verificatori, experți): https://legeaz.net/monitorul-oficial-417-2023/ordin-anre-66-2023
- Ordin ANRE 45/2016 (regulament atestare operatori economici, versiune 2016): https://legeaz.net/monitorul-oficial-730-2016/ordin-anre-45-2016-regulament-atestare-proiectare-executare-verificare-instalatii-electrice
- Ghid AFM 2024 fotovoltaice (proiect de consultare): https://alba24.ro/wp-content/uploads/2024/08/GHID-FOTOVOLTAICE-consultare.pdf
- Ordin ANRE 15/2026 (MO 436/25.05.2026), rezumat operator: https://www.distributie-energie.ro/wp-content/uploads/2026/05/Ordin-ANRE-15_2026_s.docx
- Pagina ANRE cu legislația de racordare (listă ordine, linkul indicat de Ghidul E-Distribuție): https://www.anre.ro/ro/energie-electrica/legislatie/norme-tehnice/racordare-la-retele-de-interes-public
- Pagina ANRE de atestare (503 la accesare): https://www.anre.ro/ro/energie-electrica/informatii-de-interes-public/info-atestare
- Document reteleelectrice.ro care conține de fapt Ordin ANRE 179/2015 (gaze), util pentru cercetarea pe gaze: https://reteleelectrice.ro/content/dam/retele-electrice/Clientii-nostri/Documents/prosumatori/legislatie/Ordinul-ANRE-nr-19-2022.pdf

**Secundare (presă, ghiduri, firme)**

- Casa Verde Fotovoltaice 2026, ghid terț (actualizat 26.10.2026): https://folositor.ro/ghid/casa-verde-fotovoltaice-2026
- AFM 2026: Casa Verde Fotovoltaice dispare, rămân baterii (12.05.2026): https://www.mobilissimo.ro/stiri-diverse/casa-verde-fotovoltaice-dispare-din-bugetul-afm-2026
- TVA PV/baterii/pompe, infotva (12.05.2025): https://infotva.manager.ro/articole/infotva/cota-tva-ce-cote-tva-se-aplica-in-2025-panourilor-fotovoltaice-pompelor-de-caldura-si-acumulatorilor-24089.html
- Ofertă și flux instalator (avans 10%, 80%, 10%; garanții): https://www.genway.ro/sistemefotovoltaiceindustriale.pdf
- ANRE Ordin 53/2024 (conexiune producători, garanții, alocare): https://www.profit.ro/legal/inceputurile-unei-noi-ere-privind-racordarea-la-retea-21692405
- PRAM (conținut buletin, valori priză, periodicitate): https://brig.ro/serviciu/masuratori-pram și https://spotmedia.ro/stiri/economie/despre-verificarea-pram-ce-este-si-cat-costa
- IEC 62446-1 (publicația oficială; secvența de teste prin secundare): https://webstore.iec.ch/publication/24057 și https://www.anernstore.com/blogs/diy-solar-guides/iec-62446-1-commissioning-test-records
- PV fără autorizație de construire (presă): https://www.capital.ro/poti-monta-panouri-solare-fara-autorizatie-ce-prevede-legea-si-care-sunt-riscurile-daca-ocolesti-procedura.html
- Electric Up (articol de context): https://startupcafe.ro/ghid-fonduri-firme-electric-panouri-solare-charger-masini-electrice-htm-14635
