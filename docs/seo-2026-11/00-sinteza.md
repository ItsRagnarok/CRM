# SEO ElectroField: sinteză și plan (25 noiembrie 2026)

Bazată pe 7 rapoarte din acest folder (01–07). **Limită importantă:** nu avem volume de căutare. Sugestiile Google au fost văzute real ([V]), dar câte căutări pe lună au se află doar din Google Search Console / Keyword Planner. Primul pas tehnic e conectarea Search Console.

## 1. Ce caută clienții care încă nu ne cunosc

1. **Nu caută „soft”.** „Aplicație pentru electricieni”, „program pentru instalatori”, „CRM fotovoltaice”, „program verificări gaze” au sugestii aproape goale. Categoria nu e încă numită de piață. Câștigăm pe ce caută ei de fapt, nu pe numele categoriei.
2. **Caută documente și modele** („model … word/excel/pdf/completat”): deviz, proces-verbal de recepție, PV de lucrări ascunse, bon de consum, foaie de parcurs, pontaj, fișă de intervenție, certificat de garanție, contract de prestări, buletin PRAM, PV de punere în funcțiune fotovoltaic. În multe cazuri **nu există un model românesc bun** (rezultatele sunt din Moldova sau în engleză). Aici e breșa principală.
3. **Caută obligații și termene:** Ord. ANRE 179/2015 (gaze), autorizare ANRE, dosar prosumator și ATR, Casa Verde, e-Factura, foaie de parcurs, GPS și GDPR.
4. **Caută bani:** preț manoperă, tarif pe oră, preț instalație pe apartament, avans. Un calculator bate un articol.
5. **Proprietarii** (preț verificare gaze + oraș, contor bidirecțional) au cele mai multe sugestii, dar nu sunt clienții noștri. Le facem doar pagini-punte, fără bătălie pe „preț + oraș”.

## 2. Concurența

- **Direct, în română:** Zarina CRM (licență definitivă 2.490–3.990 EUR, pagini pe instalații/fotovoltaice, modele descărcabile, calculator diurnă — face deja strategia de mai jos) și Aktio (SaaS, de la 15 EUR/utilizator/lună).
- **Alții:** Bento FSM (enterprise, fără preț) și Odoo (general).
- **Străini** (Jobber, ServiceTitan, Zoho FSM): în engleză, prețuri în USD, fără ANRE sau e-Factura.
- **Spațiul liber:** nimeni nu leagă ANRE + gaze (verificări/revizii) + fotovoltaic + pontaj + foaie de parcurs + facturare. Asta e poziționarea noastră.

## 3. Plan pe 90 de zile

### A. Tehnic (săptămâna 1–2), din raportul 06
1. Google Search Console + Bing Webmaster: verificare domeniu și trimiterea sitemap-ului; Google Business Profile.
2. Un singur sitemap: `src/app/sitemap.ts` cu `lastmod`; ștergerea `public/sitemap-blog.xml` (învechit).
3. Pagina `/` statică, fără apel la sesiune; fonturi WOFF2 în loc de TTF (~1,8 MB); imagini WebP la 1200 px; H1 vizibil fără să aștepte animația.
4. Schema: WebSite, BreadcrumbList pe toate articolele, FAQPage unde există FAQ, `og:image` + `twitter:card` pe toate cele 16 pagini care nu le au; titluri sub 60 de caractere.
5. Încredere: pagină „Despre” cu denumirea legală, CUI și adresă; autor numit pe articole.

### B. Pagini noi de produs (luna 1–2), din rapoartele 04 și 07
- **Pe meserie:** `/firme-instalatii-electrice`, `/firme-gaze-verificari-revizii`, `/firme-fotovoltaice` — fiecare cu problemele, documentele și obligațiile meseriei și capturi din aplicație.
- **Pe funcționalitate:** `/pontaj-tehnicieni`, `/foaie-de-parcurs-electronica`, `/aplicatie-tehnician` (poze, semnătură, offline), `/raport-interventie-digital`, `/stoc-pe-masini`, `/profit-pe-lucrare`, `/integrare-smartbill-oblio`.
- **Comerciale:** `/preturi` (preț public — concurenții care îl au câștigă încredere) și `/comparatie` (cinstită: ElectroField vs Zarina vs Odoo vs Excel).

### C. Conținut: magneți de trafic (câte 2 pe săptămână)
Fiecare are: instrument interactiv sau model descărcabil, schemă sau copertă proprie, FAQ cu schema, surse datate, legătură firească spre aplicație.

| Prioritate | Articol / instrument | Public |
|---|---|---|
| ✅ publicat 25.11 | Proces-verbal de punere în funcțiune fotovoltaic + fișă pe string (generator PDF) | firme fotovoltaice |
| ⏰ 25.11, 12:30 | Fișa de evidență gaze + scadențar pe bloc + calculator termene (Ord. 179) | firme gaze |
| ⏰ 25.11, 12:30 | Calculatorul tarifului minim pe oră | toți patronii |
| 1 | Model buletin de verificare PRAM / rezistență de izolație (generator) | electricieni |
| 2 | Proces-verbal de lucrări ascunse (generator, cu poze) | electricieni, termice |
| 3 | Foaie de parcurs: model + generator lunar din traseu | toți |
| 4 | Model deviz instalații electrice (Excel + generator) | electricieni |
| 5 | Contract de prestări servicii instalații cu persoană fizică (model, clauze explicate) — de validat cu jurist | toți |
| 6 | Pontaj tehnicieni pe teren: model Excel + diferența față de aplicație | toți |
| 7 | Registru de verificări gaze în Excel (scadențar descărcabil) | firme gaze |
| 8 | Dosarul instalatorului pentru Casa Verde (baterii) 2026 | firme fotovoltaice |
| 9 | Calculator preț instalație electrică pe apartament (2/3/4 camere) | electricieni (și punte pentru proprietari) |
| 10 | Fișă de intervenție / raport de lucru (generator cu semnătură) | toți |

Toate articolele juridice și fiscale se datează și se verifică cu sursa oficială. Ce nu e verificat se spune clar în articol, ca în cele trei publicate azi.

### D. Linkuri și mențiuni (continuu), din raportul 07
- Listare cu recenzii reale în Capterra/GetApp, G2, SourceForge, GoodFirms, AlternativeTo.
- Relații cu RPIA/PSR, AIIR, școlile de autorizare ANRE (cursuri UPET/UPT), distribuitorii de materiale electrice și contabilii (articole invitate).
- Studii de caz cu primii clienți reali (permit și recenzii).

### E. Măsurare
- Search Console: impresii și clicuri pe pagină și pe interogare, lunar.
- Analiticele proprii din Super Admin: vizite pe articole și clicuri pe „Programează un demo”.
- La 30 și 60 de zile: ce interogări apar efectiv în Search Console → următoarele articole se aleg după ele, nu după estimări.

## 4. Fișierele de detaliu
- `01-electricieni.md`, `02-gaze.md`, `03-fotovoltaice.md`: cuvinte cheie pe meserie, cu [V]/[E] și oportunități.
- `04-categorie-echipe-teren.md`: termenii generali și concurenții pe fiecare.
- `05-probleme-si-modele.md`: cele 15 „magneți de trafic” cu conținut propus.
- `06-audit-tehnic.md`: toate problemele tehnice, cu fișierul și remedierea.
- `07-concurenti.md`: concurenți, tipare de conținut, 20 de surse de linkuri.
