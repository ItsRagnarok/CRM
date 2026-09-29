"use client";

import { useRef, useState } from "react";
import { confirmDepotArrival } from "../actions";

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

export function DepotArriveButton({
  jobId,
  depotLat,
  depotLng,
}: {
  jobId: string;
  depotLat: number;
  depotLng: number;
}) {
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
    if (!navigator.geolocation) {
      // No GPS available at all — don't block him, let him confirm manually.
      const ok = window.confirm("Nu putem verifica locația ta pe acest dispozitiv. Confirmi manual că ai ajuns la depozit?");
      if (ok) submit();
      else setPending(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, depotLat, depotLng);
        if (d <= ARRIVAL_RADIUS_M) {
          submit();
          return;
        }
        setPending(false);
        const ok = window.confirm(
          `Se pare că mai ești la ~${Math.round(d)} m de depozit. Confirmi manual că ai ajuns?`
        );
        if (ok) submit();
      },
      () => {
        setPending(false);
        const ok = window.confirm("Nu am putut verifica locația ta. Confirmi manual că ai ajuns la depozit?");
        if (ok) submit();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <form ref={formRef} action={confirmDepotArrival} className="w-full">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="block w-full rounded-[12px] bg-electric py-[15px] text-center text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgba(47,111,237,0.3)] disabled:opacity-60"
      >
        {pending ? "Se verifică locația…" : "AM AJUNS LA LOCAȚIE"}
      </button>
    </form>
  );
}
