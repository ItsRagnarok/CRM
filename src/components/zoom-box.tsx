"use client";

import { useEffect, useRef, useState } from "react";

const MIN = 1;
const MAX = 4;
const clamp = (z: number) => Math.min(MAX, Math.max(MIN, z));

/**
 * Un document lat (o fișă A4 desenată la `width` px) arătat pe telefon: încape în lățimea ecranului,
 * iar zoomul merge ca într-un cititor de PDF (două degete, dublă atingere, − / +, Ctrl + rotița).
 */
export function ZoomBox({ width = 820, children }: { width?: number; children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const fit = useRef(1);
  const zoomRef = useRef(1);
  const [zoom, setZoomLabel] = useState(1);

  function apply(next: number, fx?: number, fy?: number) {
    const sc = scroller.current;
    const el = inner.current;
    if (!sc || !el) return;
    const z = clamp(next);
    const prev = zoomRef.current;
    const px = fx ?? sc.clientWidth / 2;
    const py = fy ?? sc.clientHeight / 2;
    const cx = sc.scrollLeft + px;
    const cy = sc.scrollTop + py;
    (el.style as CSSStyleDeclaration & { zoom: string }).zoom = String(fit.current * z);
    if (z !== prev) {
      sc.scrollLeft = (cx * z) / prev - px;
      sc.scrollTop = (cy * z) / prev - py;
    }
    zoomRef.current = z;
  }

  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const measure = () => {
      fit.current = Math.min(1, (sc.clientWidth - 16) / width);
      apply(zoomRef.current);
    };
    measure();
    window.addEventListener("resize", measure);

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
      apply(pinch.z * (dist(e.touches) / pinch.d), fx, fy);
    };
    const onEnd = (e: TouchEvent) => {
      if (pinch && e.touches.length < 2) {
        pinch = null;
        setZoomLabel(zoomRef.current);
        return;
      }
      if (e.touches.length === 0 && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const now = Date.now();
        if (now - lastTap.t < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
          const [fx, fy] = rel(t.clientX, t.clientY);
          apply(zoomRef.current > 1.2 ? 1 : 2.5, fx, fy);
          setZoomLabel(zoomRef.current);
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
      apply(zoomRef.current * Math.exp(-e.deltaY / 200), fx, fy);
      setZoomLabel(zoomRef.current);
    };
    const stop = (e: Event) => e.preventDefault();
    sc.addEventListener("touchstart", onStart, { passive: true });
    sc.addEventListener("touchmove", onMove, { passive: false });
    sc.addEventListener("touchend", onEnd);
    sc.addEventListener("wheel", onWheel, { passive: false });
    sc.addEventListener("gesturestart", stop);
    sc.addEventListener("gesturechange", stop);
    return () => {
      window.removeEventListener("resize", measure);
      sc.removeEventListener("touchstart", onStart);
      sc.removeEventListener("touchmove", onMove);
      sc.removeEventListener("touchend", onEnd);
      sc.removeEventListener("wheel", onWheel);
      sc.removeEventListener("gesturestart", stop);
      sc.removeEventListener("gesturechange", stop);
    };
     
  }, [width]);

  const step = (dir: 1 | -1) => {
    apply(dir > 0 ? zoomRef.current * 1.5 : zoomRef.current / 1.5);
    setZoomLabel(zoomRef.current);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="m-r" style={{ gap: 8, padding: "0 20px 10px" }}>
        <span className="m-mu m-sm m-fl">Mărește cu două degete sau atinge de două ori.</span>
        <button type="button" className="m-bt2 sm" style={{ width: 48 }} aria-label="Micșorează" disabled={zoom <= MIN} onClick={() => step(-1)}>−</button>
        <span className="m-sm" style={{ width: 44, textAlign: "center", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" className="m-bt2 sm" style={{ width: 48 }} aria-label="Mărește" disabled={zoom >= MAX} onClick={() => step(1)}>+</button>
      </div>
      <div ref={scroller} style={{ flex: 1, minHeight: 0, overflow: "auto", touchAction: "pan-x pan-y", padding: "4px 8px 24px" }}>
        <div ref={inner} style={{ width, background: "#fff", borderRadius: 6, boxShadow: "0 1px 3px rgba(16,24,40,.12)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
