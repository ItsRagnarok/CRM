import Image from "next/image";
import s from "./marketing.module.css";

// Harta live, așa cum arată în platformă (captură din contul demo), cu textul alături.
export function SceneLiveMap() {
  return (
    <section id="platforma" className={s.section}>
      <div className={`${s.wrap} ${s.shotRow}`}>
        <div className={s.shotCopy} data-reveal>
          <div className={s.eyebrow}>Echipa în timp real</div>
          <h2 className={s.disp}>
            Știi unde este echipa ta.
            <br />
            Știi ce face.
            <br />
            <span className={s.lime}>Știi ce urmează.</span>
          </h2>
          <p>Fiecare echipă apare pe hartă cu starea ei: în drum, la lucrare sau disponibilă. Nu mai suni ca să afli unde a ajuns cineva.</p>
          <ul className={s.shotList}>
            <li>Lista echipelor lângă hartă, cu lucrarea la care sunt acum.</li>
            <li>Sosirea la client se pontează cu locația, ca dovadă.</li>
            <li>Urmărirea continuă pornește doar cu acordul angajatului.</li>
          </ul>
        </div>
        <figure className={s.shotFrame} data-tilt>
          <Image src="/marketing/screen-harta.webp" alt="Harta live din ElectroField: echipele pe hartă și lista lor, cu starea fiecăreia" width={1400} height={923} sizes="(min-width: 1040px) 60vw, 100vw" />
          <figcaption>Harta live, din platformă</figcaption>
        </figure>
      </div>
    </section>
  );
}
