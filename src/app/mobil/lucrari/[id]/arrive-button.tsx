"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { runOrQueue } from "@/lib/offline/send";

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
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const at = useRef("");
  const coords = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

  // Fără semnal, sosirea (cu ora și locul de acum) se salvează pe telefon și pleacă singură mai târziu.
  async function submit() {
    setPending(true);
    setError(null);
    const r = await runOrQueue({ kind: "event", jobId, event: "arrival", at: at.current || new Date().toISOString(), lat: coords.current.lat, lng: coords.current.lng });
    setPending(false);
    if (r.status === "error") setError(r.error);
    else router.refresh();
  }

  function handleClick() {
    at.current = new Date().toISOString();
    coords.current = { lat: null, lng: null };
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
        coords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
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
    <div style={{ width: "100%" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="m-btn"
      >
        {pending ? "Se confirmă…" : "Am ajuns la locație"}
      </button>
      {error && <div className="m-sm" style={{ color: "var(--m-er, #b42318)", textAlign: "center", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
