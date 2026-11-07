"use client";

import { useState, useTransition } from "react";
import { setNotificationPref, sendTestNotification } from "./actions";
import type { PrefKey } from "@/lib/notify";
import type { PushResult } from "@/lib/push";

export type PrefRow = { key: PrefKey; title: string; description: string; enabled: boolean };

export function Preferences({ rows }: { rows: PrefRow[] }) {
  const [state, setState] = useState(() => Object.fromEntries(rows.map((r) => [r.key, r.enabled])) as Record<PrefKey, boolean>);
  const [, startTransition] = useTransition();

  function toggle(key: PrefKey) {
    const next = !state[key];
    setState((s) => ({ ...s, [key]: next }));
    startTransition(async () => {
      const result = await setNotificationPref(key, next);
      if (result.error) setState((s) => ({ ...s, [key]: !next }));
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#eaecf0] bg-white">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3 border-b border-[#eaecf0] p-3.5 last:border-b-0">
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold">{r.title}</div>
            <div className="mt-0.5 text-[12px] leading-snug text-muted">{r.description}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state[r.key]}
            aria-label={r.title}
            onClick={() => toggle(r.key)}
            className="flex h-11 w-12 shrink-0 items-center"
          >
            <span className={`relative block h-[26px] w-11 rounded-full transition-colors ${state[r.key] ? "bg-electric" : "bg-[#d0d5dd]"}`}>
              <span
                className={`absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  state[r.key] ? "translate-x-[18px]" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

const MESSAGES: Record<PushResult["status"], (r: PushResult) => { ok: boolean; text: string }> = {
  sent: (r) => ({
    ok: true,
    text: `Trimisă către ${r.delivered} ${r.delivered === 1 ? "telefon" : "telefoane"}. Ar trebui să apară în câteva secunde, chiar dacă aplicația e închisă.`,
  }),
  no_devices: () => ({
    ok: false,
    text: "Niciun telefon nu e înregistrat pentru contul tău. Deschide aplicația Android, permite notificările și încearcă din nou.",
  }),
  not_configured: () => ({
    ok: false,
    text: "Serverul nu are Firebase configurat (lipsesc variabilele FIREBASE_* din Vercel). Notificarea a apărut doar în clopoțel.",
  }),
  failed: () => ({
    ok: false,
    text: "Trimiterea către telefon a eșuat. Notificarea a apărut în clopoțel; detaliile sunt în logurile serverului.",
  }),
  no_profiles: () => ({ ok: false, text: "Nu am găsit contul tău." }),
};

export function TestPushButton() {
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);

  function run() {
    setOutcome(null);
    startTransition(async () => {
      try {
        const result = await sendTestNotification();
        setOutcome(MESSAGES[result.status](result));
      } catch {
        setOutcome({ ok: false, text: "Nu am putut trimite notificarea de test." });
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-electric text-[14px] font-bold text-white disabled:opacity-60"
      >
        {pending ? "Se trimite…" : "Trimite o notificare de test"}
      </button>
      {outcome && (
        <div
          role="status"
          className={`mt-3 rounded-[12px] border p-3.5 text-[12.5px] leading-snug ${
            outcome.ok ? "border-[#abefc6] bg-[#ecfdf3] text-[#067647]" : "border-[#fedf89] bg-[#fffaeb] text-[#b54708]"
          }`}
        >
          {outcome.text}
        </div>
      )}
    </div>
  );
}
