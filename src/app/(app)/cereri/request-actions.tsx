"use client";

import { useState, useTransition } from "react";
import { convertRequest, setRequestStatus } from "./actions";

/** Butoanele unei cereri: fă lucrare, contactată, respinge (cu motiv), redeschide. */
export function RequestActions({ id, status }: { id: string; status: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [pending, start] = useTransition();
  const btn = "rounded-[9px] border border-[#d0d5dd] bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#344054] disabled:opacity-50";

  if (status === "respinsa") {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => start(() => setRequestStatus(id, "noua"))} className={btn}>Redeschide</button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => start(() => convertRequest(id))} className="rounded-[9px] bg-electric px-3.5 py-1.5 text-[12.5px] font-bold text-[#1f2024] disabled:opacity-50">
          {pending ? "Se deschide…" : "Fă lucrare"}
        </button>
        {status === "noua" && (
          <button type="button" disabled={pending} onClick={() => start(() => setRequestStatus(id, "contactata"))} className={btn}>Am vorbit cu clientul</button>
        )}
        {status === "contactata" && (
          <button type="button" disabled={pending} onClick={() => start(() => setRequestStatus(id, "noua"))} className={btn}>Mută înapoi la noi</button>
        )}
        <button type="button" disabled={pending} onClick={() => setRejecting((v) => !v)} className={btn}>Respinge</button>
      </div>
      {rejecting && (
        <form action={(fd) => start(() => setRequestStatus(id, "respinsa", fd))} className="flex flex-wrap gap-2">
          <label htmlFor={`note-${id}`} className="sr-only">Motivul respingerii</label>
          <input id={`note-${id}`} name="note" maxLength={500} placeholder="Motiv (ex: nu lucrăm în zona asta)" className="min-w-0 flex-1 rounded-[9px] border border-[#d0d5dd] px-3 py-1.5 text-[13px]" />
          <button type="submit" disabled={pending} className="rounded-[9px] bg-[#fef3f2] px-3 py-1.5 text-[12.5px] font-bold text-[#b42318]">Respinge cererea</button>
        </form>
      )}
    </div>
  );
}
