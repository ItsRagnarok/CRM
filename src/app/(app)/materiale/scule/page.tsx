import Link from "next/link";
import { Wrench, AlertTriangle, FileText, Plus } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayInOrgTimeZone } from "@/lib/date";
import { StocTabs } from "@/components/stoc-tabs";
import { EmptyState } from "@/components/empty-state";
import { TOOL_CATEGORIES, CONDITIONS, TOOL_STATUS, CALIBRATION_LABEL, calibrationState, categoryLabel, conditionLabel, type CalibrationState } from "@/lib/tools";
import { addTool, handoverTool, receiveTool, recalibrateTool, setToolStatus } from "./actions";

const input = "rounded-lg border border-border bg-white px-2.5 py-2 text-[13px]";
const CAL_TONE: Record<Exclude<CalibrationState, null>, string> = {
  expirata: "bg-danger-bg text-danger",
  expira: "bg-warning-bg text-warning",
  ok: "bg-success-bg text-success",
  lipsa: "bg-warning-bg text-warning",
};
const lei = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} lei`;
const day = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const MSG: Record<string, string> = {
  nume: "Scrie numele sculei.", valoare: "Valoarea trebuie să fie un număr.", "calibrare-data": "Alege data până la care e valabilă calibrarea.",
  salvare: "Nu am putut salva. Încearcă din nou.", persoana: "Alege cui predai scula.", predare: "Nu am putut preda scula.", primire: "Nu am putut înregistra primirea.",
  calibrare: "Aparatul are calibrarea expirată. Trimite-l la calibrare sau bifează „Predau oricum” dacă știi ce faci.",
};

type Filter = "toate" | "aparate" | "probleme" | "la-oameni" | "depozit";

/** Registrul de scule: cine are fiecare sculă, în ce stare, cu predare-primire confirmată și calibrarea din Conformitate. */
export default async function SculePage({ searchParams }: { searchParams: Promise<{ f?: string; eroare?: string; t?: string; adaugat?: string; predat?: string; primit?: string; calibrat?: string }> }) {
  const sp = await searchParams;
  const filter = (["toate", "aparate", "probleme", "la-oameni", "depozit"] as Filter[]).find((x) => x === sp.f) ?? "toate";
  const { organization, readOnly } = await requireSessionContext();
  const supabase = await createClient();
  const today = todayInOrgTimeZone();

  const [{ data: tools }, { data: handovers }, { data: people }, { data: vehicles }] = await Promise.all([
    supabase.from("tools").select("*, compliance_items(expires_on, issued_on)").eq("organization_id", organization.id).order("name"),
    supabase.from("tool_handovers").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id, full_name, role").eq("organization_id", organization.id).eq("is_active", true).order("full_name"),
    supabase.from("vehicles").select("id, name, plate_number").eq("organization_id", organization.id).eq("is_active", true).order("name"),
  ]);

  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const vehicleOf = new Map((vehicles ?? []).map((v) => [v.id, v.name]));
  const byTool = new Map<string, NonNullable<typeof handovers>>();
  for (const h of handovers ?? []) byTool.set(h.tool_id, [...(byTool.get(h.tool_id) ?? []), h]);

  const rows = (tools ?? []).map((t) => {
    const cal = calibrationState(t.needs_calibration, t.compliance_items?.expires_on, today);
    const hist = byTool.get(t.id) ?? [];
    const pendingOut = hist.find((h) => h.kind === "predare" && h.status === "asteapta");
    const pendingBack = hist.find((h) => h.kind === "returnare" && h.status === "asteapta");
    const problem = cal === "expirata" || cal === "lipsa" || cal === "expira" || t.condition === "defecta" || t.status === "service" || !!pendingOut || !!pendingBack;
    return { ...t, cal, hist, pendingOut, pendingBack, problem };
  });
  const active = rows.filter((r) => r.status !== "pierdut" && r.status !== "casat");
  const shown = rows.filter((r) =>
    filter === "aparate" ? r.category === "aparat" :
    filter === "probleme" ? r.problem :
    filter === "la-oameni" ? r.status === "predat" :
    filter === "depozit" ? r.status === "disponibil" : true,
  );
  const count = {
    total: active.length,
    value: active.reduce((a, r) => a + Number(r.value ?? 0), 0),
    held: active.filter((r) => r.status === "predat").length,
    depot: active.filter((r) => r.status === "disponibil").length,
    expired: active.filter((r) => r.cal === "expirata" || r.cal === "lipsa").length,
    soon: active.filter((r) => r.cal === "expira").length,
    unconfirmed: active.filter((r) => r.pendingOut).length,
    returning: active.filter((r) => r.pendingBack).length,
  };
  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${on ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`;
  const techs = (people ?? []).filter((p) => p.role !== "client");

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-7">
      <StocTabs active="/materiale/scule" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground">Registru de scule</h1>
          <p className="mt-1 max-w-[75ch] text-[13px] text-muted">Fiecare sculă și aparat: seria, valoarea, la cine e și în ce stare. Predarea o confirmă omul în aplicație, returnarea o confirmi tu. Aparatele de măsură au calibrarea în Conformitate; cu calibrarea expirată, aparatul nu se predă fără confirmare.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {[
          ["Scule", String(count.total)], ["Valoare", lei(count.value)], ["La oameni", String(count.held)], ["În depozit", String(count.depot)],
          ["Calibrare expirată", String(count.expired)], ["Expiră în 30 de zile", String(count.soon)], ["Neconfirmate", String(count.unconfirmed)], ["De primit înapoi", String(count.returning)],
        ].map(([l, v], i) => (
          <div key={l} className={`rounded-xl border p-3 ${(i === 4 && count.expired) || (i === 6 && count.unconfirmed) || (i === 7 && count.returning) ? "border-[#f3b4ae] bg-danger-bg/40" : i === 5 && count.soon ? "border-[#f5d9a8] bg-warning-bg/50" : "border-border bg-white"}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{l}</div>
            <div className="mt-0.5 text-[18px] font-extrabold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      {sp.eroare && <p role="alert" className="rounded-lg border border-[#f3b4ae] bg-danger-bg p-3 text-[13px] text-danger">{MSG[sp.eroare] ?? "Ceva n-a mers. Încearcă din nou."}</p>}
      {(sp.adaugat || sp.predat || sp.primit || sp.calibrat) && <p role="status" className="rounded-lg border border-border bg-success-bg/60 p-3 text-[13px]">{sp.adaugat ? "Scula a fost adăugată." : sp.predat ? "Scula a fost predată. Omul primește notificare și confirmă în aplicație." : sp.primit ? "Scula a fost primită înapoi." : "Calibrarea a fost actualizată și în Conformitate."}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {([["toate", "Toate"], ["probleme", "De rezolvat"], ["aparate", "Aparate de măsură"], ["la-oameni", "La oameni"], ["depozit", "În depozit"]] as [Filter, string][]).map(([f, l]) => (
          <Link key={f} href={f === "toate" ? "/materiale/scule" : `/materiale/scule?f=${f}`} className={chip(filter === f)}>{l}</Link>
        ))}
      </div>

      {!readOnly && (
        <details className="rounded-[13px] border border-border bg-white p-4" open={(tools ?? []).length === 0}>
          <summary className="flex cursor-pointer items-center gap-1.5 text-[14px] font-bold"><Plus className="h-4 w-4" /> Adaugă sculă sau aparat</summary>
          <form action={addTool} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-[12px] text-muted sm:col-span-2">Denumire<input name="name" required maxLength={160} placeholder="ex. Megohmmetru Fluke 1507" className={input} /></label>
            <label className="flex flex-col gap-1 text-[12px] text-muted">Tip<select name="category" className={input}>{TOOL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
            <label className="flex flex-col gap-1 text-[12px] text-muted">Valoare (lei)<input name="value" inputMode="decimal" className={input} /></label>
            <label className="flex flex-col gap-1 text-[12px] text-muted">Serie<input name="serial" maxLength={80} className={input} /></label>
            <label className="flex flex-col gap-1 text-[12px] text-muted">Cod inventar<input name="inventoryCode" maxLength={40} placeholder="ex. SC-012" className={input} /></label>
            <label className="flex items-center gap-2 self-end pb-2 text-[13px] font-semibold"><input type="checkbox" name="needsCalibration" className="h-4 w-4" /> Are calibrare / verificare metrologică</label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-[12px] text-muted">Calibrat pe<input type="date" name="calibrationIssued" className={input} /></label>
              <label className="flex flex-1 flex-col gap-1 text-[12px] text-muted">Valabil până la<input type="date" name="calibrationExpires" className={input} /></label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4"><button className="rounded-[10px] bg-[#1f2024] px-4 py-2 text-[13px] font-bold text-white">Adaugă în registru</button></div>
          </form>
        </details>
      )}

      {shown.length === 0 ? (
        <div className="rounded-[13px] border border-border bg-white p-5"><EmptyState icon={Wrench} title={(tools ?? []).length ? "Nimic aici" : "Registrul e gol"} description={(tools ?? []).length ? "Nicio sculă pentru filtrul ales." : "Adaugă sculele și aparatele firmei, cu seria și valoarea. Pentru aparatele de măsură pune și data calibrării."} /></div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shown.map((t) => {
            const holder = t.holder_profile_id ? nameOf.get(t.holder_profile_id) ?? "—" : null;
            return (
              <li key={t.id} id={`t-${t.id}`} className={`scroll-mt-4 rounded-[13px] border bg-white ${t.cal === "expirata" || t.cal === "lipsa" || t.condition === "defecta" || (sp.t === t.id && sp.eroare) ? "border-[#f3b4ae]" : "border-border"} ${["pierdut", "casat"].includes(t.status) ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <div className="text-[14.5px] font-bold">{t.name}</div>
                    <div className="text-[12px] text-muted">{categoryLabel(t.category)}{t.serial ? ` · SN ${t.serial}` : ""}{t.inventory_code ? ` · ${t.inventory_code}` : ""}{t.value != null ? ` · ${lei(Number(t.value))}` : ""}</div>
                  </div>
                  <div className="min-w-40 text-[13px]">
                    <div className="font-semibold">{holder ?? TOOL_STATUS[t.status]}</div>
                    <div className="text-[12px] text-muted">{t.holder_vehicle_id ? `în ${vehicleOf.get(t.holder_vehicle_id) ?? "mașină"}` : ""}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.cal && <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${CAL_TONE[t.cal]}`}>{CALIBRATION_LABEL[t.cal]}{t.compliance_items?.expires_on ? ` · ${day(t.compliance_items.expires_on)}` : ""}</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${t.condition === "defecta" ? "bg-danger-bg text-danger" : t.condition === "uzata" ? "bg-warning-bg text-warning" : "bg-neutral-bg text-muted"}`}>Stare: {conditionLabel(t.condition).toLowerCase()}</span>
                    {t.pendingOut && <span className="rounded-full bg-[#fef9ec] px-2.5 py-0.5 text-[11.5px] font-bold text-[#b45309]">Așteaptă confirmarea lui {nameOf.get(t.pendingOut.to_profile_id ?? "") ?? "—"}</span>}
                    {t.pendingBack && <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[11.5px] font-bold text-[#1d4ed8]">Returnată de {nameOf.get(t.pendingBack.from_profile_id ?? "") ?? "—"}: confirmă primirea</span>}
                    {["service", "pierdut", "casat"].includes(t.status) && <span className="rounded-full bg-neutral-bg px-2.5 py-0.5 text-[11.5px] font-bold text-muted">{TOOL_STATUS[t.status]}</span>}
                  </div>
                </div>
                <details className="border-t border-border px-4 py-2.5" open={sp.t === t.id || !!t.pendingBack}>
                  <summary className="cursor-pointer text-[13px] font-bold text-accent-ink">Predare, primire și istoric</summary>
                  <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {!readOnly && !["pierdut", "casat"].includes(t.status) && (
                      <div className="flex flex-col gap-3">
                        <form action={handoverTool} className="flex flex-col gap-2 rounded-xl bg-neutral-bg/60 p-3">
                          <div className="text-[13px] font-bold">{t.holder_profile_id ? "Predă altcuiva" : "Predă"}</div>
                          <input type="hidden" name="toolId" value={t.id} />
                          <div className="flex flex-wrap gap-2">
                            <select name="profileId" required defaultValue="" className={`${input} min-w-0 flex-1`}><option value="" disabled>Cui?</option>{techs.filter((p) => p.id !== t.holder_profile_id).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
                            <select name="vehicleId" defaultValue="" className={`${input} min-w-0 flex-1`}><option value="">Fără mașină</option>{(vehicles ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                            <select name="condition" defaultValue={t.condition} className={input}>{CONDITIONS.map((c) => <option key={c.id} value={c.id}>Stare: {c.label.toLowerCase()}</option>)}</select>
                          </div>
                          <input name="note" maxLength={500} placeholder="Notă (opțional), ex. cu husă și 2 cabluri de test" className={input} />
                          {(t.cal === "expirata" || t.cal === "lipsa") && (
                            <label className="flex items-start gap-2 text-[12.5px] text-danger"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><input type="checkbox" name="force" className="mr-1.5 align-middle" />Predau oricum (calibrarea {t.cal === "lipsa" ? "lipsește" : "e expirată"}; măsurătorile nu au valoare legală)</span></label>
                          )}
                          <button className="self-start rounded-[10px] bg-[#1f2024] px-3.5 py-2 text-[13px] font-bold text-white">Predă</button>
                        </form>
                        {t.status === "predat" && (
                          <form action={receiveTool} className="flex flex-col gap-2 rounded-xl bg-neutral-bg/60 p-3">
                            <div className="text-[13px] font-bold">{t.pendingBack ? "Confirmă că ai primit-o înapoi" : "Primește înapoi în depozit"}</div>
                            <input type="hidden" name="toolId" value={t.id} />
                            {t.pendingBack && <p className="text-[12.5px] text-muted">{nameOf.get(t.pendingBack.from_profile_id ?? "")} o returnează în stare {conditionLabel(t.pendingBack.condition).toLowerCase()}{t.pendingBack.note ? `: „${t.pendingBack.note}”` : "."}</p>}
                            <div className="flex flex-wrap gap-2">
                              <select name="condition" defaultValue={t.pendingBack?.condition ?? t.condition} className={input}>{CONDITIONS.map((c) => <option key={c.id} value={c.id}>Stare: {c.label.toLowerCase()}</option>)}</select>
                              <input name="note" maxLength={500} placeholder="Notă (opțional)" className={`${input} min-w-0 flex-1`} />
                            </div>
                            <button className="self-start rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold">Am primit-o</button>
                          </form>
                        )}
                        {t.needs_calibration && (
                          <form action={recalibrateTool} className="flex flex-wrap items-end gap-2 rounded-xl bg-neutral-bg/60 p-3">
                            <input type="hidden" name="toolId" value={t.id} />
                            <div className="basis-full text-[13px] font-bold">Calibrare nouă</div>
                            <label className="flex flex-col gap-1 text-[12px] text-muted">Calibrat pe<input type="date" name="issued" defaultValue={today} className={input} /></label>
                            <label className="flex flex-col gap-1 text-[12px] text-muted">Valabil până la<input type="date" name="expires" required className={input} /></label>
                            <button className="rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-bold">Salvează</button>
                          </form>
                        )}
                        <form action={setToolStatus} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                          <input type="hidden" name="toolId" value={t.id} />
                          {t.status === "service" && <button name="status" value="disponibil" className="rounded-lg border border-border px-2.5 py-1 font-bold">Înapoi din service</button>}
                          <button name="status" value="pierdut" className="rounded-lg border border-border px-2.5 py-1 font-bold text-muted">Pierdută</button>
                          <button name="status" value="casat" className="rounded-lg border border-border px-2.5 py-1 font-bold text-muted">Casată</button>
                        </form>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="mb-1.5 text-[13px] font-bold">Istoric</div>
                      {t.hist.length === 0 ? <p className="text-[12.5px] text-muted">Nicio predare încă.</p> : (
                        <ul className="flex flex-col divide-y divide-border text-[12.5px]">
                          {t.hist.slice(0, 12).map((h) => (
                            <li key={h.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-2">
                              <span className="w-24 shrink-0 tabular-nums text-muted">{day(h.created_at)}</span>
                              <span className="min-w-0 flex-1">
                                {h.kind === "predare" ? <>Predată lui <b>{nameOf.get(h.to_profile_id ?? "") ?? "—"}</b>{h.to_vehicle_id ? ` (${vehicleOf.get(h.to_vehicle_id)})` : ""}</> : <>Returnată de <b>{nameOf.get(h.from_profile_id ?? "") ?? "—"}</b></>}
                                {" · "}{h.status === "confirmata" ? `confirmat${h.confirmed_at ? ` ${day(h.confirmed_at)}` : ""}${h.condition_confirmed && h.condition_confirmed !== h.condition ? `, stare ${conditionLabel(h.condition_confirmed).toLowerCase()}` : ""}` : h.status === "asteapta" ? "așteaptă confirmarea" : "anulată"}
                                {h.confirm_note ? ` · „${h.confirm_note}”` : ""}
                              </span>
                              {h.status !== "anulata" && <Link href={`/pv-scule/${h.id}`} target="_blank" className="flex items-center gap-1 font-bold text-accent-ink"><FileText className="h-3 w-3" /> PV</Link>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
