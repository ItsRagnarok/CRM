# ElectroField — ofertă comercială și pași de implementare

Analiză din cod și din numărul de înregistrări, 2 noiembrie 2026. Confirmat de proprietar: abonamente lunare pe companie, PFA neplătitor de TVA. Prețurile ofertei sunt 299 și 599 lei/lună, fără TVA. Limitele și condițiile comerciale sunt propuneri. Documentul nu schimbă planurile existente și nu implementează plăți.

## Ce există acum

| Funcție | Situație verificată | Valoare pentru client |
| --- | --- | --- |
| Clienți, contacte, locații, lucrări și calendar | Pagini și operații existente | Înlocuiește informația împrăștiată între telefoane și tabele |
| Echipe, tehnicieni și aplicație mobilă | Interfață mobilă și pachet Android Capacitor | Fiecare om vede lucrările și pașii din teren |
| Fotografii, checklisturi, semnături și raport de lucrare PDF | Fluxuri existente, inclusiv generare PDF la cerere | Dovezi de execuție și predare către client |
| Materiale, scule, depozite, consum și cereri de achiziție | Module existente | Legătură între stoc și lucrare, mai puține cumpărături neprevăzute |
| Pontaj, concedii și tarife orare | Module existente | Vizibilitate asupra timpului și a costului de manoperă |
| Cheltuieli, aprobări și profit estimat pe lucrare | Module existente | Control asupra costurilor; profitul depinde de datele introduse |
| Facturare internă | Facturi și încasări interne | Evidență operațională; nu este demonstrată o integrare fiscală/e-Factura |
| GPS, mesaje și notificări | Module existente | Coordonare între birou și teren |
| Abonamente | Tabele și pagină cu patru planuri vechi | Nu am găsit o integrare funcțională pentru încasare recurentă sau control central al tuturor funcțiilor pe plan |
| Integrări SmartBill/Oblio/FGO, AI | Integrările sunt afișate „în curând”; unele planuri promit AI fără un flux complet identificat | Nu trebuie vândute ca funcții disponibile |

Există 3 organizații, 6 profiluri, 23 de lucrări, 79 materiale, 86 evenimente de pontaj, o factură și un mesaj la momentul auditului. Acesta este un eșantion mic. Zero înregistrări într-o tabelă nu demonstrează că funcția este inutilă: PDF-urile, de exemplu, pot fi generate fără un rând în `reports`. Nu justifică ștergerea unui modul.

## Cele două planuri propuse

| | Standard — 299 lei/lună | Pro — 599 lei/lună |
| --- | --- | --- |
| Pentru cine | Firmă mică, un administrator și o echipă de teren | Mai multe echipe, lucrări simultane și control financiar |
| Utilizatori incluși, propunere | 5 utilizatori activi | 15 utilizatori activi |
| Flux de bază | Clienți, lucrări, calendar, echipe, mobil, poze, checklisturi, semnături, PDF | Tot ce include Standard |
| Timp și materiale | Pontaj și consum de materiale pe lucrare | Pontaj și costuri avansate, concedii, mai multe depozite și fluxuri de aprobare |
| Coordonare | Mesaje și notificări de bază | GPS live, cereri de achiziție și aprobări între mai multe echipe |
| Financiar | Evidență simplă a lucrărilor și documentelor | Cheltuieli, profit estimat, rapoarte de management și evidența internă a facturilor |
| Suport, propunere | Suport în programul de lucru, răspuns în maximum 2 zile lucrătoare | Prioritate în programul de lucru, răspuns în maximum o zi lucrătoare |

Limitele de utilizatori și timpii de suport sunt propuneri, nu angajamente deja implementate. Peste 15 utilizatori, oferta se calculează separat; nu promite utilizare nelimitată sau dezvoltare nelimitată. Stocarea fotografiilor și traficul trebuie dimensionate după costuri reale, apoi publicate ca limite de stocare clare.

Standard trebuie să ofere întregul flux minim de la client la lucrare finalizată. Nu aș ascunde fotografiile sau raportul final doar ca să forțez upgrade-ul. Diferența Pro trebuie susținută de coordonarea mai multor echipe, aprobări și vizibilitate asupra costurilor.

## De ce poate merita prețul

Exemplu de vânzare, nu rezultat garantat: la un cost intern de 50 lei/oră, 299 lei înseamnă aproximativ 6 ore economisite pe lună, iar 599 lei aproximativ 12 ore. Față de Standard, Pro trebuie să aducă încă aproximativ 6 ore sau o economie echivalentă în materiale/deplasări. Costul/oră se înlocuiește cu valoarea reală a firmei; beneficiile se verifică într-un pilot.

Măsurăm înainte și după: minute pe planificare, apeluri pentru aflarea statusului, lucrări fără documente de predare, consum neatribuit și întârzierea dintre finalizarea lucrării și facturare. Timpul petrecut în aplicație măsoară adopția, nu valoarea în sine: dacă o automatizare reduce timpul de utilizare și rezolvă aceeași muncă, acesta este un rezultat bun.

## Implementarea — tarif separat de abonament

| Tarif orientativ unic | Ce include |
| --- | --- |
| 1.000 lei | Configurare firmă și utilizatori, un flux existent, import simplu dintr-un fișier agreat, instruire și verificare de pornire |
| 1.500–2.000 lei | Mai multe echipe/depozite, mai multe șabloane, curățare și import mai complex, instruire suplimentară |
| 2.000–3.000 lei | Adaptare limitată și estimată în prealabil: câmpuri, raport sau automatizare simplă, cu criterii de acceptare scrise |

Un modul complet de contabilitate pentru dezmembrări auto și camioane poate depăși mult 3.000 lei. Necesită analiză și deviz separat. Prețul de implementare nu trebuie să includă implicit dezvoltarea unui produs nou sau întreținerea permanentă a unei variante individuale.

Păstrează o singură bază de cod. Diferențele între domenii se configurează prin module, șabloane, câmpuri și automatizări pe companie. Un set de configurări pentru construcții poate refolosi clienți, proiecte/lucrări, echipe, materiale și costuri. Contabilitatea specializată trebuie definită separat și conectată, după caz, la instrumentele fiscale existente.

## Cum vindem și încasăm

1. Discuție de calificare: tipul firmei, câți utilizatori, câte echipe, ce informații pierde și cum lucrează acum.
2. Demonstrație pe o lucrare reală, cu date de test. Alegem Standard sau Pro din nevoia reală.
3. Ofertă cu abonament, implementare, livrabile, limite, suport, TVA și eventuale dezvoltări separate.
4. Configurare, import, instruire și acceptarea implementării; data de început a abonamentului este explicită.
5. Inițial se poate factura manual, cu perioadă plătită și status administrate central. Ulterior se poate integra un procesator pentru plata recurentă.
6. Pentru plăți automate: confirmarea plății pe server prin webhook verificat, procesare idempotentă, perioadă plătită, gestionarea întârzierilor, anulare și schimbare de plan. Nu activa funcțiile doar pentru că browserul a revenit de la plată. Modelul este documentat de [Stripe](https://docs.stripe.com/billing/subscriptions/overview) și [evenimentele pentru abonamente](https://docs.stripe.com/billing/subscriptions/webhooks).

## Ce trebuie schimbat înainte de lansarea comercială

1. Înlocuirea celor patru planuri vechi din UI cu Standard și Pro. Migrarea fiecărei companii se decide explicit; nu presupunem că un abonament vechi este echivalent cu unul nou.
2. O singură configurație pentru prețuri, limite și drepturi. Verificările trebuie făcute în server actions/API și unde este necesar în baza de date, nu doar prin ascunderea meniurilor.
3. Evidență pentru data începerii, sfârșitul perioadei plătite, status, tarif negociat, implementare și opțiuni individuale.
4. Teste pentru upgrade/downgrade, utilizatori peste limită, expirare și eșecul plății. Downgrade-ul nu șterge date; păstrează accesul convenit pentru consultare/export.
5. Eliminarea promisiunilor AI/integrări nelivrate și a afirmațiilor fiscale fixe din interfață. Situația TVA se afișează conform configurației firmei emitente, nu dintr-un prag fiscal scris în cod.
6. Un pilot de 30 de zile cu măsurători și feedback, apoi confirmarea limitelor și a costului de suport.

## Ce păstrăm și ce simplificăm

Păstrăm modulele operative existente. Putem ascunde module nefolosite per companie, fără a șterge datele sau codul. Cu noile date de activitate și discuțiile cu clienții verificăm utilizarea înainte de eliminare. Prioritatea este un flux complet și ușor de folosit, nu numărul de meniuri.

Pentru moment nu sunt justificate: patru planuri aproape suprapuse, promisiuni de AI/integrări fără implementare, copii de cod pentru fiecare client și prețuri nelimitate pentru dezvoltări individuale.
