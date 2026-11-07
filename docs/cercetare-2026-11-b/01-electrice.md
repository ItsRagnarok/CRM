# Cercetare: firme de instalații electrice din România (rezidențial, comercial, industrial mic)

Data: 2026-11-07. Metodă: doar citire web. Rezultatele căutării au fost slabe pe surse românești de teren: nu am găsit și citit niciun fir de forum al electricienilor români, niciun blog de firmă cu fluxul intern și niciun software concurent românesc dedicat. Din acest motiv, secțiunile despre ziua de lucru, problemele și rolurile sunt în mare parte **ÎNCREDERE SCĂZUTĂ** (inferență din surse indirecte și din cunoștințe generale, neverificate).

Legendă: **VERIFICAT** = pagina a fost citită integral sau parțial prin WebFetch și afirmația apare în ea. **SECUNDAR** = apare doar în rezumatul unei căutări, într-un site comercial/promoțional sau într-o sursă veche. **ÎNCREDERE SCĂZUTĂ** = inferență sau cunoștințe generale, fără sursă citită.

---

## 1. Profil al firmei-țintă

- Firmă mică: 3-15 oameni. Patron (adesea electrician autorizat sau cu un angajat autorizat), 1-3 echipe de 2-3 oameni, 1 persoană la birou/contabilitate externalizată. **ÎNCREDERE SCĂZUTĂ** (nu am găsit date statistice).
- Cadrul legal pentru autorizare: ANRE autorizează persoane fizice, nominal și netransmisibil, cu grade I, IIA/IIB, IIIA/IIIB, IVA/IVB. Gradul I = instalații interioare până la 10 kW sub 1 kV. Gradul II = sub 1 kV fără limită de putere. Gradul III = până la 20 kV. Gradul IV = orice tensiune. Tipul A = proiectare, B = execuție. **VERIFICAT**, Ordinul ANRE 66/2023, art. 6, 8, 9: https://legeaz.net/monitorul-oficial-417-2023/ordin-anre-66-2023
- Autorizația se vizează la 5 ani, cu curs de minimum 20 de ore; fără vizare nu ai dreptul să lucrezi. **VERIFICAT** (art. 18, 30, 34, aceeași sursă). Implicație software: evidență a expirărilor autorizațiilor.
- Proiectarea și execuția se fac de electricieni autorizați și de personal calificat sub coordonarea/supravegherea lor. PFA și întreprinderile individuale pot lucra pe instalații interioare mici, în asociere cu alt electrician autorizat; pentru instalații complexe se cere atestat ANRE (al firmei). **VERIFICAT** (art. 1, 35, aceeași sursă). Conținutul exact al art. 35 B-D și al regulamentului de atestare (Ordin 45/2016, menționat în search) nu l-am citit: **SECUNDAR** https://legeaz.net/monitorul-oficial-730-2016/ordin-anre-45-2016-regulament-atestare-proiectare-executare-verificare-instalatii-electrice
- Piața muncii: lipsă de electricieni. Sursa citită este un articol Profit.ro din 21 martie 2019: un patron din Timișoara declară că ar angaja 50 de electricieni la 1.500 euro net și recalifică necalificați. **VERIFICAT**, dar **vechi (2019)**: https://profit.ro/taxe-si-consultanta/piata-electricienilor-urca-puternic-salarii-fondul-lipsei-angajati-om-afaceri-maine-vin-mine-50-electricieni-buni-le-dau-1-500-euro-net-romanii-afara-cer-insa-casa-familie-18935005
- Salarii: Paylab dă 4.050-8.175 RON net/lună pentru 80% dintre electricienii industriali; Newsweek ~8.000 lei. **SECUNDAR** (doar din snippet de căutare): https://www.paylab.ro/en/salaryinfo/electrical-power-engineering/electrician-industrial, https://newsweek.ro/economie/bursa-salariilor-in-romania-sudor-5500-lei-electrician-8000-lei-cine-ia-35000-lei
- Mulți electricieni autorizați lucrează PFA, facturând pe lucrare. **SECUNDAR** (snippet, ghid folositor.ro): https://folositor.ro/ghid/cat-castiga-un-electrician-in-romania-2026
- Un articol din 2017 (Romania Insider, snippet) spune că mulți electricieni preferă lucrări mici cu venituri nedeclarate complet. **SECUNDAR**, vechi, nu l-am putut deschide (HTTP 429): https://www.romania-insider.com/romania-to-hire-serbian-workers-as-western-part-of-country-is-faced-with-electricians-shortage

## 2. Fluxul pas cu pas (cerere -> ofertă -> execuție -> recepție -> facturare)

Pașii marcați cu "racordare" au sursă; restul este model **ÎNCREDERE SCĂZUTĂ**, de validat în interviuri.

1. **Cerere de ofertă**: telefon, WhatsApp, recomandare, formular site. Informații incomplete, poze trimise pe WhatsApp. ÎNCREDERE SCĂZUTĂ.
2. **Vizită la fața locului / releveu**: măsurare, discuție despre putere, tablou, trasee. ÎNCREDERE SCĂZUTĂ.
3. **Ofertă/deviz**: listă de materiale + manoperă. Pentru lucrări publice/mari, devizul-ofertă include cheltuieli directe, indirecte, profit procentual și TVA la total. SECUNDAR (documente de achiziție, în mare parte din Moldova, deci nu pe deplin aplicabile): https://storage.mtender.gov.md/get/19f911ac-28f2-4554-a4b5-800771e0ed65-1734335205542. Pentru rezidențial, în practică ofertă simplă în Excel/Word/WhatsApp: ÎNCREDERE SCĂZUTĂ. Programe de devize existente în România (Windoc Deviz, Deviz online, Deviz AR; menționate Intersoft, WinDev în anunțuri de angajare) sunt orientate spre constructori medii și mari: SECUNDAR (snippet, nu am deschis site-ul vendorului).
4. **Acceptare, avans, contract/comandă**: ÎNCREDERE SCĂZUTĂ.
5. **Racordare (dacă e cazul)**: beneficiarul depune cererea online la operatorul de distribuție, cu acte de proprietate, planuri, autorizație de construire și chestionar energetic; urmează ATR (valabilitate de regulă 12 luni), contract de racordare și plată; lucrarea exterioară o face operatorul sau o firmă partenera; instalația interioară (contor -> tablou) o face un electrician autorizat ANRE, care întocmește dosarul instalației; apoi se emite certificatul de racordare, se semnează contractul cu furnizorul și se pune sub tensiune. Durata totală 45-90 zile. **SECUNDAR** (site informativ, nu operator; articolul se contrazice la autorizația de construire): https://www.infocontact.ro/racordare-energie-electrica-atr/. Un ghid de la furnizor confirmă că ATR este pas obligatoriu înainte de lucrări: SECUNDAR, https://www.axpo.com/content/dam/axpo19/countries/romania/090425_Informatii%20privind%20racordarea%20la%20reteaua%20de%20distributie%20a%20energiei%20electrice.pdf
6. **Aprovizionare materiale**: comandă la depozit (cablu, tablouri, aparataj, tuburi), livrare pe șantier sau ridicare de către echipă. ÎNCREDERE SCĂZUTĂ.
7. **Execuție pe etape**: traseu/tubulatură/doze (faza "brută"), apoi cablare, tablou, aparataj (faza "fină"). Poate depinde de alte meserii (zugravi, gipscartonaj). ÎNCREDERE SCĂZUTĂ.
8. **Măsurători și verificări**: priză de pământ, izolație, continuitate, buclă de defect etc., cu aparate metrologic verificate. Buletinele de verificare le pot emite grade IIB-IVB pentru instalațiile angajatorului. **VERIFICAT** (Ordin 66/2023, art. 36 alin. 2). Detaliile despre ce se măsoară nu au fost confirmate din surse românești citite integral.
9. **Dosarul instalației de utilizare (DIU)** către distribuitor, cu declarația executantului că instalația respectă ATR și proiectul tehnic verificat. SECUNDAR (snippet; PDF-ul Rețele Electrice nu s-a putut citi, text comprimat): https://reteleelectrice.ro/wp-content/uploads/documente-diu-consumatori-producatori.pdf
10. **Recepție și predare către client**: în cadrul ANRE, proprietarul sau responsabilul tehnic recepționează instalația. SECUNDAR, snippet din reglementări Moldova (nu România): https://anre.md/storage/upload/administration/reports/1638/7. Regulament admitere în exploatare a instalațiilor electrice.pdf. Pentru România: proces-verbal de recepție, ÎNCREDERE SCĂZUTĂ (neconfirmat într-o sursă citită).
11. **Facturare și încasare**: factură (e-Factura obligatorie B2B din 2024, B2C din 2025 - SECUNDAR, surse divergente la data amenzilor: https://startupcafe.ro/e-factura-b2c-perioada-fara-sanctiuni-expira-in-iunie-2025-ce-amenzi-risca-firmele-82751, https://profit.ro/perspective/schimbari-legislative-pentru-firme/decizie-guvern-facturile-relatia-b2c-raporteaza-e-factura-optional-1-iulie-obligatoriu-1-ianuarie-2025-bonurile-fiscale-apare-cod-qr-iar-casele-marcat-pot-tipari-inlocuite-2-ani-21637212). Urmărire plăți: ÎNCREDERE SCĂZUTĂ.
12. **Garanție/service post-lucrare**: ÎNCREDERE SCĂZUTĂ.

## 3. Documente

| Document | Cine îl face | Status sursă |
|---|---|---|
| Ofertă / deviz (materiale + manoperă) | patron/șef echipă/devizist | SECUNDAR (structura devizului); practica din rezidențial = ÎNCREDERE SCĂZUTĂ |
| Cerere + dosar ATR (acte, planuri, chestionar energetic) | beneficiar (adesea ajutat de electrician) | SECUNDAR, infocontact.ro |
| ATR (aviz tehnic de racordare) | operator distribuție | SECUNDAR, infocontact.ro, axpo.com |
| Scheme (monofilară, tablou, trasee) | electrician/proiectant (grad A pentru proiectare) | ÎNCREDERE SCĂZUTĂ pentru formatul practic; competențe de proiectare = VERIFICAT (Ordin 66/2023) |
| Buletine de verificare/măsurători (priză, izolație, PRAM) | electrician autorizat IIB+ sau firmă cu personal autorizat | VERIFICAT (art. 36 alin. 2); PRAM, SECUNDAR (advertorial): https://spotmedia.ro/stiri/economie/despre-verificarea-pram-ce-este-si-cat-costa |
| Dosar instalație de utilizare + declarația executantului | electrician autorizat | SECUNDAR (infocontact.ro, reteleelectrice.ro) |
| Certificat de racordare | operator distribuție | SECUNDAR |
| PV recepție (fără obiecțiuni) | executant + beneficiar | ÎNCREDERE SCĂZUTĂ pentru România |
| Copie autorizație ANRE, certificat metrologic aparat | firma, pentru clienți instituționali | SECUNDAR (caiet de sarcini PRAM, snippet): https://www.raten.ro/achizitii/2018/148311/CAIET DE SARCINI PRAM 4306.pdf |
| Factură, e-Factura | contabil/patron | SECUNDAR |

PRAM: periodicitate 6 sau 12 luni după intensitatea utilizării, costuri "câteva sute de lei" până la "câteva mii" (bloc). SECUNDAR și promoțional (spotmedia.ro, advertorial pentru un furnizor). Operatorii de rețea pun sub tensiune doar pe baza documentației întocmite de operatori atestați sau electricieni autorizați: **VERIFICAT** (Ordin 66/2023, art. 45).

## 4. Roluri în firmă

Toate **ÎNCREDERE SCĂZUTĂ** (model generic, de validat):
- **Patron**: vinde, face oferte, decide prețuri, negociază cu clienții, de multe ori și electrician autorizat; semnează documentele care cer autorizare.
- **Șef de echipă** (electrician autorizat): coordonează oamenii, primește comenzi, cere materiale, măsoară, semnează verificările (nu poate semna ce nu a executat/supravegheat direct: VERIFICAT, art. 37 lit. f).
- **Electrician / ajutor**: execuție, fără autorizare proprie în unele cazuri (personal calificat sub supravegherea unui autorizat: VERIFICAT, art. 1).
- **Contabil (adesea extern)**: facturi, e-Factura, salarii, declarații. Aflat în afara ciclului operațional, primește informații târziu.
- **Birou/dispecer**: rar ca rol separat; în firme mici îl face patronul sau soția/partenerul.

## 5. Probleme top 10 (cu impact estimat)

Sursele românești de teren lipsesc; lista este **ÎNCREDERE SCĂZUTĂ** în ansamblu, cu ancore doar unde e marcat. Impactul este estimare mea (Mare/Mediu), nu măsurat.

1. **Lipsă de electricieni calificați/autorizați** - impact Mare. Ancoră VERIFICAT dar veche (2019, Profit.ro, link mai sus); SECUNDAR pentru 2025 (Eversheds Sutherland, snippet: https://gpg-pdf.chambers.com/employment-2025/501/).
2. **Plăți întârziate / neplătite de clienți** - Mare. Ancoră străină: sondaj UK, SECUNDAR (https://www.electricaltimes.co.uk/?p=33568); pentru România nu am sursă.
3. **Devize inexacte, costuri materiale care cresc între ofertă și execuție** - Mare. Ancoră străină (același sondaj UK). România: ÎNCREDERE SCĂZUTĂ.
4. **Modificări de la client în execuție, fără act adițional scris** - Mare. ÎNCREDERE SCĂZUTĂ.
5. **Materiale lipsă pe șantier / drumuri la depozit** - Mediu-Mare. ÎNCREDERE SCĂZUTĂ.
6. **Dosare incomplete către distribuitor (ATR/DIU) duc la respingere și săptămâni pierdute** - Mare. SECUNDAR (infocontact.ro, "dosar incomplet duce la respingere").
7. **Pierderea/dispersarea documentelor** (buletine, poze, scheme în WhatsApp, foldere personale) - Mediu. ÎNCREDERE SCĂZUTĂ.
8. **Programare echipe, suprapuneri, dependență de alte meserii** - Mediu. ÎNCREDERE SCĂZUTĂ.
9. **Facturare întârziată (informația de la teren ajunge târziu la contabil)** - Mediu; plus conformare e-Factura (SECUNDAR, surse mai sus).
10. **Expirarea autorizațiilor și a verificării metrologice a aparatelor, fără evidență** - Mediu. Cadrul VERIFICAT (vizare la 5 ani); lipsa evidenței în practică = ÎNCREDERE SCĂZUTĂ.

## 6. Ce ar trebui să facă platforma

Context concurență: soluții UK/US (Tradify, Commusoft, SparkCerts, Klipboard, RAM, Powered Now) oferă deviz/ofertă, programare, certificate digitale pe teren, facturare, mod offline. SECUNDAR (snippet-uri comerciale): https://www.tradifyhq.com/uk/trades/electrician-av-software-app, https://www.klipboard.com/sectors/field-service/electrical-business-software, https://www.getapp.co.uk/software/2100741/sparkcerts. Nu am găsit un produs românesc dedicat electricienilor (lipsa din căutare nu e dovadă). Prioritizarea de mai jos este recomandarea mea.

**MUST**
- Client -> cerere -> ofertă/deviz (materiale + manoperă + TVA) -> lucrare -> factură, ca flux unic, cu statusuri.
- Șabloane de ofertă cu catalog propriu de materiale și prețuri actualizabile; istoric versiuni ofertă și act adițional la modificări.
- Dosar pe lucrare: poze, scheme, buletine, PV, declarații, toate într-un loc, cu căutare, accesibil de pe telefon.
- Programare echipe pe lucrări (calendar simplu), cu telefon-first și funcționare slabă/fără semnal.
- Șabloane PV recepție și buletine de măsurători completabile pe teren, export PDF, semnătură digitală simplă.
- Urmărire încasări și restanțe (scadențe, remindere), fără contabilitate completă; export/integrare cu contabil.
- Evidență autorizații ANRE (grad, expirare la 5 ani) și aparate de măsură (verificare metrologică), cu alertă.

**SHOULD**
- Listă de materiale pe lucrare (necesar, comandat, ajuns), cerere de materiale de la șef de echipă.
- Generare e-Factura (sau integrare cu un program de facturare existent care o face).
- Checklist-uri de pași ANRE/ATR/DIU pe tip de lucrare (racordare, tablou, PRAM), cu documentele cerute.
- Roluri și permisiuni (patron, șef echipă, electrician, contabil).
- Notificări către client (programare, ofertă gata, factură) pe WhatsApp/SMS.
- Reamintiri pentru verificări periodice la clienți (PRAM, 6/12 luni, SECUNDAR).

**COULD**
- Portal client pentru acceptare ofertă și plată online.
- Pontaj/ore pe lucrare și marjă pe lucrare.
- Import din cataloagele furnizorilor de materiale.
- Rapoarte de rentabilitate.
- Contract-cadru de mentenanță recurent.

## 7. Ce să evităm / irelevant

- ERP generic cu stocuri complexe, producție, resurse umane complete: firma mică nu are nevoie (ÎNCREDERE SCĂZUTĂ, judecată de produs).
- Devizier complet pe normative de construcții (articole, indici, analize de preț) pentru firma de rezidențial: există deja programe pentru constructori mari (Windoc Deviz etc., SECUNDAR), iar complexitatea sperie. Poate fi opțional pentru comercial/industrial.
- Copierea formatelor UK (EICR, EIC, PAT): nu se aplică în România; folosim documentele românești (PV, buletine, DIU).
- Modul de proiectare/CAD sau calcule de dimensionare: există software dedicat (ex. Gewiss PBT-Q, SECUNDAR: https://gewiss.com/pl/pl/services/support/softwares). Nu concura.
- GPS tracking al angajaților, funcții de supraveghere: risc de respingere (ÎNCREDERE SCĂZUTĂ).
- Funcții care pretind că înlocuiesc autorizarea ANRE sau semnătura electricianului autorizat: juridic problematic (documentele se semnează de persoana autorizată, VERIFICAT art. 37).
- Autentificare complicată, onboarding lung: public cu competențe digitale mixte (ÎNCREDERE SCĂZUTĂ).

## 8. Întrebări deschise (de clarificat prin interviuri cu 8-10 firme)

1. Cum arată de fapt oferta în rezidențial (Excel, Word, doar mesaj)? Cât durează să o scrie?
2. Ce documente cer cu adevărat operatorii de distribuție (DIU) și în ce format (portal, hârtie)? Lista oficială nu a putut fi citită.
3. Este PV de recepție cerut de clienți și în ce formă? Care e conținutul standard al buletinelor în România (priză, izolație, continuitate)?
4. Cine face aprovizionarea și cum se decontează (cont la depozit, plată cash)?
5. Cât de des și cât de târziu plătesc clienții? Se cer avansuri? Care e mixul B2C/B2B?
6. Câți electricieni sunt angajați vs. PFA colaboratori? Cum se gestionează autorizațiile PFA?
7. Ce programe folosesc deja (Excel, SmartBill, Oblio, FGO, WhatsApp)? Ce ar trebui să se integreze?
8. Care sunt cerințele actuale ANRE pentru atestarea firmei (Ordin 45/2016 sau mai nou)? Neverificat.
9. Cum a afectat e-Factura firmele mici de instalații? Date divergente în surse.
10. Cât ar plăti o firmă mică lunar pentru un astfel de produs?

## 9. Limite ale cercetării

- Nu am citit niciun forum românesc de electricieni (căutările au întors surse străine). Recomand sesiune dedicată: grupuri Facebook/forumuri tematice și interviuri directe.
- Mai multe pagini nu s-au putut citi: brig.ro (403), romania-insider (429), PDF reteleelectrice.ro (comprimat).
- Multe surse găsite sunt din Moldova (alt ANRE, alte reguli) și au fost marcate ca atare; nu se aplică direct.
- Căutarea nu a acoperit termenele de plată B2B (Legea 72/2013 în vigoare la data scrierii; neverificat) și regulile de situații de lucrări.
