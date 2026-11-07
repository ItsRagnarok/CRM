import { ChevronDown, Mail, Phone } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { IconTile, ScreenHeader } from "@/components/mobile/ui";

const FAQ = [
  { q: "Cum închid o lucrare?", a: "Deschide lucrarea din Lucrări. La locație apar secțiunile (fotografii, materiale, note, semnătură). Când ai terminat, apasă „Închide lucrarea”." },
  { q: "Ce fac dacă nu am semnal?", a: "Lucrezi normal pe ecranul deschis. Ce trimiți se salvează și pleacă după ce revine semnalul. Nu închide aplicația forțat și nu te deconecta până nu s-a trimis." },
  { q: "Cum scanez un bon sau o etichetă?", a: "Apasă butonul Scanează din bara de jos, alege tipul (bon, factură, etichetă, document), fă poza și salvează. Poți lega documentul de o lucrare." },
  { q: "Clientul nu e acasă și nu poate semna", a: "Pe ecranul de semnătură alege varianta fără semnătură. Lucrarea se închide, iar biroul vede că semnătura lipsește." },
  { q: "Ce fac dacă îmi lipsește un material?", a: "Din Materiale poți cere achiziția. Biroul aprobă și primești notificare. Dacă e urgent, sună la birou." },
  { q: "Cum se calculează pontajul?", a: "Automat, din „Pornește lucrul” și „Închide lucrarea”. Dacă ceva nu e corect, spune-i biroului." },
  { q: "Cine vede locația mea?", a: "Doar biroul, doar în programul tău și doar dacă ai dat consimțământul. Îl poți retrage din Setări → Locație și confidențialitate." },
];

export default async function MobileHelpPage() {
  const { organization } = await requireSessionContext();

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Ajutor și suport" back="/mobil/meniu" />
      <div className="m-bd" style={{ overflow: "visible" }}>
        <div className="m-lb">Contact birou</div>
        <div className="m-list">
          {organization.phone ? (
            <>
              <a href={`tel:${organization.phone}`} className="m-row">
                <IconTile icon={Phone} small />
                <div className="m-fl"><div className="t">Sună la birou</div><div className="d">{organization.phone}</div></div>
              </a>
              <hr className="m-sep" />
            </>
          ) : null}
          {organization.email ? (
            <>
              <a href={`mailto:${organization.email}`} className="m-row">
                <IconTile icon={Mail} small tone="g" />
                <div className="m-fl"><div className="t">Scrie un email</div><div className="d">{organization.email}</div></div>
              </a>
              <hr className="m-sep" />
            </>
          ) : null}
          {!organization.phone && !organization.email && (
            <div className="m-row m-mu m-sm">Compania nu are încă un contact de suport configurat.</div>
          )}
        </div>

        <div className="m-lb" style={{ marginTop: 6 }}>Întrebări frecvente</div>
        <div className="m-list">
          {FAQ.map((item) => (
            <div key={item.q}>
              <details>
                <summary className="m-row" style={{ cursor: "pointer", listStyle: "none" }}>
                  <div className="m-fl t" style={{ fontSize: 15, fontWeight: 700 }}>{item.q}</div>
                  <ChevronDown className="m-chev" />
                </summary>
                <p className="m-mu" style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>{item.a}</p>
              </details>
              <hr className="m-sep" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
