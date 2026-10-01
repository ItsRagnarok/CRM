import Link from "next/link";
import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { CompanyForm } from "./company-form";
import { StandardScheduleForm } from "./standard-schedule-form";
import { NewEmployeeForm } from "./new-employee-form";
import { updateUserRole, updateGpsSettings } from "./actions";
import { ChecklistTemplatesTab } from "./checklist-templates-tab";

type UserRole = Database["public"]["Enums"]["user_role"];
type JobType = Database["public"]["Enums"]["job_type"];

const NAV = [
  { id: "companie", label: "Companie" },
  { id: "utilizatori", label: "Utilizatori & roluri" },
  { id: "echipe", label: "Echipe & vehicule" },
  { id: "checklisturi", label: "Checklist-uri" },
  { id: "tipuri", label: "Tipuri de lucrări" },
  { id: "notificari", label: "Notificări" },
  { id: "gps", label: "GPS & confidențialitate" },
  { id: "abonament", label: "Abonament & facturare" },
  { id: "integrari", label: "Integrări" },
] as const;

const SUBSCRIPTION_LABELS: Record<string, string> = {
  starter: "Starter",
  team: "Team",
  pro: "Pro",
  enterprise: "Enterprise",
};

type PlanKey = "starter" | "team" | "pro" | "enterprise";

const PLAN_DETAILS: Record<
  PlanKey,
  {
    priceLabel: string;
    maxUsers: number | null;
    features: string[];
  }
> = {
  starter: {
    priceLabel: "149 RON/lună",
    maxUsers: 3,
    features: ["Clienți & lucrări", "Pontaj & materiale", "Facturare internă"],
  },
  team: {
    priceLabel: "349 RON/lună",
    maxUsers: 8,
    features: ["Tot ce e în Starter", "Hartă GPS live", "Concedii & absențe complet"],
  },
  pro: {
    priceLabel: "599 RON/lună",
    maxUsers: 15,
    features: ["Tot ce e în Team", "AI la generarea lucrărilor", "Rapoarte avansate"],
  },
  enterprise: {
    priceLabel: "Preț personalizat",
    maxUsers: null,
    features: ["Tot ce e în Pro", "Fără limită de utilizatori", "Integrări dedicate (SmartBill, Oblio etc.)"],
  },
};

const PLAN_ORDER: PlanKey[] = ["starter", "team", "pro", "enterprise"];

const ROLE_OPTIONS: UserRole[] = ["admin", "manager", "team_leader", "technician", "client"];

export default async function SetariPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; jt?: string }>;
}) {
  const { tab: tabParam, jt } = await searchParams;
  const tab = NAV.some((n) => n.id === tabParam) ? tabParam! : "companie";
  const selectedJobType = (jt as JobType) || null;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const monthStartStr = `${new Date().toISOString().slice(0, 7)}-01`;

  const [{ data: org }, { data: profiles }, { count: jobsThisMonth }, { count: activeUserCount }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", organization.id).single(),
    tab === "utilizatori" || tab === "gps"
      ? supabase
          .from("profiles")
          .select("id, full_name, role, is_active, notifications_enabled, location_consent_at")
          .eq("organization_id", organization.id)
          .order("full_name")
      : Promise.resolve({ data: null }),
    tab === "abonament"
      ? supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .gte("scheduled_date", monthStartStr)
      : Promise.resolve({ count: null }),
    tab === "abonament"
      ? supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .eq("is_active", true)
      : Promise.resolve({ count: null }),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[66px] shrink-0 items-center border-b border-border bg-white px-6">
        <h1 className="text-[17px] font-extrabold text-foreground">Setări</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-[230px] shrink-0 border-r border-border p-3">
          {NAV.map((n) => (
            <Link
              key={n.id}
              href={`/setari?tab=${n.id}`}
              prefetch={false}
              className={`block rounded-[9px] px-3 py-2.5 text-[13px] font-semibold ${
                tab === n.id ? "bg-electric-soft text-electric" : "text-[#475467] hover:bg-neutral-bg"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 overflow-auto p-7">
          <div className="mx-auto flex max-w-[920px] flex-col gap-4">
            {tab === "companie" && org && (
              <>
                <CompanyForm
                  name={org.name}
                  cui={org.cui}
                  email={org.email}
                  phone={org.phone}
                  address={org.address}
                />
                <StandardScheduleForm hoursPerDay={org.standard_hours_per_day} workdays={org.standard_workdays} />
              </>
            )}

            {tab === "utilizatori" && (
              <div className="overflow-hidden rounded-[13px] border border-border bg-white">
                <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold">
                  Utilizatori & roluri
                </div>
                <div className="border-b border-[#f2f4f7] p-4">
                  <NewEmployeeForm />
                </div>
                <div className="flex flex-col divide-y divide-[#f2f4f7]">
                  {(profiles ?? []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <div className="text-[13.5px] font-bold text-foreground">{p.full_name}</div>
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-2">
                          {p.is_active ? "Activ" : "Inactiv"}
                          <span>·</span>
                          <span className={p.notifications_enabled ? "text-success" : "text-muted-2"}>
                            {p.notifications_enabled ? "Notificări activate" : "Notificări dezactivate"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/setari/utilizatori/${p.id}`}
                          className="rounded-[9px] bg-neutral-bg px-3 py-2 text-[12px] font-bold text-[#344054]"
                        >
                          Detalii cont
                        </Link>
                        <form action={updateUserRole} className="flex items-center gap-2">
                          <input type="hidden" name="profileId" value={p.id} />
                          <select
                            name="role"
                            defaultValue={p.role}
                            className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-electric"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-[9px] bg-neutral-bg px-3 py-2 text-[12px] font-bold text-[#344054]"
                          >
                            Salvează
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "echipe" && (
              <div className="rounded-[13px] border border-border bg-white p-6 text-[13.5px] text-muted">
                Echipele și vehiculele se administrează în{" "}
                <Link href="/echipe" prefetch={false} className="font-semibold text-electric">
                  secțiunea Echipe →
                </Link>
              </div>
            )}

            {tab === "checklisturi" && (
              <ChecklistTemplatesTab organizationId={organization.id} selectedJobType={selectedJobType} />
            )}

            {(tab === "tipuri" || tab === "notificari" || tab === "integrari") && (
              <div className="rounded-[13px] border border-dashed border-border bg-white p-6 text-[13.5px] text-muted">
                {tab === "tipuri" && "Tipurile de lucrări sunt momentan fixe (Instalare, Reparație, Mentenanță, Inspecție, Intervenție, Service, Demontare, Urgență) — personalizare în curând."}
                {tab === "notificari" && "Preferințe de notificare per utilizator — în curând."}
                {tab === "integrari" && "Integrări cu SmartBill, Oblio, FGO și altele — în curând."}
              </div>
            )}

            {tab === "gps" && org && (
              <div className="rounded-[13px] border border-border bg-white p-[22px]">
                <div className="mb-1 text-[15px] font-bold text-foreground">GPS & confidențialitate</div>
                <p className="mb-4 text-[12.5px] text-muted-2">
                  Controlează cum și când este urmărită locația echipelor. Cât timp aplicația mobilă e deschisă și
                  activată, poziția tehnicianului apare live pe hartă și primește automat o alertă când ajunge lângă
                  locația unei lucrări la care e în drum. Ca orice aplicație de telefon în browser (nu e o aplicație
                  nativă), urmărirea se oprește dacă telefonul e blocat mult timp sau aplicația e complet închisă —
                  repornește automat de îndată ce tehnicianul redeschide aplicația.
                </p>
                <div className="flex items-center justify-between border-b border-[#f2f4f7] py-3.5">
                  <div>
                    <div className="text-[13.5px] font-semibold">Check-in la sosire (locație unică)</div>
                    <div className="text-[12px] text-muted-2">
                      Înregistrează poziția o singură dată, la apăsarea „Am ajuns”
                    </div>
                  </div>
                  <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-bold text-success">
                    Activ
                  </span>
                </div>
                <form
                  action={updateGpsSettings}
                  className="flex flex-col gap-4 py-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13.5px] font-semibold">
                        Tracking GPS continuu + alertă de sosire (rază 50m)
                      </div>
                      <div className="text-[12px] text-muted-2">
                        Arată echipele live pe hartă și avertizează tehnicianul să confirme sosirea când e aproape de
                        locație — la a 3-a nereușită, tu primești o alertă. Pornește doar pentru angajații care și-au
                        dat consimțământul din aplicația mobilă (vezi lista de mai jos).
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <label className="flex items-center gap-2 text-[12.5px] font-semibold">
                        <input
                          type="checkbox"
                          name="continuousTracking"
                          defaultChecked={org.gps_continuous_tracking_enabled}
                          className="h-4 w-4 accent-[#2f6fed]"
                        />
                        {org.gps_continuous_tracking_enabled ? "Activat" : "Dezactivat"}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#f2f4f7] pt-3.5">
                    <div>
                      <div className="text-[13.5px] font-semibold">Retenție date de poziție</div>
                      <div className="text-[12px] text-muted-2">
                        Istoricul traseelor (technician_position_log) e șters automat, în fiecare noapte, după acest
                        număr de zile.
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <input
                        type="number"
                        name="retentionDays"
                        min={1}
                        max={365}
                        defaultValue={org.gps_retention_days}
                        className="w-20 rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                      />
                      <span className="text-[12.5px] text-muted-2">zile</span>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#f2f4f7] pt-3.5">
                    <button
                      type="submit"
                      className="rounded-[9px] bg-neutral-bg px-3 py-2 text-[12px] font-bold text-[#344054]"
                    >
                      Salvează
                    </button>
                  </div>
                </form>

                <div className="mt-2 border-t border-[#f2f4f7] pt-3.5">
                  <div className="mb-2 text-[12.5px] font-bold text-[#344054]">Consimțământ angajați</div>
                  <div className="flex flex-col divide-y divide-[#f2f4f7]">
                    {(profiles ?? [])
                      .filter((p) => p.role === "technician" || p.role === "team_leader")
                      .map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2">
                          <span className="text-[12.5px] font-semibold text-foreground">{p.full_name}</span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              p.location_consent_at ? "bg-success-bg text-success" : "bg-neutral-bg text-muted-2"
                            }`}
                          >
                            {p.location_consent_at ? "Consimțământ acordat" : "Neacordat"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "abonament" && org && (
              <div className="flex flex-col gap-4">
                <div className="rounded-[13px] border border-border bg-white p-[22px]">
                  <div className="mb-1 text-[15px] font-bold text-foreground">Abonament</div>
                  <p className="mb-4 text-[12.5px] text-muted-2">Planul actual al companiei.</p>
                  <div className="flex items-center justify-between rounded-[11px] border border-[#d9e6ff] bg-electric-soft p-4">
                    <div>
                      <div className="text-[15px] font-extrabold text-electric">
                        Plan {SUBSCRIPTION_LABELS[org.subscription_plan] ?? org.subscription_plan} ·{" "}
                        {PLAN_DETAILS[org.subscription_plan as PlanKey]?.priceLabel ?? "—"}
                      </div>
                      <div className="mt-1 text-[12.5px] text-[#475467]">
                        {(() => {
                          const maxUsers = PLAN_DETAILS[org.subscription_plan as PlanKey]?.maxUsers;
                          return maxUsers
                            ? `${activeUserCount ?? 0} din ${maxUsers} utilizatori incluși în plan`
                            : `${activeUserCount ?? 0} utilizatori · fără limită`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3.5">
                    <div>
                      <div className="text-[11.5px] font-semibold text-muted-2">LUCRĂRI LUNA ACEASTA</div>
                      <div className="mt-1 text-[13px] font-bold">{jobsThisMonth ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[11.5px] font-semibold text-muted-2">UTILIZATORI ACTIVI</div>
                      <div className="mt-1 text-[13px] font-bold">{activeUserCount ?? 0}</div>
                    </div>
                  </div>
                  <p className="mt-4 border-t border-[#f2f4f7] pt-3.5 text-[11.5px] text-muted-2">
                    Fără TVA — sub pragul de scutire (395.000 RON/an). Pentru schimbarea planului, contactează
                    administratorul platformei.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                  {PLAN_ORDER.map((planKey) => {
                    const plan = PLAN_DETAILS[planKey];
                    const isCurrent = org.subscription_plan === planKey;
                    return (
                      <div
                        key={planKey}
                        className={`flex flex-col rounded-[13px] border p-4 ${
                          isCurrent ? "border-electric bg-electric-soft" : "border-border bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[13.5px] font-extrabold text-foreground">
                            {SUBSCRIPTION_LABELS[planKey]}
                          </div>
                          {isCurrent && (
                            <span className="rounded-full bg-electric px-2 py-0.5 text-[10px] font-bold text-white">
                              Activ
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[14px] font-bold text-electric">{plan.priceLabel}</div>
                        <div className="mt-0.5 text-[11.5px] text-muted-2">
                          {plan.maxUsers ? `până la ${plan.maxUsers} utilizatori` : "utilizatori nelimitați"}
                        </div>
                        <ul className="mt-3 flex flex-col gap-1.5">
                          {plan.features.map((f) => (
                            <li key={f} className="text-[11.5px] text-[#475467]">
                              · {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
