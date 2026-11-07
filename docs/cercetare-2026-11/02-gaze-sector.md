# Sectorul lucrărilor de gaze naturale din România: fluxuri, documente, autorizări, cerințe pentru ElectroField

Data cercetării: 2026-11-07. Raport doar de cercetare; nu s-a modificat nimic în repo.

## 0. Cum să citești raportul

Etichete folosite:

- **[CERT]** = verificat direct în textul oficial (PDF/consolidare) pe care l-am deschis și citit.
- **[PROBABIL]** = rezultă din surse secundare coerente între ele (presă, site-uri de firme) sau din text oficial vechi care foarte probabil a fost preluat.
- **[INCERT]** = nu am putut confirma; trebuie verificat cu clientul, cu distribuitorul sau cu un jurist/ANRE.

Limite importante ale cercetării:

- Site-urile `anre.ro` și `legislatie.just.ro` au dat 502/503/403 în acest mediu. Textele oficiale le-am citit prin copii de pe site-uri terțe (axpo.com, gazest.ro, megaconstruct.ro, ppcenergy.ro, legeaz.net). Sunt versiuni consolidate la o dată anume (menționată la fiecare).
- **Cadrul de autorizare s-a schimbat chiar acum.** ANRE a anunțat la 29 mai 2026 un regulament nou de autorizare a operatorilor economici din gaze, care abrogă și înlocuiește Ordinul 132/2021. Nu am găsit numărul, data de publicare în M.Of. sau data intrării în vigoare. Orice cifră despre cerințe de personal trebuie confirmată pe textul în vigoare.
- Nu există (în ce am găsit) un standard de date sau API public pentru depunerea documentelor la distribuitori. Fiecare operator de distribuție (OD) are propriile canale electronice.

---

## 1. Tipuri de lucrări și regimul lor juridic

Esențial: **sectorul se împarte în trei „lumi" cu reguli, autorizări și documente diferite.**

| Lucrare | Cine o execută / cine decide | Regim | Documente-cheie |
|---|---|---|---|
| **Racord / branșament / instalație de racordare** (de la rețeaua de distribuție până la robinetul de branșament/contor, inclusiv firida și regulator) | OD stabilește soluția. Execuția o face un operator economic (OE) desemnat de OD (în regim concurențial, în 60 de zile de la semnarea contractului de racordare) sau selectat de client dacă acesta finanțează. Echipamentele de reglare/măsurare, inclusiv firida, se achiziționează și se montează de OD. | Regulament racordare (Ord. ANRE 18/2021, forma sintetică 29.06.2021) + NTPEE 89/2018 | ATR, contract de racordare, contract de prestări cu clauzele din Ord. ANRE 96/2018, proiect, autorizații/avize, PV lucrări ascunse, buletine sudură/izolație, PV recepție, PV PIF, carte tehnică predată OD |
| **Extindere rețea de distribuție** ("obiectiv/conductă necesară racordării") | Idem: OD finanțează sau solicitantul finanțează cu rambursare în 5 ani. Peste 2.500 m finanțați de non-casnici: intră în patrimoniul OD la PIF. | Idem | Idem + fișă tehnică conductă, certificate calitate țevi, buletine CND sudori, protecție catodică, PV recepție semnat cu OD, carte tehnică a construcției |
| **Instalație interioară/de utilizare nouă** (după contor, p ≤ 10 bar) | Proiectant (PDIB sau PT) + verificator de proiecte Ig + executant (EDIB sau ET) cu responsabil tehnic cu execuția (RTE) | **Ord. ANRE 156/2020** (procedura proiectare-execuție-recepție-PIF) + NTPEE | Vezi secțiunea 3 |
| **Modificare/extindere instalație de utilizare existentă** | Același lanț; variante simplificate dacă debitul rămâne în limita ATR/regulatorului | Ord. 156/2020, art. 17-20 | Proiect (doar zona afectată), PV recepție, cerere PIF |
| **Punere în funcțiune (PIF)** | OD (sau producător/OTS) împreună cu executantul și beneficiarul | Ord. 156/2020, art. 23-27 | Cerere programare, PV PIF |
| **Verificare tehnică periodică (VTP) la 2 ani / revizie tehnică (RTP) la 10 ani** | OE autorizat EDIB (sau ET pentru 6-10 bar), ales de clientul final | **Ord. ANRE 179/2015** (mod. Ord. 71/2020, Ord. 96/2023) | Fișă de evidență (Anexa 4 = verificare, Anexa 5 = revizie), registru electronic anual |
| **Reparații / remedieri defecte** | OE (același sau altul), pe contract de prestări | Ord. 179/2015, art. 10 | Contract, fișă de evidență; probe de presiune dacă s-a intervenit pe instalație |
| **Intervenții urgente / scăpări de gaze** | Sesizarea merge la OD (Tel Verde); OE care constată scăpări trebuie să anunțe imediat OD și să menționeze în fișă motivele întreruperii | Ord. 179/2015, art. 10 alin. (2), art. 11 alin. (5)-(6) | Fișă de evidență cu motivul întreruperii; notificare OD |
| **Racordare/înlocuire racord flexibil la aparate** | OE sau persoană fizică autorizată **RPFA** (aparate ≤ 3 m³/h) | Ord. 156/2020, art. 4 alin. (4) | PV conform anexei 10 din regulamentul de autorizare (3 exemplare, [PROBABIL]) |
| **Centrale termice (aparatul în sine)** | Instalarea aparatului ține de instalator/OE; **autorizarea și verificarea periodică a aparatelor** ține de ISCIR (OE autorizați ISCIR). Instalația de gaze de la robinet la aparat rămâne ANRE. | Ord. 179 cere clientului să prezinte dovada VTP a aparatelor făcută de operatori autorizați ISCIR | Declarație conformitate montaj, certificat garanție, manual, VTP ISCIR |
| **Alimentare GPL, biogaz, GNL/GNC** | Alte regimuri | Ord. 156/2020 art. 3 exclude GPL și biogaz | Nu intră în perimetrul recomandat inițial |

### Praguri de presiune care contează în software
- p ≤ 6 bar (joasă, redusă, medie): proiectare **PDIB**, execuție **EDIB** [CERT, Ord. 156/2020 art. 7 și 13].
- 6 bar < p ≤ 10 bar (înaltă): proiectare **PT**, execuție **ET** [CERT].
- p > 10 bar: în afara procedurilor 156/2020 și 179/2015 [CERT].

### Ce e incert la centrale termice (ISCIR)
- Surse de presă/comerciale spun: VTP la 2 ani, autorizație ISCIR valabilă 2 ani, prescripția PT A1-2010 pentru aparate până la 400 kW. **Nu am găsit textul ISCIR și nu am putut confirma pragurile de putere.** [INCERT]
- Concluzie de produs: tratați ISCIR ca **document extern atașat** (număr, dată, emitent, expirare), nu ca flux nativ.

---

## 2. Cadrul legal și autorizări

### 2.1 Actele-cheie (în ordinea importanței pentru produs)

| Act | Rol | Observație |
|---|---|---|
| Legea 123/2012 (energie electrică și gaze) | Baza; contravenții; cartea tehnică | [CERT] citat în toate procedurile |
| **Ord. ANRE 156/2020** | Proiectare → PIF instalații de utilizare; **modelele-cadru ale PV** (anexe 3-7) | [CERT] text citit, formă la 14.12.2025 |
| **Ord. ANRE 89/2018 (NTPEE)**, mod. prin Ord. 2/2023 și altele | Norme tehnice; **presiuni și durate de probă**; condiții de siguranță | [CERT] formă sintetică 13.02.2023. Pot exista modificări ulterioare. [INCERT] |
| **Ord. ANRE 179/2015** mod. 71/2020, 96/2023 | VTP/RTP; fișe de evidență | [CERT] text citit (formă 03.06.2020) + Ord. 96/2023 din M.Of. 1002/3.XI.2023 |
| Ord. ANRE 18/2021 (racordare) | Racordare la SD | [CERT] formă 29.06.2021. Poate fi modificat ulterior; presa menționează și Ord. 9/2022 pentru tarife. [INCERT] |
| Ord. ANRE 96/2018 | Clauze obligatorii în contractele pentru lucrări de racordare | [CERT] doar ca trimitere din Ord. 18/2021 |
| **Ord. ANRE 132/2021** (regulament autorizare OE) | Tipuri de autorizații, personal minim | **Abrogat și înlocuit** de regulamentul din mai 2026 (număr necunoscut) [PROBABIL] |
| Ord. ANRE 83/2014 | Autorizare persoane fizice (instalatori) | Textul nu indică abrogare. Mai există poate un act mai nou. [INCERT] |
| HG 925/1995, Ord. MDRAP 1895/2016 | Responsabil tehnic cu execuția, verificatori | Citate în NTPEE art. 285 [CERT] |
| HG 668/2017 | Declarație de performanță/conformitate pentru detectoare | Detectorul fără declarație **nu se montează** (Ord. 156 art. 26 alin. 5) [CERT] |

### 2.2 Cine trebuie să fie pe lucrare și ce autorizare are

| Rol | Cerință | Sursă / certitudine |
|---|---|---|
| **Executant (firma)** | Autorizație ANRE **EDIB** (≤ 6 bar) sau **ET** (6-10 bar), **valabilă la momentul PIF**. Altfel OD **refuză** PIF (art. 40, art. 25 alin. 3 lit. b pct. iv). | [CERT] Ord. 156/2020 |
| **Instalator autorizat ANRE** (persoană fizică) | Legitimație nominală, tip **EGIU** (execuție utilizare) / **EGT**; semnează PV; numele, nr. legitimație, tip și data expirării apar în PV | [CERT] formulare; tipuri din Ord. 83/2014 [PROBABIL] |
| **Responsabil tehnic cu execuția (RTE)** | Angajat al executantului; studii superioare inginerești; legitimație EGIU/EGT; **minimum 3 ani experiență în gaze**; coordonează execuția, **semnează planșele desenate și toate PV aferente execuției** | [CERT] art. 15 |
| **Incompatibilitate** | Instalatorul care a întocmit proiectul sau verificatorul Ig **nu poate fi RTE** pe aceeași lucrare. Regulamentul din 2026 adaugă: RTE nu poate semna documentele pentru lucrări la care a fost instalator/sudor. | [CERT] art. 38; [PROBABIL] noua regulă (presă) |
| **Proiectant (firma)** | PDIB (≤ 6 bar) / PT (6-10 bar) + instalator PGIU | [CERT] |
| **Verificator de proiecte** | Atestat **Ig** de ministerul de resort; emite **referat de verificare**; tariful e inclus în contractul de proiectare; beneficiarul poate alege altul | [CERT] art. 11-12 |
| **Sudor autorizat oțel / polietilenă** | Autorizație + **număr poanson** + valabilitate, în PV lucrări ascunse și recepție (când există conducte îngropate/PE) | [CERT] anexele 3-4 |
| **Specialiști invitați** de beneficiar (instalatori autorizați) | Pot semna în PV lucrări ascunse/recepție | [CERT] |
| **Verificator la VTP/RTP** | Nu e rol separat: **instalatorul autorizat din cadrul OE EDIB/ET** face verificarea și semnează fișa, împreună cu reprezentantul legal/împuternicitul OE și clientul | [CERT] Ord. 179 anexele 4-5 |

Observație: „verificator" în limbajul clientului poate însemna (a) verificator de proiecte Ig, (b) instalatorul care face VTP/RTP, (c) verificatorul ISCIR pentru aparate. **Trei persoane/regimuri diferite.** Clarificați cu clientul.

### 2.3 Cerințe pentru firmă (ce trebuie să poată dovedi)

**Regulamentul 2026 (surse de presă, număr/dată necunoscute) [PROBABIL]:**
- Minimum **3 instalatori autorizați** pentru EPI, ET, EDSB, **EDIB**, EGNL, EGNLT, EIH (de la 2).
- EDIB: minimum **1 sudor oțel + 1 sudor polietilenă** (ambele procedee).
- Dovada personalului **din REGES** (per salariat), la depunerea cererii.
- Fără subcontractarea îmbinărilor nedemontabile către terți.
- Dreptul de proprietate/folosință asupra aparatelor de sudură PE cu **verificare tehnică periodică valabilă**.
- Instalatorii dau declarații scrise că autorizația lor se folosește pentru acel operator.
- Antreprenor general: poate subcontracta doar către OE autorizați ANRE, cu acordul beneficiarului; coordonare de angajat propriu instalator; răspunde solidar; **documentele de verificare/revizie se emit în numele antreprenorului general**.
- Tranziție: 3 luni (față de 6) de la intrarea în vigoare pentru titularii 132/2021.

**Regulamentul vechi Ord. 98/2015 (abrogat din 2022) [CERT ca text, dar istoric]:**
- EDIB: 4 instalatori EGIU + coordonator cu 3 ani; ISO 9001; declarație CND.
- Autorizația: **5 ani**, prelungire cerută cu 90-30 zile înainte.
- Garanție ≥ **2 ani** pentru lucrările executate.
- **Registrele de evidență a lucrărilor se păstrează ≥ 10 ani.**
- Modificări care afectează condițiile se notifică ANRE în 7 zile lucrătoare; lipsa personalului minim → cerere de suspendare în 7 zile lucrătoare.
- Nu am putut confirma ce se păstrează din acestea în 132/2021 și în regulamentul 2026. [INCERT]

**Legitimația instalatorului (Ord. 83/2014, text citit) [CERT ca text, stare actuală INCERT]:**
- Valabilă **5 ani**, nominală, netransmisibilă; prelungire cerută ≥ 30 zile înainte; două cursuri de ≥ 20 h (unul în fiecare jumătate a valabilității).
- Instalatorul poate pune legitimația la dispoziția **unui singur** operator (declarație pe propria răspundere).
- Folosește ștampilă 30x50 mm.
- Suspendare max. 6 luni; a treia suspendare în 5 ani = retragere definitivă.

**Implicații directe pentru platformă:** un registru de **autorizații și legitimații cu data expirării** (firmă + fiecare instalator + RTE + sudori + aparate de sudură + manometre) și **blocarea alocării** unei persoane pe o lucrare dacă legitimația e expirată/suspendată. Acesta este punctul cu cel mai mare risc real: un PV semnat cu legitimație expirată → refuz PIF (art. 25 alin. 3 lit. b pct. iv și art. 40).

---

## 3. Documentele unei lucrări, cap-coadă, în ordine

Flux pentru **instalație nouă de utilizare** (cazul comun al clientului). Textele sunt din Ord. 156/2020 (forma 14.12.2025), dacă nu e indicat altfel.

### Pas 0. Racordarea (de obicei prin beneficiar sau mandatar, uneori de firmă ca mandatar)
- **Cerere de racordare** către OD (model anexa 1 Ord. 18/2021) cu: act proprietate/folosință, act identitate sau certificat ONRC, mandat. Pentru dezvoltatori: debit/presiune, certificat de urbanism, plan de situație, PUZ/PUD. [CERT]
- OD verifică în 5 zile lucrătoare; emite **ATR** în 30 zile de la cerere corectă și completă (pentru casnici etc.). ATR se întocmește conform anexei 2 și e însoțit de oferta de contract de racordare și schiță. [CERT]
- Beneficiarul returnează contractul de racordare semnat în 10 zile. [CERT]
- **Termen critic:** instalația de utilizare trebuie pusă în funcțiune în **maximum 180 zile** de la PIF-ul instalației de racordare (OD informează solicitantul). [CERT art. 11 alin. 5]
- Notă: pentru separarea dintr-o instalație comună, OD poate emite doar o notificare (nu ATR nou), în 15 zile, cu lungime/diametru/capacitate racord, punct de delimitare, tip contor, presiune aval. [CERT]

### Pas 1. Ofertă / deviz (pre-contractual)
- Nu există model oficial pentru ofertă. **Obligatoriu însă:** executantul informează beneficiarul **înainte de contract** despre tarifele de PIF ale OD (art. 29 alin. 1), iar dacă plătește el tariful la OD, îl evidențiază distinct în contract (art. 29 alin. 2). [CERT]
- Câmpuri utile (practică): beneficiar, adresă loc consum, lista aparate cu debit nominal, traseu/lungime/diametre/material, detectoare/electroventil, materiale, manoperă, tarif PIF OD (linie separată), tarif verificare proiect (inclus în proiectare), garanție ≥ 2 ani, termen.

### Pas 2. Contract de proiectare (+ verificare proiect) — Anexa 1 Ord. 156
Elemente minime obligatorii [CERT]: date solicitant (PJ: denumire, nr. registru comerț, CUI, atribut fiscal, reprezentant, bancă, IBAN, adresă, contact; PF: nume, CI serie/număr, eliberat de/la data, **CNP**, IBAN), tip autorizație proiectant, adresă loc consum și de corespondență, obiect, durată, tarif cu defalcare (proiectare / verificare / alte avize), plată, lucrare finalizată la predarea proiectului verificat, obligațiile proiectantului (2 exemplare + referat de verificare) și ale beneficiarului (copie ATR, acorduri instalație comună, documente aparate sau declarație pe proprie răspundere, declarația de performanță a detectorului), clauze (modificare, litigii, denunțare, nr. exemplare, intrare în vigoare).

Proiectantul, la semnare, **notifică în scris** beneficiarul despre condițiile tehnice de siguranță din art. 128 alin. 1 NTPEE (art. 9 alin. 2). [CERT]

### Pas 3. Proiect tehnic + referat verificator Ig
- Proiect în 3 exemplare (1 proiectant, 2 beneficiar); 2 exemplare merg la executant. Dacă proiectant = executant, un exemplar mai puțin. [CERT]
- **Schemă izometrică** (necesară mai târziu la OD). [CERT]
- Diferențe față de proiect în execuție → **dispoziție de șantier** de la proiectant (art. 37). [CERT]

### Pas 4. Contract de execuție, recepție tehnică și PIF — Anexa 2 Ord. 156
Elemente minime [CERT, analog anexei 1]: părți, tip autorizație executant, obiect (execuție + recepție + PIF), durată, tarif (inclusiv tariful PIF OD), obligații executant/beneficiar (inclusiv obligația beneficiarului de a transmite contractul de furnizare pentru loc de consum dacă PIF e cu montare contor), clauze finale. **Garanție ≥ 2 ani sau până la prima modificare** (art. 39).

### Pas 5. În timpul execuției
- **PV lucrări ascunse** (Anexa 3, doar pentru tronsoane subterane). Câmpuri [CERT]:
  - nr./dată; proiect nr., proiectant, verificator; adresa imobilului
  - diametru (mm/inch) și lungime tronson îngropat
  - nr./dată certificat calitate/declarație conformitate material tubular
  - Oțel: sudură/izolație, buletin verificare izolație nr., răsuflători, grosime strat nisip (cm), adâncime pozare (m), tuburi de protecție, umplutură
  - PE: procedeu de sudare, tuburi protecție, strat nisip, adâncime, bandă avertizare și fir trasor
  - respectarea distanțelor de siguranță
  - **semnături**: instalator(i) cu legitimație nr./tip/valabilă până; RTE; sudor PE (autorizație, poanson, valabilitate); sudor oțel; specialiști invitați; beneficiar
- **Probele de rezistență și etanșeitate** (vezi 4.1).

### Pas 6. Recepție tehnică — **PV de recepție tehnică (Anexa 4)**
Câmpuri complete [CERT], bune pentru auto-generare:
1. ATR/notificare nr./dată, emis de (OD/OTS/producător)
2. Proiect nr., proiectant (tip autorizație), instalator proiectant (legitimație nr./tip)
3. Verificator proiect (nume, atestat nr.)
4. Executant (tip autorizație), **RTE** (nume, legitimație nr./tip)
5. **Materiale**: (a) material tubular: tip, lungime totală, metri pe diametru, subteran/suprateran, cumpărat de la furnizor, certificat calitate/declarație conformitate nr./dată; (b) fitinguri (tip, număr, diametre, furnizor, certificate); (c) armături de închidere (tip, material, număr, diametre, furnizor, certificate); (d) **detector automat de gaze** (cine l-a cumpărat, furnizor, declarație de performanță/conformitate nr./dată)
6. **Puncte de consum**: pentru fiecare aparat: tip, debit instalat (conform producătorului), furnizor, certificat/declarația beneficiarului
7. **Probe de presiune cu aer** efectuate de (nume, legitimație ANRE, tip): subteran și suprateran separat: rezistență la X bar timp de Y ore; etanșeitate la X bar timp de Y ore; rezultat admis/respins
8. Protecție anticorozivă oțel suprateran (grunduire + vopsire)
9. Conducte PE: procedeu, sudor (nume, nr. autorizație, emitent, poanson), aparat de sudură (tip, serie, număr, **fișa de verificare tehnică anexată**), protocoale de sudură nr./dată
10. PV lucrări ascunse nr./dată
11. Concluzie: admisă/respinsă recepția
12. Nr. exemplare; semnături RTE, sudori, specialiști invitați; beneficiarul declară că a luat cunoștință de: obligația condițiilor de siguranță (art. 128), înlocuirea racordului flexibil la expirarea duratei normate, înlocuirea detectorului, modificări doar prin OE autorizat

### Pas 7. Cererea de programare PIF (Anexa 5) — termen: **3 zile lucrătoare de la PV recepție**
- Câmpuri: nr. înregistrare OE și OD; OD destinatar; reprezentant legal OE + date firmă; adresa imobilului; beneficiar; proiect nr./dată, verificator, atestat; PV recepție nr./dată.
- Anexe (copii conforme cu originalul): PV recepție (+ PV lucrări ascunse); **schema izometrică (doar la OD)**; document de la furnizorul de gaze care atestă contract de furnizare (doar dacă se montează contor); **dovada plății tarifului de PIF**. [CERT]
- Transmitere pe e-mail/canale electronice ale OD; OD dă număr de înregistrare în 2 zile lucrătoare; cererea e „completă" doar când sunt depuse toate documentele **și** plata e înregistrată contabil la OD. **OD este obligat să accepte înscrisuri semnate electronic** (art. 24 alin. 5). [CERT]

### Pas 8. Punerea în funcțiune
- Termene OD, de la cerere completă [CERT art. 25]:
  - cu montare contor: **5 zile lucrătoare** (< 250 m³/h) sau 10 zile lucrătoare (> 250 m³/h)
  - contor existent: 5 zile lucrătoare
  - OTS/producător: 10 zile lucrătoare
- **Motive de refuz** (comunicate în 2 zile lucrătoare; tariful **nu** se returnează): tarif neplătit; depășirea debitului din ATR sau a celui măsurat; PV completate necorespunzător; proiectare/execuție de firme neautorizate sau cu alt tip de autorizație decât PDIB/PT/EDIB/ET; lipsa documentului de furnizare. [CERT]
- Operațiile OD la PIF (cu montare contor): montare contor, verificare etanșeitate la racorduri olandeze/flanșe, sigilare, verificare dopuri la ramificații fără aparate, verificare existența ≥ 1 aparat cuplat, predare **Instrucțiuni de utilizare**. [CERT]
- Operațiile **executantului** la PIF: refulare aer; verificare etanșeitate la presiunea gazului din conductă pentru îmbinările la care nu s-au făcut probe de rezistență; **funcționare aparate la debit maxim și minim**; verificare documente curățare/verificare coșuri; verificare evacuare gaze de ardere; montare dopuri; **instruirea beneficiarului**. [CERT art. 26 alin. 4]
- **Aparat necuplat** = bușonare cu dopuri de executant; ulterior beneficiarul cere întâi executantului cuplarea, apoi OD repunerea în funcțiune fără contor. [CERT art. 41]
- **PV de punere în funcțiune (Anexa 6)**, întocmit **de OD împreună cu executantul și beneficiarul**, la adresa locului de consum (cu contor) sau la sediul OD (fără contor). Conținut [CERT]:
  - Partea I (OD): reprezentant (nume, legitimație nr./tip), **contor: tip, debit nominal m³/h, marcă, serie, index inițial (m³)**, operațiile de mai sus, semnătura OD + beneficiar
  - Partea II (executant): operațiile de PIF, **aparatele puse în funcțiune** (tip, debit instalat, furnizor, certificat/declarație), bifă per aparat (cuplat = robinete închise / necuplat = bușonat), semnătura **RTE** + beneficiar
  - Nr. exemplare; fiecare semnatar reține unul
- Originalele documentelor din art. 24 se predau OD la PIF.

### Pas 9. Predare și dosar
- **Instrucțiuni pentru utilizarea gazelor naturale** (Anexa 7), predate de OD la PIF și de executant la recepție (art. 19 alin. 2 lit. b pentru modificări). Textul-cadru e fix (2 ani/10 ani, ventilare, aprindere, interdicții, ce faci la miros de gaz). [CERT]
- Executantul predă **gratuit un exemplar din proiect cu toate anexele** (art. 29 alin. 3). Executantul anexează la proiect copiile PV lucrări ascunse, recepție și PIF; 1 exemplar la executant, 1 la beneficiar (art. 16). [CERT]
- **Cartea tehnică a instalației** (deținută de clientul final): toate documentele de la ATR/notificare până la PIF + fișele de evidență VTP/RTP de-a lungul vieții instalației; clientul **trebuie să o țină la zi** (art. 28). [CERT]
- Garanția: **≥ 2 ani** sau până la prima modificare (art. 39). [CERT]

### Pas 10. Facturare
- Nu are model sectorial. Practic: factură cu linii separate pentru manoperă, materiale, **tarif PIF OD** (dacă îl plătește executantul, evidențiat distinct în contract). Legătura cu stocul de materiale și lotul/certificatul e un punct forte al platformei. [PROBABIL / practică]

### Pas 11. Documente periodice după PIF (VTP / RTP) — Ord. 179/2015
Fluxul [CERT]:
1. Furnizorul de gaze notifică clientul (anexat facturii) **cu min. 60 zile înainte** de scadență. OD dă furnizorului datele cu 90 zile înainte (data ultimei verificări/revizii, scadența, nr./tip/debit aparate).
2. Clientul contractează un OE EDIB/ET (**contract de prestări**, anexa 2 Ord. 179) și îi pune la dispoziție documentația tehnică, dovada curățării coșurilor (**≤ 6 luni** înainte) și a VTP ISCIR pentru aparate.
3. OE face operațiile din tabelul 3 (obligatorii; ce nu se face se justifică individual), completează **Fișa de evidență**, o semnează cu clientul.
4. OE **înregistrează fișa la OD în max. 5 zile lucrătoare de la întocmire, dar nu după scadență**; trimite clientului un exemplar în max. 2 zile lucrătoare de la înregistrare. 3 exemplare: OD, OE, client.
5. OE ține **registru electronic anual** (Anexa 6) cu toate VTP/RTP făcute.
6. OD actualizează baza de date în max. 30 zile de la înregistrare.

Termenul de răspuns al OE la cererea unui client: **5 zile lucrătoare**, altfel cererea se consideră declinată. [CERT art. 9 alin. 8]

---

## 4. Ce trebuie capturat pe teren (aplicația tehnicianului)

### 4.1 Probe de presiune: parametri (NTPEE 89/2018, forma 13.02.2023) [CERT]

Mediu: **aer comprimat** (instalații de utilizare); apă doar la stații de reglare. Presiunile de probă (Tabelul 8):

| Instalație de utilizare | Presiune probă rezistență | Presiune probă etanșeitate |
|---|---|---|
| Subterană, înaltă | 15 bar | 10 bar |
| Subterană, medie | 9 bar | 6 bar |
| Subterană, redusă | 4 bar | 2 bar |
| Subterană, joasă | 2 bar | 1 bar |
| Supraterană, înaltă | 15 bar | 10 bar |
| Supraterană, medie | 9 bar | 6 bar |
| Supraterană, redusă | 4 bar | 2 bar |
| Supraterană, joasă | **1 bar** | **0,2 bar** (cu manevrarea armăturilor) |
| PE 80 (nota *) | 6 bar | 4 bar |

Timpi:
- **Rezistență: 1 oră** (art. 273 alin. 1).
- **Etanșeitate: depinde de volumul instalației** (Tabel 8¹, introdus de Ord. 2/2023): 0,1 m³ = 1 h; 0,2 = 2 h; 0,3 = 2 h; 0,5 = 3 h; 1,0 = 6 h; 2,0 = 12 h; 3,0 = 18 h; ≥ 4,0 = 24 h. Atenție: formularele-cadru din Ord. 179 (Anexa 5, tabel 4) încă arată „1 h / 24 h" (formă anterioară). **Nu codați 24 h fix.** Pentru volume sub 0,1 m³ (tipic apartament/casă) tabelul nu are rând; interpretarea (1 h?) trebuie confirmată. [INCERT]
- **Egalizarea temperaturii** înainte de probă (Tabel 9): depinde de volum, subteran/suprateran, OL/PE; ex. suprateran OL 0,1 m³ = 9 min; 1 m³ = 50 min. Se aplică înainte de verificări și probe (art. 275-276).
- **Nu se admit pierderi de presiune** (art. 278). Probele se fac după răcirea ultimei suduri PE (art. 271).
- Interzis: remedieri în timpul probelor (art. 280, formulat pentru conducte și racorduri); **verificare cu flacără interzisă** (art. 283¹).
- Aparate: manometre/termometre cu **verificare metrologică în termen**, clasă ≥ 1,5, aparate de control în paralel (art. 274 alin. 1-3). Pentru instalații de utilizare **nu** se cere înregistrare continuă (alin. 6, introdus 2023). [CERT]
- Derivații supraterane ≤ 4 m la instalații în funcțiune: doar spumă de săpun la presiunea gazului (art. 282). Porțiunile înlocuite/modificate se probează (art. 283).
- Atenție: Ord. 179 anexa 5 spune că la revizie proba de **rezistență** se face doar pe partea modificată, iar **etanșeitatea pe toată instalația**. [CERT]

**Pentru model de date:** pentru fiecare probă: tip (rezistență/etanșeitate), regim presiune, amplasare (subteran/suprateran), material (OL/PE), volum calculat (m³) sau lungimi+diametre, presiune de probă (bar), durată (h/min), presiune început/sfârșit, temperatură ambient/aer, timp de egalizare, manometru (serie, data verificării metrologice, clasă), rezultat admis/respins, executant (instalator, legitimație), martori (beneficiar), foto manometru la început și sfârșit, oră+GPS. **Valorile din PV oficial sunt doar presiune, timp, rezultat; restul sunt recomandarea noastră de trasabilitate** (nu sunt cerute de model).

### 4.2 Date de captat la PIF, recepție, VTP/RTP

| Categorie | Câmpuri |
|---|---|
| Loc de consum | adresă completă (stradă, nr., bloc, scară, apartament, localitate, județ, cod poștal), **cod loc de consum** (din factură/OD), nr. ATR/dată, regim de presiune |
| Aparate | tip, producător/model, **serie**, **debit nominal m³/h** (declarat de producător), putere kW (centrale), an fabricație, certificat conformitate/calitate, garanție, cuplat/necuplat, tip evacuare (coș/tubulatură/ventuză) |
| Contor/regulator | tip, marcă, **serie**, debit nominal, **index inițial**, sigiliu (nr., la racorduri olandeze/flanșe) — **montate și completate de OD** în PV PIF; tehnicianul nu le poate introduce în locul OD, doar le poate transcrie/atașa foto |
| Armături | tip, diametru, material, nr., furnizor, certificat/lot; robinete (incendiu, contor, secționare, închidere, siguranță înainte de racord flexibil) |
| Materiale țeavă/fitinguri | material, lungime pe diametru, certificat calitate/declarație conformitate nr./dată, furnizor, lot |
| Racord flexibil | producător, **data fabricației/expirării** (durata normată), lungime, cine l-a montat (RPFA/OE) |
| Detector gaze + electroventil | producător/model, **serie**, **declarație de performanță/conformitate nr./dată**, data montării, termen de valabilitate (durata normată), poziția electroventilului (robinet de incendiu/închidere), sensibilitate ≥ 2 % CH₄ în aer (cerință Ord. 179 art. 8) |
| Evacuare gaze arse | dovada curățării/verificării coșului (nr./dată/emitent, la PIF ≤ 30 zile conform NTPEE art. 295; la VTP/RTP ≤ 6 luni conform Ord. 179), verificare tiraj/evacuare, funcționare simultană pentru aparate pe același coș (art. 294) |
| Ventilare/siguranță | volum încăpere (min. 18 m³ general / 7,5 m³ baie-bucătărie), aer de ardere, ventilare, evacuare totală, suprafețe vitrate (cedare ≥ 1180 Pa) (NTPEE art. 128) |
| Suduri (dacă e cazul) | sudor (autorizație, poanson), procedeu, aparat sudură (tip, serie, verificare tehnică), protocoale de sudură |
| Persoane | beneficiar (nume, CI), instalator + legitimație (tip, nr., valabilă până la), RTE, sudor, reprezentant OD |

### 4.3 Fotografii recomandate (nu sunt cerute de lege; sunt probă de diligență)

Din analiza documentelor, aceste fotografii susțin direct câmpurile PV/fișă:
1. Plăcuța aparatului (serie, debit, model) și plăcuța regulatorului/contorului (serie).
2. Traseul conductei **înainte de acoperire**: șanț, strat de nisip, adâncime, bandă/fir trasor, răsuflători (susține PV lucrări ascunse).
3. Manometrul la începutul și sfârșitul probei, cu eticheta/certificatul de verificare vizibil.
4. Armături și dopuri montate (robinet de siguranță înainte de racord flexibil, bușonări).
5. Racordul flexibil (data de pe el) și detectorul + electroventilul (serie, declarație).
6. Evacuare gaze arse/coș și certificatul de curățare coș.
7. Contor cu sigilii și index (făcut de OD, dar tehnicianul poate fotografia).
8. Cartea de identitate/legitimația instalatorului nu trebuie stocată ca imagine dacă nu e necesar (minimizare GDPR, vezi 5.3).

### 4.4 Checklist-uri de siguranță (derivate din text; marcate unde sunt recomandări proprii)

**Înainte de lucru** (recomandare proprie, ancorată în norme):
- Legitimații valide; autorizația firmei valabilă la data lucrării; proiect verificat disponibil; ATR; RTE desemnat.
- Zonă ventilată; fără surse de aprindere; **interdicție verificare cu flacără** (art. 283¹); notificare OD dacă cuplarea la instalație existentă produce **întrerupere planificată** (notificare cu adresa și orele de început/sfârșit, art. 22).
- Verificarea manometrelor (valabilitate metrologică).

**La PIF** (obligatorii, art. 26 alin. 4 + anexa 6): refulare aer; etanșeitate îmbinări la presiunea gazului; funcționare aparate la debit max și min; coș; evacuare arse; dopuri; instruire beneficiar; predare instrucțiuni; **detector fără declarație = nu se montează**.

**La VTP** (Anexa 4 Ord. 179, tabel 3; 14 operațiuni obligatorii, fiecare cu Da/Nu/Nu este cazul + justificare): arzătoare și garnituri; stabilitatea conductelor; etanșeitate la presiunea de lucru cu spumă sau alt procedeu; aparate de măsură/reglare/siguranță; demontare aparate fără aprobare; echipament de reglare; răsuflători și cămine; documente coș (≤ 6 luni); construcții stații/posturi; VTP ISCIR aparate; instalație comună; **racord flexibil în termen**; **detector în termen**; existența instrucțiunilor de utilizare (dacă lipsesc, se predau gratuit).

**La RTP** (Anexa 5, 16 operațiuni): cele de mai sus + **proba de rezistență (doar partea modificată)** + **proba de etanșeitate (toată instalația)** cu rezultat în tabel dedicat + revizia instalației comune.

**Reguli de decizie pe care aplicația le poate impune** (toate [CERT]):
- Dacă se constată **scăpări** și remedierea nu e imediată sau nu o face același OE: **anunț imediat la OD (Tel Verde)**, fișă cu motivul întreruperii (art. 10 alin. 2).
- OE poate întrerupe total/parțial gazul (robinet incendiu/contor/secționare/închidere) dacă nu sunt condiții de siguranță sau lipsesc documentele de coș/ISCIR; motivul se scrie în fișă (art. 11).
- După remediere care impune probe: OE care a remediat face **toate operațiunile de revizie** și încheie fișa de revizie (art. 10 alin. 5).
- Montarea detectoarelor/electroventilelor la VTP/RTP **nu cere documentație de modificare**, doar mențiune în fișă (art. 10 alin. 6).

### 4.5 Scadențe și remindere

Reguli de calcul [CERT, Ord. 179 + 96/2023]:

| Eveniment | Scadență |
|---|---|
| VTP periodică | max. **2 ani** |
| RTP periodică | max. **10 ani** |
| RTP în același an cu VTP | **Revizia ține locul verificării** din acel an; următoarea VTP la max. 2 ani de la revizie (art. 32 alin. 1-2) |
| RTP ad-hoc (după > 6 luni de întrerupere, după eveniment, la cerere) | **Ține locul RTP periodice**; următoarea RTP la max. 10 ani de la acea revizie (art. 32 alin. 3-4) |
| Înregistrare fișă la OD | max. 5 zile lucrătoare de la întocmire și **nu după scadență** |
| Exemplar către client | max. 2 zile lucrătoare de la înregistrarea la OD |
| Răspuns OE la cerere client | 5 zile lucrătoare |
| Cerere PIF după PV recepție | 3 zile lucrătoare |
| PIF după instalația de racordare | max. 180 zile |
| Curățare coș pentru VTP/RTP | document ≤ 6 luni; la PIF ≤ 30 zile (NTPEE) |
| Racord flexibil, detector | la expirarea duratei normate (data din produs/manual producător) |
| Garanție lucrare | ≥ 2 ani sau până la prima modificare |
| Stare de urgență | prelungire legală specială în 2020 (art. 3¹), nu relevant acum |

Remindere propuse (ale noastre, nu legale): scadență VTP/RTP la 120/90/60/30/7 zile (furnizorul notifică la 60, OD îl informează la 90, deci firma poate fi **înaintea** lor comercial); expirare racord flexibil/detector; expirare legitimații instalatori (cerere prelungire ≥ 30 zile înainte, [PROBABIL]); expirare autorizație firmă (cerere ≥ 30 zile înainte în 132/2021 [PROBABIL]); expirare verificare manometre/aparate sudură; garanție 2 ani.

Modelare: **scadența aparține instalației (loc de consum), nu lucrării.** Folosiți data ultimei fișe de evidență înregistrate (nu data lucrării) și păstrați nr. fișă/nr. înregistrare OD.

---

## 5. Riscuri de conformitate pentru software

### 5.1 Păstrare (retenție)
| Ce | Perioadă | Certitudine |
|---|---|---|
| Documentația tehnică, cartea tehnică, instrucțiuni, fișe de evidență | **Pe toată durata de funcționare a instalației** (obligația clientului final) | [CERT] Ord. 179 art. 8 alin. 6; Ord. 156 art. 28 |
| ATR la OD | Pe durata funcționării racordului | [CERT] Ord. 18/2021 art. 26 alin. 7 |
| Registre de evidență ale OE (VTP/RTP) | „Anual" ca evidență [CERT]; **≥ 10 ani** în Ord. 98/2015 (istoric) | Ce se aplică acum: [INCERT] |
| Garanție | ≥ 2 ani | [CERT] |
| Documente contabile (facturi, contracte) | 5 ani în sursele recente (modificare prin Legea 36/2023), 10 ani pentru situații financiare; surse vechi spun 10 ani | [INCERT]. Verificare cu contabil |

Recomandare: **nu șterge niciodată automat** documente tehnice ale unei lucrări; setare de retenție per tip de document, implicit foarte lungă (ex. 10+ ani sau „viața instalației"), cu export complet („dosar instalație") la cerere/la încetarea contractului. Dacă clientul ElectroField încetează abonamentul, trebuie să poată exporta tot.

### 5.2 Semnături
- Formularele sunt **pe hârtie/semnătură olografă** în model (nume + semnătură pentru: instalator, RTE, reprezentant legal, beneficiar, OD).
- Singura deschidere explicită: **OD trebuie să accepte înscrisurile semnate electronic** la cererea de programare PIF (Ord. 156 art. 24 alin. 5). [CERT]
- Legea 214/2024 (în vigoare din 8.10.2024, abrogă Legea 455/2001) distinge semnătura **simplă, avansată, calificată**; avansată/calificată au valoare probatorie echivalentă cu olograful; semnătura simplă poate fi insuficientă. Există proiecte din 2026 de modificare/abrogare, nestatus. [PROBABIL/INCERT]
- Concluzie: semnătura „cu degetul pe ecran" = semnătură electronică **simplă**. Poate fi acceptată de unii OD, de alții nu. **Nu promiteți** valabilitate juridică/acceptare de către OD/ANRE. Oferiți: (a) captură + metadate (timp, dispozitiv, hash document, versiune șablon, identitate semnatar), (b) export PDF pentru semnare olografă/QES, (c) câmp „metodă semnare" per semnatar.
- Atenție la **cine** semnează: instalatorul și RTE semnează **personal** (legitimație nominală, ștampilă 30x50 mm per Ord. 83/2014 [PROBABIL]). Un admin nu poate „semna în numele" lui. Platforma trebuie să lege fiecare semnătură de un cont individual cu legitimație validă.
- PV PIF e co-semnat de **OD** (extern). Platforma nu poate face OD să semneze în aplicație; modelați-l ca „document încărcat scanat/foto + date transcrise".

### 5.3 GDPR și date personale
- Contractele-cadru cer **CNP, serie/număr CI, IBAN, telefon, e-mail, adresă** (Anexele 1-2 Ord. 156; Anexele 2-3 Ord. 179). Minimizare: colectați CNP/CI doar când formularul oficial îl cere; mascați în listele interne.
- Ord. 179 art. 5 alin. 5-6: furnizorul și OD sunt obligați la confidențialitate; informațiile despre VTP/RTP se comunică doar clientului sau OE contractat. Principiu similar de aplicat intern: acces pe bază de rol/echipă.
- ElectroField este, de regulă, **persoană împuternicită** (procesator) pentru firma-client (operator); necesar **acord de prelucrare (DPA)**, sub-procesatori (Supabase, hosting, SMS/e-mail), regiune UE pentru date. Detalii juridice: de confirmat cu jurist. [INCERT, cunoaștere generală, nu din sursele citite]
- **Fotografii din interiorul locuințelor** pot conține persoane, acte, adrese: politică de retenție, acces restricționat, fără EXIF/GPS în exporturi externe dacă nu e necesar, posibilitate de ștergere, bluring opțional.
- Drept la ștergere vs. obligații de păstrare: înregistrările tehnice au bază legală (obligație legală/interes legitim al firmei și al clientului final), dar datele de contact pot fi separate de dosarul tehnic.
- Transmiterea către OD (cerere PIF, fișă de evidență) = obligație legală; logați ce s-a trimis, când, către cine.

### 5.4 Alte riscuri de conformitate
- **Autorizații expirate/suspendate** = cel mai concret risc (vezi 2.3).
- **Modificări legislative în curs** (regulamentul 2026; posibile modificări NTPEE ulterioare 2023): șabloanele trebuie **versionate** cu data actului-sursă și nr. versiune; PV deja emise rămân pe versiunea lor.
- Aplicația **nu poate certifica** că „proba e admisă": rezultatul îl asumă instalatorul/RTE. Software-ul poate doar compara cu parametrii normei și semnala abateri.
- Sancțiuni: încălcarea procedurilor = contravenție conform Legii 123/2012 (art. 43 Ord. 156; art. 16 Ord. 179). Sumele din surse comerciale (ex. 1.500-10.000 lei, 2.000-4.000 lei) **nu au fost verificate**. [INCERT]
- Responsabilitatea pentru neefectuarea VTP/RTP revine clientului final (art. 31 Ord. 156; art. 3 alin. 6 Ord. 179 după 96/2023), dar firma are interes comercial în remindere.

---

## 6. Ce ar trebui să ofere platforma pentru verticala „gaze"

### 6.1 Șabloane de formular / documente (cu lista de câmpuri)

Legendă: **A** = auto-generabil din datele noastre (client, lucrare, echipă, stoc, probe); **M** = tehnicianul introduce pe teren; **E** = extern (OD/verificator/ISCIR), doar încărcat/transcris.

| # | Șablon | Bază | Câmpuri principale | Sursa datelor |
|---|---|---|---|---|
| 1 | **Fișă lucrare gaze (ordin de lucru)** | intern | tip lucrare (branșament/extindere/utilizare nouă/modificare/PIF/VTP/RTP/reparație/urgență/centrală), loc consum (adresă, cod loc consum), regim presiune, ATR nr./dată, proiect nr., echipă: RTE + instalatori (legitimație, valabilitate), autorizație firmă aplicabilă, termen | A + M |
| 2 | **Checklist pre-lucrare / siguranță** | recomandare + norme | autorizații în termen, manometre calibrate, proiect avizat prezent, zonă ventilată, fără flacără, notificare întrerupere OD, EPI, aparat detectare gaz | M |
| 3 | **Protocol probă presiune (rezistență + etanșeitate)** | NTPEE cap. XII | vezi 4.1: regim, amplasare, material, volum, presiune, durată, egalizare temp., manometru (serie/verificare), rezultat, executant, martor, foto | M + A (valori normă pre-completate, editabile) |
| 4 | **PV lucrări ascunse** (subteran) | Anexa 3 Ord. 156 | vezi Pas 5 | A + M |
| 5 | **PV recepție tehnică** | Anexa 4 Ord. 156 | vezi Pas 6; materiale din stoc cu lot/certificat | **A mult** (ATR, proiect, materiale din stoc, aparate, persoane, probe) |
| 6 | **Cerere programare PIF + pachet** | Anexa 5 Ord. 156 | date OE, OD, proiect, PV recepție; checklist anexe (PV, izometrică, doc. furnizor, dovadă plată) | A; trimitere = export/e-mail |
| 7 | **PV punere în funcțiune** | Anexa 6 Ord. 156 | partea executantului auto (operații, aparate, bifă cuplat/necuplat); partea OD (contor tip/serie/index) = **E** | A (partea II) + E (partea I) |
| 8 | **Instrucțiuni de utilizare** | Anexa 7 Ord. 156 | text fix; confirmare predare beneficiar | A |
| 9 | **Fișă de evidență VTP** | Anexa 4 Ord. 179 | nr. OD, OE+autorizație, client, adresă, cod loc consum, contract nr./dată, documentație tehnică (nr./an/„nu deține"), data ultimei VTP și scadența (din notificare), instalator (legitimație), aparate notificate vs. identificate (tip, debit), tabel 3 (14 operațiuni), defecte+remediere, condiții siguranță Da/Nu, documente coș/ISCIR per aparat, concluzii, semnături | A + M |
| 10 | **Fișă de evidență RTP** | Anexa 5 Ord. 179 | idem + PV demontare/montare contor + tabel probe (rezistență/etanșeitate: regim, material, subteran/suprateran, presiune, timp, admis/respins) + 16 operațiuni | A + M |
| 11 | **Registru anual electronic VTP/RTP** | Anexa 6 Ord. 179 | nr. crt., client, adresă, cod loc consum, contract, instalație individuală/comună, nr./dată fișă VTP, nr./dată fișă RTP, conformă Da/Nu | **A complet** (derivat) |
| 12 | **Contract prestări VTP/RTP/remediere/dezafectare** | Anexa 2 Ord. 179 | părți, autorizație tip/nr./valabilă până, obiect (bifă), durată, valoare, drepturi/obligații (inclusiv dreptul de întrerupere), clauze | A (merge pe datele CRM) |
| 13 | **Contract proiectare / contract execuție-recepție-PIF** | Anexe 1-2 Ord. 156 | vezi Pașii 2 și 4 | A |
| 14 | **Contract reconstituire documentație** | Anexa 3 Ord. 179 | releveu, schemă izometrică, memoriu tehnic (PDIB + PGIU) | A (doar dacă firma are PDIB) |
| 15 | **Dosar instalație / carte tehnică (pachet)** | art. 28 Ord. 156 | PDF unic cu toate documentele + indice; export ZIP | A |
| 16 | **Fișă intervenție urgentă / scăpări** | Ord. 179 art. 10-11 | locație, sesizare, constatări, motiv întrerupere, OD anunțat (oră, nr. Tel Verde/dispecerat), acțiuni, fișă de evidență asociată | M + A |
| 17 | **Fișă aparat/centrală termică** | PIF + ISCIR extern | tip, serie, debit, putere, garanție, declarație conformitate montaj, nr. autorizație ISCIR/VTP ISCIR (dată, emitent, expirare) | M + E |
| 18 | **Fișă branșament/extindere (lucrare pentru OD)** | NTPEE art. 286-287; Ord. 18/2021; Ord. 96/2018 | fișă tehnică conductă (anexa 12/13 NTPEE), certificate țevi, buletine sudură CND, buletin izolație, PV lucrări ascunse, proces verbal probe, PV recepție cu OD, carte tehnică | A + M + E; **mult mai complex, OD-driven** |
| 19 | **Registru autorizații & echipamente** | intern | firmă (tip, nr., valabil până), instalatori (tip, nr., valabil până, declarație exclusivitate), RTE, sudori (poanson), aparate sudură (verificare), manometre (verificare) | M + alerte |
| 20 | **Scadențar loc consum** | Ord. 179 | ultima VTP/RTP, scadențe, status notificare, status fișă înregistrată la OD | A |

### 6.2 Fluxul tehnicianului (propunere de ecrane)
1. **Alocare** → blocare dacă cineva din echipă are legitimație expirată/suspendată.
2. **Checklist pre-lucrare** + selecție instrumente (manometru cu verificare în termen).
3. **Date instalație**: aparate (serie/debit), traseu, material, volum calculat automat.
4. **Probă presiune** cu valori preumplute din norma curentă (editabile, cu avertisment la abatere), cronometru, foto manometru început/sfârșit.
5. **Materiale folosite** din stoc cu lot/certificat (alimentează PV recepție pct. 5).
6. **PIF** (dacă e cazul): operații, instruire, aparate, detector.
7. **Semnături**: instalator, RTE, beneficiar (și opțional reprezentant OD pe PV PIF).
8. **Generare PDF**: PV recepție/fișă/etc., nr. de document din secvențe per tip.
9. **Sincronizare** offline (lucrări în subsoluri/cămine, acoperire slabă).

### 6.3 Ce e riscant să promiteți

- **„Documente 100 % conforme ANRE / acceptate de orice OD."** Modelele-cadru sunt oficiale, dar OD refuză PIF pentru „completare necorespunzătoare" (art. 25 alin. 3 lit. b pct. iii). Promisiunea corectă: „șabloane aliniate la modelele-cadru ANRE, versionate".
- **„Semnătură electronică cu valoare juridică."** Vezi 5.2.
- **„Trimitem automat la Delgaz/Distrigaz/etc."** Nu am găsit API-uri publice standard; există canale proprii (Delgaz Grid are platformă online pentru racordări din 2024, [PROBABIL] presă). Oferiți **export + e-mail** în pachetul cerut de art. 24; integrări doar după acord cu fiecare OD.
- **„Calculăm presiunile/duratele corecte."** Valorile depind de norma în vigoare (modificată în 2023, poate și ulterior) și de interpretări (volume < 0,1 m³). Tratați ca **valori de referință editabile**, cu versiune a normei și avertisment; răspunderea rămâne la instalator/RTE.
- **„Validăm autorizațiile ANRE automat."** Lista oficială a OE e pe anre.ro (pagină care nu s-a putut accesa); nu există API găsit. Oferiți evidență proprie cu alerte, nu verificare live.
- **„Calculăm scadențele exact ca OD."** Scadența oficială vine din notificarea furnizorului/baza OD; regulile de resetare (art. 32) sunt clare, dar OD poate avea alte date. Marcați câmpul „scadență conform notificării" ca sursă de adevăr.
- **„Gestionăm ISCIR."** Zona e neclară (praguri, formulare). Doar atașare de documente externe.
- **Retenție/ștergere automată.** Vezi 5.1.
- **Sincronizare PV PIF cu partea OD.** Contorul, indexul și sigiliile sunt operațiile OD.
- **Calculul tarifelor de PIF/racordare.** Sunt tarife ale OD, schimbătoare; nu le includeți ca valori fixe.

---

## 7. Lacune și întrebări pentru clientul potențial

1. Ce autorizații **de firmă** are acum: EDIB, ET, PDIB, PT, EDSB? Face proiectare în casă sau doar execuție?
2. Face **VTP/RTP** (instalator EDIB) ca serviciu recurent către populație/asociații? Câte instalații în portofoliu (determină valoarea modulului de scadențar)?
3. Lucrează **ca executant pentru OD** (branșamente/extinderi, contract Ord. 96/2018) sau doar la clientul final (instalații interioare)?
4. Ce OD-uri deservește (Delgaz Grid, Distrigaz Sud Rețele, Nova Power & Gas, altele) și cum depune acum cererea PIF (e-mail, platformă, ghișeu)?
5. Are **sudori PE/oțel**? Are RTE propriu? Câți instalatori are în REGES (regulamentul 2026 cere 3)?
6. Face și **centrale termice** (montaj + PIF ISCIR)? Cine face partea ISCIR?
7. Ce folosește acum pentru PV: Word/Excel/hârtie? Obțineți 2-3 exemple reale de PV recepție, PV PIF, fișă VTP și o cerere PIF, **anonimizate**, ca să validăm șabloanele față de practica OD.
8. Ce semnătură acceptă OD-urile lor în practică (olografă scanată, QES, simplă)?
9. Ce regulament de autorizare li se aplică acum (cel din 2026 e intrat în vigoare? au început perioada de tranziție de 3 luni?).

Verificări juridice recomandate înainte de lansare: (a) textul regulamentului de autorizare 2026; (b) versiunea curentă a NTPEE după 2023; (c) retenția pentru registrele OE sub 132/2021/2026; (d) DPA și poziția de procesator; (e) valoarea semnăturii electronice în relația cu OD.

---

## 8. Surse

### Texte oficiale (copii consolidate citite integral sau parțial)
- Ord. ANRE 179/2015 (VTP/RTP), forma agregată 03.06.2020: https://www.axpo.com/content/dam/axpo19/countries/romania/3103_Ord_179_Proced_verif_si_reviz_forma_agregata_03.06.2020.pdf
- Ord. ANRE 96/2023 (modifică 179/2015), M.Of. 1002/3.XI.2023: https://www.ppcenergy.ro/wp-content/uploads/ord-96-2023.pdf
- Ord. ANRE 156/2020 (proiectare-execuție-recepție-PIF), formă la 14.12.2025: https://gazest.ro/wp-content/uploads/2025/12/Procedura-privind-proiectarea-verificarea-proiectului-tehnic-executia.pdf
- NTPEE, Ord. ANRE 89/2018, formă sintetică 13.02.2023: https://www.megaconstruct.ro/wp-content/uploads/2023/02/norme-tehnice-din-2018-forma-sintetica-pentru-data-2023-02-13.pdf
- NTPEE, versiunea inițială din M.Of. 462/2018: https://amstal.ro/wp-content/uploads/2018/12/NTPEE-2018-Ordin-ANRE-89-2018.pdf
- Ord. ANRE 18/2021 (racordare la SD), formă 29.06.2021: https://www.axpo.com/content/dam/axpo19/countries/romania/DE%20PUS_ORDIN-nr-18.2021-Regulament%20racordare%20la%20sisten%20de%20distributie%20GN.pdf
- Ord. ANRE 98/2015 (regulament autorizare, **istoric**, abrogat): https://legeaz.net/monitorul-oficial-493-2015/ordinul-anre-98-2015/anexa-regulament
- Ord. ANRE 83/2014 (autorizare persoane fizice): https://legeaz.net/monitorul-oficial-692-2014/ordinul-anre-83-2014/anexa-regulament
- Ord. ANRE 132/2021 (referință, neaccesat): https://legislatie.just.ro/Public/DetaliiDocument/249749

### Surse secundare (presă/juridic) pentru regulamentul 2026
- Profit.ro, 29.05.2026: https://profit.ro/perspective/schimbari-legislative-pentru-firme/nou-regulament-de-autorizare-a-operatorilor-economici-din-domeniul-gazelor-naturale-22461813
- Capital.ro: https://www.capital.ro/noul-regulament-anre-pentru-companiile-din-domeniul-gazelor-dispar-firmele-fara-capacitate-reala-cum-se-vor-acorda-autorizatiile.html
- Juridice.ro: https://www.juridice.ro/832185/anre-a-aprobat-un-nou-regulament-pentru-autorizarea-operatorilor-economici-care-desfasoara-activitati-in-domeniul-gazelor-naturale.html
- InvesTenergy: https://www.investenergy.ro/se-schimba-regulile-pentru-operatorii-economici-din-domeniul-gazelor-naturale-anre-introduce-noi-categorii-de-autorizatii-si-cerinte-tehnice-mai-stricte/

### Alte surse folosite (calitate variabilă)
- ANRE, pagină consumatori despre OE autorizați pentru verificări (neaccesibilă în sesiune; citată din rezultatul de căutare): https://anre.ro/consumatori/gaze-naturale/care-sunt-operatorii-economici-autorizati-pentru-efectuarea-verificarilor-la-instalatiile-de-gaze/
- Lista regulamentelor ANRE de autorizare gaze (neaccesibilă): https://arhiva.anre.ro/ro/gaze-naturale/legislatie/autorizare-in-domeniul-gn/regulamente
- Delgaz Grid, platformă online racordări (presă): https://www.revistabiz.ro/noi-facilitati-oferite-de-platforma-online-de-racordare-la-reteaua-de-distributie-delgaz-grid/ ; site operator: https://www.delgaz.ro
- Semnătură electronică, Legea 214/2024: https://lynx.legal/romania-the-impact-of-law-no-214-2024-on-the-use-of-electronic-signatures-and-modernization-of-digital-processes-in-romania/ ; https://hotnews.ro/efectele-juridice-ale-diferitelor-tipuri-de-semnatura-electronica-si-riscurile-asociate-acestora-1819958
- Arhivare documente contabile (Legea 82/1991, mod. Legea 36/2023): https://profit.ro/taxe-si-consultanta/lege-perioada-in-care-firmele-sunt-obligate-sa-arhiveze-documentele-financiar-contabile-redusa-drastic-20978356 ; https://www.contzilla.ro/termene-noi-pentru-arhivarea-documentelor-contabile/
- ISCIR/centrale termice (comercial, neoficial): https://playtech.ro/2025/cum-obtii-autorizatia-iscir-pentru-centrala-termica-costuri-si-acte-necesare/ ; https://playtech.ro/2026/verificarea-pe-care-proprietarii-de-centrale-trebuie-sa-o-faca-periodic-ce-risti-daca-termenul-a-expirat/

### Încercate, nefuncționale în sesiune
- legislatie.just.ro (502), anre.ro / arhiva.anre.ro (503), universuljuridic.ro (403), formularul DSR FD-037-601 și ghidul DSR „Fișe verificare tehnică IUGN" (404).
