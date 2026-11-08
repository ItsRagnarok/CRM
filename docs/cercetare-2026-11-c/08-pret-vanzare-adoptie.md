# Preț, vânzare și adopție la firme mici de instalații (România)

Data: 2026-11-08. Nu repet structura de planuri din `abonamente-si-valoare.md` și ideile de modul/onboarding din `decizie-tema-module-adoptie.md`. Marcaje: **[S]** = sursă citată, dar de obicei pagină de comparație sau blog de vendor; **[E]** = estimare/ipoteză a mea. Curs folosit: ~5,2 lei/EUR (pagină ZF din rezultate; orientativ).

## Limita cercetării (important)

Nu am găsit niciun studiu independent despre cât plătesc instalatorii români pentru software de teren, nici date despre canale de achiziție (grupuri Facebook, ANRE, distribuitori, contabili) sau despre abandon în acest segment. Tot ce urmează despre canale și comportament de plată e **[E]** și se validează în pilot.

## 1. Ce au deja în cap patronii: facturarea e ieftină

- Oblio: un singur abonament, 29 EUR/an (~2,5 EUR/lună, ~13 lei/lună), utilizatori nelimitați, include e-Factura [S: [quasa.io](https://quasa.io/ro/media/oblio-sau-smartbill-29-eur-pe-an-nu-cumpara-acelasi-ecosistem)]. Pagină terță, prețul oficial neverificat.
- SmartBill: o comparație dă 103,44 EUR/an + TVA pentru planul Gold [S: [quasa.io](https://quasa.io/ro/media/smartbill-sau-oblio-factura-ieftina-devine-scumpa-cand-magazinul-creste)]; un agregator dă „de la 25 RON/utilizator/lună" [S: [subger](https://subger.com/ar/service/smartbill-ro)]. Neconfirmat pe smartbill.ro.
- Consecință **[E]**: ancora de preț a patronului pentru „un program" este 13–100 lei/lună. 299 lei/lună e de 3–20 de ori mai mult și nu se justifică prin „facturare", ci prin ore și bani recuperați (materiale pierdute, lucrări nefacturate, deplasări). Vânzarea trebuie să înceapă de la costul pierdut, nu de la funcții.
- Singurul număr românesc de piață: IMM-urile investesc 1.000–5.000 EUR în soft „ready to use" și 7.000–12.000 EUR în soluții custom (declarația unui vendor, NextUp) [S: [Economica](https://www.economica.net/roxana-epure-nextup-dezvoltator-de-solutii-software-imm-urile-din-romania-nu-mai-spera-la-fondurile-nerambursabile-pentru-digitalizare-si-investesc-din-surse-proprii-intre-1-000-si-12-000-euro-pr_598345.html/amp)]. Nu e specific instalatorilor. Un studiu pe 400 de IMM-uri: ~jumătate au digitalizat ceva în 3 ani, cel mai des contabilitate (57%) și pontaj (43%) [S: rezultat de căutare, original Cult Research neverificat].

## 2. Comparație cu prețurile din UE/SUA pentru field service

| Produs | Preț raportat | Echivalent per utilizator | Sursă |
| --- | --- | --- | --- |
| Tradify | 47 / 51 / 61 USD per utilizator/lună | ~47–61 USD | [Capterra](https://www.capterra.com/p/152413/Tradify/pricing/) |
| Jobber | ~39 USD (1 utilizator); Connect ~129 USD; +29 USD/utilizator suplimentar | variabil | [superdupr](https://superdupr.com/blog/jobber-vs-housecall-pro) (surse contradictorii) |
| Housecall Pro | ~59 USD/utilizator (anual); MAX ~329 USD pentru 8 | ~41–59 USD | idem |
| Plancraft (DE, preț fix) | de la 74,90 EUR/lună | n/a | [Capterra](https://www.capterra.ca/reviews/1029241/plancraft) |
| ServiceTitan | ~245–398 USD/tehnician + implementare 5.000–50.000 USD | enterprise | [costbench](https://costbench.com/compare/housecall-pro-vs-servicetitan/) |
| **ElectroField Standard** | 299 lei (~57 EUR) pentru 5 utilizatori | **~11–12 EUR** | oferta noastră |
| **ElectroField Pro** | 599 lei (~115 EUR) pentru 15 | **~7–8 EUR** | oferta noastră |

Concluzie **[E]**: suntem la ~20–25% din prețul pe utilizator al produselor occidentale pentru echipe mici. Nu avem datele necesare ca să spunem că „e prea ieftin": puterea de cumpărare și ancora Oblio/SmartBill sunt mult mai mici. Nu recomand scădere de preț. Recomand testarea cu 2–3 firme a lui 299 ca punct de plecare, nu a unui preț mai mic. Majoritatea cifrelor de mai sus vin de pe site-uri de comparație/afiliate și se contrazic între ele.

## 3. Structura de preț: pe modul vs pe utilizator

- Vendorii de teren combină niveluri + utilizatori suplimentari + module opționale; riscul numit în surse este costul add-on-urilor care „se umflă" [S: [superdupr](https://superdupr.com/blog/jobber-vs-housecall-pro)]. Pe un patron nedigital, o factură cu 4 linii e un motiv de renunțare **[E]**.
- Recomandare **[E]**: **plan per companie cu utilizatori incluși** (așa cum e deja decis), **pachetul domeniului ales inclus în plan** (nu vândut separat), al doilea domeniu ca o singură linie de adaos. Fără prețuri per modul în ofertă. Prețul per utilizator suplimentar e o a doua linie, unică.

## 4. Plata în avans / anual

- Benchmark SaaS general: reducerea tipică pentru plata anuală e ~15–20% („două luni gratis" = 16,7%) [S: [Monetizely](https://www.getmonetizely.com/articles/strategic-saas-pricing-models-leveraging-annual-plans-and-pre-payments-for-stronger-cash-flow)].
- Pentru IMM-uri mici sub 299 USD/lună, 70–80% preferă plata lunară și aleg anualul abia după luni de folosire [S: [SaaStr](https://www.saastr.com/saas-companies-percentage-customers-choose-prepaid-annual-billing-versus-monthly)]. Nu e date românești. Nu am găsit date despre comportamentul firmelor românești la prepay. **[E]** (din experiența generală, neverificată): factura pe card/transfer lunar e acceptată dacă există factură fiscală; avansul pe 12 luni cere încredere deja construită.
- Recomandare: lunar implicit, anual cu 2 luni gratuite oferit **după** luna 3, nu la semnare.

## 5. Canale (toate [E], nevalidate)

Prioritate pentru primele 10 clienți:
1. **Recomandarea din rețeaua fondatorului și a primilor piloți** (cel mai ieftin, cel mai credibil pentru un produs cu configurare asistată).
2. **Contabilii firmelor** ca prescriptori: au relația și știu cât plătește firma pe soft. Oferă un comision/recomandare simplă, de ex. o lună gratuită per client adus. Atenție: să nu devină un acord ascuns, comisionul se declară clientului.
3. **Grupuri de Facebook de instalatori** și comunități de ANRE/instalatori: doar răspunsuri utile și demo-uri, nu spam; regulile fiecărui grup se verifică.
4. **Distribuitori de materiale**: valoros ca vitrină (flyer lângă casă), dar au interese proprii; abordare după ce ai 3 referințe.
5. Târguri/asociații: cost mare de timp, rezultat incert; ultimul.

## 6. Onboarding pentru patroni nedigitali și abandon

- Cauza principală documentată în general: abandon înainte de prima valoare, din cauza configurării și a formularelor lungi [S: [Saasfactor](https://www.saasfactor.co/blogs/why-users-drop-off-during-onboarding-and-how-to-fix-it)] (blog de vendor). Modelul de churn: ~4% în prima lună, apoi ~0,5%/lună [S: [Heap](https://heap.io/blog/how-much-should-i-discount-for-prepaid-saas-contracts)], ipoteză de model, nu măsurătoare.
- Nu am găsit date despre trial vs. pilot plătit. Singura indicație: șoc la prețul anual după un trial reușit la firme mici [S: [Clarity.fm](https://clarity.fm/questions/1252)] (anecdotic).
- **[E]** Practic: demo pe WhatsApp (video 5 minute + o lucrare reală completată de noi), configurare făcută de noi înainte de prima zi, tehnicianii instalează aplicația în prezența noastră, primul raport PDF livrat clientului final în prima săptămână. Riscul clasic: patronul plătește, dar tehnicienii nu folosesc aplicația. Prag de alarmă: sub 3 din 5 utilizatori activi în săptămâna 2.

## 7. GDPR, contract, DPA

Firma client este operator, ElectroField este persoană împuternicită pentru datele clienților ei finali și ale angajaților; art. 28 alin. (3) GDPR cere contract scris, iar clauzele standard pot fi baza lui [S: [EDPB-EDPS opinion, RO](https://www.edpb.europa.eu/system/files/2021-04/edpb-edpsjointopinion01_2021_sccs_c_p_ro.pdf)]. Nu am găsit un model oficial ANSPDCP; un set de clauze model de la CNIL există ca referință [S: [datenrecht.ch](https://datenrecht.ch/en/cnil-leitfaden-fuer-auftragsverarbeiter/)]. **[E]** Minimul pachetului contractual, de redactat/verificat cu un jurist: (1) Termeni de utilizare cu preț, perioadă, reziliere, export de date la încheiere; (2) DPA cu obiect, tip de date, instrucțiuni, confidențialitate, securitate, ștergere/returnare, audit; (3) lista sub-procesatorilor (hostingul, baza de date, email/push) cu locația lor, de verificat din contractele reale; (4) clauză pentru GPS/pontaj: clientul trebuie să-și informeze angajații, iar monitorizarea locației are condiții legale în dreptul muncii român, de confirmat cu jurist; (5) fiind PFA neplătitor de TVA, factura reflectă asta; schimbarea statutului se reflectă în contract.

## 8. Recomandare concretă

| | Standard | Pro |
| --- | --- | --- |
| Preț | **299 lei/lună** (fără TVA) | **599 lei/lună** |
| Utilizatori incluși | 5 | 15 |
| Domeniu | un pachet (electric / gaze / PV) inclus | toate domeniile incluse |
| Utilizator suplimentar | 39 lei/lună **[E, de testat]** | 39 lei/lună |
| Al doilea domeniu | +99 lei/lună **[E]** | inclus |
| Anual | 10 luni plătite, oferit din luna 3 | idem |
| Configurare | 1.000 lei unică, dedusă din lună 1 dacă firma continuă 3 luni **[E]** | 1.500–2.000 lei |

Reducerea configurării condiționată de 3 luni transformă pilotul într-un angajament mic, fără trial „gratis" fără miză. Nu schimb nivelurile de preț înainte de rezultatele pilotului.

## 9. Plan de pilot (6 săptămâni, 3 firme, câte una pe domeniu)

- **Săpt. 0:** contract + DPA simplu semnate; măsurare de bază (minute de planificare/zi, apeluri de status, lucrări fără PV, întârziere până la facturare).
- **Săpt. 1:** configurare + import de date de noi; instruire la fața locului/video.
- **Săpt. 2–5:** 299 lei/lună (sau 599 pentru firma mare). Verificare săptămânală de 15 minute pe WhatsApp.
- **Săpt. 6:** decizie de continuare + discuție de preț: întrebăm direct „la ce preț ați renunța? la ce preț ați părea că e prea ieftin?" (Van Westendorp simplificat).
- **Criterii de oprire/continuare scrise dinainte:** ≥60% din utilizatori activi în săpt. 2; ≥1 lucrare completă cu PDF predat în prima săptămână; ≥2 din 3 firme continuă la preț plin; motivele fiecărui abandon se notează.
- **Ce învățăm și nu știm azi:** prețul real acceptat, canalul care aduce clienți, costul real de suport/configurare (dacă depășește 4–6 ore/firmă, tariful de configurare crește).
