# Facturare Super Admin — etapa 1

Decizia confirmată: interfața va fi în `/admin/facturare`; Oblio emite documentele
și atribuie seria/numărul final. Facturarea companiilor din `/facturare` rămâne
independentă. Această etapă livrează schema și testele, nu meniul sau apelurile API.

## Schema

Migrarea `supabase/migrations/20261118030725_platform_billing_oblio.sql` adaugă:

- `billing_company_settings`, `billing_bank_accounts`: firma emitentă a platformei;
- `billing_clients`, `billing_products`: clienți și catalog propriu;
- `billing_series`: seriile configurate în Oblio, fără contor local;
- `billing_oblio_connections`: configurație fără secret;
- `private.billing_oblio_credentials`: referință la secretul din Supabase Vault;
- `billing_invoices`, `billing_invoice_lines`: ciorne și documente fiscale;
- `billing_issue_requests`: cererea înghețată și rezultatul operației externe;
- `billing_invoice_delivery`: e-mail, PDF și starea viitoare e-Factura;
- `billing_payments`: încasări și înregistrări inverse pentru corectarea lor.

Toate cele 12 tabele au RLS. Tabelele publice verifică apartenența la
`platform_admins`; contextul de vizualizare a unei companii este refuzat.
Secretul Oblio nu este accesibil direct rolurilor `anon` sau `authenticated`.
RPC-urile pentru configurarea Vault vor fi implementate odată cu pagina Setări.

Sumele sunt `NUMERIC`, calculate în PostgreSQL: baza liniei se rotunjește la două
zecimale, apoi TVA-ul liniei se rotunjește la două zecimale; antetul însumează
liniile. Rotunjirea PostgreSQL `numeric` este la jumătate în sens opus lui zero.
Nu se fac calcule financiare cu `float`. La integrarea API trebuie verificate
regulile de rotunjire și totalurile Oblio; o diferență nu trebuie ascunsă.

Ciornele nu au număr. Documentul și liniile se blochează înainte de cererea
externă; factura emisă nu poate fi editată sau ștearsă. Stornarea este alt
document, cu legătură la factura inițială și cantități negative. Încasările și
stările de livrare nu modifică factura fiscală. Copiile datelor clientului și
firmei sunt păstrate în document și rămân independente de modificările ulterioare.

## Contract pentru etapa de emitere

Schema restricționează scrierile directe ale clientului la câmpurile de ciornă.
Stările de emitere, identitatea Oblio, copiile fiscale și cererile externe vor fi
scrise numai prin RPC-uri controlate, care încă nu sunt implementate.

1. Într-o tranzacție: verificare super admin, blocarea facturii, validarea datelor,
   copierea firmei/clientului/conturilor bancare, pregătirea cererii și trecerea
   în `pending`. Aceeași factură are o singură înregistrare de cerere.
2. Marcarea cererii `sending` înainte de apelul extern. Nu se ține o tranzacție
   PostgreSQL deschisă pe durata apelului HTTP.
3. Confirmarea Oblio salvează seria, numărul și URL-ul și marchează `issued`.
4. Un timeout sau un rezultat ambiguu rămâne `unknown` (inclusiv recuperarea unei
   cereri rămase `sending`). Nu se reemite automat. Se verifică în Oblio înainte
   de orice încercare nouă. Un refuz sigur necesită o operație explicită de
   reconciliere în etapa 3; schema actuală nu permite deblocare directă.
5. Trimiterea către client se face separat și nu reemite factura.

Unicitatea locală nu poate garanta singură emiterea exact o dată într-un serviciu
extern. Numerotarea și continuitatea ei sunt gestionate de Oblio, inclusiv pentru
documentele emise direct în contul Oblio. Nu există un al doilea numărător local.

Integrarea ANAF nu este implementată. Câmpurile rezervate sunt `not_sent`,
`processing`, `validated`, `rejected`, cu etichete românești în viitoarea interfață.
Un viitor adaptor din `src/lib/billing` va trata această integrare separat.

## Verificare locală

Sunt necesare Docker și Node.js. Pornește un PostgreSQL 17 de test:

```sh
docker run --name electrofield-billing-db -e POSTGRES_PASSWORD=local-billing-test -d postgres:17-alpine
docker exec electrofield-billing-db pg_isready
node --test scripts/billing-schema.test.mjs
```

Testul creează și șterge o bază temporară. Verifică refuzul accesului anonim și al
utilizatorilor companiilor, refuzul preview-ului, protecția secretului, calculul
950 + 199,50 = 1.149,50, rotunjirea fracțiilor, lipsa numărului pentru ciornă,
blocarea documentelor/liniilor, păstrarea copiilor, unicitatea cererii, stornarea
și corectarea unei încasări. Nu contactează Oblio și nu testează criptarea Vault;
folosește doar un tabel local pentru verificarea cheii externe către Vault.

Schema de test simulează contractele `auth.uid`, `platform_admins` și `vault`.
Verificarea pe Supabase real, RPC-urile de emitere și testele de concurență ale
apelurilor externe rămân pentru integrarea etapelor următoare. Migrarea nu trebuie
considerată o implementare completă de emitere.

Nu se rulează resetarea bazei găzduite: istoricul din repo include migrări vechi
incomplete. Noua migrare este aditivă și se aplică separat peste schema existentă.

## Pașii următori

2. Meniu Facturare, Setări, configurarea securizată Oblio, Clienți.
3. Ciorne, proforme, emitere, reconciliere, stornare, PDF și trimitere.
4. Lista facturilor, Acasă și încasări.
5. Rapoarte și export lunar PDF + XLSX.

## Publicare în producție — 18 noiembrie 2026

Migrarea a fost aplicată în proiectul Supabase ElectroField
`hrzpowmmbuqihtbkisyu`, versiunea `20261118030725`. Toate cele 12 tabele noi au
RLS activ. Accesul anonim, citirea directă a secretelor, modificarea numărului
și apelarea directă a triggerului de totaluri sunt refuzate prin privilegii.
Site-ul și loginul au răspuns HTTP 200; `/admin` redirecționează la login (307)
fără sesiune. Nu s-au făcut apeluri de emitere în Oblio.

Advisorul de securitate nu a adăugat avertismente sau erori. Singura observație
nouă este informativă: tabela privată de credențiale are RLS fără politici,
intenționat pentru refuzul implicit al accesului direct.
[Explicația verificării Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Aceasta este o publicare a schemei. Interfața și emiterea Oblio nu sunt încă
implementate; nu este necesară reconstruirea aplicației Vercel pentru această etapă.

## Etapa 2 — interfață în Super Admin

Modulul este integrat în bara existentă: `/admin/facturare`, cu Acasă, Setări
și Clienți. Acasă afișează stadiul configurării; emiterea și rapoartele urmează.
Setările permit salvarea firmei, TVA, termenului de plată, contabilului, seriilor
Oblio și conturilor bancare cu verificarea cifrelor IBAN. Modelul PDF rămâne cel
configurat în Oblio. Clienții pot fi adăugați doar cu CUI, completați/editați și
căutați după nume/CUI. Soldul este calculat exact pe server, cu paginare.

Conectarea Oblio verifică autentificarea și seria pentru firma configurată, apoi
salvează Client Secret în Vault. Nu emite facturi. Secretul nu este trimis înapoi
în interfață. Migrarea `20261118045301_platform_billing_settings.sql` este aplicată
în producție. RPC-ul de salvare verifică independent super adminul și refuză
contextul preview. Funcția de sold rulează cu drepturile apelantului și RLS.

Testare manuală după publicare:
1. Intră ca Super Admin → Facturare → Setări facturare.
2. Salvează datele firmei, apoi seria de facturi existentă în Oblio și IBAN-ul.
3. Introdu în formular e-mailul și Client Secret din Oblio, selectează seria și
   apasă „Verifică și conectează Oblio”. Nu trimite secretul în chat.
4. În Clienți, adaugă un CUI, caută-l și completează datele din pagina lui.

Nu există cont Oblio de test furnizat; verificarea externă cu credențiale reale
rămâne de efectuat din acest formular. Testele SQL locale acoperă autorizarea,
salvarea/rotirea referinței Vault și calculul soldurilor; criptarea Vault este
asigurată de serviciul Supabase și nu este simulată criptografic în test.
