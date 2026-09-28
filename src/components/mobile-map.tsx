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

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

type RouteInfo = { coords: [number, number][]; distanceM: number; durationS: number };

export function MobileMap({ jobs, routeTo }: { jobs: MobileMapJob[]; routeTo?: MobileMapJob }) {
  const [selfPos, setSelfPos] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setSelfPos([pos.coords.latitude, pos.coords.longitude]),
      () => setSelfPos(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
  ];
  const center = points[0] ?? FALLBACK_CENTER;

  return (
    <>
      <MapContainer center={center} zoom={points.length > 0 ? 13 : 6.5} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={route ? [...route.coords, ...points] : points} />
        {route && <Polyline positions={route.coords} pathOptions={{ color: "#2F6FED", weight: 5, opacity: 0.85 }} />}
        {selfPos && (
          <Marker position={selfPos} icon={selfIcon}>
            <Popup>Poziția ta</Popup>
          </Marker>
        )}
        {jobs.map((j) => (
          <Marker key={j.id} position={[j.lat, j.lng]} icon={jobIcon(j.label)}>
            <Popup>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{j.label}</div>
                <div style={{ color: "#667085" }}>{j.sublabel}</div>
                <a href={j.href} style={{ color: "#2f6fed", fontWeight: 600 }}>
                  Deschide lucrarea →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {routeTo && (
        <div
          style={{
            position: "absolute",
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
