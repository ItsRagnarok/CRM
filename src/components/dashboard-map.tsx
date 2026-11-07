"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, LayersControl, ScaleControl, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";
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
  // Live GPS dots get a pulsing ring so "who is moving right now" reads at a glance.
  live?: boolean;
};

export type DashboardMapTrail = {
  id: string;
  color: string;
  points: [number, number][];
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
function pillIcon(label: string, color: string, live: boolean) {
  const dot = live
    ? `<span class="ef-pin-dot ef-pin-live" style="background:${color};color:${color};"></span>`
    : `<span class="ef-pin-dot" style="background:${color};"></span>`;
  return L.divIcon({
    className: "ef-pin",
    html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
      <span class="ef-pin-label" style="background:${color};">${escapeHtml(label)}</span>
      ${dot}
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
  });
}

const MAP_CSS = `
.ef-pin { cursor: pointer; }
.ef-pin-label { color:#fff;padding:5px 11px;border-radius:999px;font-size:11.5px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(16,24,40,.3);transition:transform .15s ease, box-shadow .15s ease; }
.ef-pin:hover .ef-pin-label { transform:scale(1.08);box-shadow:0 4px 12px rgba(16,24,40,.35); }
.ef-pin-dot { width:9px;height:9px;border-radius:50%;border:2px solid #fff;margin-top:3px;box-shadow:0 1px 3px rgba(16,24,40,.3);display:block; }
.ef-pin-live { animation: ef-pulse 1.8s ease-out infinite; }
@keyframes ef-pulse { 0% { box-shadow:0 0 0 0 currentColor; } 70% { box-shadow:0 0 0 12px transparent; } 100% { box-shadow:0 0 0 0 transparent; } }
.leaflet-container { font-family: inherit; }
.leaflet-popup-content-wrapper { border-radius: 12px; }
`;

// Fits the view once per SET of things on the map (not on every refresh):
// the page auto-refreshes and live GPS dots move, and re-fitting each time
// threw away whatever the user had just zoomed or dragged to.
function FitToMarkers({ markers, fitKey }: { markers: DashboardMapMarker[]; fitKey: string }) {
  const map = useMap();
  const markersRef = useRef(markers);
  markersRef.current = markers;
  useEffect(() => {
    const current = markersRef.current;
    if (current.length === 0) return;
    if (current.length === 1) {
      map.setView([current[0].lat, current[0].lng], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(current.map((m) => [m.lat, m.lng])), { padding: [40, 48], maxZoom: 13 });
  }, [fitKey, map]);
  return null;
}

function FlyToSelected({ markers, selectedId }: { markers: DashboardMapMarker[]; selectedId?: string }) {
  const map = useMap();
  const markersRef = useRef(markers);
  markersRef.current = markers;
  useEffect(() => {
    if (!selectedId) return;
    const target = markersRef.current.find((m) => m.id === selectedId);
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [selectedId, map]);
  return null;
}

function RecenterButton({ markers }: { markers: DashboardMapMarker[] }) {
  const map = useMap();
  if (markers.length < 2) return null;
  return (
    <button
      type="button"
      aria-label="Recentrează harta pe toate punctele"
      title="Arată toate punctele"
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={() => map.flyToBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 48], maxZoom: 13, duration: 0.7 })}
      style={{
        position: "absolute",
        zIndex: 1000,
        left: 10,
        top: 84,
        width: 34,
        height: 34,
        borderRadius: 4,
        border: "2px solid rgba(0,0,0,0.2)",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <Crosshair size={17} color="#344054" />
    </button>
  );
}

export default function DashboardMap({
  markers,
  trails,
  selectedId,
}: {
  markers: DashboardMapMarker[];
  trails?: DashboardMapTrail[];
  selectedId?: string;
}) {
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : FALLBACK_CENTER;
  const fitKey = useMemo(() => markers.map((m) => m.id).sort().join("|"), [markers]);

  return (
    <MapContainer
      center={center}
      zoom={markers.length > 0 ? 12 : 6.5}
      scrollWheelZoom
      doubleClickZoom
      dragging
      zoomSnap={0.5}
      zoomDelta={1}
      wheelPxPerZoomLevel={120}
      style={{ height: "100%", width: "100%", borderRadius: "13px" }}
    >
      <style>{MAP_CSS}</style>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Stradă">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satelit">
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Relief">
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ScaleControl position="bottomleft" imperial={false} />
      <FitToMarkers markers={markers} fitKey={fitKey} />
      <FlyToSelected markers={markers} selectedId={selectedId} />
      <RecenterButton markers={markers} />
      {(trails ?? []).map(
        (trail) =>
          trail.points.length > 1 && (
            <Polyline key={trail.id} positions={trail.points} pathOptions={{ color: trail.color, weight: 3, opacity: 0.6 }} />
          )
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={pillIcon(marker.label, marker.color, !!marker.live)}
          eventHandlers={{
            click: (e) => {
              const map = e.target._map as L.Map | undefined;
              map?.flyTo(e.latlng, Math.max(map.getZoom(), 14), { duration: 0.6 });
            },
          }}
        >
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>{marker.label}</div>
              <div style={{ color: "#667085" }}>{marker.sublabel}</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>{marker.statusLabel}</div>
              {marker.href && (
                <Link href={marker.href} style={{ color: "#3b82f6", fontWeight: 600 }}>
                  {marker.linkLabel ?? "Deschide lucrarea →"}
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
