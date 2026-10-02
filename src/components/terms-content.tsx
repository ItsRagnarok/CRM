// Single source of truth for the Terms & Conditions text, used both by the
// public /termeni page and by the mandatory /accepta-termeni acceptance
// screen — so the two can never drift out of sync with each other.
export function TermsContent() {
  return (
    <div className="flex flex-col gap-6 text-[14px] leading-relaxed text-[#344054]">
      <section>
        <h2 className="text-[16px] font-bold text-foreground">1. Obiectul serviciului</h2>
        <p className="mt-1.5">
          ElectroField este o platformă software-as-a-service pentru gestionarea echipelor de teren, lucrărilor,
          clienților, materialelor și facturării, destinată companiilor de instalații electrice, CCTV, securitate,
          HVAC și fotovoltaice. Prin crearea unui cont și prin bifarea acordului de mai jos, compania ta
          (organizația) devine parte la acești termeni, iar accesul la platformă este condiționat de această
          acceptare.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">2. Contul și responsabilitatea organizației</h2>
        <p className="mt-1.5">
          Persoana care creează organizația sau care are rolul de administrator reprezintă compania și acceptă
          acești termeni în numele ei. Administratorul este responsabil pentru invitarea și gestionarea angajaților,
          pentru corectitudinea datelor introduse (clienți, facturi, pontaj) și pentru obținerea consimțământului
          angajaților acolo unde platforma îl cere (ex. urmărirea GPS continuă). Fiecare organizație vede și poate
          accesa exclusiv propriile date — izolarea între companii este garantată tehnic la nivel de bază de date.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">3. Date introduse în platformă</h2>
        <p className="mt-1.5">
          Organizația rămâne proprietara tuturor datelor introduse (clienți, lucrări, fotografii, facturi, date de
          pontaj). ElectroField prelucrează aceste date exclusiv pentru a furniza serviciul și nu le folosește în
          alte scopuri. Prelucrarea datelor cu caracter personal este descrisă în{" "}
          <a href="/confidentialitate" className="font-semibold text-electric">
            Politica de confidențialitate
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">4. Proprietate intelectuală și utilizare interzisă</h2>
        <p className="mt-1.5">
          Platforma ElectroField, inclusiv codul sursă, structura bazei de date, interfața, designul, denumirile,
          logo-ul, documentația și orice funcționalitate a sa, sunt proprietatea exclusivă a ElectroField și sunt
          protejate de legislația privind drepturile de autor și proprietatea intelectuală. Organizația și
          utilizatorii săi primesc doar un drept de utilizare a serviciului, nu un drept de proprietate asupra
          platformei.
        </p>
        <p className="mt-1.5">Este strict interzis, pentru organizație și pentru oricare dintre utilizatorii săi:</p>
        <ul className="mt-1.5 list-disc pl-5">
          <li>
            copierea, decompilarea, ingineria inversă sau extragerea codului sursă, a structurii bazei de date ori a
            logicii interne a platformei;
          </li>
          <li>
            folosirea platformei, a conținutului ei sau a informațiilor obținute prin utilizarea ei pentru a
            construi, dezvolta sau comanda unei terțe părți dezvoltarea unui produs sau serviciu similar sau
            concurent;
          </li>
          <li>
            revânzarea, sublicențierea sau punerea la dispoziția unor terți a accesului la platformă fără acordul
            scris al ElectroField;
          </li>
          <li>
            extragerea automatizată (scraping) a datelor, ecranelor sau fluxurilor platformei în alte scopuri decât
            folosirea normală a serviciului.
          </li>
        </ul>
        <p className="mt-1.5">
          Încălcarea acestor prevederi îndreptățește ElectroField să suspende imediat accesul organizației și să
          solicite repararea prejudiciului cauzat, conform legii.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">5. Disponibilitatea serviciului</h2>
        <p className="mt-1.5">
          Depunem eforturi rezonabile pentru a menține platforma disponibilă și funcțională, dar nu garantăm
          funcționare neîntreruptă. Platforma este într-o etapă activă de dezvoltare — funcționalități pot fi
          adăugate, modificate sau eliminate, iar utilizatorii vor fi informați despre schimbări semnificative.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">6. Facturarea internă</h2>
        <p className="mt-1.5">
          Modulul de facturare din platformă este momentan o evidență internă (nu emite facturi fiscale oficiale cu
          serie fiscală sau e-Factura) — organizația rămâne responsabilă pentru emiterea documentelor fiscale
          conforme legislației prin propriile mijloace sau prin integrări externe, unde sunt disponibile.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">7. Refuzul termenilor și suspendarea accesului</h2>
        <p className="mt-1.5">
          Acceptarea acestor termeni este obligatorie pentru a folosi platforma. Dacă organizația refuză acești
          termeni, contul companiei este suspendat imediat, iar niciun utilizator din organizație nu mai poate
          accesa platforma până la o nouă acceptare. Platforma admin (ElectroField) poate verifica oricând, pentru
          fiecare companie, dacă și când termenii au fost acceptați sau refuzați.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">8. Încetarea contului</h2>
        <p className="mt-1.5">
          Organizația poate solicita oricând exportul sau ștergerea datelor. La încetarea contractului, datele pot
          fi păstrate pentru o perioadă rezonabilă în scop de arhivare/conformitate legală, apoi șterse.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-foreground">9. Contact</h2>
        <p className="mt-1.5">
          Pentru întrebări despre acești termeni, ne poți scrie la{" "}
          <a href="mailto:contact@alpora.ro" className="font-semibold text-electric">
            contact@alpora.ro
          </a>
          .
        </p>
      </section>
    </div>
  );
}
