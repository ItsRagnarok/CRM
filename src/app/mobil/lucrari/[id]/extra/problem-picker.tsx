"use client";

import { useState } from "react";
import { addJobNote } from "../actions";

const PREDEFINED_PROBLEMS = [
  "Lipsește o piesă/material",
  "Sculă defectă",
  "Clientul nu e mulțumit",
  "Întârziere față de programare",
  "Acces dificil la locație",
];

export function ProblemPicker({ jobId }: { jobId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  if (selected) {
    return (
      <form
        action={addJobNote}
        className="flex flex-col gap-2"
        onSubmit={() => {
          setSelected(null);
          setDetail("");
        }}
      >
        <input type="hidden" name="jobId" value={jobId} />
        <input type="hidden" name="kind" value="problem" />
        <input type="hidden" name="text" value={detail ? `${selected}: ${detail}` : selected} />
        <div className="rounded-[10px] bg-danger-bg px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {selected}
        </div>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Ce anume? (opțional)"
          className="w-full rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[13px] outline-none focus:border-electric"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setDetail("");
            }}
            className="flex-1 rounded-[10px] bg-neutral-bg py-2.5 text-[12.5px] font-bold text-[#344054]"
          >
            Anulează
          </button>
          <button type="submit" className="flex-1 rounded-[10px] bg-danger py-2.5 text-[12.5px] font-bold text-white">
            Raportează
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {PREDEFINED_PROBLEMS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setSelected(p)}
          className="w-full rounded-[10px] bg-danger-bg px-3.5 py-2.5 text-left text-[13px] font-semibold text-danger"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
