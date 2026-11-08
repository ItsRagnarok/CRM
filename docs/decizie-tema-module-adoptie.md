# Temă, module pe domenii și adopție: cercetare și recomandare

Data: 2026-11-08. Nimic din acest document nu e implementat. E baza pentru decizie.

Bazat pe: codul actual (inspectat), cele 16 rapoarte din `docs/cercetare-2026-11/` și `docs/cercetare-2026-11-b/`, `docs/abonamente-si-valoare.md`, `docs/analiza-continut-platforma.md` și o căutare web scurtă (sursele sunt la final, majoritatea sunt bloguri de vendori; le tratez ca orientative).

## 1. Ce există acum (verificat în cod)

- Domeniile alese la crearea contului sunt păstrate în `organizations.enabled_domains` (electric, gaze, fotovoltaic). Singurul lucru pe care îl controlează azi: **formularele tehnice** și lista de domenii la o lucrare nouă. Meniul, panourile și funcțiile nu depind de ele.
- Nu există un mecanism de „module” sau „funcții active pe firmă". Planurile (`subscription_plan`) nu controlează nicio funcție.
- Teme: platforma folosește albastru (`--color-electric: #3b82f6`) cu sidebar grafit. Site-ul, login-ul și aplicația tehnicianului folosesc lime (#c6ff4a). Logo-ul e acum lime.
- Culoarea albastră e folosită prin clase Tailwind: `border-electric` 144 de locuri, `text-electric` 91, `bg-electric` 68, `bg-electric-soft` 34, în 57 de fișiere. Alb pe albastrul actual are contrast **3,68:1**, sub pragul WCAG AA (4,5:1) pentru text normal.

## 2. Tema

Contrast calculat:

| Combinație | Contrast |
|---|---|
| Lime pe alb | **1,18:1** (nu se poate folosi ca text sau ca margine pe fundal alb) |
| Text închis (#0a0d0a) pe lime | 16,56:1 |
| Lime pe sidebar grafit | 14,37:1 |
| Verde-măsliniu #3f6212 pe alb (pentru linkuri/text) | 7,08:1 |
| Verde-măsliniu #4d7c0f pe alb | 4,99:1 |

Opțiuni:

- **A. Rămâne albastru.** Zero muncă, dar nu se potrivește cu logo-ul și cu site-ul; contrastul actual e sub AA.
- **B. Lime ca accent, conținut deschis, sidebar grafit (recomandat).** Butoanele și starea activă sunt lime cu text închis; linkurile, marginile de focus și iconițele pe alb folosesc verde-măsliniu (#3f6212). Același limbaj ca în mockup (panourile 1–22) și ca în aplicația tehnicianului. Tabelele dense rămân pe alb, deci lizibile.
- **C. Platformă complet întunecată.** Se potrivește cu site-ul, dar tabelele și formularele lungi obosesc la birou. Modul întunecat există deja ca opțiune (comutator de temă), deci nu trebuie să fie singura variantă.

Cum se face B fără să strici nimic: se schimbă tokenii din `globals.css` (`--color-electric` devine verde-măsliniu pentru text/margini, un token nou `--color-accent` lime pentru fundaluri) și o regulă globală care pune text închis pe orice `bg-electric` (CSS necalificat bate stratul de utilitare Tailwind, deci nu rămâne nicăieri alb pe lime). Estimare: câteva ore, cu verificare vizuală pe fiecare pagină principală. Risc: pagini cu culori hardcodate; se prind la verificare.

Admin (Super Admin) are propria paletă violet; propun să rămână, ca să nu fie confundat cu platforma firmelor.

## 3. Cum împachetăm cele trei domenii

Trei variante:

1. **Trei produse separate.** Trei baze de cod sau trei aplicații. Costisitor de întreținut, iar firmele care fac două domenii ar plăti și migra dublu. Nu recomand.
2. **O bază comună + module pe firmă (recomandat).** Un singur cod. Ce vede fiecare firmă e decis de date: domeniile alese și, opțional, opțiuni extra activate. La fel fac vendorii de câmp (nivele + module opționale, 3–5 module nucleu, un meniu mic; sursele de mai jos).
3. **Construim acum doar baza și adăugăm funcții după.** E de fapt varianta 2 făcută în etape. Modulele noi se adaugă ulterior fără schimbări de structură, dacă mecanismul de module există de acum.

Recomandarea: **2, livrată în etape.** Baza acoperă ce folosesc toate cele trei (clienți, lucrări, calendar, echipe, aplicația, pontaj, materiale, mesaje, documente, rapoarte, facturare către birou, registru de conformitate). Fiecare domeniu adaugă un pachet:

| Pachet | Ce adaugă peste bază |
|---|---|
| Electrice | formulare de măsurători, buletine/procese-verbale cu semnatar autorizat, lucrări ascunse documentate, aparate cu calibrare, marjă pe lucrare |
| Gaze | scadențar pe bloc → scară → apartament, verificări și revizii, legitimații, PV cu rezultatul stabilit de instalator |
| Fotovoltaice | dosar pe etape, ceas pentru termenele operatorului (editabile), ATR, AFM, garanții și service anual |

### Mecanismul tehnic (mic, făcut o singură dată)

- Un registru de module în cod (`src/lib/modules.ts`): id, nume, domeniul de care depinde, dacă e în bază sau opțiune extra.
- În baza de date: `organizations.enabled_domains` există deja; se adaugă `enabled_modules text[]`. La creare, modulele se completează din domeniile alese; Super Admin poate bifa opțiuni extra.
- Un helper pe server (`requireModule("scadentar_gaze")`) și unul pentru meniu. Atenție: asta e **limitare comercială, nu securitate**. Datele rămân protejate de RLS pe organizație; modulul doar ascunde ecrane și blochează acțiuni.
- Formularul „Companie nouă" din Super Admin: pasul 1 domenii (cum e acum), pasul 2 lista de module propusă (bifate automat, poți debifa sau adăuga), pasul 3 plan/preț.
- Schimbarea ulterioară: Super Admin poate activa un modul pentru o firmă fără să atingă datele; dezactivarea ascunde fără să șteargă.

### Preț

Ai spus că plata depinde de ce alege firma. Nu decid eu prețul, dar structura care se potrivește cu mecanismul: **bază + pachet per domeniu**. Atenție la regula din surse: nu vinde același lucru și în pachet, și separat, ca să nu se anuleze una pe alta. Planurile actuale (Standard 299 / Pro 599, pe utilizatori) trebuie rediscutate față de această structură.

## 4. Ce funcții noi, în ce ordine, și ce le face să fie folosite

Criteriul: a doua zi după primirea contului firma are un motiv să deschidă platforma. Evaluare după frecvența de folosire, dovada din cercetare și efort.

| # | Funcție | Domeniu | Frecvență | Dovadă | Efort | Ce trebuie ca să fie folosită |
|---|---|---|---|---|---|---|
| 1 | Registru de conformitate cu alerte (legitimații, autorizații, aparate, mașini, instructaj) | Toate | Săptămânal, prin notificare | Citat în mai multe rapoarte; transversal | Mic–mediu | Alertele ajung ca push și email; blocarea semnării cu legitimație expirată |
| 2 | Scadențar gaze pe bloc/scară/apartament | Gaze | Zilnic în campanii | Munca vine în valuri, la asociații | Mediu | **Import** din Excel al blocurilor/apartamentelor la creare; fără import, nimeni nu introduce 54 de apartamente |
| 3 | Dosar fotovoltaic + ceas operator | Fotovoltaice | Zilnic | Întârzieri la ATR/contor; termenele diferă între surse | Mediu | Etape implicite precompletate; termenele operatorului sunt setări ale firmei |
| 4 | Status pentru client, fără cont | Toate | La fiecare lucrare | Clienții nu află stadiul | Mic | Link trimis automat la programare și la finalizare |
| 5 | Situații pe etape, retenții, marjă pe lucrare | Electrice, construcții | Lunar | Sursă mai slabă, de validat | Mare | Doar după ce 2–3 firme confirmă că vor să-l folosească |

Reguli pentru ca să nu rămână funcții nefolosite:

- **Noi facem configurarea.** Super Admin creează contul, alege modulele și încarcă datele inițiale (clienți, blocuri, aparate). Mulți utilizatori renunță înaintea primei valori din cauza configurării și a formularelor lungi (sursele de onboarding de mai jos), deci prima valoare trebuie să apară din prima zi fără ca firma să construiască nimic.
- **Un flux de onboarding separat pe rol**: administratorul vede configurarea, tehnicianul vede doar „lucrarea ta de azi". O singură experiență pentru toți încetinește activarea.
- **Măsurăm adopția pe modul**, nu doar logările: deja există `UsageTracker`; se adaugă evenimente pe modul (ex. „scadență creată", „alertă primită", „dosar mutat de etapă").
- **Pilot înainte de a construi tot**: 2–3 firme reale, câte una pe domeniu, 4 săptămâni, cu criterii de oprire scrise înainte (ex. dacă nimeni nu deschide scadențarul în a doua săptămână, nu continuăm cu el).
- **Web Push** înainte de alerte: fără el, adminii și iPhone-urile nu primesc alertele pe care se bazează funcțiile 1–3.

## 5. Ce nu știm (și cum aflăm)

- Termenele legale (verificare/revizie gaze, ATR, valabilități) nu au putut fi confirmate pe text oficial. Rămân setări editabile, validate cu un jurist.
- Nu există sondaj românesc despre ce folosesc firmele azi. Cele 8–10 interviuri rămân cel mai important pas înainte de funcțiile 4–5.
- Prețul acceptabil e o ipoteză netestată.
- Sursele web despre prețuri și onboarding sunt bloguri de vendori și estimări; nu sunt benchmark-uri.

## 6. Decizii pentru tine

1. Tema: B (lime pe conținut deschis, sidebar grafit), A sau C?
2. Structura: bază + pachet pe domeniu, cu opțiuni extra bifabile de Super Admin?
3. Ordinea: începem cu registrul de conformitate și Web Push?
4. Pilot: cu ce firme (și Proconstructo ca prima de gaze)?
5. Prețul: pe pachete, cum ai descris, sau rămân planurile Standard/Pro?

## Surse web (orientative)

- [Field service software pricing 2026 (Fieldproxy)](https://www.fieldproxy.ai/resources/blog/field-service-software-pricing-comparison-2026-real-costs-hidden-fees-)
- [FieldEdge: niveluri + module opționale (ERP Research)](https://www.erpresearch.com/erp-add-ons/field-service/fieldedge/pricing)
- [SaaS add-ons: când includem, când vindem separat (Dodo Payments)](https://dodopayments.com/blogs/saas-add-ons-pricing-strategy)
- [Modular pricing model (Monetizely)](https://www.getmonetizely.com/articles/what-is-a-modular-pricing-model-a-guide-for-saas-executives)
- [Time-to-value și retenție (TaskRay)](https://taskray.com/time-to-value-saas-onboarding-retention/)
- [De ce renunță utilizatorii în onboarding (Saasfactor)](https://www.saasfactor.co/blogs/why-users-drop-off-during-onboarding-and-how-to-fix-it)
