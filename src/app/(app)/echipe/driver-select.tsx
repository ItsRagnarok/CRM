"use client";

import { useState, useTransition } from "react";
import { setVehicleDriver } from "./actions";

export function DriverSelect({
  vehicleId,
  teamId,
  driverId,
  options,
}: {
  vehicleId: string;
  teamId?: string;
  driverId: string | null;
  options: { id: string; name: string }[];
}) {
  const [value, setValue] = useState(driverId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string) {
    const prev = value;
    setValue(next);
    setError(null);
    const formData = new FormData();
    formData.set("vehicleId", vehicleId);
    if (teamId) formData.set("teamId", teamId);
    if (next) formData.set("driverId", next);
    startTransition(async () => {
      const result = await setVehicleDriver(formData);
      if (result?.error) {
        setValue(prev);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-[8px] border border-[#d0d5dd] px-2.5 py-1.5 text-[12.5px] font-semibold outline-none focus:border-electric disabled:opacity-60"
      >
        <option value="">Nesetat</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {pending && <span className="text-[11px] text-muted-2">Se salvează…</span>}
      {error && <span className="text-[11px] font-semibold text-danger">{error}</span>}
    </div>
  );
}
