"use client";

import { MarketingNav } from "./nav";
import { SideIndex } from "./side-index";
import { Hero } from "./hero";
import { SceneLiveMap } from "./scene-live-map";
import { ScenePhoneDashboard } from "./scene-phone-dashboard";
import { SceneJobJourney } from "./scene-job-journey";
import { SceneModules } from "./scene-modules";
import { CtaSection } from "./cta";
import { HomeSeo } from "./home-seo";
import { MarketingFooter } from "./footer";
import s from "./marketing.module.css";

export function MarketingLanding() {
  return (
    <div className={s.mk}>
      <MarketingNav />
      <SideIndex />
      <Hero />
      <SceneLiveMap />
      <ScenePhoneDashboard />
      <SceneJobJourney />
      <SceneModules />
      <HomeSeo />
      <CtaSection />
      <MarketingFooter />
    </div>
  );
}
