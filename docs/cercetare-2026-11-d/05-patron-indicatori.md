# Ce urmărește patronul unei firme de instalații (indicatori, cadență, decizii)

Data: 2026-11-24. Legendă: [C] pagină citită (via fetch, prelucrată de un model mic) / [S] doar din rezumatul căutării / [E] estimare proprie.
Avertisment general: aproape toate benchmark-urile vin din bloguri de vendori americani (ServiceTitan, simPRO, SmartService etc.), nu din studii independente. Sunt orientative. Nu am găsit **niciun benchmark românesc** pentru marjă, restanțe sau cash-flow în firme de instalații (căutarea a returnat doar fișe de firme de pe termene.ro), și **nu am găsit date despre dispozitivul real** pe care patronii se uită la indicatori.

## 1. Indicatori și valori tipice (SUA, vendori)

| Indicator | Valoare tipică / prag | Sursă |
|---|---|---|
| Utilizare tehnician (ore facturabile / ore plătite) | 60–80% „bun”; sub 60% = programare slabă sau supraangajare; peste 70% țintă | [C] [ServiceTitan](https://www.servicetitan.com/blog/field-service-metrics), [SmartService](https://www.smartservice.com/blog/electrical-business-kpi-guide); „nu urmăriți 100%” [C] [ServiceTitan MEP](https://www.servicetitan.com/blog/mep-dashboard-metrics) |
| Marjă brută | Foarte dispersată: 35–45% (SmartService) [C]; 30–50% pentru service electric (simPRO) [S]; 72%+ la ServiceTitan [S]. Definițiile diferă (cu/fără regie). Sub 30% = problemă de preț [C] | [SmartService](https://www.smartservice.com/blog/electrical-business-kpi-guide), [rezumat căutare simPRO](https://www.simprogroup.com/blog/electrical-kpis-that-protect-margin) |
| Marjă pe tip de lucrare | Recomandată în loc de marja globală; greșeala clasică: „vânzările cresc deci mergem bine” cu marja în scădere | [C] [PMMag](https://www.pmmag.com/articles/107482-beyond-revenue-the-kpis-that-drive-plumbing-profitability), [S] simPRO |
| Variație cost real vs ofertă (pe tip de proiect/echipă) | Fără prag; scop: găsești echipe/categorii sistematic peste ofertă | [C] [ServiceTitan MEP](https://www.servicetitan.com/blog/mep-dashboard-metrics) |
| Venit pe tehnician / pe mașină | 350–500k USD/an (HVAC comercial, ServiceTitan) [C]; 400–800k USD/mașină, sub 300k = preț mic sau programare slabă (SmartService) [C]. Neaplicabil direct în RO [E] | linkurile de mai sus |
| Repetări / garanții (callback) | Sub 5% bine; peste 10% = problemă de execuție/diagnostic [C]. First-time fix ~75–80% medie, 88–90% top [S/C] | [SmartService](https://www.smartservice.com/blog/electrical-business-kpi-guide), [ServiceTitan](https://www.servicetitan.com/blog/field-service-metrics) |
| Timp de deplasare | „30 min–1 h” frecvent, fără sursă [C] | [ServiceTitan](https://www.servicetitan.com/blog/field-service-metrics) |
| Restanțe pe vechime | Bucket-uri 30/60/90+, pe client și pe tip de lucrare; sub 30 zile rezidențial, sub 45 comercial; peste 60 = criză de cash [C] | [ServiceTitan MEP](https://www.servicetitan.com/blog/mep-dashboard-metrics), [SmartService](https://www.smartservice.com/blog/electrical-business-kpi-guide) |
| Timp până la factură | 10–30 min cu mobil vs 1–3 zile cu hârtie [C]; simPRO sugerează factură în 24 h [S] | SmartService |
| Cash-flow | Previziune pe 90 zile actualizată săptămânal; rezervă 3–6 luni [C] | [PMMag](https://www.pmmag.com/articles/107482-beyond-revenue-the-kpis-that-drive-plumbing-profitability), SmartService |
| Conversie oferte | Rata de închidere (vândut/oferit) și vechimea ofertelor deschise; 50% e doar exemplu ilustrativ [C] | PMMag; [Housecall Pro](https://help.housecallpro.com/en/articles/16005366-kpi-dashboard) |

Context legal românesc [S]: Legea 72/2013 limitează termenul de plată B2B la 60 de zile (cu excepții justificate), dobânda curge de la scadență și există o despăgubire minimă de 40 euro; un sondaj CNIPMMR spune că 92% dintre respondenți consideră că legea nu se aplică efectiv ([rezumat căutare](https://www.capital.ro/platile-care-trebuie-facute-in-maxim-60-de-zile-directiva-ue-impune-un-termen-strict-contractul-trebuie-verificat.html)). Verificați textul consolidat înainte de a-l folosi în produs.

## 2. Cât de des și pe ce dispozitiv

- Regula: din ~30 de indicatori utili, patronul se uită săptămânal la ~3, aleși după situație: presiune pe cash (restanțe, rezervă, marjă); cerere peste capacitate (lucrări/tehnician, utilizare, first-time fix); probleme de calitate (callback, recenzii). Restul trimestrial [C] [SmartService](https://www.smartservice.com/blog/electrical-business-kpi-guide).
- Ritm: ședință de 15 min luni dimineața [C] ServiceTitan MEP; cash-flow pe 90 zile săptămânal, financiare complete lunar, prețuri/materiale lunar sau trimestrial [C] PMMag. Zilnic: doar metrici de timp (timp de deplasare) [S] și restanțe/facturare pentru birou.
- Vederi pe rol (patron, manager, dispecer) în loc de un singur dashboard [C] ServiceTitan MEP.
- Dispozitiv: **nu există date**. Jobber are „business health” în aplicația mobilă, dar rapoartele detaliate sunt pe web [S] ([Jobber](https://help.getjobber.com/en/topics/business-health/)). Housecall Pro nu spune dacă dashboard-ul e pe mobil [C]. Ipoteza mea [E]: patronul mic vede 3–5 cifre pe telefon (cash, restanțe, azi), iar analiza marjei se face la birou, pe laptop.

## 3. Decizii legate de indicatori (reguli „prag → acțiune”)

Principiul: „fiecare KPI de pe dashboard trebuie să aibă un declanșator” [C] PMMag. Exemple din surse [C] SmartService/PMMag: marjă sub 30% → revezi prețul întâi; restanțe peste 60 zile → înăsprești încasarea; utilizare sub 60% → programare sau cât personal ai față de cerere; callback peste 10% → audit de execuție; venit/mașină sub prag → preț prea mic sau mașină neutilizată; rotație peste 30% → retenție înaintea recrutării; preț materiale actualizat lunar/trimestrial pentru ca o lucrare „profitabilă” să nu iasă pe zero; plafon de ore suplimentare și prag minim de utilizare; capacitate înainte de marketing. Angajări: dacă venitul pe tehnician e mult sub referință, optimizezi echipa înainte de a angaja [C] ServiceTitan MEP. Ce tip de lucrări accepți: derivat din marja pe tip de lucrare [E, concluzie a mea din PMMag/simPRO].

## 4. Ce arată competitorii

- Housecall Pro (doar proprietari HVAC/instalații/electric): venit vs țintă, trend 12 luni vs anul trecut, încasări, ticket mediu, facturi deschise pe vechime, oferte trimise și rata de închidere, lucrări pe sursă de lead, clasament tehnicieni, abonamente [C] [sursă](https://help.housecallpro.com/en/articles/16005366-kpi-dashboard).
- Jobber: insights cu venit, conversie lead-uri, cash-flow; rapoarte financiare/lucrări/clienți pe planuri selectate, acces pe permisiune; utilizatorii cer marjă pe lucrare, restanțe pe vârstă, oferte neprogramate [S] ([sursă](https://help.getjobber.com/en/topics/business-health/), [forum](https://community.getjobber.com/discussions/insights-reporting/what-kpis-is-everyone-tracking-beyond-the-basic-revenue-numbers-using-insights/10977)).
- ServiceTitan: pagină cu utilizare, variație de cost, aging, abonamente [C]. Concurenții români (Aktio, Zarina): nu am verificat dashboard-urile lor.
- Slăbiciune comună: indicatori de venit/vânzări; lipsesc rar marja per lucrare după ore reale și riscurile de conformitate din RO [E].

## Ce înseamnă pentru ElectroField

1. **Ecran „Luni dimineață” pentru patron** (3 cifre alese de el din ~6: cash 30/60/90, restanțe, marjă lucrări închise); vedere telefon + extins pe web. Prioritate: mare. Pentru: patron.
2. **Prag → acțiune pe fiecare indicator**: patronul setează praguri (ex. marjă sub X%, restanță peste 60 zile) și primește notificare cu butonul acțiunii (reminder client, revizuiește oferta). Prioritate: mare. Patron/birou.
3. **Marjă pe tip de lucrare** (electric/gaze/FV/revizie) cu variație cost real vs ofertă pe echipă; extinde „marja pe lucrare” existentă. Prioritate: mare. Patron/birou.
4. **Restanțe pe vârstă 0–30/31–60/61–90/90+**, pe client, cu data scadenței contractuale și calcul orientativ de penalități (după verificare juridică). Prioritate: mare. Birou/patron.
5. **Utilizare echipe**: ore facturabile / ore pontate pe echipă și săptămână, plus timp de deplasare din GPS/pontaj. Prioritate: medie. Patron/birou.
6. **Lucrări refăcute/garanție**: câmp „revenire în garanție?” pe lucrare, cu cauză; rată pe tehnician/tip. Prioritate: medie. Tehnician (câmp), patron (rată).
7. **Previziune de cash 90 zile**: scadențe clienți + costuri cunoscute (salarii, stoc, ITP). Prioritate: medie. Patron.
8. **Conversie oferte + vechimea ofertelor deschise** cu reminder de follow-up. Prioritate: medie. Birou/patron.
9. **Timp până la factură** (încheiere lucrare → emitere SmartBill/Oblio) ca indicator pe birou. Prioritate: medie. Birou.
10. **Validare cu 8–15 patroni**: ce 3 cifre aleg și pe ce device; pragurile reale RO (marjă, restanță). Prioritate: mare. Echipa de produs.
