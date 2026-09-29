"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPurchaseFulfilled } from "../../actions";

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function ReturnConfirm({
  jobId,
  requestId,
  jobLat,
  jobLng,
}: {
  jobId: string;
  requestId: string;
  jobLat: number | null;
  jobLng: number | null;
}) {
  const router = useRouter();
  const [returning, setReturning] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!returning || jobLat == null || jobLng == null || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setDistance(distanceMeters(pos.coords.latitude, pos.coords.longitude, jobLat, jobLng)),
      () => {},
      { enableHighAccuracy: true, maximumAge: 15_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [returning, jobLat, jobLng]);

  if (!returning) {
    return (
      <button
        type="button"
        onClick={() => setReturning(true)}
        className="block w-full rounded-[12px] bg-electric py-[14px] text-center text-[14.5px] font-extrabold text-white"
      >
        OK, MĂ ÎNTORC LA LUCRARE
      </button>
    );
  }

  const inRange = distance != null && distance <= 50;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-center text-[12.5px] text-muted-2">
        {distance != null
          ? `Ești la ${distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`} de lucrare`
          : "Se calculează distanța…"}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await markPurchaseFulfilled(requestId, jobId);
            router.push(`/mobil/lucrari/${jobId}`);
            router.refresh();
          });
        }}
        className={`block w-full rounded-[12px] py-[14px] text-center text-[14.5px] font-extrabold text-white disabled:opacity-60 ${
          inRange ? "bg-success" : "bg-electric"
        }`}
      >
        {pending ? "Se confirmă…" : "AM AJUNS DIN NOU"}
      </button>
    </div>
  );
}
