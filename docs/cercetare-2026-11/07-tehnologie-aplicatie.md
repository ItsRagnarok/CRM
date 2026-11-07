# Tehnologia aplicației pentru tehnicieni ElectroField — cercetare și recomandare

Data: 2026-11-07. Doar cercetare, niciun fișier din /home/user/CRM nu a fost modificat.
Notă metodologică: afirmațiile marcate **[verificat]** vin din documentația oficială citită azi; cele marcate **[din memorie]** sau **[de verificat]** nu au putut fi confirmate din surse primare în această sesiune (inclusiv prețurile) și trebuie validate înainte de decizii cu bani.

---

## 0. Rezumat executiv (decizia)

**Recomandare: opțiunea 7 (hibrid), în forma „PWA + Web Push acum → Capacitor iOS/Android în magazine apoi, același cod Next.js”. Nu rescrieți în React Native / Flutter / nativ.**

Motive, pe scurt:
1. Aveți deja un backend Next.js + Supabase cu ~33 de server actions în `src/app/mobil` și 56 de fișiere de UI. O rescriere nativă/RN/Flutter înseamnă să reconstruiți tot UI-ul și să mutați acțiunile pe un API — luni de muncă pentru o singură persoană, fără câștig imediat pentru utilizator.
2. Cea mai mare durere de azi (iPhone fără push) se rezolvă în **zile**, nu luni, prin Web Push (VAPID + service worker) pentru PWA instalat pe Home Screen — și aduce în plus notificări pe desktop pentru administratori.
3. GPS în fundal pe iOS și distribuția în App Store cer un binar nativ: Capacitor (pe care îl folosiți deja pe Android) îl oferă cu pluginul `@capacitor-community/background-geolocation`, care suportă iOS.
4. Riscul principal al căii Capacitor este regula Apple 4.2 (site reambalat). Se gestionează cu funcții native reale (push, GPS fundal, scanner, biometrie, coadă offline) și cu un cont demo pentru reviewer — nu cu schimbarea stack-ului.
5. Offline: nu faceți „bundling” al aplicației Next.js (server actions + cookies nu merg în export static). Construiți un **outbox offline** (IndexedDB + retry) pentru fotografii/semnătură/checklist în aplicația existentă.

---

## 1. Ce am găsit în repo (starea actuală)

| Aspect | Constatare (fișier) |
|---|---|
| Stack | Next 15.5.26, React 19, Supabase SSR (`@supabase/ssr`), Tailwind 4, pdfkit pe server (`package.json`) |
| Shell Android | `android-app/capacitor.config.ts`: `server.url = https://electrofield-alporaro.vercel.app/mobil`, `webDir: "www"` (doar un `index.html`), `CapacitorHttp.enabled`, `useLegacyBridge: true` |
| Distribuție | APK în `public/downloads/electrofield.apk`, versiune în `src/lib/android-release.ts` (0.2) |
| Push Android | FCM HTTP v1 scris de mână în `src/lib/push.ts` (JWT semnat cu `node:crypto`); tokenuri în `device_push_tokens`; `registerPushToken` în `src/app/mobil/push-actions.ts` are `platform: "android"` hardcodat; punct unic de trimitere: `sendPushToProfiles`, apelat din `src/lib/notify.ts` |
| GPS | `src/app/mobil/location-tracker.tsx`: ramură nativă (plugin background-geolocation) + fallback `watchPosition` (se oprește când pagina e ascunsă); consimțământ GDPR separat (`profile.location_consent_at`, `organization.gps_continuous_tracking_enabled`, retenție configurabilă) |
| Cameră | `<input type="file" accept="image/*" capture="environment">` în 4 locuri (`foto/photo-capture.tsx`, `extra`, `cheltuiala`, `achizitie`) — adică fără scanner de documente real, fără scanare coduri |
| Semnătură | `semnatura/signature-pad.tsx` (189 linii, canvas) — 100% reutilizabil într-un WebView |
| PDF | pdfkit **pe server** (`src/app/api/rapoarte-lucrare/[id]`) — reutilizabil de orice client |
| Offline | **Zero**: nu există service worker, IndexedDB, manifest funcțional cu SW; `localStorage` doar pentru tokenul push |
| Manifest | `public/manifest.json` există (`start_url: /mobil`, `display: standalone`), legat din `src/app/layout.tsx` |
| Auth | Cookie-uri Supabase SSR citite în `src/middleware.ts` și `src/lib/auth.ts` (`cookies()`); upload-uri prin server actions (limită 30 MB în `next.config.ts`) |

### Două constatări importante pentru PWA/Web Push
1. **`src/middleware.ts` nu exclude `/sw.js` și `/manifest.json`** din matcher și nici din `PUBLIC_PATHS`. Un request fără cookie spre ele este redirecționat la `/login`. Manifestul este cerut implicit **fără credențiale** de browsere, deci instalabilitatea PWA poate fi deja stricată pe producție **[de verificat în DevTools → Application → Manifest]**. Service worker-ul trebuie să fie și el servit direct (200, `application/javascript`). Fix: adăugați ambele în excepții.
2. Directorul `node_modules/next/dist/docs/` menționat în `AGENTS.md` **nu există** în versiunea instalată (15.5.26); am folosit documentația online Next.js. Ghidul oficial PWA (actualizat 2026-07-30) conține exact fluxul VAPID descris la secțiunea 5.

---

## 2. Constrângeri de platformă verificate (fapte care decid)

### Apple / iOS
- **Web Push pe iOS/iPadOS 16.4+ funcționează doar pentru web apps adăugate pe Home Screen**; manifestul trebuie să aibă `display: standalone` sau `fullscreen`; permisiunea se cere doar ca reacție la un gest al utilizatorului (buton); folosește APNs din spate, nu cere cont Apple Developer; Badging API suportat. **[verificat]** — [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- **Declarative Web Push** (iOS/iPadOS 18.4+): notificarea se afișează din payload, fără service worker; payload JSON cu cheia `"web_push"`, `"notification"` cu `title` și `navigate` obligatorii; evită penalizările pentru push „silent” și revocarea abonamentului când SW-ul eșuează. Compatibil înapoi cu codul clasic. **[verificat]** — [WebKit: Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/)
- **Evacuarea datelor (7 zile):** limita de 7 zile de „utilizare Safari fără interacțiune” șterge IndexedDB, LocalStorage, SessionStorage, înregistrări și cache-uri de Service Worker pentru site-uri din Safari. **Web apps de pe Home Screen nu fac parte din Safari, au contor propriu** și Apple spune că nu se așteaptă la ștergerea datelor lor („serious bug” dacă se întâmplă). Surse terțe sunt contradictorii; un tehnician care lucrează zilnic nu e afectat, dar un PWA folosit sporadic în tab Safari **da**. **[verificat]** — [WebKit: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- **iOS 26:** orice site adăugat pe Home Screen se deschide implicit ca web app (utilizatorul poate dezactiva „Open as Web App”); push funcționează doar în contextul de web app. **[parțial verificat — surse din faza beta, de confirmat pe un iPhone cu iOS 26]** — [heise](https://heise.de/-10749652)
- **Fără GPS în fundal pentru PWA** pe iOS (nu există API web pentru asta; `watchPosition` se suspendă când ecranul se blochează). Fără Background Sync API în Safari: MDN îl marchează „Limited availability” (Chromium) — [MDN Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API). Web NFC: „Limited availability” (în practică doar Chrome Android) **[din memorie]** — [MDN Web NFC](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API).
- **App Store Review Guideline 4.2 (text oficial):** „Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store.” 4.2.2: nu „web clippings”. **[verificat]** — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Locație (Apple):** 5.1.5 — folosiți Location Services doar dacă sunt direct relevante, cu notificare și consimțământ; 2.5.4 permite explicit „location” ca serviciu de fundal legitim; 5.1.2 — aplicația nu poate *impune* activarea push/locație pentru a folosi funcționalitatea (deci GPS-ul continuu trebuie să fie opțional din perspectiva Apple, chiar dacă angajatorul îl cere — de pregătit explicația pentru reviewer). **[verificat]** — același link.

### Google Play
- **Locație în fundal:** doar dacă e esențială funcției principale și aduce beneficiu semnificativ utilizatorului; formular în Play Console (Sensitive app permissions → Location), **o singură funcție declarată**, video de max. 30 s cu declanșarea din fundal, dialog „prominent disclosure” înainte de permisiunea runtime (trebuie să conțină „location” și o formulare de tip „when the app is closed / not in use”), politică de confidențialitate pe URL activ. Foreground service-urile de locație sunt tratate ca locație în fundal dacă sunt echivalente. **[verificat]** — [Play Console Help: background location](https://support.google.com/googleplay/android-developer/answer/9799150)
- **Conturi personale noi** (create după 13 nov. 2023) trebuie să ruleze un closed test cu testeri opt-in continuu ≥14 zile înainte de producție; regulile pentru conturi de organizație nu apar în pagina citită. **[parțial verificat]** — [Play Console Help: testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
- Taxe: Apple Developer Program ≈ 99 USD/an și Google Play 25 USD o singură dată **[din memorie — de verificat]**; pagina Apple citită confirmă doar că programul e necesar pentru App Store Connect/TestFlight — [Apple: compare memberships](https://developer.apple.com/support/compare-memberships/).

### Capacitor / Next.js
- Documentația Capacitor marchează `server.url` ca „**not intended for use in production**” (destinat live-reload). **[verificat]** — [Capacitor config](https://capacitorjs.com/docs/config). Funcționează în practică (îl folosiți deja), dar e o cale „off-label”, relevantă pentru riscul de magazin.
- **Next.js static export nu suportă: Server Actions, cookies, middleware/proxy, redirects/rewrites/headers, rute dinamice fără `generateStaticParams`.** Ghidul PWA al Next spune explicit: pentru export static „you will need to move from Server Actions to calling an external API”. **[verificat]** — [Next.js: Static Exports](https://nextjs.org/docs/app/guides/static-exports), [Next.js: PWAs](https://nextjs.org/docs/app/guides/progressive-web-apps)
- `@capacitor-community/background-geolocation` suportă **iOS și Android**; are chei Info.plist (`NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes: location`); v1.2.27 adaugă suport Capacitor 8 (deci compatibil cu versiunea voastră). **[verificat]** — [repo plugin](https://github.com/capacitor-community/background-geolocation)
- Scanner: `@capacitor-mlkit/barcode-scanning` și `@capacitor-mlkit/document-scanner` (Capawesome, wrapper neoficial peste ML Kit, Android + iOS; seria 8.x pentru Capacitor 8; pluginul de barcode nu suportă Swift Package Manager). **[parțial verificat]** — [Capawesome ML Kit](https://capawesome.io/plugins/mlkit)
- Update OTA pentru Capacitor: Appflow e considerat legacy/în închidere (surse de la vendori concurenți, fără dată oficială); alternative: Capgo, Capawesome Cloud. OTA înlocuiește doar stratul web. **[parțial verificat, surse părtinitoare]** — [Capawesome: OTA tools](https://capawesome.io/blog/best-ota-update-tools-for-capacitor/). *Notă: în varianta voastră remote-URL, update-ul web este deja instantaneu (se schimbă site-ul), deci nu aveți nevoie de un serviciu OTA.*

### React Native / Expo
- `expo-location`: background location cu `TaskManager` + `startLocationUpdatesAsync`; iOS cere „Always”; Android 14+ cere `FOREGROUND_SERVICE_LOCATION`; necesită development build (nu Expo Go); oprit dacă utilizatorul închide aplicația (Android nu repornește automat). **[verificat]** — [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- `expo-notifications`: push cu Expo Push Service sau direct FCM/APNs; necesită development build; cheile APNs trebuie configurate. **[verificat]** — [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- Prețuri EAS (surse secundare, inconsistente între ele): Free 0 USD (≈1.000 MAU pentru EAS Update, număr limitat de build-uri), Starter 19 USD/lună, Production 199 USD/lună. **[de verificat pe expo.dev/pricing]** — [Expo billing plans](https://docs.expo.dev/billing/plans/), [rezumat terț](https://vibecoding.app/blog/expo-eas-review)
- Aceleași reguli de locație Apple/Google se aplică oricărei tehnologii.

---

## 3. Evaluarea opțiunilor (scor 1–5, 5 = cel mai bine; „efort” și „risc” sunt inversate: 5 = efort mic / risc mic)

| Criteriu | 1. Capacitor remote-URL (azi) | 2. Capacitor cu assets locale + API | 3. PWA instalabil | 4. React Native / Expo | 5. Flutter | 6. Nativ Kotlin/Swift | 7. Hibrid: PWA acum + Capacitor în magazine |
|---|---|---|---|---|---|---|---|
| Push iOS cu app închisă | 5 (după ce există app iOS) | 5 | 4 (doar PWA instalat, user gesture) | 5 | 5 | 5 | **5** (4 imediat prin PWA, 5 după Capacitor iOS) |
| GPS în fundal | 4 (Android ok; iOS cu plugin) | 4 | **1** | 5 | 5 | 5 | **4** |
| Offline | **1** | 3–4 (dar cu rescriere) | 2–3 (SW + IndexedDB, evacuare Safari, fără Background Sync) | 4–5 (SQLite/WatermelonDB) | 4–5 | 5 | 3 (outbox în WebView/PWA) |
| Cameră / scanner | 3 (input capture) → 4 cu plugin ML Kit | 4 | 2–3 (fără scanner doc; barcode via librării WASM) | 5 (Vision Camera) | 4–5 | 5 | 4 |
| Viteză de update | **5** (deploy = update) | 4 (OTA tooling sau magazin) | **5** | 4 (EAS Update JS; native → magazin) | 3 (Shorebird terț / magazin) | 2 (magazin) | **5** |
| Efort pentru o persoană | **5** (există) | 2 (rescriere acțiuni + auth) | 5 | 1 | 1 | 1 | **4** |
| Cost | 5 | 5 | 5 | 4 (EAS opțional) | 4 | 4 | 5 (≈99 USD/an Apple + 25 USD Google, de verificat) |
| Risc de magazin | 2 (4.2 + `server.url` neoficial) | 3 | 5 (nu există în magazin) | 4 | 4 | 5 | **3** (cu funcții native reale și demo) |
| **Total (informativ)** | 30–31 | 28–30 | 29–31 | 33–34 | 30–32 | 31 | **34–35** |

Totalurile sunt orientative; contează mai mult colțurile (GPS iOS = nevoie de binar; efort).

### Comentariu pe opțiuni

**1. Capacitor remote-URL.** Avantaj: zero lucru de sincronizare web/nativ, deploy instant. Dezavantaje: fără offline (WebView-ul arată eroare fără semnal), documentația Capacitor îl descurajează pentru producție, și pentru Apple este varianta cu riscul 4.2 cel mai mare, pentru că binarul nu conține UI. Pe Android, cu APK direct, riscul nu există. **Rămâne OK ca bază, dar doar împreună cu funcții native vizibile.**

**2. Capacitor cu assets locale.** Pare soluția „offline”, dar în codul vostru e cea mai scumpă: 33 de server actions (10 fișiere), `cookies()` în `src/lib/auth.ts`, middleware-ul care redirecționează, pagini server-rendered cu `force-dynamic` (layout-ul `mobil`). Export static = rescriere completă a stratului de date pe client + API (Route Handlers sau Supabase direct) + autentificare bazată pe token (cookie-urile de pe un origin `capacitor://`/`https://localhost` nu mai sunt first-party cu API-ul). Practic înseamnă o aplicație nouă. **Nu recomandat acum.** Se poate relua, parțial, doar pentru 3–4 ecrane critice (vezi faza „mai târziu”).

**3. PWA.** Cea mai ieftină cale spre push pe iOS și desktop. Limite certe: fără GPS în fundal, fără Background Sync în Safari, evacuare de stocare dacă e folosit în tab (nu instalat), fără NFC pe iOS, onboarding manual („Add to Home Screen”, permisiune cu gest). Util ca **punte** și ca canal permanent pentru administratori; insuficient ca unic canal pentru tehnicieni (GPS).

**4. React Native / Expo.** Cea mai bună experiență nativă și offline, risc de magazin mic. Dar: rescriere totală de UI (56 fișiere), mutarea logicii server actions pe un API sau apeluri Supabase directe, auth cu token, hărți (react-native-maps în loc de Leaflet), semnătură și PDF re-făcute. Reutilizabil: baza Supabase, politicile RLS, `notify.ts`/`push.ts` (cu token Expo/FCM/APNs), ruta PDF, tipurile din `database.types.ts`, logica de status/dată. Estimare grosieră (de validat): 2–4 luni de lucru intens al unei persoane asistate de AI pentru paritate funcțională. Merită doar dacă offline serios devine blocant.

**5. Flutter.** Aceleași costuri ca RN, dar **fără** reutilizare de cod TypeScript (Dart nou). Fără avantaj decisiv pentru voi. Neprioritar.

**6. Nativ Kotlin + Swift.** Două baze de cod, două stack-uri, zero reutilizare — incompatibil cu „o persoană, un cod”.

**7. Hibrid.** PWA pentru iOS imediat, Capacitor (Android deja există, iOS adăugat) pentru magazine, același cod Next.js. Singurul care rezolvă problemele urgente (push iOS, GPS iOS) fără rescriere.

---

## 4. Risc de magazin — cum se gestionează

### Apple 4.2 pentru un WebView
Textul oficial (secțiunea 2) nu interzice aplicațiile cu conținut web, dar cere ca aplicația să fie mai mult decât un site reambalat. Practica din comunitate (surse secundare, de interpretat prudent): [Apple Developer Forums 4.2.2](https://developer.apple.com/forums/thread/103444), [Mobiloud](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper): respingerile vin la shell-uri fără nimic nativ. Pentru ElectroField riscul este **mediu** (nu mare), pentru că aplicația este un instrument B2B cu funcții dependente de hardware.

Măsuri concrete pentru submisie:
1. Funcții native reale și vizibile din primul ecran: push (APNs), GPS în fundal cu bară albastră iOS, scanner coduri/documente ML Kit, deblocare biometrică, ecran offline propriu (nu pagina de eroare a browserului).
2. Cont demo pentru reviewer + descriere clară în „Notes for review”: aplicație pentru echipe de teren pe bază de abonament B2B, conturile se creează de administratorul firmei (evitați fluxul de „signup” liber dacă nu e nevoie).
3. Nu afișați în app linkul „descarcă APK” și nu menționați Android (login page). Detectați `Capacitor.getPlatform() === "ios"` și ascundeți secțiunea.
4. Dacă persistă respingerile 4.2: distribuție privată prin Apple Business Manager „Custom Apps” sau „Unlisted App” **[din memorie, de verificat]** — trece tot prin review, dar este asumat ca aplicație B2B.
5. Păstrați `server.url` doar dacă aveți și fallback local. Alternativ, un shell cu `webDir` care conține pagina de login + pagina offline, apoi redirect către site (mai „onest” față de Capacitor).
6. `WKAppBoundDomains` / `limitsNavigationsToAppBoundDomains`: în WKWebView, service worker-ii funcționează doar pentru domenii app-bound **[din memorie — de verificat în documentația Capacitor iOS înainte de a conta pe SW în shell]**.

### Google Play, locație în fundal
Vezi secțiunea 2. Pregătiți: dialog prominent (în română + engleză) *înainte* de cererea permisiunii, formulat cu „locația ta … când aplicația este închisă”; video de 30 s; politică de confidențialitate (aveți deja `/confidentialitate`); declarați **o singură** funcție („urmărirea poziției tehnicianului pe durata unei lucrări active, vizibilă dispeceratului”). Aveți un avantaj: consimțământul GDPR există deja în `profile.location_consent_at` — reutilizați-l în dialogul nativ. Pentru conturi personale noi: closed test 14 zile obligatoriu; folosiți cont de organizație dacă aveți firmă (D-U-N-S).

### Apple, locație în fundal
Permis explicit ca serviciu de fundal (2.5.4), dar 5.1.5 cere consimțământ și relevanță, iar 5.1.2 interzice obligarea utilizatorului să activeze locația. Soluție: GPS-ul continuu activ doar pe durata unei lucrări „în desfășurare” (deja se pare că `enabled` depinde de org + consimțământ; adăugați și condiția „lucrare activă” pe iOS), cu explicație în `NSLocationAlwaysAndWhenInUseUsageDescription`.

---

## 5. Pașii exacți pentru push pe iOS cât mai repede (Web Push, VAPID, PWA instalat)

Timp estimat: 1–3 zile de lucru + test pe un iPhone real (iOS ≥16.4; pe iOS 18.4+ puteți adopta ulterior Declarative Web Push). Funcționează și pe Android Chrome și pe desktop (administratori).

**Pasul 0 — reparați bazele (30 min)**
- `src/middleware.ts`: adăugați `/sw.js`, `/manifest.json` (și `/offline`, dacă îl creați) în excepții (înainte de apelul `supabase.auth.getUser()`), la fel ca pentru `/robots.txt`. Altfel manifestul/SW sunt redirecționate la `/login` pentru request-uri fără cookie.
- `public/manifest.json`: adăugați `"id": "/mobil"`, `"scope": "/"`, `"orientation": "portrait"`; iconiță maskable 512; păstrați `display: standalone` (obligatoriu pentru push pe iOS). În `src/app/layout.tsx`: `appleWebApp: { capable: true, title: "ElectroField", statusBarStyle: "black-translucent" }` și `<link rel="apple-touch-icon">` (există deja `apple-icon.png`).

**Pasul 1 — chei VAPID (5 min)**
- `npx web-push generate-vapid-keys`; în Vercel (Production + Preview): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:...`. `npm i web-push` (+ `@types/web-push`). Fluxul este cel din [ghidul oficial Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps).

**Pasul 2 — tabel Supabase (migrație nouă)**
- `web_push_subscriptions(id uuid pk, organization_id, profile_id, endpoint text unique, p256dh text, auth text, user_agent text, platform text check in ('ios','android','desktop','other'), created_at, last_seen_at, last_error text)` + RLS: fiecare utilizator își gestionează propriile rânduri; trimiterea se face cu clientul de serviciu/RLS existent ca în `push.ts`. Nu refolosiți `device_push_tokens` (schema lui nu apare în `supabase/migrations/`, deci de verificat unde e definită și ce constrângeri are).

**Pasul 3 — service worker `public/sw.js` (servit de la rădăcină, scope `/`)**
- `push`: parse JSON `{title, body, url, tag}` → `self.registration.showNotification(title, {body, icon:'/icon-192.png', badge, tag, data:{url}})` **întotdeauna** (iOS revocă abonamentul dacă un push nu produce notificare vizibilă — vezi [WebKit](https://webkit.org/blog/16535/meet-declarative-web-push/)). Opțional `navigator.setAppBadge`.
- `notificationclick`: `clients.matchAll({type:'window'})` → focus + `navigate(url)` dacă există fereastră, altfel `clients.openWindow(url)`; restricționați la căi relative `/mobil...` sau `/admin...`.
- `pushsubscriptionchange`: re-abonare + POST la server.
- `next.config.ts` → `headers()` pentru `/sw.js`: `Cache-Control: no-cache, no-store, must-revalidate`, `Content-Type: application/javascript; charset=utf-8`. Înregistrați cu `updateViaCache: 'none'`.

**Pasul 4 — client: componentă `WebPushSetup` (în `src/app/mobil/layout.tsx`, lângă `PushRegistration`, și în layout-ul admin)**
- Se montează doar dacă `!Capacitor.isNativePlatform()` (în shell-ul Android se folosește în continuare FCM; evitați dublura).
- Detectare: `'serviceWorker' in navigator && 'PushManager' in window`. Pe iOS, dacă nu e `display-mode: standalone` → afișați un card „Instalează aplicația: Partajează → Adaugă pe ecranul principal”, cu ilustrație în română (Next recomandă exact acest fluxul; `beforeinstallprompt` nu există pe iOS).
- Buton „Activează notificările” (gest utilizator, obligatoriu pe iOS) → `Notification.requestPermission()` → `pushManager.subscribe({userVisibleOnly:true, applicationServerKey})` → server action `registerWebPushSubscription(sub.toJSON(), userAgent)`.
- La logout: `unregister` (similar cu `unregisterPushToken` din `sign-out-form.tsx`). Retrimiteți abonamentul la fiecare pornire (actualizează `last_seen_at`).

**Pasul 5 — server: `src/lib/web-push.ts` și integrare în `sendPushToProfiles`**
- `webpush.setVapidDetails(...)`; `sendNotification(sub, JSON.stringify({title, body, url}), {TTL: 86400, urgency:'high'})`. La răspuns 404/410 → ștergeți abonamentul (ca la `stale` pentru FCM).
- Cel mai curat: extindeți `sendPushToProfiles` (apelat din `notify.ts`) să trimită **și** pe Web Push către abonamentele profilului, fără a schimba apelanții; deduplicați dacă un utilizator are și token FCM și abonament web pe același dispozitiv (poate fi o preferință per dispozitiv).
- Preferințele existente (`notification_prefs`, comutatorul principal) se aplică neschimbat.

**Pasul 6 — test și rollout**
- Test pe iPhone real: instalare → permisiune → „Trimite test” din `Profil → Preferințe notificări & test` (existent) → blocați ecranul → verificați livrarea cu aplicația închisă complet. Verificați și Focus/DND.
- Documentați pentru tehnicieni: ghid de 3 capturi (Safari → Partajează → Adaugă pe ecranul principal → deschide din iconiță → activează notificările). Sunt de așteptat probleme de iOS: permisiunea nu poate fi cerută într-un tab Safari obișnuit (verificat în sursele de mai sus).
- Optional, ulterior: când baza de iOS ≥18.4 e majoritară, treceți la payload „declarativ” (`web_push` + `navigate`) pentru fiabilitate mai mare, păstrând SW-ul ca fallback.

---

## 6. Ce să construiți și ce să evitați

### Construiți
1. **Web Push (secțiunea 5)** — prioritatea 1; folosit și de administratorii pe desktop.
2. **Outbox offline în aplicația existentă:** coadă în IndexedDB pentru poze (redimensionate/comprimate pe client la ~1600 px, JPEG ~0.8, ca să încapă ușor în limita de 30 MB și pe date slabe), semnătură (PNG mic), completare checklist, sosire/plecare. UI: „în așteptare de trimitere (N)”. Retry la `online` + la `visibilitychange` + la pornire (fără a conta pe Background Sync, care lipsește pe Safari). Id-uri idempotente generate pe client (UUID) ca server actions să poată reîncerca fără dubluri. Service worker minimal (Serwist sau manual) doar pentru shell + pagina `/offline`. Next documentează acum și un `useOffline` experimental pentru retry la navigații/server actions — de evaluat dacă există în 15.5 (apare în ghidul 2026; **[de verificat]** dacă e disponibil în versiunea instalată).
3. **Plugin-uri Capacitor** (în `android-app`, apoi `ios`): `@capacitor-mlkit/barcode-scanning` (serii), `@capacitor-mlkit/document-scanner` (documente), `@capacitor/preferences`, biometrie (plugin comunitar/Capawesome — de ales), `@capacitor/camera` dacă vreți control mai bun decât `input capture`. În web: `window.Capacitor?.isPluginAvailable(...)` cu fallback la `input capture` și o librărie WASM de barcode pentru PWA (Safari nu are `BarcodeDetector` **[din memorie]**).
4. **Adăugați iOS la Capacitor:** `npx cap add ios`, APNs key în Firebase (FCM trimite și către APNs, deci `push.ts` rămâne), `Info.plist` (locație, cameră, Face ID), `UIBackgroundModes: location, remote-notification`, `registerPushToken` cu `platform` real (acum hardcodat „android”).
5. **Ecran de consimțământ GDPR nativ** înainte de prima cerere de locație (Google „prominent disclosure” + Apple purpose string), cu aceeași înregistrare `location_consent_at` și retragere ușoară (deja există pagina `confidentialitate`).
6. **Detectare versiune minimă** (aveți `app-version.tsx`): forțați actualizarea shell-ului nativ când adăugați plugin-uri.

### Evitați
- Rescrierea în React Native/Flutter/nativ **acum**. Reevaluați doar dacă după 3–6 luni offline-ul prin WebView se dovedește insuficient (ex. zeci de MB de date locale, căutare offline în catalog, hartă offline).
- `output: 'export'` pentru `/mobil` (pierdeți server actions, middleware, cookies).
- Dependența de Background Sync, Periodic Sync, Web NFC sau Web Bluetooth ca singură cale (nu există pe Safari/iOS). NFC: dacă devine real, tratați-l doar ca funcție Capacitor (Android; iOS cu Core NFC prin plugin), nu ca promisiune de PWA.
- GPS continuu „întotdeauna” pe iOS (risc 5.1.2/5.1.5, baterie); legați-l de lucrarea activă.
- Notificări „silent” ca mecanism de funcționare pe iOS (penalizări; vezi WebKit).
- Servicii OTA suplimentare (Capgo/Capawesome Cloud) cât timp rămâneți pe `server.url`: update-ul web e deja instant. Ele devin relevante doar dacă treceți la assets incluse în binar.
- Submiterea în App Store a unui binar „gol” (doar WebView) — cel mai probabil motiv de respingere 4.2.
- Folosirea aceleiași pagini „descarcă APK” pe iOS; ascundeți-o.

---

## 7. Plan pe faze

### Luna aceasta (≈ 2–3 săptămâni)
1. Fix middleware pentru `/sw.js` și `/manifest.json`; manifest complet; metadate Apple web app (secțiunea 5, pasul 0).
2. Web Push complet (pașii 1–6) + ghid de instalare pentru tehnicieni iPhone și administratori desktop.
3. `registerPushToken`: `platform` real; pregătire `device_push_tokens`/`web_push_subscriptions` să știe platforma.
4. Începeți **în paralel** procesele lungi: cont Apple Developer (organizație: D-U-N-S poate dura săptămâni — **[din memorie]**) și cont Google Play (organizație sau cont personal + closed test 14 zile cu 12 testeri, vezi sursa).
5. Outbox offline v1 doar pentru **poze + semnătură + „finalizare lucrare”** (cea mai dureroasă pierdere de date în teren).
6. Ghid GDPR/consimțământ actualizat (text de dialog Play/Apple).

### În 3 luni
1. `npx cap add ios`; plugin background-geolocation pe iOS; push APNs prin FCM; ML Kit barcode + document scanner; biometrie; pagină offline nativă/locală; ascundere „descarcă APK” pe iOS.
2. **TestFlight** intern → extern (cu cont demo) → App Store (cu „Notes for review” pregătite pentru 4.2 și locație).
3. **Google Play**: închis → producție, cu declarația de locație în fundal (video 30 s, disclosure). Păstrați APK-ul direct ca fallback pentru cine nu are Play.
4. Service worker pentru cache de shell + coadă offline v2 (checklist, cheltuieli, materiale); telemetrie simplă de sincronizare (câte elemente rămân blocate, cât de des).
5. Măsurați: rata de livrare push iOS vs Android, număr de sincronizări eșuate, rejecții de magazin.

### Mai târziu (6–12 luni, condiționat de date)
1. Dacă offline devine critic: extrageți **3–4 ecrane** (listă lucrări, detaliu, checklist, foto) într-un client static/SPA local cu API (Route Handlers/Supabase) și token de autentificare, fără a rescrie restul. Abia dacă această bucată e dificilă, evaluați Expo ca aplicație separată pentru tehnicieni.
2. NFC (Android/iOS prin plugin), dacă există caz de utilizare real (etichete pe echipamente).
3. Declarative Web Push când iOS ≥18.4 e majoritar; badge-uri pe iconiță.
4. Distribuție privată (Apple Business Manager custom app) dacă clienții mari o cer.
5. Reevaluare anuală a regulilor de magazin (4.2, locație) și a prețurilor EAS/Capawesome.

---

## 8. Reutilizare cod pe opțiuni (estimare din repo)

| Componentă | Capacitor (1/7) | Capacitor + assets (2) | PWA (3) | RN/Expo (4) | Flutter (5) | Nativ (6) |
|---|---|---|---|---|---|---|
| Supabase, RLS, migrații | 100% | 100% | 100% | 100% | 100% | 100% |
| `src/lib/notify.ts`, `push.ts` | 100% (+ Web Push) | 100% | 100% (+Web Push) | ~90% (token Expo/FCM) | ~90% | ~90% |
| Ruta PDF (`api/rapoarte-lucrare`) | 100% | 100% (trebuie CORS/token) | 100% | 100% (API cu token) | 100% | 100% |
| UI `/mobil` (56 fișiere) | 100% | ~60% (pagini server → client) | 100% | ~0–15% (logică; UI nou) | 0% | 0% |
| 33 server actions | 100% | **rescriere** (API) | 100% | **rescriere** (API) | **rescriere** | **rescriere** |
| Auth cookie SSR + middleware | 100% | **rescriere** (token) | 100% | **rescriere** (token) | **rescriere** | **rescriere** |
| Semnătură (`signature-pad.tsx`) | 100% | 100% | 100% | rescriere (canvas RN) | rescriere | rescriere |
| Hartă Leaflet (`harta`) | 100% | 100% | 100% | rescriere | rescriere | rescriere |
| Offline | de adăugat (outbox) | de adăugat | de adăugat | nativ, de construit | de construit | de construit |

Concluzie: opțiunile 1/3/7 păstrează ~100% din cod; opțiunile 2/4/5/6 cer rescrierea stratului de date și a autentificării, iar 4/5/6 și a întregului UI.

---

## 9. Riscuri și incertitudini

- Prețurile (Apple, Google, EAS) și detaliile Apple Business Manager/D-U-N-S nu au fost verificate din surse primare — verificați înainte de buget.
- Comportamentul exact al notificărilor iOS 26 și al Home Screen web apps a fost citit din surse de beta; testați pe dispozitiv real.
- Nu am putut citi ultimele ~14k caractere din ghidul Apple (alte secțiuni; 4.2 și 5.1.x au fost citite).
- Politica de revizuire Google pentru locația în fundal poate respinge dacă formularea declarației e vagă; pregătiți 1–2 iterații.
- Riscul 4.2 rămâne **nenul** indiferent de pregătire; plan B = distribuție privată/unlisted, sau PWA pentru iOS pe termen mai lung (singurul canal fără review, dar fără GPS în fundal).
- `server.url` este marcat „not for production” în docs Capacitor: Capacitor poate schimba comportamentul; fixați versiunile și testați la fiecare upgrade major.

---

## 10. Surse

- Apple, [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (4.2, 4.2.2, 4.3, 2.5.4, 5.1.1, 5.1.2, 5.1.5)
- Apple, [Compare memberships](https://developer.apple.com/support/compare-memberships/)
- WebKit, [Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- WebKit, [Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/)
- WebKit, [Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- heise, [iOS 26: Changed web app behaviour on the home screen](https://heise.de/-10749652)
- Google Play Console Help, [Location permissions in background](https://support.google.com/googleplay/android-developer/answer/9799150)
- Google Play Console Help, [Testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
- Next.js, [Progressive Web Apps guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [Static Exports](https://nextjs.org/docs/app/guides/static-exports)
- Capacitor, [Configuration](https://capacitorjs.com/docs/config)
- [capacitor-community/background-geolocation](https://github.com/capacitor-community/background-geolocation)
- Capawesome, [ML Kit plugins](https://capawesome.io/plugins/mlkit), [OTA tools comparison](https://capawesome.io/blog/best-ota-update-tools-for-capacitor/)
- Expo, [Location](https://docs.expo.dev/versions/latest/sdk/location/), [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [Billing plans](https://docs.expo.dev/billing/plans/)
- MDN, [Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API), [Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)
- Comunitate/secundar (de folosit cu prudență): [Apple Developer Forums 4.2.2](https://developer.apple.com/forums/thread/103444), [Mobiloud: WebView wrapper](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper), [Expo EAS review](https://vibecoding.app/blog/expo-eas-review)
