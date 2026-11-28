import Image from "next/image";
import s from "./marketing.module.css";

// Aplicația tehnicianului, din capturi reale (cont de test Electrogaze). Fără animații legate de derulare.
const POINTS = [
  { h: "Lucrările zilei, în ordine.", p: "Ora, clientul, adresa și starea fiecărei lucrări, pe zile." },
  { h: "Clientul și locația, dintr-o privire.", p: "Telefonul clientului și navigarea spre adresă, fără apeluri la birou." },
  { h: "Pașii lucrării, bifați pe loc.", p: "Pregătire, drum, pe loc, închidere: checklist, poze înainte și după, semnătura clientului." },
  { h: "Totul ajunge la birou.", p: "Ce face tehnicianul apare imediat în platformă, gata de facturat." },
];

export function ScenePhoneDashboard() {
  return (
    <section id="aplicatie-dashboard" className={s.section}>
      <div className={`${s.wrap} ${s.appRow}`}>
        <div className={s.shotCopy}>
          <div className={s.eyebrow}>Aplicația tehnicianului</div>
          <h2 className={s.disp}>
            Tehnicianul vede exact
            <br />
            <span className={s.lime}>ce are de făcut.</span>
          </h2>
          <ul className={s.appPoints}>
            {POINTS.map((pt) => (
              <li key={pt.h}>
                <b>{pt.h}</b>
                <span>{pt.p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={s.appPhones}>
          <figure className={s.realPhone}>
            <Image src="/marketing/phone-lucrari.webp" alt="Lista de lucrări a săptămânii în aplicația tehnicianului" width={640} height={1090} sizes="(min-width: 1040px) 280px, 45vw" />
            <figcaption>Lucrările săptămânii</figcaption>
          </figure>
          <figure className={s.realPhone}>
            <Image src="/marketing/phone-lucrare.webp" alt="Fișa unei lucrări în aplicație: progresul pe pași, clientul, adresa și ce trebuie făcut" width={640} height={1090} sizes="(min-width: 1040px) 280px, 45vw" />
            <figcaption>Fișa unei lucrări</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
