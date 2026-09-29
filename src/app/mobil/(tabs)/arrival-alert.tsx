"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { arriveAtJob, recordArrivalPromptDismissal } from "../lucrari/[id]/actions";

const RADIUS_M = 50;
const REPROMPT_MS = 5 * 60 * 1000;

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function ArrivalAlert({
  job,
  initialAttempts,
}: {
  job: { id: string; title: string; lat: number; lng: number };
  initialAttempts: number;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const lastPromptRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, job.lat, job.lng);
        const now = Date.now();
        if (dist <= RADIUS_M && now - lastPromptRef.current > REPROMPT_MS) {
          lastPromptRef.current = now;
          setVisible(true);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-[420px] rounded-t-[20px] bg-white p-5 sm:rounded-[20px]">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="h-5 w-5" />
          <div className="text-[15px] font-extrabold">Ești lângă locația lucrării</div>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[#475467]">
          Se pare că ești în apropierea locației lucrării „{job.title}”. Ai ajuns?
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setPending(true);
              const finish = () => {
                setVisible(false);
                setPending(false);
                router.refresh();
              };
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => arriveAtJob(job.id, pos.coords.latitude, pos.coords.longitude).then(finish),
                  () => arriveAtJob(job.id).then(finish)
                );
              } else {
                arriveAtJob(job.id).then(finish);
              }
            }}
            className="flex-1 rounded-[12px] bg-success py-3 text-center text-[13.5px] font-extrabold text-white disabled:opacity-60"
          >
            DA, AM AJUNS
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setPending(true);
              recordArrivalPromptDismissal(job.id).then(() => {
                setPending(false);
                setVisible(false);
              });
            }}
            className="flex-1 rounded-[12px] bg-neutral-bg py-3 text-center text-[13.5px] font-extrabold text-[#344054] disabled:opacity-60"
          >
            NU ÎNCĂ
          </button>
        </div>
        {initialAttempts >= 2 && (
          <p className="mt-3 text-center text-[11px] text-muted-2">
            Dacă tot nu confirmi sosirea, administratorul va fi anunțat automat.
          </p>
        )}
      </div>
    </div>
  );
}
