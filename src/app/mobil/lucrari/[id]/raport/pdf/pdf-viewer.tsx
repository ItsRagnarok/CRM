"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

const MIN = 1;
const MAX = 4;
// iPhone refuză canvasurile mai mari de ~16 milioane de pixeli: o pagină A4 rămâne sub ~3400 px lățime.
const MAX_CANVAS_W = 3400;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

/**
 * PDF-ul afișat în pagină (pdf.js), cu zoom ca într-un cititor de PDF: ciupit cu două degete, dublă
 * atingere, butoane, Ctrl + rotița pe calculator. Deschis direct, PDF-ul rămânea pe iPhone fără
 * ieșire, iar pe Android nu se vedea deloc.
 */
export function PdfViewer({ url }: { url: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const baseW = useRef(0);
  const zoomRef = useRef(1);
  const renderedFor = useRef(0);
  const rendering = useRef(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoomLabel] = useState(1);

  // Desenează paginile la rezoluția potrivită pentru zoomul dat (o dată, apoi doar la zoom mai mare).
  async function render(forZoom: number) {
    const pdf = pdfRef.current;
    const box = stage.current;
    if (!pdf || !box || rendering.current) return;
    rendering.current = true;
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const target = Math.min(baseW.current * forZoom * dpr, MAX_CANVAS_W);
        const viewport = page.getViewport({ scale: target / base.width });
        let canvas = box.children[n - 1] as HTMLCanvasElement | undefined;
        if (!canvas) {
          canvas = document.createElement("canvas");
          Object.assign(canvas.style, { display: "block", width: "100%", height: "auto", background: "#fff", borderRadius: "6px", boxShadow: "0 1px 3px rgba(16,24,40,.12)" });
          canvas.setAttribute("aria-label", `Pagina ${n} din ${pdf.numPages}`);
          box.appendChild(canvas);
        }
        // Desenăm pe un canvas separat și copiem la final, ca pagina să nu clipească în timpul zoomului.
        const off = document.createElement("canvas");
        off.width = Math.floor(viewport.width);
        off.height = Math.floor(viewport.height);
        const ctx = off.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvas.width = off.width;
        canvas.height = off.height;
        canvas.getContext("2d")?.drawImage(off, 0, 0);
      }
      renderedFor.current = forZoom;
    } finally {
      rendering.current = false;
    }
  }

  // Schimbă zoomul păstrând sub degete (sau în centru) același punct din pagină.
  function applyZoom(next: number, fx?: number, fy?: number) {
    const sc = scroller.current;
    const box = stage.current;
    if (!sc || !box) return;
    const z = clamp(next);
    const prev = zoomRef.current;
    if (z === prev) return;
    const px = fx ?? sc.clientWidth / 2;
    const py = fy ?? sc.clientHeight / 2;
    const cx = sc.scrollLeft + px;
    const cy = sc.scrollTop + py;
    box.style.width = `${baseW.current * z}px`;
    sc.scrollLeft = (cx * z) / prev - px;
    sc.scrollTop = (cy * z) / prev - py;
    zoomRef.current = z;
  }

  function settle() {
    const z = zoomRef.current;
    setZoomLabel(z);
    if (z > renderedFor.current + 0.25) void render(Math.min(MAX, Math.ceil(z)));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Versiunea „legacy”: merge și pe telefoane mai vechi (iOS 15, Android WebView vechi).
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";
        const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = new Uint8Array(await res.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
        if (cancelled || !scroller.current || !stage.current) return;
        pdfRef.current = pdf;
        baseW.current = scroller.current.clientWidth - 24;
        stage.current.style.width = `${baseW.current}px`;
        await render(2);
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
     
  }, [url]);

  // Gesturile: două degete = zoom, dublă atingere = mărire/revenire, Ctrl + rotița = zoom pe calculator.
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    let pinch: { d: number; z: number } | null = null;
    let lastTap = { t: 0, x: 0, y: 0 };
    const rel = (x: number, y: number) => {
      const r = sc.getBoundingClientRect();
      return [x - r.left, y - r.top] as const;
    };
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) pinch = { d: dist(e.touches), z: zoomRef.current };
    };
    const onMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const [fx, fy] = rel((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2);
      applyZoom(pinch.z * (dist(e.touches) / pinch.d), fx, fy);
    };
    const onEnd = (e: TouchEvent) => {
      if (pinch && e.touches.length < 2) {
        pinch = null;
        settle();
        return;
      }
      if (e.touches.length === 0 && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const now = Date.now();
        if (now - lastTap.t < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
          const [fx, fy] = rel(t.clientX, t.clientY);
          applyZoom(zoomRef.current > 1.2 ? 1 : 2.5, fx, fy);
          settle();
          lastTap = { t: 0, x: 0, y: 0 };
        } else {
          lastTap = { t: now, x: t.clientX, y: t.clientY };
        }
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const [fx, fy] = rel(e.clientX, e.clientY);
      applyZoom(zoomRef.current * Math.exp(-e.deltaY / 200), fx, fy);
      settle();
    };
    const stopGesture = (e: Event) => e.preventDefault();
    sc.addEventListener("touchstart", onStart, { passive: true });
    sc.addEventListener("touchmove", onMove, { passive: false });
    sc.addEventListener("touchend", onEnd);
    sc.addEventListener("wheel", onWheel, { passive: false });
    sc.addEventListener("gesturestart", stopGesture);
    sc.addEventListener("gesturechange", stopGesture);
    return () => {
      sc.removeEventListener("touchstart", onStart);
      sc.removeEventListener("touchmove", onMove);
      sc.removeEventListener("touchend", onEnd);
      sc.removeEventListener("wheel", onWheel);
      sc.removeEventListener("gesturestart", stopGesture);
      sc.removeEventListener("gesturechange", stopGesture);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = (dir: 1 | -1) => {
    applyZoom(dir > 0 ? zoomRef.current * 1.5 : zoomRef.current / 1.5);
    settle();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="m-r" style={{ gap: 8, padding: "0 20px 10px" }}>
        <span className="m-mu m-sm m-fl">
          {state === "loading" ? "Se încarcă PDF-ul…" : state === "error" ? "" : "Mărește cu două degete sau atinge de două ori."}
        </span>
        <button type="button" className="m-bt2 sm" style={{ width: 48 }} aria-label="Micșorează" disabled={zoom <= MIN} onClick={() => step(-1)}>−</button>
        <span className="m-sm" style={{ width: 44, textAlign: "center", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" className="m-bt2 sm" style={{ width: 48 }} aria-label="Mărește" disabled={zoom >= MAX} onClick={() => step(1)}>+</button>
      </div>
      {state === "error" && <div className="m-cd m-sm" style={{ margin: "0 20px", fontWeight: 700, color: "var(--m-bad)" }}>PDF-ul nu s-a putut afișa. Verifică conexiunea și încearcă din nou.</div>}
      <div ref={scroller} style={{ flex: 1, minHeight: 0, overflow: "auto", touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch", padding: "4px 12px 24px" }}>
        <div ref={stage} style={{ display: "flex", flexDirection: "column", gap: 12, margin: "0 auto" }} />
      </div>
    </div>
  );
}
