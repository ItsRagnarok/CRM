"use client";

import { useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

const App = registerPlugin<{ getInfo(): Promise<{ version: string; build: string }> }>("App");

// Footer of the profile screen: the product version everywhere (browser,
// iPhone, Android), plus the installed APK's own version when running inside
// the Android app — so "which version do I have?" always has a real answer.
export function AppVersion({ version }: { version: string }) {
  const [apk, setApk] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("App")) return;
    App.getInfo()
      .then((info) => setApk(info.version))
      .catch(() => {});
  }, []);

  return (
    <div className="mt-3.5 pb-2 text-center text-[11px] text-muted-2">
      ElectroField · v{version}
      {apk && ` · aplicația Android v${apk}`}
    </div>
  );
}
