"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MobileMapJob = {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
  href: string;
};

const FALLBACK_CENTER: [number, number] = [45.9443, 25.0094];

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jobIcon(label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
      <span style="background:#2F6FED;color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(16,24,40,.3);">${escapeHtml(label)}</span>
      <span style="width:9px;height:9px;border-radius:50%;background:#2F6FED;border:2px solid #fff;margin-top:3px;"></span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
  });
}

const selfIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2F6FED;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,111,237,0.18);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const hqIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
    <span style="background:#101828;color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(16,24,40,.3);">🏢 Sediu</span>
    <span style="width:9px;height:9px;border-radius:50%;background:#101828;border:2px solid #fff;margin-top:3px;"></span>
  </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -34],
});

function warehouseIcon(name: string) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
      <span style="background:#7c2d12;color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(16,24,40,.3);">🏭 ${escapeHtml(name)}</span>
      <span style="width:9px;height:9px;border-radius:50%;background:#7c2d12;border:2px solid #fff;margin-top:3px;"></span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
  });
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15);
  }, [target, map]);
  return null;
}

// Keyed on a stable summary of WHAT should be shown (which jobs, whether hq/
// warehouses/route exist) rather than the raw points array, which gets a new
// reference on every GPS tick since it includes the live self-position. If
// this ran on every tick, it would keep fighting any manual navigation (e.g.
// the "Sediu" fly-to button) by re-fitting to include the technician's
// current real position moments later — jarring when that position is far
// from everything else being shown (e.g. testing from a different country).
function FitBounds({ points, fitKey }: { points: [number, number][]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    // points intentionally excluded: fitKey is the real dependency, see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

type RouteInfo = { coords: [number, number][]; distanceM: number; durationS: number };

export function MobileMap({
  jobs,
  routeTo,
  hq,
  warehouses = [],
  trail = [],
}: {
  jobs: MobileMapJob[];
  routeTo?: MobileMapJob;
  hq?: { lat: number; lng: number } | null;
  warehouses?: { id: string; name: string; lat: number; lng: number }[];
  trail?: [number, number][];
}) {
  const [selfPos, setSelfPos] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    // Continuous tracking — the technician must always see his own live
    // position on the map, not just a one-time snapshot from page load.
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setSelfPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!selfPos || !routeTo) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    setRouteError(false);
    const url = `https://router.project-osrm.org/route/v1/driving/${selfPos[1]},${selfPos[0]};${routeTo.lng},${routeTo.lat}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const r = data?.routes?.[0];
        if (!r) {
          setRouteError(true);
          return;
        }
        setRoute({
          coords: r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
          distanceM: r.distance,
          durationS: r.duration,
        });
      })
      .catch(() => !cancelled && setRouteError(true));
    return () => {
      cancelled = true;
    };
  }, [selfPos, routeTo]);

  const points: [number, number][] = [
    ...(selfPos ? [selfPos] : []),
    ...jobs.map((j) => [j.lat, j.lng] as [number, number]),
    ...(hq ? [[hq.lat, hq.lng] as [number, number]] : []),
    ...warehouses.map((w) => [w.lat, w.lng] as [number, number]),
  ];
  const center = points[0] ?? FALLBACK_CENTER;
  // Changes only when the SET of things to show changes — not on every GPS
  // tick — so the auto-fit runs once self position/route first resolve, then
  // leaves the view alone (see FitBounds above).
  const fitKey = [
    jobs.map((j) => j.id).join(","),
    hq ? "hq" : "",
    warehouses.map((w) => w.id).join(","),
    selfPos ? "self" : "",
    route ? "route" : "",
  ].join("|");

  return (
    <>
      <MapContainer center={center} zoom={points.length > 0 ? 13 : 6.5} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={route ? [...route.coords, ...points] : points} fitKey={fitKey} />
        <FlyTo target={flyTarget} />
        {trail.length > 1 && (
          <Polyline positions={trail} pathOptions={{ color: "#0369a1", weight: 3, opacity: 0.6, dashArray: "1 8" }} />
        )}
        {route && <Polyline positions={route.coords} pathOptions={{ color: "#2F6FED", weight: 5, opacity: 0.85 }} />}
        {selfPos && (
          <Marker position={selfPos} icon={selfIcon}>
            <Popup>Poziția ta</Popup>
          </Marker>
        )}
        {hq && (
          <Marker position={[hq.lat, hq.lng]} icon={hqIcon}>
            <Popup>Sediul administrativ</Popup>
          </Marker>
        )}
        {warehouses.map((w) => (
          <Marker key={w.id} position={[w.lat, w.lng]} icon={warehouseIcon(w.name)}>
            <Popup>{w.name}</Popup>
          </Marker>
        ))}
        {jobs.map((j) => (
          <Marker key={j.id} position={[j.lat, j.lng]} icon={jobIcon(j.label)}>
            <Popup>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{j.label}</div>
                <div style={{ color: "#667085" }}>{j.sublabel}</div>
                {selfPos && (
                  <div style={{ marginTop: 4, fontWeight: 700, color: "#101828" }}>
                    {formatDistance(distanceMeters(selfPos[0], selfPos[1], j.lat, j.lng))} de poziția ta
                  </div>
                )}
                <a href={j.href} style={{ color: "#2f6fed", fontWeight: 600 }}>
                  Deschide lucrarea →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {hq && (
        <button
          type="button"
          onClick={() => setFlyTarget([hq.lat, hq.lng])}
          style={{
            position: "absolute",
            zIndex: 1000,
            bottom: 16,
            right: 12,
            background: "#101828",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            borderRadius: 999,
            padding: "9px 14px",
            boxShadow: "0 4px 14px rgba(16,24,40,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🏢 Sediu
        </button>
      )}
      {routeTo && (
        // Distance/ETA only — Google Maps/Waze live as their own buttons
        // below the map (not floating on top of it), so this stays a
        // simple readout.
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            top: 12,
            left: 12,
            right: 12,
            background: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 4px 14px rgba(16,24,40,0.12)",
            fontSize: 12.5,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {route ? (
            <>
              <span style={{ fontWeight: 800, color: "#101828" }}>{(route.distanceM / 1000).toFixed(1)} km</span>
              <span style={{ color: "#98A2B3" }}>·</span>
              <span style={{ color: "#475467" }}>{Math.round(route.durationS / 60)} min cu mașina</span>
            </>
          ) : routeError ? (
            <span style={{ color: "#98A2B3" }}>Traseul nu a putut fi calculat</span>
          ) : !selfPos ? (
            <span style={{ color: "#98A2B3" }}>Se așteaptă locația ta…</span>
          ) : (
            <span style={{ color: "#98A2B3" }}>Se calculează traseul…</span>
          )}
        </div>
      )}
    </>
  );
}
