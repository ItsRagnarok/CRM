# API SmartBill Cloud si Oblio - emitere facturi din cod (Node/TypeScript, fetch)

Data cercetarii: 2026-11-09. Nu s-au folosit credentiale si nu s-au facut apeluri autentificate; doar documentatie publica si cod SDK oficial.

Marcajul **NECONFIRMAT** inseamna ca detaliul nu apare in sursa oficiala citata.

## Surse oficiale

| Sursa | URL |
|---|---|
| SmartBill, pagina de documentatie (viewer Scalar, JS) | https://api.smartbill.ro/en/ |
| SmartBill, specificatia OpenAPI 3.1 (sursa tuturor datelor SmartBill de mai jos; "Last updated: 16 October 2026") | https://api.smartbill.ro/en/smartbill-api-spec.yaml |
| Oblio, documentatie API | https://www.oblio.eu/api |
| Oblio, SDK oficial NodeJS/TypeScript (v3.0.2 pe npm) | https://github.com/OblioSoftware/OblioApiJs (pachet `@obliosoftware/oblioapi`, tarball https://registry.npmjs.org/@obliosoftware/oblioapi/-/oblioapi-3.0.2.tgz) |

Pagina https://api.smartbill.ro/ se incarca din YAML-ul de mai sus, deci toate citarile SmartBill de mai jos provin din spec-ul de la https://api.smartbill.ro/en/smartbill-api-spec.yaml (sectiunea numita intre paranteze). `https://www.smartbill.ro/api` returneaza 404.

---

# 1. SmartBill Cloud

## 1.1 Autentificare (spec, sectiunea "Authentication V1")
- API V1 (facturare) foloseste **HTTP Basic Auth**: `Authorization: Basic base64(email:token)`.
- Credentialele (Email, Token, CIF) se iau din SmartBill Cloud, pagina Integrari, sectiunea API: https://cloud.smartbill.ro/core/integrari/
- Nu exista pas de obtinere token si nu exista expirare documentata. Tokenul V1 se genereaza la crearea contului.
- Fiecare request trebuie sa contina `companyVatCode` (POST) sau `cif` (query, GET/PUT/DELETE) cu CIF-ul exact al firmei. Altfel eroarea este `Firma la care incercati sa va conectati nu mai este disponibila in Cloud.`
- Exista si API V3 (Bearer token, `https://ws.smartbill.ro/SBORO/api/v3/companies/{cif}/...`). Specificatia spune: "Choose V1 for invoicing and everyday operations". V3 nu are endpoint de emitere factura (doar produse, clienti, furnizori, depozite, cote TVA, NIR in beta). Pentru facturi se foloseste V1.
- Medii: un token `sb_test_` pe productie da 401 la V3. Pentru V1 spec-ul spune doar "a test token used on production fails". Un URL de test: NECONFIRMAT.

## 1.2 URL de baza
`https://ws.smartbill.ro/SBORO/api` (spec, `servers`). Headere: `Content-Type: application/json` obligatoriu pentru POST (lipsa da 415).

## 1.3 Endpoint-uri V1

| Operatie | Metoda si path | Parametri |
|---|---|---|
| a) Liste serii | `GET /series?cif=...&type=f` | `type`: `f` factura, `p` proforma, `c` chitanta (optional). Sectiunea "Settings > Document series" |
| a) Cote TVA din cont | `GET /tax?cif=...` | Util si ca test de conexiune/autentificare. Sectiunea "Settings > VAT rates" |
| b) Emitere factura | `POST /invoice/v2` | Body JSON, vezi 1.4 |
| c) Stare incasare | `GET /invoice/paymentstatus?cif=&seriesname=&number=` | |
| d) PDF | `GET /invoice/pdf?cif=&seriesname=&number=` | Raspuns binar |
| e) Anulare | `PUT /invoice/cancel?cif=&seriesname=&number=` | Reversibila cu `PUT /invoice/restore` (aceiasi parametri) |
| e) Stergere | `DELETE /invoice?cif=&seriesname=&number=` | Doar ultima factura din serie |
| e) Stornare | `POST /invoice/reverse` | Body JSON `{companyVatCode, seriesName, number, issueDate?}` |
| Trimitere pe email | `POST /document/send` | Detalii: NECONFIRMAT (nu am citit schema acestui endpoint) |
| Incasare separata | `POST /payment` | Detalii: NECONFIRMAT (nu am citit schema) |

Endpoint-ul `/invoice/v2` este cel documentat. Parametrii GET/PUT/DELETE se trimit in query string, cu numele `seriesname` (litere mici) si `cif`.

## 1.4 Emitere factura - `POST /invoice/v2`

Schema `InvoiceRequest` din spec:
- **Obligatorii:** `companyVatCode`, `seriesName`, `client`, `products` (minim 1 element).
- `client`: **obligatorii `name` si `country`**. Optionale: `vatCode`, `isTaxPayer` (default `false`), `regCom`, `address`, `city`, `county`, `email`, `phone`, `contact`, `iban`, `bank`, `code`, `saveToDb` (default `false`).
  - Atentie: daca `county` este "Bucuresti", `city` trebuie sa fie "Sector 1".."Sector 6", altfel e-Factura nu valideaza in SPV (spec, descrierea `client.city`).
  - Fara `client.country` eroarea este `tara trebuie specificata`.
- `products[]`: **obligatorii `name`, `quantity`, `price`, `measuringUnitName`, `taxPercentage`** (conform schemei `Product`). Optionale: `code`, `productDescription`, `isService`, `currency`, `exchangeRate`, `isTaxIncluded` (default `false`, pretul NU include TVA), `taxName`, `warehouseName`, `isDiscount`, `numberOfItems`, `discountType` (1 valoare / 2 procent), `discountValue` (negativ), `discountPercentage`, `translatedName`, `translatedMeasuringUnit`, `saveToDb`, `useSBProductName`.
  - `code` este obligatoriu daca firma are setarea "Foloseste cod produs" activa.
  - `taxName` si `measuringUnitName` trebuie sa existe exact in cont (case-sensitive).
  - Maxim 400 linii pe document.
- Optionale la nivel de factura: `issueDate` (`yyyy-MM-dd`, default azi), `dueDate`, `isDraft`, `currency` (default RON, enum de 32 monede), `exchangeRate`, `precision` (2-4), `useStock`, `payment{value,paymentSeries,type,isCash}`, `paymentDate`, `paymentUrl` (`"Generate URL"` pentru link de plata), `sendEmail` (default false), `email{to,cc,bcc}`, `language` (RO/EN/DE/FR/IT/ES), `observations`, `mentions`, `deliveryDate`, `issuerName`, `issuerCnp`, `delegateName`, `delegateIdentityCard`, `delegateAuto`, `aviz`, `useIntraCif`, `usePaymentTax` (TVA la incasare), `paymentBase`, `colectedTax`, `paymentTotal`, `useEstimateDetails`, `estimate{seriesName,number,useStock}`.
- Camp necunoscut sau tip gresit: HTTP 400 `{"type":"invalid_request_error","errors":[{"code":"json_mapping_error","param":"<camp>"}]}` fara `errorText`. Aceeasi pagina avertizeaza separat ca un camp gresit poate da 500 cu HTML.
- `sendEmail:true` cere adresa in `email.to` sau `client.email` si un server de email configurat in cont.

Exemplu minim, din spec (sectiunea "Quickstart"; la cURL, tradus in JSON):
```json
{
  "companyVatCode": "COMPANY_VAT_CODE",
  "client": { "name": "Client Test SRL", "country": "Romania" },
  "seriesName": "INVOICE_SERIES",
  "products": [{
    "name": "Produs Test", "code": "TEST01", "quantity": 1, "price": 100,
    "measuringUnitName": "buc", "taxName": "Normala", "taxPercentage": 21
  }]
}
```

Exemplu complet pentru client platitor TVA, in stilul exemplului 15 din spec:
```json
{
  "companyVatCode": "RO...", "seriesName": "FACT", "issueDate": "2026-11-09", "dueDate": "2026-11-24",
  "client": { "name": "Client SRL", "vatCode": "RO22222222", "isTaxPayer": true,
              "address": "Str. Lalelei 1", "city": "Sector 1", "county": "Bucuresti",
              "country": "Romania", "email": "client@example.com" },
  "products": [{ "name": "Servicii", "quantity": 1, "price": 100, "measuringUnitName": "buc",
                 "taxName": "Normala", "taxPercentage": 21, "isTaxIncluded": false, "isService": true }],
  "sendEmail": false
}
```
Campurile din acest al doilea exemplu sunt toate din schema; combinatia exacta este asamblata de mine, nu copiata din spec.

## 1.5 Raspuns la emitere si erori
Succes, HTTP 200 (spec, "Responses"):
```json
{ "errorText": "", "message": "", "number": "3593", "series": "INVOICE_SERIES", "url": "",
  "documentUrl": "https://cloud.smartbill.ro/documente/editare/factura/20363/",
  "documentId": 20363,
  "documentViewUrl": "https://cloud.smartbill.ro/documente/extern/pf/factura/f6a9a7d3...?srvid=2" }
```
- `errorText` gol inseamna succes. `url` este link de plata (doar cu `paymentUrl:"Generate URL"`). `documentUrl` cere autentificare. `documentViewUrl` este link public catre PDF.
- Eroare: `{"errorText":"Seria nu a fost gasita! ...","message":"","number":"","series":"","documentUrl":"","documentId":-1,"documentViewUrl":""}`. Coduri HTTP: 400, 401, 403, 404, 405, 415, 422, 429, 500. Textul `errorText` poate contine HTML si trebuie sanitizat.
- Spec-ul recomanda sa se citeasca `errorText` indiferent de status HTTP.

## 1.6 Stare incasare, PDF, anulare
- **Stare:** raspuns `{"errorText":"","invoiceTotalAmount":121,"paidAmount":0,"unpaidAmount":121,"paid":false}`. Factura inexistenta: HTTP 400 `errorText: "Factura nu a fost gasita"`.
- **PDF:** raspuns binar, `Content-Disposition: attachment`, nume tip `facturafac3880.pdf`. Nu trimite `Accept: application/pdf` (da 406); foloseste `*/*`, `application/octet-stream` sau omite headerul. Orice eroare (factura inexistenta, parametru lipsa) da **502 cu HTML**, nu JSON. Nu exista endpoint JSON/XML pentru factura (doar PDF).
- **Anulare:** `PUT /invoice/cancel`, idempotenta; 200 cu `message: "Factura cu seria si numarul fac3744 a fost anulata cu succes."`.
- **Stergere:** `DELETE /invoice`; doar ultima din serie (altfel `Nu poti sterge documentul ... deoarece nu este ultimul din serie!`).
- **Stornare:** `POST /invoice/reverse`; `issueDate` nu poate fi anterior facturii originale.

## 1.7 Rate limit (spec, "Rate Limiting")
- V1: **30 apeluri / 10 secunde / token**; la depasire acces blocat **10 minute**. Headere: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (timestamp unix).
- V3 (nu e necesar pentru facturare): 60 GET/10 s, 30 scrieri/10 s, 50.000/zi, cu `Retry-After` la 429.
- Fiecare factura emisa prin API, drafturi incluse, conteaza in numarul de documente din abonament (eroare `Pentru acest pachet s-a emis numarul maxim de documente permis`).

## 1.8 TVA in 2026 (din spec)
- Exemplele din spec folosesc `taxName: "Normala"`, `taxPercentage: 21`. Exemplul 15 foloseste si **11** (linia "Aliment") si **0** cu `taxName: "SDD"`. Exemplul de raspuns la `GET /tax`: `Normala 21`, `Redusa 11`, `Taxare inversa 0`.
- Pentru 0% trebuie trimis mereu un `taxName` existent in cont (`Taxare inversa`, `TVA Inclus`, `SDD`, `SFDD`). Fara el API-ul pune implicit `Taxare inversa`, indiferent de regimul corect.
- Cotele se citesc din `GET /tax`; "SmartBill accepts the VAT rates available in the account, including custom rates".
- Pretul este implicit FARA TVA (`isTaxIncluded:false`).
- **Emitent neplatitor de TVA:** exemplul 14 din textul descrierii arata produse fara campuri de TVA ("you do not need to fill in the VAT-related fields"). In schimb exemplul YAML cu acelasi titlu (`emitent_neplatitor_tva`) trimite `taxPercentage: 0` si `taxName: "Taxare inversa"`. Cele doua sunt contradictorii in spec; comportamentul sigur pentru un emitent neplatitor este **NECONFIRMAT** (de testat pe cont real). Schema `Product` marcheaza `taxPercentage` ca obligatoriu.
- **Client neplatitor:** `client.isTaxPayer` (default `false`). Nu exista in spec o regula separata de TVA pentru client neplatitor.
- Client UE: `useIntraCif`, `taxPercentage: 0`, `taxName: "Taxare inversa"` (exemplul 13).
- Baza legala a cotelor 21%/11%: spec-ul nu spune nimic, doar le foloseste in exemple.

## 1.9 e-Factura
Spec-ul OpenAPI **nu contine niciun parametru, endpoint sau camp pentru e-Factura/SPV/ANAF**. Singura mentiune este cerinta de format pentru `client.city` (Sector 1-6 pentru Bucuresti). Daca SmartBill trimite automat facturile in SPV (setare de cont) sau cere pasi in interfata: **NECONFIRMAT** in documentatia API. Un endpoint de stare e-Factura: **NECONFIRMAT** (nu exista in spec).

---

# 2. Oblio

## 2.1 Autentificare (https://www.oblio.eu/api, sectiunea "Autorizare")
- OAuth 2.0 client credentials. `POST https://www.oblio.eu/api/authorize/token`.
- `client_id` = emailul de login Oblio; `client_secret` = tokenul din Setari > Date Cont (se regenereaza la resetarea parolei).
- Documentatia arata exemplu `application/x-www-form-urlencoded`. SDK-ul oficial v3.0.2 trimite **JSON** `{client_id, client_secret, grant_type:"client_credentials"}` cu `Content-Type: application/json` (cod `lib/es6/Api.js` din pachetul npm). Ambele variante apar in surse oficiale.
- Raspuns: `{"access_token":"...","expires_in":"3600","token_type":"Bearer","scope":"","request_time":"1540471129"}`. Expira in 3600 s (1 h). SDK-ul calculeaza expirarea ca `request_time + expires_in`.
- Celelalte apeluri: `Authorization: Bearer {access_token}`. SDK-ul trimite si `Accept: application/json` si `Content-Type: application/json`.

## 2.2 URL de baza
`https://www.oblio.eu/api` (SDK: baza `https://www.oblio.eu` plus `/api/...`).

## 2.3 Endpoint-uri

| Operatie | Metoda si path | Parametri |
|---|---|---|
| Companii | `GET /nomenclature/companies` | raspuns `cif`, `company`, `userTypeAccess` |
| a) Serii | `GET /nomenclature/series?cif=` | raspuns `type`, `name`, `start`, `next`, `default` |
| Cote TVA | `GET /nomenclature/vat_rates?cif=` | `name`, `percent`, `default` |
| b) Emitere factura | `POST /docs/invoice` | body JSON, vezi 2.4 |
| c) Citire factura | `GET /docs/invoice?cif=&seriesName=&number=` | raspunsul include `collects[]` |
| c) Listare facturi | `GET /docs/invoice/list` | filtre: `cif`*, `seriesName`, `number`, `id`, `client`, `draft`, `canceled`, `collected` (-1/0/1), `issuedAfter`, `issuedBefore`, `withProducts`, `withCollects`, `withEinvoiceStatus`, `orderBy`, `orderDir`, `limitPerPage` (max 100), `offset` |
| Incasare | `PUT /docs/invoice/collect` | `cif`, `seriesName`, `number`, `collect{...}` |
| e) Anulare / restaurare | `PUT /docs/invoice/cancel`, `PUT /docs/invoice/restore` | `cif`, `seriesName`, `number` |
| e) Stergere | `DELETE /docs/invoice` | `cif`, `seriesName`, `number`, `deleteCollect`, `idempotencyKey`; doar ultimul document din serie |
| Trimitere e-Factura | `POST /docs/einvoice` | `cif`, `seriesName`, `number` |
| Descarcare arhiva SPV | `GET /docs/einvoice?cif=&seriesName=&number=` | format raspuns nedocumentat; SDK foloseste `getRaw` (binar) |
| Webhooks | `POST/GET /webhooks`, `DELETE /webhooks/{id}` | topicuri ex. `Invoice/Update`, `Invoice/Cancel`, `Collect/Inserted` |

**d) PDF:** nu exista endpoint dedicat de PDF in documentatie. Raspunsul de emitere si cel de citire contin `link` (URL `show_file`) si, la listare, `einvoice` (link spre arhiva e-Factura). Daca `link` ofera direct PDF-ul sau o pagina HTML: **NECONFIRMAT** (SDK-ul nu are metoda de PDF). Listarea arata `link` cu `&preload=1`.

Cancel/restore: documentatia le prezinta cu parametri; SDK-ul oficial trimite `cif`, `seriesName`, `number` ca **body JSON** pe PUT. Pentru DELETE SDK-ul trimite body JSON. Pentru GET parametrii merg in query string.

## 2.4 Emitere factura - `POST /docs/invoice`
Din documentatie (tabelele de parametri; `*` = obligatoriu):
- **Obligatorii:** `cif`, `client`, `seriesName`. In `client`: `name`*. In `products[]`: `name`* si `price`*.
- Optionale la nivel de factura: `issueDate` (`AAAA-LL-ZZ`, default azi), `dueDate`, `deliveryDate`, `collectDate`, `disableAutoSeries`, `number` (doar cu `disableAutoSeries=1`), `language` (RO), `precision` (2-4), `currency` (default RON), `exchangeRate`, `issuerName`, `issuerId`, `internalNote`, `mentions`, `deputyName`, `deputyIdentityCard`, `deputyAuto`, `selesAgent` (asa e scris in doc), `workStation` (default `Sediu`), `sendEmail` (0/1), `useStock`, `referenceDocument{type,seriesName,number,refund}`, `collect{...}`, `spvExtern`, `idempotencyKey`, campuri e-Factura `orderNumber` (BT-13), `contractNumber` (BT-12), `projectNumber`, `buyerIdentifier` (BT-46) etc.
- `client`: `cif`, `rc`, `code`, `address`, `state`, `city`, `country`, `iban`, `bank`, `email`, `phone`, `contact`, `vatPayer` (0/1), `save` (0/1, default 0), `autocomplete` (0/1; completeaza din registrul romanesc dupa `cif`).
- `products[]`: `name`*, `price`*, `code`, `description`, `measuringUnit` (default `buc`), `currency`, `vatName`, `vatPercentage`, `vatIncluded` (0/1, **default 1**, TVA inclus in pret), `quantity` (default 1), `management`, `productType` (ex. `Serviciu`, `Marfa`; relevant pentru stoc), `save` (default 1). Linie de discount: `name`*, `discount`*, `discountType` (`procentual`/`valoric`), `discountAllAbove`.
- Observatie: `vatName`/`vatPercentage` nu sunt marcate obligatorii; daca lipsesc, ce cota se aplica: **NECONFIRMAT** (probabil cota implicita din `vat_rates`).

Exemplu din documentatie (proforma; factura se emite identic cu `/docs/invoice`, plus campurile suplimentare de mai sus). Cota 19% din exemplu este veche, vezi 2.7:
```json
{
  "cif": "RO37311090",
  "client": { "cif": "RO37311090", "name": "OBLIO SOFTWARE SRL", "rc": "J13/887/2017", "code": "oblio",
              "address": "", "state": "Constanta", "city": "Constanta", "country": "", "iban": "", "bank": "",
              "email": "", "phone": "", "contact": "", "vatPayer": true },
  "issueDate": "2018-10-15", "dueDate": "2018-10-30", "seriesName": "PR",
  "language": "RO", "precision": 2, "currency": "RON",
  "products": [
    { "name": "Test", "code": "test", "description": "Descriere de test", "price": 200, "measuringUnit": "buc",
      "vatName": "Normala", "vatPercentage": 19, "vatIncluded": 0, "quantity": 2,
      "productType": "Serviciu", "management": "Magazin" },
    { "name": "Discount 10% Test", "discount": 10, "discountType": "procentual" }
  ],
  "workStation": "Sediu"
}
```

## 2.5 Raspuns si erori
Succes HTTP 200:
```json
{ "status": 200, "statusMessage": "Success",
  "data": { "seriesName": "FCT", "number": "0053", "link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261751&it=..." } }
```
- Eroare: documentatia spune doar "cod de status 400 sau 401 cu un mesaj de eroare". Structura exacta a corpului nu e exemplificata. SDK-ul oficial citeste `response.data.statusMessage` si, daca lipseste, foloseste `Error! HTTP response status: <status>`. Deci mesajul de eroare este in `statusMessage`.
- Citire factura: `data` contine `documentType`, `seriesName`, `number`, `link`, `collects[]` (`issueDate`, `type`, `number`, `value`).
- Anulare: `statusMessage: "Documentul a fost anulat."`; restaurare: `"Documentul a fost restaurat."`; stergere: `"Documentul a fost sters."`.

## 2.6 Stare incasare
- Optiunea 1: `GET /docs/invoice/list?cif=...&seriesName=...&number=...&collected=1` (sau `0`), cu `withCollects`. Filtrul `collected` ia -1/0/1.
- Optiunea 2: `GET /docs/invoice?...` si verifici `collects[]` (suma `value` fata de total). Un camp `paid` explicit in raspunsul de citire: **NECONFIRMAT**.
- Incasare programatica: `PUT /docs/invoice/collect`. Tipuri `collect.type`: `Chitanta`, `Bon fiscal`, `Bon fiscal card`, `Alta incasare numerar`, `Ordin de plata`, `Mandat postal`, `Card`, `CEC`, `Bilet ordin`, `Alta incasare banca`, `Ramburs`; `seriesName` obligatoriu pentru `Chitanta`, `documentNumber` pentru celelalte; `value` default = totalul facturii.
- Webhook `Collect/Inserted` poate notifica incasarile.

## 2.7 Rate limit
Din https://www.oblio.eu/api: **30 cereri / 100 secunde** pentru cererile care genereaza documente (facturi, proforme etc.); **30 cereri / 10 secunde** pentru orice alta cerere. Comportamentul la depasire (cod HTTP, blocare): **NECONFIRMAT**.

## 2.8 TVA
- Cotele vin din `GET /nomenclature/vat_rates` (`name`, `percent`, `default`).
- Documentatia afisata azi (2026-11-09) inca arata exemple cu `Normala` 19%, `Redusa` 9%, `SFDD` 0%. Nu spune nimic despre trecerea la 21%/11%. Deci pentru 2026 nu exista confirmare in documentatie; **citeste cotele din `vat_rates` si trimite `vatName`+`vatPercentage` exact cum le returneaza contul**.
- Client: `client.vatPayer` (0/1). Emitent neplatitor: **NECONFIRMAT** in documentatie.
- `vatIncluded` default **1**: pretul se considera cu TVA inclus daca nu setezi `0` (invers fata de SmartBill).

## 2.9 e-Factura
- Automat, conditionat: parametrul `spvExtern` pe `POST /docs/invoice`. Documentatia: daca ai bifat optiunea si ai activat din Setari > Preferinte "Trimite automat e-Factura in SPV", factura se trimite automat in SPV; altfel o trimiti manual.
- Manual: `POST /docs/einvoice` cu `cif`, `seriesName`, `number`. Raspuns `data{text, sent, code}`.
- Coduri stare: `-1` netrimisa; `2` are erori si nu a fost trimisa; `0` a ajuns in SPV si e in prelucrare; `1` trimisa cu succes. Stare la listare: `einvoiceStatus{text,sent,code}` cu `withEinvoiceStatus`.
- Valoarea acceptata pentru `spvExtern` (0/1 sau boolean): **NECONFIRMAT** (doc spune doar ca "automatically sends" cand este setat).

---

# 3. Comparatie rapida pentru implementare

| Aspect | SmartBill V1 | Oblio |
|---|---|---|
| Auth | Basic email:token, fara expirare | Bearer OAuth, token 3600 s, reinnoire la expirare |
| Emitere | `POST /invoice/v2` | `POST /docs/invoice` |
| Serii | `GET /series?cif=&type=f` | `GET /nomenclature/series?cif=` |
| Stare plata | `GET /invoice/paymentstatus` (`paid`, `unpaidAmount`) | `GET /docs/invoice` (`collects[]`) sau list cu `collected` |
| PDF | `GET /invoice/pdf` (binar; erori 502 HTML) | doar `link` din raspuns (NECONFIRMAT ca PDF) |
| Anulare | `PUT /invoice/cancel`, `DELETE /invoice` (ultima din serie), `POST /invoice/reverse` | `PUT /docs/invoice/cancel`, `DELETE /docs/invoice` (ultima din serie) |
| Eroare | `errorText` plin, sau body `errors[]` fara `errorText`; uneori 500/502 HTML | `statusMessage`, HTTP 400/401 |
| Rate limit | 30/10 s/token, blocare 10 min | 30/100 s documente; 30/10 s rest |
| Pret implicit | fara TVA | cu TVA inclus (`vatIncluded=1`) |
| e-Factura | NECONFIRMAT in API | `spvExtern`, `POST /docs/einvoice` |
| TVA 21/11 | exemple 21, 11, 0 (SDD/SFDD/Taxare inversa) | exemple vechi 19/9/0; citeste din `vat_rates` |

Recomandari de implementare:
- Fetch cu `Content-Type: application/json` si `Accept: application/json` (nu `application/pdf` la SmartBill).
- Citeste mereu `errorText` (SmartBill) / `statusMessage` (Oblio), nu doar statusul HTTP.
- La SmartBill sanitizeaza `errorText` (poate contine HTML).
- La Oblio foloseste `idempotencyKey` la emitere pentru a evita dubluri la retry.
- Sincronizeaza seriile, `taxName` si unitatile de masura din cont inainte de emitere.
