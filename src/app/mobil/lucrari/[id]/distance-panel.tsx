"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";

export function DistancePanel({ lat, lng }: { lat: number; lng: number }) {
  const [state, setState] = useState<{ km: number; minutes: number } | "denied" | "loading">("loading");

  useEffect(() => {
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://router.project-osrm.org/route/v1/driving/${pos.coords.longitude},${pos.coords.latitude};${lng},${lat}?overview=false`;
        fetch(url)
          .then((r) => r.json())
          .then((data) => {
            if (cancelled) return;
            const route = data?.routes?.[0];
            if (!route) {
              setState("denied");
              return;
            }
            setState({ km: route.distance / 1000, minutes: Math.round(route.duration / 60) });
          })
          .catch(() => !cancelled && setState("denied"));
      },
      () => setState("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (state === "denied") return null;

  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-[#eaecf0] bg-white p-3.5">
      <Navigation className="h-4 w-4 shrink-0 text-electric" />
      {state === "loading" ? (
        <span className="text-[12.5px] text-muted-2">Se calculează distanța…</span>
      ) : (
        <span className="text-[13px] font-semibold text-[#344054]">
          <b>{state.km.toFixed(1)} km</b> · aprox. <b>{state.minutes} min</b> până la locație
        </span>
      )}
    </div>
  );
}
