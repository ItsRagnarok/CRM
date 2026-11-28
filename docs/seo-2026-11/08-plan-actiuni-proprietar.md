# Plan de acțiuni pentru proprietar (28 noiembrie 2026)

Ce faci tu, pas cu pas, ca ElectroField să apară în Google. Bifează pe măsură ce termini.

---

## 1. De ce nu apari încă în Google

La „software de management electricieni și echipe mobile” nu apari încă, pentru că:

- **Site-ul are o săptămână.** Google a indexat circa 29 de pagini.
- **Zero linkuri externe.** Cei de pe prima pagină au ani de istoric, linkuri și titluri cu exact cuvintele căutate.
- **Search Console nu e conectat.**
- Căutarea are volum mic. Volumul e la căutările de documente (foaie de parcurs, PRAM, revizie gaze), pe care lucrează blogul.

**Ce s-a lucrat azi pe site** (detaliile în commitul din 28 nov): pagina /despre, 3 articole noi, titluri și descrieri rescrise, imagini de distribuire pe fiecare pagină, afirmații corectate după ce face platforma acum (iPhone, fără semnal, PRAM), mai multe linkuri între pagini.

**Cât durează:** paginile noi intră în index în zile sau săptămâni. Pentru căutările generale, realist 3–6 luni sau mai mult. **Nimeni nu poate garanta poziții în Google.**

---

## 2. Săptămâna 1: Search Console, Bing, IndexNow

### 2.1 Google Search Console (proprietate Domeniu)

Am verificat azi în Vercel: **DNS-ul lui electrofield.ro e la Hostico** (ns1–ns4.hostico.ro), nu în Vercel.

- [ ] 1. https://search.google.com/search-console → „Adaugă o proprietate” → **Domeniu** → `electrofield.ro`
- [ ] 2. Copiază textul TXT (începe cu `google-site-verification=`).
- [ ] 3. **Drumul A (acum):** contul Hostico → domeniul → zona DNS → înregistrare nouă:
  ```
  Tip: TXT
  Nume/Host: @   (sau gol)
  Valoare: google-site-verification=...
  ```
  Nu atinge înregistrările A și CNAME: țin site-ul pornit.
- [ ] 3b. **Drumul B (doar dacă muți DNS-ul în Vercel):** Vercel → Domains → electrofield.ro → DNS Records → Add, tip TXT, nume `@`, aceeași valoare.
- [ ] 4. Search Console → **Verifică**. Poate dura până la 2–3 zile. Nu șterge apoi TXT-ul.
- [ ] 5. „Sitemapuri” → `https://www.electrofield.ro/sitemap.xml` → Trimite.
- [ ] 6. „Inspectarea adresei URL” → fiecare adresă → **Solicită indexarea**. La mesaj de cotă, continui mâine.

```
https://www.electrofield.ro/
https://www.electrofield.ro/software-management-echipe-teren
https://www.electrofield.ro/firme-instalatii-electrice
https://www.electrofield.ro/firme-gaze-verificari-revizii
https://www.electrofield.ro/firme-fotovoltaice
https://www.electrofield.ro/aplicatie-tehnician
https://www.electrofield.ro/pontaj-tehnicieni
https://www.electrofield.ro/despre
https://www.electrofield.ro/blog/model-foaie-de-parcurs
https://www.electrofield.ro/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate
```

### 2.2 Bing Webmaster Tools
- [ ] https://www.bing.com/webmasters → „Import from Google Search Console”.

### 2.3 IndexNow după fiecare deploy
Anunță Bing și alte motoare (nu Google) că s-au schimbat pagini.
- [ ] După ce deploy-ul e live, din folderul proiectului: `npm run seo:indexnow` (trimite tot sitemap-ul). Doar previzualizare: `npm run seo:indexnow -- --dry-run`. O dată pe deploy, nu mai des.

### 2.4 Google Business Profile: verifică întâi dacă ai voie
Google acceptă profil doar dacă ai **o adresă unde te vizitează clienții** sau **te deplasezi la clienți**. ElectroField lucrează online, deci probabil nu e eligibil. **Nu folosi adresă virtuală sau închiriată**: e interzis și duce la suspendare.
- [ ] Dacă primești clienți la un birou: https://www.google.com/business/ → categoria **„Companie de software”**, datele de mai jos.

### 2.5 Aceleași date peste tot
Exact ca pe /despre:
```
Nume: ElectroField
Site: https://www.electrofield.ro
E-mail: contact@electrofield.ro
Telefon: 0750 425 670 (+40 750 425 670)
Localitate: București, Sector 1, România
CUI: 55851462 · Reg. Com.: F2026050162004
```
La PFA, „denumirea legală” conține numele tău. În câmpurile publice scrie „ElectroField”.
- [ ] Fă pagini ElectroField pe LinkedIn, Facebook și YouTube și trimite-mi linkurile (le pun în schema `sameAs`).

---

## 3. Săptămânile 1–4: listări și linkuri

Peste tot trimiți: descrierile din secțiunea 4, logo (`public/icon-512.png`), 4–6 capturi cu date fictive, contact@electrofield.ro. Preț: „la cerere” / „Contact for pricing”. Probă gratuită: nu. Platforme: Web și Android.

| # | Unde | Ce faci | Cost |
|---|------|---------|------|
| 1 | https://www.capterra.com/vendors/ (apare și pe GetApp, Software Advice) | „Get Your Product Listed”, categoria Field Service Management | gratuit, de confirmat |
| 2 | https://www.saashub.com | „Submit your product” | gratuit |
| 3 | https://alternativeto.net | „Add application” | gratuit |
| 4 | https://sourceforge.net/software/ | „Add product” | gratuit, de confirmat |
| 5 | https://www.crozdesk.com | înscriere furnizor | de confirmat |
| 6 | https://www.softwaresuggest.com | înscriere furnizor | de confirmat |
| 7 | https://www.g2.com/products/new | pagină produs | gratuit, de confirmat |
| 8 | Oblio: https://www.oblio.eu/integrari | contact, cerere de listare la integrări | gratuit |
| 9 | SmartBill: vreauapi@smartbill.ro | cerere de listare ca aplicație integrată | necunoscut |
| 10 | StartupCafe: redactie@startupcafe.ro | e-mailul 4.3 | gratuit, negarantat |
| 11 | https://start-up.ro/contact/ | același text | gratuit, negarantat |
| 12 | PSR/RPIA: https://rpia.ro/membership/ | **de verificat** dacă primesc firme de software | necunoscut |
| 13 | Cursuri ANRE (ex. https://www.upet.ro/cursanre/) | **de verificat**; e-mailul 4.4 | gratuit |
| 14 | 3–5 bloguri de contabili | ghidul e-Factura B2B, fără să ceri link | gratuit |
| 15 | https://softlead.ro/companii-software | **mai târziu**, după primii clienți | 900–2.500 EUR/an + TVA |

Înainte de 8 și 9: emite o factură de test dintr-un cont real SmartBill și unul Oblio. Integrările nu au fost încă încercate pe o firmă reală.

Alte asociații (AEI, ANIE, AIIR, OAER, ARIES): de verificat manual. Fără schimburi de linkuri sau spam: Google penalizează.

---

## 4. Texte gata de copiat

### 4.1 Descriere scurtă
```
ElectroField este o platformă românească pentru firmele de instalații electrice, gaze și fotovoltaice cu echipe în teren. Biroul programează lucrările în calendar și pe hartă, din browser. Tehnicianul le vede în aplicația Android (APK, descărcată de pe site) sau, pe iPhone, din browser: pașii lucrării, poze, checklist, măsurători și semnătura clientului. Pozele, semnătura, sosirea, începutul și finalul se salvează pe telefon și pleacă singure când revine semnalul. Platforma ține pontajul pe lucrare, stocul de pe mașini, autorizațiile ANRE și scadențarul de gaze. Factura se emite prin contul SmartBill sau Oblio al firmei.
```

### 4.2 Descriere lungă
```
ElectroField (https://www.electrofield.ro) este un software de management pentru firmele de instalații electrice, gaze și fotovoltaice din România. Ține într-un singur loc clienții, lucrările, echipele, pontajul, materialele, documentele și facturarea. Biroul lucrează în browser; tehnicienii folosesc aplicația Android (APK, descărcată de pe site) sau, pe iPhone, din browser.

În teren, tehnicianul vede lucrările zilei, face poze etichetate, bifează checklistul, trece măsurătorile și ia semnătura clientului pe ecran. Pontajul se face pe lucrare: plecare, sosire cu locația, început și final. Pozele, semnătura, sosirea, începutul, finalul și formularele se salvează pe telefon și pleacă singure când revine semnalul. Biroul vede pe hartă lucrările și echipele, orele pe om și pe lucrare și stocul fiecărei mașini.

Pentru electrice: măsurători pe circuite, proces-verbal de lucrări ascunse cu poze, înregistrare semnată doar de cine are autorizație ANRE valabilă. Pentru gaze: scadențar pe bloc, scară și apartament și fișa semnată pe telefon. Pentru fotovoltaice: dosar pe etape cu termenele operatorului și formularul de punere în funcțiune. Factura se completează din ore și materiale și se emite prin contul SmartBill sau Oblio al firmei. Platforma e nouă, din 2026; o prezentare se programează pe https://www.electrofield.ro/programare.
```

### 4.3 E-mail către presă
**Subiect:** `Platformă românească nouă pentru firmele de instalații cu echipe în teren`
```
Bună ziua,

Vă scriu de la ElectroField (https://www.electrofield.ro), o platformă românească lansată în 2026 pentru firmele de instalații electrice, gaze și fotovoltaice cu echipe în teren.

Multe firme mici de instalații țin lucrările în Excel și pe WhatsApp, deși au acte și termene stricte: autorizații ANRE, fișe de gaze, dosare de prosumator. ElectroField leagă programarea, aplicația tehnicianului, pontajul, materialele și facturarea prin SmartBill sau Oblio. Pe blog publicăm ghiduri gratuite, de exemplu https://www.electrofield.ro/blog/model-foaie-de-parcurs.

Dacă subiectul vă interesează, vă trimit o descriere sau programăm o discuție: https://www.electrofield.ro/programare?utm_source=startupcafe

Mulțumesc,
[numele tău], ElectroField
contact@electrofield.ro · 0750 425 670
```
Pentru start-up.ro: `utm_source=startupro`.

### 4.4 E-mail către asociații și cursuri ANRE
**Subiect:** `Ghiduri gratuite pentru membri: PRAM, autorizație ANRE, foaie de parcurs`
```
Bună ziua,

Vă scriu de la ElectroField (https://www.electrofield.ro), o platformă românească pentru firmele de instalații electrice, gaze și fotovoltaice cu echipe în teren.

Membrii [cursanții] dumneavoastră lucrează cu documentele explicate în ghidurile noastre gratuite, pe care le puteți folosi sau cita:
https://www.electrofield.ro/blog/verificare-pram-rezistenta-priza-de-pamant-periodicitate
https://www.electrofield.ro/blog/autorizatie-anre-electrician

Pot face și o prezentare scurtă a platformei pentru membri. O discuție se programează aici: https://www.electrofield.ro/programare?utm_source=[asociatie]

Mulțumesc,
[numele tău], ElectroField
contact@electrofield.ro · 0750 425 670
```
`[asociatie]` = numele cu litere mici, fără spații (ex. `psr`). Vezi rezultatele în /admin/analitice.

---

## 5. Google Play și App Store

**De decis înainte:**
- **Cont personal:** Google afișează public **numele tău legal**, țara și e-mailul. Conturile personale noi fac întâi un test închis: **minimum 12 testeri, 14 zile la rând**.
- **Cont de organizație:** cere număr D-U-N-S; afișează denumirea legală (la PFA conține numele tău), adresa și telefonul.
- Taxă unică de înregistrare (suma în Play Console).
- Mai trebuie: build AAB semnat, `google-services.json`, declarația pentru locația în fundal (cu video), Data safety, cont pentru recenzorul Google cu date fictive (decizia ta).
- Risc: Google poate respinge o aplicație care doar afișează un site. În nota pentru recenzor scrie ce face nativ: GPS în fundal cu acord, notificări push, camera. Separat: ce face tehnicianul la client se salvează pe telefon și pleacă când revine semnalul.

**Listing** (verificat pe ce face platforma):
```
Titlu: ElectroField: Pontaj lucrări
Descriere scurtă: Pontaj, lucrări, poze și semnătura clientului pentru echipe de instalații

ElectroField este aplicația tehnicianului pentru firmele de instalații electrice, gaze și fotovoltaice. Se folosește cu un cont creat de firma ta în platforma ElectroField (www.electrofield.ro).

• Lucrările zilei, cu adresa și navigare spre client
• Pontaj pe lucrare: plecare, sosire, început, final
• Poze etichetate, checklist, măsurători, semnătura clientului
• Materiale din mașină, cheltuieli cu poza bonului, concedii
• Fără semnal: pozele, semnătura, sosirea, începutul, finalul, formularele și fișele de gaze se salvează pe telefon și pleacă singure când revine semnalul
• Mod „mănuși” și mod „soare”

Locația se salvează la sosire. Urmărirea continuă pornește doar dacă firma o activează și tu îți dai acordul.
```
- [ ] Când aplicația e **live**, trimite-mi linkul. Abia atunci scriu „Google Play” pe site.

**App Store:** cere abonament anual Apple Developer și build semnat. Până atunci, pe site rămâne „pe iPhone, din browser”.

---

## 6. YouTube

Canalul firmei, 4–8 minute, date fictive pe ecran, subtitrare în română, fără prețuri și fără funcții care nu există.

**Video 1 (căutarea principală)**
```
Titlu: Software de management pentru electricieni și echipe de teren: demo

Cum arată o zi într-o firmă de instalații cu ElectroField: programare, aplicația tehnicianului, pontaj, poze și semnătură, documente, facturare.
Programează o discuție: https://www.electrofield.ro/programare?utm_source=youtube
Pagina produsului: https://www.electrofield.ro/software-management-echipe-teren

0:00 Problema: Excel și grupuri de WhatsApp
0:40 Biroul programează lucrările pe echipe
1:30 Tehnicianul în telefon: lucrările zilei
2:20 Pontaj pe lucrare
3:00 Poze, checklist, semnătură
4:00 Biroul vede lucrarea închisă și documentele
4:50 Facturarea prin SmartBill sau Oblio
5:30 Pentru ce firme e potrivit
```

**Video 2:** `Aplicație pentru tehnicieni: lucrări, poze și semnătura clientului` → /aplicatie-tehnician. Capitole: 0:00 Lucrările zilei · 0:45 Pașii lucrării · 1:30 Poze · 2:15 Checklist și măsurători · 3:00 Semnătura · 3:30 Ce merge fără semnal.

**Video 3:** `Pontaj pe lucrare din telefon pentru echipe de teren` → /pontaj-tehnicieni.

**Video 4:** `Foaie de parcurs electronică, din lucrările făcute` → /foaie-de-parcurs-electronica. Spune că forma finală se confirmă cu contabilul.

**Video 5:** `Scadențar verificări și revizii gaze pe bloc, scară și apartament` → /firme-gaze-verificari-revizii. Spune că termenele se confirmă cu responsabilul tehnic.

- [ ] După încărcare, **trimite-mi linkul fiecărui video**: îl pun pe pagina potrivită, cu schema VideoObject.

---

## 7. Recenzii reale

Cere recenzii doar firmelor care au folosit platforma câteva săptămâni, cu link direct (Capterra; Google, dacă ai profil). **Niciodată** recenzii scrise de tine, de prieteni, dictate sau răsplătite.

**Subiect:** `Două minute pentru o părere despre ElectroField?`
```
Salut, [prenume],

Folosești ElectroField de câteva săptămâni. Mi-ar prinde bine o părere sinceră, bună sau rea: [link recenzie]

Ce te-a încurcat mă ajută să repar.

Mulțumesc,
[numele tău]
```

---

## 8. Ce urmărești și ce îmi trimiți

| Când | În Search Console | Ce e normal |
|------|-------------------|-------------|
| 2 săpt. | Pagini; Sitemapuri | sitemap „Succes”, paginile cheie indexate |
| 4 săpt. | Performanță → Interogări | primele afișări pe ghiduri |
| 8 săpt. | Performanță → Pagini; Linkuri | afișări pe paginile pe meserii, primele linkuri |
| 12 săpt. | Performanță, 3 luni | poziția medie scade pe căutările țintă |

**Trimite-mi:**
- [ ] exportul CSV din Performanță (Interogări + Pagini);
- [ ] captura „De ce nu sunt indexate paginile”;
- [ ] linkurile listărilor aprobate și ale profilurilor LinkedIn, Facebook, YouTube;
- [ ] linkurile video-urilor și Google Play, când există;
- [ ] sursele `utm_source` din /admin/analitice și câte programări au venit.
