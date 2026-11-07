# Facturare ElectroField — integrare SmartBill / Oblio (cercetare + design)

Data cercetării: 7 noiembrie 2026. Nu am modificat niciun fișier din `/home/user/CRM` (doar citit). Specificația OpenAPI SmartBill descărcată pentru consultare: `/tmp/claude-0/-home-user-CRM/a342f772-cb17-5a5b-92e6-2ade7658ef85/scratchpad/dl1/spec.yaml`.

Convenții: **[CONFIRMAT]** = văzut în documentația oficială a furnizorului sau în cod; **[TERȚ]** = sursă terță (SDK, blog); **[DE VERIFICAT]** = incert, trebuie confirmat cu furnizorul / contabil / textul legii înainte de implementare.

---

## 0. Rezumat executiv

1. **Ce există azi** este doar o evidență internă, nefiscală: un tabel `invoices` cu 4 sume (manoperă/materiale/deplasare/altele), numerotare proprie `FACT-0001`, statusuri `unpaid/paid/overdue`, un formular „Generează factură" cu sume introduse de mână. Nu există linii de factură, TVA, serii, client-snapshot, plăți, legătură cu e-Factura. Pagina spune explicit „Pregătit pentru integrare cu SmartBill, Oblio, FGO". Tab-ul „Integrări" din Setări e placeholder „în curând".
2. **Recomandare: Oblio primul, SmartBill al doilea, în spatele unei interfețe comune `InvoiceProvider`.** Motive: Oblio are cheie de idempotență nativă (`idempotencyKey`), webhook-uri (`Invoice/Update`, `Invoice/Cancel`, `Collect/Inserted`), status e-Factura/SPV citibil prin API (`einvoiceStatus`), endpoint de trimitere în SPV, storno și proformă→factură prin `referenceDocument`, listare documente și clienți cu autocompletare după CIF, tarif unic foarte mic cu firme/utilizatori nelimitați. SmartBill are un API mai „îngust": **fără webhook-uri, fără endpoint e-Factura, fără citire JSON a facturii, fără listare facturi, fără idempotency key**, și consumă din cota de documente a abonamentului. **Excepție de decizie:** dacă majoritatea firmelor-client ale ElectroField folosesc deja SmartBill (contabilii lor îl cer), ordinea se poate inversa — dar designul rămâne același. Aceasta e o întrebare pentru proprietar (secțiunea 10).
3. **Schimbări structurale necesare** înainte de orice conector: `invoice_lines`, TVA pe linie, `invoice_payments`, mașină de stări (draft → aprobare → în emitere → emisă → e-Factura), cheie de idempotență per factură, date fiscale complete pe `organizations` și `clients`, prețuri de VÂNZARE (azi există doar `unit_cost` și `hourly_rate`, adică costuri), politică de permisiuni pentru cine emite.
4. **Securitate:** cheile API ale fiecărei firme-client se stochează în **Supabase Vault**, exact după tiparul deja folosit în repo pentru căsuțele de mail ale platformei (`supabase/migrations/20261103010031_platform_mail_vault.sql`: schema `private`, funcție `security definer`, `revoke` din `anon/authenticated`, fără returnarea secretului către browser). Niciodată în `public`, niciodată către client/telefon.
5. **Aplicația Android este un WebView peste site-ul live** (`android-app/capacitor.config.ts`, `server.url`), fără service worker/IndexedDB pentru lucrări → **offline real nu există azi** și trebuie construit separat (faza 5). Emiterea fiscală NU trebuie să funcționeze offline; offline se poate doar pregăti un draft.

---

## 1. Ce există acum în cod (studiat)

### 1.1 Pagina Facturare
- `src/app/(app)/facturare/page.tsx` (206 linii): listă „Facturi emise" (Nr., Client, Lucrare, Emisă, Valoare, Status, buton „Marchează plătită"), 4 carduri KPI (facturat luna asta, neplătite, restante, încasat luna asta), panou „Generează factură" cu `select` de lucrări (ultimele 50) + 4 câmpuri de sume (manoperă, materiale, deplasare, altele).
- `src/app/(app)/facturare/actions.ts`: `createInvoiceForJob` (numerotare prin RPC `next_invoice_number` — contor atomic per organizație, comentariu explicit că `count(*)+1` producea dubluri) și `markInvoicePaid` (doar `update status='paid'`). **Nu există verificare de rol în cod** — se bazează doar pe RLS (politicile RLS ale tabelelor de bază nu sunt versionate în repo; în `supabase/migrations/` sunt doar 5 migrări recente).
- `src/app/(app)/clienti/actions.ts` → `createInvoice` (din fișa clientului): **încă folosește `count(*)+1`** pentru număr — calea cu cursa (race) pe care `facturare/actions.ts` a corectat-o. Două căi de creare cu aceeași schemă de numerotare locală.
- `src/app/(app)/clienti/[id]/page.tsx`: tab „Facturi" + formular „Emite factură".
- `src/app/(app)/lucrari/[id]/page.tsx` (linia ~158): `supabase.from("invoices").select(...).eq("job_id", id).maybeSingle()` — **se strică (eroare PostgREST) dacă o lucrare ajunge să aibă >1 factură** (proformă + avans + finală). Trebuie schimbat în pasul 0.
- Tab „Cheltuieli" din lucrare: calculează cost = materiale (`material_usage.quantity × materials.unit_cost`) + manoperă (ore din `time_entries` work_start/work_end × `profiles.hourly_rate`) + deplasare (`jobs.distance_km × organizations.fuel_cost_per_km`) + `expenses`; profit = `invoices.total_amount − cost`. Avem deci deja motorul de „linii candidate", dar în **cost**, nu în preț de vânzare.

### 1.2 Schema (din `src/lib/supabase/database.types.ts`)
- `invoices`: `id, organization_id, client_id, job_id, invoice_number, issued_at, due_date, status (text), labor_amount, materials_amount, travel_amount, other_amount, total_amount (GENERATED = suma celor 4), created_by, created_at`. Fără TVA, fără valută, fără linii, fără referință la furnizor.
- `invoice_counters(organization_id, next_number)` + RPC `next_invoice_number`.
- `clients`: `client_type (company|individual), name, company_name, cui, address (text liber), email, phone, lat/lng, status`. Fără județ/localitate separate, fără nr. Reg. Com., fără flag plătitor TVA.
- `organizations`: `name, cui, address, email, phone, fuel_cost_per_km, subscription_plan, logo_storage_path, …`. Lipsesc: Reg. Com., plătitor TVA, IBAN/bancă, județ/localitate.
- `jobs`: `display_number, title, job_type (instalare|reparatie|mentenanta|inspectie|interventie|service|demontare|urgenta), status (… finalizata …), distance_km, work_started_at/work_ended_at, mobile_stage, client_id, location_id, team_id, warehouse_id`.
- `materials(name, unit, unit_cost, kind, category)`; `material_usage(job_id, material_id, quantity, source_*)`; `job_required_items`; `expenses(amount, category, vendor, status, receipt_path, approved_by)` (cu aprobare); `time_entries`; `profiles(hourly_rate, role)`.
- `signatures(job_id, signer_name, signer_role, storage_path, signed_at)` — semnătura clientului (PNG în bucket `attachments`, URL-uri semnate 1h via `src/lib/storage.ts`).
- `documents(doc_type, job_id, client_id, storage_path)`, `reports(pdf_storage_path)`, `audit_log(action, actor_id, entity_type, entity_id, metadata, organization_id)`, `notifications(link)`, `device_push_tokens`.
- Roluri: `admin | manager | team_leader | technician | client`; `FIELD_ROLES = [technician, team_leader]` merg în `/mobil`, restul în back-office. Helper-e SQL existente: `current_org_id()`, `current_role()`, `is_staff()`, `my_team_ids()` (migrarea `20261107120000_notifications_messaging.sql` arată stilul RLS pe rol).
- Planuri: `starter|team|pro|enterprise`; `docs/abonamente-si-valoare.md` propune Standard 299 / Pro 599 lei și notează că integrările SmartBill/Oblio/FGO sunt „afișate în curând" — **nu trebuie vândute ca disponibile** până la livrare; „Facturare internă … nu este demonstrată o integrare fiscală/e-Factura".

### 1.3 PDF și flux mobil
- `src/app/api/rapoarte-lucrare/[id]/route.tsx`: PDF de raport de lucrare cu `pdfkit` + font Noto Sans, include cheltuieli, checklist, semnătura clientului. **Nu este factură** și nu trebuie confundat cu documentul fiscal (documentul fiscal = PDF-ul furnizorului).
- Flux mobil (`src/app/mobil/lucrari/[id]/`): sosire → lucru → `finalizare/page.tsx` (checklist „after", poze, ore lucrate, cheltuieli) → `finalizeJob` (status `finalizata`, `time_entries work_end`, redirect la `semnatura`) → `semnatura/page.tsx` + `saveSignature` (upload PNG în `attachments/{org}/jobs/{job}/signatures/…`, rând în `signatures`). **Nu există pas de facturare/încasare**; semnătura se ia ÎNAINTE ca clientul să vadă un total.
- Android: `android-app/capacitor.config.ts` → WebView către `https://electrofield-alporaro.vercel.app/mobil`; `CapacitorHttp` activat; plugin-uri: push, geolocation. Nu există cod offline pentru lucrări.
- `AGENTS.md` cere citirea `node_modules/next/dist/docs/` înainte de cod Next — folderul **nu există** în acest checkout (`ls` eșuează); cine implementează trebuie să verifice API-urile Next (route handlers, server actions, cron/`after`) pe versiunea instalată (`^15.5.26`).
- Tipar reutilizabil: `src/lib/mail/store.ts` + RPC `ef_platform_mail` (Vault, rate limit în DB, `claim_send/finish_send` cu `fingerprint` = idempotență la trimitere). Același model se poate copia pentru `ef_billing_*`.

### 1.4 Lacune față de o facturare reală (listă)
Fără: linii de factură; TVA; serii; numere fiscale; valută; prețuri de vânzare (materiale/tarife manoperă/deplasare); client fiscal complet; plăți/încasări (doar `status`); `overdue` nu se calculează (nu există job); doc. proformă/ofertă/deviz; stări de eroare/retry; audit pe facturi; conexiune la furnizor; permisiuni specifice (oricine din org cu drept RLS poate insera).

---

## 2. Cercetare furnizori

### 2.1 SmartBill Cloud API

Sursa principală: specificația OpenAPI oficială `https://api.smartbill.ro/smartbill-api-spec.yaml` (versiune descrisă „x-last-updated 2026-09-09 / ultima actualizare 16 octombrie 2026"), documentația `https://api.smartbill.ro/`, articolul de ajutor `https://ajutorgestiune.smartbill.ro/article/473-intergare-api` (din 2020, parțial depășit).

**Două versiuni:** V1 (`https://ws.smartbill.ro/SBORO/api`) pentru facturare/operațiuni curente; V3 (`.../api/v3`) pentru „funcții noi": gestiuni, produse, clienți, furnizori, cote TVA, NIR-uri — **în spec, resursele V3 clients/products/vat-rates au doar `GET`** (nu am găsit creare/actualizare) [CONFIRMAT din spec].

**Autentificare**
- V1: HTTP Basic cu `email:token`; tokenul se ia din SmartBill Cloud → Integrări → API (email + token + CIF). Tokenul V1 „este generat automat la crearea contului". CIF-ul firmei se trimite în corp (`companyVatCode`) sau query (`cif`).
- V3: `Authorization: Bearer <token>`, CIF în URL; „fiecare token aparține unui singur utilizator și unei singure firme".
- Implicație multi-firmă: pentru fiecare firmă-client ElectroField stocăm `email + token + CIF` (+ eventual token V3). Tokenul V1 e legat de contul utilizatorului SmartBill (acces larg) — nu există (în spec) scope-uri restrânse [DE VERIFICAT cu api@smartbill.ro dacă se poate crea un utilizator SmartBill dedicat cu drepturi limitate doar la emitere].

**Endpoint-uri cheie (V1)** [CONFIRMAT din spec]
| Nevoie | Endpoint |
|---|---|
| Emite factură | `POST /invoice/v2` (obligatorii: `companyVatCode, seriesName, client{name,country}, products[{name,quantity,price,measuringUnitName,taxPercentage}]`; opțional `isDraft, issueDate, dueDate, currency, precision, useStock, payment{value,type,isCash,paymentSeries}, sendEmail, email, mentions, observations, delegate*, usePaymentTax (TVA la încasare), useIntraCif, useEstimateDetails+estimate (din proformă), paymentUrl:"Generate URL"`) |
| Proformă | `POST /estimate/v2`, `GET /estimate/pdf`, `GET /estimate/invoices` (facturile născute din proformă), `PUT /estimate/cancel|restore`, `DELETE /estimate` |
| Factură din proformă | `POST /invoice/v2` cu `useEstimateDetails:true` + `estimate{seriesName,number}`, fără bloc client |
| Storno | `POST /invoice/reverse` (serie+număr original; consumă din cota de documente) |
| Anulare / restaurare / ștergere | `PUT /invoice/cancel`, `PUT /invoice/restore` (idempotente), `DELETE /invoice` |
| PDF | `GET /invoice/pdf?cif&seriesName&number` — „doar PDF; nu există endpoint JSON sau XML" |
| Link public | în răspunsul de emitere: `documentViewUrl` (PDF public, hash criptografic) |
| Status plată | `GET /invoice/paymentstatus` → `invoiceTotalAmount, paidAmount, unpaidAmount, paid` |
| Încasări | `POST /payment` (tipuri: Chitanta, Bon, Card, Card online, CEC, Bilet ordin, Ordin plata, Mandat postal, Extras de cont, Ramburs, Alta incasare; `invoicesList`, `useInvoiceDetails`, `value` parțial; `Bon` poate returna textul bonului Base64 pentru casă de marcat), `DELETE /payment/v2`, `DELETE /payment/chitanta`, `GET /payment/text` |
| Serii | `GET /series?cif&type=f|p|c` (→ `name, nextNumber, type`) |
| Cote TVA | `GET /tax?cif` (V1) / `GET /v3/companies/{cif}/vat-rates` |
| Stocuri | `GET /stocks`; `useStock:true` + `warehouseName` pe linie |
| Email document | `POST /document/send` (subiect/corp Base64) sau `sendEmail:true` la emitere (necesită server de email configurat în SmartBill) |
| Clienți/produse | prin `saveToDb:true` pe `client` și `product` la emitere (V1) sau `GET` în V3 |
| Plată cu cardul | `paymentUrl:"Generate URL"` (necesită Netopia/euPlatesc/Stripe configurat în SmartBill) → `url` în răspuns — **util pentru încasare la client** |

**Ce NU are** (din spec): **webhook-uri**, **endpoint e-Factura/SPV** (nici trimitere, nici status), **listare/căutare facturi** (doar PDF + paymentstatus pe serie/număr cunoscute), **citire JSON a unei facturi**, **cheie de idempotență**. Pentru e-Factura documentația SmartBill (ajutor) spune doar că trimiterea se face din interfață (buton „Trimite e-Factura", autorizare ANAF valabilă 90 zile cu reautorizare automată, cu certificat digital al firmei sau al contabilului) [TERȚ: articole/ajutor, vezi §12]. **[DE VERIFICAT]** dacă facturile emise prin API sunt trimise automat în SPV când firma are trimiterea automată activă (planurile Gold+ au trimitere automată/bulk conform paginii de prețuri) și cum poate ElectroField afla statusul — cerere către `api@smartbill.ro` / `vreauapi@smartbill.ro`.

**Formate / reguli de date**
- JSON; preț implicit **fără TVA** (`isTaxIncluded:false`); `seriesName`, `taxName`, `measuringUnitName` trebuie să coincidă exact cu valorile din cont; la cotă 0% trebuie dat mereu un `taxName` existent (altfel API alege implicit „Taxare inversa") — **capcană fiscală**; discount = linie separată cu `isDiscount:true`, `numberOfItems` obligatoriu, `discountValue` negativ; cantitate neverificată (0/negativ acceptate) → validare la noi; max 400 poziții/document; `city` pentru București trebuie „Sector 1–6" altfel e-Factura nu se validează în SPV (câmpul `client.county/city`); `client.isTaxPayer` implicit false.
- Răspuns V1: HTTP 200 cu `errorText` gol la succes; erorile vin în `errorText` (poate conține HTML — nu se afișează brut) sau, pentru cereri invalide, `{type:"invalid_request_error", errors:[{code, message, param}]}`; V3: `errors[] {code,message,docUrl,param}`.
- Erori de abonament: `subscription_expired`, `subscription_limit_exceeded` („se numără și ciornele"), `subscription_not_valid`; „Pentru acest pachet s-a emis numărul maxim de documente permis" — **fiecare document emis prin API, inclusiv ciorne, storno, încasări, consumă din numărul de documente al abonamentului**.

**Rate limit** [CONFIRMAT]: V1 = 30 apeluri / 10 s per token (≈3/s), depășire → **blocare 10 minute**; headere `X-RateLimit-*`. V3 = citire 60/10 s, scriere 30/10 s, 50.000/zi per utilizator+firmă; la 429 se respectă `Retry-After` (penalizări progresive 5…600 s).

**Costuri / planuri** (pagina `https://www.smartbill.ro/preturi/`, preluată prin WebFetch; prețuri „de la", fără TVA) [parțial CONFIRMAT, DE VERIFICAT]: Facturare Silver (de la ~5,84 €/lună; 30 facturi/lună), Gold (100), Platinum (nelimitat; **700 documente API incluse**); Gestiune / Gestiune Plus (de la 16,32 €/lună; **1.000 documente API incluse** la Plus). Depășire API: **0,017 € + TVA / document**. Articolul de ajutor spune că integrarea API cu magazinul online e disponibilă pe „Gestiune Plus" — neclar dacă orice acces API cere Plus. **[DE VERIFICAT]:** dacă Silver/Gold au API deloc; cum se numără documentele (inclusiv proforme și încasări). Probă gratuită 30 zile.

**Sandbox/test:** nu am găsit un mediu sandbox în spec. Testarea se face pe un cont real SmartBill (cont de probă 30 zile) cu serie dedicată și ciorne (`isDraft:true`) / anulări — dar ciornele consumă din cotă. **[DE VERIFICAT]** cu SmartBill.

### 2.2 Oblio API

Sursa: documentația oficială `https://www.oblio.eu/api` (WebFetch); SDK-uri oficiale `https://github.com/obliosoftware/oblioapi` (NodeJS), `https://packagist.org/packages/obliosoftware/oblio-api` (PHP).

**Autentificare** [CONFIRMAT]: OAuth2-style token: `POST https://www.oblio.eu/api/authorize/token` cu `client_id` = emailul de login, `client_secret` = din Setări → Date cont; răspuns `access_token` (valabil 3600 s). Apoi `Authorization: Bearer`. **`client_secret` se regenerează la resetarea parolei** → conexiunile se pot rupe fără ca noi să fim anunțați (trebuie stare `auth_failed` + notificare). Nu se menționează scope-uri restrânse.

**Endpoint-uri** [CONFIRMAT]
| Nevoie | Endpoint |
|---|---|
| Firme legate la cont | `GET /nomenclature/companies` |
| Cote TVA | `GET /nomenclature/vat_rates?cif=` (`name, percent, default`) |
| Serii | `GET /nomenclature/series?cif=` (`type, name, start, next, default`) |
| Clienți / produse / gestiuni | `GET /nomenclature/clients|products|management` (paginare offset, 250 clienți/pagină) |
| Emite factură | `POST /docs/invoice` (JSON; obligatorii `cif, client{name}, seriesName`, `products[{name, price}]`; opționale `issueDate, dueDate, deliveryDate, currency, precision, language, collect{}, referenceDocument{}, useStock, spvExtern, sendEmail, idempotencyKey, mentions, internalNote, issuerName, delegate*, orderNumber/contractNumber/projectNumber/buyerIdentifier (câmpuri BT pentru e-Factura)`) |
| Proformă / aviz | `POST /docs/proforma`, `POST /docs/notice` |
| Factură din proformă | `POST /docs/invoice` cu `referenceDocument{type:"Proforma", seriesName, number}` |
| Storno | `POST /docs/invoice` cu `referenceDocument{type:"Factura", refund:1}` (șterge și încasarea legată) |
| Încasare | `PUT /docs/invoice/collect` (tipuri: Chitanta, Bon fiscal, Bon fiscal card, Alta incasare numerar, Ordin de plata, Mandat postal, Card, CEC, Bilet ordin, Alta incasare banca, Ramburs) sau obiect `collect` la emitere |
| Citire / listare | `GET /docs/invoice?cif&seriesName&number`, `GET /docs/invoice/list` (filtre draft/canceled/collected/dată/client, `withProducts`, `withCollects`, `withEinvoiceStatus`, max 100/pagină) |
| Anulare/restaurare | `PUT /docs/{invoice|proforma|notice}/cancel|restore` |
| Ștergere | `DELETE /docs/{type}` — **doar ultimul document din serie** |
| PDF / link | câmp `link` (`utils/show_file/…`) în răspunsuri; nu se spune explicit că e PDF public [DE VERIFICAT] |
| **e-Factura** | `POST /docs/einvoice` (trimite în SPV; `code`: −1 netrimisă, 0 în procesare, 1 trimisă, 2 trimisă cu erori), `GET /docs/einvoice` (arhivă SPV), `spvExtern` la emitere (trimitere automată dacă e activată în Setări→Preferințe), `einvoiceStatus{text,sent,code}` în `list` cu `withEinvoiceStatus` |
| **Webhook-uri** | `POST/GET/DELETE /webhooks`; topicuri: `Invoice/SaveDraft`, `Invoice/Update`, `Invoice/Cancel`, `Collect/Inserted` (+ Proforma/Notice/TaxReceipt), `stock`. Verificare endpoint: răspunde 200 și reflectă base64 al headerului `X-Oblio-Request-Id`. **Nedocumentate:** structura payload-ului, semnătura, politica de retry → tratăm webhook-ul doar ca „semnal", apoi re-citim documentul |
| Idempotență | `idempotencyKey` pe emitere („previne dublarea documentelor") |

**Date**: preț implicit `vatIncluded:1` (cu TVA — **diferit de SmartBill**; documentația e inconsistentă între default și exemplu → trimitem mereu explicit `vatIncluded`); `client.autocomplete:1` completează datele firmei române după CIF; `client.vatPayer`, `save`; numerotare automată (`disableAutoSeries`/`number` opțional); discounturi ca obiecte în `products` (`discountType` procentual|valoric).

**Erori**: HTTP 400/401 cu mesaj; **formatul corpului de eroare nu e documentat** → parsăm defensiv, logăm brut (redactat). Docs au și typo-uri (câmpuri `codeClient/codeEAN`, `receptionNotice/projectNumber` aparent inversate) — testăm empiric.

**Rate limit** [CONFIRMAT]: **30 req / 100 s** pentru cereri care generează documente (≈1 la 3,3 s susținut; rafală de 30 apoi așteptare) și 30 req / 10 s pentru restul — important la emitere în masă (bulk 100 facturi ≈ 5-6 minute).

**Costuri**: pagina principală `https://www.oblio.eu/` anunță „Nelimitat" **29 €/an (~2,49 €/lună)**, utilizatori/firme/puncte de lucru nelimitate, e-Factura gratuită, „Gratuit 1 AN" pentru cont nou, și „gratuit pe viață până la 3 documente/lună" [CONFIRMAT de pagina de marketing, DE VERIFICAT condițiile]. Documentația API nu listează condiții de plan; parteneri terți spun „cont activ cu acces API" [TERȚ]. **[DE VERIFICAT]:** dacă API-ul e inclus în planul gratuit/Nelimitat, dacă e-Factura prin API merge pe planul gratuit.

**Sandbox**: nu există în documentație (exemplele folosesc CIF real). Testare: cont Oblio de test (1 an gratuit), serie dedicată, `DELETE` doar pe ultimul document al seriei, sau `cancel`.

### 2.3 Comparație și recomandare

| Criteriu | Oblio | SmartBill |
|---|---|---|
| Auth | OAuth token 1h (email + secret) | Basic email+token (V1), Bearer (V3) |
| Idempotență la emitere | **Da** (`idempotencyKey`) | **Nu** → protecție proprie + reconciliere |
| Webhook-uri | **Da** (payload nedocumentat) | **Nu** → polling |
| e-Factura/SPV via API | **Da** (trimite + status + arhivă) | **Nu în API** (din UI SmartBill) |
| Citire/listare facturi | **Da** (list cu filtre) | Doar PDF + `paymentstatus` pe serie/nr. cunoscut |
| Proformă → factură | `referenceDocument` | `useEstimateDetails` + `estimate` |
| Storno | `refund:1` | `POST /invoice/reverse` |
| Încasări | collect (11 tipuri) | `POST /payment` (11 tipuri, bon fiscal cu text pt. casă de marcat) |
| Link plată card | nu am găsit | `paymentUrl` (Netopia/euPlatesc/Stripe) |
| Autocompletare CIF | `client.autocomplete` | nu (folosim ANAF direct) |
| Rate limit | 30/100 s documente; 30/10 s rest | 30/10 s (V1; blocare 10 min); V3 separat + 50k/zi |
| Cost API | inclus în abonament 29 €/an? [DE VERIFICAT] | cotă documente/abonament; depășire 0,017 €/doc |
| Sandbox | nu | nu |
| Documentație | HTML, câteva inconsistențe | OpenAPI 3.1 modern, gata pentru cod |
| Cota de piață printre contabili | [NEVERIFICAT] | [NEVERIFICAT; percepută ca lider] |

**Ordine:** 1) **Oblio** (cel mai complet pentru un flux automatizat și cu risc mai mic de duplicate), 2) **SmartBill** adăugat în faza 4 cu stări suplimentare (`spv_status='unknown'`, `issuing` ambiguu, polling pe `paymentstatus`). Interfață comună în `src/lib/billing/providers/{oblio,smartbill}.ts` implementând: `testConnection`, `listSeries`, `listVatRates`, `lookupClient`, `createProforma`, `createInvoice(from proforma?)`, `reverseInvoice`, `cancel`, `getPdfUrl`, `registerPayment`, `getPaymentStatus`, `getEinvoiceStatus`, `sendEmail`. Capabilități declarate per furnizor (`supportsWebhooks`, `supportsIdempotencyKey`, `supportsSpvStatus`, `supportsPaymentLink`) ca UI-ul să ascundă/afișeze corect.

---

## 3. Context legal românesc (de validat cu un contabil autorizat)

**Avertisment:** am găsit în principal surse secundare (bloguri contabile); nu am putut verifica texte oficiale ANAF/legislație. Totul de mai jos e [DE VERIFICAT] înainte de lansare comercială.

### 3.1 RO e-Factura (OUG 120/2021, actualizată)
- B2G obligatoriu din 2022; **B2B obligatoriu din 1 ianuarie 2024**; **B2C** (factură către persoană fizică) obligatoriu din ianuarie 2025, cu amenzi pentru netransmitere B2C aplicate din **1 iulie 2025** [TERȚ: bono.ro, realcont.ro, mefi.ro].
- **Termen de transmitere: 5 zile lucrătoare** de la emitere, conform **OUG 89/2025**, în vigoare din 1 ianuarie 2026 (ziua emiterii nu se numără; weekend și sărbători nu se numără); stornarea unei facturi greșite are același termen. Facturile transmise nu se șterg — se corectează prin storno [TERȚ].
- **Persoane fizice identificate prin CNP**: surse contradictorii (amânare la 1 iunie 2026 prin OG 6/2026, apoi „eliminarea" obligației prin Legea 88/2026, devenind opțională) — [DE VERIFICAT; nu stocăm CNP-uri, vezi GDPR §8].
- Amenzi: 1.000–2.500 lei (contribuabili mici) / până la 10.000 lei (mari) pentru transmitere cu întârziere; 15% din valoare pentru beneficiarul care înregistrează o factură netransmisă de un furnizor român (nu în B2C) [TERȚ, surse inconsistente].
- Excluse: bonuri fiscale, documente care nu sunt facturi (**proformele nu intră în SPV**), livrări intracomunitare/export, furnizori nestabiliți în RO [TERȚ].
- **Cum ajunge factura în SPV:** prin furnizorul de facturare, nu direct de la noi. Oblio: conectare SPV din cont + `spvExtern`/`POST /docs/einvoice`; SmartBill: autorizare ANAF în cont (valabilă 90 zile, reautorizare automată; email la eșec) și trimitere din UI/automată — API nu expune. **Decizie de design:** ElectroField NU implementează upload direct în API-ul ANAF (OAuth/certificat digital per firmă = proiect separat, risc mare); folosește furnizorul și urmărește statusul. Alertă obligatorie în platformă: „factură emisă dar neconfirmată în SPV după 3 zile lucrătoare" (doar unde furnizorul expune statusul — Oblio).
- XML-ul (CIUS-RO) îl generează furnizorul, dar validarea ANAF respinge date proaste: adresă completă (județ, localitate; București → „Sector 1–6" — explicit în spec SmartBill), CUI corect, cote TVA și motive de scutire/taxare inversă valide. Deci datele clientului trebuie **structurate** (județ, localitate, stradă), nu un singur câmp `address`.

### 3.2 Câmpuri obligatorii pe factură (art. 319 Cod fiscal — de confirmat textul)
Număr secvențial unic (serie), data emiterii, date identificare furnizor (denumire, adresă, CUI/cod TVA, Reg. Com.) și beneficiar (denumire, adresă, CUI sau, pentru persoane fizice, doar nume/adresă), descriere bunuri/servicii, cantitate, preț unitar fără TVA, baza de impozitare per cotă, cota și suma TVA, total de plată, data livrării/prestării dacă diferă, mențiuni speciale („taxare inversă", scutiri cu temei legal, „TVA la încasare" dacă e cazul). Furnizorul acoperă machetarea; noi trebuie să **furnizăm datele** (de aici câmpurile noi pe `organizations`/`clients`).

### 3.3 Cote TVA pentru instalații
- Cota standard în RO este **21%**, cea redusă **11%**, din 1 august 2025 (Legea 141/2025) [TERȚ; exemplul oficial din spec SmartBill folosește 21%]. Panouri fotovoltaice + instalare pentru persoane fizice: sursele spun că cota redusă a fost eliminată → **21%**; regimul special pentru locuințe noi (9%) ar fi expirat 31.07.2026 — **neconfirmat** [DE VERIFICAT; flag roșu].
- **Taxare inversă în construcții** (art. 331 alin. (2) lit. b Cod fiscal, „lucrări de construcții-montaj" către plătitori de TVA, în anumite condiții/CAEN) — se aplică B2B, nu către persoane fizice; domeniul exact 2026 [DE VERIFICAT]. **Decizie de design:** NU decidem automat; pe linie există selector „regim TVA" (Standard 21% / Redusă 11% / Taxare inversă / Scutit / Neplătitor TVA) setat implicit din maparea produsului, cu **confirmare explicită a adminului** pentru taxare inversă și mențiune obligatorie pe document. La SmartBill, 0% fără `taxName` explicit cade pe „Taxare inversa" — deci trimitem `taxName` mereu.
- Firma-client poate fi **neplătitoare de TVA** (ex.: proprietarul ElectroField e PFA neplătitor — dar nu e cazul tuturor). Flag `organizations.is_vat_payer`; dacă fals → linii fără TVA, `taxName` corespunzător din cont [DE VERIFICAT denumirea în fiecare furnizor].

### 3.4 Avans / acont / facturi etapizate
- La încasare de avans pentru servicii apare exigibilitatea TVA; avansul încasat fără factură trebuie facturat (regula zilei 15 a lunii următoare) iar la factura finală se regularizează (stornare avans) [TERȚ: fiscalitatea.ro, profit.ro, ANAF].
- Pentru lucrări decontate pe **situații de lucrări** acceptate de beneficiar, facturile pe stadii finalizate sunt facturi finale pentru stadiu, nu avansuri (Decizia ANAF 775/2016, citată de surse) [DE VERIFICAT].
- Impact de design: tipuri de document `proforma | advance | stage | final | storno`, relație `parent_invoice_id`, iar factura finală se emite cu linii negative de regularizare (SmartBill/Oblio: linii de avans negative sau `referenceDocument`) — în faza 3.

### 3.5 Încasare numerar (relevant pentru tehnician)
- Servicii către populație încasate în numerar → în principiu **bon fiscal** (OUG 28/1999). Există excepție pentru „servicii de instalații/reparații/întreținere la domiciliul clientului" (art. 2) — **neclar dacă acoperă instalarea** [TERȚ; DE VERIFICAT pe legislatie.just.ro cu contabilul]. Chitanța e uzuală pentru PFA/II/persoane juridice. Tehnicianul în teren nu are casă de marcat fiscală: de aceea, în MVP, încasarea în teren se înregistrează ca **„încasat numerar, document fiscal de confirmat de admin"**, iar documentul (chitanță electronică din seria de chitanțe a furnizorului / bon) se emite de back-office; alternative: link de plată card (SmartBill `paymentUrl`), transfer bancar cu scadență. Plafoane de numerar [DE VERIFICAT].

### 3.6 ANAF — căutare CUI pentru crearea clienților
`POST https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva` (doc: `https://static.anaf.ro/static/10/Anaf/Informatii_R/Servicii_web/doc_WS_V9.txt`): body JSON `[{ "cui": 123, "data": "YYYY-MM-DD" }]`, **max 100 CUI/cerere, max 1 cerere/secundă**; răspuns: denumire, adresă sediu/domiciliu fiscal (structurată: județ, localitate, stradă, număr), nr. Reg. Com., `scpTVA` (plătitor TVA), TVA la încasare, `statusInactivi`, Split TVA, **`statusRO_e_Factura`**. Folosire: server-side, cu cache 24 h și limitare 1 rps; completează automat formularul de client (nume, adresă structurată, plătitor TVA, Reg. Com.), avertizează dacă firma e **inactivă** sau neînregistrată e-Factura. Eroare în exemplul oficial (JSON invalid) → validare defensivă. Pentru Oblio, alternativ `client.autocomplete:1`. Pentru persoane fizice — fără lookup; nume + adresă; nu cerem CNP.

---

## 4. Maparea modelului de date → factură

### 4.1 Lanț de documente
`client → lucrare (job) → [deviz/ofertă] → proformă → [avans/etape] → factură finală → încasări`
- **Deviz/ofertă**: nu există tabel azi. Faza 5: `quotes` + `quote_lines`, apoi proformă din ofertă aprobată. Până atunci: proforma se construiește direct din lucrare (liniile de lucru).
- **Proformă** = document nefiscal emis de furnizor (`POST /estimate/v2` / `/docs/proforma`), trimis clientului; la acceptare/avans → factură cu referință.
- **Factură** = document fiscal cu număr din serie; imuabil după emitere (corecții doar storno + factură nouă).

### 4.2 Surse de linii (din ce știm azi)
| Sursă în ElectroField | Linie de factură | Preț de vânzare (lipsește azi) |
|---|---|---|
| `material_usage` (cantitate × material) | 1 linie / material, `unit`=`materials.unit`, cod = `provider_product_code` | **nou** `materials.sale_price`, `materials.vat_regime`; NU se folosește `unit_cost` (cost intern, nu se arată clientului) |
| Ore din `time_entries` (work_start/work_end, `pairHours`) | „Manoperă" × ore | **nou** tarif de vânzare per tip lucrare/echipă (`service_rates`); `profiles.hourly_rate` este cost, nu preț |
| `jobs.distance_km` | „Deplasare" × km sau taxă fixă | **nou** `service_rates.travel_per_km` sau `travel_flat`; `organizations.fuel_cost_per_km` este cost |
| `expenses` aprobate refacturabile | „Cheltuieli refacturate" (opțional per cheltuială, flag `rebillable`, markup) | **nou** `expenses.rebillable`, `markup_percent` |
| Linii adăugate de tehnician/admin | linie manuală (`source_type='manual'`) | introdus la fața locului, cu plafon din politică |
| `job_required_items` | NU se factorează (planificare), doar `material_usage` real | — |

Sugestia de linii se calculează pe server la finalizarea lucrării (funcție `buildInvoiceSuggestion(jobId)`), se salvează ca **draft** (`invoices.status='draft'` + `invoice_lines`) și poate fi editată; la emitere se „înghețăm" liniile.

### 4.3 Client
| ElectroField | Furnizor |
|---|---|
| `clients.client_type='company'` + `cui` | Oblio `client.cif`, `vatPayer`, `rc`, `autocomplete`; SmartBill `client.vatCode`, `isTaxPayer`, `regCom` |
| `individual` | `client.name` + adresă; fără CIF (nu cerem CNP) |
| `address` text liber | **spargere în** `county, city, street, zip` (nou) — necesar pentru e-Factura |
| `email` | `client.email` + destinatar trimitere |
| ID furnizor | nou `client_provider_refs(client_id, connection_id, provider_client_id)` (SmartBill V3 `cus_…`, Oblio `clientId`) |
- Regulă: clientul se trimite **inline** la emitere (snapshot în `invoices.client_snapshot jsonb`), cu `save`/`saveToDb` activ pentru ca nomenclatorul furnizorului să rămână aproape sincron, dar nu depindem de el.

### 4.4 Plăți și statusuri înapoi
- Plata se modelează ca `invoice_payments` (sumă, metodă, cine, când, sursă = platformă/mobil/sincron furnizor, `provider_ref`). `invoices.payment_status` se derivă: `unpaid | partial | paid | overdue` (overdue = `due_date` depășit & nepl. — calculat în interogare/job nocturn, azi nu există).
- Sincronizare: **Oblio** — webhook `Collect/Inserted` + polling `list?collected=…`; **SmartBill** — polling `paymentstatus` pe facturile deschise (≈1 apel/factură, cu limită 3/s; interval adaptiv: dese pentru recente, rare pentru vechi).
- Încasare inițiată din ElectroField → apel `collect`/`/payment` către furnizor (cu cheie de idempotență proprie în `invoice_payments`), apoi sincron.
- Încasare făcută direct în furnizor → o descoperim la sincron și o inserăm cu `source='provider_sync'` (reconciliere, fără dublare — cheie `(connection_id, provider_ref)` unică).

---

## 5. Flux end-to-end și UI

### 5.1 Platforma admin (back-office)

**A. Setări → Integrări (înlocuiește placeholder-ul din `setari/page.tsx`)** — asistent în 5 pași:
1. **Alege furnizor** (Oblio / SmartBill / „Fără integrare — evidență internă"). Explicații: unde găsești cheia (Oblio: Setări→Date cont; SmartBill: Integrări→API), ce plan e necesar, ce costuri.
2. **Conectare**: câmpuri email + secret/token + CIF (Oblio: listă firme din `/nomenclature/companies`). Câmpurile secret sunt write-only; după salvare se afișează „••••" + data verificării. Buton „Testează conexiunea" (apel real la serii) — salvare doar dacă testul trece (ca în fluxul de mail: `verified_at`).
3. **Serii**: dropdown-uri alimentate live (`/nomenclature/series`, `/series?type=`) pentru: factură, proformă, storno, chitanță. Avertisment explicit dacă seria nu există.
4. **TVA**: sincronizare cote din cont (`vat_rates`/`/tax`), alegere cotă implicită (21%), mapare regimuri (Standard, Redusă, Taxare inversă, Neplătitor) → `taxName` exact; toggle „Firma este plătitoare de TVA"; toggle „TVA la încasare".
5. **Produse și servicii**: mapare: „Manoperă", „Deplasare", „Cheltuieli refacturate", fiecare material din catalog → produs/serviciu din furnizor (cod, UM, TVA); opțiune „creează automat în furnizor" (`save`/`saveToDb`). Încărcare listă existentă de produse din furnizor pentru potrivire.
6. **Reguli** (pe aceeași pagină): cine poate emite (§6), prag de aprobare, termen de plată implicit (zile), mențiuni implicite, șablon email, e-Factura (checklist: „SPV conectat în {furnizor}", link către ghid; status afișat dacă furnizorul îl expune).
- Banner permanent de sănătate a conexiunii (OK / cheie invalidă / limită abonament / rate-limit) cu butonul „Re-verifică".

**B. Facturare (pagina existentă, extinsă)**
- Taburi: **Facturi** · **Proforme** · **De aprobat** (n) · **Erori** (n) · **De facturat** (lucrări finalizate fără factură).
- Coloane: Nr. fiscal (serie+număr), Client, Lucrare, Data, Valoare cu TVA, **Status emitere** (Draft / În aprobare / Se emite / Emisă / Anulată / Stornată / Eroare), **e-Factura** (N/A, Netrimisă, În procesare, Trimisă, Eroare — doar unde există status), **Plată** (Neîncasată / Parțial / Încasată / Restantă). Acțiuni rând: Deschide în furnizor, PDF, Trimite email/WhatsApp, Încasează, Storno, Reîncearcă, Istoric (audit).
- KPI-urile existente rămân, calculate din `invoice_payments` și `payment_status`, nu din text.
- „**Emite din lucrare**": buton pe pagina lucrării (tab nou „Facturare" lângă „Cheltuieli"): afișează liniile sugerate (editabile), clientul (cu verificare ANAF), totaluri net/TVA/total, **marja** (doar admin/manager; legătură cu profitul existent), butoane „Salvează draft", „Emite proformă", „Emite factură".
- **Bulk**: tab „De facturat" → bifare mai multe lucrări finalizate → „Generează drafturi" (server-side, `buildInvoiceSuggestion` pe fiecare) → revizuire rapidă (listă cu avertismente: material fără preț, client fără CUI valid, 0 ore) → „Emite selecția". Emiterea merge printr-o coadă care respectă limitele (Oblio 30/100 s → ~1 doc / 3,5 s; SmartBill 3/s), cu progres și raport de erori pe rând.
- Pagina Client: tab „Facturi" rămâne, dar formularul „Emite factură" se înlocuiește cu link către flux (eliminăm calea duplicat `createInvoice` din `clienti/actions.ts`).
- Notificări (infrastructura `notifications` + push existentă): „Factură de aprobat", „Emitere eșuată", „Cheie API invalidă", „Plată primită", „Factură neconfirmată în SPV".

### 5.2 Aplicația tehnicianului (telefon)

Flux nou după `finalizeJob`, cu pasul „semnătură" mutat DUPĂ revizuirea sumelor (clientul semnează documentul pe care îl vede):

1. **Finalizare** (existent) → 2. **Facturare — revizuire linii** (ecran nou `/mobil/lucrari/[id]/facturare`, `mobile_stage='facturare'`): linii grupate (Manoperă: ore × tarif; Materiale: din `material_usage`; Deplasare; Cheltuieli refacturabile). Editare permisă în politică: cantitate ±, ștergere linie sugerată (cu motiv, auditat), **„Adaugă linie suplimentară"** (din catalog sau text liber + preț, dacă politica permite; altfel „Cere aprobare"). Se arată doar prețuri de vânzare — **niciodată costuri, tarife orare interne sau marjă**. Total net/TVA/total vizibil mare.
3. **Date client**: verificare rapidă CUI (apel ANAF server-side) sau nume/adresă pentru persoană fizică; email/telefon pentru trimitere.
4. **Semnătura clientului** (componenta existentă `signature-pad.tsx`, `saveSignature`), legată de `invoice.id` și de **fingerprint-ul liniilor** (hash) — dacă liniile se schimbă după semnare, semnătura se invalidează și se cere din nou. Se atașează la PDF-ul „fișă de predare" (raportul existent) nu la factura fiscală.
5. **Acțiune finală** (în funcție de politica organizației și rolul):
   - **Emite proformă** (permis pe larg; document nefiscal; util când clientul vrea ofertă/avans);
   - **Emite factură** (doar dacă politica = emitere directă și suma ≤ prag);
   - **Trimite spre aprobare admin** (implicit): creează `invoices.status='pending_approval'`, push către admini/manageri.
6. **Trimitere către client**: email (via furnizor `sendEmail`/`document/send` sau prin mailul platformei), **WhatsApp** prin deep link `https://wa.me/<tel>?text=<mesaj cu link public>` / foaia de partajare Capacitor (Share) — fără WhatsApp Business API în MVP; SMS opțional. Linkul public: SmartBill `documentViewUrl` (confirmat public); Oblio `link` [DE VERIFICAT dacă e public/ expiră] — alternativ, ElectroField stochează PDF-ul și servește un link semnat cu expirare.
7. **Încasare numerar/card/transfer**: ecran „Încasare": sumă (implicit total), metodă (numerar / card POS al clientului / transfer / link card), notă. Se salvează `invoice_payments` cu `collected_by`, GPS opțional, semnătură. Numerar → status „încasat, în așteptare confirmare" până când adminul emite/atașează chitanța/bonul (§3.5) — sau direct chitanță electronică dacă politica o permite. Predare numerar: raport zilnic „bani de predat" per tehnician (faza 3).
8. **Confirmare** cu rezumat și ce urmează (ex. „Factura va fi emisă după aprobare și trimisă pe email").

**Offline** (stare actuală: WebView online-only):
- **Faza 2 (online-only, explicit):** dacă nu există conexiune la pas 2–7, ecran clar „Nu ai internet — nu se poate emite documentul"; datele deja încărcate rămân; nu pierdem semnătura (se reîncearcă upload).
- **Faza 5:** coadă locală (IndexedDB/Capacitor Preferences) pentru: modificările de linii, semnătura, intenția „trimite spre aprobare", încasare înregistrată; fiecare acțiune are `client_request_id` (UUID generat pe telefon) → server-ul deduplică (indice unic) la sincronizare. **Emiterea fiscală nu se face niciodată offline** — numărul fiscal îl alocă doar furnizorul, la sincronizare; în UI: „În așteptare conexiune". La sincronizare serverul recalculează sugestia și compară fingerprint-ul; dacă adminul a modificat între timp → conflict marcat pentru aprobare, nu suprascriere silențioasă.

### 5.3 Pași concreți de emitere (server)
1. Acțiune server `requestIssue(invoiceId, {type})` verifică rol/politică/pragu (§6), recalculează totalurile din `invoice_lines`, validează (client complet, linii > 0, cantități > 0, preț ≥ 0, TVA setat, serie configurată, e-Factura: adresă validă).
2. Trece factura în `issuing` și creează rând în coada `billing_jobs` (outbox) cu `idempotency_key` (UUID fix per factură) și `request_fingerprint` (hash payload).
3. Worker (Vercel Cron / Supabase scheduled function / `pg_cron` + `pg_net` — alegerea infrastructurii se confirmă; nu se face în cererea utilizatorului, ca să nu depindem de timeout-ul acțiunii): citește secretele prin RPC Vault (`credentials`), obține token (Oblio) / folosește Basic (SmartBill), apelează furnizorul cu timeout 20–25 s.
4. La succes: salvează `series`, `number`, `provider_doc_id`, `public_url`, `issued_at`, `status='issued'`, descarcă PDF în bucket `attachments` (cale `{org}/invoices/{id}.pdf`, URL-uri semnate ca azi), scrie `invoice_events`.
5. Post-emitere: (opțional) trimite email; (Oblio) declanșează e-Factura dacă nu e automat; programează polling de status.

---

## 6. Permisiuni, audit, erori, idempotență

### 6.1 Cine poate ce (propunere; configurabilă pe organizație)
| Acțiune | admin | manager | team_leader | technician | client |
|---|---|---|---|---|---|
| Conectare/ștergere furnizor, chei, serii, mapări | DA | NU (doar vizualizare stare) | NU | NU | NU |
| Vizualizare facturi org | DA | DA | doar lucrările echipei | doar lucrările la care e alocat, fără marjă/cost | — |
| Creează/editează draft | DA | DA | DA (pe echipă) | DA (la lucrările lui, în politica) | — |
| Emite proformă | DA | DA | DA | DA (dacă politica ≥ „proforma") | — |
| Emite factură fiscală | DA | DA | configurabil (prag) | configurabil (implicit **NU**) | — |
| Aprobă facturi trimise spre aprobare | DA | DA | NU | NU | — |
| Încasează (înregistrează plată) | DA | DA | DA | DA (numerar „în așteptare") | — |
| Confirmă încasare/chitanță | DA | DA | NU | NU | — |
| Storno / anulare | DA | DA (cu motiv; peste prag doar admin) | NU | NU | — |
| Bulk emitere | DA | DA | NU | NU | — |
| Vezi cost/marjă | DA | DA | NU | NU | — |
- Politică org (`billing_settings`): `technician_mode` ∈ {`none`, `proforma_only`, `request_approval`, `issue_direct`}; `approval_threshold_ron`; `allow_extra_items`; `allow_cash_collection`; `require_signature_before_issue`.
- **Aplicare:** (a) verificări în server actions (nu doar UI), (b) RLS pe `invoices`/`invoice_lines`/`invoice_payments` cu `current_role()` ca în migrarea de notificări: tehnicianul poate `SELECT` pe lucrările lui și `INSERT/UPDATE` doar pe `status in ('draft')` ale lui; **nicio** cale de `UPDATE status → issued` din client — doar RPC/ server action cu `service_role`/`security definer` după verificarea politicii, (c) trigger `before update` care blochează modificarea liniilor/sumelor după `issued` (imuabilitate), (d) credențiale: citibile doar server-side (RPC cu verificare `admin`; spre deosebire de mail, aici firma e tenant → verificare `organization_id = current_org_id()` + rol).
- Atenție: **o cheie Oblio/SmartBill dă acces larg în contul furnizorului** → separarea permisiunilor trebuie făcută la noi; recomandăm firmelor un utilizator dedicat în furnizor [DE VERIFICAT dacă oferă drepturi limitate].

### 6.2 Audit
- Tabel `invoice_events` (append-only, fără UPDATE/DELETE): `invoice_id, org, actor_id, actor_role, action (created|edited|line_added|line_removed|submitted|approved|rejected|issue_requested|issued|issue_failed|retry|pdf_fetched|emailed|whatsapp_shared|payment_recorded|payment_synced|spv_status|cancelled|reversed|connection_changed), from_status, to_status, request_fingerprint, provider_http_status, provider_response_redacted jsonb, client_ip, user_agent, device_id, created_at`.
- Duplicăm evenimentele majore în `audit_log` existent (`entity_type='invoice'`). Păstrare ≥ 10 ani (obligații contabile — [DE VERIFICAT termen]); fără date sensibile în log (nu logăm tokenuri, nu CNP).
- Semnătura clientului legată de `invoice_id` + hash linii + timestamp + nume semnatar + (opțional) GPS la semnare.

### 6.3 Eșec și reîncercare
| Situație | Comportament |
|---|---|
| Autentificare (401, token invalid, secret schimbat) | Fără retry; `connection.status='auth_failed'`; toate emiterile în așteptare rămân `queued`; notificare admin; bannere |
| Validare (400/422, `errorText`, serie lipsă, TVA inexistent, client incomplet) | Fără retry automat; factura → `failed_validation` cu mesaj în română (mapare din `errorText`/`errors[].param`; curățare HTML la SmartBill) → utilizatorul corectează și apasă „Reîncearcă" |
| Limită de abonament (SmartBill `subscription_limit_exceeded`, „număr maxim documente") | Fără retry; alertă „Pachetul SmartBill al firmei a atins limita de documente"; afișăm consum |
| Rate limit (429 / HTTP 403 la SmartBill V1 = blocat 10 min / pauză Oblio) | Backoff cu `Retry-After`; coadă globală per conexiune cu token bucket; NU retrimitem imediat |
| Eroare server / timeout / rețea | Reîncercări 1 min, 5 min, 30 min, 2 h, 6 h (max 5) cu aceeași `idempotency_key`; după epuizare → `needs_attention` + notificare |
| Răspuns pierdut după emitere (cel mai periculos: dublă factură) | **Oblio:** retrimitere cu același `idempotencyKey` e sigură. **SmartBill (fără idempotency key):** NU retrimitem automat; stare `unknown`; reconciliere: (1) înainte de apel salvăm `nextNumber` din `/series`; (2) după timeout verificăm `GET /invoice/pdf` pe numerele următoare candidate sau `paymentstatus` pe `seria+nextNumber`; (3) punem în `mentions/observations` un marker `EF:{invoice_id}` ca să fie identificabil în UI SmartBill; (4) dacă nu se poate decide automat → cerem adminului confirmare manuală (introduce numărul sau „nu s-a emis") |
| Webhook pierdut | Polling de siguranță la 15 min (documente deschise) + reconciliere nocturnă; webhook-ul e doar declanșator, starea reală se re-citește |
| Eroare e-Factura (cod 2 la Oblio) | Status `spv_error` + alertă roșie cu termen (5 zile lucrătoare); corecție prin storno + factură nouă |
- Toate apelurile trec printr-un singur client HTTP (`providerFetch`) cu: timeout, redactare de loguri, metrici, circuit breaker per conexiune.

### 6.4 Idempotență și numerotare
- `invoices.idempotency_key uuid not null unique default gen_random_uuid()`; trimis ca `idempotencyKey` (Oblio). `invoice_payments.idempotency_key` la fel.
- Cereri de la telefon: `client_request_id` (UUID) cu index unic `(organization_id, client_request_id)`.
- **Numărul fiscal vine exclusiv de la furnizor**. Pentru drafturi folosim `display_ref` intern (ex. `DRAFT-{display_number}-{n}`). Contorul local `invoice_counters`/`next_invoice_number` rămâne doar pentru modul „evidență internă (nefiscal)" al firmelor fără integrare, marcat vizibil „Document intern — nu e factură fiscală" (altfel avem două sisteme de numerotare concurente — risc legal).
- Dedublare: o lucrare poate avea mai multe documente, dar constrângere de business `unique (job_id) where doc_type='final' and status not in ('cancelled','reversed','failed')` ca să nu se emită două facturi finale pentru aceeași lucrare.

---

## 7. Modificări de model de date (schiță)

> Notă: schema de bază nu e versionată complet în repo (doar 5 migrări); cine implementează trebuie să extragă schema reală (Supabase MCP `list_tables`/`generate_typescript_types`) și să scrie migrări incrementale + actualizare `database.types.ts`.

**Noi (schema `public`, RLS cu `current_org_id()`):**
```
billing_connections(
  id uuid pk, organization_id fk, provider text check in ('oblio','smartbill'),
  company_cif text, label text, status text check in ('active','auth_failed','limit','disabled'),
  settings jsonb  -- serii implicite, cote implicite, termen plată, mențiuni (FĂRĂ secrete)
  secret_id uuid fk vault.secrets   -- în schema private, vezi §8
  capabilities jsonb, last_verified_at, last_error text, created_by, created_at,
  unique(organization_id) where status<>'disabled'   -- 1 conexiune activă / org (faza 1)
)
billing_series(connection_id, kind in ('invoice','proforma','storno','receipt'), name, is_default)
billing_vat_map(connection_id, regime in ('standard','reduced','reverse_charge','exempt','non_payer'),
                provider_tax_name text, percent numeric, is_default)
billing_product_map(connection_id, source_type in ('labor','travel','expense','material'), source_id uuid null,
                    provider_product_code text, unit text, vat_regime)
billing_settings(organization_id pk, technician_mode, approval_threshold_ron, allow_extra_items,
                 allow_cash_collection, payment_terms_days, default_mentions, email_template)
service_rates(organization_id, job_type null, labor_rate_net, travel_per_km, travel_flat, vat_regime)
invoice_lines(id, invoice_id fk, position, source_type in ('labor','material','travel','expense','manual'),
              source_id uuid null, name, description, unit, quantity numeric(12,3), unit_price_net numeric(14,4),
              discount_pct, vat_regime, vat_percent, vat_name, provider_product_code, line_net, line_vat, line_total)
invoice_payments(id, invoice_id fk, organization_id, amount, method in ('cash','card','transfer','payment_link','other'),
                 status in ('pending_confirmation','confirmed'), collected_by, collected_at, provider_ref,
                 source in ('platform','mobile','provider_sync'), receipt_type in ('chitanta','bon','none'),
                 idempotency_key uuid unique, client_request_id uuid)
invoice_events(...)                      -- audit append-only, vezi §6.2
billing_jobs(id, invoice_id/payment_id, kind in ('issue','email','pdf','cancel','reverse','collect','spv_send','sync'),
             status, attempts, next_attempt_at, last_error, locked_at)   -- outbox/coadă
billing_webhook_inbox(id, connection_id, provider, event_id/hash unique, topic, payload jsonb, received_at, processed_at)
client_provider_refs(client_id, connection_id, provider_client_id, unique(client_id, connection_id))
quotes / quote_lines (faza 5)           -- deviz/ofertă
```
**Coloane noi pe tabele existente:**
- `invoices`: `connection_id, provider, provider_doc_id, series, number, doc_type in ('proforma','advance','stage','final','storno'), parent_invoice_id, status (draft|pending_approval|approved|queued|issuing|issued|failed_validation|needs_attention|cancelled|reversed|unknown), payment_status, spv_status (not_applicable|unknown|not_sent|processing|sent|error), spv_checked_at, currency default 'RON', net_total, vat_total, total, client_snapshot jsonb, issuer_snapshot jsonb, public_url, pdf_storage_path, idempotency_key, request_fingerprint, approved_by/approved_at, submitted_by/submitted_at, issued_by, issued_at_ts, cancelled_reason, display_ref, client_request_id, version`. **`total_amount` e coloană GENERATED din 4 sume** — se migrează: păstrăm vechile 4 coloane pentru facturile istorice, `ALTER COLUMN total_amount DROP EXPRESSION` și popularea din `total` pentru noile rânduri (sau coloană nouă `total`, și view de compatibilitate); `status` text (`unpaid|paid|overdue`) se transformă în `payment_status` + `status`.
- `clients`: `county, city, street, zip, country default 'RO', reg_com, is_vat_payer, anaf_checked_at, anaf_name, anaf_inactive bool, e_factura_registered bool`.
- `organizations`: `reg_com, is_vat_payer, vat_on_cash bool, county, city, iban, bank_name, billing_enabled`.
- `materials`: `sale_price numeric, vat_regime, billable bool default true, provider_code`.
- `expenses`: `rebillable bool, markup_percent`.
- `jobs`: `billing_status` (`not_billable|to_bill|draft|issued`) pentru tab-ul „De facturat" (derivat/cached).
- `signatures`: `invoice_id null, lines_fingerprint text` (legare semnătură ↔ document).
- Cron: calcul `overdue`.

---

## 8. Securitate

1. **Stocarea cheilor (obligatoriu):** Supabase Vault ca în `platform_mail_vault.sql`: tabel în schema `private` cu `secret_id → vault.secrets`, `enable row level security`, `revoke all … from public, anon, authenticated`, funcție `security definer set search_path=''` (dispatch cu operații `save/credentials/delete/check`), wrapper `public.ef_billing(operation, p_id, config)` `security invoker`. Spre deosebire de mail (platform admin), aici verificarea e **`organization_id = current_org_id()` AND `current_role() = 'admin'`** pentru `save/delete`, iar `credentials` doar pentru server (service role / rol de worker, nu `authenticated` direct). Reutilizăm blocarea în „preview company" (`x-ef-preview-org`) ca să nu poată fi atinse chei din modul previzualizare.
2. **Niciodată către client:** modul `server-only` (`import "server-only"`), fără chei în variabile `NEXT_PUBLIC_*`, fără chei în răspunsuri RSC/props, fără log. În UI: mascate. Browser/telefon nu cheamă furnizorul direct — doar server actions/route handlers. Telefonul nu are niciodată token de furnizor.
3. **Token Oblio de 1 h:** cache server-side per conexiune (tabel `private` cu expirare sau cache în DB), nu în memorie serverless.
4. **Rotire și revocare:** buton „Schimbă cheia"; la ștergerea conexiunii se șterge secretul din Vault (`vault.delete`/`delete from vault.secrets` ca în mail). La schimbarea parolei Oblio → `auth_failed`.
5. **Limitarea razei de acțiune:** recomandare utilizator dedicat în furnizor; la noi, politică de rol (§6.1) + rate limit propriu pe tenant (tipar DB `platform_mail_limits`) ca să nu epuizăm cota de documente a firmei (mai ales SmartBill) printr-o buclă/buton apăsat repetat.
6. **Webhook-uri:** URL cu `connection_id` + secret aleatoriu în cale (`/api/billing/webhooks/oblio/{connectionId}/{randomToken}`), comparare constant-time; răspuns la verificare Oblio (`X-Oblio-Request-Id` → base64); payload tratat ca neîncrezător; procesare idempotentă (`billing_webhook_inbox` unic); apoi re-citire din API; fără acțiuni distructive pe baza payload-ului.
7. **PII/GDPR:** nu stocăm CNP (e-Factura pentru CNP e opțional/neclar și CNP e date sensibile); minimizare în `client_snapshot`; politică de retenție; loguri redactate; PDF-urile în bucket privat cu URL-uri semnate (practica existentă `signedAttachmentUrls`); acord de prelucrare (DPA) cu firma-client — ElectroField devine persoană împuternicită și pentru datele fiscale ale clienților finali.
8. **Integritate:** imuabilitatea facturilor emise (trigger), audit append-only, fingerprint al payload-ului trimis.
9. **Validări server:** sume cu `numeric`, rotunjiri conform `precision` 2, validare cantități pozitive (SmartBill acceptă 0/negative!), plafon pe linie și pe total pentru tehnician, dedublarea liniilor sugerate.
10. **Costuri:** cotele de documente SmartBill (consum și pe ciorne) → afișăm consumul curent; evităm drafturi inutile în furnizor (drafturile rămân la noi până la „Emite").
11. **Acces la secrete în Next:** nicio rută GET care întoarce credentials; testare de securitate pentru „un tehnician sau manager nu poate apela RPC `credentials`".

---

## 9. Plan de implementare pe faze

**Faza 0 — Pregătire (≈1 săptămână)**
- Decizii proprietar (§10); consultare contabil pentru TVA, numerar, e-Factura.
- Cont de test Oblio (și SmartBill dacă se decide) cu serie dedicată.
- Refactor local: elimină `createInvoice` duplicat din `clienti/actions.ts` (cursa `count+1`); înlocuiește `.maybeSingle()` din `lucrari/[id]/page.tsx`; adaugă verificări de rol în actions existente; extrage schema reală în migrări versionate.
- Migrări: coloane fiscale pe `organizations`/`clients`, `materials.sale_price`, `service_rates`, `invoice_lines`, status nou (compatibil cu datele istorice).

**Faza 1 — MVP Oblio, flux admin (≈2–3 săptămâni)**
- `src/lib/billing/` (interfață, client Oblio, mapare erori, redactare), Vault `ef_billing_*`, `billing_connections`, UI Setări→Integrări (conectare, test, serii, TVA, mapare produse minimală).
- „Emite din lucrare" (draft → factură) cu coadă/worker + `idempotencyKey`, salvare PDF/link, `invoice_events`.
- Listă Facturare cu statusuri reale; polling status plată.
- Acceptare: o lucrare finalizată → factură Oblio cu 21% și linii corecte, număr fiscal în ElectroField, PDF disponibil, repetarea butonului nu dublează; test pe cont real.

**Faza 2 — Telefon online-only + aprobare (≈2–3 săptămâni)**
- Ecran mobil facturare (revizuire linii, linii extra, client, semnătură legată de fingerprint), proformă, „trimite spre aprobare", pagina „De aprobat" în back-office, notificări push.
- Trimitere email/WhatsApp (link), înregistrare încasare (numerar „în așteptare"/card/transfer).
- Politici de permisiuni (`billing_settings`) + RLS pe rol.

**Faza 3 — Fiscal complet (≈2–3 săptămâni)**
- e-Factura: webhooks + polling, `POST /docs/einvoice`, alerte termen 5 zile lucrătoare.
- Storno/anulare, bulk emitere cu coadă și limite, ANAF CUI lookup (cache, 1 rps), proformă → factură, avans/etape (regularizare), rapoarte încasări pe tehnician, calcul `overdue`.

**Faza 4 — SmartBill (≈2 săptămâni)**
- Adaptor V1 (+V3 pentru nomenclatoare read-only), stări pentru lipsa idempotenței (`unknown` + reconciliere), polling `paymentstatus`, limitare 3/s și protecție blocare 10 min, afișare consum cotă documente, `paymentUrl` ca opțiune, `spv_status='unknown'` + ghid.

**Faza 5 — Offline, oferte, profit (≈4+ săptămâni)**
- Coadă locală cu `client_request_id` (IndexedDB), UX stări de sincronizare, fără emitere fiscală offline.
- Modul oferte/devize (`quotes`) → proformă; mapare stocuri (`useStock`/gestiuni) cu `warehouses`; profit pe lucrare calculat pe facturat real (extinde tab-ul „Cheltuieli"); export pentru contabil.

Estimările sunt orientative (1 dezvoltator) și nu includ revizuirea legală sau obținerea conturilor.

---

## 10. Întrebări deschise pentru proprietar
1. Ce furnizor folosesc deja firmele-client țintă (SmartBill vs Oblio vs FGO)? Poate schimba ordinea fazelor 1/4.
2. Cine plătește abonamentul furnizorului (firma-client, direct) și cum îl vindem (mențiune în ofertă: costul facturării e separat de abonamentul ElectroField)? Documentul comercial actual spune că integrările nu trebuie vândute ca disponibile.
3. Tehnicienii pot emite facturi direct, sau doar proforme + aprobare? Prag de sumă?
4. Încasarea în numerar la client: cum se documentează fiscal azi la clienți (chitanță, bon, casă de marcat la sediu)?
5. Prețuri de vânzare: există liste de preț pentru materiale și tarife standard de manoperă/deplasare pe tip lucrare, sau se negociază per lucrare?
6. Se facturează în RON exclusiv? Clienți externi?
7. Lucrările cu etape/avans (instalații PV mari) — frecvență? (influențează prioritatea faza 3.)
8. Este necesar suport FGO (apare în placeholder)?

---

## 11. Incertitudini (rezumat)
- Prețuri/planuri API: SmartBill (ce planuri includ API; cum se numără documentele); Oblio (API inclus în planul gratuit/29 €/an?). Pagini de marketing, valori „de la".
- SmartBill: trimiterea automată în SPV pentru facturi emise prin API și posibilitatea de a citi statusul — **neconfirmat**, probabil imposibil din API.
- Oblio: format corp eroare, payload/semnătură/retry webhook, dacă `link` e public, comportament `vatIncluded` default.
- Sandbox: niciunul găsit la ambii.
- Legal: cote TVA pentru instalații/PV/locuințe după 1 august 2025 și 31 iulie 2026; domeniul taxării inverse în construcții 2026; reguli CNP în e-Factura (OG 6/2026, Legea 88/2026 — surse contradictorii); excepția casei de marcat pentru instalații; termene de arhivare; cuantumul amenzilor. Toate din surse secundare.
- Cota de piață și preferința contabililor pentru SmartBill vs Oblio — presupunere necomprobată.
- Schema reală a bazei (RLS, funcții) — doar parțial vizibilă din repo.
- Infrastructura pentru worker (Vercel cron vs Supabase) — de ales.

---

## 12. Surse (URL-uri)
**SmartBill**
- Referință API + OpenAPI oficial: https://api.smartbill.ro/ ; https://api.smartbill.ro/smartbill-api-spec.yaml (descărcat și analizat)
- Ajutor integrare API (2020): https://ajutorgestiune.smartbill.ro/article/473-intergare-api
- Prețuri: https://www.smartbill.ro/preturi/
- SDK terț (Ruby wiki, Python): https://github.com/dnutiu/smartbill-ruby-sdk/wiki ; https://pypi.org/project/smartbill-rest-sdk/
- MCP terț cu endpoint-uri: https://glama.ai/mcp/servers/bogdanripa/smartbill-mcp/tree
- Contact API: api@smartbill.ro ; vreauapi@smartbill.ro

**Oblio**
- Documentație API: https://www.oblio.eu/api
- Pagina principală / preț: https://www.oblio.eu/ (linkuri: https://www.oblio.eu/cat-costa, https://www.oblio.eu/pret-onest — nu au fost accesate)
- SDK oficial: https://github.com/obliosoftware/oblioapi ; https://packagist.org/packages/obliosoftware/oblio-api
- Comparații terțe (neaccesibile direct, doar din rezultate căutare): https://taxdome.com/ro-ro/blog/oblio-vs-smartbill

**Legal / ANAF**
- ANAF API CUI (v9): https://static.anaf.ro/static/10/Anaf/Informatii_R/Servicii_web/doc_WS_V9.txt (endpoint `https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva`)
- e-Factura 2026 (surse secundare): https://bono.ro/blog/ghid-ro-e-factura ; https://realcont.ro/e-factura-ghid-complet/ ; https://mefi.ro/e-factura/ ; https://imfs.ro/en/ghiduri/efactura-anaf-2026/
- Cote TVA 2026: https://finans.ro/blog/cote-tva-2026-21-11-ghid-facturare ; https://eurocontgrup.ro/blog/cote-tva-romania-2026/ ; https://bono.ro/blog/tva-in-romania
- Taxare inversă art. 331: https://www.fiscalitatea.ro/circulara-nr693567-din-2016-aplicarea-taxarii-inverse-prevazute-la-art331-din-codul-fiscal-16413/
- Avans / situații de lucrări: https://www.fiscalitatea.ro/lucrari-de-constructii-in-perioada-iunie-iulie-factura-emisa-ulterior-ce-cota-de-tva-aplici-24407/ ; https://contabilul.manager.ro/a/30148/factura-de-avans-termenul-legal-de-emitere-si-regulile-privind-exigibilitatea-tva.html ; https://static.anaf.ro/static/10/Anaf/culegere_solutionare/partea_2/TVA_aferenta_avansurilor.pdf
- Casă de marcat / servicii la domiciliu: https://www.fiscalitatea.ro/exceptii-utilizare-casa-de-marcat-afla-daca-esti-obligat-sa-o-folosesti-3385/ ; https://infotva.manager.ro/articole/studii-de-caz/obligatia-utilizarii-casei-de-marcat-pentru-servicii-prestate-catre-populatie-22086.html
- Texte de verificat la sursă: Codul fiscal (art. 281, 282, 319, 331) și OUG 120/2021, OUG 89/2025, OUG 28/1999 pe https://legislatie.just.ro și https://www.anaf.ro

**Cod intern consultat**
`src/app/(app)/facturare/{page.tsx,actions.ts}`, `src/app/(app)/clienti/actions.ts` (+`[id]/page.tsx`), `src/app/(app)/lucrari/[id]/page.tsx`, `src/app/mobil/lucrari/[id]/{actions.ts,finalizare,semnatura}`, `src/app/api/rapoarte-lucrare/[id]/route.tsx`, `src/lib/supabase/database.types.ts`, `src/lib/{auth.ts,storage.ts,mail/store.ts}`, `supabase/migrations/20261103010031_platform_mail_vault.sql`, `supabase/migrations/20261107120000_notifications_messaging.sql`, `android-app/capacitor.config.ts`, `docs/abonamente-si-valoare.md`.
