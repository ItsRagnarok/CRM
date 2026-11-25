import Link from "next/link";
import { Truck, PackageCheck, Copy, Receipt, Trash2, AlertTriangle } from "lucide-react";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedAttachmentUrls } from "@/lib/storage";
import { StocTabs } from "@/components/stoc-tabs";
import { EmptyState } from "@/components/empty-state";
import { effectiveMin, restockNeed, vehicleStockStatus, STATUS_LABEL, qty, type VehicleStockStatus } from "@/lib/vehicle-stock";
import { setVehicleTarget, removeFromVehicleList, loadVehicle, copyVehicleList, closeRestockRequest } from "./actions";

const TONE: Record<VehicleStockStatus, string> = {
  lipsa: "bg-danger-bg text-danger",
  sub_prag: "bg-warning-bg text-warning",
  ok: "bg-success-bg text-success",
  fara_tinta: "bg-neutral-bg text-muted",
};
const input = "w-20 rounded-lg border border-border bg-white px-2 py-1.5 text-right text-[13px] tabular-nums";

function ago(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 60) return `acum ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `acum ${h} h` : `acum ${Math.round(h / 24)} zile`;
}

type Item = { material_id?: string | null; name: string; qty: number; unit?: string | null };

/** Biroul: ce trebuie să fie în fiecare mașină, ce lipsește, încărcarea din depozit și achizițiile urgente. */
export default async function StocMasiniPage({ searchParams }: { searchParams: Promise<{ v?: string; incarcat?: string; lipsa?: string; copiat?: string; eroare?: string }> }) {
  const sp = await searchParams;
  const { organization, readOnly } = await requireSessionContext();
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: vehicles }, { data: teams }, { data: stock }, { data: wh }, { data: materials }, { data: requests }, { data: urgent }] = await Promise.all([
    supabase.from("vehicles").select("id, name, plate_number, driver_id, assigned_team_id").eq("organization_id", organization.id).eq("is_active", true).order("name"),
    supabase.from("teams").select("id, name").eq("organization_id", organization.id),
    supabase.from("material_stock").select("id, vehicle_id, material_id, quantity, target_qty, min_qty, materials(name, unit, category)").eq("organization_id", organization.id).not("vehicle_id", "is", null),
    supabase.from("warehouses").select("id, name, material_stock(material_id, quantity)").eq("organization_id", organization.id).order("is_central", { ascending: false }).limit(1),
    supabase.from("materials").select("id, name, unit").eq("organization_id", organization.id).eq("kind", "material").order("name"),
    supabase.from("vehicle_restock_requests").select("id, vehicle_id, note, items, created_at, requested_by").eq("organization_id", organization.id).eq("status", "noua").order("created_at", { ascending: false }),
    supabase.from("expenses").select("id, amount, vendor, items, status, receipt_path, expense_date, vehicle_id, submitted_by, job_id, jobs(display_number, title)").eq("organization_id", organization.id).not("items", "is", null).gte("expense_date", since).order("expense_date", { ascending: false }).limit(20),
  ]);

  const people = [...new Set([...(requests ?? []).map((r) => r.requested_by), ...(urgent ?? []).map((u) => u.submitted_by), ...(vehicles ?? []).map((v) => v.driver_id)].filter(Boolean))] as string[];
  const { data: profiles } = people.length ? await supabase.from("profiles").select("id, full_name").in("id", people) : { data: [] };
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const teamOf = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const depot = wh?.[0];
  const depotQty = new Map((depot?.material_stock ?? []).map((s) => [s.material_id, Number(s.quantity)]));
  const receiptUrls = await signedAttachmentUrls(supabase, (urgent ?? []).map((u) => u.receipt_path));

  const list = vehicles ?? [];
  const byVehicle = new Map<string, NonNullable<typeof stock>>();
  for (const s of stock ?? []) byVehicle.set(s.vehicle_id!, [...(byVehicle.get(s.vehicle_id!) ?? []), s]);
  const alerts = (vid: string) => (byVehicle.get(vid) ?? []).filter((s) => restockNeed(s) > 0).length;
  const openReq = (vid: string) => (requests ?? []).filter((r) => r.vehicle_id === vid);
  const selected = list.find((v) => v.id === sp.v) ?? [...list].sort((a, b) => openReq(b.id).length - openReq(a.id).length || alerts(b.id) - alerts(a.id))[0];

  const rows = selected
    ? (byVehicle.get(selected.id) ?? []).sort((a, b) => {
        const order: Record<VehicleStockStatus, number> = { lipsa: 0, sub_prag: 1, ok: 2, fara_tinta: 3 };
        return order[vehicleStockStatus(a)] - order[vehicleStockStatus(b)] || (a.materials?.name ?? "").localeCompare(b.materials?.name ?? "", "ro");
      })
    : [];
  const need = rows.filter((r) => restockNeed(r) > 0);
  const inList = new Set(rows.filter((r) => r.target_qty != null).map((r) => r.material_id));
  const addable = (materials ?? []).filter((m) => !inList.has(m.id));
  const req = selected ? openReq(selected.id) : [];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-7">
      <StocTabs active="/materiale/masini" />
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">Stoc pe mașini</h1>
        <p className="mt-1 max-w-[75ch] text-[13px] text-muted">
          Pentru fiecare mașină: ce trebuie să fie în ea (ținta), de la ce cantitate o reaprovizionezi (pragul) și ce are acum. Tehnicienii scad din stocul mașinii când folosesc ceva pe lucrare și cer reaprovizionare din telefon.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-[13px] border border-border bg-white p-5"><EmptyState icon={Truck} title="Nicio mașină" description="Adaugă mașinile la Calendar și echipe → Echipe, apoi revino aici." /></div>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2" aria-label="Mașini">
            {list.map((v) => {
              const on = v.id === selected?.id;
              const a = alerts(v.id);
              const r = openReq(v.id).length;
              return (
                <Link key={v.id} href={`/materiale/masini?v=${v.id}`} className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${on ? "border-[#1f2024] bg-[#1f2024] text-white" : "border-border bg-white text-[#344054]"}`}>
                  <Truck className="h-3.5 w-3.5" /> {v.name}
                  {r > 0 && <span className="rounded-full bg-danger px-1.5 text-[11px] text-white">cerere</span>}
                  {a > 0 && <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/20" : "bg-warning-bg text-warning"}`}>{a} de încărcat</span>}
                </Link>
              );
            })}
          </nav>

          {sp.incarcat && <p role="status" className="rounded-lg border border-border bg-success-bg/60 p-3 text-[13px]">{sp.incarcat === "0" ? "Nu era nimic sub prag." : `Am încărcat ${sp.incarcat} articole din depozit.`}{sp.lipsa && sp.lipsa !== "0" ? ` ${sp.lipsa} nu au ajuns întregi: în depozit nu era destul.` : ""}</p>}
          {sp.copiat && <p role="status" className="rounded-lg border border-border bg-success-bg/60 p-3 text-[13px]">Lista a fost copiată pe această mașină. Cantitățile din mașină nu s-au schimbat.</p>}
          {sp.eroare && <p role="alert" className="rounded-lg border border-[#f3b4ae] bg-danger-bg p-3 text-[13px] text-danger">{sp.eroare === "numar" ? "Ținta și pragul trebuie să fie numere." : "Nu am putut încărca mașina. Încearcă din nou."}</p>}

          {selected && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
              <section className="min-w-0 rounded-[13px] border border-border bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-extrabold">{selected.name} <span className="font-semibold text-muted">· {selected.plate_number ?? "fără număr"}</span></h2>
                    <p className="text-[12.5px] text-muted">{selected.assigned_team_id ? teamOf.get(selected.assigned_team_id) : "Fără echipă"}{selected.driver_id ? ` · șofer ${nameOf.get(selected.driver_id) ?? "—"}` : ""}</p>
                  </div>
                  {!readOnly && (
                    <form action={loadVehicle}>
                      <input type="hidden" name="vehicleId" value={selected.id} />
                      <button disabled={need.length === 0} className="flex items-center gap-1.5 rounded-[10px] bg-electric px-3.5 py-2 text-[13px] font-extrabold disabled:opacity-50">
                        <PackageCheck className="h-4 w-4" /> {need.length ? `Încarcă din depozit (${need.length})` : "Nimic de încărcat"}
                      </button>
                    </form>
                  )}
                </div>

                {req.map((r) => (
                  <div key={r.id} className="mt-3 flex flex-wrap items-start gap-3 rounded-xl border border-[#f3b4ae] bg-danger-bg/50 p-3 text-[13px]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <div className="min-w-0 flex-1">
                      <b>{nameOf.get(r.requested_by ?? "") ?? "Tehnicianul"}</b> a cerut reaprovizionare {ago(r.created_at)}.
                      {Array.isArray(r.items) && r.items.length > 0 && <span className="block text-muted">{(r.items as Item[]).map((i) => `${i.name} ${qty(i.qty)}${i.unit ? ` ${i.unit}` : ""}`).join(" · ")}</span>}
                      {r.note && <span className="block">„{r.note}”</span>}
                      <span className="block text-[12px] text-muted">„Încarcă din depozit” o închide singur.</span>
                    </div>
                    {!readOnly && (
                      <form action={closeRestockRequest}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="vehicleId" value={selected.id} />
                        <button className="rounded-lg border border-border bg-white px-2.5 py-1 text-[12px] font-bold">Rezolvată altfel</button>
                      </form>
                    )}
                  </div>
                ))}

                {rows.length === 0 ? (
                  <p className="mt-4 text-[13px] text-muted">Mașina nu are încă listă. Adaugă materialele din dreapta sau copiază lista de la altă mașină.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-[13px]">
                      <thead>
                        <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                          <th className="py-2 pr-3 font-bold">Material</th>
                          <th className="py-2 pr-3 text-right font-bold">În mașină</th>
                          <th className="py-2 pr-3 font-bold">Țintă / prag</th>
                          <th className="py-2 pr-3 text-right font-bold">De încărcat</th>
                          <th className="py-2 pr-3 text-right font-bold">În depozit</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const st = vehicleStockStatus(r);
                          const n = restockNeed(r);
                          const d = depotQty.get(r.material_id) ?? 0;
                          const unit = r.materials?.unit ?? "";
                          return (
                            <tr key={r.id} className="border-b border-border last:border-0">
                              <td className="py-2.5 pr-3">
                                <div className="font-semibold">{r.materials?.name}</div>
                                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE[st]}`}>{STATUS_LABEL[st]}</span>
                              </td>
                              <td className="py-2.5 pr-3 text-right font-extrabold tabular-nums">{qty(r.quantity)} {unit}</td>
                              <td className="py-2.5 pr-3">
                                {readOnly ? (
                                  <span className="tabular-nums">{r.target_qty != null ? `${qty(r.target_qty)} / ${qty(effectiveMin(r.target_qty, r.min_qty) ?? 0)}` : "—"}</span>
                                ) : (
                                  <form action={setVehicleTarget} className="flex items-center gap-1.5">
                                    <input type="hidden" name="vehicleId" value={selected.id} />
                                    <input type="hidden" name="materialId" value={r.material_id} />
                                    <input name="target" aria-label="Țintă" defaultValue={r.target_qty ?? ""} placeholder="țintă" inputMode="decimal" className={input} />
                                    <input name="min" aria-label="Prag" defaultValue={r.min_qty ?? ""} placeholder={r.target_qty != null ? String(effectiveMin(r.target_qty, null)) : "prag"} inputMode="decimal" className={input} />
                                    <button className="rounded-lg border border-border px-2 py-1 text-[12px] font-bold">Salvează</button>
                                  </form>
                                )}
                              </td>
                              <td className={`py-2.5 pr-3 text-right tabular-nums ${n > 0 ? "font-extrabold" : "text-muted"}`}>{n > 0 ? `${qty(n)} ${unit}` : "—"}</td>
                              <td className={`py-2.5 pr-3 text-right tabular-nums ${n > d ? "font-bold text-danger" : "text-muted"}`}>{qty(d)}</td>
                              <td className="py-2.5 text-right">
                                {!readOnly && (
                                  <form action={removeFromVehicleList}>
                                    <input type="hidden" name="stockId" value={r.id} />
                                    <input type="hidden" name="vehicleId" value={selected.id} />
                                    <button aria-label={`Scoate ${r.materials?.name} din listă`} title="Scoate din lista mașinii" className="rounded-lg p-1.5 text-muted hover:bg-neutral-bg hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                                  </form>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-3 text-[12px] text-muted">Când un material scade sub prag, intră la „De încărcat”, până la țintă. Fără prag, pragul e jumătate din țintă. Roșu la „În depozit” = nu ajunge pentru încărcare; comandă de la furnizor.</p>
              </section>

              <aside className="flex min-w-0 flex-col gap-4">
                {!readOnly && (
                  <section className="rounded-[13px] border border-border bg-white p-4">
                    <h2 className="text-[14px] font-bold">Adaugă în lista mașinii</h2>
                    {addable.length === 0 ? <p className="mt-1 text-[12.5px] text-muted">Toate materialele din catalog sunt deja în listă.</p> : (
                      <form action={setVehicleTarget} className="mt-2 flex flex-col gap-2">
                        <input type="hidden" name="vehicleId" value={selected.id} />
                        <select name="materialId" required className="rounded-lg border border-border bg-white px-2.5 py-2 text-[13px]">
                          {addable.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                        </select>
                        <div className="flex gap-2">
                          <label className="flex flex-1 flex-col gap-1 text-[12px] text-muted">Țintă<input name="target" required inputMode="decimal" className={`${input} w-full`} /></label>
                          <label className="flex flex-1 flex-col gap-1 text-[12px] text-muted">Prag (opțional)<input name="min" inputMode="decimal" className={`${input} w-full`} /></label>
                        </div>
                        <button className="rounded-[10px] bg-[#1f2024] px-3.5 py-2 text-[13px] font-bold text-white">Adaugă</button>
                      </form>
                    )}
                  </section>
                )}
                {!readOnly && list.length > 1 && rows.some((r) => r.target_qty != null) && (
                  <section className="rounded-[13px] border border-border bg-white p-4">
                    <h2 className="flex items-center gap-1.5 text-[14px] font-bold"><Copy className="h-4 w-4" /> Copiază lista la altă mașină</h2>
                    <p className="mt-1 text-[12.5px] text-muted">Pentru mașinile care fac același tip de lucrări. Se copiază ținta și pragul; ce e deja în mașină rămâne.</p>
                    <form action={copyVehicleList} className="mt-2 flex gap-2">
                      <input type="hidden" name="vehicleId" value={selected.id} />
                      <select name="toVehicleId" className="min-w-0 flex-1 rounded-lg border border-border bg-white px-2.5 py-2 text-[13px]">
                        {list.filter((v) => v.id !== selected.id).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      <button className="rounded-[10px] border border-border px-3 py-2 text-[13px] font-bold">Copiază</button>
                    </form>
                  </section>
                )}
                <section className="rounded-[13px] border border-border bg-white p-4">
                  <h2 className="flex items-center gap-1.5 text-[14px] font-bold"><Receipt className="h-4 w-4" /> Achiziții urgente · 30 de zile</h2>
                  <p className="mt-1 text-[12.5px] text-muted">Ce au cumpărat tehnicienii de la magazin pentru o lucrare, cu bonul. Le aprobi la Cheltuieli.</p>
                  {(urgent ?? []).length === 0 ? <p className="mt-2 text-[12.5px] text-muted">Nicio achiziție urgentă.</p> : (
                    <ul className="mt-2 flex flex-col divide-y divide-border">
                      {(urgent ?? []).map((u) => (
                        <li key={u.id} className="py-2.5 text-[12.5px]">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-bold">{nameOf.get(u.submitted_by ?? "") ?? "—"}</span>
                            <span className="font-extrabold tabular-nums">{Number(u.amount).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei</span>
                          </div>
                          <div className="text-muted">
                            {new Date(`${u.expense_date}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" })}
                            {u.vendor ? ` · ${u.vendor}` : ""}
                            {u.jobs ? <> · <Link href={`/lucrari/${u.job_id}`} className="font-semibold text-accent-ink">#{u.jobs.display_number}</Link></> : null}
                            {" · "}{u.status === "approved" ? "aprobată" : u.status === "rejected" ? "respinsă" : "de aprobat"}
                          </div>
                          {Array.isArray(u.items) && <div>{(u.items as Item[]).map((i) => `${i.name} × ${qty(i.qty)}${i.unit ? ` ${i.unit}` : ""}`).join(", ")}</div>}
                          {u.receipt_path && receiptUrls.get(u.receipt_path) && <a href={receiptUrls.get(u.receipt_path)} target="_blank" rel="noreferrer" className="font-semibold text-accent-ink">Vezi bonul →</a>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/cheltuieli" className="mt-2 inline-block text-[12.5px] font-bold text-accent-ink">Cheltuieli →</Link>
                </section>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
