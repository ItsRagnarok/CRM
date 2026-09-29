"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateJob } from "../actions";
import { JOB_TYPE_LABELS, JOB_PRIORITY_LABELS } from "@/lib/status";

type Job = {
  id: string;
  title: string;
  description: string | null;
  job_type: string;
  priority: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  team_id: string | null;
  location_id: string | null;
  locations: { address: string } | null;
  admin_message: string | null;
  require_arrival_photo: boolean;
  require_final_photo: boolean;
};

export function EditJobForm({ job, teams }: { job: Job; teams: { id: string; name: string }[] }) {
  const updateJobWithId = updateJob.bind(null, job.id);
  const [state, formAction, pending] = useActionState(updateJobWithId, undefined);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-7">
      <div className="flex items-center gap-3">
        <Link href={`/lucrari/${job.id}`} className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-neutral-bg">
          <ArrowLeft className="h-4 w-4 text-[#344054]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-foreground">Editează lucrarea</h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-6">
        <Field label="Titlu lucrare">
          <input
            name="title"
            required
            defaultValue={job.title}
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tip lucrare">
            <select name="jobType" defaultValue={job.job_type} className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric">
              {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Prioritate">
            <select name="priority" defaultValue={job.priority} className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric">
              {Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>

        {teams.length > 0 && (
          <Field label="Echipă">
            <select name="teamId" defaultValue={job.team_id ?? ""} className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric">
              <option value="">Neasignată</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Field label="Data">
            <input name="scheduledDate" type="date" required defaultValue={job.scheduled_date} className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric" />
          </Field>
          <Field label="Ora start">
            <input name="startTime" type="time" defaultValue={job.start_time?.slice(0, 5) ?? ""} className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric" />
          </Field>
          <Field label="Ora sfârșit">
            <input name="endTime" type="time" defaultValue={job.end_time?.slice(0, 5) ?? ""} className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric" />
          </Field>
        </div>

        <Field label="Adresă">
          <input type="hidden" name="currentAddress" value={job.locations?.address ?? ""} />
          <input
            name="address"
            defaultValue={job.locations?.address ?? ""}
            placeholder="Ex: Str. Exemplu 10, București"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
          <p className="mt-1 text-[11.5px] text-muted-2">
            Dacă schimbi adresa, coordonatele GPS pentru hartă se recalculează automat la salvare.
          </p>
        </Field>

        <Field label="Descriere">
          <textarea
            name="description"
            rows={4}
            defaultValue={job.description ?? ""}
            placeholder="Detalii despre lucrare…"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <Field label="Mesaj pentru tehnician (opțional)">
          <textarea
            name="adminMessage"
            rows={2}
            defaultValue={job.admin_message ?? ""}
            placeholder="Ex: Ai grijă la siguranță, succes!"
            className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
          />
        </Field>

        <Field label="Poze obligatorii de la tehnician">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[13px] text-[#344054]">
              <input type="checkbox" name="requireArrivalPhoto" defaultChecked={job.require_arrival_photo} />
              Poză la sosire, înainte să pornească lucrul
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[#344054]">
              <input type="checkbox" name="requireFinalPhoto" defaultChecked={job.require_final_photo} />
              Poză cu lucrarea finalizată, înainte să finalizeze
            </label>
          </div>
        </Field>

        {state?.error && <p className="text-sm font-medium text-danger">{state.error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/lucrari/${job.id}`} className="rounded-[10px] border border-[#d0d5dd] px-4 py-2.5 text-[13.5px] font-bold text-[#344054]">
            Anulează
          </Link>
          <button type="submit" disabled={pending} className="rounded-[10px] bg-electric px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">
            {pending ? "Se salvează…" : "Salvează modificările"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[#344054]">{label}</label>
      {children}
    </div>
  );
}
