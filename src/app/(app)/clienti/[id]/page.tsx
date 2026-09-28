import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/status";
import {
  addContact,
  addLocation,
  deleteContact,
  deleteLocation,
  toggleClientStatus,
} from "../actions";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Plus,
  Pencil,
  Power,
  Trash2,
  User,
} from "lucide-react";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locationError?: string }>;
}) {
  const { id } = await params;
  const { locationError } = await searchParams;
  const { organization } = await requireSessionContext();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  const [{ data: jobs }, { data: locations }, { data: contacts }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, display_number, title, status, scheduled_date")
      .eq("client_id", client.id)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("locations")
      .select("id, address, label")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("client_contacts")
      .select("id, name, role, phone, email")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true }),
  ]);

  const initials = client.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/clienti"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <span className="text-[13.5px] text-muted-2">Clienți /</span>
        <span className="text-[15px] font-bold text-foreground">{client.name}</span>
      </div>

      <div className="flex items-center justify-between rounded-[14px] border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-electric-soft text-[18px] font-extrabold text-electric">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="text-[20px] font-extrabold text-foreground">
                {client.name}
              </div>
              <StatusBadge
                label={client.status === "active" ? "Activ" : "Inactiv"}
                className={
                  client.status === "active"
                    ? "bg-success-bg text-success"
                    : "bg-neutral-bg text-neutral"
                }
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[13px] text-[#475467]">
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted" /> {client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted" /> {client.email}
                </span>
              )}
              {client.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted" /> {client.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/clienti/${client.id}/editeaza`}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13px] font-bold text-[#344054]"
          >
            <Pencil className="h-3.5 w-3.5" /> Editează
          </Link>
          <form action={toggleClientStatus}>
            <input type="hidden" name="clientId" value={client.id} />
            <input type="hidden" name="currentStatus" value={client.status} />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13px] font-bold text-[#344054]"
            >
              <Power className="h-3.5 w-3.5" />
              {client.status === "active" ? "Dezactivează" : "Activează"}
            </button>
          </form>
          <Link
            href={`/lucrari/nou?clientId=${client.id}`}
            className="flex items-center gap-1.5 rounded-[10px] bg-electric px-4 py-2.5 text-[13px] font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Lucrare nouă
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Număr lucrări" value={jobs?.length ?? 0} />
        <StatCard
          label="Ultima intervenție"
          value={jobs?.[0]?.scheduled_date ?? "—"}
        />
        <StatCard label="CUI" value={client.cui ?? "—"} />
        <StatCard
          label="Status"
          value={client.status === "active" ? "Activ" : "Inactiv"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
            Puncte de lucru
          </div>
          <div className="flex flex-col gap-2 p-5">
            {locationError && (
              <p className="rounded-[8px] bg-danger-bg px-3 py-2 text-[12.5px] font-medium text-danger">
                {locationError}
              </p>
            )}
            {locations && locations.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center gap-3 py-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {loc.label || "Punct de lucru"}
                      </div>
                      <div className="truncate text-[12px] text-muted-2">
                        {loc.address}
                      </div>
                    </div>
                    <form action={deleteLocation}>
                      <input type="hidden" name="locationId" value={loc.id} />
                      <input type="hidden" name="clientId" value={client.id} />
                      <button
                        type="submit"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger"
                        aria-label="Șterge punctul de lucru"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">Niciun punct de lucru adăugat încă.</p>
            )}

            <form action={addLocation} className="mt-2 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
              <input type="hidden" name="clientId" value={client.id} />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="label"
                  placeholder="Etichetă (opțional)"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="address"
                  required
                  placeholder="Adresă"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]"
              >
                <Plus className="h-3.5 w-3.5" /> Adaugă punct de lucru
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-[13px] border border-border bg-white">
          <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
            Persoane de contact
          </div>
          <div className="flex flex-col gap-2 p-5">
            {contacts && contacts.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#f2f4f7]">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 py-2.5">
                    <User className="h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {contact.name}
                        {contact.role && (
                          <span className="ml-1.5 font-normal text-muted-2">
                            · {contact.role}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[12px] text-muted-2">
                        {[contact.phone, contact.email].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <form action={deleteContact}>
                      <input type="hidden" name="contactId" value={contact.id} />
                      <input type="hidden" name="clientId" value={client.id} />
                      <button
                        type="submit"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-muted-2 hover:bg-danger-bg hover:text-danger"
                        aria-label="Șterge persoana de contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">Nicio persoană de contact adăugată încă.</p>
            )}

            <form action={addContact} className="mt-2 flex flex-col gap-2 border-t border-[#f2f4f7] pt-4">
              <input type="hidden" name="clientId" value={client.id} />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="name"
                  required
                  placeholder="Nume"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="role"
                  placeholder="Funcție (opțional)"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="phone"
                  placeholder="Telefon"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="rounded-[9px] border border-[#d0d5dd] px-3 py-2 text-[13px] outline-none focus:border-electric"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 self-start rounded-[9px] bg-neutral-bg px-3.5 py-2 text-[12.5px] font-bold text-[#344054]"
              >
                <Plus className="h-3.5 w-3.5" /> Adaugă persoană de contact
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-[13px] border border-border bg-white">
        <div className="border-b border-[#f2f4f7] px-5 py-3.5 text-[14.5px] font-bold text-foreground">
          Istoric lucrări
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="flex flex-col divide-y divide-[#f2f4f7]">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/lucrari/${job.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f9fafb]"
              >
                <div className="w-16 shrink-0 text-[13px] font-bold text-electric">
                  #{job.display_number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-foreground">
                    {job.title}
                  </div>
                  <div className="text-[12px] text-muted-2">{job.scheduled_date}</div>
                </div>
                <StatusBadge
                  label={JOB_STATUS_LABELS[job.status]}
                  className={JOB_STATUS_STYLES[job.status]}
                />
              </Link>
            ))}
          </div>
        ) : (
          <p className="p-5 text-[13.5px] text-muted">
            Acest client nu are încă nicio lucrare.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[13px] border border-border bg-white p-[18px]">
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className="mt-2 text-[20px] font-extrabold text-foreground">{value}</div>
    </div>
  );
}
