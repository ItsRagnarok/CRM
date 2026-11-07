# Cercetare: firme de instalare fotovoltaică din România

Data cercetării: 2026-11-07. Doar citire web; nimic altceva modificat în repo.

## 0. Cum să citești marcajele și limitele

- **VERIFICAT**: pagina a fost deschisă și citită de mine, iar informația apare consecvent în cel puțin două surse, sau într-o sursă care citează articolele din ordin.
- **SECUNDAR**: o singură sursă de presă, ghid sau agregator, fără confirmare încrucișată.
- **ÎNCREDERE SCĂZUTĂ**: blog comercial sau de vendor, snippet de căutare neconfirmat, sau cifre care se contrazic între surse.
- **Limită importantă**: nu am putut citi textul oficial al Ordinului ANRE 19/2022 (PDF-ul Rețele Electrice a venit binar). Nicio cifră de termen nu este deci confirmată pe textul normativ. Înainte de a codifica termene în produs, validați pe `lege5.ro` / `legislatie.just.ro` / ANRE.
- Nu am găsit threaduri de forum cu experiențe de instalatori (căutarea a returnat presă și ghiduri). Secțiunea de probleme se bazează deci pe presă, asociații (APCE) și surse comerciale. Grupurile Facebook și forumurile (ex. Comunitatea Prosumatorilor) trebuie intervievate direct.
- Căutarea a fost făcută cu un instrument care rezumă paginile, așa că unele rezumate au greșeli (ex. un rezumat a tradus "ATR" drept "autoritatea vamală"; l-am ignorat).

## 1. Profil: cine sunt clienții noștri

| Segment | Ce fac | Observații |
|---|---|---|
| Mici instalatori casnici (PFA/SRL, 2-15 oameni) | Sisteme de 3-10 kWp la case, deseori cu invertor hibrid și baterie | Majoritatea volumului. Mulți au intrat în piață prin Casa Verde. SECUNDAR |
| Instalatori comerciali / mici EPC | 27-400 kWp pentru IMM, ferme, hale | Prag regulator important: 400 kW pe loc de consum. VERIFICAT |
| Subcontractori montatori | Echipe care montează structura și cablajul pentru o firmă mamă | Legătura cu atestatul ANRE nu e clară (vezi întrebări deschise) |

Context de piață:
- Peste 96.000 de prosumatori racordați la rețelele de distribuție la o dată neclară din 2024-2025 (SECUNDAR, https://hotnews.ro/fenomenul-fotovoltaicelor-numarul-prosumatorilor-racordati-se-apropie-de-100-000-iar-puterea-instalata-este-aproape-ct-a-doua-reactoare-nucleare-32739).
- Peste 63.000 de prosumatori în aprilie 2023, cu creștere de 50% în patru luni (SECUNDAR, https://www.euronews.ro/articole/lungul-drum-al-prosumatorului-pana-la-castig-romanii-care-isi-produc-singuri-ener).
- APCE susține că Casa Verde Fotovoltaice a ajutat peste 100.000 de familii (SECUNDAR, https://newsweek.ro/economie/adio-panouri-fotovoltaice-cu-bani-de-la-stat-in-2026-prin-casa-verde-se-aloca-fonduri-doar-pentru-baterii).
- Reper de preț comercial: 2.200-3.800 lei/kWp în 2026 (ÎNCREDERE SCĂZUTĂ, ofertă comercială, https://startupcafe.ro/p-de-ce-firma-ta-poate-primi-oferte-la-panouri-fotovoltaice-cu-diferente-mari-de-pret-cum-le-compari-101936).

### Schimbări de context care afectează produsul (2025-2026)

1. **Casa Verde Fotovoltaice nu finanțează panouri în 2026.** Proiectul de buget AFM 2026 (consultare publică, mai 2026) prevede doar 400 mil. lei pentru baterii de stocare. Stare finală a bugetului neconfirmată. SECUNDAR, mai multe surse concordante: https://newsweek.ro/economie/adio-panouri-fotovoltaice-cu-bani-de-la-stat-in-2026-prin-casa-verde-se-aloca-fonduri-doar-pentru-baterii, https://www.mobilissimo.ro/stiri-diverse/casa-verde-fotovoltaice-dispare-din-bugetul-afm-2026. Consecință: modulul AFM este util pentru dosare istorice (sesiunea 2024, prelungiri de execuție) și pentru o eventuală sesiune de baterii, nu ca flux principal.
2. **TVA**: de la 1 august 2025 cota redusă de 5% a fost eliminată, cota standard e 21%. Avansurile încasate la cota veche, cu livrare după 1 august 2025, se regularizează la 21% (SECUNDAR, https://newsweek.ro/economie/ai-dat-avans-cu-tva-9-pentru-casa-panouri-fotovoltaice-pregateste-banii-pentru-diferenta-de-tva și https://static.anaf.ro/static/10/Ploiesti/modificari_tva.pdf). Sursele nu sunt consecvente asupra cotei de dinainte (5% sau 9%), ÎNCREDERE SCĂZUTĂ pentru acel detaliu.
3. **Legea 160/2026** (modifică Legea 123/2012), aplicabilă din 26 iulie 2026: facturare și decontare lunară a energiei livrate, eliminarea reportării excedentului pe 24 de luni, compensare cantitativă până la 400 kW, scutire de dezechilibre până la 900 kW, plafon de facturare extins de la 27 la 900 kW; ANRE trebuie să actualizeze metodologia, fără termen. SECUNDAR, o singură sursă citită: https://contabilul.manager.ro/a/30170/5-noutati-importante-pentru-prosumatori-introduse-prin-legea-nr-1602026.html. Consecință: calculele de recuperare a investiției din oferte se schimbă; platforma trebuie să permită parametri de calcul versionați.

## 2. Fluxul complet (de la lead la service)

Fluxul de mai jos combină surse de ghid (SECUNDAR) cu termenele din procedura ANRE citate de ghiduri. Termenele se numără de la dosarul complet, iar un dosar incomplet oprește ceasul (VERIFICAT, apare în ambele ghiduri citite: https://instalatori-fotovoltaice.ro/ghid/aviz-tehnic-racordare-atr-prosumator-2026 și https://instalatori-fotovoltaice.ro/ghid/certificat-de-racordare-prosumator-2026).

| # | Etapă | Cine face | Ce se produce | Termen / notă |
|---|---|---|---|---|
| 1 | Lead | Marketing, recomandare, comparatoare de oferte | Contact, factură de energie, tip acoperiș | Fără termen regulat |
| 2 | Vizită tehnică | Instalator / proiectant | Măsurători, umbrire, tablou electric, loc de montaj invertor | O ofertă serioasă include vizită (SECUNDAR, startupcafe) |
| 3 | Ofertă și dimensionare | Vânzări / inginer | kWp DC, kW AC invertor, baterie, listă echipamente cu marcă și model, preț | Oferta trebuie să arate explicit tablou AC, manoperă, dosar prosumator (SECUNDAR) |
| 4 | Contract și avans | Client + firma | Contract de execuție, avans | Avansul "tipic" nu are o valoare standard găsită; ÎNCREDERE SCĂZUTĂ pe orice procent |
| 5 | Cerere ATR | Client sau instalatorul împuternicit, prin portalul operatorului | Cerere tip, act proprietate, plan de situație, memoriu tehnic și schemă monofilară, fișă invertor | Schema și memoriul se semnează de proiectant autorizat ANRE (SECUNDAR). Depunerea fizică nu mai e acceptată de DEER (SECUNDAR) |
| 6 | Emitere ATR | Operator de distribuție | Evaluare cerere, factură ATR, soluție tehnică | Evaluare și factură 5 zile lucrătoare, emitere 15 zile lucrătoare după plată (un ghid). Alt ghid: 20 zile lucrătoare total. Alt blog: 30 zile calendaristice sub 100 kWp (ÎNCREDERE SCĂZUTĂ). Termenul exact: de validat pe ordin |
| 7 | Contract de racordare și plată | Client + operator | Tarif de racordare, alegere executant (operator sau terț atestat) | Contract 3 zile lucrătoare, plată 15 zile calendaristice, execuție până la 90 zile calendaristice (SECUNDAR) |
| 8 | Comandă echipamente | Firma | Panouri, invertor (pe lista operatorului), structură, tablou | Invertor care nu e pe lista operatorului duce la respingere sau întârziere (SECUNDAR) |
| 9 | Montaj instalație de utilizare | Instalator atestat ANRE | Montaj, probe, priză de pământ | Instalator fără atestat duce la respingere dosar (SECUNDAR; confirmat și de cazul AFM 2023, https://economedia.ro/?p=148348) |
| 10 | Dosar certificat de racordare | Client/împuternicit | PV de recepție, buletin priză de pământ, certificate conformitate, schemă monofilară | Verificare dosar 2 zile lucrătoare; contor bidirecțional și acord probe 5 zile lucrătoare; probe maxim 5 zile lucrătoare; certificat 3 zile lucrătoare de la PV; punere sub tensiune finală 2 zile lucrătoare |
| 11 | Contract cu furnizorul | Client + furnizor | Contract de vânzare-cumpărare energie, certificatul ca anexă | Furnizorul trimite contractul în 10 zile lucrătoare (conform Ord. 15/2022, SECUNDAR). Se schimbă cu Legea 160/2026 |
| 12 | Predare și garanții | Firma | Documente, manual, acces monitorizare | Vezi secțiunea 4 |
| 13 | Decont AFM (doar dosare AFM) | Firma / client | Dosar la AFM după PIF | Vezi secțiunea 3 |
| 14 | Service și monitorizare | Firma | Tichete, garanție, curățare | Fără standard; vezi probleme |

Discrepanță de termen pe certificatul de racordare: ghidul instalatori-fotovoltaice.ro indică 3 zile lucrătoare de la PV (art. 29), iar asociația APCE citează art. 22 alin. 1 cu 10 zile lucrătoare de la dosarul complet (https://asociatiaprosumatorilor.ro/model-plangere-anre-pentru-prosumatorii-care-nu-au-primit-certificatele-de-racordare-de-la-operatorii-de-distributie/). Modelul APCE cere însă 3 zile, deci cele două cifre pot coexista (10 zile pentru tot dosarul, 3 zile după PV). Necesită verificare pe text.

Altă discrepanță: un reportaj Euronews din 2023 vorbea de un termen de 30 de zile pentru certificatul de prosumator și de amenzi neaplicate (SECUNDAR, datat, poate depășit).

## 3. AFM / Casa Verde: ce trebuie să suporte produsul

- **Mecanica** (SECUNDAR, din sesiuni vechi): beneficiarul înscris alege un instalator validat de AFM, semnează contract, plătește partea lui, iar AFM decontează instalatorului partea de grant. Sesiuni anterioare: până la 90% din cheltuielile eligibile cu plafon de 20.000 lei, apoi 30.000 lei pentru panouri plus stocare, minim 3 kW (https://economedia.ro/casa-verde-fotovoltaice-persoanele-fizice-si-bisericile-pot-accesa-finantare-de-cel-mult-20-000-de-lei-pentru-instalarea-de-panouri-fotovoltaice-care-sunt-etapele-programului-si-cum-se-vor-analiza-d.html, https://alba24.ro/programul-privind-instalarea-de-panouri-fotovoltaice-ghid-pentru-persoanele-fizice-care-vor-subventia-de-20-000-de-lei-696813.html). Cifrele pe sesiunea 2024 nu sunt confirmate.
- **Termene AFM** (SECUNDAR): ATR de comunicat la AFM în 90 de zile de la publicarea rezultatelor, apoi o fereastră de execuție de aproximativ 8 luni; AFM a prelungit termenul de execuție la 21 februarie 2025, fără dată nouă găsită (https://energynomics.ro/en/afm-extends-the-execution-deadline-for-projects-subsidized-through-casa-verde). Dacă termenul nu e respectat, costul instalației rămâne în sarcina beneficiarului (SECUNDAR, https://www.antena3.ro/actualitate/social/mii-de-romani-risca-sa-piarda-banii-din-programul-casa-verde-care-e-motivul-728417.html).
- **Documente la decont**: nu am găsit o listă oficială. De obținut din ghidul AFM al sesiunii 2024 de pe afm.ro.
- **Pentru firme/IMM**: nu am găsit program AFM sau PNRR activ în 2026 pentru panouri la IMM; o referință la un program 27-100 kWp pentru IMM e nedatată (ÎNCREDERE SCĂZUTĂ, document de primărie).
- **Anomalie**: ghidul Anexa 4 din cererea ATR este specific pentru AFM Casa Verde (SECUNDAR, ghid instalatori-fotovoltaice.ro). Produsul trebuie să poată alege varianta de formular.

## 4. Documente și cine semnează (sinteză)

| Document | Semnează / emite | Încredere |
|---|---|---|
| Cerere ATR (Anexa 1, sau 4 pentru AFM) | Client (sau împuternicit prin procură) | SECUNDAR; ghidul nu precizează semnatarul |
| Memoriu tehnic și schemă monofilară | Proiectant autorizat ANRE | SECUNDAR |
| Act proprietate / acord proprietar | Client / proprietar | SECUNDAR |
| Fișă tehnică și certificat conformitate invertor (invertor pe lista operatorului) | Producător / distribuitor | SECUNDAR |
| ATR | Operator de distribuție | VERIFICAT |
| Contract de racordare | Operator + client | SECUNDAR |
| Buletin priză de pământ | Verificator/laborator | SECUNDAR |
| PV de recepție a punerii în funcțiune | Prosumator sau împuternicit (art. 28 alin. 2) | SECUNDAR; cine semnează efectiv din partea executantului nu e clar |
| Certificat de racordare (completat cu calitatea de prosumator) | Operator, din oficiu | VERIFICAT (2 ghiduri) |
| Contract vânzare-cumpărare energie | Furnizor + client | SECUNDAR |
| Dosar AFM | Beneficiar + instalator validat | SECUNDAR |
| Garanții | Producătorii (panouri, invertor) și instalatorul (montaj) | vezi mai jos |

Garanții (ÎNCREDERE SCĂZUTĂ, exemple din oferte, nu normă): panouri 12 ani, invertor 5 ani, montaj 2 ani (https://engie.ro/wp-content/uploads/2025/02/Engie-Solar-AFM-Casa-Verde-2024.pdf); pentru panouri se cer 92,1% din putere după 10 ani și 83,1% după 25 (exemplu din licitație Moldova, irelevant ca normă RO). Regula practică: separă garanția producătorului de cea a instalatorului și cere-le în scris (SECUNDAR).

## 5. Top 10 probleme reale

1. **Operatorul întârzie certificatul / ATR / contorul.** Întârzieri de la 2-3 luni la un an în unele zone; contor bidirecțional livrat târziu. VERIFICAT prin mai multe surse: https://www.antena3.ro/actualitate/perioada-de-implementare-a-programului-casa-verde-fotovoltaice-2023-va-fi-prelungita-733197.html, https://www.euronews.ro/articole/lungul-drum-al-prosumatorului-pana-la-castig-romanii-care-isi-produc-singuri-ener, https://www.digi24.ro/stiri/economie/energie/pentru-ca-se-intarzie-racordarea-reteaua-nationala-pierde-multa-energie-verde-produsa-de-romanii-cu-panouri-fotovoltaice-2259877. Datele sunt 2023-2024; situația 2026 nu e confirmată.
2. **Operatorii cer date de acces la invertor (utilizator/parolă/aplicație) ca să emită certificatul**, practică pe care APCE o contestă ca fiind în afara procedurii (art. 41). SECUNDAR, o singură sursă: https://asociatiaprosumatorilor.ro/model-plangere-anre-pentru-prosumatorii-care-nu-au-primit-certificatele-de-racordare-de-la-operatorii-de-distributie/. Implicație directă pentru platformă: registru securizat de credențiale și acces la monitorizare.
3. **Instalatorii plătiți târziu de AFM**; unii au primit doar contribuția clientului pentru ~200 de sisteme. SECUNDAR: https://tvrinfo.ro/administratia-fondului-pentru-mediu-intarzie-plata-instalatorilor-pentru-panourile-fotovoltaice/, https://www.greenpeace.org/romania/articol/4913/instalatorii-se-tem-sa-monteze-in-programul-casa-verde-fotovoltaice-afm-nu-a-decontat-nicio-lucrare (sesiune veche). Problemă de cash-flow: firma finanțează echipamentele.
4. **Dosare AFM respinse sau declarate neeligibile**: documente cu termen expirat, jumătate din dosare respinse într-o sesiune, reverificare la decont, instalator fără atestat ANRE. SECUNDAR: https://adevarul.ro/economie/scandalul-fotovoltaicelor-afm-nu-isi-respecta-2028619.html, https://www.greenpeace.org/romania/?p=4351, https://economedia.ro/?p=148348. Programul 2023 a fost suspendat temporar printr-o hotărâre a Curții de Apel Oradea (https://romania.europalibera.org/amp/afm-casa-verde-fotovoltaice-suspendare-aplicare-instanta-bihoreana/32610364.html).
5. **Supraangajarea firmelor**: au luat mai multe contracte decât pot executa; ~20.000 de beneficiari au riscat să piardă grantul la termen; unii și-au schimbat instalatorul în ultimul moment. SECUNDAR: https://www.antena3.ro/actualitate/social/mii-de-romani-risca-sa-piarda-banii-din-programul-casa-verde-care-e-motivul-728417.html.
6. **Dosar ATR incomplet sau greșit** (invertor nelistat, depunere în alt canal, putere crescută fără ATR nou, confuzie ATR vs autorizație de construire) oprește ceasul. SECUNDAR: ghid ATR instalatori-fotovoltaice.ro.
7. **Schimbări de preț și fiscale**: TVA 5% la 21% din august 2025, avansuri regularizate; Legea 160/2026 schimbă calculul de randament pentru client. SECUNDAR (vezi secțiunea 1).
8. **Oferte necomparabile** (tablou AC, manoperă, dosar prosumator absente din unele oferte; materiale slabe pe buget fix). SECUNDAR: https://startupcafe.ro/p-de-ce-firma-ta-poate-primi-oferte-la-panouri-fotovoltaice-cu-diferente-mari-de-pret-cum-le-compari-101936, https://playtech.ro/2024/casa-verde-2024-alegerea-instalatorilor-la-ce-trebuie-sa-fie-atenti-viitorii-prosumatori/.
9. **Montaje defecte și service**: un caz cu montaj incorect și cerere de stabilizatoare de ~500 euro. SECUNDAR, un singur caz (Antena 3). Nu am găsit date despre volumul de tichete de service.
10. **Invertoare chinezești și securitate cibernetică**: Ministerul Energiei a avertizat; România fără laborator de testare; în Cehia 5 din 20 de modele au fost acreditate. SECUNDAR, citat de președintele APCE: https://playtech.ro/2024/casa-verde-2024-alegerea-instalatorilor-la-ce-trebuie-sa-fie-atenti-viitorii-prosumatori/. Nu am găsit surse despre penurie de echipamente sau variații de preț ale invertoarelor; aprovizionarea rămâne o lacună de cercetare.

Problema generală de tooling (ÎNCREDERE SCĂZUTĂ, vendori): firmele folosesc 5-8 unelte nelegate; permiterea/interconectarea e urmărită în foi de calcul pe care înțelege o singură persoană (https://www.sunbasedata.com/solar-crm, thread Reddit citat în rezultate). Contextul e predominant SUA.

## 6. Concurență și ce se poate învăța

(Toate sursele de mai jos sunt SECUNDAR sau ÎNCREDERE SCĂZUTĂ: bloguri de comparație ale altor vendori, fără acces la site-urile oficiale.)

- **OpenSolar**: gratuit pentru design, CRM de proiect (clienți, etape, sarcini, calendar), propuneri, e-semnătură; raportat plafon la ~500 kW; nu are lead pipeline detaliat. https://www.sourceforge.net/software/compare/OpenSolar-vs-Solargraf, https://www.sunbasedata.com/blog/exploring-aurora-solargraf-opensolar-what-tools-solar-teams-are-using-together.
- **Aurora Solar**: cel mai bun la design și propuneri interactive; fără CRM nativ; ~135 USD/utilizator/lună (anual). https://www.sunbasedata.com/blog/the-ultimate-guide-to-aurora-solar.
- **Solargraf**: design și propuneri, lead capture și pipeline (surse contradictorii dacă are CRM); legat de Enphase. https://www.capterra.com/p/224635/Solargraf/.
- Niciunul dintre cele trei nu generează scheme monofilare pentru autorizare (SECUNDAR, aceeași sursă). În România schema monofilară e document obligatoriu de ATR, deci este o oportunitate.
- Instrumentele sunt gândite pentru SUA (AHJ, utilități, ITC, financiere); fluxul românesc cu ATR, certificat de racordare, AFM și ANRE nu e acoperit. Aceasta este concluzia mea, nu o afirmație dintr-o sursă.
- **Zoho / CRM generic**: nu am găsit informații specifice; sursele generale spun că CRM-urile generice tratează permiterea ca simplă sarcină cu termen și necesită build custom pentru fluxuri solare (ÎNCREDERE SCĂZUTĂ, vendor Payaca: https://payaca.com/us/compare/generic-crms).

## 7. Nevoi pentru platformă

### MUST
1. **Pipeline de proiect cu etape românești** (lead, vizită, ofertă, contract, avans, ATR cerut, ATR emis, contract racordare, comandă, montaj, PV, certificat, contract furnizor, predat, decont AFM) cu data fiecărei etape.
2. **Urmărirea termenelor de operator**: ceas care pornește la "dosar complet", termene configurabile (ATR, certificat, contor), alertă când operatorul depășește termenul, șablon de reclamație și de petiție ANRE. Termenele trebuie să fie date de configurare, nu cod, din cauza discrepanțelor de mai sus.
3. **Registru de documente per proiect** cu stare, semnatar necesar, dată expirare (act proprietate, schemă, memoriu, certificate invertor, buletin priză, PV, certificat) și listă de verificare dinainte de depunere ("dosar complet").
4. **Ofertă cu linii obligatorii** (marcă și model invertor, tablou AC, manoperă, dosar prosumator, garanții pe componentă) și versionare a prețului; TVA configurabil cu regulă pentru avansuri peste schimbări de cotă.
5. **Cont de client și avans**: plăți, avans, restanțe, regularizare TVA.
6. **Registru de echipamente instalate**: serii, garanții per componentă cu date de început/sfârșit, document de garanție atașat.
7. **Service/tichete legate de instalație**, cu stare de garanție la deschidere.
8. **Acces securizat la credențiale de monitorizare ale invertorului** (cu consimțământ client), dată fiind cerința operatorilor de la problema 2.
9. **Roluri**: vânzări, tehnic/proiectant, montator extern, admin; montatorul extern vede doar proiectele lui.
10. **Comunicare cu clientul**: status vizibil (link public) pentru a reduce apelurile "unde e dosarul?".

### SHOULD
1. **Modul AFM** pentru dosare istorice: termene (90 de zile ATR, execuție), documente de decont, stare decont, cash-flow așteptat; arhivare pentru contestații.
2. **Planificare montaj** pe echipe, cu dependență de sosirea echipamentelor și de ATR/contract de racordare.
3. **Comandă echipamente**: listă de materiale din ofertă, furnizor, termen livrare, stare recepție.
4. **Evidența subcontractorilor**: atestat ANRE, valabilitate, asigurare, tarife, proiecte alocate.
5. **Calcul de randament** cu parametri versionați (Legea 160/2026: decontare lunară, fără report 24 luni).
6. **Liste de verificare de punere în funcțiune** și PV pregătit din date existente.
7. **Raport cash-flow pe proiect** (avans, echipamente plătite, încasări AFM).

### COULD
1. Import de producție din API-ul invertoarelor mari (monitorizare la distanță) pentru alerte de subperformanță.
2. Generare de schemă monofilară și memoriu tehnic pentru sisteme standard (diferențiator față de OpenSolar/Aurora, dar cere validare de proiectant autorizat; vezi întrebări).
3. Design 3D/umbrire (OpenSolar este gratuit; recomandare: integrare, nu construire).
4. Mementouri de curățare/revizie anuală și upsell de baterie.
5. Portal de comparare a ofertelor pentru client.
6. Raport pe operator (timp mediu real ATR/certificat per zonă), util intern ca estimare pentru clienți.

## 8. De evitat / irelevant

- **Design 3D complex de acoperiș și simulări în stil Aurora** ca nucleu: cost mare, piață cu alternativă gratuită (OpenSolar). Doar integrare.
- **Fluxuri specifice SUA**: AHJ, ITC/credite fiscale, financiere (loan/lease/PPA), NEM, utilități. Irelevant în România.
- **Modul public "mereu actualizat" cu lista de programe** (în afară de AFM istoric): nu am găsit program activ pentru panouri în 2026 și programele se schimbă anual.
- **Plată online / e-factura completă** în primul pas: contabilitatea firmelor se face deja în programe românești; mai util un export. (Aceasta este o presupunere neverificată.)
- **Marketing/lead gen** și reclame: nu am găsit semne că lead-ul este blocajul; blocajul este execuția și termenele.
- **Verificarea automată a "conformității" juridice** ca promisiune: textele s-au schimbat (Legea 160/2026), iar sursele se contrazic. Produsul trebuie să ofere termene editabile și să nu garanteze conformitatea.
- **Comunități comerciale de energie, PPA, vânzarea pe piață** (între 200 și 400 kW cu regularizare): marginal pentru prosumatori casnici și mici EPC în prima versiune.

## 9. Întrebări deschise (de validat cu interviuri sau pe text normativ)

1. Termenele exacte din Ordinul ANRE 19/2022 consolidat (ATR 15 vs 20 zile lucrătoare vs 30 zile; certificat 3 vs 10 zile lucrătoare) și dacă Ordinul 15/2022 a fost modificat de Legea 160/2026 (metodologia ANRE de actualizat).
2. Valabilitatea unui ATR (niciun ghid nu o precizează) și consecințele depășirii.
3. Cine semnează PV de recepție din partea executantului și ce atestat ANRE (tip B, grad IIIB etc.) trebuie să aibă firma; poate un montator subcontractat lucra sub atestatul firmei mamă?
4. Care este statutul real al unei sesiuni AFM pentru baterii în 2026-2027 (buget final, condiții, dacă panourile sunt incluse, rol de instalator validat)?
5. Lista oficială a documentelor la decont AFM (sesiunea 2024) și motivele recente de respingere, pentru 2025-2026.
6. Cât durează în prezent ATR și certificatul pe fiecare operator (Rețele Electrice, Delgaz, E-Distribuție, Distribuție Oltenia, Electrica)? Datele găsite sunt din 2023-2024.
7. Practica de avans și plată în etape la firmele mici: procente reale, clauze de actualizare de preț, ce se întâmplă la schimbarea prețului echipamentelor.
8. Cum sunt tratate aprovizionarea și prețurile pentru invertoare și panouri în 2026 (stocuri, distribuitori, rate de returnare)? Nu am găsit date.
9. Ce instrumente folosesc firmele azi (foi de calcul, Zoho, Bitrix, aplicații locale)? Nu am găsit date românești.
10. Ce cere piața de la monitorizare (cine deține contul, cine plătește) și cât de des cer operatorii acces la invertor?
11. Cerințe de securitate cibernetică pentru invertoare (listă operator, avertismente Ministerul Energiei): există o listă oficială care ar trebui reflectată în alegerea echipamentelor din ofertă?
12. Lege 123/2012 și prosumatori juridici peste 100 kW: obligații de autorizare, licență, fiscalitate, care schimbă documentele pentru segmentul comercial.

## 10. Lista surse folosite

Procedură și operatori: https://instalatori-fotovoltaice.ro/ghid/aviz-tehnic-racordare-atr-prosumator-2026, https://instalatori-fotovoltaice.ro/ghid/certificat-de-racordare-prosumator-2026, https://asociatiaprosumatorilor.ro/model-plangere-anre-pentru-prosumatorii-care-nu-au-primit-certificatele-de-racordare-de-la-operatorii-de-distributie/, https://www-prod.reteleelectrice.ro/wp-content/uploads/procedura-prosumatori-2022.pdf (nelizibil), https://lege5.ro/Gratuit/geydqnrzgi3ts/procedura-privind-racordarea-la-retelele-electrice-de-interes-public-a-locurilor-de-consum-si-de-producere-apartinand-prosumatorilor-din-02032022 (nedeschis).
Legislație 2026: https://contabilul.manager.ro/a/30170/5-noutati-importante-pentru-prosumatori-introduse-prin-legea-nr-1602026.html.
AFM și presă: Newsweek, Antena 3, Euronews, Digi24, TVR Info, Greenpeace, Adevărul, Economedia, Energynomics (linkuri în text).
Software: sunbasedata.com, surgepv.com, capterra.com, payaca.com (surse de vendor sau comparație; interes comercial).
