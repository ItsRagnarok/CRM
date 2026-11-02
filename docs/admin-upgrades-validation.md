# Administrare platformă — implementare și verificare

## Funcții

- Faviconul și iconițele aplicației sunt derivate din simbolul imaginii furnizate. `scripts/generate-icons.mjs` produce ICO 16/32/48, PNG 32/48/192/512 și Apple 180. Iconițele sunt declarate și în paginile HTML publice.
- `/admin/programari` folosește sesiunea existentă a super administratorului. Gestionează programul săptămânal, excepțiile pe zi, repetarea în lună, blocarea/deblocarea perioadelor, textele publice și anularea rezervărilor. Operațiile asupra disponibilității păstrează rezervările existente.
- `/programare` nu mai include formular, cod de login sau declanșator ascuns de admin. Politicile de scriere ale programărilor verifică apartenența la `platform_admins`.
- Companie → selectare utilizator → „Vizualizează compania · doar citire”. Se reutilizează paginile normale cu profilul selectat, fără schimbarea contului autentificat. Banner permanent și ieșire explicită. Contextul durează maximum o oră și este comun filelor din același browser. GPS, push, marcare automată a mesajelor și notificărilor și telemetria sunt oprite în preview.
- Apărarea preview: identitate verificată pe server, rol verificat în baza de date, SELECT limitat la compania din context, refuzul operațiilor de scriere în clientul Supabase, middleware și trigger în PostgreSQL inclusiv pentru scrieri pornite din RPC-uri SECURITY DEFINER. Contextul din cookie nu oferă drepturi fără identitatea reală de platform admin.
- Buton de temă în bara tenantului și super adminului, respectiv în profilul mobil. Alegerea rămâne în localStorage. Stilurile dark sunt limitate la interfețele autentificate, fără recolorarea paginii de marketing.
- `/admin/activitate`: filtre pe companie și 1/7/30 zile, utilizatori activi, timp web/mobil, vizite, detalii zilnice și ultimele 200 vizite. Detaliile sunt păstrate 90 zile; agregatele zilnice 365 zile, cu curățare zilnică.

## Semnificația activității

Timpul este o estimare a utilizării efective, nu durata autentificării și nu pontaj de muncă. Se numără numai în prim-plan, cu focus și interacțiune în ultimul minut. Heartbeatul este la 30 secunde; serverul plafonează creditul la timpul scurs și evită dublarea între file/dispozitive. Navigarea generează o nouă vizită de pagină. Ora ieșirii este confirmată numai dacă primește evenimentul dispozitivului sau deconectarea explicită. La pierderea conexiunii se afișează ultima activitate, nu o deconectare inventată. Nu sunt colectate texte tastate, coordonate sau IP pentru această funcție.

Rezumatul zilnic atribuie secundele ultimului interval zilei în care sosește heartbeatul; în jurul miezului nopții poate exista o abatere de maximum 35 secunde. Nu este un sistem pentru facturarea la secundă. Datele încep după publicarea codului; sesiunile auth existente nu pot reconstrui retroactiv timpul activ.

## Baza de date

`db/platform-admin-upgrades.sql` păstrează DDL-ul instalat în proiectul ElectroField prin migrații gestionate. Tabelele existente și datele lor nu sunt șterse. Migrațiile Supabase aplicate: `platform_admin_preview_booking_usage`, `platform_usage_logout`, `platform_usage_retention`, `platform_usage_validate_null_inputs`, `platform_usage_indexes`.

Politicile de SELECT pentru preview sunt suplimentare; politicile normale ale companiilor nu au fost înlocuite. Funcțiile noi SECURITY DEFINER au search_path fix și granturi explicite; expunerea lor către authenticated este necesară, iar verificarea identității se face în interior. Verificarea advisorului raportează în continuare astfel de funcții, inclusiv funcții preexistente, și configurări preexistente de auth; acest PR nu este un audit complet al întregii platforme.

## Verificări

- Compilare de producție și verificări TypeScript/ESLint.
- `node --test scripts/admin-security.test.mjs`: contexte invalide, scrieri în tabele/RPC/storage blocate înainte de rețea, citiri și semnare URL permise.
- Teste SQL în tranzacții cu ROLLBACK: super admin vede compania selectată și nu alte companii, triggerul blochează scrierile inclusiv fără rânduri afectate, un cont de companie nu poate falsifica headerul de preview și nu vede rezervările private, heartbeaturile repetate nu dublează vizitele și nu pot inventa timp activ. Nicio înregistrare de test nu este păstrată.
- Verificări HTTP fără autentificare: pagini SEO, icoane, protecția rutelor de administrare și refuzul POST în preview.
- Nu a fost finalizată verificarea vizuală a interfețelor: browserul a refuzat accesul la serverul local. Nu au fost testate prin browser modificări ale rezervărilor reale sau fluxuri autentificate complete. Este necesară o verificare manuală în preview cu un cont real înainte de merge/publicare.

## Pași după publicare

1. Intră ca super admin și verifică programările existente. Salvează o excepție pe o zi fără rezervări și verifică pagina publică; revino apoi la programul standard.
2. Deschide o companie în preview, verifică liste/detalii/documente și încearcă o salvare: trebuie refuzată. Revino în super admin prin banner.
3. Verifică light/dark pe desktop și mobil, inclusiv tabele, formulare și hărți.
4. Folosește o companie câteva minute pe web și mobil, verifică raportul de activitate, deconectarea și lipsa dublării timpului în două file.
5. Faviconul poate necesita reîncărcare fără cache; actualizarea lui în rezultatele Google se face separat, după recrawl.
