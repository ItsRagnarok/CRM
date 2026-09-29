import Link from "next/link";
import { requireSessionContext, ROLE_LABELS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { CompanyForm } from "./company-form";
import { NewEmployeeForm } from "./new-employee-form";
import { updateUserRole, updateGpsSettings } from "./actions";

type UserRole = Database["public"]["Enums"]["user_role"];

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

const ROLE_OPTIONS: UserRole[] = ["admin", "manager", "team_leader", "technician", "client"];

export default async function SetariPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = NAV.some((n) => n.id === tabParam) ? tabParam! : "companie";
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const monthStartStr = `${new Date().toISOString().slice(0, 7)}-01`;

  const [{ data: org }, { data: profiles }, { count: jobsThisMonth }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", organization.id).single(),
    tab === "utilizatori"
      ? supabase
          .from("profiles")
          .select("id, full_name, role, is_active")
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
              <CompanyForm
                name={org.name}
                cui={org.cui}
                email={org.email}
                phone={org.phone}
                address={org.address}
              />
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
                        <div className="text-[12px] text-muted-2">
                          {p.is_active ? "Activ" : "Inactiv"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/setari/utilizatori/${p.id}`}
                          className="rounded-[9px] bg-neutral-bg px-3 py-2 text-[12px] font-bold text-[#344054]"
                        >
                          Documente
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

            {(tab === "checklisturi" || tab === "tipuri" || tab === "notificari" || tab === "integrari") && (
              <div className="rounded-[13px] border border-dashed border-border bg-white p-6 text-[13.5px] text-muted">
                {tab === "checklisturi" && "Editor de checklist-uri per tip de lucrare — în curând."}
                {tab === "tipuri" && "Tipurile de lucrări sunt momentan fixe (Instalare, Reparație, Mentenanță, Inspecție, Intervenție, Service, Demontare, Urgență) — personalizare în curând."}
                {tab === "notificari" && "Preferințe de notificare per utilizator — în curând."}
                {tab === "integrari" && "Integrări cu SmartBill, Oblio, FGO și altele — în curând."}
              </div>
            )}

            {tab === "gps" && org && (
              <div className="rounded-[13px] border border-border bg-white p-[22px]">
                <div className="mb-1 text-[15px] font-bold text-foreground">GPS & confidențialitate</div>
                <p className="mb-4 text-[12.5px] text-muted-2">
                  Controlează cum și când este urmărită locația echipelor.
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
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <div className="text-[13.5px] font-semibold">
                      Tracking GPS continuu în timpul deplasării
                    </div>
                    <div className="text-[12px] text-muted-2">
                      Necesită consimțământul angajatului și politică de retenție ({org.gps_retention_days}{" "}
                      zile).
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[12.5px] font-semibold">
                      <input
                        type="checkbox"
                        name="continuousTracking"
                        defaultChecked={org.gps_continuous_tracking_enabled}
                        className="h-4 w-4 accent-[#2f6fed]"
                      />
                      {org.gps_continuous_tracking_enabled ? "Activat" : "Dezactivat"}
                    </label>
                    <button
                      type="submit"
                      className="rounded-[9px] bg-neutral-bg px-3 py-2 text-[12px] font-bold text-[#344054]"
                    >
                      Salvează
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === "abonament" && org && (
              <div className="rounded-[13px] border border-border bg-white p-[22px]">
                <div className="mb-1 text-[15px] font-bold text-foreground">Abonament</div>
                <p className="mb-4 text-[12.5px] text-muted-2">Planul actual al companiei.</p>
                <div className="flex items-center justify-between rounded-[11px] border border-[#d9e6ff] bg-electric-soft p-4">
                  <div>
                    <div className="text-[15px] font-extrabold text-electric">
                      Plan {SUBSCRIPTION_LABELS[org.subscription_plan] ?? org.subscription_plan}
                    </div>
                    <div className="mt-1 text-[12.5px] text-[#475467]">
                      Limitele exacte per plan nu sunt încă configurate în platformă.
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="text-[11.5px] font-semibold text-muted-2">LUCRĂRI LUNA ACEASTA</div>
                    <div className="mt-1 text-[13px] font-bold">{jobsThisMonth ?? 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
