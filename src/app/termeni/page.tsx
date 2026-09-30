import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Termeni și condiții — ElectroField" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 text-[#1c1c22]">
      <Link href="/login" className="mb-6 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted">
        <ArrowLeft className="h-3.5 w-3.5" /> Înapoi
      </Link>

      <h1 className="text-[24px] font-extrabold">Termeni și condiții</h1>
      <p className="mt-1 text-[13px] text-muted-2">Ultima actualizare: {new Date().toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-[#344054]">
        <section>
          <h2 className="text-[16px] font-bold text-foreground">1. Obiectul serviciului</h2>
          <p className="mt-1.5">
            ElectroField este o platformă software-as-a-service pentru gestionarea echipelor de teren, lucrărilor,
            clienților, materialelor și facturării, destinată companiilor de instalații electrice, CCTV, securitate,
            HVAC și fotovoltaice. Prin crearea unui cont, compania ta (organizația) devine parte la acești termeni.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">2. Contul și responsabilitatea organizației</h2>
          <p className="mt-1.5">
            Persoana care creează organizația devine administratorul acesteia și este responsabilă pentru invitarea
            și gestionarea angajaților, pentru corectitudinea datelor introduse (clienți, facturi, pontaj) și pentru
            obținerea consimțământului angajaților acolo unde platforma îl cere (ex. urmărirea GPS continuă).
            Fiecare organizație vede și poate accesa exclusiv propriile date — izolarea între companii este garantată
            tehnic la nivel de bază de date.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">3. Date introduse în platformă</h2>
          <p className="mt-1.5">
            Organizația rămâne proprietara tuturor datelor introduse (clienți, lucrări, fotografii, facturi, date de
            pontaj). ElectroField prelucrează aceste date exclusiv pentru a furniza serviciul și nu le folosește în
            alte scopuri. Prelucrarea datelor cu caracter personal este descrisă în{" "}
            <Link href="/confidentialitate" className="font-semibold text-electric">Politica de confidențialitate</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">4. Disponibilitatea serviciului</h2>
          <p className="mt-1.5">
            Depunem eforturi rezonabile pentru a menține platforma disponibilă și funcțională, dar nu garantăm
            funcționare neîntreruptă. Platforma este într-o etapă activă de dezvoltare — funcționalități pot fi
            adăugate, modificate sau eliminate, iar utilizatorii vor fi informați despre schimbări semnificative.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">5. Facturarea internă</h2>
          <p className="mt-1.5">
            Modulul de facturare din platformă este momentan o evidență internă (nu emite facturi fiscale oficiale
            cu serie fiscală sau e-Factura) — organizația rămâne responsabilă pentru emiterea documentelor fiscale
            conforme legislației prin propriile mijloace sau prin integrări externe, unde sunt disponibile.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">6. Încetarea contului</h2>
          <p className="mt-1.5">
            Organizația poate solicita oricând exportul sau ștergerea datelor. La încetarea contractului, datele pot
            fi păstrate pentru o perioadă rezonabilă în scop de arhivare/conformitate legală, apoi șterse.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-foreground">7. Contact</h2>
          <p className="mt-1.5">
            Pentru întrebări despre acești termeni, ne poți scrie la{" "}
            <a href="mailto:contact@alpora.ro" className="font-semibold text-electric">contact@alpora.ro</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
