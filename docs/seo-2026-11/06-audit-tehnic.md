# Audit SEO tehnic — www.electrofield.ro (25 noiembrie 2026)

Metodă: citire cod în /home/user/CRM (nimic modificat) + 3 verificări live (robots.txt, sitemap.xml, apex). Număr de cuvinte = text din `<main>`, fără scripturi (calculatoarele interactive adaugă conținut neinclus aici).

## Rezumat
1. Baza de indexare e sănătoasă: robots.txt corect, sitemap cu 29 URL-uri, canonical pe toate paginile publice, `lang="ro"`, `noindex` implicit pe aplicație/login/status, redirecturi `.html` → fără extensie.
2. Cea mai mare lipsă este arhitectura: site-ul are practic 1 pagină comercială (/) + blog; nu există pagini pe domenii (electric/gaze/fotovoltaic), pe funcționalități (pontaj, foaie de parcurs, facturare, aplicație tehnician), „Despre”, prețuri sau FAQ.
3. Date structurate parțiale: Organization + SoftwareApplication pe /, BlogPosting/Article pe articole; lipsesc BreadcrumbList, FAQPage, WebSite, Offer, CollectionPage pe /blog, imagine/dateModified pe 14 articole vechi.
4. Performanță: landing-ul e `"use client"` integral cu gsap+ScrollTrigger, pagină dinamică (apel Supabase `getUser()` pe `/`), fonturi TTF de ~1,8 MB, imagini JPG de 2000 px (118–522 KB) și `@import` Google Fonts în blog — riscuri pentru LCP/INP.
5. Încrederea locală e slabă: fără denumire legală/CUI/adresă, fără pagină „Despre”, autor „Echipa ElectroField”, fără recenzii/studii de caz; titlurile din blog sunt adesea peste 60 de caractere și 16 din 25 pagini nu au og:image.

## Tabel de probleme

| # | Problemă | Unde | Gravitate | Remediere concretă |
|---|---|---|---|---|
| 1 | Două sitemap-uri nesincronizate: `public/sitemap-blog.xml` (cu lastmod, 25 URL, `/blog` lastmod 2026-11-04 deși există articole din 11-09) și `src/app/sitemap.ts` (29 URL, FĂRĂ lastmod). robots.txt indică doar sitemap.xml | `src/app/sitemap.ts`, `public/sitemap-blog.xml`, `src/app/robots.ts` | importantă | Șterge `sitemap-blog.xml` sau generează-l din același cod; adaugă `lastModified` în `sitemap.ts` (din `dateModified` al fiecărui articol; pentru `/` data ultimei modificări reale). |
| 2 | Landing-ul `/` e dinamic: `createClient()` + `auth.getUser()` la fiecare cerere, deci fără cache static/CDN și TTFB mai mare pentru Googlebot | `src/app/page.tsx` | importantă | Mută landing-ul pe o rută statică (ex. grup `(marketing)`), iar redirectul utilizatorilor autentificați făcut în middleware (cookie de sesiune) sau pe client. |
| 3 | Fonturi TTF necomprimate: Inter 877 KB, Unbounded 778 KB, JetBrains Mono 187 KB (≈1,8 MB) via `next/font/local` | `src/app/layout.tsx`, `src/app/fonts/` | importantă | Convertește în WOFF2 subset latin + latin-ext (ar scădea la ~100–200 KB total), încarcă JetBrains Mono doar în aplicație, nu pe site-ul public. |
| 4 | Landing integral client-side: `marketing-landing.tsx` e `"use client"`; gsap + ScrollTrigger (~70–100 KB gz) încărcate la prima vizită; textul H1 pornește `opacity:0` și apare după hidratare (animație `fromTo`) | `src/components/marketing/*` | importantă | Fă componentele statice server components, izolează doar animația în componente mici încărcate cu `dynamic`; setează starea inițială din CSS (nu opacity 0 în JS) ca LCP să nu aștepte hidratarea; respectă `prefers-reduced-motion`. |
| 5 | Imagini marketing mari și nelimitate: JPG 2000×1500 (van-dusk 118 KB), 2000×1333 (pylons 373 KB, technician-phone 522 KB), city-night 1600 px 390 KB. Hero are `priority` (bine), restul se bazează pe next/image. În articole aceleași JPG sunt folosite brute ca `<img class="cover">` (fără srcset/WebP, fără `loading`) | `public/marketing/`, `public/blog/*.html` | importantă | Generează variante WebP/AVIF 1200 px (<100 KB) pentru articole; în articole adaugă `fetchpriority="high"` pe cover, `srcset`; recomprimă technician-phone la <150 KB. |
| 6 | Blog: `@import url(fonts.googleapis.com …)` în `blog-style.css` (CSS blocant în lanț, 2 cereri externe) și în `programare.html` (link blocant) | `public/blog-style.css:1`, `public/programare.html` | importantă | Auto-găzduiește fonturile (WOFF2) cu `font-display:swap` și `preload`; elimină `@import`. Elimină și dependența de terți (GDPR – IP către Google). |
| 7 | 16 din 25 pagini de blog (inclusiv `/blog` index) nu au `og:image`; niciuna nu are `twitter:card`; `/blog` nu are `og:url` | `public/blog/*.html` (articolele din 19–28 oct + index) | importantă | Adaugă `og:image` (1200×630), `og:url`, `og:site_name`, `twitter:card=summary_large_image` în șablonul de articol. |
| 8 | Titluri prea lungi (peste ~60 car.; 19 din 24 articole): ex. „Contract de mentenanță … ce include și cât poți câștiga | ElectroField” (124), „Urmărirea echipelor cu GPS … (GDPR) …” (106). Vor fi trunchiate în SERP | `<title>` din articole | minoră | Scurtează la 50–60 car. cu cuvântul cheie la început; sufixul „| ElectroField” doar dacă încape. |
| 9 | Meta description scurte sau lipsite de CTA: 83 (cat-avans), 95 (panouri), 98 (clienți dificili) car.; index blog 126 | idem | minoră | 140–158 car., cu cuvânt cheie + beneficiu. |
| 10 | Titlul și descrierea homepage generice: „ElectroField | Software pentru firme de instalații”; descrierea = `SITE_DESCRIPTION` (nu menționează electrice/gaze/fotovoltaice, nici „pontaj”, „foaie de parcurs”) | `src/lib/seo.ts`, `src/app/page.tsx` | importantă | Ex. title: „Program pentru firme de instalații electrice, gaze și fotovoltaice | ElectroField”; meta cu domeniile și funcțiile principale. |
| 11 | Date structurate incomplete: lipsesc BreadcrumbList (deși articolele au breadcrumb vizibil), FAQPage, WebSite, CollectionPage/ItemList pe `/blog`, `Offer`/`price` în SoftwareApplication (Google cere offers/rating pentru rich result), `sameAs` în Organization. Articolele vechi (`Article`, 14 buc.) n-au `image`, `dateModified`, `publisher.logo`; cele noi (`BlogPosting`, 10 buc.) n-au `publisher` cu logo; tip inconsistent Article/BlogPosting | `src/app/page.tsx`, `public/blog/*.html` | importantă | Unifică pe BlogPosting + `image`, `dateModified`, `publisher{logo}`, `author` cu pagină „Despre”; adaugă BreadcrumbList; FAQPage doar acolo unde FAQ-ul e vizibil. |
| 12 | Imagini cover cu `alt=""` pe toate articolele (figcaption generic) și aceeași poză pentru mai multe articole; pe landing toate imaginile au `alt=""` | `public/blog/*.html`, `hero.tsx`, `scene-*.tsx`, `cta.tsx` | minoră | Alt descriptiv pentru imaginile de conținut (ex. „Tehnician cu telefonul pe șantier…”); păstrează `alt=""` doar pe decor. |
| 13 | Legături interne slabe între articole: 3 articole fără niciun link spre alt articol (gestionare-echipe-de-teren, reducere-timpi-deplasare, tehnician-vs-administrator); 13 cu un singur link; 3 articole fără link spre /programare (cat-avans, clienți dificili, panouri) | `public/blog/*.html` | importantă | Bloc „Citește și” (3 linkuri contextuale) în fiecare articol; CTA spre /programare și spre pagini noi de funcționalitate. |
| 14 | Din `/` Google ajunge la articole doar prin 2 linkuri generice `/blog` (nav + CTA/footer); fără secțiune „Ghiduri recomandate” cu linkuri directe | `nav.tsx`, `cta.tsx`, `footer.tsx` | importantă | Secțiune pe homepage cu 6 articole de top; linkuri din pagini noi de domeniu către clustere de articole. |
| 15 | Meniul homepage folosește ancore (#platforma, #functionalitati) — o singură pagină; ancorele nu se indexează ca pagini separate. `#platforma` referit în blog (`/#platforma`) | `nav.tsx`, `footer.tsx` | importantă | Vezi „Pagini noi recomandate”. |
| 16 | `/signup` redirect temporar (307) spre /programare; `/blog/index` și `/blog/index.html` → `/blog` (301, OK). Nu am găsit redirect www↔apex în cod (se face la Vercel/DNS); la verificare live apex-ul `electrofield.ro` nu a părut să redirecționeze (nu am putut confirma statusul HTTP) | `next.config.ts`, setări domeniu Vercel | importantă | Confirmă în Vercel că `electrofield.ro` → 301 → `www.electrofield.ro`; verifică cu `curl -I`. |
| 17 | Pagini fără indexare dorită — OK: layout rădăcină `robots: noindex,nofollow` implicit; /login, /mobil, /admin, /(app) moștenesc; `/status/[token]` și `/mobil-login` au noindex explicit; robots.txt permite crawl (corect, ca să se vadă noindex) și blochează doar `/api/`. Atenție: `/downloads/electrofield.apk` (6,8 MB) e public și crawlabil | `layout.tsx`, `robots.ts`, `public/downloads` | minoră | Adaugă `Disallow: /downloads/` sau `X-Robots-Tag: noindex` pe .apk; rută dedicată de descărcare cu noindex. |
| 18 | `termeni` și `confidentialitate`: „Ultima actualizare” = `new Date()` (data cererii, se schimbă zilnic), fără `lastmod` real; conținut `text-[#344054]` pe fundal alb, fără linkuri înapoi spre `/` (doar „Înapoi” → /login) | `src/app/termeni/page.tsx`, `confidentialitate/page.tsx` | minoră | Dată fixă a ultimei modificări; link „Acasă”. Pot rămâne indexabile sau trecute pe noindex (valoare SEO mică). |
| 19 | `programare.html` e pagină statică cu stiluri inline mari, H1 unic (OK), dar are doar 266 cuvinte, fără schema, fără `og:site_name`; e destinația tuturor CTA — bine, dar nu se vrea ranking pe ea | `public/programare.html` | minoră | Lasă canonical; adaugă schema `ContactPage`/`Organization`; nu o optimiza pentru ranking. |
| 20 | Pagina mobilă offline `mobil-offline.html`, `sw.js`, `manifest.json` publice (nu sunt în sitemap, fără noindex explicit pe `mobil-offline.html`) | `public/mobil-offline.html` | minoră | `<meta name="robots" content="noindex">` pe `mobil-offline.html`. |
| 21 | Un singur H1 pe pagină (OK) pe /, /blog, articole, /programare, /termeni, /confidentialitate; pe landing structura H2: 3 `<h2>` (live-map, job-journey, modules) + 1 CTA `<h2>` + 1 `<h3>`; fără H2 pentru funcții concrete; headingurile sunt scurte/slogane („Un singur sistem. Întregul tău business.”) fără cuvinte-cheie | `src/components/marketing/*.tsx` | importantă | H2 descriptive cu domeniul și funcția („Foaie de parcurs și pontaj pentru tehnicieni”, „Facturare și materiale”) + text vizibil în HTML. |
| 22 | Conținutul landing: majoritatea în module animate/„scene”; textul mic (carduri de module cu 3–6 cuvinte); estimare <500 cuvinte reale pe pagina principală | `scene-modules.tsx` etc. | importantă | Adaugă 600–900 cuvinte utile (domenii, funcții, FAQ, pentru cine e), vizibile fără interacțiune. |
| 23 | `maximumScale: 1, userScalable: false` în viewport — blochează zoom-ul (accesibilitate; Lighthouse „Viewport” penalizează) pe toate paginile, inclusiv publice | `src/app/layout.tsx` | minoră | Elimină blocarea zoom-ului pentru paginile publice (poate rămâne pe `/mobil`). |
| 24 | Fără `hreflang` (nu e nevoie, site doar în română) și fără `WebSite` + `SearchAction`; lipsă `/apple-icon.png` în `public` (există în `src/app`, OK) | — | minoră | Nu e nevoie de acțiune; opțional schema WebSite. |

## Detalii pe cele 7 verificări

**1. Indexare.** robots.txt live: `Allow: /`, `Disallow: /api/`, `Sitemap: …/sitemap.xml`. Sitemap live: 29 URL (/ , /blog, /programare, /termeni, /confidentialitate + 24 articole), fără `lastmod`. Canonical: setat prin `publicPageMetadata` (/, /termeni, /confidentialitate) și manual în HTML pentru blog/programare; toate au canonical absolut `https://www.electrofield.ro/...` fără extensie. Redirecturi: `.html` → fără extensie (301), `/blog/index(.html)` → `/blog`, `/programare.html` → `/programare`; `/signup` → `/programare` (307). Middleware tratează `/blog`, `/programare`, `/status` ca publice; paginile private moștenesc noindex.

**2. On-page.** Toate paginile au `lang="ro"`, un singur H1, imagini fără atribut `alt` lipsă (dar alt gol pe cover). `/blog` are 24 de H2 (titluri de carduri) și nu are intro text. Articolele au 4–8 H2, 0 H3; `programare` are 4 H2 și 3 H3. Open Graph: complet pe /, /termeni, /confidentialitate, /programare; parțial pe blog (vezi #7). Linkuri interne: vezi #13–14.

**3. Schema.org.** Există: Organization + SoftwareApplication (/ ; fără offers/rating/screenshot), Article (14 articole) / BlogPosting (10 articole) cu Organization ca autor. Lipsesc: BreadcrumbList, FAQPage, WebSite, ItemList/CollectionPage pe /blog, Person pentru autor, Offer, `sameAs`, LocalBusiness (nu e cazul fără adresă).

**4. Performanță (estimare din cod, fără build).** Fonturi 1,8 MB TTF (`display: swap`, dar volum mare, preload automat pentru fonturile folosite). JS blocant/greu: gsap + ScrollTrigger + lucide + landing „use client”; framer-motion (v14) e în dependențe — nu am găsit-o folosită în componentele marketing (se încarcă doar dacă e importată în ruta `/`; de verificat cu bundle analyzer). Hero image: JPG 2000×1500 prin next/image cu `priority` și `sizes=100vw` (poate fi servită AVIF/WebP optimizat — bine). Parallax pe scroll cu listener manual și 3D transform (INP/CLS minime, dar cost pe mobil). Estimare risc: LCP mediu-ridicat pe 4G (fonturi + hidratare + H1 ascuns până la animație), CLS mic, INP acceptabil.

**5. Arhitectura informației.** Pagini publice reale: `/`, `/blog`, 24 articole, `/programare`, `/termeni`, `/confidentialitate`. NU există pagini pe domenii (electric/gaze/fotovoltaic/CCTV/HVAC) și nici pe funcționalități. Articolele acoperă totuși domeniile (PRAM, gaze, prosumator, service fotovoltaic, centrale termice, CCTV) — dar fără pagini „pilon” care să le adune. Google ajunge la articole doar prin linkul `/blog` din nav/CTA/footer, apoi indexul listează toate cele 24.

**6. Local/încredere.** Date: email contact@electrofield.ro, telefon +40 750 425 670 (în schema Organization și footer), WhatsApp. Lipsesc: denumire legală, CUI/J, adresă, pagină „Despre/Echipa”, autori numiți, recenzii/studii de caz/logo clienți, pagină de prețuri. Recomandare (nu verificat live): creează Google Business Profile (categorie „Furnizor de software”), cu adresa de sediu sau „service-area business”, completează NAP identic cu site-ul, adaugă `sameAs` (LinkedIn, Facebook, GBP) în Organization și cere 5–10 recenzii de la clienți-pilot.

## Articolele blogului (punctul 7)

Linkuri: „art.” = linkuri spre alte articole; „prog.” = link spre /programare. Cuvinte din `<main>` fără scripturi; sitemap lastmod = data din sitemap-blog.xml.

| # | Slug (/blog/…) | Title (lungime) | Cuvânt cheie aparent | Cuvinte | Data | Linkuri art. | Prog. | Schema | og:image |
|---|---|---|---|---|---|---|---|---|---|
| 1 | gestionare-echipe-de-teren | Cum gestionezi o echipă de tehnicieni în teren: 6 probleme și soluții (84) | gestionare echipe teren | 473 | 2026-10-19 | 0 | da | Article | nu |
| 2 | reducere-timpi-deplasare-lucrari | Cum reduci timpii de deplasare între lucrări (59) | reducere timpi deplasare | 338 | 2026-10-19 | 0 | da | Article | nu |
| 3 | tehnician-vs-administrator | Tehnician vs. administrator: ce trebuie să vadă fiecare (70) | roluri tehnician/administrator | 279 | 2026-10-19 | 0 | da | Article | nu |
| 4 | model-proces-verbal-raport-lucrare | Model de proces-verbal (raport de lucrare)… (96) | model proces verbal lucrare | 381 | 2026-10-20 | 1 | da | Article | nu |
| 5 | program-management-firma-instalatii | Cum alegi un program de management pentru o firmă de instalații: 8 criterii (90) | program management firmă instalații | 326 | 2026-10-20 | 1 | da | Article | nu |
| 6 | cum-calculezi-profitul-pe-lucrare | Cum calculezi cât câștigi de fapt pe o lucrare (74) | calcul profit lucrare | 360 | 2026-10-20 | 1 | da | Article | nu |
| 7 | checklist-instalare-sistem-fotovoltaic | Checklist pentru instalarea unui sistem fotovoltaic… (91) | checklist instalare fotovoltaic | 375 | 2026-10-22 | 1 | da | Article | nu |
| 8 | documente-predare-client-dupa-instalare | Ce documente predai clientului după o instalare (105) | documente predare client instalație | 339 | 2026-10-22 | 2 | da | Article | nu |
| 9 | service-sezonier-centrale-termice | Cum planifici reviziile sezoniere la centrale termice și pompe de căldură (88) | revizie centrală termică | 331 | 2026-10-22 | 1 | da | Article | nu |
| 10 | model-oferta-lucrari-electrice-fotovoltaice | Cum faci o ofertă pentru lucrări electrice, fotovoltaice sau de supraveghere (107) | model ofertă lucrări electrice | 377 | 2026-10-26 | 1 | da | Article | nu |
| 11 | contract-mentenanta-camere-supraveghere-securitate | Contract de mentenanță pentru camere de supraveghere… (124) | contract mentenanță supraveghere | 440 | 2026-10-26 | 1 | da | Article | nu |
| 12 | excel-sau-aplicatie-gestionare-lucrari | Excel, WhatsApp sau aplicație? Testul de 2 minute… (98) | aplicație gestionare lucrări | 344 | 2026-10-26 | 1 | da | Article | nu |
| 13 | urmarire-gps-echipe-teren-gdpr | Urmărirea echipelor cu GPS… (GDPR)… (106) | urmărire GPS angajați GDPR | 601 | 2026-10-28 | 1 | da | Article | nu |
| 14 | evidenta-orelor-tehnicieni-teren-pontaj | Evidența orelor tehnicienilor din teren… (102) | pontaj tehnicieni teren | 434 | 2026-10-28 | 1 | da | Article | nu |
| 15 | gestiune-materiale-ce-ai-cumparat-ce-ai-folosit | Gestiunea materialelor: ce ai cumpărat, ce ai folosit… (98) | gestiune materiale | 371 | 2026-10-28 | 2 | da | Article | nu |
| 16 | cum-gestionezi-clientii-dificili | Cum gestionezi clienții dificili… (77) | clienți dificili | 635 | 2026-11-04 | 2 | NU | BlogPosting | da |
| 17 | cat-avans-ceri-lucrari-electrice-fotovoltaice | Cât avans ceri pentru o lucrare electrică sau fotovoltaică? (74) | avans lucrări electrice | 619 | 2026-11-04 | 2 | NU | BlogPosting | da |
| 18 | panouri-fotovoltaice-produc-putin-verificari | Panourile fotovoltaice produc prea puțin… (94) | panouri fotovoltaice produc puțin | 588 | 2026-11-04 | 2 | NU | BlogPosting | da |
| 19 | verificare-revizie-instalatie-gaze-cand-si-ce-pregatesti | Verificarea și revizia instalației de gaze… (88) | verificare revizie instalație gaze | 524 | 2026-11-08 | 2 | da | BlogPosting | da |
| 20 | dosar-prosumator-etape-termene-atr | Dosar de prosumator: etapele, termenele… (90) | dosar prosumator | 515 | 2026-11-08 | 2 | da | BlogPosting | da |
| 21 | autorizatii-electricieni-instalatori-cine-poate-semna-si-cand-expira | Autorizații și legitimații… (84) | autorizații electricieni/instalatori | 483 | 2026-11-08 | 2 | da | BlogPosting | da |
| 22 | e-factura-b2b-2026-ce-schimba-pentru-firme-de-electrice-fotovoltaice | e-Factura B2B 2026… (102) | e-Factura B2B instalatori | 579 | 2026-11-09 | 2 | da | BlogPosting | da |
| 23 | verificare-pram-rezistenta-priza-de-pamant-periodicitate | Verificarea PRAM (rezistența prizei de pământ)… (92) | verificare PRAM priză pământ | 521 | 2026-11-09 | 2 | da | BlogPosting | da |
| 24 | garantie-legala-lucrari-electrice-fotovoltaice-cat-tii-raspunderea | Garanția legală la lucrări electrice și fotovoltaice… (88) | garanție legală lucrări | 510 | 2026-11-09 | 2 | da | BlogPosting | da |

Observație: articolele din octombrie (279–473 cuvinte) sunt subțiri față de cele noi (500–635); toate sub 800–1000 cuvinte, deci vulnerabile la „thin content” față de concurența de top (pentru cuvinte-cheie informaționale). Cuvintele-cheie sunt deduse din slug/titlu, fără date de volum.

**Canibalizări / suprapuneri.**
- Medie: `program-management-firma-instalatii` ↔ `excel-sau-aplicatie-gestionare-lucrari` (ambele vizează „program/aplicație pentru gestionat lucrări”). Diferențiază: primul = criterii de alegere software, al doilea = decizia Excel vs aplicație; sau consolidează într-un pilon „Program pentru firme de instalații”.
- Medie: `model-proces-verbal-raport-lucrare` ↔ `documente-predare-client-dupa-instalare` ↔ `checklist-instalare-sistem-fotovoltaic` (documente/predare/PV). Clarifică intenția și interlinkuiește cu anchor-uri distincte.
- Mică: `cum-calculezi-profitul-pe-lucrare` ↔ `cat-avans-ceri…` ↔ `model-oferta…` (cluster „bani/ofertă”) — complementare, dar leagă-le între ele.
- Mică: `gestionare-echipe-de-teren` ↔ `tehnician-vs-administrator` ↔ `reducere-timpi-deplasare-lucrari` (teme apropiate fără linkuri între ele).
- Nu există dubluri exacte pe același cuvânt cheie.

## Pagini noi recomandate (arhitectură)

| URL propus | Scop |
|---|---|
| `/electricieni` (sau `/software-firme-instalatii-electrice`) | Pagină pilon pe domeniu: lucrări electrice, PRAM, autorizări; leagă articolele PRAM, autorizații, ofertă, garanție |
| `/instalatori-gaze` | Pilon gaze: verificări/revizii, termene ISCIR/ANRE, documente; leagă articolul de gaze și centralele termice |
| `/fotovoltaice` | Pilon fotovoltaic: dosar prosumator, checklist, service, garanție, e-Factura |
| `/pontaj-tehnicieni` | Funcționalitate pontaj (cuvânt cheie comercial) + FAQ; leagă articolul pe orele și GPS |
| `/foaie-de-parcurs` | Foaie de parcurs/deplasări tehnician, timpi deplasare, kilometri |
| `/facturare-si-e-factura` | Facturare, materiale/costuri, e-Factura, profit pe lucrare |
| `/aplicatie-tehnician` | Aplicația Android + web pentru tehnicieni (descărcare, funcții offline, GPS cu consimțământ); înlocuiește linkul direct la APK |
| `/gestionare-lucrari` | Pagina „program de management lucrări” (pilon pentru cuvântul cheie principal) |
| `/preturi` | Abonamente și valoare (conținut parțial există în docs/abonamente-si-valoare.md); schemă Offer |
| `/despre` | Despre noi: firmă, echipă, date legale, contact — semnal E-E-A-T |
| `/intrebari-frecvente` | FAQ cu schema FAQPage (conținut vizibil) |
| `/blog/categorie/{electric,gaze,fotovoltaic,management}` | Arhivă pe categorii cu intro, pentru linkuri interne și clustere |
| `/studii-de-caz` | Recenzii/rezultate clienți-pilot (după ce există) |

Reguli: fiecare pagină nouă are H1 unic, ≥600 cuvinte utile, BreadcrumbList, linkuri către 3–5 articole și CTA /programare; adaugă-le în sitemap și în nav (nu doar ancore).

## Limite (ce nu am putut verifica)
- Nu am rulat Lighthouse/PageSpeed/CrUX și nici `next build`: CWV sunt estimări din cod și dimensiuni de fișiere.
- Live am verificat doar robots.txt, sitemap.xml și apex-ul prin WebFetch (care nu arată coduri HTTP/headere); nu am confirmat 301 www/apex, `X-Robots-Tag`, nici randarea JS a landing-ului.
- Nu am văzut indexarea reală (Search Console, `site:`), clasamente, volume de căutare sau backlink-uri; cuvintele-cheie sunt deduse din titluri.
- Numărul de cuvinte exclude conținutul generat de scripturi (calculatoare) și poate diferi de cel randat.
- Nu am verificat Google Business Profile, recenzii externe sau datele legale ale firmei (nu apar în cod).
- Dacă `framer-motion` ajunge efectiv în bundle-ul paginii `/` nu am putut stabili fără analiză de bundle.
- Cele 2 pagini React publice (`termeni`, `confidentialitate`) le-am analizat doar parțial (metadata + începutul conținutului).
