"use client";

import { advanceMobileStage } from "../actions";

export function DepotNavigateButton({ jobId, lat, lng }: { jobId: string; lat: number; lng: number }) {
  return (
    <form action={advanceMobileStage} className="w-full">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="stage" value="cheltuiala" />
      <button
        type="submit"
        onClick={() => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
        }}
        className="block w-full rounded-[12px] border border-[#d0d5dd] py-[14px] text-center text-[14.5px] font-extrabold text-[#344054]"
      >
        NAVIGHEAZĂ SPRE DEPOZIT
      </button>
    </form>
  );
}
