"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

gsap.registerPlugin(ScrollTrigger);

/** Elementele cu data-reveal urcă și apar la derulare; capturile cu data-tilt se așază din înclinat. */
function useScrollMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal]", { opacity: 0, y: 36 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
      });
      gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((el) => {
        gsap.fromTo(
          el,
          { rotateX: 14, scale: 0.92, opacity: 0.4, transformPerspective: 1400, transformOrigin: "50% 100%" },
          { rotateX: 0, scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: true } }
        );
      });
    });
    return () => ctx.revert();
  }, []);
}

export function MarketingLanding() {
  useScrollMotion();
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
