"use client";

import { useState } from "react";

export function PreviewBoundary({ children, company, fullName }: { children: React.ReactNode; company: string; fullName: string }) {
  const [message, setMessage] = useState(false);
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-amber-soft px-4 py-2 text-xs text-foreground" role="status">
      <span><strong>Doar citire · {company}</strong> — interfața lui {fullName}. Modificările sunt blocate.</span>
      <form action="/api/admin/preview-exit" method="post"><button className="rounded border border-border px-3 py-1 font-semibold">Înapoi în super admin</button></form>
    </div>
    {message && <p role="alert" className="bg-warning-bg px-4 py-2 text-xs text-warning">Această acțiune este dezactivată în modul de vizualizare.</p>}
    <div className="flex min-h-0 flex-1 flex-col" onSubmitCapture={(e) => {
      if ((e.target as HTMLFormElement).method.toLowerCase() === "get") return;
      e.preventDefault(); e.stopPropagation(); setMessage(true);
    }}
      onClickCapture={(e) => {
        const element = (e.target as HTMLElement).closest("button, a");
        const text = element?.textContent?.trim() ?? "";
        if (element?.tagName === "BUTTON" && /(Salvează|Șterge|Confirmă|Aprobă|Respinge|Adaugă|Creează|Începe lucrarea|Finalizează|Trimite|Deconectare)/i.test(text)) {
          e.preventDefault(); e.stopPropagation(); setMessage(true);
        }
      }}>{children}</div>
  </div>;
}
