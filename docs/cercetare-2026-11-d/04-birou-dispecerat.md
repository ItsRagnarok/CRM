# Birou / dispecerat într-o firmă de instalații cu mai multe echipe

Data: 2026-11-24. Etichete: [C] pagină citită / [S] doar rezumat de căutare / [E] estimare. Nu repet sinteza din `docs/sinteza-cercetare-si-optimizare-platforma.md` (calendar pe echipe, hartă GPS, link de status, panou „bani de recuperat" există deja).

## 0. Limite ale cercetării (spuse explicit)
- **Realitatea românească:** nu am găsit pe forumuri (Softpedia etc.) nicio discuție despre cum își organizează o firmă mică programările, reprogramările sau lipsa de material [S: căutare fără rezultat]. Nu există anunț „dispecer instalații" pentru firme mici găsit; singurul comparabil citit e „dispecer sisteme de securitate" (mai jos). Tot ce urmează despre firmele mici RO este deci **[E]** și trebuie validat în interviuri.
- Nu am găsit studii academice de programare; am găsit doar benchmark-uri de vendor (first-time fix).

## 1. Ce face dispecerul, din singurul anunț RO comparabil
Anunț „Dispecer sisteme de securitate" (Voluntari, 1.000–1.500 €/lună, poziție închisă) [C]: preia și înregistrează cereri (intervenție/mentenanță/service) în CRM ca tichete; „alocă și programează lucrări pentru echipe pe tip, locație și prioritate"; confirmă programările cu clientul; prioritizează urgențele cu echipele; ține evidența termenelor din contractele de mentenanță; face rapoarte periodice; ține documentele (rapoarte de service, fișe, procese-verbale). Cere 3 ani experiență, CRM/ERP, Word/Excel/Outlook. Sursă: https://www.bestjobs.eu/en/job/dispecer-sisteme-de-securitate-2
Alte anunțuri „dispecer" găsite sunt dispecer energetic de rețea (nu au legătură cu programarea de echipe) [S]: https://www.rubinian.com/cor/215103-dispecer-retea-distributie
Implicație [E]: într-o firmă de 3–50 oameni rolul e de obicei făcut de patron, soție sau o secretară, în Excel/telefon/WhatsApp; „dispecerul" real apare la ~15–20+ oameni.

## 2. Funcții de planificare în software-ul de field service
**ServiceTitan** (help center) [C pe 2 pagini]:
- Placă de dispecerat cu drag&drop; la „crew", tragi șeful de echipă pe lucrare și membrii se asignează automat. https://help.servicetitan.com/docs/dispatching.md [S]
- **Capacitate adaptivă**: sloturi disponibile calculate din ture (shifts), concedii, **competențe** (tehnicianul trebuie să le aibă pe toate cele cerute de tipul de lucrare), **zone**, **durată implicită pe tip de lucrare** (durată goală/0 = supraprogramare puternică). Regulă de prag: blochează tipurile de lucrare cu prioritate mică când capacitatea scade sub un procent, ca să rezervi 10–20% pentru urgențe. https://help.servicetitan.com/commercial/docs/plan-your-team-s-capacity-1
- **Dispatch Pro** (add-on): filtre dure în ordine (activat, zonă, toate competențele, tură care acoperă fereastra de sosire, timp maxim de drum) și apoi clasament; modul „Assist" (propune, dispecerul aprobă) vs „Auto"; tab de Alerte cu lucrări neasignate; „nu suprascrie niciodată o decizie umană". Nu descrie blocarea unei asignări. https://help.servicetitan.com/docs/dispatch-pro-overview.md
**Simpro** [S]: drag&drop pe zi/săptămână/lună/proiect, programare în bloc de personal + echipamente „fără conflicte", blocarea calendarului pentru neautorizați, alerte de stoc scăzut. **Nu am găsit** avertizare „material indisponibil" la tragerea pe calendar (stocul e legat de proiect, nu de planificator). https://www.simprogroup.com/features/scheduling-software
**Jobber** [S]: drag&drop pentru reprogramare/reasignare; optimizare de rută (reordonare vizite, fixare prima/ultima oprire; doar admin, doar pe web, pe planuri superioare); mementouri automate de vizită. „On my way" nativ: neconfirmat. https://getjobber.com/features/drag-drop-calendar/
**Fieldpoint:** nu am căutat/citit (negăsit în timp).
Concluzie [E]: toți au drag&drop + competențe + zone + durată pe tip + ture. Rar documentat: **legătura planificare ↔ stoc/material pe mașină și ↔ autorizație valabilă**. Acolo ElectroField are date (stoc, conformitate) pe care ceilalți nu le leagă public de planificator.

## 3. Ce costă cel mai mult (benchmark, nu RO)
First-time fix: medie ~75–77%, top ~86–89%; sub 70% se corelează cu retenție/satisfacție mai slabe; „primul fix" include lipsa de piese/vizită repetată [S, cifre de vendor, citate din Aberdeen, originalul necitit]. https://www.ibm.com/think/topics/first-time-fix-rate · https://customerthink.com/why-first-time-fix-alone-cant-define-service-performance/
Cele trei greșeli din temă [E, logică operațională, fără cifre RO]:
1. **Echipă fără material/aparat/autorizație** = drum pierdut (km + 2–4 ore om) + client nemulțumit.
2. **Dublă programare** (același om/mașină/client în două locuri; WhatsApp + telefon + patron programează independent).
3. **Client neanunțat** (întârziere, schimbare de echipă) = reclamații și lucrare refuzată la ușă.

## 4. Ziua dispecerului (flux tipic) [E, de validat]
Preluare (telefon/WhatsApp/e-mail/site → o singură coadă „cereri noi") → triere: urgență / planificat / ofertă → estimare durată (din tip lucrare + istoric) → alegere echipă (competență+autorizație+zonă+mașină+material) → confirmare client → dimineața: listă pe echipă → peste zi: urgențe inserate, întârzieri anunțate, reprogramări → seara: ce s-a terminat, ce nu, ce a rămas nefacturat, planul de mâine, materiale de pregătit. Săptămânal: încărcare echipe, lucrări restante, reprogramări și motive, ore estimate vs reale.

## Ce înseamnă pentru ElectroField
| # | Funcție concretă | Prioritate | Pentru cine |
|---|---|---|---|
| 1 | **Coadă unică „Cereri noi"** cu sursă (telefon/WhatsApp/e-mail/site), urgență, și buton „programează" → creează lucrare; fără ea cererile rămân în telefoane | Mare | Birou |
| 2 | **Verificare la programare (avertizări, nu blocaje)** când tragi lucrarea pe echipă în calendar: autorizația ANRE/ITP/calibrarea lipsește sau expiră; mașina/echipa deja ocupată (dublă programare); materialele lucrării nu sunt în stoc/mașină; peste capacitatea zilei. Date există deja | Mare | Birou |
| 3 | **Durată implicită pe tip de lucrare**, corectată automat din istoric (ore reale față de estimate); fără ea capacitatea e nesigură (ServiceTitan arată că durata goală strică totul) | Mare | Birou, patron |
| 4 | **Sugestie de echipă** (ca „Assist"): listează echipele eligibile după competență, autorizație, zonă, încărcare, distanță de ultima lucrare, cu motiv; dispecerul alege. Fără auto-asignare | Medie | Birou |
| 5 | **Rezervă pentru urgențe** setabilă (ex. 10–20% din ore/echipă) și flux „urgență": propune ce lucrare poate fi mutată, cu mesaj pregătit către clientul mutat | Medie | Birou, patron |
| 6 | **Reprogramare cu motiv obligatoriu** (client/material/echipă/vreme/operator) + mesaj WhatsApp/SMS preformatat către client prin link-ul de status; raport lunar pe motive | Mare | Birou, client |
| 7 | **„Plec spre tine" / întârziere**: tehnicianul apasă din app → clientul primește mesaj cu ora estimată (din GPS); dispecerul vede alertă de întârziere la 15 min | Medie | Tehnician, client |
| 8 | **Raport de seară (1 ecran)**: lucrări neterminate + motiv, nefacturate, materiale de pregătit pentru mâine pe fiecare echipă, clienți neconfirmați; raport săptămânal: încărcare, reprogramări, estimat vs real | Medie | Birou, patron |
| 9 | **Listă de pregătire a zilei de mâine** pe echipă (material de încărcat, scule, documente) cu bifare seara; reduce „echipă fără material" | Mare | Birou, tehnician |
| 10 | **Blocare/„fixat"** a asignărilor confirmate cu clientul și jurnal cine a mutat ce (ca „nu suprascrie decizia umană") | Mică | Birou |

Validare necesară înainte de construcție: 3–5 interviuri cu firme reale (cine programează azi, în ce unealtă, câte reprogramări/săptămână), deoarece partea românească a acestui raport este estimare.
