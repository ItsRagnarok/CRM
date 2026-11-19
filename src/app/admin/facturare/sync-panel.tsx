"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { syncOblioPage } from "./sync-actions";
import type { SyncState } from "@/lib/billing/sync";
export function SyncPanel() {
  const router = useRouter();
  const busy = useRef(false);
  const mounted = useRef(true);
  const [working, setWorking] = useState(false);
  const [state, setState] = useState<SyncState>();
  const [error, setError] = useState("");
  const run = useCallback(
    async (force: boolean) => {
      if (busy.current) return;
      busy.current = true;
      setWorking(true);
      setError("");
      let key: string | undefined;
      try {
        while (mounted.current) {
          const result = await syncOblioPage(key, force && !key);
          if (result.error) {
            setError(result.error);
            break;
          }
          const next = result.state!;
          setState(next);
          key = next.run_key;
          if (next.phase === "done") break;
          await new Promise((r) => setTimeout(r, 900));
        }
      } catch {
        if (mounted.current)
          setError("Conexiunea s-a întrerupt. Poți relua sincronizarea.");
      } finally {
        busy.current = false;
        if (mounted.current) {
          setWorking(false);
          router.refresh();
        }
      }
    },
    [router],
  );
  useEffect(() => {
    mounted.current = true;
    void run(false);
    return () => {
      mounted.current = false;
    };
  }, [run]);
  return (
    <section
      className="mb-6 rounded-2xl border border-purple/20 bg-purple-soft p-4"
      aria-label="Sincronizare Oblio"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-purple">
            {working
              ? "Se preiau datele existente din Oblio…"
              : state?.phase === "done"
                ? "Istoricul Oblio este sincronizat"
                : "Datele contului Oblio"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {state
              ? `${state.clients_seen} clienți verificați · ${state.documents_seen} facturi verificate`
              : "Facturile și clienții existenți se încarcă automat la deschiderea modulului."}
          </p>
        </div>
        <button
          type="button"
          disabled={working}
          onClick={() => void run(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-purple disabled:opacity-60"
        >
          <RefreshCw size={15} className={working ? "animate-spin" : ""} />
          {working ? "Sincronizare în curs" : "Actualizează din Oblio"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error} Istoricul poate fi incomplet.
        </p>
      )}
      {!working && state?.completed_at && (
        <p className="mt-2 text-xs text-muted">
          Ultima sincronizare completă:{" "}
          {new Date(state.completed_at).toLocaleString("ro-RO", {
            timeZone: "Europe/Bucharest",
          })}
        </p>
      )}
    </section>
  );
}
