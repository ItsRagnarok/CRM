"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Afișează un PDF în pagină, pagină cu pagină (pdf.js), în loc să-l deschidă pe tot ecranul:
 * în aplicație PDF-ul deschis direct rămânea fără ieșire (iPhone) sau nu se vedea deloc (Android).
 */
export function PdfViewer({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const el = box.current;
    if (!el) return;
    (async () => {
      try {
        // Versiunea „legacy”: merge și pe telefoane mai vechi (iOS 15, Android WebView vechi).
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";
        const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = new Uint8Array(await res.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
        if (cancelled) return;
        el.replaceChildren();
        const width = el.clientWidth * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(width)}px`;
          canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
          canvas.style.display = "block";
          canvas.style.background = "#fff";
          canvas.style.borderRadius = "6px";
          canvas.style.boxShadow = "0 1px 3px rgba(16,24,40,.12)";
          canvas.setAttribute("aria-label", `Pagina ${n} din ${pdf.numPages}`);
          el.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, zoom]);

  return (
    <div className="m-col" style={{ gap: 10 }}>
      <div className="m-r" style={{ gap: 8, justifyContent: "flex-end" }}>
        <span className="m-mu m-sm m-fl">{state === "loading" ? "Se încarcă PDF-ul…" : state === "error" ? "" : "Derulează pentru toate paginile."}</span>
        <button type="button" className="m-bt2 sm" style={{ width: 48 }} aria-label="Micșorează" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>−</button>
        <button type="button" className="m-bt2 sm" style={{ width: 48 }} aria-label="Mărește" disabled={zoom >= 2.5} onClick={() => setZoom((z) => Math.min(2.5, z + 0.5))}>+</button>
      </div>
      {state === "error" && <div className="m-cd m-sm" style={{ fontWeight: 700, color: "var(--m-bad)" }}>PDF-ul nu s-a putut afișa. Verifică conexiunea și încearcă din nou.</div>}
      <div style={{ overflowX: zoom > 1 ? "auto" : "hidden", margin: "0 -4px", padding: "0 4px" }}>
        <div ref={box} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }} />
      </div>
    </div>
  );
}
