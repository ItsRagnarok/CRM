# ElectroField — Scanare documente cu AI: cercetare și design

Data: 7 noiembrie 2026. Doar cercetare și design; nu am modificat niciun fișier din /home/user/CRM.

Legendă pentru încredere: **[V]** = verificat în documentația oficială, citită azi; **[T]** = sursă terță sau contradictorie, de reverificat; **[E]** = estimare proprie, de măsurat în benchmark.

---

## 0. Rezumat executiv

1. **Recomandare principală:** Claude vision, cu un model ieftin și unul puternic în cascadă. Haiku 5.5 face prima trecere, iar Sonnet 5.5 reia doar documentele nesigure. Folosim structured outputs (JSON schema) și o schemă pe tip de document. Clasificarea tipului se face într-un apel separat, foarte ieftin. Rezultatul trece prin validatori deterministi (checksum CUI, aritmetica totalurilor, verificare ANAF) și apoi prin ecranul de confirmare, unde omul decide.
2. **Fallback:** Gemini 3.5 Flash-Lite sau 3.1 Flash-Lite pe Vertex AI, endpoint EU multi-region. Este alt furnizor, cu rezidență UE documentată, și costă cam la fel. Se activează automat la erori 5xx/429 sau la cerere pentru companiile care cer procesare strict în UE.
3. **Motivul pentru care nu recomand OCR-uri specializate ca bază:**
   - AWS Textract nu extrage structurat în română: AnalyzeExpense și Forms sunt limitate la limbi pe care română nu le include, iar scrisul de mână e doar în engleză [V].
   - Google Expense Parser nu suportă româna [V].
   - Tesseract și PaddleOCR nu dau câmpuri structurate și nu pot rula comod pe Vercel.
   - Document AI Invoice Parser și Azure prebuilt-invoice suportă româna și sunt de 5-15 ori mai scumpe pe pagină. Rămân plan C, doar pentru facturi, dacă benchmarkul arată că LLM-urile nu ating pragul de acuratețe.
4. **Cost estimat:** în jur de 0,7 USD per 1.000 de bonuri cu Haiku 5.5 și în jur de 3 USD per 1.000 de scanări în regim cascadă [E, din prețuri V]. La 599 lei/lună abonament, 500 de scanări costă aproximativ 7-8 lei. Costul AI nu este problema; abuzul și acuratețea sunt.
5. **Lacună de cercetare, spusă direct:** nu am găsit niciun benchmark public pe bonuri sau facturi românești (diacritice, CUI, TVA). Toate cifrele de acuratețe publicate sunt pe engleză sau indoneziană (SROIE, CORD). **Înainte de a angaja codul, rulăm 1-2 zile un benchmark pe 150-300 de documente reale** (secțiunea 9). Costă câțiva dolari și elimină cel mai mare risc.
6. **Descoperire în repo, care contează chiar fără AI:** Vercel limitează corpul cererilor către funcții la aproximativ 4,5 MB, indiferent de `serverActions.bodySizeLimit: "30mb"` din `next.config.ts` [E, din cunoștințe despre platformă; de verificat pe deploy]. Poze de telefon de 3-8 MB trimise prin server actions (`uploadJobPhoto`, `addExpense`) pot pica în producție. Designul de mai jos trimite fișierele direct în Supabase Storage prin URL-uri semnate de upload, ceea ce rezolvă și problema asta.

---

## 1. Ce există acum în repo

### 1.1 AI existent
- **Doar Groq.** Fișierul `src/app/(app)/lucrari/nou/ai-actions.ts` are două funcții:
  - `transcribeAudio`, care folosește Whisper `whisper-large-v3-turbo` cu limba pinned pe `ro`;
  - `generateJobSuggestion`, care folosește modele Llama/gpt-oss prin `chat/completions` cu `response_format: json_object` și retry pe 429/503/404.
- Cheia este `GROQ_API_KEY`. Comentariile spun că Gemini a fost abandonat din cauza 503 pe tier-ul gratuit și că AI Gateway de la Vercel a fost evitat din cauza creditelor plătite.
- **Nu există nicio utilizare de vision/OCR.** În `package.json` nu e niciun SDK AI (Anthropic, Google, OpenAI); apelurile sunt `fetch` direct.
- **Nu există nicio cuotă AI aplicată.** Coloana `subscriptions.ai_credits` (în `database.types.ts`) nu e citită nicăieri în cod. Putem refolosi aceeași coloană pentru contorizare.
- `docs/abonamente-si-valoare.md` spune explicit că promisiunile AI din planuri nu trebuie vândute ca disponibile până nu există un flux complet. Scanarea ar fi primul flux AI real.

### 1.2 Upload, stocare, tabele
- **Storage:** un singur bucket privat `attachments`. Căile au forma `${organization.id}/jobs/${jobId}/receipts/${Date.now()}-${safeName}`. Accesul se face prin URL-uri semnate de 1 oră (`src/lib/storage.ts`, `signedAttachmentUrls`). RLS pe `storage.objects` este pe folderul organizației, conform comentariului din cod. Migrările pentru bucketul `attachments` nu sunt în `supabase/migrations` (acolo sunt doar 5 fișiere, iar singurul bucket creat e `platform-mail-uploads`), deci schema de bază nu este complet versionată în repo.
- **Cheltuieli:** `addExpense` (`src/app/(app)/lucrari/[id]/actions.ts`) primește `File` prin FormData, îl urcă în `attachments` și inserează în `expenses`.
  - Coloane: `amount`, `category`, `vendor`, `currency`, `expense_date`, `status`, `receipt_path`, `notes`, `job_id` **NOT NULL**, `submitted_by`.
  - Categoriile din UI mobil sunt `materiale`, `combustibil`, `parcare`, `unelte`.
  - Statusul și aprobarea există deja (`status`, `approved_by`, `rejection_reason`) și sunt un punct natural de human-in-the-loop.
- **`expense_receipts`** (`expense_id`, `storage_path`, **`ocr_data jsonb`**) există în tipuri și **nu e folosit în cod**. Este un cârlig lăsat pentru exact acest feature.
- **Documente:** `documents` are `client_id`, `job_id`, `profile_id`, `doc_type`, `name`, `storage_path`. Se urcă din `clienti/actions.ts`, din `setari/utilizatori/[id]/actions.ts` și din pagina lucrării. Pagina mobilă `mobil/documente` doar le listează.
- **Materiale:** `materials` (`name`, `unit`, `unit_cost`, `category`, `kind`, `image_path`), `material_stock`, `material_usage`, `purchase_requests`. Nu există coloane pentru producător, model, SKU, EAN sau serie, și nu există un registru de echipamente per client.
- **Facturi:** tabela `invoices` este pentru facturi emise către clienți, nu pentru facturi de furnizor.
- **Planuri:** enum-ul `subscription_plan` are valorile `starter | team | pro | enterprise`. Documentul comercial propune doar 2 planuri (Standard 299 lei, Pro 599 lei) și o singură configurație de limite, aplicată în server, nu doar în UI.

### 1.3 Aplicația mobilă
- `android-app/capacitor.config.ts`: Capacitor 8 este un shell WebView care încarcă `https://electrofield-alporaro.vercel.app/mobil`.
- Pluginuri instalate: geolocation, background-geolocation, push-notifications, app, splash-screen. **Nu există plugin de cameră sau scanner.**
- `AndroidManifest.xml` declară doar `INTERNET`. Un `<input type="file" capture>` în WebView-ul Android cere de regulă și `CAMERA` în manifest ca să deschidă camera [E; de testat pe dispozitiv]. Orice schimbare nativă înseamnă un APK nou (fluxul de release Android există deja: `src/lib/android-release.ts`, `scripts/check-android-version.mjs`).
- Capturile de azi sunt `<input type="file" accept="image/*,application/pdf" capture="environment">`, în `cheltuiala/missing-items-flow.tsx` și în `foto/photo-capture.tsx`. Nu există decupare, corecție de perspectivă, multi-pagină sau coadă offline.
- `next.config.ts`: `serverActions.bodySizeLimit: "30mb"` și `outputFileTracingIncludes` pentru fonturile NotoSans din ruta de rapoarte. Fonturile Noto Sans (cu diacritice românești) și `pdfkit` sunt deja în proiect și funcționează în producție, deci sunt baza pentru generarea PDF-urilor.
- `AGENTS.md` cere citirea documentației Next din `node_modules/next/dist/docs/`. Pentru Next 15.5.26 directorul `docs` nu există local, deci cine implementează trebuie să verifice manual comportamentul `after()`, `maxDuration` și route handlers pe versiunea instalată. Eu nu le-am verificat.

---

## 2. Comparația furnizorilor

### 2.1 Tabel sintetic

| Opțiune | Română (diacritice, CUI, TVA) | Cost / pagină | Rezidență UE / retenție | Potrivire |
|---|---|---|---|---|
| **Claude Haiku 5.5** | Multilingv, fără benchmark public pe RO [E] | ~0,0006-0,0009 USD [E din prețuri V] | Fără regiune UE pe API-ul propriu; vezi 2.2 | **Principal, prima trecere** |
| **Claude Sonnet 5.5** | Idem, mai robust pe scris de mână și layout dificil [E] | ~0,012 USD [E] | Idem | **Principal, escaladare** |
| **Gemini 3.5 / 3.1 Flash-Lite** (Vertex EU) | Multilingv, suportă bounding boxes [E] | ~0,0017-0,0024 USD [E din prețuri V] | EU multi-region `eu` pe Vertex [V] | **Fallback** |
| Gemini 2.5 Flash-Lite | Idem, cel mai ieftin | ~0,0005 USD [E] | `eu` listat [V] | Opțiune de cost minim |
| Google Document AI, **Invoice Parser** | `ro` suportat, regiune `eu` [V] | ~10 USD / 1.000 documente de până la 10 pagini [T, contradictoriu] | EU [V] | Plan C pentru facturi |
| Google Document AI, **Expense Parser** | **Română nesuportată** [V]; disponibilitate în UE neclară [V] | ~10-30 USD / 1.000 [T] | neclar | Exclus |
| Google Document AI, Enterprise OCR | `ro`, inclusiv scris de mână [V] | n/a | EU | Doar OCR cu coordonate (ajutor la evidențiere) |
| **Azure Document Intelligence** | Invoice: `ro`, RON [V]. Receipt (termice): `ro` [V] | ~10 USD / 1.000 pagini prebuilt [T, de verificat în calculator, regiunea West Europe] | Regiuni UE disponibile | Plan C |
| **AWS Textract** | OCR text: `ro` [V]. **Forms: doar EN/ES/IT/PT/FR/DE; AnalyzeExpense: doar engleză; scris de mână: doar engleză** [V] | AnalyzeExpense 0,01 USD/pagină (US West), Forms 0,05 [V] | Preț EU nelistat pe pagină [V] | Exclus pentru RO |
| **Mistral OCR** | Text/markdown din document; extragere cu LLM separat | 4 USD / 1.000 pagini (batch 2) [T, surse contradictorii: 1, 2 sau 4 USD în funcție de dată] | Furnizor UE; rezidența pentru OCR nu o am confirmată oficial [T] | Alternativă UE de cercetat |
| **PaddleOCR / Tesseract** | Tesseract are pachet `ro`, dar slab pe bonuri termice; fără câmpuri structurate | Gratis, plus infrastructură | Controlezi tu datele | Doar pentru OCR local/offline sau coordonate |

### 2.2 Claude (Anthropic) — detalii [V, documentația oficială]
- **Modele curente și prețuri** (USD per milion de tokeni, input / output): Haiku 5.5 = 0,10 / 0,50 (peste 100.000 de tokeni de prompt: 0,50 / 2,50); Sonnet 5.5 = 2 / 10; Opus 5.5 = 4 / 20; Fable și Mythos = 10 / 50. Haiku 4.5 = 1 / 5, adică de 10 ori mai scump decât Haiku 5.5.
- **Batch API** dă 50% reducere. Util pentru importuri în masă din admin, nu pentru telefon.
- **Imagini:** JPEG, PNG, GIF, WebP. Maximum 8000x8000 px și 10 MB per imagine în base64. Costul este `⌈w/28⌉ × ⌈h/28⌉` tokeni. Modelele 4.7 și mai noi au nivel „high-resolution": maximum 2.576 px pe latura lungă și 4.784 tokeni per imagine. O imagine de 1000x1000 costă 1.296 tokeni. O poză de 3.888 tokeni (2000x1500) ar costa de ~3 ori mai mult decât una redimensionată; de aceea redimensionăm pe client.
- **PDF:** maximum 600 de pagini (100 dacă fereastra de context e sub 1M) și 128 MB. Fiecare pagină se convertește în imagine, plus textul extras. Aproximativ 1.500-3.000 de tokeni de text per pagină, plus costul imaginii. PDF-urile cu parolă nu sunt acceptate.
- **Structured outputs:** `output_config.format = {type: "json_schema", schema}`. Modelele Haiku 5.5 și Sonnet 5.5 sunt suportate. Limitări relevante pentru designul nostru:
  - `additionalProperties: false` este obligatoriu;
  - lipsesc `minimum/maximum`, `minLength/maxLength` și `minItems` altceva decât 0 sau 1 (validăm după, cu zod);
  - **limite de complexitate: maximum 24 de parametri opționali și 16 parametri cu tipuri union pe cerere.** Un câmp nullable este union. De aceea nu putem avea o singură schemă gigant pentru toate tipurile; folosim câte o schemă pe tip și câmpuri obligatorii cu valoare-santinelă, în loc de nullable peste tot;
  - `stop_reason` `refusal` sau `max_tokens` poate produce JSON incomplet; tratăm explicit;
  - prima cerere cu o schemă nouă are latență de compilare, apoi gramatica se cachează 24 de ore.
- **Limite ale vederii:** documentația spune că modelul „poate halucina sau greși pe imagini de calitate slabă, rotite sau foarte mici (sub 200 px)". Coordonatele de localizare sunt **aproximative**, deci nu ne bazăm pe ele pentru evidențierea câmpurilor. Modelul nu poate detecta imagini false sau generate de AI.
- **Rate limits:** nivelul Start are 4.000 RPM, 2 milioane ITPM și 400.000 OTPM pe Haiku 5.5 și pe Sonnet 5.5. Cu ~3.000 de tokeni pe scanare asta înseamnă teoretic sute de scanări pe minut, mult peste nevoia noastră. Plafonul lunar de cheltuială pe nivelul Start este 500 USD, iar când e atins apar 429 **fără** `retry-after` (nu are sens retry; trebuie alertă). Putem seta și o limită proprie mai mică în Console.
- **Date și GDPR:**
  - Conținutul cererilor (prompturi, răspunsuri) nu este reținut implicit. Excepția sunt „Covered Models" (Fable 5.x, Mythos 5.x), care cer retenție de 30 de zile. **Haiku 5.5 și Sonnet 5.5 nu sunt Covered Models**, deci nu intră în excepție.
  - Zero data retention (ZDR) este disponibil prin aranjament contractual; Messages API cu `inference_geo` este eligibil. Fișierele din Files API se rețin până la ștergere, deci nu le folosim.
  - Datele reținute nu se folosesc la antrenare fără permisiune explicită; imaginile încărcate nu se folosesc la antrenare.
  - Dacă o sesiune este marcată de sistemele de siguranță, Anthropic poate reține intrările și ieșirile până la 2 ani, chiar și cu ZDR.
  - **Rezidență:** `inference_geo` acceptă doar `"us"` (cu multiplicator de preț 1,1x) și `"global"`. **Workspace geo: doar `us`. Nu există regiune UE pe API-ul propriu.** Pentru procesare strict UE rămân: Claude pe Amazon Bedrock (regiunea se alege prin endpoint/inference profile; trebuie verificat profilul EU pentru modelul ales) sau pe Vertex/Google Cloud, plus acordul DPA și SCC-urile pentru transferul în SUA. Cine decide aici este un avocat; eu pot doar spune că API-ul direct nu oferă garanție UE.

### 2.3 Gemini — detalii [V]
- Prețuri paid (per milion de tokeni, input / output): `gemini-3.5-flash-lite` 0,30 / 2,50; `gemini-3.1-flash-lite` 0,25 / 1,50; `gemini-2.5-flash-lite` 0,10 / 0,40; `gemini-3.8-flash` 0,75 / 3,75 (urcă la 1,50 / 7,50 de la 1 ianuarie 2027); `gemini-4-argon` 2 / 10 (urcă la 4 / 20 de la 1 decembrie 2026). Batch = 50%.
- Pagina de prețuri nu detaliază separat PDF. `gemini-2.5-flash` și `gemini-2.5-pro` sunt marcate depreciate, cu rutare automată pe alte modele la 1 decembrie 2026. Deci nu construim pe numele vechi.
- **Date:** pe tier-ul gratuit conținutul poate fi folosit pentru îmbunătățirea produselor Google; pe cel plătit nu. Nu folosim niciodată tier-ul gratuit pentru documente de clienți.
- **Rezidență:** pe Vertex AI endpoint-ul multi-region `eu` păstrează procesarea ML în statele membre UE (Marea Britanie și Elveția excluse). Modelele 3.5 Flash-Lite, 3.1 Flash-Lite, 2.5 Flash-Lite și altele sunt listate pe `eu`. Endpoint-ul global nu oferă garanții de rezidență.
- Gemini produce nativ bounding boxes pentru obiecte și text (coordonate normalizate) [E, cunoștințe despre API; de testat]. Este avantajul față de Claude pentru evidențierea câmpurilor în Faza 4.
- Notă: autentificarea Vertex din Vercel cere un service account (JSON în variabilă de mediu) sau Workload Identity Federation cu OIDC Vercel. E mai multă configurare decât o cheie API.

### 2.4 Servicii specializate
- **Document AI Invoice Parser:** limbile includ româna, regiunea `eu` este listată, 15 pagini online și 200 batch [V]. Prețul de pe pagina oficială nu s-a putut încărca; sursele terțe indică aproximativ 0,10 USD per bloc de 10 pagini [T].
- **Document AI Expense Parser:** limbile listate nu includ româna [V]. Exclus.
- **Azure:** modelul invoice listează `ro` și moneda RON; modelul receipt pentru bonuri termice listează `ro` [V]. Prețul exact pe pagină nu s-a putut confirma (pagina oficială afișa „$-"); folosește calculatorul Azure cu regiunea West Europe [T].
- **Textract:** în regiunea US West, AnalyzeExpense costă 0,01 USD/pagină, Forms 0,05, Tables 0,015, detectare text 0,0015 [V]. Dar pentru română doar OCR-ul simplu și Tables/Layout sunt suportate; extragerea de formulare e limitată la 6 limbi fără română, iar AnalyzeExpense la engleză [V].
- **Open-source:** un singur benchmark găsit (vendor, non-peer-reviewed) pe 361 de bonuri SROIE (engleză): PaddleOCR bate Tesseract pe toate axele (CER 0,2045 vs 0,3347). Nu spune nimic despre română. Un articol despre cărți de identitate românești folosește PaddleOCR pentru viteză și Tesseract pentru rafinarea diacriticelor, ceea ce sugerează că diacriticele rămân o problemă la ambele [T].
- Ambele sunt grele de rulat pe Vercel (Python/onnx, limite de dimensiune a funcției). Rămân utile local, în browser (Tesseract.js, WASM, cu `ro.traineddata`) pentru un text de rezervă offline, nu ca sursă de adevăr.

### 2.5 Latență, limite, scrisul de mână
- Latență [E, de măsurat]: clasificare 1-2 s; extracție Haiku pe un bon 2-6 s; Sonnet 5-15 s; Document AI sincron 1-3 s. Proiectăm asincron, deci latența nu blochează UI-ul.
- Scrisul de mână românesc (formulare, procese-verbale) este cel mai slab caz la toate opțiunile; Textract nu îl suportă deloc pe română. Tratăm toate transcrierile manuscrise ca „needs_review" mereu.

### 2.6 Decizia, cu regula de schimbare
- **Dacă cerința de rezidență UE este obligatorie contractual** pentru primii clienți: inversăm rolurile. Gemini pe Vertex EU devine principal și Claude (prin Bedrock EU, dacă se confirmă) fallback. Codul rămâne același datorită interfeței `DocumentExtractor` (secțiunea 6.4).
- **Dacă nu:** Claude direct pe API-ul Anthropic (livrare rapidă, structured outputs strict, ZDR disponibil), cu DPA și minimizarea datelor, plus Gemini Vertex EU ca fallback.
- Decizia finală după benchmark: câștigă modelul cu cea mai bună acuratețe pe câmpurile bănești și CUI, nu cel care sună mai bine.

---

## 3. UX de captură

### 3.1 Ce se poate face în web/PWA și ce este doar nativ

| Capabilitate | WebView/PWA (fără APK nou) | Nativ (plugin Capacitor, APK nou) |
|---|---|---|
| Camera | `<input capture>` (o poză, fără viewfinder propriu) sau `getUserMedia` (viewfinder propriu, necesită HTTPS, funcționează în WebView dacă permisiunea CAMERA e declarată) | ML Kit Document Scanner |
| Detecție margini + corecție de perspectivă | jscanify sau OpenCV.js (WASM, ~8-10 MB, încărcat leneș) sau colțuri trase manual cu homografie pe canvas | ML Kit Document Scanner: detecție automată, decupare, filtre, multi-pagină, PDF generat de ML Kit |
| Auto-captură la stabilitate | Posibil cu OpenCV, scump pe telefoane slabe | Inclus în ML Kit |
| Compresie | `browser-image-compression` (redimensionare, JPEG, EXIF orientation) | Nu e necesar |
| PDF pe client | `pdf-lib` sau `jsPDF` | PDF din ML Kit |
| Coadă offline | IndexedDB (`idb`) + evenimentele `online`/`visibilitychange` | Plus `@capacitor/network` pentru stare rețea |
| Background Sync API | Nesigur în WebView și absent pe iOS | Fișiere în stocare nativă |
| Cod de bare / QR pe etichete | `BarcodeDetector` (inegal în WebView) sau bibliotecă JS (zxing) | `@capacitor-mlkit/barcode-scanning` |
| OCR pe dispozitiv | Tesseract.js (lent, calitate slabă pe termice) | ML Kit Text Recognition prin plugin comunitar [T, nevăzut] |

- **ML Kit Document Scanner** are mai multe wrappere Capacitor; două au fost citite din rezultate: `@capacitor-mlkit/document-scanner` (Capawesome, neoficial) și `@capgo/capacitor-document-scanner`. Observații din documentațiile lor [T]: funcționează doar pe dispozitive fizice (nu emulator), cere minimum 1,7 GB RAM, descarcă modelul prin Google Play Services la prima folosire, iar PDF-ul e generat de ML Kit. O variantă Capawesome mai nouă este plătită (Insiders) și cere Capacitor 8+, ceea ce corespunde cu `@capacitor/core ^8.5.2` din repo. **De confirmat versiunea și licența înainte de alegere.**
- **iOS:** repo-ul are doar Android. VisionKit ar acoperi iOS, dar nu e în scop acum.

### 3.2 Recomandare de captură, pe faze
- **Faza 1 (fără APK nou):** `<input capture>` + compresie pe client (latura lungă ~2.000 px, JPEG calitate 0,8, EXIF corectat) + ecran de decupare cu 4 colțuri trase manual și rotire 90 de grade. Modelul tolerează perspectivă ușoară; decuparea strânsă are cel mai mare efect pe tokeni și pe acuratețe.
- **Faza 2:** APK nou cu `CAMERA` în manifest și ML Kit Document Scanner pentru mobil (multi-pagină, auto-decupare, corecție de perspectivă, PDF). Pe web (admin) rămâne upload cu previzualizare și decupare manuală. jscanify ca alternativă pentru PWA, doar dacă vrem aceeași experiență fără APK; costul este greutatea OpenCV.js.
- **Reguli de compresie:** documentația Claude avertizează că JPEG puternic comprimat și mai multe treceri de compresie strică citirea textului. O singură re-codare, calitate ≥0,8, fără redimensionare sub ~1.400 px pe latura lungă pentru bonuri lungi. Păstrăm și originalul în Storage.
- **Multi-pagină:** un „scan" are 1-8 pagini. Utilizatorul poate adăuga pagini, șterge, reordona, roti. Pentru PDF-uri încărcate din admin, nu le rasterizăm pe client; le trimitem ca PDF (Claude le acceptă direct), dar generăm și miniaturi pentru revizuire.
- **Coadă offline:** înregistrare locală în IndexedDB (blob + metadate + `idempotency_key` UUID generat pe client). Stări: `queued → uploading → uploaded → processing → needs_review → confirmed`. La reconectare sau la redeschiderea aplicației golim coada. Urcarea merge direct în Storage cu URL semnat (și TUS resumabil pentru fișiere mari, suportat de Supabase). Limităm coada (de exemplu 30 de scanări sau 100 MB) și afișăm clar „în așteptare, fără net". Fotografia rămâne pe telefon până la confirmarea serverului.

---

## 4. Pipeline

```
Telefon / Admin
  1. POST /api/scans            -> creează rândul document_scans (status=queued), verifică plan/cotă,
                                   întoarce URL-uri semnate de upload (createSignedUploadUrl)
  2. upload direct în Storage   -> attachments/{org}/scans/{scanId}/p1-orig.jpg ...
  3. POST /api/scans/{id}/process (idempotent)
        a. claim atomic: update ... set status='processing' where id=? and status in ('queued','failed_retryable')
        b. validare fișier: magic bytes, dimensiuni, pagini PDF <= 8, hash SHA-256 (dedupe)
        c. clasificare (Haiku, imagine mică, schemă mică)  -> doc_type + confidence
        d. extracție (Haiku, schema tipului)               -> JSON strict
        e. validatori RO + ANAF                             -> issues[], confidence per câmp
        f. escaladare Sonnet dacă confidence global < prag sau validatori eșuează
        g. status='needs_review' ; salvează tokeni, cost, latență, model, versiunea promptului
  4. Review UI (telefon sau admin)  -> corectează, confirmă sau respinge
  5. confirm (server action)        -> creează expense / material / document / echipament, face legătura cu lucrarea,
                                       generează PDF + text, status='confirmed'
```

### 4.1 Unde rulează
- Rute Next.js (route handlers) cu `export const runtime = "nodejs"` și `export const maxDuration = 60-120` (repo-ul folosește deja `maxDuration = 60` pe rutele de mail). Procesarea dintr-o cerere durează de obicei sub 15 s.
- Dacă utilizatorul închide aplicația, procesarea trebuie să continue. Opțiuni: `after()` din `next/server` pentru lucrul rămas după răspuns (de verificat comportamentul pe 15.5.26) plus un cron Vercel la 5 minute care reia rândurile `processing` blocate de peste 5 minute sau `failed_retryable`. Evităm o infrastructură de cozi nouă în Faza 1.
- **Accesul la date:** clientul Supabase al utilizatorului (cu RLS) în rutele declanșate de utilizator. Service role doar în cron, cu verificarea `organization_id` din rând și fără a primi calea de la client.

### 4.2 Scheme per tip (câmpuri esențiale)
Fiecare schemă are `document_type`, `language`, `page_quality` (bună/slabă/ilizibilă), `missing_fields[]` și `evidence` (textul citit literal pentru câmpurile critice). Toate câmpurile sunt obligatorii, cu `""` sau `0` ca santinelă și listate în `missing_fields`, ca să rămânem sub limita de 16 uniuni. Normalizăm apoi.

- **bon_fiscal:** `vendor_name`, `cui` (CIF), `address`, `receipt_number`, `date`, `time`, `currency` (RON implicit), `lines[{name, qty, unit, unit_price, vat_letter, total}]`, `vat_breakdown[{letter, rate, base, vat}]`, `total`, `payment_method`, `is_fiscal` (apare „BON FISCAL" vs. nefiscal), `category_suggestion` (din cele 4 categorii existente: materiale, combustibil, parcare, unelte), la combustibil `liters` și `price_per_liter`, `vehicle_plate` dacă apare.
- **factura_furnizor:** `supplier{name, cui, reg_com, address, iban}`, `buyer{name, cui}`, `series`, `number`, `issue_date`, `due_date`, `currency`, `exchange_rate`, `lines[...]`, `net`, `vat`, `gross`, `payment_terms`, `delivery_note_ref`, `is_credit_note` (storno).
- **eticheta_produs:** `manufacturer`, `product_name`, `model`, `part_number`, `serial_numbers[]`, `ean`, `rating{voltage, current, power, ip}`, `manufacture_date`, `ce_mark`, `ambiguous_chars` (listează caracterele nesigure: O/0, I/1, S/5, B/8). Pentru serii și cod de bare preferăm decodarea deterministă a codului de bare și tratăm seria citită de LLM ca „de verificat".
- **aviz_insotire:** `number`, `series`, `date`, `sender`, `recipient`, `vehicle_plate`, `lines[...]`.
- **taxa_amenda:** `issuer`, `kind`, `number`, `date`, `amount`, `due_date`, `iban`, `payment_reference`, `plate_or_person` (date personale, cu avertizare).
- **placuta_echipament:** `manufacturer`, `model`, `serial`, `year`, `power`, `voltage`, `current`, `frequency`, `ip_class`, `refrigerant` și `capacity` pentru HVAC.
- **formular_manuscris / proces_verbal / protocol:** `title`, `date`, `parties`, `signatures_present`, `measurements[...]`, `full_text` cu `[?]` pe fragmentele incerte. Mereu `needs_review`.
- **other:** doar transcrierea.

### 4.3 Validatori deterministi (cei care prind halucinațiile)
- **CUI:** control prin cheia 753217532 (cifrele fără ultima, aliniate la dreapta cu cheia, suma × 10 mod 11, 10 devine 0, comparat cu ultima cifră). De acoperit cu teste unitare pe CUI-uri reale. Prefixul „RO" se separă.
- **ANAF:** interogarea gratuită a serviciului public de TVA (`webservicesp.anaf.ro`, versiune v9) confirmă denumirea și statutul de plătitor TVA pentru un CUI. Limitele raportate de bibliotecile comunitare: 100 de CUI per cerere și 1 cerere pe secundă [T; de confirmat în documentul oficial ANAF]. Cache într-un tabel `anaf_cache` cu TTL de zile.
- **Aritmetică:** suma liniilor ≈ total (toleranță la rotunjire), baza + TVA = total pe fiecare cotă, TVA calculat vs. cota declarată. Cotele curente în România trebuie confirmate cu contabilul (în 2025 au crescut; documentele mai vechi au 19/9/5%), deci nu le fixăm în cod, ci într-un tabel de configurare cu perioade de valabilitate. Documentul comercial spune același lucru despre TVA.
- **Dată:** format `zz.ll.aaaa`, nu în viitor, nu mai veche de un prag configurabil.
- **Zecimale:** România scrie `1.234,56`; promptul cere explicit, iar codul normalizează `,`/`.`.
- **Unicode:** normalizăm la NFC și convertim cedila veche (ş, ţ: U+015F, U+0163) în virgulă dedesubt (ș, ț: U+0219, U+021B). Pentru căutare păstrăm o coloană fără diacritice.
- **Dedupe:** (CUI, număr, dată, total) și hash de imagine. Un bon fotografiat de două ori nu trebuie să dea două cheltuieli.

### 4.4 Încredere (confidence) — cum o construim cinstit
Modelele nu dau probabilități calibrate. Combinăm:
1. încrederea declarată de model pe câmp (slabă, doar semnal);
2. rezultatul validatorilor (cel mai puternic semnal);
3. calitatea paginii (`page_quality`);
4. acordul între două modele pe câmpurile bănești, doar la documente de valoare mare sau când ceva e suspect (Haiku vs. Gemini, ieftin);
5. `stop_reason` și completitudinea JSON-ului.
Rezultatul este o culoare per câmp: verde (validator trecut + încredere ridicată), galben (nesigur), roșu (validator eșuat sau lipsă). Pragurile se calibrează pe setul de aur, nu din intuiție.

### 4.5 Salvare în entități
- **bon_fiscal → `expenses`** (+ `expense_receipts.ocr_data` cu JSON-ul brut + `scan_id`). `expenses.job_id` este NOT NULL. Pentru scanări din admin fără lucrare (de exemplu factura unui furnizor) există două variante: a) `job_id` nullable cu regulă clară în rapoarte; b) tabel separat `supplier_invoices`. Recomand b) pentru facturi și păstrarea lui `expenses` pentru costuri pe lucrare. Decizie de produs.
- **eticheta_produs → `materials`:** căutare după EAN, SKU sau nume; propunere „creează material nou" sau „adaugă intrare de stoc". Necesită coloane noi: `manufacturer`, `model`, `sku`, `ean`. Seriile merg într-un tabel de unități (secțiunea 6.2).
- **placuta_echipament → tabel nou `client_equipment`** (client, locație, tip, producător, model, serie, putere, tensiune, an, `scan_id`). Valoare mare pentru service și garanții.
- **proces_verbal, aviz, formular, taxă/amendă → `documents`** (`doc_type`, `job_id`/`client_id`, `scan_id`, text căutabil). Taxele și amenzile pot genera și o înregistrare în `expenses`.
- **factura_furnizor → `supplier_invoices`** cu legătură la lucrare sau la cererea de achiziție (`purchase_requests`) acolo unde se poate.

### 4.6 PDF curat și text căutabil
- **PDF 1 — scanare curată (dovadă):** paginile corectate (decupare, perspectivă, alb-negru/contrast opțional) într-un PDF multi-pagină cu strat de text invizibil, ca să poată fi căutat. Generăm cu `pdfkit` pe server (deja în proiect, cu NotoSans pentru diacritice), pe același model ca ruta `api/rapoarte-lucrare/[id]`. Fără coordonate de cuvinte, stratul de text este aproximativ: căutabil cu Ctrl+F, dar selecția nu se potrivește vizual. Cu coordonate (din OCR sau din Gemini) devine corect, în Faza 4. Alternativ, ML Kit produce deja un PDF pe Android.
- **PDF 2 — fișă digitalizată (opțional):** un document curat, regenerat din datele confirmate (antet, câmpuri, tabel de linii), cu legătura la imaginea originală. Cu un mic avertisment „Generat din scanare, confirmat de [utilizator] la [dată]".
- **Aspect juridic:** o copie scanată nu înlocuiește automat originalul; contabilul trebuie întrebat ce regim de arhivare aplică firma. Facturile B2B între firme românești circulă în sistemul e-Factura (obligatoriu din 2024 [E]), deci pe termen lung este mai exact și mai ieftin să importăm XML-ul din SPV decât să scanăm facturi (Faza 4+).
- **Text căutabil:** coloană `text_content` în `document_scans` și `documents`, plus `tsvector` generat. Postgres are configurația `romanian` (snowball); folosim extensia `unaccent` ca „ana" și „ană" să se găsească reciproc, plus index GIN. Textul vine din `full_text`/linii/câmpuri, nu dintr-un apel separat.

---

## 5. Clasificarea automată a tipului de document

1. **Indiciu din context (gratis):** ecranul „Cheltuială" așteaptă bon sau factură; „Material" așteaptă etichetă; din admin, utilizatorul poate alege tipul.
2. **Apel de clasificare (Haiku, ~1 s, ~0,0001 USD):** imagine redusă la ~800 px, schemă mică: `document_type` (enum închis cu `other` și `unreadable`), `confidence`, `page_count_hint`, `contains_personal_id` (bool). Nu amestecăm clasificarea cu extracția, din cauza limitelor de uniuni din schemă și pentru că o eroare de clasă strică schema folosită la extracție.
3. **Decizie:** dacă indiciul și clasificatorul sunt de acord, mergem mai departe. Dacă nu, mesaj „Pare o factură, nu un bon. Continui ca factură?". Utilizatorul poate schimba tipul și rulăm extracția cu altă schemă.
4. **PDF-uri cu mai multe documente:** clasificare pe pagină (batch ieftin), apoi gruparea paginilor consecutive de același tip. Nu promitem separare perfectă în Faza 1.
5. **Blocare:** dacă `contains_personal_id` (act de identitate, CNP) este adevărat, nu procesăm documentul și îl ștergem pe cel încărcat, cu mesaj clar. Reduce expunerea GDPR; tehnicienii nu au motiv să fotografieze acte de identitate pe acest flux.
6. **Aliniere cu realitatea:** setul de tipuri se completează în benchmark; clasele rare (aviz, taxă, protocol) pot fi „other + transcriere" până apar suficiente exemple.

---

## 6. Piesele de server și bază de date (exact)

### 6.1 Migrare SQL nouă (ex. `supabase/migrations/2026MMDDHHMMSS_document_scans.sql`)

`document_scans`:
- `id uuid pk`, `organization_id uuid not null`, `created_by uuid`, `job_id uuid null`, `client_id uuid null`, `source text` (web/mobile)
- `status text` check in (`queued, uploaded, processing, needs_review, confirmed, rejected, failed, failed_retryable`)
- `doc_type text`, `doc_type_confidence numeric`, `doc_type_user_hint text`, `doc_type_confirmed text`
- `page_count int`, `pdf_path text`, `text_content text`, `fts tsvector` (generat)
- `extraction jsonb` (brut), `fields jsonb` (normalizat), `field_confidence jsonb`, `validation jsonb` (probleme)
- `model text`, `prompt_version text`, `schema_version text`, `tokens_in int`, `tokens_out int`, `cost_micros bigint`, `latency_ms int`, `attempts int`, `error_code text`
- `file_hash text`, `idempotency_key uuid unique`, `confirmed_by uuid`, `confirmed_at timestamptz`, `linked_type text`, `linked_id uuid`, `created_at`, `updated_at`

`document_scan_pages`: `scan_id`, `page_no`, `orig_path`, `clean_path`, `width`, `height`, `rotation`, `ocr_words jsonb null`.

`scan_corrections`: `scan_id`, `field`, `ai_value`, `final_value`, `created_by`, `created_at`. Alimentează setul de aur și îmbunătățirea prompturilor (cu informarea clienților).

`ai_usage_events`: `organization_id`, `user_id`, `feature`, `model`, `units`, `cost_micros`, `created_at`. Plus RPC atomică `ef_consume_ai_credit(org, n)` care face `update subscriptions set ai_credits = ai_credits - n where organization_id = $1 and ai_credits >= n returning ai_credits` și reîncarcă la `current_period_start` (sau o regulă lunară explicită; coloana există deja, dar semantica ei trebuie definită).

`anaf_cache` (`cui`, `payload jsonb`, `fetched_at`).

Extinderi pe tabele existente: `expenses` (`scan_id`, `invoice_number`, `supplier_cui`, `net_amount`, `vat_amount`), `documents` (`scan_id`, `text_content`, `fts`), `materials` (`manufacturer`, `model`, `sku`, `ean`), tabele noi `material_units` (serii) și `client_equipment`, și `supplier_invoices` dacă se alege varianta b).

RLS: toate pe `organization_id`, în același stil ca restul. Căile în Storage rămân sub `attachments/{org}/scans/{scanId}/...` ca politicile existente pe folderul organizației să se aplice neschimbate. Script de verificare în `db/` după modelul `db/check-mail-uploads.sql`.

### 6.2 Cod server nou
- `src/lib/ai/extractor.ts`: interfața `DocumentExtractor { classify(pages), extract(type, pages) }`, cu implementări `providers/anthropic.ts` și `providers/gemini-vertex.ts`.
- `src/lib/ai/schemas.ts`: schemele zod pe tip (convertite în JSON schema), `src/lib/ai/prompts.ts` (versionate), `src/lib/ai/validators-ro.ts` (CUI, TVA, totaluri, dată, Unicode), `src/lib/ai/anaf.ts`, `src/lib/ai/quota.ts`, `src/lib/ai/pdf.ts` (pdfkit; fonturile mutate într-un director comun sau adăugate în `outputFileTracingIncludes` pentru noile rute, ca acum la rapoarte).
- Rute: `POST /api/scans` (inițializare + cotă + URL-uri de upload), `POST /api/scans/[id]/process`, `GET /api/scans/[id]` (polling sau Supabase Realtime pe rând), `GET /api/scans/[id]/pdf`, `GET /api/cron/scans-retry`.
- Server action `confirmScan` (validează cu zod câmpurile editate, creează entitatea țintă și legătura, generează PDF-ul, scrie corecțiile).
- Variabile de mediu: `ANTHROPIC_API_KEY`, creds Vertex (`GOOGLE_CLOUD_PROJECT`, service account sau WIF), `SCAN_PRIMARY_MODEL`, `SCAN_ESCALATION_MODEL`, `SCAN_FALLBACK_MODEL`.
- Dependențe: `@anthropic-ai/sdk`, `zod`, `browser-image-compression`, `idb`; opțional `jscanify` (încărcat leneș). În `android-app`: plugin ML Kit Document Scanner, `@capacitor/network`, permisiunea `CAMERA` în manifest.

### 6.3 UI nou
- **Mobil:** `src/app/mobil/scan/` (captură multi-pagină, decupare, coadă, listă de scanări în așteptare) și ecranul de confirmare. În `missing-items-flow.tsx` înlocuim input-ul de fișier cu un buton „Scanează bon" care prefill-ează formularul de cheltuială.
- **Admin:** `src/app/(app)/scanari/` (listă cu filtre pe status și tip, coadă „de revizuit", căutare full-text) și buton „Scanează cu AI" lângă formularele existente de cheltuieli și documente din `lucrari/[id]/page.tsx`.
- **Ecranul de confirmare:** imaginea (cu zoom) lângă formular; chip-uri verde/galben/roșu per câmp; banner cu problemele validatorilor („Suma liniilor 124,50 ≠ total 142,50"); butoane „Confirmă", „Respinge", „Schimbă tipul", „Refă poza". Evidențierea pe imagine este în Faza 4, nu în MVP: în MVP afișăm câmpul alături de valoarea citită literal (`evidence`), ceea ce permite verificarea rapidă fără coordonate.

### 6.4 Rezistența la furnizor
Interfața `DocumentExtractor` permite schimbarea furnizorului pe baza unei variabile de configurare, pe organizație dacă e nevoie (companii cu cerință de rezidență UE). Fallback automat la 5xx, timeout sau 429 cu `retry-after`; **fără** retry la 429 de plafon de cheltuială (fără `retry-after`): marcăm `failed` cu alertă pentru admin-ul platformei.

---

## 7. Model de cost

### 7.1 Ipoteze [E]
- O pagină = ~2.200 de tokeni de imagine (decupată, latura lungă ≤2.000 px, nivel high-resolution) + ~900 de tokeni de prompt și schemă. Intrare ≈ 3.100, ieșire ≈ 600 pentru un bon cu linii.
- Clasificare: ~850 de tokeni de intrare, ~30 de ieșire.
- Factură PDF de 3 pagini: ~14.400 de tokeni de intrare, ~1.500 de ieșire.
- Cursul de ~4,5-5 lei/USD este o presupunere.

### 7.2 Rezultat per 1.000 de scanări (USD)

| Scenariu | Calcul scurt | Cost |
|---|---|---|
| Haiku 5.5, bon de 1 pagină, cu clasificare | 3.100×0,10 + 600×0,50 per M = 0,00061; + 0,0001 clasificare | **~0,71** |
| Sonnet 5.5 pe tot | 3.100×2 + 600×10 per M = 0,0122; + 0,0001 | **~12,3** |
| **Cascadă: Haiku pe toate, Sonnet pe 20%** | 0,71 + 0,2×12,2 | **~3,2** (la 10% escaladări: ~1,9) |
| Haiku, factură PDF de 3 pagini | 14.400×0,10 + 1.500×0,50 per M | ~2,2 per 1.000 de facturi |
| Sonnet, factură PDF de 3 pagini | 14.400×2 + 1.500×10 per M | ~44 per 1.000 de facturi |
| Gemini 3.5 Flash-Lite, bon | 3.000×0,30 + 600×2,50 per M | ~2,4 |
| Gemini 3.1 Flash-Lite, bon | 3.000×0,25 + 600×1,50 per M | ~1,7 |
| Gemini 2.5 Flash-Lite, bon | 3.000×0,10 + 600×0,40 per M | ~0,5 |
| Textract AnalyzeExpense (US) | 0,01/pagină | 10 (dar fără română structurată) |
| Document AI Invoice / Azure prebuilt | ~10 / 1.000 [T] | ~10 |
| Mistral OCR | 4 / 1.000 pagini [T] | ~4, plus un LLM pentru câmpuri |

Alte efecte: `inference_geo: "us"` adaugă 1,1x. Batch API reduce 50% (importuri în masă din admin). Gemini poate număra tokenii de imagine diferit de Claude; cifrele Gemini sunt de același ordin, nu exacte. Prețul real pe Vertex poate diferi ușor de lista AI Studio.

Costuri nelegate de AI [E]: o scanare ocupă aproximativ 0,5-1 MB în Storage (originale, curățate, PDF), deci ~1 GB per 1.000 de scanări; timpul de funcție Vercel este neglijabil.

### 7.3 Ce înseamnă pe plan
La ~3 USD / 1.000 de scanări, o scanare costă ~0,015 lei. 500 de scanări pe lună costă ~7-8 lei la un abonament de 599 lei (~1,3%), iar 100 de scanări ~1,5 lei la 299 lei. Costul nu justifică limite strânse; limitele servesc să oprească abuzul și bucle de erori.

### 7.4 Limite propuse pe plan (de aliniat cu documentul comercial)
Configurate o singură dată (tabel de limite în cod sau în DB, conform `docs/abonamente-si-valoare.md`) și aplicate în server, nu doar în UI.

| Limită | Standard (299 lei) | Pro (599 lei) |
|---|---|---|
| Scanări incluse / lună / companie | 100 | 600 |
| Pachet suplimentar | 500 scanări la un preț care acoperă costul + marjă (cost ~7-8 lei) | idem |
| Plafon zilnic per utilizator | 40 | 100 |
| Ritm per utilizator | 6 cereri / minut | 12 / minut |
| Procesări simultane per companie | 3 | 6 |
| Pagini per scanare | 8 | 15 |
| Dimensiune per pagină / fișier PDF | 10 MB / 20 MB | 10 MB / 30 MB |
| Retenție originale | decizie după discuția cu contabilul (documentele justificative de obicei se păstrează ani de zile) | idem |

Protecții suplimentare:
- plafon de cheltuială setat în Anthropic Console, mult sub plafonul de nivel (500 USD pe Start), plus alertă la 50% și 80%;
- întrerupător global (feature flag) și pe companie;
- dedupe prin hash: o scanare identică returnează rezultatul existent fără consum de credit;
- consum de credit **la confirmarea reușită a procesării**, nu la upload; eșecurile nu consumă credit;
- validare MIME prin magic bytes, respingere PDF cu parolă, limită de pixeli;
- fără Files API (retenție până la ștergere); imaginile se trimit în cerere și nu se păstrează la furnizor în afara politicii de retenție.

---

## 8. Moduri de eșec și om în buclă

### 8.1 Tabel

| Eșec | Cauză | Măsură |
|---|---|---|
| Poză neclară, reflexii, bon termic șters | Condiții de teren | `page_quality` + mesaj „Refă poza"; ghid vizual în aplicație; flash opțional |
| Document tăiat sau mai multe bonuri în cadru | Capturare | Decupare asistată; avertizare când `missing_fields` conține total sau dată |
| **Cifre halucinate plauzibil** (total, CUI, serie) | Model | Validatori deterministi, acord între modele pe sume, confirmare manuală obligatorie pe sume |
| Confuzie diacritice, cedilă vs. virgulă | Unicode | Normalizare NFC + conversie |
| `1.234,56` citit ca 1,23456 | Format RO | Prompt explicit + normalizare + verificare aritmetică |
| TOTAL vs. TOTAL TVA, rest, reduceri, linii storno | Layout | Validatori de sumă; revizuire |
| Scris de mână și proces-verbal | Cel mai slab caz | Mereu `needs_review`; transcriere cu `[?]` |
| Document în altă limbă sau fără sens | Utilizare | `other` + transcriere |
| Truncarea JSON (`max_tokens`) sau `refusal` | API | Retry cu `max_tokens` mai mare; apoi revizuire umană |
| Furnizor indisponibil, 429, 5xx | Rețea / capacitate | Retry cu backoff, fallback Gemini, coadă; spend cap fără retry |
| Dublare | Același bon fotografiat de două ori sau rambursat de două ori | Dedupe (CUI, număr, dată, total) + hash |
| Fraudă (imagini editate sau generate) | Rău intenționat | Claude nu o poate detecta (documentație); aprobarea existentă a cheltuielilor, comparația cu contextul lucrării și audit rămân controlul |
| **Injecție de prompt în document** (text care cere „ignoră instrucțiunile") | Document ostil | Output strict pe schemă; textul extras = date, niciodată instrucțiuni; nicio acțiune automată; ieșire escapată în PDF/HTML |
| Acte de identitate fotografiate | Utilizare greșită | Clasificator `contains_personal_id` + blocare + ștergere |
| Fișiere orfane în Storage după un eșec | Flux întrerupt | Job de curățare pentru scanări nefinalizate peste N zile |
| Coadă offline pierdută (dezinstalare, golire date) | Dispozitiv | Avertisment în UI; scanarea rămâne în coadă până la confirmarea serverului |
| Bucla de erori consumă bani | Bug | Plafoane per utilizator/minut, per companie, per furnizor |

### 8.2 Om în buclă
- **Regula de bază în v1:** nicio înregistrare financiară nu se creează automat. Utilizatorul confirmă mereu sumele. Tehnicianul confirmă citirea; administratorul păstrează aprobarea existentă a cheltuielii (`status`, `approved_by`). Doi oameni, un control suplimentar acolo unde contează.
- **Coadă „de revizuit" în admin** pentru elementele roșii sau galbene.
- **Corecțiile sunt date:** fiecare diferență AI → final merge în `scan_corrections`. Din ele se calculează rata de corecție pe câmp, pe furnizor și pe model, iar după câteva luni se pot propune scurtături sigure (de exemplu, categorie reținută per furnizor, auto-confirmare doar pentru furnizori cu istoric curat și sume mici, tot cu opțiune de dezactivare).
- **Metrici:** acuratețea pe câmp pe setul de aur, rata de escaladare, rata de „refă poza", timp până la confirmare, cost mediu pe scanare.

---

## 9. Benchmark înainte de a angaja codul (1-2 zile)

1. **Set de aur:** 150-300 de documente românești reale, cu acordul clienților pilot: bonuri termice (magazine de bricolaj și materiale electrice, benzinării, parcări), facturi de furnizor în PDF și pe hârtie, etichete și plăcuțe, avize, 20-30 de formulare manuscrise. Etichetate manual (câmpurile din 4.2). Date personale anonimizate sau acces restrâns.
2. **Candidați:** Haiku 5.5, Sonnet 5.5, Gemini 3.5 Flash-Lite și 3.1 Flash-Lite (Vertex EU), Azure prebuilt invoice/receipt și Document AI Invoice Parser (doar pe facturi), Mistral OCR + LLM.
3. **Metrici:** potrivire exactă pe total, dată, CUI, număr document; F1 pe linii; rata de cifre greșite cu aparență de încredere (cea mai periculoasă); CER pe diacritice; latență p50/p95; cost real.
4. **Praguri de pornire (de ajustat):** total exact ≥98% pe bonuri curate, CUI ≥97%, dată ≥98%, linii F1 ≥90%. Sub aceste praguri, câmpul rămâne mereu galben/roșu în UI.
5. Costul rulării este de ordinul câtorva dolari pe modelele LLM; scriptul de evaluare rămâne în repo (`scripts/eval-scans.mjs`) și se reia la fiecare schimbare de model sau prompt.

---

## 10. Plan pe faze (estimări de efort, de rafinat după benchmark)

**Faza 0 — Fundații (3-4 zile)**
- Set de aur + harness de benchmark (secțiunea 9).
- Cont Anthropic: DPA, plafon de cheltuială, cheie separată pe mediu; (opțional) proiect Vertex cu endpoint `eu`.
- Migrarea SQL (6.1), bucketul rămâne `attachments`, script de verificare RLS.
- **Upload direct în Storage prin URL semnat** (rezolvă și limita de ~4,5 MB), cu compresie pe client.
- Decizie de produs: `job_id` nullable sau `supplier_invoices`; semantica `ai_credits`.

**Faza 1 — MVP bonuri și facturi, web și mobil (1,5-2 săptămâni)**
- `DocumentExtractor` + Claude, schemele `bon_fiscal` și `factura_furnizor`, clasificare, validatori RO, ANAF.
- Cote și limite, `after()` + cron de reluare.
- Ecran de confirmare (fără evidențiere pe imagine), creare `expenses` + `expense_receipts.ocr_data`, PDF din imagini cu `pdfkit`, text căutabil.
- Captură prin `<input capture>` + decupare manuală + rotire. Fără APK nou (dar de testat dacă `CAMERA` lipsește din manifest; dacă da, un APK minor).

**Faza 2 — Captură mobilă de calitate (1-2 săptămâni)**
- APK nou: `CAMERA`, ML Kit Document Scanner, multi-pagină, `@capacitor/network`.
- Coadă offline în IndexedDB, upload resumabil, stări vizibile.
- Fallback Gemini Vertex EU activat; teste de comutare.

**Faza 3 — Etichete, plăcuțe, avize, protocoale (1-2 săptămâni)**
- Schemele restante; legătura cu `materials`, `material_units`, `client_equipment`; scanare cod de bare/QR.
- `documents` cu text căutabil; căutare full-text cu `unaccent`.
- Coadă „de revizuit" în admin; `scan_corrections` și rapoarte de acuratețe.

**Faza 4 — Rafinare (în funcție de date)**
- Evidențiere pe imagine (coordonate din Gemini sau potrivire cu OCR cu coordonate, de exemplu Document AI Enterprise OCR sau Azure Read, folosit doar pentru poziții).
- PDF cu strat de text aliniat.
- Import e-Factura din SPV (facturi exacte, fără OCR).
- Batch API pentru importuri în masă; scurtături bazate pe istoric; plan C (Azure/Document AI invoice) dacă benchmarkul o cere.

---

## 11. Riscuri deschise și lucruri nevalidate

- **Fără benchmark românesc public** (secțiunea 0, punctul 5). Cifrele de cost sunt solide, cele de acuratețe nu.
- **Limita Vercel de ~4,5 MB** pe corpul cererii și efectul ei asupra `uploadJobPhoto` și `addExpense` sunt din cunoștințe despre platformă; de reprodus cu o poză de 6 MB pe deploy.
- **Rezidența UE pentru Claude:** API-ul propriu oferă doar `us`/`global`. Opțiunea Bedrock EU și termenii DPA/SCC trebuie confirmați cu furnizorul și cu un specialist GDPR.
- **Prețurile Document AI, Azure și Mistral** provin din surse terțe sau contradictorii și trebuie confirmate pe paginile oficiale înainte de orice decizie bazată pe ele.
- **Pluginurile Capacitor** pentru ML Kit: de confirmat versiunea, licența și compatibilitatea cu Capacitor 8 pe un telefon real (nu emulator).
- **`after()` și `maxDuration` pe Next 15.5.26:** documentația locală lipsește; de verificat comportamentul înainte de implementare.
- **Cotele de TVA și regulile de arhivare:** de confirmat cu contabilul; nu le fixăm în cod.
- **Prețurile se schimbă:** pagina Gemini anunță creșteri de la 1 decembrie 2026 și 1 ianuarie 2027 pentru unele modele. Costul se recalculează la fiecare schimbare de model; interfața `DocumentExtractor` face schimbarea ieftină.

---

## Surse

- Anthropic, prețuri modele: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic, vision: https://platform.claude.com/docs/en/build-with-claude/vision
- Anthropic, suport PDF: https://platform.claude.com/docs/en/build-with-claude/pdf-support
- Anthropic, structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Anthropic, rezidență date: https://platform.claude.com/docs/en/manage-claude/data-residency
- Anthropic, retenție date: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- Anthropic, rate limits: https://platform.claude.com/docs/en/api/rate-limits
- Gemini, prețuri: https://aistudio.google.com/docs/pricing
- Vertex AI, rezidență date: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/data-residency
- Document AI, procesoare: https://docs.cloud.google.com/document-ai/docs/processors-list
- Document AI, prețuri (conținut pagină nepreluat; cifre din surse terțe): https://cloud.google.com/document-ai/pricing
- Azure Document Intelligence, limbi suportate: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/language-support/prebuilt
- Azure Document Intelligence, prețuri (nepreluate): https://azure.microsoft.com/en-gb/pricing/details/ai-document-intelligence/
- AWS Textract, prețuri: https://aws.amazon.com/textract/pricing/
- AWS Textract, limite și limbi: https://docs.aws.amazon.com/textract/latest/dg/limits-document.html
- Capawesome, plugin ML Kit Document Scanner: https://capawesome.io/plugins/mlkit/document-scanner/
- Tutorial Capawesome: https://dev.to/capawesome/scan-documents-in-capacitor-with-ml-kit-and-visionkit-39e
- Benchmark OCR pe bonuri (vendor, engleză): https://imagetotable.ai/references/tesseract-vs-paddleocr-receipt-benchmark
- Mistral OCR, prețuri contradictorii: https://www.eweek.com/de/news/mistral-ai-new-ocr-api/ și https://www.edenai.co/expert-models/mistral-ocr-latest
- ANAF, serviciu TVA (biblioteci comunitare): https://anafpy.readthedocs.io/en/latest/api/public/
- Repo: `src/app/(app)/lucrari/nou/ai-actions.ts`, `src/lib/storage.ts`, `src/app/(app)/lucrari/[id]/actions.ts`, `src/app/mobil/lucrari/[id]/cheltuiala/missing-items-flow.tsx`, `src/app/mobil/lucrari/[id]/foto/photo-capture.tsx`, `src/lib/supabase/database.types.ts`, `android-app/capacitor.config.ts`, `android-app/android/app/src/main/AndroidManifest.xml`, `next.config.ts`, `docs/abonamente-si-valoare.md`
