"use client";

import { useState, useTransition } from "react";
import { Hand, Sun } from "lucide-react";
import { setDisplayMode } from "./actions";

function Toggle({ icon: Icon, title, description, initial, mode }: { icon: typeof Sun; title: string; description: string; initial: boolean; mode: "sun" | "gloves" }) {
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();
  return (
    <>
      <div className="m-row">
        <span className="m-ic sm"><Icon className="m-i" /></span>
        <div className="m-fl">
          <div className="t">{title}</div>
          <div className="d">{description}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={title}
          className={`m-sw ${on ? "" : "off"}`}
          onClick={() => {
            const next = !on;
            setOn(next);
            start(() => setDisplayMode(mode, next));
          }}
        />
      </div>
      <hr className="m-sep" />
    </>
  );
}

export function DisplayToggles({ sun, gloves }: { sun: boolean; gloves: boolean }) {
  return (
    <div className="m-list">
      <Toggle icon={Sun} title="Mod soare" description="Contrast mare pentru lumina zilei" initial={sun} mode="sun" />
      <Toggle icon={Hand} title="Mod mănuși" description="Butoane mai mari, mai puține atingeri" initial={gloves} mode="gloves" />
    </div>
  );
}
