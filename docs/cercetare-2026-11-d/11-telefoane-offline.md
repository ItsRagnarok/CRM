# 11. Telefoane, rețea și offline pe teren în România

Data: 2026-11-24. Etichete: [C] confirmat pe pagină citită / [S] doar din rezumat / [E] estimare. Sursele sunt puține: nu am găsit date publice RO despre telefoanele tehnicienilor, acoperire indoor/subsol sau ghidul ANSPDCP pentru geolocalizare. Le spun explicit mai jos.

## 1. Ce știm despre telefoane

- **Android domină, iOS e substanțial.** Statcounter, doar mobil, România 2026: Android ~69–80%, iOS ~19–31%, în funcție de lună. Octombrie 2026: Android 73,8%, iOS 26,2% [S, rezumat de căutare; paginile Statcounter nu le-am citit integral]. https://gs.statcounter.com/os-market-share/mobile/romania. Sunt trafic web, deci tind spre utilizatorii urbani; pentru tehnicieni cu telefon de serviciu ieftin, Android e probabil mai mare [E].
- **Versiuni Android (oct. 2026, mobil+tablete RO):** Android 16 ~42,6%, 15 ~14,5%, 14 ~12,6%, 13 ~11,1%, 12 ~6,3%, 11 ~4,6% [C pe pagină, dar potrivirea cifră-versiune e din ordinea etichetelor din grafic]. https://gs.statcounter.com/android-version-market-share/mobile-tablet/romania. Concluzie: minSdk 24 (Android 7) din aplicația noastră e mai larg decât necesar; WebView-ul vechi e riscul real, nu API-ul [E].
- **ANCOM, terminale (dec. 2025):** ~9 din 10 telefoane active suportă 4G, VoLTE și GNSS; aproape 50% sunt compatibile 5G [S]. https://www.ancom.ro/wp-content/uploads/2026/07/Studiu-statistic-privind-unele-capabilitati-tehnice-ale-terminalelor-mobile-iunie-2026-4.pdf
- **Rugged:** Samsung Galaxy XCover7 Pro (Snapdragon 7s Gen 3, 6 GB, baterie 4.350 mAh, MIL-STD-810H, Gorilla Glass Victus+, lansare 2025, ~609 € la lansare) [S]. https://www.notebookcheck.net/Samsung-Galaxy-XCover7-Pro-rugged-phone-launches-with-Snapdragon-7s-Gen-3-SoC-and-4-350-mAh-battery.999131.0.html . XCover are butoane fizice programabile și ecran utilizabil cu mănuși, dar nu am confirmat asta pe o pagină citită [E]. **Nu am găsit** nicio informație despre Blackview/Doogee în RO (cote, utilizare de electricieni, politică de update), nici prețuri în lei, nici cât de des îl cumpără firmele mici. Regula practică: telefoane rugged ieftine au adesea Android vechi și patch-uri rare și ROM-uri cu gestionare agresivă a bateriei [E].
- **Nu există** date găsite despre telefoane personale vs de serviciu în firme RO mici. Ipoteza de lucru: mulți tehnicieni folosesc telefonul personal (BYOD) [E].

## 2. Rețea: subsoluri, blocuri, rural

- ANCOM S2 2025: ~22,3 mil. conexiuni mobile active, 19,5 mil. pe 4G/5G; 5G a crescut cu 45% în 2025 (>5 mil.) [S]. Trafic de date: 4G ~91% [S]. https://www.mobilissimo.ro/stiri-diverse/retelele-5g-castiga-teren-in-romania-2025
- **Nu am găsit** măsurători publice ANCOM pentru acoperire indoor, subsol sau rural mobil. O cifră veche (nedatată) despre 1.100 de localități fără conectivitate nu o folosesc [S, nesigură].
- Din fizică, nu din date: subsolurile, centralele termice, firidele de contoare, casele scărilor și halele metalice pierd semnalul sau îl au intermitent [E]. Deci "offline" nu e caz rar, ci cazul normal exact la lucrările din gaze/electric de bloc.

## 3. Baterie și procese omorâte de sistem

- dontkillmyapp.com: Huawei, Xiaomi, OnePlus, Samsung au scorul maxim (5/5) de agresivitate, Oppo 4 [C]. https://dontkillmyapp.com/ . Pașii pe producător nu i-am citit direct; din ghiduri secundare [S]: Samsung → "Never sleeping apps", Huawei → dezactivat "Manage all automatically" + pornire automată + rulare în fundal, Xiaomi → blocare în recents + autostart. https://help.biolovision.net/Keep_Background_Services_Alive_on_Android_(by_Brand) . Samsung One UI 3+ pune aplicațiile în "deep sleep" (servicii oprite, alarme amânate, rețea blocată) [S].
- Tehnici pentru Capacitor [C]: foreground service cu notificare persistentă; verificare `isIgnoringOptimizations` la pornire și înainte de tracking; cerere de exceptare **după** explicarea motivului, apoi reverificare la revenire; text clar în notificare reduce oprirea forțată; re-verificare la fiecare sesiune (setările Samsung se schimbă); testare pe telefoane reale Xiaomi/Samsung/Huawei, nu pe Pixel sau emulator. https://dev.to/szymonwalczak/surviving-android-battery-killers-in-capacitor-apps-4im7
- **Starea codului nostru** [C, citit în repo]: `android-app/capacitor.config.ts` folosește WebView către site-ul live, `useLegacyBridge: true`, `CapacitorHttp` activat; plugin `@capacitor-community/background-geolocation` (foreground service), push FCM. AndroidManifest cere în sursă doar INTERNET (restul vine din plugin-uri la build, de verificat). `docs/plan-aplicatie-v2.md` listează offline (outbox IndexedDB) ca "neînceput".
- **Lipsă importantă:** un WebView care încarcă URL-ul live arată o pagină de eroare Chrome când nu e rețea la pornire; Next.js nu servește nimic din cache dacă nu avem service worker [E]. Plan: service worker + outbox acoperă doar ce a fost deja încărcat.

## 4. Teren: mănuși, soare, GDPR

- Mănuși și soare: **nu am găsit surse** specifice. Reguli generale de proiectare [E]: ținte de atingere ≥48 px, text ≥13 px (sinteza notează deja 10,5 px în ~63 de locuri), contrast mare (tab inactiv ~2,6:1 e sub limită), fără gesturi fine (swipe, long-press), tema deschisă implicită la soare. Ecranele capacitive nu merg cu mănuși groase; XCover are mod "glove" [E].
- **GDPR:** poziția geografică a unui angajat cu vehicul atribuit e dată personală; autorități UE (CNIL, CNPD Luxemburg) cer scop limitat (nu control de viteză/program), informare individuală (un autocolant nu ajunge), retenție definită și respectată; amendă CNPD 2.800 € pentru retenție excesivă și informare incompletă [S]. https://elvingerhoss.lu/publications/guidelines-regarding-geolocation-vehicles-made-available-employees . **Nu am găsit** ghidul ANSPDCP, nici nimic despre BYOD în RO. Presupunere de proiectare: pe telefon personal, tracking doar în program și cu pornire/oprire vizibilă pentru tehnician [E]. Necesită verificare cu un jurist.

## Ce înseamnă pentru ElectroField

| # | Funcție / modificare | Prioritate | Pentru cine |
|---|---|---|---|
| 1 | **Pagină offline de rezervă + service worker**: la pornire fără rețea, aplicația arată lucrările zilei din cache (adresă, client, fișe), nu eroarea Chrome | mare | tehnician |
| 2 | **Outbox offline** (IndexedDB) pentru poze, semnătură, pontaj, închidere lucrare; bandă vizibilă "3 elemente de trimis" și retrimitere automată; "salvat pe telefon" distinct de "trimis" | mare | tehnician, birou |
| 3 | **Asistent la prima pornire "Ține aplicația activă"**: detectează producătorul, verifică exceptarea de baterie, cere permisiunea după explicație, arată pași pe marcă (Samsung/Xiaomi/Huawei) cu capturi; reverificare la fiecare sesiune | mare | tehnician |
| 4 | **Indicator de sănătate GPS pentru birou**: "ultimul ping acum 40 min, probabil telefon în repaus/baterie" pe harta live, cu mesaj spre tehnician, ca să nu se creadă că omul a oprit tracking-ul | mare | patron, birou |
| 5 | **Tracking GPS legat de program/lucrare**: pornește la "Încep ziua", se oprește la "Termin ziua", notificare persistentă cu text clar; ecran de consimțământ și informare (scop, retenție, fără control de viteză); retenție configurabilă (ex. ștergere automată) | mare | tehnician, patron |
| 6 | **Mod mănuși/soare** în setări: butoane mari, text mărit, contrast ridicat, fără gesturi fine; text minim 13 px în ecranele de lucru | medie | tehnician |
| 7 | **Alerte importante și pe SMS/WhatsApp ca rezervă** când tokenul push e mort sau telefonul în deep sleep; contorul "ultimul push livrat" | medie | birou, tehnician |
| 8 | **Verificare versiune WebView/Android** la pornire; mesaj "actualizează Android System WebView" dacă e prea vechi; ridicarea minSdk după ce se măsoară flota reală | medie | birou |
| 9 | **Câmp "telefon de serviciu / personal"** pe tehnician, care schimbă textul de informare și regulile de tracking (doar în program pe personal) | medie | patron |
| 10 | **Test pe 3 telefoane reale** (Samsung A-series, Xiaomi/Redmi, un rugged) înainte de lansare: tracking 2 h cu ecran stins, după repornire, după 24 h | mică (proces) | echipa de produs |

## Întrebări deschise
Ce telefoane au clienții noștri reali? Fără 5–10 interviuri/sondaj scurt, toate cifrele de mai sus rămân ipoteze. Statcounter nu reprezintă tehnicienii.
