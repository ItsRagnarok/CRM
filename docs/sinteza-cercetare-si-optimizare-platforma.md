# Sinteză cercetare (nov. 2026) și cum optimizăm platforma

Data: 2026-11-08. Bazată pe 8 rapoarte noi din `docs/cercetare-2026-11-c/` (firme electrice, gaze, fotovoltaice, concurență, clienți, operațiuni, preț). Toate cele 8 rapoarte sunt incluse.

**Cum citești acest document.** Fiecare afirmație are o etichetă de încredere: **[C]** confirmat pe o pagină citită integral, **[S]** doar din rezumat/agregator, **[E]** estimare sau impresie. Aproape toate sursele despre firme mici sunt [S] sau [E]. Nu există încă interviuri cu firme reale; fără ele, tot ce urmează sunt ipoteze bine argumentate, nu fapte.

---

## 1. Cele mai importante 8 lucruri

1. **Concurența e mai puternică decât credeam.** Zarina CRM (RO) are pagină dedicată fotovoltaice: atestate ANRE cu expirări, dosar prosumator în 8 etape, trimitere factură spre SmartBill/e-Factura; licență 2.990 € unică, pe server propriu, fără mobil declarat [C]. Aktio (RO): de la 15 €/utilizator/lună, offline, PDF pe WhatsApp, pentru HVAC/termice/electrice; fără ANRE/facturare declarate [C]. Afirmația din cercetările anterioare „nimeni nu are ANRE/prosumator" e **falsă** pentru partea de birou.
2. **Golul real:** aplicație de teren **offline** + birou în română, ieftină, cu șabloane ANRE/PV/gaz. Cel mai liber domeniu e **gazele**: nu s-a găsit niciun software dedicat scadențarului [S: negăsit ≠ inexistent].
3. **Prețul trebuie justificat prin bani pierduți, nu prin funcții.** Oblio costă ~29 €/an, SmartBill de la ~5,84 €/lună + TVA [C pe pagini de preț/comparație]. Standard 299 lei/lună e de 3–20 de ori mai mult decât ce plătesc firmele azi pentru software. Vânzarea pornește de la „câte ore, materiale și lucrări nefacturate pierzi", nu de la lista de module.
4. **Sunt două tipuri de firmă, nu una:** 2–5 oameni (sub ~2 mil. RON) și 20–40 de oameni (8–15 mil. RON) [S]. Prima nu va plăti 299 lei fără dovadă de valoare rapidă; a doua are bani, dar și procese proprii.
5. **Firmele nu fac un singur domeniu.** Același electrician face interior, branșamente, tablouri, prize de pământ, PRAM, iluminat public, fotovoltaic, stații EV [C: site-uri citite]. Tipurile de lucrare trebuie configurabile pe firmă, nu fixe.
6. **Blocajul major în fotovoltaice e în firmă, nu doar la operator:** supraangajare, întârzieri, comunicare cu clientul (ex. un integrator cu 23% recenzii de o stea, amânări de luni [C: Trustpilot]). Piața nu scade: 2,2 GW instalați în 2025, ~2,5 GW prognozat 2026 [S]; AFM nu mai finanțează panouri în 2026, doar baterii (Casa Verde Baterii, max. 15.000 lei, 75% — ghid încă proiect) [S].
7. **În gaze, marii operatori au deja un proces pe care îl putem copia ca model:** contact cu 30 de zile înainte de scadență, notificare scrisă, clientul absent notificat o singură dată pentru o nouă dată, primul serviciu în maxim 60 de zile, nicio lucrare dacă sunt facturi scadente neplătite [C: contracte ASIGAZ/Enel X citite local]. Verificarea la 2 ani și revizia la 10 ani sunt confirmate din mai multe surse și din Ord. 179 [C].
8. **Lipsa de personal calificat e reală, dar fără statistici RO:** salarii 2026 ~5.000 lei net electrician/instalator, 8.000–12.000 pentru autorizat ANRE [S]. Echipa tipică = 2 persoane cu mașină și scule date de firmă [S]. Productivitatea per om contează mai mult decât numărul de funcții.

---

## 2. Ce nevoi apar în toate cele trei domenii (ordonate după câte rapoarte le susțin)

| # | Nevoie | Susținută de | Stare în platformă |
|---|---|---|---|
| 1 | Evidență autorizații/atestate/aparate/mașini cu alerte | electric, gaze, PV, operațiuni | **Există** (Conformitate); alertele ajung doar în platformă, nu și pe telefon cu app închisă |
| 2 | Încasări, restanțe, facturare conectată la SmartBill/Oblio/FGO | electric, clienți, preț | Parțial (cerere de facturare către birou); fără emitere directă |
| 3 | Dosar pe lucrare pe telefon, pozele atașate | electric, PV, operațiuni | **Există** (app tehnician v2) |
| 4 | Șabloane buletine/PV/fișe (electric, gaz, PV) | electric, gaze, PV | **Există** (buletine electrice, fișe gaz) — șabloanele trebuie validate de un autorizat |
| 5 | Scadențar pe bloc/scară/apartament cu campanii | gaze, clienți | **Există** (Gaze); lipsesc jurnalul de reprogramare cu dovezi și regula „un singur reprogramare" |
| 6 | Dosar fotovoltaic cu termene și ceas operator | PV | **Există**; lipsesc AFM baterii, serii/garanții, parametri versionați |
| 7 | Planificare echipe (șef + ajutor + mașină + stoc) | electric, operațiuni | Parțial (Calendar pe echipe); stocul pe mașină lipsește |
| 8 | Ofertă/deviz rapid dintr-un catalog propriu | electric, clienți | **Lipsește** |
| 9 | Marjă pe lucrare (cost real vs ofertat) | electric, operațiuni | **Lipsește** (doar „bani pe lucrare") |
| 10 | Status pentru client fără cont | clienți, PV | **Există** (link de status) |
| 11 | Mentenanță/PRAM recurentă (contracte de revenire) | electric, gaze | **Lipsește** |
| 12 | Pontaj pe lucrare în 2 atingeri, offline | operațiuni | Pontaj există; offline lipsește |

---

## 3. Cum optimizăm platforma — prioritizat

Criteriu: (a) câte rapoarte susțin nevoia, (b) cât diferențiază față de Zarina/Aktio, (c) efort mic față de efect. Ordinea e judecata mea, de validat în interviuri.

### Etapa A — Valoare vizibilă în prima săptămână (efort mic–mediu)
1. **Web Push pentru alerte** (conformitate, termene PV, scadențe gaze). Fără el, alertele de care depinde valoarea nu ajung la nimeni cu aplicația închisă. Singura funcție de care depind mai multe alte funcții.
2. **Import la creare, făcut de noi.** Gaze are deja import din Excel; extindem: clienți, aparate, autorizații. Prima valoare trebuie să existe din prima zi fără ca firma să introducă nimic. Aceasta e și cea mai bună replică la „configurarea e grea".
3. **Panoul „bani pierduți"** (pentru vânzare și pentru adopție): lucrări terminate nefacturate, încasări restante pe vechime, scadențe gaze depășite, termene operator depășite, materiale duse și nefolosite. Cifrele există deja în date; le adunăm într-un singur ecran cu suma în lei. Asta răspunde direct la obiecția de preț din secțiunea 1, punctul 3.
4. **Tipuri de lucrare configurabile pe firmă** (punctul 5 din secțiunea 1) și domeniu preselectat la lucrare nouă (făcut). Mai ales pentru firmele care amestecă electric + PV + EV.

### Etapa B — Diferențiere reală față de concurență (efort mediu)
5. **Mod offline** în aplicația tehnicianului (pontaj, poze, formulare, bifare materiale), cu sincronizare după. E golul pe care nici Zarina (fără mobil), nici Aktio (fără ANRE/facturare) nu îl acoperă împreună.
6. **Gaze: campanie de bloc completă.** Stări pe apartament (neprogramat → anunțat → programat → efectuat → absent → reprogramat), jurnal cu dovada anunțului, o singură reprogramare notificată, blocare dacă sunt datorii (opțional, setare). Modelul din contractele ASIGAZ/Enel X, adaptat firmelor mici. Procedura pentru apartament absent se activează **doar după confirmare juridică** (amenzile 500–3.000 lei citate sunt [S], de verificat în Legea 196/2018).
7. **Ofertă/deviz rapid dintr-un catalog propriu al firmei** (articole, manoperă, materiale), PDF trimis pe WhatsApp, transformat în lucrare la acceptare. Nu motor de devize pe norme (explicit: nu construim).
8. **Marjă pe lucrare:** ore reale + materiale + cheltuieli față de oferta acceptată, productivitate = ore reale / ore ofertate. Fără cheltuieli indirecte complicate la început.

### Etapa C — După primele firme pilot
9. Foaie de parcurs generată din deplasări, diurnă configurabilă, bon cu poză alocat pe lucrare și mașină (cerute de operațiuni; fiscal de confirmat cu contabilul).
10. Situații de lucrări, retenții și scadențar de retenții (doar dacă 2–3 firme de construcții confirmă).
11. Emitere directă în Oblio/SmartBill (după ce validăm care dintre ele îl folosesc firmele pilot).
12. Modul baterii/AFM și parametri versionați pentru legislația fotovoltaică (Legea 160/2026, metodologia ANRE încă nesigură: calculele din oferte trebuie să fie parametri, nu cifre fixe).

### Ce NU construim (susținut de concurență și de rapoarte)
Facturare/contabilitate proprie, motor de devize pe norme, design/dimensionare PV, monitorizare invertoare, CRM generic, depunere automată în portaluri de stat (în 2019 AFM a suspendat programul pentru dosare încărcate cu soft).

---

## 4. Preț și pachete (recomandarea din raport, cu rezerve)

- Păstrăm Standard 299 lei și Pro 599 lei; nu recomandăm scădere de preț și nu recomandăm prețuri per modul în ofertă [E].
- Propuneri de testat, nu decise: 5 utilizatori + un domeniu în Standard, 15 utilizatori + toate domeniile în Pro; utilizator suplimentar ~39 lei; al doilea domeniu ~+99 lei; configurare ~1.000 lei, dedusă dacă firma continuă 3 luni [E].
- Plata lunară implicit; anual (2 luni gratis) oferit după luna 3 [E: nu există date RO].
- Comparații occidentale: Tradify 47–61 $/utilizator, Housecall Pro ~59 $, Plancraft de la 74,90 € fix, ServiceTitan 245–398 $/tehnician [S: site-uri de comparație care se contrazic]. Ne încadrăm la ~20–25% din prețul occidental, dar de 3–20 de ori peste facturare locală.
- **Concurență directă pe preț:** Aktio 15–23 €/utilizator/lună; Zarina 2.990 € licență unică. Modelul nostru „preț pe firmă, utilizatori incluși" e mai simplu pentru un patron decât ambele.

## 5. Plan de validare (obligatoriu înainte de Etapa B–C)

- **Pilot:** 6 săptămâni, 3 firme (câte una pe domeniu; Proconstructo pentru gaze), cu criterii scrise dinainte: ≥60% utilizatori activi în săptămâna 2, ≥2 din 3 firme continuă la preț plin [din raportul de preț].
- **8–15 interviuri** cu patroni/administratori de bloc/clienți recenți. Întrebări prioritare, pe care rapoartele nu le-au putut lămuri: ce folosesc azi efectiv (Excel? WhatsApp? un CRM?); cât costă o lucrare uitată sau nefacturată; cum reprogramează apartamentele absente; cine poate emite buletine pentru prize de pământ; care e termenul real de plată la subcontractare; ce preț li se pare corect (metoda Van Westendorp).
- **Demo-uri ale Aktio și Zarina** înainte de a decide diferențierea finală.
- **Validare juridică** pentru: DPA/clauza GPS-pontaj (GDPR art. 28 — noi suntem împuternicit, clientul operator), amenzile și procedura pentru apartament absent, termenele de plată între profesioniști, deductibilitatea mașinilor (cu contabilul).

## 6. Obligații legale: ce s-a confirmat și ce nu

Sursa: `05-obligatii-legale-confirmate.md`. **Limită principală:** nicio pagină oficială nu a putut fi citită (legislatie.just.ro a dat 502, PDF-urile ANAF au venit binare; anre.ro, monitoruloficial.ro, iscir.ro nu au dat pagini citibile). Textele au fost citite pe oglinzi neoficiale (legeaz.net, rubinian.com), deci marcajul e „confirmat pe text (oglindă)", nu „oficial".

| Obligație | Termen | Act (oglindă) | Rezerve |
|---|---|---|---|
| Electricieni: vizarea autorizației | 5 ani | Ord. ANRE 66/2023, art. 18 și 30 | textul conține tranziții cu „5 ianuarie 2017", posibil text moștenit |
| Firmă electrică: atestat | vizare la 5 ani, documente cu 60–120 zile înainte | Ord. 45/2016, art. 9 și 22 | — |
| Gaze, persoane fizice: legitimație | 5 ani, cerere cu min. 30 zile înainte, 2 cursuri de 20 h | Ord. 83/2014, art. 10, 11, 18 | doar forma inițială |
| Gaze, firme: autorizare | 5 ani, cerere între 90 și 30 zile înainte | Ord. 98/2015, art. 4–22 | presa din 29.05.2026 anunță un regulament nou ANRE (abrogă Ord. 132/2021); număr și dată neconfirmate |
| Gaze: verificare / revizie instalație | 2 ani / 10 ani; furnizorul notifică cu 60 zile înainte | Ord. 179/2015, art. 3 | modificările (71/2020, 96/2023) nu au fost citite |
| SSM: instruire periodică | 6 luni (12 luni personal tehnico-administrativ) | HG 1425/2006, norme, art. 96 | — |

**Doar din presă sau parțial:** termenul e-Factura de 5 zile lucrătoare (OUG 89/2025), amenzile e-Factura, aplicabilitatea e-Transport, sancțiunile ITP, cazurile ANSPDCP pentru GPS (2.000 și 4.000 EUR).

**Neconfirmate deloc:** periodicitatea PSI, PRAM/prize de pământ/paratrăsnet, metrologie legală, periodicitatea ITP pe act, RCA, ISCIR, termenele ATR pentru prosumatori (15 sau 30 zile, surse contradictorii; cadrul probabil Ord. ANRE 19/2022), arhivarea contabilă (5, 10 sau 50 de ani, contradictoriu), Legea 190/2018 art. 5. „Ordin 11/2024" și „12/2024" ANRE nu apar în nicio sursă și nu au fost folosite.

**Decizie de produs (recomandarea agentului, o adopt):** valori implicite în platformă **doar** pentru punctele confirmate pe text, cu dată de intrare în vigoare și posibilitate de suprascriere; pentru restul, câmp de scadență **fără** valoare implicită. Verificarea și revizia gaze sunt obligația clientului final; firma de instalații le oferă ca serviciu de alertare, deci ne poziționăm ca „alertare și programare", nu ca „garant legal".

**De făcut înainte de a promite termene în produs:** un jurist sau un autorizat ANRE verifică tabelul de mai sus pe textele oficiale în vigoare.

## 7. Limite ale întregii cercetări

- Nu s-au găsit recenzii reale ale clienților RO despre electricieni/instalatori; secțiunile despre clienți rezidențiali și comerciali sunt impresii [E].
- Numărul de prosumatori diferă mult între surse (100.000 / 248.000 / 370.000); nu folosim cifra fără verificare la ANRE.
- Cifrele de afaceri ale firmelor vin din agregatoare (cauta.ro, termene.ro), unele doar din fragment de căutare.
- Nu avem date despre fluctuația de personal, plata la zi vs la oră, conflictul birou–teren, abandonul software-ului sau canalele reale de vânzare în RO.
- Prețurile concurenței occidentale vin din site-uri de comparație, adesea afiliate.
- Surse prea slabe pentru a construi funcții mari (situații de lucrări, retenții, SEAP): doar după interviuri.
