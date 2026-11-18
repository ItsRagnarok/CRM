# Facturare Super Admin / Oblio

Modulul `/admin/facturare` aparține platformei ElectroField și este separat de facturarea companiilor (`/facturare`). Accesul folosește `platform_admins`, verificat în pagini, Server Actions, rutele de descărcare și funcția SQL. Previzualizarea unei companii nu permite accesul.

## Configurare și utilizare

1. În Setări facturare → Datele firmei, salvează firma, CUI-ul, adresa și cota TVA (implicit 21%).
2. Introdu e-mailul contului Oblio și **Client Secret** din Oblio → Setări → Date cont. Parola contului nu este necesară. Conectarea verifică firma și preia seriile de facturi/proforme. Secretul este păstrat în Supabase Vault; nu este returnat în props sau rezultatul unui Server Action și nu este jurnalizat.
3. Adaugă un client. Căutarea doar cu CUI preia datele unui client existent în nomenclatorul Oblio. Dacă nu există acolo, salvează CUI-ul și completează numele/adresa înainte de emitere. Nu există o integrare ANAF separată pentru completarea automată a unei firme necunoscute.
4. Factură / Proformă → client → linii → dată/scadență → serie. Salvează ciorna sau emite prin Oblio. Emiterea poate solicita și trimiterea prin e-mail din Oblio, dacă acel client are e-mail.
5. Documentul emis are PDF, link Oblio, link WhatsApp și e-mail precompletat în aplicația de mail. API-ul Oblio confirmă emiterea, nu livrarea e-mailului; interfața face această distincție.
6. Încasările manuale actualizează soldurile ElectroField. Nu inițiază transferuri, nu emit chitanțe și nu sincronizează încasările Oblio.
7. Rapoarte → lună → arhivă cu PDF-uri și Excel pentru contabil. Include facturi și stornări emise, exclude ciorne/proforme. Limite: 1.000 documente și 40 MB PDF. Trimiterea lunară automată nu este implementată.

## Referință vizuală

Cele șapte ecrane din PDF au fost transpuse în aplicația web: tabloul de încasări și acțiuni rapide, formularul cu carduri și total, confirmarea emiterii cu distribuire, lista cu filtre, cardul CUI și lista clienților, graficul/raportul lunar, setările grupate. Culorile, fonturile și meniul Super Admin rămân cele ElectroField. Layoutul funcționează pe desktop și la lățimi înguste; nu există aplicație mobilă separată.

## Integritate fiscală

- Oblio atribuie seria/numărul final. Nu există contor local, nici rezervare de număr pentru ciorne.
- `billing_workflow('save_draft')` salvează documentul și liniile într-o tranzacție. PostgreSQL `numeric` calculează netul fiecărei linii, TVA și totalurile. Rotunjire la două zecimale, jumătățile depărtate de zero. Previzualizarea folosește BigInt, fără calcule monetare în float.
- Emiterea blochează rândul, copiază firma/clientul/conturile și salvează cererea completă înainte de apelul extern. Cererea are o cheie `idempotencyKey` stabilă la reîncercare. Dublul clic nu creează două cereri.
- Timeout/răspuns ambiguu: documentul rămâne în așteptare, nu poate fi editat. Reîncercarea folosește payload-ul și cheia anterioare. Refuzul explicit de validare permite revenirea la ciornă și o nouă încercare. Un mesaj de duplicare nu este tratat ca refuz sigur.
- Facturile emise nu se modifică și nu se șterg. Stornarea integrală copiază liniile cu cantități inverse și referă originalul în Oblio cu `refund: 0`; încasările existente nu se șterg. O singură stornare integrală per original.
- PDF-ul ElectroField este o copie construită din datele fiscale salvate; modelul original al furnizorului se vede prin linkul Oblio. Fonturile Noto Sans sunt incluse explicit în bundle-ul rutelor PDF/export.
- Exportul păstrează zecimalele fără conversie în float; valorile care depășesc precizia de 15 cifre a Excel rămân text.
- Stările e-Factura sunt pregătite în `billing_invoice_delivery.e_invoice_status`. Punctul de extensie este adaptorul `src/lib/billing/oblio.ts`; modulul nu apelează `/docs/einvoice`.

## Verificare

```sh
node --test scripts/billing-schema.test.mjs
node --test scripts/billing-workflow.test.cjs
npx eslint src/lib/billing src/app/admin/facturare src/app/api/admin/billing
npm run build
```

Testul SQL folosește exclusiv un container PostgreSQL 17 local (`electrofield-billing-db`) și creează/șterge o bază temporară. Verifică RLS, blocarea tenantului/previzualizării, aritmetica exactă, înghețarea documentelor, plăți idempotente, payload identic la retry, corectarea refuzului și stornarea. Testele adaptorului nu apelează Oblio real; verifică autentificarea form-urlencoded, precizia JSON, HTTP 200 cu status de eroare, linkuri permise și PDF multipagină cu diacritice.

Verificare browser efectuată pe un mediu local izolat: Next.js + PostgREST + PostgreSQL real, identitate de test și răspunsuri Oblio simulate. Flux: setări/conectare → serii → ciornă → emitere → PDF → încasare → rapoarte/ZIP → client CUI. Verificare la 1440 și 390 px. Nu au fost emise facturi fiscale reale în scop de test. O verificare cu contul real necesită introducerea cheii de către administrator și emiterea unui document real ales de acesta.

Documentație Oblio verificată: https://www.oblio.eu/api (18 noiembrie 2026).
