"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ShieldAlert } from "lucide-react";
import { INCIDENT_KINDS, itmHint, type IncidentKind } from "@/lib/ssm";
import { runOrQueue } from "@/lib/offline/send";
import { shrink } from "@/app/mobil/lucrari/[id]/foto/photo-capture";

/** Raport de incident în 3 atingeri: ce s-a întâmplat, (opțional) poza, Trimite. Merge și fără semnal. */
export function IncidentForm({ jobId, jobLabel, defaultKind }: { jobId: string | null; jobLabel: string | null; defaultKind: IncidentKind | null }) {
  const [kind, setKind] = useState<IncidentKind | null>(defaultKind);
  const [injured, setInjured] = useState<boolean | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [state, setState] = useState<{ status: "idle" | "busy" | "sent" | "queued" | "error"; error?: string }>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { timeout: 6000, maximumAge: 120000 });
  }, []);

  if (state.status === "sent" || state.status === "queued") {
    return (
      <div className="m-bd">
        <div className="m-note ac" role="status">
          <div className="m-fl">
            <b>{state.status === "sent" ? "Raportul a ajuns la birou." : "Raportul e salvat pe telefon."}</b>{" "}
            {state.status === "sent" ? "Biroul a primit notificare." : "Pleacă singur când revine semnalul. Dacă e urgent, sună biroul acum."}
          </div>
        </div>
        {kind === "accident" && injured && <div className="m-note warn"><b>Dacă e nevoie, sună la 112.</b> Primul ajutor înaintea oricărui raport.</div>}
        <Link href={jobId ? `/mobil/lucrari/${jobId}` : "/mobil"} className="m-btn">Înapoi</Link>
      </div>
    );
  }

  const ready = kind && (kind !== "accident" || injured !== null);
  return (
    <div className="m-bd">
      {jobLabel && <div className="m-mu m-sm">Lucrarea: <b>{jobLabel}</b></div>}
      <div className="m-lb">Ce s-a întâmplat?</div>
      <div style={{ display: "grid", gap: 8 }}>
        {INCIDENT_KINDS.map((k) => (
          <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`m-cd${kind === k.id ? " on" : ""}`} style={{ textAlign: "left", display: "grid", gap: 2, borderColor: kind === k.id ? "var(--m-ink)" : undefined, borderWidth: kind === k.id ? 2 : undefined }}>
            <span style={{ fontSize: 15.5, fontWeight: 800 }}>{k.label}</span>
            <span className="m-mu m-sm">{k.hint}</span>
          </button>
        ))}
      </div>

      {kind === "accident" && (
        <>
          <div className="m-lb">E cineva rănit?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {([[true, "Da"], [false, "Nu"]] as const).map(([v, l]) => (
              <button key={l} type="button" onClick={() => setInjured(v)} className={`m-chip ${injured === v ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }}>{l}</button>
            ))}
          </div>
          {injured && <div className="m-note warn"><b>Primul ajutor întâi. Sună la 112 dacă e nevoie.</b> Raportul poate aștepta.</div>}
        </>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const blob = await shrink(f);
        setPhoto({ blob, url: URL.createObjectURL(blob) });
      }} />
      <button type="button" className="m-bt2" onClick={() => fileRef.current?.click()}>
        <Camera className="m-i" /> {photo ? "Altă poză" : "Poză (opțional)"}
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img src={photo.url} alt="Poza atașată" style={{ width: "100%", borderRadius: 14, maxHeight: 220, objectFit: "cover" }} />}
      <textarea className="m-in" rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pe scurt (opțional): ce, unde, cine" />

      {kind && <div className="m-mu m-sm">{itmHint(kind, Boolean(injured))}</div>}
      {state.status === "error" && <div role="alert" className="m-note warn">{state.error}</div>}
      <button
        type="button"
        className={`m-btn${ready ? "" : " off"}`}
        disabled={!ready || state.status === "busy"}
        onClick={async () => {
          if (!kind) return;
          setState({ status: "busy" });
          const r = await runOrQueue({ kind: "incident", jobId, incidentKind: kind, injured: Boolean(injured), description, file: photo?.blob ?? null, at: new Date().toISOString(), lat: pos?.lat ?? null, lng: pos?.lng ?? null });
          setState(r.status === "error" ? { status: "error", error: r.error } : { status: r.status });
        }}
      >
        <ShieldAlert className="m-i" /> {state.status === "busy" ? "Se trimite…" : "Trimite la birou"}
      </button>
    </div>
  );
}
