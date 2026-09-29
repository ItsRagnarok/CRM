"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSignature, flagClientAbsent } from "../actions";

export function SignaturePad({
  jobId,
  defaultName,
  adminPhone,
}: {
  jobId: string;
  defaultName: string;
  adminPhone: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const signerName = defaultName || "Client";
  const [pending, startTransition] = useTransition();
  const [showAbsentFlow, setShowAbsentFlow] = useState(false);
  const router = useRouter();

  // The canvas's drawing-buffer size must match its actual on-screen CSS size
  // (in device pixels) or touch coordinates drift from the drawn line — the
  // exact "can't sign" symptom on a real phone, since a fixed width/height
  // attribute here never matches the CSS-stretched (w-full) rendered size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = getPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
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

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    canvasRef.current?.releasePointerCapture(e.pointerId);
    drawing.current = false;
    lastPoint.current = null;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function submit() {
    if (!hasDrawn) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("signerName", signerName);
    formData.set("dataUrl", dataUrl);
    startTransition(async () => {
      await saveSignature(formData);
      router.push(`/mobil/lucrari/${jobId}`);
      router.refresh();
    });
  }

  function clientAbsent() {
    startTransition(async () => {
      await flagClientAbsent(jobId);
      router.push(`/mobil/lucrari/${jobId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4">
      <div>
        <div className="mb-1.5 text-[12.5px] font-bold text-[#344054]">Numele clientului</div>
        <div className="w-full rounded-[10px] border border-[#eaecf0] bg-neutral-bg px-3.5 py-3 text-[14px] font-bold text-[#344054]">
          {signerName}
        </div>
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
          className="h-[220px] w-full select-none rounded-[14px] border-2 border-dashed border-[#d0d5dd] bg-[#fcfcfd]"
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
        disabled={!hasDrawn || pending}
        className="mt-4 block w-full rounded-[12px] bg-success py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(21,128,61,0.28)] disabled:opacity-50"
      >
        {pending ? "Se salvează…" : "CONFIRMĂ ȘI FINALIZEAZĂ"}
      </button>
      {!showAbsentFlow ? (
        <button
          type="button"
          onClick={() => setShowAbsentFlow(true)}
          disabled={pending}
          className="mt-2.5 block w-full rounded-[12px] border border-[#d0d5dd] py-3 text-center text-[13px] font-bold text-[#344054] disabled:opacity-50"
        >
          Clientul nu e prezent — anunță administratorul
        </button>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2 rounded-[12px] border border-[#d0d5dd] bg-neutral-bg p-3.5">
          <div className="text-[12.5px] font-semibold text-[#344054]">
            Administratorul a fost notificat automat. Sună-l ca să confirme, apoi finalizează fără semnătură.
          </div>
          {adminPhone && (
            <a
              href={`tel:${adminPhone}`}
              className="block rounded-[10px] bg-electric py-2.5 text-center text-[13px] font-bold text-white"
            >
              📞 Sună administratorul — {adminPhone}
            </a>
          )}
          <button
            type="button"
            onClick={clientAbsent}
            disabled={pending}
            className="block w-full rounded-[10px] bg-success py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
          >
            {pending ? "Se salvează…" : "CONFIRMĂ FĂRĂ SEMNĂTURĂ"}
          </button>
        </div>
      )}
    </div>
  );
}
