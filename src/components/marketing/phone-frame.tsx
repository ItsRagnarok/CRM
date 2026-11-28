import Image from "next/image";
import s from "./marketing.module.css";

type Overlay = { src: string; alt: string; opacity: number };

/**
 * Ramă de iPhone (proporții 390×844) cu bara de stare și decupajul camerei. Ecranul e o captură reală
 * din aplicație (390×797, fără bara de stare). `overlays` pune alte capturi peste prima, cu opacitatea
 * dată (pentru trecerea dintre ecrane la derulare).
 */
export function PhoneFrame({ src, alt, priority = false, sizes, overlays }: { src: string; alt: string; priority?: boolean; sizes: string; overlays?: Overlay[] }) {
  return (
    <div className={s.pf}>
      <div className={s.pfScreen}>
        <div className={s.pfStatus} aria-hidden="true">
          <span className={s.pfTime}>9:41</span>
          <span className={s.pfIsland} />
          <span className={s.pfIcons}>
            <svg viewBox="0 0 18 12" width="17" height="11"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
            <svg viewBox="0 0 26 12" width="25" height="12"><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" strokeOpacity=".4" /><rect x="2" y="2" width="17" height="8" rx="2" /><rect x="23.5" y="4" width="2" height="4" rx="1" fillOpacity=".4" /></svg>
          </span>
        </div>
        <div className={s.pfBody}>
          <Image src={src} alt={alt} width={660} height={1349} priority={priority} sizes={sizes} className={s.pfImg} />
          {overlays?.map((o) => (
            <Image key={o.src} src={o.src} alt={o.alt} width={660} height={1349} sizes={sizes} className={s.pfOverlay} style={{ opacity: o.opacity }} />
          ))}
        </div>
      </div>
    </div>
  );
}
