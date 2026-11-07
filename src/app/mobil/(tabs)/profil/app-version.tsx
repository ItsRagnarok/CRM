"use client";

import { useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

const App = registerPlugin<{ getInfo(): Promise<{ version: string; build: string }> }>("App");

// Shows the version of the installed Android app (so "which version do I
// have?" has a real answer), or "web" when opened in a browser.
export function AppVersion() {
  const [label, setLabel] = useState("web");

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("App")) return;
    App.getInfo()
      .then((info) => setLabel(`aplicația Android v${info.version}`))
      .catch(() => {});
  }, []);

  return <div className="mt-3.5 text-center text-[11px] text-muted-2">ElectroField · {label}</div>;
}
