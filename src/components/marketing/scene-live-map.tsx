import Image from "next/image";
import s from "./marketing.module.css";

// Harta live, așa cum arată în platformă (captură din contul demo), cu textul alături. Fără animații.
// Poziția continuă doar cu setarea firmei și acordul angajatului (fișa de fapte R3).
export function SceneLiveMap() {
  return (
    <section id="platforma" className={s.section}>
      <div className={`${s.wrap} ${s.shotRow}`}>
        <div className={s.shotCopy}>
          <div className={s.eyebrow}>Harta echipelor de teren</div>
          <h2 className={s.disp}>
            Știi unde este echipa ta.
            <br />
            Știi ce face.
            <br />
            <span className={s.lime}>Știi ce urmează.</span>
          </h2>
          <p>Pe harta din platformă vezi lucrările active, echipele și depozitele. Fiecare echipă apare cu starea ei: în drum, la lucrare sau disponibilă, așa că nu mai suni ca să afli în ce stadiu e o lucrare.</p>
          <ul className={s.shotList}>
            <li>Lista echipelor lângă hartă, cu lucrarea la care sunt acum.</li>
            <li>Sosirea la client se pontează cu locația, dacă telefonul o dă, ca dovadă.</li>
            <li>Poziția live apare doar dacă firma pornește urmărirea și angajatul își dă acordul.</li>
          </ul>
        </div>
        <figure className={s.shotFrame}>
          <Image src="/marketing/screen-harta.webp" alt="Harta live din ElectroField: echipele pe hartă și lista lor, cu starea fiecăreia" width={1400} height={923} sizes="(min-width: 1040px) 60vw, 100vw" />
          <figcaption>Harta live, din platformă</figcaption>
        </figure>
      </div>
    </section>
  );
}
