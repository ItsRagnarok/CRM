"use client";

import { useEffect, useState } from "react";
import s from "./marketing.module.css";

const SCENES = [
  { id: "acasa", n: "01" },
  { id: "platforma", n: "02" },
  { id: "aplicatie-dashboard", n: "03" },
  { id: "cum-functioneaza", n: "04" },
  { id: "functionalitati", n: "05" },
  { id: "contact", n: "06" },
];

export function SideIndex() {
  const [active, setActive] = useState("acasa");

  useEffect(() => {
    const els = SCENES.map((sc) => document.getElementById(sc.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-10% 0px -10% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={s.sideIndex}>
      {SCENES.map((sc) => (
        <a
          key={sc.id}
          href={`#${sc.id}`}
          className={`${s.sideIndexItem} ${active === sc.id ? s.active : ""}`}
        >
          <span className={s.sideIndexDash} />
          {sc.n}
        </a>
      ))}
    </div>
  );
}
