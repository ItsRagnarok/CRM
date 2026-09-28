"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { JOB_STATUS_LABELS, JOB_STATUS_MARKER_COLOR } from "@/lib/status";
import type { Database } from "@/lib/supabase/database.types";

type JobStatus = Database["public"]["Enums"]["job_status"];

export type DashboardMapJob = {
  id: string;
  displayNumber: number;
  title: string;
  clientName: string;
  status: JobStatus;
  lat: number;
  lng: number;
};

// Romania's rough center, used only when there's nothing to plot yet.
const FALLBACK_CENTER: [number, number] = [45.9443, 25.0094];

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(16,24,40,.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

function FitToMarkers({ jobs }: { jobs: DashboardMapJob[] }) {
  const map = useMap();
  useEffect(() => {
    if (jobs.length === 0) return;
    if (jobs.length === 1) {
      map.setView([jobs[0].lat, jobs[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(jobs.map((j) => [j.lat, j.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
  }, [jobs, map]);
  return null;
}

export default function DashboardMap({ jobs }: { jobs: DashboardMapJob[] }) {
  const center: [number, number] =
    jobs.length > 0 ? [jobs[0].lat, jobs[0].lng] : FALLBACK_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={jobs.length > 0 ? 12 : 6.5}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "13px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers jobs={jobs} />
      {jobs.map((job) => (
        <Marker
          key={job.id}
          position={[job.lat, job.lng]}
          icon={markerIcon(JOB_STATUS_MARKER_COLOR[job.status])}
        >
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>
                #{job.displayNumber} — {job.title}
              </div>
              <div style={{ color: "#667085" }}>{job.clientName}</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>
                {JOB_STATUS_LABELS[job.status]}
              </div>
              <a
                href={`/lucrari/${job.id}`}
                style={{ color: "#2f6fed", fontWeight: 600 }}
              >
                Deschide lucrarea →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
