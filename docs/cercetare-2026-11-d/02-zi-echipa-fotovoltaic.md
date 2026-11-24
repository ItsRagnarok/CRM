# Ziua unei echipe de montaj fotovoltaic: ce notează, ce predă, ce nu găsim online

Data: 2026-11-24. Etichete: [C] confirmat pe pagină/document citit; [S] doar din rezumat de căutare; [E] estimare/cunoaștere generală, fără sursă citită.

**Limită cinstită.** Nu am găsit pe web: (a) un forum de instalatori români cu descrierea zilei de lucru, (b) lista exactă de poze cerută de operator sau AFM, (c) norme de lucru la înălțime specifice instalatorilor PV. Secțiunile 1–2 sunt deci în mare parte [E] și trebuie validate cu 2–3 instalatori reali. Ce e documentat mai jos: dosarul AFM baterii și pașii de punere în funcțiune din manualele Huawei/Fronius.

## 1. Fluxul real al unei lucrări [E, cu repere citite]
- **Vizita tehnică** (1 om, 1–2 h): tip acoperiș, stare, înclinare/orientare, suprafață utilizabilă, umbriri (coș, copaci, vecini), poze, tablou existent, traseu cabluri DC/AC, loc invertor. Criterii citite: stare acoperiș, capacitate portantă, material (țiglă ceramică/beton/tablă), orientare/înclinare/umbrire reduc suprafața utilă [C: https://www.wall-street.ro/articol/energie/ce-verifici-la-acoperis-inainte-sa-instalezi-panouri-fotovoltaice-pe-casa — advertorial E.ON]. Umbrirea parțială pe un șir în serie afectează tot șirul, de aici microinvertoare/optimizatoare [S: Wall-Street.ro, alt articol].
- **Echipa** (2–5 oameni cu mașină, vezi sinteza): șef de echipă (autorizat ANRE, răspunde de montaj electric și PV), 1–2 ajutori pe acoperiș, eventual electrician separat pentru AC/tablou. Rolurile exacte [E].
- **Logistică** [E]: panourile pe paleți, depozit sau livrare directă; invertorul și bateria (grele) ridicate de 2 oameni; verificare la recepție (deteriorări, cantități, serii). Aceasta e ipoteză, nu am sursă.
- **Siguranță la înălțime** [E]: fără sursă găsită. Orice funcție legată de asta (checklist EIP, instruire) trebuie întrebată instalatorilor, nu presupusă.

## 2. Ce se măsoară și se notează la punerea în funcțiune (din manuale)
- **Huawei SUN2000**: multimetrul pe DC trebuie să măsoare cel puțin 1500 V; valoare negativă = polaritate inversată; curentul șirului trebuie să scadă sub 0,5 A înainte de oprirea comutatorului DC; panourile dintr-un șir trebuie să aibă aceleași specificații [S: https://solar.huawei.com/en/products/SUN2000-8-10K-LC0/faq și manuale SUN2000 citate în rezumat]. Tabel de verificare la punere în funcțiune în manual: montaj invertor, antenă WLAN, cabluri, legare la pământ, comutatoare, borne nefolosite acoperite [S].
- **Rezistență de izolație**: se conectează fiecare șir pe rând; dacă alarma „Low Insulation Resistance” persistă la ~1 minut după alimentarea DC, aplicația arată poziția defectului ca procent pe șir (±1 modul) [C: pagina FAQ Huawei de mai sus]. Pentru sisteme cu optimizatoare: rezistență șir ≈ N × 1 kΩ [S].
- **Oprire rapidă**: funcționează doar dacă toate panourile au optimizatoare; tensiunea scade sub 30 V în 30 s; se recomandă testare periodică [C: aceeași pagină].
- **Fronius GEN24**: punere în funcțiune din aplicația Solar.start (QR de pe plăcuță), apoi adăugare sistem și componente în Solar.web; actualizare firmware înainte de predare [S: https://manuals.fronius.com/html/4204102564/en-US.html și pagini Fronius „installation guide gen24”]. Nu am găsit un formular de predare/semnătură oficial Fronius.
- **Voc/Isc ca valori de înregistrat și poze obligatorii**: nu apar ca cerință în nicio sursă găsită (Huawei: negăsit). Practica „măsor Voc/Isc pe șir și notez” e uzuală [E], dar formatul îl decide firma.
- **Growatt**: nu am citit niciun ghid; negăsit.

## 3. Dosar operator și AFM
- **Prosumator, pașii** (aviz tehnic de racordare, certificat de racordare, probe, proces-verbal de recepție depus de prosumator/reprezentant după perioada de probă) [S: rezultate despre procedura ANRE și ghidul Electrica; https://www.distributie-energie.ro/wp-content/uploads/2023/12/Ghidul-prosumatorului.pdf nu l-am citit]. Lista exactă de documente și fotografii: negăsită; manualul E-Distribuție 2024 a dat 404.
- **AFM Casa Verde Baterii** (ghid consolidat după consultare, septembrie 2026; poate fi încă proiect) [C: https://startupcafe.ro/wp-content/uploads/2026/09/Ghid-Baterii-CONSOLIDAT-dupa-consultare-1.pdf]:
  - Instalatorul trebuie să fie **validat** (contract de participare); beneficiarul îl selectează în aplicație, iar dacă instalatorul nu îl preia în 5 zile, beneficiarul poate alege altul.
  - Implementare în max. 12 luni de la lista aprobaților (18 dacă s-a cerut actualizarea certificatului de racordare la timp). Perioadă de decontare 24 de luni; după ea nu se mai pot depune cereri.
  - Instalatorul face avizele, instalează, pune în funcțiune și cere **reemiterea certificatului de racordare cu capacitatea de stocare**.
  - Condiții baterie: min. 10 kWh, fără plumb, garanție min. 5 ani, min. 5.000 cicluri, BMS cu temperatură/tensiune/curent.
  - **Factura** trebuie să conțină distinct: valoare totală, contribuție proprie, sumă AFM, caracteristici și capacitate, nr./data certificatului actualizat, locul de consum, mențiunea AFM și **cod QR** (nr./data facturii, adresa, nume/CNP, certificat, kWh); se emite doar după aprobarea proiectului.
  - **Decontare**: cerere + listă beneficiari cu semnătură electronică calificată; la fiecare beneficiar doar factura și certificatul actualizat; plata în max. 60 de zile; dacă instalatorul are peste 10 beneficiari, se cer la decontare minim 10 sisteme odată; fără avansuri.
  - Ghidul **nu cere poze sau serii** la decontare (în textul citit). Tot ce se cere e factura + certificatul.
- AFM nu mai finanțează panouri în 2026 [S, din sinteza existentă].

## 4. Predare, service, garanție
Nu am găsit surse pentru instruirea clientului, service anual sau fluxul garanție/alarme. Din manuale: alarmele se văd în aplicația producătorului (FusionSolar/Solar.web), deci diagnosticul de la distanță depinde de accesul instalatorului la contul sistemului [C pentru Huawei alarme/izolație; S pentru Fronius]. Restul [E].

## Ce înseamnă pentru ElectroField
1. **Fișă de punere în funcțiune pe string** (tehnician; mare): câmpuri configurabile pe model invertor: nr. string, Voc, Isc, polaritate OK, izolație OK, oră/temperatură; notate în app, offline. Fiindcă nu există format oficial, șablonul e editabil pe firmă.
2. **Serii echipamente scanate** (tehnician; mare): scanare cod bară/QR pentru panouri, invertor, baterie; legate de lucrare, client și garanție. Necesar pentru service și AFM baterii.
3. **Pași AFM baterii în dosar** (birou; mare): validare instalator, selecție beneficiar (termen 5 zile), termen 12/18 luni, cerere actualizare certificat racordare, termen de decontare 24 luni, condiții baterie (kWh, ciclu, garanție) ca verificări înainte de ofertă. Parametrii versionați, ghidul poate fi încă modificat.
4. **Generator de factură AFM** (birou/patron; medie): câmpurile obligatorii și mențiunea, cod QR; blocare emitere înainte de „proiect aprobat”.
5. **Poze cu categorii în checklist de dosar** (tehnician; medie): categorii definite de firmă (acoperiș, șiruri, invertor, tablou, etichete serie); nu pretindem că sunt cele cerute de operator.
6. **Fișă vizită tehnică** (tehnician/birou; medie): acoperiș, umbrire, tablou existent, poze, schiță; deschide automat oferta și lucrarea.
7. **Predare cu client** (client/tehnician; medie): checklist cu pașii aplicației invertorului, semnătură în app, trimitere automată PDF cu serii și garanții prin link de status.
8. **Registru instalații livrate + service anual** (patron/birou; medie): reamintire anuală, istoric alarme introdus manual la început; integrarea cu API-urile Huawei/Fronius doar după validare cu clienți (mică).
9. **Checklist siguranță la înălțime / EIP** (tehnician; mică până la validare): nu am sursă, de întrebat în interviuri înainte de a construi.

Sursă de validat urgent: 2–3 interviuri cu instalatori PV pentru poze obligatorii și zi de lucru reală.
