# Audit funcțional ElectroField — stare la 2026-11-07 (commit dcb9b58)

Metodă: citire cod (toate fișierele `actions.ts`, layout-uri, middleware, lib/notify/push/message-notify, pagini cheie), rulări locale (tsc, eslint, build) și interogări DOAR-CITIRE pe Supabase (`hrzpowmmbuqihtbkisyu`: pg_policies, grants, funcții, advisors, constraints, storage). Nu s-a modificat nimic în repo, nu s-a rulat SQL de scriere, nu s-a pornit `next dev`. Nu s-au citit rânduri cu date personale. `git status` este curat după rulări.

Notă: AGENTS.md trimite la `node_modules/next/dist/docs/`; acel director NU există în Next 15.5.26 instalat (nu am avut ce să citesc). Codul folosește API-uri Next 15 standard (`await searchParams`, `after()`, `cookies()` async) și compilează.

---

## 1. Rezultate verificări automate

| Comandă | Rezultat |
|---|---|
| `npx tsc --noEmit` | exit 0, 0 erori |
| `npx eslint src` | exit 0, 0 erori, 0 avertismente |
| `npm run build` (cu env dummy) | exit 0. „Compiled successfully", 19/19 pagini statice, 0 avertismente. Middleware 94.9 kB; First Load JS comun 103 kB; cele mai grele rute: `/admin/mail` 189 kB, `/harta` 182 kB, `/mobil` 181 kB, `/mesaje` 179 kB, `/admin/programari` 178 kB |

Observații colaterale: nu există teste automate pentru aplicație (doar `scripts/mail-security.test.mjs` și `scripts/admin-security.test.mjs`, neintegrate în `package.json`); nu există `.github/` (niciun CI); nu există `vercel.json` (regiunea funcțiilor se setează în dashboard — NU am verificat că e `fra1`; Supabase e `eu-central-1`).

---

## 2. Constatări, ordonate pe severitate

### P0 — scurgeri de date / securitate / flux de bază

**P0-1. Orice utilizator autentificat își poate schimba singur rolul (și compania) → escaladare la admin.**
- Dovadă DB: policy `profiles_update` = `USING (id = auth.uid() OR (org + admin))`, `WITH CHECK` gol (deci se aplică același USING). Singurul trigger pe `profiles` (în afară de ghidul de preview) este `profiles_hourly_rate_admin_only`, care protejează doar `hourly_rate`. `authenticated` are `UPDATE` pe coloanele `role`, `organization_id`, `client_id`, `is_active` (information_schema.column_privileges).
- Cod: `src/app/(app)/setari/actions.ts:89-104` (`updateUserRole`) nu verifică rolul apelantului, deci același efect prin Server Action, nu doar prin PostgREST.
- Scenariu: un tehnician apelează `supabase.from('profiles').update({role:'admin'}).eq('id', <propriul id>)` din consola browserului (cheia publishable e publică). Devine admin: poate apela `company_admin_reset_employee_password` pentru orice coleg (inclusiv adminul real) → preluare cont; poate modifica `organizations` (vezi P1-3). Setând `organization_id` către alt tenant (dacă îi cunoaște UUID-ul) ar intra în altă companie ca admin.
- Fix: `REVOKE UPDATE (role, organization_id, client_id, is_active) ON public.profiles FROM authenticated, anon;` + trigger `BEFORE UPDATE` care respinge schimbarea acestor coloane dacă `current_role() <> 'admin'` sau dacă `organization_id` se schimbă; adaugă `WITH CHECK` explicit. `updateUserRole` să refuze dacă `profile.role !== 'admin'` și să nu permită auto-schimbarea. Mutarea pe coloane cu GRANT-uri minime pentru `authenticated` (acum e GRANT ALL pe toate tabelele, inclusiv TRUNCATE/TRIGGER/REFERENCES, doar RLS ține lucrurile).

**P0-2. `is_staff()` = `role <> 'client'` ⇒ tehnicianul are drepturi de „staff" pe aproape tot.**
- `public.is_staff()` = `coalesce(current_role() <> 'client', false)`. Toate politicile de scriere folosesc `is_staff()`: `jobs_update/delete`, `clients_update/delete/insert`, `invoices_write/update`, `documents_delete/write`, `photos_delete`, `locations_*`, `teams_all`, `team_members_all`, `materials_all`, `material_stock_all`, `vehicles_all`, `warehouses_all`, `checklist_templates_all`, `job_assignments_all`, `time_entries_select`, `expenses_select`, `time_off_requests_select`, `technician_positions_select`, `technician_position_log_select`, `job_notes_select`, `job_alerts_update`, `audit_log_select`.
- Garda din `(app)/layout.tsx:24` e doar UI (redirect la /mobil); nu oprește apeluri directe. Aceleași Server Actions (ex. `markInvoicePaid`, `createInvoiceForJob`, `deleteDocument`, `removeVehicle`, `toggleTeamActive`) nu verifică rolul.
- Scenariu 1: un tehnician șterge toți clienții/lucrările companiei (`jobs_delete`, `clients_delete` permit `is_staff()`), marchează facturi „plătite", editează stocuri, își schimbă echipa, șterge documente.
- Scenariu 2 (confidențialitate/GDPR): același tehnician citește poziția GPS live și traseul tuturor colegilor (`technician_positions_select`, `technician_position_log_select`), toate pontajele, toate cheltuielile, toate facturile, toate documentele HR ale colegilor (`documents_select`: `is_staff()`; fișiere în `employees/<id>/documents/`), și `hourly_rate` al tuturor (`profiles_select` = tot organizația, fără restricție pe coloană; trigger-ul protejează doar scrierea).
- Fix: definește `is_back_office()` = `role IN ('admin','manager')` și folosește-l pe tabelele sensibile; pentru tehnicieni politici dedicate (doar lucrările la care sunt în `job_assignments`, doar propriul pontaj/propriile documente/propria poziție). Vezi și P1-4.

### P1 — breșe în limitele de rol, bug-uri în fluxuri principale

**P1-1. Tehnicianul își poate aproba singur cheltuielile și concediul.**
- `expenses_update`: `submitted_by = auth.uid() OR admin/manager`; `time_off_requests_update`: `profile_id = auth.uid() OR admin/manager`, fără restricție pe coloana `status`. Acțiunile `approveExpense/rejectExpense` (`src/app/(app)/cheltuieli/actions.ts:7-38`) și `decideTimeOff` (`pontaj/concedii/actions.ts:36-51`) nu verifică rolul și `approveExpense` nici nu filtrează pe `organization_id`.
- Scenariu: tehnicianul apelează `decideTimeOff` cu id-ul cererii proprii și `decision=approved`; sau `expenses.update({status:'approved', amount: 9999})` pe o cheltuială proprie (și după aprobare poate modifica suma).
- Fix: politici UPDATE separate: submitter poate edita doar cât timp `status='pending'` și fără a atinge `status/approved_*`; schimbarea statusului doar admin/manager; verificare de rol în acțiuni.

**P1-2. `next_invoice_number(p_organization_id uuid)` — SECURITY DEFINER, executabilă de orice `authenticated`, fără verificare că `p_organization_id` = organizația apelantului.**
- Corp: `insert into invoice_counters … on conflict … do update next_number+1`. Scenariu: un utilizator din compania A apelează RPC-ul cu UUID-ul companiei B (sau în buclă) și consumă/rupe secvența de facturare a B (goluri de numerotare, încălcare cerință fiscală de numerotare continuă); poate și crea rânduri în `invoice_counters` pentru orice UUID.
- Fix: în funcție `if p_organization_id <> current_org_id() then raise exception`; sau scoate parametrul și folosește `current_org_id()`; REVOKE de la anon/PUBLIC.

**P1-3. Admin de tenant poate modifica direct `subscription_plan`, `is_active`, `terms_accepted_at` pe propria organizație.**
- `org_update` permite admin pe orice coloană; `authenticated` are UPDATE pe `subscription_plan`, `is_active`, `terms_accepted_at`, `terms_declined_at`. Scenariu: un admin (sau un tehnician devenit admin prin P0-1) își setează planul „pro" / își reactivează contul suspendat de platformă / sare peste poarta de termeni (`terms_accepted_at`).
- Fix: REVOKE UPDATE pe aceste coloane; modificarea lor doar prin RPC `platform_admin_*`.

**P1-4. Rolurile `manager` și `client` nu sunt diferențiate în back-office; `client` poate intra în `(app)`.**
- `src/app/(app)/layout.tsx:24` blochează doar `FIELD_ROLES`. Un cont `client` (rolul există în enum și în `ROLE_OPTIONS` din `setari/page.tsx:20`, deși `company_admin_create_employee` refuză să-l creeze) ajunge în dashboard/setări; `profiles_select` și `org_select` îl lasă să citească lista de profile ale companiei. `manager` vede Setări, Pontaj cu salarii, Facturare etc. (nu există niciun `profile.role ===` în pagini, vezi grep).
- Fix: matrice de permisiuni centralizată (`can(role, 'facturare')`), verificată în layout/pagini și în fiecare Server Action; blochează `client` în `(app)` și `/mobil`.

**P1-5. Stocarea `attachments`: orice membru al organizației (inclusiv `client`) citește/șterge/suprascrie ORICE fișier din folderul organizației.**
- Politici storage: SELECT/INSERT/UPDATE/DELETE pe `(storage.foldername(name))[1] = organization_id`, fără rol. Bucket privat (bine), fără `file_size_limit` și fără `allowed_mime_types`.
- Consecințe: chitanțe, semnături, poze, documente HR ale colegilor accesibile oricui din companie (vezi P0-2). `deleteDocument`/`deleteClientDocument`/`deleteUserDocument` (`lucrari/[id]/actions.ts:450`, `clienti/actions.ts:240`, `setari/utilizatori/[id]/actions.ts:107`) șterg obiectul din storage după un `storagePath` luat din formular, înainte de a verifica documentul — un tehnician poate șterge orice fișier al firmei.
- Fix: politici pe rol + prefix (`employees/<id>/` doar admin sau proprietar; `jobs/<id>/` doar cei asignați/staff); limită de mărime și mime allow-list; șterge fișierul pe baza `storage_path` din rândul DB, nu din formular.

**P1-6. Fusuri orare: ora afișată în toate paginile server-rendered și în PDF e în UTC (cu 2–3 h în urma României).**
- Serverul rulează în UTC; `toLocaleTimeString("ro-RO", …)` / `toLocaleString("ro-RO")` fără `timeZone` în: `(app)/lucrari/[id]/page.tsx:85,731,326,868`, `(app)/harta/page.tsx:188,456,526`, `(app)/dashboard/page.tsx:792`, `(app)/mesaje/page.tsx:92`, `mobil/lucrari/[id]/page.tsx:307,405`, `mobil/lucrari/[id]/extra/page.tsx:100`, `rapoarte-lucrare/[id]/page.tsx:59,143`, `api/rapoarte-lucrare/[id]/route.tsx:76,149,229` (raportul PDF semnat arată ora semnăturii greșit).
- Scenariu: tehnicianul ajunge la 14:05; în cronologia lucrării și pe harta admin apare „11:05" sau „12:05"; PDF-ul de predare către client are o oră de semnare falsă. (Modulul `src/lib/date.ts` există, dar nu e folosit peste tot.)
- Fix: un helper `fmtTimeRo(iso)` cu `timeZone: ORG_TIME_ZONE`, folosit peste tot (și `Intl.DateTimeFormat` în PDF).

**P1-7. Tehnician adăugat în echipă nu vede lucrările echipei (și cel scos le vede în continuare).**
- `job_assignments` (nu `jobs.team_id`) alimentează aplicația mobilă (`team-sync.ts:3-5`), dar `addMember`/`removeMember`/`setTeamLeader` (`echipe/actions.ts:50-120`) nu apelează `syncJobAssignmentsToTeam`; sincronizarea rulează doar la `createJob` și `updateJob`.
- Scenariu: se angajează un tehnician, e pus în echipă luni; marți dimineață are zero lucrări pe telefon deși echipa are 6 programate. Invers, cel mutat în altă echipă primește în continuare lucrările vechi și notificări.
- În plus `syncJobAssignmentsToTeam` face DELETE urmat de INSERT non-atomic (`team-sync.ts:11-23`): dacă INSERT eșuează sau cererea se întrerupe, lucrarea rămâne fără nimeni asignat; la fiecare editare de lucrare, tehnicianul pierde pentru o clipă lucrarea.
- Fix: la `addMember`/`removeMember` sincronizează lucrările viitoare/neterminate ale echipei; folosește diff (insert missing / delete extra) într-o funcție SQL (`security invoker`) sau RPC într-o tranzacție.

**P1-8. Nu există nicio notificare către admin pentru evenimentele care cer acțiune.**
- `notifyProfiles` e apelat doar la: `beginJobPrep` (job_started), alocări/modificări de lucrări, `decidePurchaseRequest` (răspuns), `requestCallFromTeam`, mesaje, test. NU se notifică: cerere nouă de achiziție (`mobil/(tabs)/materiale/actions.ts:90 requestPurchase`), alertă `job_alerts` (client absent, sosire neconfirmată — `mobil/lucrari/[id]/actions.ts:285,408`), notă de tip „problem" (`addJobNote`), lucrare finalizată (`finalizeJob`), cerere de concediu (`mobil/concediu/actions.ts`), cheltuială nouă.
- Scenariu: tehnicianul cere un material lipsă și așteaptă; adminul nu primește nimic (nici clopoțel, nici push) până deschide /aprobari. Sunt și zero push-uri către desktop (tokenurile se înregistrează doar pe Android, `push-actions.ts:19`).
- Fix: `notifyProfiles` către admin/manager pe fiecare dintre aceste evenimente; opțional Web Push/email pentru back-office.

**P1-9. Facturare: două căi de numerotare + factura nu e document fiscal.**
- `createInvoiceForJob` (`facturare/actions.ts:32`) folosește contorul atomic, dar `createInvoice` din fișa clientului (`clienti/actions.ts:188-193`, folosit în `clienti/[id]/page.tsx:360`) folosește `count(*)+1` → coliziune cu `invoices_org_number_unique (organization_id, invoice_number)`; insert-ul eșuează TĂCUT (eroarea ignorată) și utilizatorul crede că factura a fost creată. Nu validează nici că `clientId`/`jobId` aparțin organizației.
- Nu există TVA, nu există scadență (`due_date` există în DB dar nu e completat), nu există PDF, trimitere, stornare, e-Factura. „Restantă"/`overdue` nu e setat niciodată de cod (KPI „Restante" e mereu 0). Sumele pot fi negative per componentă (se verifică doar totalul > 0). Dublu-click creează două facturi pentru aceeași lucrare. Dropdown-ul de lucrări e limitat la ultimele 50 (`facturare/page.tsx`). Lista nu are paginare, iar PostgREST taie la 1000 de rânduri → totalurile din KPI devin greșite peste 1000 facturi.
- Fix: o singură cale (RPC `create_invoice` tranzacțional: număr + insert), `due_date`, TVA, status overdue calculat, paginare + totaluri în SQL. Pentru conformitate: integrare SmartBill/Oblio/e-Factura (vezi §4).

**P1-10. Actualizarea unei companii de către super-admin resetează planul la „pro".**
- `src/app/admin/actions.ts:75`: `new_plan: "pro"` hardcodat în `updateCompany` → `platform_admin_update_company` scrie `subscription_plan` și `subscriptions.plan` pe „pro" la fiecare salvare a formularului (inclusiv când doar suspenzi un cont sau corectezi un telefon).
- Fix: citește planul curent sau adaugă select de plan în formular; trimite valoarea reală.

### P2 — probleme reale, impact mai mic sau condiționat

**P2-1. Erori Supabase ignorate în aproape toate acțiunile → eșec silențios.**
Exemple: `addExpense` (`lucrari/[id]/actions.ts:156-189`: dacă `category` nu e în CHECK-ul `expenses_category_check`, insert-ul pică fără mesaj), `updateJobStatus` (`lucrari/actions.ts:212`), `saveSignature` (`mobil/lucrari/[id]/actions.ts:431-460`), `addJobNote`, `uploadPurchasePhoto`, `requestPurchase`, `createInvoice*`, `markInvoicePaid`, `sendTeamMessage` (insert mesaj fără verificare de eroare, urmat de notificare chiar dacă mesajul nu s-a salvat — `mesaje/actions.ts:96-110`), `setStockQuantity`, `createMaterial` (stocul inițial se pierde dacă nu există depozit central). Doar `uploadJobPhoto` raportează erori.
Fix: convenție `{ok, error}` din Server Actions + toast; logare server.

**P2-2. `time_entries.event_type = 'depot_arrival'` încalcă CHECK-ul `time_entries_event_type_check`** (permite doar travel_start, arrival, work_start, break_start, break_end, work_end). `confirmDepotArrival` (`mobil/lucrari/[id]/actions.ts:107-115`) ignoră eroarea, deci sosirea la depozit nu se înregistrează niciodată; fluxul pare să meargă. Tot aici: UI-ul afișează `pauza_start`/`work_resume` (`lucrari/[id]/page.tsx:73`) care nu există în constraint; `break_start/break_end` nu sunt generate nicăieri → „Ore pauză" din Pontaj e mereu 0.
Fix: migrare care extinde CHECK-ul sau tip nou; implementare pauză reală.

**P2-3. Ferestre de timp „azi" decalate cu 2–3 h.** `startOfDay()` local în `dashboard/page.tsx:45-47` și `harta/page.tsx:21-23`, plus `${rangeStartStr}T00:00:00` în `pontaj/page.tsx` și `pontaj/export/route.ts:31-32` produc limite în UTC, nu în Europe/Bucharest. Evenimentele dintre 00:00–03:00 locale ajung în ziua precedentă; pontajul de dimineață devreme e greșit. `src/lib/date.ts#startOfOrgDay` face corect și nu e folosit. Mai jos: `greeting()` (`dashboard/page.tsx:38`, `mobil/(tabs)/page.tsx:18`) folosește `getHours()` pe server (UTC) → „Bună dimineața" după-amiaza; `setari/page.tsx:41` calculează luna din `toISOString()`.

**P2-4. Timp lucrat umflat la finalizarea din back-office.** `updateJobStatus('finalizata')` (`lucrari/actions.ts:212-239`) setează `work_ended_at` dar nu inserează `time_entries.work_end`; dashboard (`hoursWorked`, `laborCostOf`) adaugă `now - openStart` pentru intervalele deschise → orele și costul manoperei cresc la nesfârșit. La „Continuă lucrarea" din pauză se rescrie `work_started_at`. Nu validează tranziții de status și nu filtrează pe organizație (se bazează pe RLS).

**P2-5. Limita implicită PostgREST (1000 rânduri) taie silențios rezultate.** Ex.: `technician_position_log` ultimele 12 h, ordonat crescător (`dashboard/page.tsx:253-259`, `harta/page.tsx:~96-100`) → după ~1000 de puncte (≈2 tehnicieni × 30 s × 12 h) dispar punctele cele MAI NOI din traseu; liste de facturi/lucrări/cheltuieli/clienți fără paginare (`lucrari/page.tsx`, `clienti/page.tsx`, `facturare/page.tsx`, `aprobari/page.tsx`, `cheltuieli/page.tsx`).

**P2-6. Mesaje: thread-ul afișează cele mai VECHI 200 mesaje.** `mesaje/page.tsx` (thread, `order created_at asc` + `limit(200)`) și `mobil/(tabs)/mesaje/[id]/page.tsx:30-31`: după 200 de mesaje, cele noi nu se mai văd. Numărul de necitite se calculează din ultimele 300 mesaje din toată organizația (`mesaje/page.tsx`), deci subestimat.

**P2-7. Performanță / N+1 / pagini grele (server în Frankfurt).**
- Dashboard: 22 interogări în 3 valuri (`dashboard/page.tsx:118-303`), fără limită pe `time_entries`, `expenses`, `activeJobs`; împreună cu `AutoRefresh` la 20 s (`dashboard/page.tsx:601`) și Harta (18 interogări, `harta/page.tsx:310`) fiecare tab deschis de admin re-rulează tot la 20 s. Folosește Realtime (deja în `topbar`) sau intervale mai mari și agregări SQL/views.
- `clienti/page.tsx:55-60`: încarcă TOATE rândurile `jobs` ale clienților afișați doar pentru a număra.
- Mobil home (`mobil/(tabs)/page.tsx:41-46`): `job_assignments` + `jobs(...)` fără filtru de dată/limit — crește cu istoricul tehnicianului.
- `pingLocation` (`mobil/location-actions.ts`) la fiecare 30 s: `getUser` + profil + organizație (via `requireSessionContext`) + select `job_assignments` + 2 scrieri = ≥5 round-trip-uri per ping per tehnician; tracking-ul nu verifică server-side consimțământul/setarea organizației.
- Fiecare navigare: `getUser()` în middleware (`middleware.ts:44`) + `getUser()` în `requireSessionContext` (2 apeluri Auth).
- FK fără index (advisor): 33, dintre care relevante: `job_required_items(job_id, material_id, organization_id)`, `purchase_requests(job_id, requested_by, organization_id, material_id)`, `job_notes(job_id)`, `job_alerts(job_id, profile_id, organization_id)`, `conversation_messages(organization_id, sender_profile_id, job_id)`, `jobs(warehouse_id)`, `time_off_requests(profile_id)`, `device_push_tokens(organization_id)`, `technician_positions(organization_id)`. 5 politici cu `auth.uid()` fără `(select …)` (initplan): `purchase_requests_insert/select`, `conversation_reads_own`, `conversations_member_select`, `conversation_messages_member_insert`. 59 avertismente „multiple permissive policies" (politica `ef_platform_preview_select` dublată peste cele normale pe SELECT).
- Fără loading.tsx pe `/mobil/**` și pe majoritatea paginilor `(app)` (există doar lucrari, clienti, echipe, calendar, dashboard); fără `not-found.tsx`; un singur `error.tsx` în `(app)` și unul global — nu pe `/mobil`.

**P2-8. Stoc: citire–modificare–scriere și rotunjire.**
- `consumeMaterial` (`mobil/(tabs)/materiale/actions.ts:7-50`) citește `quantity`, scade și scrie: doi tehnicieni din aceeași mașină → actualizare pierdută. Consumul se limitează la 0 (`Math.max(0, …)`) dar `material_usage` înregistrează cantitatea completă → inventarul nu mai corespunde. Consumul se atribuie primei lucrări găsite în `in_lucru/pauza` (nu lucrării aleasă de utilizator) și dacă nu există niciuna, stocul scade fără nicio înregistrare de consum. Nu verifică ca `stockId` să fie al vehiculului echipei.
- `setStockQuantity` (`materiale/actions.ts:79`) face `Math.round` deși coloana `material_stock.quantity` e `numeric` (cabluri la metru: 12,5 m devine 13). Nu există unicitate pe `(material_id, warehouse_id|vehicle_id)` → select `maybeSingle` pică la dubluri. Nu există istoric/jurnal de mișcări de stoc.
- Fix: `UPDATE … SET quantity = quantity - $1 WHERE quantity >= $1` într-un RPC, tabel de mișcări, unique index.

**P2-9. Lanț notificări/push (detalii în §5).** Push-ul rulează sincron în Server Action (blochează răspunsul, în special mesajele); ștergere agresivă de tokenuri pe orice `NOT_FOUND`; tokenuri invalide neșterse; `notifications_insert` permite inserarea pentru orice `profile_id` (inclusiv din altă companie).

**P2-10. Semnături / rapoarte.** `saveSignature` poate fi apelată de mai multe ori → mai multe rânduri `signatures` pe aceeași lucrare; pagina și PDF-ul folosesc `.maybeSingle()` (`api/rapoarte-lucrare/[id]/route.tsx:109`, `lucrari/[id]/page.tsx`) care dă eroare la >1 rând → semnătura dispare din raport. `dataUrl` fără limită și fără validare PNG; nu leagă semnătura de timp/GPS/hash raport; `finalizeJob` marchează lucrarea terminată înainte de semnătură și nu impune server-side poza finală/checklist-ul (doar UI, `finalizare/page.tsx`). PDF-ul nu conține orele lucrate, materialele consumate, observațiile/defectele echipamentelor, doar numărul de poze; data e în format ISO; „Total" presupune RON.

**P2-11. Rezervări publice (`/api/programari`, `src/app/api/programari/route.ts`).** Fără rate limit/CAPTCHA/honeypot: un script poate bloca toate sloturile (UNIQUE pe slot) și poate folosi formularul pentru a trimite emailuri de confirmare către adrese terțe (câmpul `email` e trimis oricui). Verificarea `Origin` oprește doar apeluri fără Origin, nu un atacator cu browser/scripturi care setează headerul.

**P2-12. AI (`lucrari/nou/ai-actions.ts`).** Orice utilizator autentificat (inclusiv conturi de probă) poate apela `generateJobSuggestion`/`transcribeAudio` fără limită → epuizarea cheii Groq. Modelul implicit e `llama-3.1-8b-instant` (primul din listă) pentru proceduri de siguranță electrică/FV prezentate ca „fișă tehnică de execuție" și salvate ca checklist blocat (`lucrari/actions.ts:180-202`); nu există avertisment vizibil că e generat de AI și neverificat. Risc de răspundere. Audio fără validare de mărime/tip.

**P2-13. iPhone / layout mobil.** `src/app/layout.tsx:48-54` nu setează `viewportFit: "cover"`; nicăieri nu există `env(safe-area-inset-*)` (grep gol). `mobil/layout.tsx:19` folosește `h-screen` (100vh) — în Safari iOS înălțimea include bara de adrese, deci bara de jos cade sub zona vizibilă; `mobile-nav.tsx:258` are `h-[70px] pb-2` fix, fără inset pentru home indicator; nu are `aria-label`/`aria-current`. `maximumScale: 1, userScalable: false` (și componenta `PreventZoom`) încalcă WCAG 1.4.4. `(app)` folosește `h-screen overflow-hidden` fără variantă mobil (sidebar fix, fără meniu burger — back-office-ul nu e utilizabil pe telefon).

**P2-14. Acțiuni de rol ținute doar de RLS, fără filtrare explicită pe organizație** (apărare în adâncime lipsă): `updateJobStatus`, `approveExpense`, `rejectExpense`, `deleteDocument*`, `toggleChecklistItem`, `deleteChecklistItem`, `addChecklistItem`, `deleteRequiredItem`, `addMember`(team neverificat), `removeMember`, `setTeamLeader` (profileId nevalidat), `addContact`, `deleteContact`, `markPurchaseFulfilled`, `acknowledgeRejectedPurchase`, `toggleRequiredItemTaken`. Orice regresie de politică devine imediat scurgere cross-tenant.

**P2-15. Securitate cont.** Parola minimă e 6 caractere (`login`, `signup/actions.ts:53`, `setari/actions.ts:64`, `admin/actions.ts:27`); „Leaked password protection" dezactivat în Supabase Auth (advisor); `acceptTerms/declineTerms` (`accepta-termeni/actions.ts:99`) folosesc `getSession()` (neverificat) în loc de `getUser()`; `declineTerms` suspendă imediat compania fără confirmare; `deleteCompany` (super-admin) nu cere confirmare, nu apelează `requireAdminContext()` (se bazează pe RPC), nu șterge fișierele din storage ale companiei (rămân orfane — ștergere GDPR incompletă).

**P2-16. Aplicația Android.** `android-app/capacitor.config.ts:15`: URL fix `https://electrofield-alporaro.vercel.app/mobil` (alias Vercel, nu domeniu propriu); APK de 6,8 MB comis în `public/downloads/electrofield.apk` (fără semnare verificabilă/hash, fără update automat); aplicația e doar un WebView → zero funcționare offline (vezi §4); iOS neacoperit (`push-actions.ts:19` hardcodează `platform: "android"`, `push.ts` nu are configurare APNs).

### P3 — minore / igienă

- `profiles`/Realtime: `notifications` și `conversation_messages` sunt în `supabase_realtime`; nu e în publicație `job_alerts`, deci alertele noi se văd doar la AutoRefresh de 20 s.
- Căutare moartă în `Topbar`: `src/components/topbar.tsx:99-107` (afișat pe `/dashboard`, `showSearch`, linia 47) — input „Caută clienți, lucrări, echipe…" fără stare/handler/form; nu face nimic.
- Tab-uri placeholder în Setări: `setari/page.tsx:174-176` — „Tipuri de lucrări", „Notificări" (preferințele există deja în mobil), „Integrări" afișează „în curând".
- Statusul `anulata` există în enum și e filtrat în UI (`lucrari/page.tsx:27`, `echipe/page.tsx:215`, `mobil/.../harta`) dar NICIUN cod nu îl setează; nu există buton „Anulează lucrarea" și nici ștergere de lucrare.
- Căutare clienți (`clienti/page.tsx:46-49`): `term` elimină doar `%` și `,`; paranteze/puncte pot rupe filtrul `.or()` → listă goală fără mesaj. Nu există căutare pe lucrări.
- `pontaj/export/route.ts`: CSV fără neutralizarea `=`, `+`, `-`, `@` la început de celulă; export fără coloană salarială.
- `notificationHref` (`lib/notification-ui.ts:31`) + `redirect()` (`mobil/(tabs)/notificari/actions.ts:24`) acceptă orice `link` din DB; combinat cu `notifications_insert` neverificat, un link extern poate fi injectat (redirect deschis, phishing intern/cross-tenant).
- `create_organization_and_owner` există în două overload-uri (2 și 3 argumente); cel vechi lasă `terms_accepted_at` null — redundant. 19 funcții SECURITY DEFINER sunt executabile de `anon` (toate au gardă internă, vezi §3, dar ar trebui REVOKE).
- `beginJobPrep` (`mobil/lucrari/[id]/actions.ts:23-78`): dublu-tap rapid → intrări `travel_start` și notificări duplicate (cursă pe `mobile_stage` null).
- `getOrCreateTeamConversation` etc. (`mesaje/actions.ts:39,68`): `afterRace!.id` poate arunca excepție.
- Profilul mobil blochează deconectarea cât există o lucrare activă (`mobil/(tabs)/profil/page.tsx:131`): o lucrare blocată în `in_drum` blochează logout-ul pe telefon partajat; fără ieșire de urgență.
- Fără headere de securitate (CSP, X-Frame-Options, HSTS, Referrer-Policy) în `next.config.ts`/middleware.
- Geocodare Nominatim fără timeout, fără cache, apelată sincron în `createJob`, `updateJob`, `addLocation`, `createWarehouse`, `updateOrganization` (`lib/geocode.ts`); IP-urile Vercel partajate sunt frecvent rate-limitate; un Nominatim lent blochează acțiunea până la timeout-ul funcției.
- Tabela `public._ddl_probe` (RLS fără politici, `anon` cu toate privilegiile) — rest de test, de șters.
- `leaked password protection`, GRANT-uri ALL către `anon`/`authenticated` pe toate tabelele (inclusiv `TRUNCATE`) — se bazează exclusiv pe RLS.

---

## 3. Siguranța bazei de date (doar citire)

**RLS:** toate cele 50 de tabele din `public` au RLS activ (inclusiv `_ddl_probe`, fără politici = blocată). Tabelele `private.platform_mail_*` au RLS fără politici (intenționat: acces doar service/SECURITY DEFINER). Nu există tabel fără RLS.

**Politici prea largi (sinteză):**
- `profiles_update` (P0-1), `org_update` pe coloane de facturare (P1-3), `is_staff()` pentru tehnicieni (P0-2), `expenses_update`/`time_off_requests_update` (P1-1).
- `notifications_insert`, `audit_log_insert`, `job_alerts_insert`, `arrival_prompts_insert`: verifică doar `organization_id = current_org_id()`, nu și `profile_id` — permit notificări false către oricine (inclusiv profiluri din alte organizații, dacă UUID-ul e cunoscut) cu `title/body/link` arbitrare și intrări false în `audit_log`.
- `device_push_tokens_select/update/delete`: orice membru al organizației citește, redirecționează (UPDATE) sau șterge tokenurile FCM ale colegilor.
- `conversation_messages_member_select`: ok (depinde de `conversations` RLS); `bookings`: INSERT anon (intenționat, cu CHECK-uri + trigger `validate_booking_slot`), SELECT doar platform admin — corect.
- `booking_days`, `booking_settings`: SELECT public (intenționat, pagina de programări).

**Funcții SECURITY DEFINER apelabile de `anon`** (advisor 0028, 19 funcții). Am citit corpurile:
- Intenționate/sigure pentru anon: `taken_slots` (pagina publică de programări; expune doar `slot_start`), `ef_is_platform_admin`, `ef_preview_org`, `current_org_id`, `current_role`, `current_client_id`, `is_staff` (returnează null/false fără sesiune; folosite în politici).
- Au verificare internă (`auth.uid()` + `platform_admins` sau `profiles.role='admin'` + aceeași organizație), deci nu sunt exploatabile de anon, dar nu ar trebui expuse: `company_admin_create_employee`, `company_admin_get_employee_email`, `company_admin_reset_employee_password`, `company_admin_update_employee_email`, `platform_admin_create_company`, `platform_admin_delete_company`, `platform_admin_list_companies`, `platform_admin_list_company_users`, `platform_admin_update_company`, `create_organization_and_owner` (ambele overload-uri; pică fără `auth.uid()` valid sau dacă profilul există). Recomandare: `REVOKE EXECUTE … FROM anon, public;` și `GRANT` doar `authenticated`. Atenție: `company_admin_*` devin exploatabile imediat ce P0-1 e folosit (se auto-promovează la admin).
- Execuție de către `authenticated` care NU ar trebui: `next_invoice_number` (P1-2), `ef_close_usage`/`ef_record_usage` (au garda auth + preview, ok), `enforce_hourly_rate_admin_only` (funcție de trigger expusă ca RPC, inofensivă dar de ascuns), `my_team_ids`.

**Indexuri lipsă pe FK:** 33 (vezi P2-7). 25 de indexuri neutilizate (info; fără acțiune urgentă la volumul actual).

**Storage:** buckete `attachments` (privat, fără limită de mărime/mime) și `platform-mail-uploads` (privat, 15 MB, politici doar pentru platform admin și folder = uid — corect). Fișierele din `attachments` se servesc prin URL semnate de 1 h (`lib/storage.ts`, corect). Problema e granularitatea politicilor (P1-5). Nu există politică de retenție/ștergere pentru fișiere orfane.

**pg_cron:** `purge-old-technician-positions` (zilnic 03:00; folosește `organizations.gps_retention_days`) și `ef-usage-retention` — OK. Nu există job pentru `notifications` vechi (tabela crește nelimitat) și nici pentru `audit_log`.

**Alte observații:** `auth_leaked_password_protection` dezactivat; migrațiile din `supabase/migrations/` conțin doar 5 fișiere recente (schema de bază nu e versionată în repo — nu pot recrea mediul din repo); `db/*.sql` sunt scripturi ad-hoc.

---

## 4. Completitudine față de nevoile unui instalator gaz/electric/FV

Există: clienți + puncte de lucru + contacte, echipe/vehicule, lucrări cu checklist și poze obligatorii, calendar, hartă + GPS, materiale/scule cu stoc pe depozit/vehicul și cereri de achiziție, cheltuieli cu aprobare, pontaj simplu, concedii, mesagerie, notificări push (Android), rapoarte PDF de intervenție, programări publice, panou super-admin, AI pentru fișa tehnică.

Lipsește sau e doar schițat:
1. **Oferte / devize / contracte** — nu există modul de ofertare, deviz cu materiale+manoperă, acceptare client, conversie ofertă→lucrare→factură. Pentru FV: ofertă cu dimensionare (kWp, invertor, stocare), subvenții (Casa Verde/AFM), proces cu dosar prosumator.
2. **Facturare reală** (P1-9): TVA (inclusiv cote reduse pentru FV rezidențial), e-Factura/SPV (obligatorie în RO), PDF, serie/număr configurabil, scadențe, încasări parțiale, stornare, integrare SmartBill/Oblio/FGO (tab „Integrări" gol), plată online.
3. **Documente/formulare tehnice specifice** — procese-verbale de recepție, PV de punere în funcțiune, buletine PRAM (măsurători de izolație/priză de pământ), fișe de verificare instalații gaze (ISCIR/ANRE), declarații de conformitate, certificat de garanție, dosar de racordare ATR (Distribuție Energie), fotografii cu geotag — nu există formulare structurate, șabloane sau semnare dublă (tehnician + client) cu hash. Documentele sunt doar fișiere încărcate (`documents`), fără tipuri validate, fără termene de expirare.
4. **Autorizări/competențe** — nu se urmăresc legitimațiile ANRE/ISCIR, gradele (IIB/IIIB), scadența autorizațiilor, verificările periodice ale sculelor (PRAM, metrologie), instruirile SSM/PSI; nu se blochează alocarea unui tehnician neautorizat pe o lucrare de un anumit tip.
5. **Seriale / trasabilitate echipamente** — `materials` nu are serie/lot/garanție; nu se leagă seriile de panouri, invertoare, contoare, cazane de client/loc de consum (necesar pentru garanții și service); nu există „fișa echipamentului instalat" la client sau istoric de service pe echipament; nu există contracte de mentenanță cu scadențar și lucrări recurente (verificări periodice instalații gaze/electrice, revizie cazan anuală) — `jobs` nu are recurență.
6. **Offline** — aplicația e un WebView către site-ul live (`capacitor.config.ts`); fără conectivitate (subsoluri, centrale termice, zone rurale FV) nu poate deschide lucrarea, bifa checklist-ul, face poze, lua semnătura. Nu există coadă locală, service worker sau PWA cache (doar `manifest.json`). Este cea mai mare lipsă funcțională pentru teren.
7. **Anulare / reprogramare / istoric** — nu se poate anula sau șterge o lucrare (P3); nu există motiv de reprogramare, notificare către client (SMS/email) cu confirmare/ETA, portal client (rolul `client` există, fără UI).
8. **Pontaj legal** — fără pontaj de prezență (intrare/ieșire), fără pauze reale, fără aprobare săptămânală, fără export REVISAL/ITM, fără semnătură angajat; calculul „suplimentare" e ilustrativ.
9. **Gestiune stoc** — fără recepții (NIR), transferuri între depozit/vehicul, inventariere, alerte de stoc minim în notificări, prețuri de achiziție pe lot (există doar `unit_cost`), comenzi către furnizori (`materiale/comanda` există ca pagină, fără flux complet de recepție).
10. **Rapoarte** — `rapoarte/page.tsx` e orientat pe lucrări; nu există profitabilitate pe client/tip lucrare, rapoarte de productivitate, export Excel; PDF-ul de lucrare nu include poze, materiale, durată.
11. **Calendar** — doar mutare pe zi prin drag (`calendar/actions.ts`); nu verifică suprapuneri de program ale echipei, concedii sau capacitate; nu are drag pentru ore, fără sincronizare Google/Outlook.
12. **Audit/log** — `audit_log` există dar nu e populat de cod (grep: niciun insert); nu există jurnal de modificări pe lucrări/facturi/stocuri.

---

## 5. Verificare lanț notificări / push (`src/lib/notify.ts`, `push.ts`, `message-notify.ts`)

Ce funcționează corect: `notifyProfiles` deduplică destinatarii, scrie rândul in-app, filtrează push-ul după `notifications_enabled` + preferința pe categorie (`prefEnabled` tratează cheie lipsă = activ), mapează tipurile pe preferințe, trimite `data.url`/`jobId`; `sendPushToProfiles` nu aruncă niciodată; JWT FCM v1 semnat manual cu cache de token cu marjă de 30 s; canal Android `electrofield_alerts` identic în client și server; link-ul `/mobil/mesaje/<id>` corespunde rutei `(tabs)/mesaje/[id]`; linkurile staff `/mesaje?team=` / `?emp=` sunt tratate de pagină. În dev, RLS actual permite scrierea notificărilor pentru colegi și citirea tokenurilor din aceeași organizație, deci lanțul chiar livrează (dovedit de politici).

Probleme de logică:
1. **`push.ts:177`** — `errText.includes("NOT_FOUND")` marchează token „stale" și îl șterge (`push.ts:217-219`). FCM returnează `NOT_FOUND` și pentru `FIREBASE_PROJECT_ID` greșit/proiect șters → o configurare greșită șterge TOATE tokenurile destinatarilor, iar utilizatorii nu mai primesc push până nu redeschid aplicația. Invers, tokenurile cu `INVALID_ARGUMENT` (format invalid) nu sunt niciodată curățate. Fix: ia în calcul `error.details[].errorCode === "UNREGISTERED"` (parsează JSON), nu substring.
2. **Push sincron în Server Action** (`notify.ts:86` e `await`-at în `createJob`, `updateJob`, `sendTeamMessage`, `decidePurchaseRequest`…): OAuth + FCM (N tokenuri în `Promise.all`) adaugă sute de ms–secunde la fiecare acțiune; la OAuth blocat (`oauth2.googleapis.com` fără timeout de `fetch`) acțiunea poate rămâne agățată până la timeout-ul funcției. Fix: `after()` din `next/server` (deja folosit în `/api/programari`), `AbortSignal.timeout`.
3. **Fără timeouts** pe `fetch` către `oauth2.googleapis.com` și `fcm.googleapis.com`; fără retry/backoff pe 5xx/429.
4. **Rânduri `notifications` inserate pentru orice `profile_id`** (`notifications_insert` verifică doar organizația apelantului). `notifyProfiles` nu validează că destinatarii aparțin `input.organizationId` (de ex. `sendDirectMessage` primește `profileId` din formular, `mesaje/actions.ts:116-143`, nevalidat) → notificare/phishing cross-tenant cu `link` arbitrar; vezi P3 `notificationHref`.
5. **Mesaje:** `sendTeamMessage`/`sendDirectMessage` nu verifică eroarea de INSERT și apelează oricum `notifyConversationMessage` → notificare pentru mesaj inexistent. `sendMobileMessage` verifică (`if (error) return`). Notificarea către staff exclude doar expeditorul; un admin care scrie către echipă nu anunță ceilalți admini.
6. **`message-notify.ts:51-53`** — pentru conversație `team` destinatarii vin din `team_members` inclusiv conturi inactive; pentru `direct` nu se verifică `is_active` al destinatarului. Fără rate limit/colapsare: 10 mesaje rapide = 10 push-uri separate (fără `collapse_key`/grupare).
7. **Evenimente lipsă** (P1-8): cereri de achiziție, alerte, note „problem", finalizări, concedii, cheltuieli.
8. **Push doar pe Android/FCM** (`push-actions.ts:19`); admini pe desktop nu primesc niciodată notificări de sistem, doar clopoțel în aplicație deschisă (Realtime pe `notifications`, `topbar.tsx:62-76`).
9. **`registerPushToken`** (`push-actions.ts:6-24`): upsert pe `token` fără tratarea erorii; dacă tokenul există deja într-o altă organizație, UPDATE-ul e blocat de RLS și eșuează silențios (telefon mutat între companii nu mai primește push). În aceeași organizație oricine poate re-puncta tokenul unui coleg (UPDATE permis, P0-2/politici).
10. **`openNotification`** redirecționează către `n.link` necontrolat (vezi P3).
11. **Curățare**: `notifications` nu au retenție; badge-ul din `(app)/layout.tsx:30-39` ia 30 de notificări și calculează „necitite" doar din ele.

---

## 6. Rezumat recomandat de remediere (ordinea efortului/impactului)

1. Migrație de securitate imediată: P0-1 (REVOKE UPDATE coloane + trigger rol/organizație), P1-3, P1-2, REVOKE `anon` pe funcțiile SECURITY DEFINER.
2. Introdu `is_back_office()` și rescrie politicile sensibile (P0-2, P1-1, P1-5); matrice de permisiuni în cod (P1-4); verifică rolul în toate Server Actions.
3. Corectează fusurile orare printr-un helper unic (P1-6, P2-3); `new_plan` (P1-10); sincronizarea echipelor (P1-7); notificări către admin (P1-8); un singur flux de facturare (P1-9).
4. Gestionare erori în acțiuni, CHECK `depot_arrival`, paginare + limită pe interogări mari, indexuri FK, `loading.tsx`/`error.tsx` pe `/mobil`.
5. Planifică funcționalitățile de teren: offline, formulare PV/PRAM, seriale/garanții, mentenanță recurentă, oferte, e-Factura.
