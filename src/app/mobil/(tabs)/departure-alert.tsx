"use client";

import { useEffect, useState } from "react";
import { AlarmClock } from "lucide-react";

const PREP_BUFFER_MIN = 30;

type Job = {
  id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
};

export function DepartureAlert({ job }: { job: Job }) {
  const [route, setRoute] = useState<{ durationS: number; departureAt: Date; prepStartAt: Date } | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (job.lat == null || job.lng == null || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const url = `https://router.project-osrm.org/route/v1/driving/${pos.coords.longitude},${pos.coords.latitude};${job.lng},${job.lat}?overview=false`;
        fetch(url)
          .then((r) => r.json())
          .then((data) => {
            if (cancelled) return;
            const routeData = data?.routes?.[0];
            if (!routeData) return;
            const jobStart = new Date(`${job.scheduled_date}T${job.start_time}`);
            const departureAt = new Date(jobStart.getTime() - routeData.duration * 1000);
            const prepStartAt = new Date(departureAt.getTime() - PREP_BUFFER_MIN * 60 * 1000);
            setRoute({ durationS: routeData.duration, departureAt, prepStartAt });
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  // Recompute the countdown every 30s so the banner appears/updates on its own,
  // without the technician needing to reload the page.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!route) return null;
  if (now < route.prepStartAt) return null;

  const overdue = now >= route.departureAt;
  const minutesToDeparture = Math.max(0, Math.round((route.departureAt.getTime() - now.getTime()) / 60000));
  const driveMin = Math.round(route.durationS / 60);
  const timeLabel = (d: Date) => d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`mx-4 mt-3 flex items-start gap-2.5 rounded-[12px] p-3.5 ${overdue ? "bg-danger-bg" : "bg-[#fef9ec]"}`}>
      <AlarmClock className={`h-4 w-4 shrink-0 ${overdue ? "text-danger" : "text-[#b45309]"}`} />
      <div className="text-[12.5px] leading-snug">
        {overdue ? (
          <>
            <span className="font-bold text-danger">Ar trebui să fi plecat deja</span> spre „{job.title}” — drum
            estimat {driveMin} min.
          </>
        ) : (
          <>
            <span className="font-bold text-[#b45309]">Pregătește-te</span> — trebuie să pleci la ora{" "}
            {timeLabel(route.departureAt)} (peste {minutesToDeparture} min) spre „{job.title}”. Drum estimat{" "}
            {driveMin} min.
          </>
        )}
      </div>
    </div>
  );
}
