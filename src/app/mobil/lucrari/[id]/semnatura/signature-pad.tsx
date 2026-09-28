"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSignature } from "../actions";

export function SignaturePad({ jobId, defaultName }: { jobId: string; defaultName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultName);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    lastPoint.current = getPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d");
    const point = getPoint(e);
    if (ctx && lastPoint.current) {
      ctx.strokeStyle = "#101828";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPoint.current = point;
    if (!hasDrawn) setHasDrawn(true);
  }

  function handlePointerUp() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function submit() {
    if (!hasDrawn || !signerName.trim()) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("signerName", signerName.trim());
    formData.set("dataUrl", dataUrl);
    startTransition(async () => {
      await saveSignature(formData);
      router.push(`/mobil/lucrari/${jobId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4">
      <div>
        <div className="mb-1.5 text-[12.5px] font-bold text-[#344054]">Numele clientului</div>
        <input
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-3 text-[14px] outline-none focus:border-electric"
        />
      </div>

      <div className="mt-4.5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12.5px] font-bold text-[#344054]">Semnează mai jos</div>
          {hasDrawn && (
            <button type="button" onClick={clear} className="text-[12px] font-bold text-muted">
              Șterge
            </button>
          )}
        </div>
        <canvas
          ref={canvasRef}
          width={360}
          height={220}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full touch-none rounded-[14px] border-2 border-dashed border-[#d0d5dd] bg-[#fcfcfd]"
        />
        {!hasDrawn && (
          <div className="-mt-8 text-center text-[11px] text-muted-2">Atinge aici pentru a semna</div>
        )}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        Clientul confirmă că lucrarea a fost efectuată conform descrierii și este de acord cu raportul de intervenție.
      </p>

      <div className="flex-1" />

      <button
        type="button"
        onClick={submit}
        disabled={!hasDrawn || !signerName.trim() || pending}
        className="mt-4 block w-full rounded-[12px] bg-success py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(21,128,61,0.28)] disabled:opacity-50"
      >
        {pending ? "Se salvează…" : "CONFIRMĂ ȘI FINALIZEAZĂ"}
      </button>
    </div>
  );
}
