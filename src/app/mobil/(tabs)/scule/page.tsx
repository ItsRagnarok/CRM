import { Wrench } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScreenHeader } from "@/components/mobile/ui";
import { EmptyState } from "@/components/empty-state";
import { todayInOrgTimeZone } from "@/lib/date";
import { CALIBRATION_LABEL, calibrationState, categoryLabel, conditionLabel } from "@/lib/tools";
import { ConfirmForm, ReturnForm } from "./tool-forms";

const day = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Sculele mele: ce am primit de confirmat, ce am la mine și calibrarea aparatelor. */
export default async function MobileToolsPage() {
  const { profile } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();
  const [{ data: pending }, { data: mine }] = await Promise.all([
    supabase.from("tool_handovers").select("id, condition, note, created_at, tools(id, name, category, serial, needs_calibration)").eq("to_profile_id", profile.id).eq("kind", "predare").eq("status", "asteapta").order("created_at", { ascending: false }),
    supabase.from("tools").select("id, name, category, serial, condition, needs_calibration, tool_handovers(kind, status)").eq("holder_profile_id", profile.id).order("name"),
  ]);
  // Tehnicianul nu citește direct Conformitatea: data calibrării vine prin funcția care arată doar data, pentru firma lui.
  const calIds = [...new Set([...(pending ?? []).map((p) => p.tools).filter((t) => t?.needs_calibration).map((t) => t!.id), ...(mine ?? []).filter((t) => t.needs_calibration).map((t) => t.id)])];
  const calPairs = await Promise.all(calIds.map(async (id) => [id, (await supabase.rpc("tool_calibration_expires", { p_tool: id })).data as string | null] as const));
  const calOf = new Map(calPairs);
  const pendingToolIds = new Set((pending ?? []).map((p) => p.tools?.id));
  const held = (mine ?? []).filter((t) => !pendingToolIds.has(t.id));

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Sculele mele" back="/mobil/meniu" />
      <div className="m-bd">
        {(pending ?? []).length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="m-lb">De confirmat</div>
            {(pending ?? []).map((p) => {
              const exp = p.tools ? calOf.get(p.tools.id) ?? null : null;
              const cal = calibrationState(Boolean(p.tools?.needs_calibration), exp, today);
              return (
                <div key={p.id} className="m-cd" style={{ display: "grid", gap: 8, borderColor: "var(--m-ink)" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{p.tools?.name}</div>
                    <div className="m-mu m-sm">{categoryLabel(p.tools?.category ?? "")}{p.tools?.serial ? ` · SN ${p.tools.serial}` : ""} · predată {day(p.created_at)}</div>
                    {cal && cal !== "ok" && <div className="m-note warn" style={{ marginTop: 6 }}>{CALIBRATION_LABEL[cal]}{exp ? ` (${day(exp)})` : ""}: măsurătorile cu el nu au valoare legală.</div>}
                    {p.note && <div className="m-sm" style={{ marginTop: 4 }}>„{p.note}”</div>}
                  </div>
                  <ConfirmForm handoverId={p.id} condition={p.condition} />
                </div>
              );
            })}
          </div>
        )}

        <div className="m-lb">La mine · {held.length}</div>
        {held.length === 0 ? (
          <EmptyState icon={Wrench} title="Nicio sculă pe numele tău" description="Când biroul îți predă o sculă, apare aici și o confirmi." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {held.map((t) => {
              const exp = calOf.get(t.id) ?? null;
              const cal = calibrationState(t.needs_calibration, exp, today);
              const returning = (t.tool_handovers ?? []).some((h) => h.kind === "returnare" && h.status === "asteapta");
              return (
                <div key={t.id} className="m-cd" style={{ display: "grid", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{t.name}</div>
                    <div className="m-mu m-sm">{categoryLabel(t.category)}{t.serial ? ` · SN ${t.serial}` : ""} · stare {conditionLabel(t.condition).toLowerCase()}</div>
                    {cal && <div className={cal === "ok" ? "m-mu m-sm" : "m-note warn"} style={{ marginTop: 6 }}>{CALIBRATION_LABEL[cal]}{exp ? ` · până la ${day(exp)}` : ""}</div>}
                  </div>
                  {returning ? <div className="m-note">Returnare anunțată. Așteaptă confirmarea biroului.</div> : <ReturnForm toolId={t.id} condition={t.condition} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
