"use client";

import { useRef, useState } from "react";
import { arriveAtJobForm } from "./actions";

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const ARRIVAL_RADIUS_M = 50;

export function ArriveButton({ jobId, jobLat, jobLng }: { jobId: string; jobLat?: number; jobLng?: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  function submit() {
    setPending(true);
    formRef.current?.requestSubmit();
  }

  function handleClick() {
    setPending(true);
    if (jobLat == null || jobLng == null) {
      // Job has no known coordinates (e.g. address failed to geocode) — we
      // can't verify distance, but he must still confirm explicitly rather
      // than being checked in silently with no message at all.
      setPending(false);
      const ok = window.confirm(
        "Nu cunoaștem coordonatele lucrării, deci nu putem verifica automat distanța. Confirmi manual că ai ajuns la locație?"
      );
      if (ok) submit();
      return;
    }
    if (!navigator.geolocation) {
      setPending(false);
      const ok = window.confirm("Dispozitivul tău nu suportă verificarea locației. Confirmi manual că ai ajuns la locație?");
      if (ok) submit();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, jobLat, jobLng);
        if (d <= ARRIVAL_RADIUS_M) {
          submit();
          return;
        }
        setPending(false);
        const ok = window.confirm(
          `Se pare că mai ești la ~${Math.round(d)} m de locația lucrării. Confirmi manual că ai ajuns?`
        );
        if (ok) submit();
      },
      () => {
        setPending(false);
        const ok = window.confirm("Nu am putut verifica locația ta. Confirmi manual că ai ajuns la locație?");
        if (ok) submit();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <form ref={formRef} action={arriveAtJobForm} className="w-full">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)] disabled:opacity-60"
      >
        {pending ? "Se confirmă…" : "AM AJUNS LA LOCAȚIE"}
      </button>
    </form>
  );
}
