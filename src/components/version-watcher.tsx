"use client";

import { useEffect, useState } from "react";

const MINE = process.env.NEXT_PUBLIC_APP_VERSION ?? "local";

/**
 * După fiecare actualizare a platformei, o pagină deja deschisă are butoane care trimit la versiunea
 * veche a serverului; serverul nou le refuză și clicul pare să nu facă nimic. Verificăm versiunea
 * când revii în fereastră și la câteva minute; dacă s-a schimbat, reîncărcăm pagina (sau, dacă
 * tocmai scrii ceva, îți arătăm un buton ca să nu pierzi textul).
 */
export function VersionWatcher() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (MINE === "local") return;
    let busy = false;
    const typing = () => {
      const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      return !!el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["button", "submit", "checkbox", "radio"].includes((el as HTMLInputElement).type))) && !!el.value;
    };
    const check = async () => {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { v } = (await r.json()) as { v?: string };
        if (v && v !== "local" && v !== MINE) {
          if (typing()) setStale(true);
          else window.location.reload();
        }
      } catch {
        // fără rețea: încercăm data viitoare
      } finally {
        busy = false;
      }
    };
    // Un buton apăsat pe o versiune veche: serverul răspunde „Failed to find Server Action”.
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = String((e.reason as Error | undefined)?.message ?? e.reason ?? "");
      if (/Server Action|older or newer deployment|ChunkLoadError|Loading chunk/i.test(msg)) void check();
    };
    const onVisible = () => document.visibilityState === "visible" && void check();
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("unhandledrejection", onRejection);
    const t = window.setInterval(check, 3 * 60_000);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("unhandledrejection", onRejection);
      window.clearInterval(t);
    };
  }, []);

  if (!stale) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(var(--sab)+84px)] z-[100] mx-auto flex max-w-[460px] items-center gap-3 rounded-[14px] bg-[#101828] px-4 py-3 text-[13px] text-white shadow-[0_18px_40px_rgba(16,24,40,.3)] md:bottom-5">
      <span className="flex-1">A apărut o versiune nouă. Salvează ce scrii, apoi reîncarcă pagina.</span>
      <button type="button" onClick={() => window.location.reload()} className="rounded-[10px] bg-electric px-3 py-1.5 text-[12.5px] font-bold">
        Reîncarcă
      </button>
    </div>
  );
}
