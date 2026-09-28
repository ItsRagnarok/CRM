"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createJob } from "../actions";
import { JOB_TYPE_LABELS, JOB_PRIORITY_LABELS } from "@/lib/status";

const NEW_LOCATION = "__new__";

type Location = { id: string; address: string; label: string | null };

export function NewJobForm({
  clients,
  teams,
  locationsByClient,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  locationsByClient: Record<string, Location[]>;
  defaultClientId?: string;
}) {
  const [state, formAction, pending] = useActionState(createJob, undefined);
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ?? "");
  const defaultLocations = locationsByClient[defaultClientId ?? ""] ?? [];
  const [locationChoice, setLocationChoice] = useState(
    defaultLocations.length > 0 ? defaultLocations[0].id : NEW_LOCATION
  );
  const clientLocations = locationsByClient[selectedClientId] ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link
          href="/lucrari"
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg"
        >
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Lucrare nouă</h1>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-white p-6 text-[13.5px] text-muted">
          Trebuie să adaugi mai întâi un client.{" "}
          <Link href="/clienti/nou" className="font-bold text-electric">
            Adaugă un client →
          </Link>
        </div>
      ) : (
        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6"
        >
          <Field label="Client">
            <select
              name="clientId"
              required
              value={selectedClientId}
              onChange={(e) => {
                const nextClientId = e.target.value;
                setSelectedClientId(nextClientId);
                const nextLocations = locationsByClient[nextClientId] ?? [];
                setLocationChoice(
                  nextLocations.length > 0 ? nextLocations[0].id : NEW_LOCATION
                );
              }}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            >
              <option value="" disabled>
                Alege un client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Titlu lucrare">
            <input
              name="title"
              required
              placeholder="Instalare tablou electric"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>

          {clientLocations.length > 0 && (
            <Field label="Punct de lucru">
              <select
                value={locationChoice}
                onChange={(e) => setLocationChoice(e.target.value)}
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              >
                {clientLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label ? `${loc.label} — ${loc.address}` : loc.address}
                  </option>
                ))}
                <option value={NEW_LOCATION}>+ Adresă nouă…</option>
              </select>
            </Field>
          )}

          {locationChoice === NEW_LOCATION ? (
            <Field label="Adresă intervenție">
              <input
                name="address"
                placeholder="Str. Fabricii 12, București"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
          ) : (
            <input type="hidden" name="locationId" value={locationChoice} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tip lucrare">
              <select
                name="jobType"
                defaultValue="interventie"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              >
                {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioritate">
              <select
                name="priority"
                defaultValue="normala"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              >
                {Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {teams.length > 0 && (
            <Field label="Echipă (opțional)">
              <select
                name="teamId"
                defaultValue=""
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              >
                <option value="">Neasignată</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Field label="Data">
              <input
                name="scheduledDate"
                type="date"
                required
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
            <Field label="Ora start">
              <input
                name="startTime"
                type="time"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
            <Field label="Ora sfârșit">
              <input
                name="endTime"
                type="time"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
          </div>

          <Field label="Descriere">
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>

          {state?.error && (
            <p className="text-sm font-medium text-danger">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/lucrari"
              className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]"
            >
              Anulează
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
            >
              {pending ? "Se salvează…" : "Creează lucrarea"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">
        {label}
      </label>
      {children}
    </div>
  );
}
