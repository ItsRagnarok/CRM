"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type DashboardMapMarker = {
  id: string;
  label: string;
  sublabel: string;
  statusLabel: string;
  color: string;
  lat: number;
  lng: number;
  href?: string;
  linkLabel?: string;
};

// Romania's rough center, used only when there's nothing to plot yet.
const FALLBACK_CENTER: [number, number] = [45.9443, 25.0094];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A labelled pill anchored above its dot, like a map tooltip pin — content
// is variable-width text, so it's sized by CSS rather than a fixed iconSize.
function pillIcon(label: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
      <span style="background:${color};color:#fff;padding:5px 11px;border-radius:999px;font-size:11.5px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(16,24,40,.3);">${escapeHtml(
        label
      )}</span>
      <span style="width:9px;height:9px;border-radius:50%;background:${color};border:2px solid #fff;margin-top:3px;box-shadow:0 1px 3px rgba(16,24,40,.3);"></span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
  });
}

function FitToMarkers({ markers }: { markers: DashboardMapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 48], maxZoom: 13 });
  }, [markers, map]);
  return null;
}

export default function DashboardMap({
  markers,
}: {
  markers: DashboardMapMarker[];
}) {
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : FALLBACK_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={markers.length > 0 ? 12 : 6.5}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "13px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers markers={markers} />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={pillIcon(marker.label, marker.color)}
        >
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>{marker.label}</div>
              <div style={{ color: "#667085" }}>{marker.sublabel}</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>
                {marker.statusLabel}
              </div>
              {marker.href && (
                <a href={marker.href} style={{ color: "#3b82f6", fontWeight: 600 }}>
                  {marker.linkLabel ?? "Deschide lucrarea →"}
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
