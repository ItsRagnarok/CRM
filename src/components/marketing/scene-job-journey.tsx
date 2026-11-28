import Image from "next/image";
import s from "./marketing.module.css";

// Drumul unei lucrări, pe pași reali din platformă: pe telefon pașii stau unul sub altul, pe calculator
// pe un rând; apar pe rând la derulare.
const STEPS = [
  { h: "Programare", p: "Biroul pune lucrarea în calendar, cu clientul, adresa și echipa." },
  { h: "Tehnician alocat", p: "Echipa o vede pe telefon, cu ce are de luat din depozit." },
  { h: "Plecare", p: "Plecarea se pontează; clientul primește „echipa e pe drum”." },
  { h: "Navigație", p: "Adresa se deschide direct în aplicația de hartă." },
  { h: "Sosire", p: "Sosirea se pontează cu locația, ca dovadă." },
  { h: "Execuție", p: "Poze înainte și după, checklist, măsurători." },
  { h: "Finalizare", p: "Semnătura clientului, documentele și factura din ore și materiale." },
];

export function SceneJobJourney() {
  return (
    <section id="cum-functioneaza" className={`${s.section} ${s.journeySection}`}>
      <div className={s.journeyBg}>
        <Image src="/marketing/pylons.jpg" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
      </div>
      <div className={s.journeyBgScrim} />
      <div className={s.wrap}>
        <div className={s.eyebrow}>O lucrare, de la A la Z</div>
        <div className={s.secHead} data-reveal>
          <h2 className={s.disp}>
            De la prima programare
            <br />
            până la <span className={s.lime}>ultima factură.</span>
          </h2>
          <p>Fiecare etapă a unei lucrări, urmărită automat, fără hârtii și fără telefoane.</p>
        </div>
        <ol className={s.journeyList}>
          {STEPS.map((step, i) => (
            <li key={step.h} className={s.journeyItem} data-reveal>
              <span className={s.journeyNum}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className={s.journeyH}>{step.h}</h3>
                <p className={s.journeyP}>{step.p}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
