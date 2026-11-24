# 09 – Stoc, scule, mașini (cercetare 2026-11-24)

Marcaje: [C] pagină citită integral de agent / [S] doar din rezumatul căutării / [E] estimare. Majoritatea surselor sunt bloguri de furnizori de soft (US), deci sunt poziționare comercială, nu studii independente. Nu am găsit niciun forum românesc de instalatori cu discuție utilă despre stoc; Mike Holt (403 la citire) și ECN apar doar în rezumate [S]. Nu am date despre costul real al furtului în firme de instalații.

## 1. Stoc pe mașină vs depozit
- Practica din industrie: depozit, fiecare mașină și lucrarea sunt locații separate de stoc; materialul circulă furnizor -> depozit -> mașină -> lucrare [S] ([Ply](https://www.getply.com/blog/truck-inventory-management-software/), [SimPro](https://www.simprogroup.com/blog/plumbing-inventory-management-best-practices)). SimPro recomandă reconcilierea zilnică mașină vs fișa lucrării [S].
- Reaprovizionare: alertă automată când stocul de pe mașină scade sub prag; costul invocat este o cursă la magazin care transformă o intervenție de 90 min în 4 ore. Citat dintr-un contractor: „Being notified when something is low automatically, is awesome" [C] ([Remarcable](https://www.remarcable.com/blog/how-electrical-contractors-track-materials)).
- Fluxuri-cheie la furnizorii de soft: reaprovizionare pe mașină, scanare cod de bare, cereri din teren către birou, consum pe lucrare, offline [S] ([Ply](https://www.getply.com/blog/truck-inventory-management-software/)).
- Cum lucrează cei mici (forum, [S]): șeful de echipă ține o fișă de materiale sau numără la sfârșitul lucrării mici; alt poster verifică doar factura de materiale vs manoperă și venit ca să vadă dacă marja scade; altul spune că cine ține stoc are nevoie de un responsabil de stoc, nu electricianul ([Mike Holt](https://forums.mikeholt.com/threads/truck-inventory-best-practices.147793/post-2317549), [ECN](https://www.electrical-contractor.net/forums/ubbthreads.php/topics/158644.html)).
- Cablul pe bobină parțial consumat e punctul orb clasic: nu se numără, se pierde în tăcere [C] (Remarcable); la cupru scump devine și risc de furt [C].
- Concluzie [E]: la echipe de 2-5 oameni, scanarea întregului stoc nu se va face; ce supraviețuiește e „lista pe mașină" (ce ar trebui să fie în dubă) cu scădere la bifarea materialului pe lucrare.

## 2. Materiale pe lucrare, pierderi, furt
- Audit uzual: compari materialele din lucrările închise cu facturile furnizorului / bonurile de ieșire din magazie; diferența arată scurgerea [S] (SimPro).
- Lipsa documentelor de intrare/ieșire din magazie slăbește orice acuzație de furt; în dispute de muncă din Cluj angajatorul a pierdut teren fiindcă nu avea comisie de inventariere și proces-verbal [S] ([legeaz.net](https://legeaz.net/spete-litigii-munca-cluj-2013/sentinta-civila-2699-2013-cluj-a7z), [avocatnet](https://www.avocatnet.ro/forum/discutie_24989/inventar-scule-firma.html)). Nu sunt sfaturi juridice; răspunderea materială (Codul muncii) trebuie validată cu un jurist.
- Cumpărături urgente de la magazin: nu am găsit practică documentată. [E] Se plătesc cu banii/cardul tehnicianului sau al firmei, bonul ajunge târziu sau deloc; legătura bon -> lucrare -> mașină există deja ca idee în sinteză (poză bon).

## 3. Scule scumpe (aparate de măsură, sertizare, scări)
- Soft de scule: check-out pe tehnician + lucrare, dată de întoarcere, stare la check-in, alertă la neîntoarcere [S] ([Redbeam](https://redbeam.com/asset-tracking/tool-inventory-software/), [Upkeep](https://upkeep.com/product/tool-tracking/)).
- Calibrare: dată scadentă și certificat pe fișa sculei; unele sisteme blochează predarea unui aparat cu calibrarea expirată [S] ([Net-Inspect](https://net-inspect.com/solutions/toolcalibration)). Atenție: unele produse urmăresc doar locul, nu și calibrarea (Upkeep le separă) [S].
- Prevenție furt din dubă (UK/NZ): scule scoase din dubă noaptea, marcare cu telefon/serie, alarmă, parcare vizibilă [S] ([Construction Enquirer](https://www.constructionenquirer.com/?p=241582), [BRANZ](https://www.branz.co.nz/design-build/articles/protecting-your-site-against-theft)). Seria sculei e utilă și la dovada în România (valoare de înlocuire) [S].
- Proces-verbal de predare-primire pentru echipament de muncă: recomandat, deși inventarul nu e obligatoriu în toate cazurile [S] ([e-juridic](https://e-juridic.manager.ro/articole/proces-verbal-predare-primire-30126.html)).

## 4. Distribuitori
- Soft-urile mari integrează comenzi EDI/API, potrivire factură-comandă, alertă când distribuitorul nu respectă prețul convenit; „maverick spend" (cumpărat în afara contractului) estimat 20-35% din cheltuieli, cifră a unui vendor [C] (Remarcable).
- Retururi: regulile diferă pe vânzător; exemplu producător: WAGO cere aviz prealabil, număr RMA, valoare minimă 500 RON, retur în 30 zile [S] ([WAGO](https://www.wago.com/ro/retururi-reclamaţii/retururi)).
- NU am găsit confirmat ce distribuitori RO oferă cont B2B, listă de prețuri cu discount sau API. Trebuie întrebat direct la 3-5 firme de instalații și la distribuitori. [lacună]

## 5. Flotă
- ITP: sursele se contrazic pentru utilitare sub 3,5 t (2 ani într-un text care citează OG 81/2000, anual în alte surse); ITP cere RCA valabil; la expirare înmatricularea se suspendă [S] ([Avocatnet](https://www.avocatnet.ro/articol_11270/Obligatia-de-a-efectua-Inspectia-Tehnica-Periodica-a-autovehiculelor.html), [Capital](https://www.capital.ro/itp-2026-inspectia-tehnica-de-la-6-luni-la-ce-interval-trebuie-facuta-verificarea-in-functie-de-masina.html)). Consecință: periodicitatea ITP trebuie să fie câmp editabil pe mașină, nu constantă în cod.
- Revizii, combustibil, GPS: nu am găsit surse noi utile în acest tur. [lacună]

## Ce înseamnă pentru ElectroField
| # | Funcție | Prioritate | Pentru cine |
|---|---|---|---|
| 1 | Stoc pe locații: depozit, fiecare mașină, lucrare. Listă „ar trebui să fie în dubă" cu cantitate țintă și prag minim per mașină | mare | birou, patron |
| 2 | Consum pe lucrare din telefon: bifare dintr-o listă scurtă a mașinii (cu cantitate rapidă), scade stocul mașinii și alimentează marja; offline | mare | tehnician |
| 3 | Cerere de reaprovizionare: tehnicianul apasă „îmi lipsește X"; biroul primește lista de reaprovizionat per mașină, cu alertă sub prag | mare | tehnician, birou |
| 4 | Achiziție urgentă: ecran „am cumpărat de la magazin" = poză bon + articole + lucrare + mașină; devine consum și cheltuială într-un pas | mare | tehnician, birou |
| 5 | Registru scule: serie, valoare, deținător curent (tehnician/mașină), predare-primire cu semnătură/confirmare în app, stare la întoarcere | medie | birou, patron |
| 6 | Aparate de măsură legate de Conformitate: la alocarea pe lucrare, avertizare/blocare dacă calibrarea expiră (ex. cele necesare la buletine) | medie | tehnician, birou |
| 7 | Raport de discrepanță lunar: materiale cumpărate (bonuri/facturi) vs materiale puse pe lucrări, pe mașină, plus bobine/cablu estimate | medie | patron |
| 8 | Mașini: ITP/RCA/revizie cu periodicitate editabilă per mașină, alertă și pe telefon; kilometraj/combustibil doar opțional | medie | birou |
| 9 | Inventar periodic al mașinii (30 de secunde, la cerere): confirmă lista, diferențele se înregistrează ca pierdere cu motiv | mică | tehnician, patron |
| 10 | Cont distribuitor: câmpuri preț listă vs preț negociat pe articol și furnizor; import comandă/factură (după validare cu distribuitori reali) | mică | birou |

Ipoteză de validat în interviuri: cât din stocul pe mașină ține efectiv o firmă de 2-5 oameni și dacă acceptă disciplina de bifare pe lucrare.
