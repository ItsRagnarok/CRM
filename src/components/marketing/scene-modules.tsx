import Image from "next/image";
import Link from "next/link";
import { Briefcase, Users, CalendarDays, Package, Wallet, BarChart3, FileText, Clock } from "lucide-react";
import s from "./marketing.module.css";

// Modulele platformei, ca grilă simplă, fiecare cu ce face și unde afli mai mult. Sub ele, panoul real.
// Documente: doar cele care există (fișa de gaze, PV de lucrări ascunse, raportul PDF); profitul apare după facturare.
const MODULES = [
  { icon: Briefcase, label: "Lucrări", desc: "De la cerere la finalizare, cu poze, checklist și semnătura clientului.", href: "/aplicatie-tehnician" },
  { icon: CalendarDays, label: "Calendar și echipe", desc: "Programezi pe echipe și zile, cu avertismente pentru autorizații, concedii și materiale.", href: "/software-management-echipe-teren" },
  { icon: Users, label: "Clienți", desc: "Adrese, contacte și istoricul lucrărilor fiecărui client.", href: "" },
  { icon: Clock, label: "Pontaj", desc: "Orele din teren, din butoanele lucrării, cu corecții aprobate de birou.", href: "/pontaj-tehnicieni" },
  { icon: Package, label: "Stoc pe mașini", desc: "Ce are fiecare mașină, consum pe lucrare, reaprovizionare.", href: "/stoc-materiale-pe-masini" },
  { icon: Wallet, label: "Facturare", desc: "Factura din ore și materiale, prin SmartBill sau Oblio.", href: "/facturare-smartbill-oblio" },
  { icon: FileText, label: "Documente", desc: "Fișa de gaze, procesul-verbal de lucrări ascunse și raportul lucrării în PDF, din datele de pe teren.", href: "/firme-instalatii-electrice" },
  { icon: BarChart3, label: "Rapoarte", desc: "Ce e de facturat, ce e de încasat și profitul pe lucrare, după ce o facturezi.", href: "" },
];

export function SceneModules() {
  return (
    <section id="functionalitati" className={s.section}>
      <div className={s.wrap}>
        <div className={s.eyebrow}>Modulele platformei</div>
        <div className={s.secHead}>
          <h2 className={s.disp}>
            Un singur sistem.
            <br />
            <span className={s.lime}>Întregul tău business.</span>
          </h2>
          <p>Lucrări, clienți, echipe, materiale, facturi și documente, în același program pentru firma de instalații. Ce se face în teren ajunge la birou fără să fie scris a doua oară.</p>
        </div>
        <ul className={s.modGrid}>
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <li key={m.label}>
                {m.href ? (
                  <Link href={m.href} className={s.modCard}>
                    <Icon size={18} aria-hidden="true" />
                    <h3>{m.label}</h3>
                    <p>{m.desc}</p>
                  </Link>
                ) : (
                  <div className={s.modCard}>
                    <Icon size={18} aria-hidden="true" />
                    <h3>{m.label}</h3>
                    <p>{m.desc}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <figure className={`${s.shotFrame} ${s.shotWide}`}>
          <Image src="/marketing/screen-panou.webp" alt="Panoul din ElectroField: lucrările zilei, facturi restante, bani de recuperat și ce cere atenția acum" width={1400} height={640} sizes="(min-width: 1320px) 1272px, 100vw" />
          <figcaption>Panoul de dimineață, din platformă</figcaption>
        </figure>
      </div>
    </section>
  );
}
