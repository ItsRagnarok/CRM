# Ce trebuie să conțină platforma pentru o firmă de electrice, gaze și fotovoltaice

Data: 2026-11-08. Bazată pe rapoartele din `docs/cercetare-2026-11/` și `docs/cercetare-2026-11-b/` (16 rapoarte), pe auditul platformei actuale și pe deciziile din `docs/plan-aplicatie-v2.md`.

**Limită, spusă din start:** dovezile vin din presă, documente secundare și logica domeniului. Nu am vorbit încă cu firme. Frecvențele sunt calitative. Termenele legale (verificare gaze la 2 ani, revizie la 10, termene ATR, valabilități) nu au putut fi confirmate pe text oficial și trebuie validate cu un jurist/contabil. De aceea, în platformă, **termenele sunt setări ale firmei**, nu cifre ascunse în cod.

## 1. Pentru cine e construită

| Rol | Ce vrea de la platformă | Ce îl omoară azi |
|---|---|---|
| Patron | Să știe în orice zi: ce lucrări rulează, cât are de încasat, ce marjă face, ce scadențe arde | Excel, WhatsApp, memorie; marja o află la final sau deloc |
| Dispecer / birou | Să trimită echipa potrivită, cu documentele potrivite, și să vadă cine unde e | Replanificări, poze în grupuri, apeluri |
| Tehnician / șef echipă | Un singur buton pe lucrare, fără birocrație, merge și fără semnal | Hârtii, fotografii pierdute, pontaj pe caiet |
| Contabil (extern) | Date complete și la timp: ore, materiale, bonuri, facturi | Primește poze și mesaje, retrimite |
| Clientul final | Să știe în ce stadiu e lucrarea, fără cont | Nu află nimic până sună el |

## 2. Ce are nevoie fiecare domeniu (și ce NU)

### Electric
- Lucrare cu **tablouri, circuite, măsurători** (rezistență de izolație, buclă, continuitate) completate de tehnician; platforma **nu judecă** dacă valoarea e bună.
- **Buletine / procese-verbale** cu semnatar autorizat (grad ANRE) și lucrări ascunse documentate cu poze înainte de acoperire.
- Oferte pe deviz (manoperă + materiale) și **marjă pe lucrare**; urmărirea depășirilor de manoperă.
- Aparate de măsură cu **dată de calibrare**.
- NU: proiectare automată, calcul de secțiuni.

### Gaze
- **Scadențar pe bloc → scară → apartament** (munca vine în valuri, la asociații): ce urmează la verificare/revizie, cine nu a răspuns, ce s-a făcut.
- **Fișa/procesul-verbal al instalației** cu rezultat stabilit de instalator, număr de probă, aparate folosite.
- **Legitimație instalator** cu alertă de expirare; un PV nu se semnează cu legitimație expirată.
- Perioadele cu cerere mare (după evenimente, final de an): vizibilitate pe capacitate.
- NU: integrare automată cu portalul operatorului (nu există API public găsit), validare ANRE live.

### Fotovoltaic
- **Dosar pe etape**: ofertă → contract/avans → comandă echipamente → montaj → ATR → contor/punere în funcțiune → certificat → AFM/garanție.
- **Ceas al termenelor operatorului**: termenele sunt editabile (sursele diferă între 15, 20 și 30 de zile); la depășire, o reclamație factuală pregătită.
- Decontări AFM de primit și lista de documente pentru dosar (serii panouri/invertor, atestate valabile).
- Service anual și garanții pe instalație.
- NU: design 3D, dimensionare de panouri (nu e durerea firmelor găsite).

### Transversal (orice domeniu)
- Avansuri, facturi, restanțe pe vechime; retenții de garanție la lucrări mari (construcții).
- Stoc pe mașini/depozit, cerere de materiale din teren.
- Conformitate: autorizații, instructaj SSM, aptitudine medicală, aparate, mașini (ITP/RCA).
- Pontaj, concedii, cheltuieli cu mod de plată (proprii sau ale firmei).
- Mesaje și notificări (inclusiv push când aplicația e închisă).

## 3. Structura platformei (ce vede biroul)

Meniul se adaptează la domeniile alese la crearea contului (unul, două sau toate trei).

1. **Panou** — ce cere atenția azi: scadențe, termene depășite, de încasat, lucrări blocate, cine e în teren.
2. **Lucrări** — listă și filtre; fișa lucrării cu dosar, formulare tehnice, documente, materiale, ore, facturare, istoric.
3. **Calendar și echipe** — planificare pe zi/săptămână, capacitate, conflicte.
4. **Hartă live** — poziții doar în timpul programului, cu retenție setabilă (GDPR).
5. **Pe domenii** — Gaze (scadențar), Fotovoltaic (dosare), Electric (lucrări și buletine).
6. **Clienți** — fișă, locații, istoric, documente, status trimis clientului.
7. **Bani** — oferte, situații pe etape, facturi și încasări, marjă pe lucrare, cheltuieli.
8. **Firmă** — conformitate, stoc și mașini, pontaj și concedii, aprobări, rapoarte.
9. **Mesaje și notificări.**
10. **Setări** — firmă, domenii active, utilizatori și roluri, programul standard, termene și alerte, șabloane de formulare/checklist, notificări, GPS, integrări de facturare, abonament, date și export.

## 4. Setările pe care le vrea o firmă (lista completă pentru mockup)

- **Firma:** denumire, CUI, adresă sediu (pentru hartă), contact, logo pe documente.
- **Domenii active:** electrice / gaze / fotovoltaice (schimbabile de administrator).
- **Utilizatori și roluri:** administrator, manager, tehnician; cine vede prețuri și tarife.
- **Program:** ore standard pe zi, zile lucrătoare, fusul orar.
- **Termene și alerte:** alertă legitimații (60/30/7 zile), instructaj, aptitudine, termene operator, verificări periodice, calibrări.
- **Șabloane:** formulare tehnice pe domeniu, checklist-uri, text de ofertă și de proces-verbal.
- **Notificări:** ce primește fiecare rol, push, email, ore liniștite.
- **GPS și confidențialitate:** urmărire doar în program, retenție, informare angajați.
- **Facturare:** furnizor (Oblio/SmartBill), serii, TVA, export; numărul fiscal vine doar de la furnizor.
- **Abonament și date:** plan, facturi ElectroField, export, ștergere, termeni.

## 5. Ce există azi și ce lipsește

| Zonă | Stare |
|---|---|
| Lucrări, clienți, echipe, calendar, hartă, pontaj, concedii, cheltuieli, mesaje, notificări | Există |
| Aplicația tehnicianului v2 (job hub, formulare, scanare, facturare către birou) | Există, nevalidată cu utilizatori reali |
| Domenii pe firmă, formulare tehnice pe domeniu, documente cu expirare | Există (bază) |
| Cerere de facturare către birou, rezolvare | Există |
| Scadențar gaze pe bloc/scară/apartament | **Lipsește** |
| Dosar fotovoltaic pe etape, ceas operator, AFM | **Lipsește** |
| Registru de conformitate (oameni, aparate, mașini) cu alerte | **Lipsește** (doar documente cu expirare per utilizator) |
| Situații pe etape, retenții, marjă pe lucrare | **Lipsește** |
| Status pentru client fără cont | **Lipsește** |
| Web Push complet, mod offline, scanare AI, emitere directă Oblio/SmartBill | **Lipsește** |

## 6. Ordinea recomandată de construire

1. Registru de conformitate cu alerte (cel mai ieftin, cel mai des citat, transversal).
2. Scadențar gaze (blocul ca unitate) și dosar fotovoltaic cu ceasul operatorului.
3. Status pentru client fără cont.
4. Situații pe etape și marjă pe lucrare.
5. Web Push, apoi offline, apoi scanare AI.

## 7. Înainte de a construi mai mult

Validare cu **8-10 interviuri** cu firme reale (electrice, gaze, fotovoltaice): ce folosesc azi, ce cere operatorul în dosar, cum plătesc asociațiile, ce preț e acceptabil. Cifrele din mockup sunt exemple, nu date reale.
