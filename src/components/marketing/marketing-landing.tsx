import { MarketingNav } from "./nav";
import { SideIndex } from "./side-index";
import { Hero } from "./hero";
import { SceneLiveMap } from "./scene-live-map";
import { ScenePhoneDashboard } from "./scene-phone-dashboard";
import { SceneJobJourney } from "./scene-job-journey";
import { SceneModules } from "./scene-modules";
import { CtaSection } from "./cta";
import { HomeIntro, HomeSeo } from "./home-seo";
import { MarketingFooter } from "./footer";
import s from "./marketing.module.css";

// Componentă de server: doar meniul, indexul lateral, hero-ul și scena cu telefonul rulează în browser
// (au "use client"); restul secțiunilor sunt HTML static, fără JavaScript în plus.
export function MarketingLanding() {
  return (
    <div className={s.mk}>
      <MarketingNav />
      <SideIndex />
      <main>
        <Hero />
        <HomeIntro />
        <SceneLiveMap />
        <ScenePhoneDashboard />
        <SceneJobJourney />
        <SceneModules />
        <HomeSeo />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
