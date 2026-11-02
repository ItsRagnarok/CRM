# SEO România — ElectroField

## Scop și implementare

Publicul principal: firme de instalații electrice, fotovoltaice și service din România care coordonează tehnicieni în teren.

- Acasă: titlu și descriere specifice, canonical pe domeniul existent `https://www.electrofield.ro`, Open Graph `ro_RO`, Twitter și date structurate Organization / SoftwareApplication. Nu sunt inventate recenzii, prețuri sau adrese.
- Textele vizibile explică gestionarea lucrărilor și echipelor de teren; footerul trimite către blog, programare și paginile legale.
- `/sitemap.xml` include paginile publice și descoperă automat articolele din `public/blog` la build. Nu declară date de actualizare artificiale. Sitemapul vechi al blogului rămâne disponibil.
- `/robots.txt` publică sitemapul. Metadatele implicite sunt `noindex, nofollow`; numai paginile publice Next.js declarate explicit permit indexarea. Fișierele HTML statice au propriile metadate.
- Variantele `.html` ale blogului și programării redirecționează permanent la URL-urile canonice fără extensie.
- Fișierele SEO și CSS-ul blogului sunt servite fără inițializarea sesiunii în middleware. Autentificarea paginilor operaționale rămâne necesară.

## Verificare după publicare

1. Verifică domeniul în Google Search Console și trimite `https://www.electrofield.ro/sitemap.xml`.
2. Inspectează pagina principală și două articole cu URL Inspection: răspuns 200, canonical corect, indexare permisă, text vizibil și resurse încărcate.
3. Verifică redirecționările pentru `/blog/index.html`, un articol `.html` și `/programare.html`; destinațiile trebuie să răspundă 200.
4. Verifică loginul și paginile contului pentru `noindex`. Acesta controlează indexarea, fără să înlocuiască autentificarea.
5. Măsoară Core Web Vitals pe mobil cu PageSpeed Insights și datele reale din Search Console. Nu există o măsurătoare de performanță în acest audit.
6. Urmărește afișările, clicurile și cererile de demonstrație pentru „CRM firme instalații”, „program gestionare lucrări”, „aplicație echipe teren” și expresiile care apar efectiv în Search Console. Acestea sunt teme inițiale, fără volume de căutare validate.

## Conținut următor

Extinde articolele existente cu exemple proprii și capturi reale: planificarea intervențiilor, pontajul tehnicienilor și consumul materialelor pe lucrare. Creează pagini dedicate serviciilor doar dacă explică funcționalități reale și oferă conținut distinct. Evită pagini aproape identice pentru fiecare oraș.

## Referințe

- https://developers.google.com/search/docs/fundamentals/get-started-developers
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata

Schimbările trebuie publicate înainte să poată influența rezultatele Google. Pozițiile și indexarea nu sunt garantate de aceste modificări.
