"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

export function MobileMap({ jobs }: { jobs: MobileMapJob[] }) {
  const [selfPos, setSelfPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setSelfPos([pos.coords.latitude, pos.coords.longitude]),
      () => setSelfPos(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const points: [number, number][] = [
    ...(selfPos ? [selfPos] : []),
    ...jobs.map((j) => [j.lat, j.lng] as [number, number]),
  ];
  const center = points[0] ?? FALLBACK_CENTER;

  return (
    <MapContainer center={center} zoom={points.length > 0 ? 13 : 6.5} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
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
  );
}
