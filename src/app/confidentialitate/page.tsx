import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Politica de confidențialitate — ElectroField" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 text-[#1c1c22]">
      <Link href="/login" className="mb-6 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi
      </Link>

      <h1 className="text-[24px] font-extrabold">Politica de confidențialitate</h1>
      <p className="mt-1 text-[13px] text-muted-2">Ultima actualizare: {new Date().toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-[#344054]">
        <section>
          <h2 className="text-[16px] font-bold text-foreground">1. Cine suntem</h2>
          <p className="mt-1.5">
            ElectroField este o platformă software oferită companiilor de instalații electrice, CCTV, securitate,
            HVAC și fotovoltaice pentru gestionarea echipelor, lucrărilor și clienților. Compania care folosește
            ElectroField (angajatorul tău, dacă ești tehnician sau membru al unei echipe) este{" "}
            <b>operatorul de date</b> pentru informațiile introduse în platformă — ElectroField acționează ca{" "}
            <b>persoană împuternicită</b> (procesator), stocând și procesând datele în numele companiei respective.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">2. Ce date colectăm</h2>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
            <li><b>Date de cont:</b> nume, email, telefon, rol în companie.</li>
            <li>
              <b>Date de localizare (GPS):</b> poziția dispozitivului, colectată doar în timpul programului de lucru,
              pentru a afișa echipele pe hartă în timp real și a confirma sosirea la locația unei lucrări. Necesită
              consimțământul explicit al angajatului — vezi secțiunea 5.
            </li>
            <li><b>Fotografii, semnături și documente</b> încărcate în legătură cu lucrările (înainte/în timpul/după intervenție, semnătura clientului, documente de angajare).</li>
            <li><b>Date operaționale:</b> pontaj (ore de lucru, pauze, deplasări), cheltuieli, materiale folosite, facturi.</li>
            <li><b>Date tehnice:</b> jurnale de acces și erori, pentru securitate și depanare.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">3. Scopul și temeiul legal al prelucrării</h2>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
            <li>Executarea contractului de muncă / raportului de serviciu (pontaj, alocarea lucrărilor) — art. 6(1)(b) GDPR.</li>
            <li>Interesul legitim al operatorului de a coordona echipele și de a proteja bunurile companiei — art. 6(1)(f) GDPR.</li>
            <li>Consimțământul angajatului, pentru urmărirea GPS continuă — art. 6(1)(a) GDPR. Consimțământul poate fi retras oricând, fără consecințe, din aplicația mobilă (Profil → Confidențialitate & locație).</li>
            <li>Obligații legale (evidența contabilă a facturilor, registrul de pontaj).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">4. Cât timp păstrăm datele</h2>
          <p className="mt-1.5">
            Datele de poziție GPS sunt păstrate pentru perioada configurată de fiecare companie (implicit 30 de
            zile), după care sunt șterse automat printr-un proces zilnic. Fotografiile, documentele și datele de
            facturare sunt păstrate pe durata contractului dintre companie și ElectroField, plus termenele legale de
            arhivare aplicabile (ex. evidența contabilă). La încetarea contractului, compania poate solicita
            exportul sau ștergerea datelor.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">5. Urmărirea locației (GPS) — detalii pentru angajați</h2>
          <p className="mt-1.5">
            Dacă lucrezi ca tehnician sau membru al unei echipe, compania ta poate activa urmărirea GPS continuă cât
            timp ai aplicația mobilă deschisă și ești în timpul programului. Aceasta îți afișează poziția pe harta
            internă a dispeceratului și declanșează o alertă de sosire la locația unei lucrări. Urmărirea:
          </p>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
            <li>Necesită consimțământul tău explicit, acordat din aplicație — nu pornește automat.</li>
            <li>Poate fi retras oricând, din Profil → Confidențialitate & locație, fără nicio consecință asupra angajării tale.</li>
            <li>Nu are loc în afara orelor de lucru sau când aplicația/telefonul e închis.</li>
            <li>Este ștearsă automat după perioada de retenție stabilită de companie.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">6. Drepturile tale</h2>
          <p className="mt-1.5">
            Conform GDPR, ai dreptul de acces, rectificare, ștergere, restricționare a prelucrării, portabilitate a
            datelor și opoziție. Pentru date legate de locul de muncă, aceste drepturi se exercită față de compania
            angajatoare (operatorul de date). Pentru întrebări legate de platforma ElectroField în sine, ne poți
            scrie la <a href="mailto:contact@alpora.ro" className="font-semibold text-electric">contact@alpora.ro</a>.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">7. Securitatea datelor</h2>
          <p className="mt-1.5">
            Datele sunt stocate criptat, izolate pe fiecare companie (o companie nu poate accesa niciodată datele
            alteia), iar accesul la fotografii, documente și semnături se face exclusiv prin legături temporare,
            autentificate, generate la cerere.
          </p>
        </section>
      </div>
    </div>
  );
}
