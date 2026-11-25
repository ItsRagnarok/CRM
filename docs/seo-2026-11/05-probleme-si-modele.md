# 05 – Căutări „de sus de pâlnie": probleme și modele (documente, obligații, bani, organizare)

Data cercetării: 2026-11-25. Piață: România, limba română.

Legendă: **[V]** = văzut real (sugestie Google Suggest `hl=ro&gl=ro` returnată de endpoint sau subiect/titlu observat în rezultate WebSearch). **[E]** = estimare mea (relevanță, dificultate, intenție). **Nu există nicio cifră de volum în acest document**, pentru că nu am acces la Keyword Planner / Semrush / Ahrefs / Search Console.

---

## 1. Rezumat (5 rânduri)

1. Cele mai bune oportunități sunt **documentele cu „model"** (deviz, proces-verbal de recepție, bon de consum, foaie de parcurs, pontaj, delegație, certificat de garanție): Google Suggest confirmă variantele „word / excel / pdf / completat / simplu", deci omul vrea un fișier, nu un articol.
2. Pe aceste căutări câștigă acum **bloguri de contabilitate** (contabilul.manager.ro, infotva.manager.ro, fiscalitatea.ro) și **concurenți soft** (zarinacrm.ro are deja pagini „Model bon de consum", „Model factură proformă", calculator diurnă). Concurenții din soft de teren fac exact strategia pe care o propun aici; trebuie să fim rapizi.
3. Căutările **specifice nișei** (preț manoperă electrician, preț instalație electrică apartament 2/3/4 camere, autorizare ANRE) sunt puține ca variante dar foarte clare; câștigă site-uri de marketplace (brig.ro) și presă financiară (bugetul.ro, playtech.ro). Un **calculator** de preț/manoperă ar bate un articol.
4. Pe teme **legale** (foaie de parcurs, diurnă, GPS GDPR, ITM/Reges, avans/proformă) există multă informație, dar fără unealtă practică pentru patronul de instalații; sursele văzute sunt secundare, deci orice articol nostru trebuie verificat cu un contabil/jurist și datat.
5. Blogul existent acoperă deja subiectele de bază (ofertă, PV, profit, avans, clienți dificili, pontaj, materiale, e-Factura, garanție, GPS/GDPR, echipe, drumuri). Lipsește **stratul de fișiere descărcabile și generatoare interactive** și paginile pe cuvintele „model X word/excel", care sunt de fapt cele căutate.

---

## 2. Metodă și ce am putut verifica

- **Google Suggest** (`suggestqueries.google.com/complete/search?client=firefox&hl=ro&gl=ro`): **a funcționat** prin WebFetch. Rezultatul trece printr-un model mic care uneori a rezumat în loc să returneze JSON brut, dar listele de sugestii sunt cele returnate de endpoint. Pentru multe interogări lungi/nișă a returnat **listă goală** (ex. „gps masina firma gdpr", „clienti care nu platesc", „revisal tehnician", „tarif electrician pe ora", „cum calculez manopera", „program instalatii gaze"): lipsa sugestiilor NU înseamnă lipsa căutărilor, doar că Google nu a propus completări.
- **WebSearch**: 14 căutări tematice. Instrumentul returnează titluri/URL-uri și un rezumat; **nu returnează „Căutări similare" / „Oamenii întreabă și" / ordinea exactă din SERP**. Coloana „primele 3" din tabel este deci „cine apare în rezultate pentru tema respectivă", nu un top 3 garantat.
- Nu am deschis paginile concurenților; ce spun despre ei vine din titluri și rezumatele returnate.
- Căutările au fost făcute de pe infrastructura Claude (US-only conform descrierii instrumentului), deci SERP-ul poate diferi de cel văzut din România.

---

## 3. Tabel cuvinte cheie (66)

Dificultate: **U** = ușoară, **M** = medie, **G** = grea (toate [E]). Intenție: **Doc** = vrea un fișier/model, **Info** = vrea să înțeleagă, **Calc** = vrea un calcul, **Tranz** = caută furnizor/soft.
„Primele 3": ce am văzut efectiv apărând pe temă; „–" = nu am verificat SERP-ul.

### A. Documente și modele

| # | Cuvânt cheie | Temă | Intenție | [V]/[E] | Cine apare / primele 3 | Dif. | Resursă care ar câștiga |
|---|---|---|---|---|---|---|---|
| 1 | model deviz | deviz | Doc | [V] sugestie | e-juridic.manager.ro (model simplu), devize din achiziții publice MD | M | Generator deviz online + Word/Excel |
| 2 | model deviz lucrări | deviz | Doc | [V] | – | M | idem |
| 3 | model deviz lucrări constructii word | deviz | Doc | [V] | – | M | Word descărcabil |
| 4 | model deviz lucrări constructii excel | deviz | Doc | [V] | – | M | Excel cu formule (regie, profit, TVA) |
| 5 | model deviz lucrări prestări servicii word | deviz | Doc | [V] | – | U | Word simplu pentru servicii |
| 6 | model deviz instalații electrice | deviz | Doc | [V] (sugestie unică) | e-juridic.manager.ro, devize MD (WinCmeta) | U | Deviz electric pre-completat (cablu, doze, tablou) |
| 7 | model deviz service auto | deviz | Doc | [V] | – | – | Nu e nișa noastră; ignorat |
| 8 | model ofertă de preț | ofertă | Doc | [V] | – | M | Generator ofertă (blog are deja articol + calculator) |
| 9 | model ofertă de preț word | ofertă | Doc | [V] | – | M | Word |
| 10 | model ofertă de preț construcții | ofertă | Doc | [V] | – | M | Word/Excel pentru instalații |
| 11 | model ofertă servicii | ofertă | Doc | [V] | – | M | Word |
| 12 | model contract prestări servicii | contract | Doc | [V] | lawinsider.com, contracte MD (mtender), Enel/PPC (neadecvate) | M | Contract Word „lucrări instalații" cu avans, garanție, recepție |
| 13 | contract prestări servicii model simplu word | contract | Doc | [V] | – | M | idem |
| 14 | contract prestări servicii model simplu pdf | contract | Doc | [V] | – | M | idem |
| 15 | contract prestări servicii instalații electrice persoană fizică | contract | Doc | [E] (vizibil în SERP, fără model dedicat) | lawinsider, Enel, PPC, mtender MD | U | Contract Word adaptat (gol real în SERP) |
| 16 | proces verbal de recepție model | PV | Doc | [V] | contabilul/e-juridic (neverificat), PDF-uri de primării (campiaturzii.ro, primariapn.ro) | M | Generator PV + Word |
| 17 | proces verbal de recepție la terminarea lucrărilor model | PV | Doc | [V] | campiaturzii.ro, primariapn.ro (PDF-uri) | M | idem |
| 18 | proces verbal de recepție finală / parțială / preliminară model | PV | Doc | [V] | – | M | un singur pachet cu cele 3 variante |
| 19 | proces verbal de punere în funcțiune | PV | Doc | [V] | media.hornbach.ro, distribuție energie (prosumatori) | U | Model PIF electric/fotovoltaic/gaze |
| 20 | proces verbal de predare primire model | PV | Doc | [V] | – | M | Word generic + varianta „scule/echipamente" |
| 21 | proces verbal lucrări ascunse model | PV | Doc | [E] (SERP: fără model dedicat; apar caiete de sarcini) | tuiasi.ro, mmediu.ro, Scribd (PVLA) | U | Model PVLA electric cu poze (gol real) |
| 22 | proces verbal de constatare | PV | Doc | [V] | – | M | model variantă pentru defecte/refuz acces |
| 23 | proces verbal predare primire scule | PV | Doc | [E] (Suggest listă goală) | – | U | Word + listă scule |
| 24 | proces verbal măsurători priza de pământ / PRAM | PV | Doc | [E] | – | U | model buletin (blogul are articol periodicitate) |
| 25 | fișă de lucru tehnician instalații | fișă | Doc | [V] (SERP gol: „fisa de lucru" Suggest e școlar) | jotform (fișă garanție), Distrigaz Sud (fișe IUGN) | U | Fișă de intervenție Word/Excel (gol real) |
| 26 | raport de intervenție model | fișă | Doc | [V] (dominat de ISU/incendiu) | SVSU/ISU | M | Ambiguu; folosit cu „instalații/service" |
| 27 | bon de consum model | materiale | Doc | [V] | zarinacrm.ro, contabilul.manager.ro, fiscalitatea.ro, avocatnet | M | Excel bon de consum pe lucrare |
| 28 | bon de consum excel | materiale | Doc | [V] | zarinacrm.ro (model) | M | Excel cu scădere din stoc |
| 29 | bon de consum colectiv | materiale | Info | [V] | contabilul.manager.ro | M | explicație + model |
| 30 | registru evidență materiale | materiale | Doc | [V] | – | U | Excel stoc mașină |
| 31 | foaie de parcurs model | auto | Doc | [V] | fiscalitatea.ro, infotva.manager.ro, contabilul.manager.ro, signnow | G | Generator foaie parcurs + Excel (sursa: Anexa OMF 1296/2021, neverificată direct) |
| 32 | foaie de parcurs model completat | auto | Doc | [V] | idem | M | Exemplu completat pentru lucrări la client |
| 33 | foaie de parcurs excel | auto | Doc | [V] | idem | M | Excel |
| 34 | foaie de parcurs pdf | auto | Doc | [V] | idem | M | PDF print |
| 35 | foaie de parcurs online | auto | Doc | [V] | – | M | Generator online |
| 36 | model pontaj excel | pontaj | Doc | [V] | wps.com, microsoft create, adobe, scribd, SmartBill Conta | G | Excel pontaj lunar cu ore, ore suplimentare, deplasări |
| 37 | model pontaj lunar excel / pontaj excel 2026 / cu ore venire și plecare | pontaj | Doc | [V] | idem | G | idem |
| 38 | model pontaj word / editabil / foaie colectivă de prezență | pontaj | Doc | [V] | idem | G | Word + PDF |
| 39 | delegație model | deplasare | Doc | [V] | – | M | Ordin de deplasare/delegație + calculator diurnă |
| 40 | declarație de conformitate model | conformitate | Doc | [V] (sugestii dominate de produse/ambalaje) | – | M | Variantă pentru lucrări instalații (atenție: nu e „CE produs") |
| 41 | certificat de garanție model | garanție | Doc | [V] | – | M | Certificat garanție lucrări (blogul are deja articol garanție) |
| 42 | model certificat de garanție lucrări construcții | garanție | Doc | [V] | – | U | Word pentru instalații |
| 43 | registru de evidență a salariaților / zilierilor | personal | Doc | [V] | – | M | de verificat dacă ne priește (periferic) |

### B. Obligații legale și administrative

| # | Cuvânt cheie | Temă | Intenție | [V]/[E] | Cine apare / primele 3 | Dif. | Resursă care ar câștiga |
|---|---|---|---|---|---|---|---|
| 44 | foaie de parcurs obligatorie | fiscal | Info | [V] (Suggest: o singură sugestie) | fiscalitatea.ro, infotva.manager.ro, contabilul.manager.ro | G | Articol cu răspuns direct (obligatorie pentru TVA 100%/deducere 50%, de verificat) |
| 45 | deducere combustibil foaie de parcurs / 50% | fiscal | Info | [E] | idem | G | idem |
| 46 | foaie de parcurs 2026 | fiscal | Info | [E] | infotva (mențiune propunere eliminare, status neconfirmat) | G | Actualizare datată |
| 47 | diurnă 2026 | fiscal | Calc | [E] | contzilla.ro, folositor.ro, zarinacrm.ro, infotva.manager.ro | G | Calculator diurnă (zarinacrm are deja pagină) |
| 48 | indemnizație delegare 2026 | fiscal | Info | [E] | permisdeantreprenor.ro, contzilla.ro | G | idem |
| 49 | norma de hrană 2026 | fiscal | Info | [V] (Suggest: public/bugetari) | – | G | Nu e pentru privat; evitat (ar atrage trafic irelevant) |
| 50 | e-Transport | fiscal | Info | [V] | – (n-am verificat) | G | Articol „când se aplică la transport de materiale electrice" (de verificat aplicabilitatea) |
| 51 | e-Factura 2026 firme mici | fiscal | Info | [E] | – | G | Blogul are deja articol B2B |
| 52 | factură avans / proformă | fiscal | Info | [V] (SERP) | avocatnet, contabilul.manager.ro, bono.ro, zarinacrm.ro | G | Model proformă + factură avans pentru lucrări |
| 53 | GPS mașina firmei GDPR | GDPR | Info | [V] (SERP, Suggest gol) | startupcafe.ro, profit.ro, hotnews.ro, playtech.ro, e-juridic.manager.ro | M | Blogul are articol; de verificat dacă ajunge |
| 54 | SSM lucru la înălțime | SSM | Info | [V] | – | M | Fișă instruire SSM înălțime (model) |
| 55 | instrucțiuni proprii SSM lucru la înălțime | SSM | Doc | [V] | – | U | Model Word instrucțiuni proprii (nișă bună) |
| 56 | Reges / Revisal angajare | ITM | Info | [E] (afirmație „Reges obligatoriu din 1.01.2026" văzută într-un fragment avocatnet, neverificată) | avocatnet.ro, inspectiamuncii.ro | G | Nu intru; sursă nesigură |
| 57 | autorizare ANRE electrician | legal | Info | [V] | – (n-am verificat) | M | Blogul are deja `autorizatii-electricieni...`; verificat dacă aduce trafic |
| 58 | autorizare electrician ANRE 2026 / preț / examen | legal | Info | [V] | – | M | idem, actualizare |
| 59 | cod CAEN instalații electrice | firmă | Info | [V] | – | M | Articol + „ce CAEN-uri pentru electric/gaze/fotovoltaic" |

### C. Bani și firmă

| # | Cuvânt cheie | Temă | Intenție | [V]/[E] | Cine apare / primele 3 | Dif. | Resursă care ar câștiga |
|---|---|---|---|---|---|---|---|
| 60 | preț manoperă electrician | preț | Calc | [V] | – (SERP: bugetul.ro, brig.ro) | M | Calculator manoperă/tarif pe oră |
| 61 | tarif pe oră electrician 2026 | preț | Calc | [E] (Suggest gol; SERP dă bugetul.ro 2026) | bugetul.ro, jooble (salarii), brig.ro | M | Calculator tarif pe oră + tabel orientativ pe oraș |
| 62 | preț instalație electrică apartament (2/3/4 camere) | preț | Calc | [V] | bugetul.ro, brig.ro, playtech.ro | M | Calculator preț cu materiale/manoperă separate |
| 63 | preț schimbare/refacere instalație electrică apartament | preț | Calc | [V] | idem | M | idem |
| 64 | cum ceri avans lucrări | bani | Info | [E] | avocatnet, contabilul.manager.ro (proformă) | M | Blogul are articol; model proformă + clauză avans |
| 65 | clienți care nu plătesc | bani | Info | [E] (Suggest gol) | – | M | Model somație/notificare + checklist |
| 66 | cum găsesc electricieni angajați / lipsă electricieni | personal | Info | [E] | profit.ro, bugetul.ro, jooble | M | Articol + model anunț angajare electrician |

Observații despre tabel: grupările (ex. 3-5, 37-38) sunt cluster-e; Suggest a returnat fiecare variantă separat. „Instalații gaze" nu a returnat nicio sugestie pe interogările încercate, deci nu am dovezi [V] pentru nișa gaze la acest nivel.

---

## 4. Top 15 „magneți de trafic" (modele / calculatoare)

Principiu pentru toate: fișierul se poate descărca **fără cont**; ElectroField apare ca „ce faci când ai peste 5-10 lucrări pe lună", într-un singur bloc scurt la final, plus un câmp opțional „vrei același document completat automat de aplicație?". Fără pop-up, fără formular obligatoriu înainte de descărcare. Ordinea e după raportul (cerere văzută × gol în SERP × ușurință) [E].

1. **Model contract prestări servicii instalații (Word)**. Cuprinde: părți, obiect, preț cu defalcare manoperă/materiale, avans (% și termen), termen de execuție, recepție, garanție, clauză pentru lucrări suplimentare, penalități, forță majoră. Motiv: SERP-ul pentru „persoană fizică + instalații electrice" nu a arătat niciun model dedicat. Legătură: la final, „contractul se atașează automat ofertei în ElectroField". Avertisment „nu înlocuiește consultanța juridică".
2. **Generator proces-verbal de recepție** (variante: terminare lucrări, parțială, finală; PDF generat în browser). Câmpuri: client, adresă, lucrare, defecte, termen remediere, semnături. Legătură: „în aplicație, tehnicianul semnează pe telefon, cu poze" (blogul are deja `model-proces-verbal-raport-lucrare`; de transformat din articol în generator).
3. **Model proces-verbal de lucrări ascunse (PVLA) electric** (Word + PDF). Rubrici: traseu cabluri îngropate, dimensiuni, protecții, loc poze, măsurători. Lipsește un model dedicat în rezultate. Legătură: „pozele din aplicație se atașează automat".
4. **Excel pontaj lunar pentru tehnicieni** (ore normale, suplimentare, deplasare, concedii, total pe lucrare). Concurență mare (wps, Microsoft, Adobe, SmartBill), deci trebuie diferențiat: coloană „pe lucrare" și total de cost pe client. Legătură firească: „vrei pontajul din GPS/poze fără Excel? Vezi pontajul pe lucrare". (Blogul are `evidenta-orelor-...`.)
5. **Generator foaie de parcurs** (după formatul oficial; sursă de verificat direct: anexa Ordinului 1.296/2021 indicată de fiscalitatea.ro). Cu exemplu completat pentru o zi cu 3 lucrări. Legătură: „traseele din programare completează foaia". Concurență mare (G), deci doar cu mențiune clară de dată și verificare.
6. **Calculator tarif pe oră / preț manoperă** (cost salarial + contribuții + scule + mașină + regie + profit → tarif minim). Intrări în lei; ieșire: tarif minim și recomandat. Fără tarife inventate: afișăm doar formula și propriile cifre ale utilizatorului; ca reper, intervale din surse citate (bugetul.ro 2026: 80-150 lei/oră București, 50-80 orașe mici, sursă unică). Legătură: „vezi cât te costă o oră pierdută în drum".
7. **Calculator preț instalație electrică apartament** (nr. camere, tip traseu, tablou, materiale standard/premium; separă manoperă și materiale). Răspunde la căutările [V] „pret instalatie electrica apartament 2/3/4 camere". Ieșire: deviz exportabil. Legătură: butonul „Fă oferta cu logo-ul tău în ElectroField".
8. **Model deviz lucrări instalații (Excel cu formule + Word)**: articole, UM, cantitate, preț unitar, manoperă, regie, profit, TVA 21%/cota curentă [de verificat cotă], total. Legătură: „devizul devine ofertă și apoi lucrare cu un clic".
9. **Fișă de intervenție / raport de lucrare (Word/Excel)**: client, echipament, diagnostic, piese, ore, cauza, semnătură. Gol real în SERP (rezultatele au fost jotform + fișe Distrigaz). Legătură: aplicația tehnicianului.
10. **Bon de consum pe lucrare (Excel cu stoc)**: concurență (zarinacrm), dar adăugăm „stoc din mașină": la fiecare consum scade cantitatea. Legătură: gestiunea materialelor din aplicație (blogul are `gestiune-materiale`).
11. **Calculator diurnă / indemnizație delegare** cu condițiile (distanță, ore), ordin de deplasare descărcabil. Concurență: zarinacrm, contzilla, folositor. Doar dacă putem verifica cifrele cu un contabil; sursele văzute sunt secundare (plafon 57,50 lei/zi intern citat de mai multe, neverificat oficial).
12. **Pachet documente de predare client** (certificat garanție, PV, instrucțiuni utilizare, fișă măsurători): ZIP de 4 fișiere, pe baza blogului `documente-predare-client-dupa-instalare`. Legătură: „se generează singur la finalul lucrării".
13. **Model factură proformă + avans pentru lucrări** cu clauza de avans și un mini-checklist e-Factura (blogul are `cat-avans-ceri` și `e-factura-b2b`). Concurență: zarinacrm, bono.ro, contabilul.manager.ro. Legătură: integrare SmartBill/Oblio. Necesită verificarea termenelor cu contabil (am văzut „5 zile lucrătoare" într-un rezultat, neconfirmat oficial).
14. **Model instrucțiuni proprii SSM lucru la înălțime + fișă instruire** (Word). Sugestiile [V] arată cerere pe „instrucțiuni proprii". Legătură: „bifează instruirea per tehnician în aplicație". Necesită validare de către un specialist SSM (nu publicăm ca „oficial").
15. **Șablon „Registru scule și predare-primire" (Excel + PV)** cu semnătură de predare și stare; legătura firească cu mașina/stocul. Cerere [E]; Suggest nu a dat nimic, deci prioritate mică; ține de „PV predare-primire" care are cerere [V] la nivel generic.

Mențiuni: „calculator rentabilitate lucrare" (blogul are articol `cum-calculezi-profitul-pe-lucrare` fără câmpuri interactive) ar fi un al 16-lea candidat și ar rezolva direct.

---

## 5. Blog existent: ce merită îmbunătățit

Am verificat doar titlurile și mărimea fișierelor (în `public/blog/`), nu am recitit tot textul. Concluzii [E]:

- `model-oferta-lucrari-electrice-fotovoltaice` (~9 KB, „cu calculator"): titlul nu conține „model … word/excel/pdf". Adaugă fișier descărcabil și un H2 „model ofertă de preț word".
- `model-proces-verbal-raport-lucrare` (~6 KB, fără calculator/input): scurt; cel mai bun candidat la **transformare în generator PDF** + variante (recepție, lucrări ascunse, punere în funcțiune).
- `cum-calculezi-profitul-pe-lucrare` (~6 KB, fără calculator): scurt; adaugă calculator interactiv + exemplu numeric.
- `documente-predare-client-dupa-instalare` (~8 KB, fără calculator): oferă pachetul ZIP de modele (magnet nr. 12).
- `cat-avans-ceri-lucrari`, `gestiune-materiale`, `evidenta-orelor-...pontaj`, `urmarire-gps-...gdpr`: au elemente interactive (inputuri). `evidenta-orelor` ar câștiga cu un Excel descărcabil „model pontaj excel" (căutare [V] cu multe variante).
- `e-factura-b2b-2026` și `garantie-legala`: verifică și datează conținutul; subiectele sunt legale și sensibile la schimbări. Nu am verificat corectitudinea textului.
- Există și alte articole relevante care nu erau în lista dată: `excel-sau-aplicatie-gestionare-lucrari`, `gestionare-echipe-de-teren`, `reducere-timpi-deplasare-lucrari`, `autorizatii-electricieni-instalatori-...`, `contract-mentenanta-camere-supraveghere-securitate`. Ele acoperă o parte din „organizare" și „autorizare ANRE".

Subiecte noi fără pagină (din cercetare): contract prestări instalații, model deviz, fișă de intervenție, foaie de parcurs, delegație/diurnă, proformă/avans, tarif pe oră, preț pe apartament, SSM la înălțime, cum găsești electricieni, clienți care nu plătesc.

---

## 6. Limite

- **Fără volume reale.** Nicio cifră de căutări/lună în acest document; [V] înseamnă doar „Google propune această completare în RO". Prioritizarea e judecată mea [E].
- **Suggest lipsă** pentru multe interogări lungi/nișă (listă goală) și în special pentru gaze și fotovoltaic; nu pot spune că nu există cerere.
- **Fără „Căutări similare", „Oamenii întreabă și", SERP exact**: WebSearch nu le returnează. Coloana „cine apare" e observație din rezultate, nu clasament verificat; unele rânduri sunt marcate „–".
- **Rezultate din Moldova** (storage.mtender.gov.md, anre.md) apar mult pe subiecte tehnice: nu sunt concurenți români; ignorate în analiză.
- **Informații legale/fiscale** (foaia de parcurs și deducerea 50%/100%, propunerea de eliminare, Reges din 2026, diurnă 57,50 lei, termen e-Factura avans, aplicabilitate e-Transport, cotă TVA) provin din presă/blogguri de contabilitate; **nu le-am verificat în Monitorul Oficial/ANAF**. Înainte de publicare: validare cu contabil/jurist și dată pe pagină.
- **Prețuri** (bugetul.ro, brig.ro): surse comerciale, uneori contradictorii (ex. apartament 3 camere 1.500-3.000 EUR vs 4.500-9.000 lei); de tratat ca repere, nu fapte.
- Competitor observat: zarinacrm.ro (Zarina CRM Construcții, profil Instalații) are pagini model + calculator; am văzut doar titluri/rezumate, nu conținutul. Alții (Anolla, Odoo) apar pe „aplicație programare tehnicieni".
- Nu am modificat alte fișiere; am doar citit titlurile din `public/blog/`.
