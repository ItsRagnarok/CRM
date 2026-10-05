import { Zap } from "lucide-react";
import s from "./marketing.module.css";

export function MarketingFooter() {
  return (
    <footer className={s.footer}>
      <div className={`${s.wrap} ${s.footRow}`}>
        <div className={s.brand}>
          <Zap size={16} className={s.brandBolt} strokeWidth={2.5} fill="currentColor" />
          ElectroField
        </div>
        <div className={s.footLinks}>
          <a href="#platforma">Platformă</a>
          <a href="#functionalitati">Funcționalități</a>
          <a href="#cum-functioneaza">Cum funcționează</a>
          <a href="/login">Conectează-te</a>
        </div>
        <div className={s.footCopy}>© {new Date().getFullYear()} ElectroField</div>
      </div>
    </footer>
  );
}
