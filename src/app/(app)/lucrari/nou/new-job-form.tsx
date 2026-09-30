"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Package, Sparkles } from "lucide-react";
import { createJob } from "../actions";
import { generateJobSuggestion } from "./ai-actions";
import { JOB_TYPE_LABELS, JOB_PRIORITY_LABELS } from "@/lib/status";
import { JOB_TITLE_TEMPLATES } from "../job-templates";

const NEW_LOCATION = "__new__";
const CUSTOM_TITLE = "__custom__";

type Location = { id: string; address: string; label: string | null };
type Material = { id: string; name: string; category: string | null; kind: string };

export function NewJobForm({
  clients,
  teams,
  locationsByClient,
  materials,
  defaultClientId,
  defaultDate,
  defaultTeamId,
}: {
  clients: { id: string; name: string; address: string | null }[];
  teams: { id: string; name: string }[];
  locationsByClient: Record<string, Location[]>;
  materials: Material[];
  defaultClientId?: string;
  defaultDate?: string;
  defaultTeamId?: string;
}) {
  const [state, formAction, pending] = useActionState(createJob, undefined);
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ?? "");
  const defaultLocations = locationsByClient[defaultClientId ?? ""] ?? [];
  const [locationChoice, setLocationChoice] = useState(
    defaultLocations.length > 0 ? defaultLocations[0].id : NEW_LOCATION
  );
  const clientLocations = locationsByClient[selectedClientId] ?? [];
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const [addressValue, setAddressValue] = useState("");

  const [titleChoice, setTitleChoice] = useState(CUSTOM_TITLE);
  const [jobType, setJobType] = useState("interventie");
  const [checkedMaterialIds, setCheckedMaterialIds] = useState<Set<string>>(new Set());
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiState, aiFormAction, aiPending] = useActionState(generateJobSuggestion, undefined);
  const [unmatchedSuggestions, setUnmatchedSuggestions] = useState<string[]>([]);
  const [aiApplied, setAiApplied] = useState(false);

  function applyAiSuggestion() {
    const suggestion = aiState?.suggestion;
    if (!suggestion) return;

    const photoLines = [
      suggestion.photos?.before && `- Înainte: ${suggestion.photos.before}`,
      suggestion.photos?.during && `- În timpul lucrării: ${suggestion.photos.during}`,
      suggestion.photos?.after && `- La final: ${suggestion.photos.after}`,
    ].filter(Boolean);
    const parts = [suggestion.instructions, photoLines.length > 0 ? `Poze necesare:\n${photoLines.join("\n")}` : ""].filter(Boolean);
    setDescriptionValue(parts.join("\n\n"));

    const names = [...suggestion.materials.map((m) => m.name), ...suggestion.tools];
    const nextChecked = new Set(checkedMaterialIds);
    const unmatched: string[] = [];
    for (const name of names) {
      const match = materials.find((m) => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase()));
      if (match) nextChecked.add(match.id);
      else unmatched.push(name);
    }
    setCheckedMaterialIds(nextChecked);
    setUnmatchedSuggestions(unmatched);
    setShowFullCatalog(true);
    setAiApplied(true);
  }

  const template = JOB_TITLE_TEMPLATES.find((t) => t.title === titleChoice);
  const suggested = template
    ? materials.filter((m) => template.suggestedCategories.includes(m.category ?? ""))
    : [];
  const suggestedIds = new Set(suggested.map((m) => m.id));
  const rest = materials.filter((m) => !suggestedIds.has(m.id));

  function toggleMaterial(id: string) {
    setCheckedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
            <select
              value={titleChoice}
              onChange={(e) => {
                const next = e.target.value;
                setTitleChoice(next);
                const t = JOB_TITLE_TEMPLATES.find((x) => x.title === next);
                if (t) setJobType(t.jobType);
                setCheckedMaterialIds(new Set());
              }}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            >
              <option value={CUSTOM_TITLE}>+ Titlu personalizat…</option>
              {JOB_TITLE_TEMPLATES.map((t) => (
                <option key={t.title} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
            {titleChoice === CUSTOM_TITLE ? (
              <input
                name="title"
                required
                placeholder="Ex: Instalare tablou electric"
                className="mt-2 w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            ) : (
              <input type="hidden" name="title" value={titleChoice} />
            )}
          </Field>

          <div className="rounded-[12px] border border-electric bg-electric-soft/40 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-electric" /> Completează cu AI
            </div>
            <p className="mb-3 text-[12px] text-muted-2">
              Descrie pe scurt lucrarea — AI-ul sugerează materiale, scule, instrucțiuni de execuție și ce poze
              trebuie făcute înainte, în timpul și la final. Verifică mereu sugestiile înainte să salvezi.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={2}
              placeholder="Ex: Înlocuire tablou electric vechi cu unul nou, 12 module, apartament la etaj 3"
              className="w-full rounded-[10px] border border-[#d0d5dd] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
            <form action={aiFormAction} className="mt-2.5 flex justify-end">
              <input type="hidden" name="aiDescription" value={aiPrompt} />
              <input type="hidden" name="aiJobType" value={JOB_TYPE_LABELS[jobType as keyof typeof JOB_TYPE_LABELS] ?? jobType} />
              <input type="hidden" name="aiClientName" value={selectedClient?.name ?? ""} />
              <button
                type="submit"
                disabled={aiPending}
                className="flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" /> {aiPending ? "Se generează…" : "Generează cu AI"}
              </button>
            </form>

            {aiState?.error && <p className="mt-2.5 text-[12.5px] font-semibold text-danger">{aiState.error}</p>}

            {aiState?.suggestion && !aiApplied && (
              <div className="mt-3 rounded-[10px] border border-[#d9e6ff] bg-white p-3.5">
                <div className="text-[12.5px] font-bold text-foreground">Sugestie AI</div>
                <p className="mt-1.5 whitespace-pre-line text-[12px] text-[#344054]">{aiState.suggestion.instructions}</p>
                {aiState.suggestion.materials.length > 0 && (
                  <div className="mt-2 text-[12px] text-[#344054]">
                    <b>Materiale:</b>{" "}
                    {aiState.suggestion.materials.map((m) => `${m.name} (${m.quantity} ${m.unit})`).join(", ")}
                  </div>
                )}
                {aiState.suggestion.tools.length > 0 && (
                  <div className="mt-1 text-[12px] text-[#344054]">
                    <b>Scule:</b> {aiState.suggestion.tools.join(", ")}
                  </div>
                )}
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="mt-3 rounded-[9px] bg-success px-3.5 py-2 text-[12px] font-bold text-white"
                >
                  Aplică sugestia (completează Descriere + bifează materialele)
                </button>
              </div>
            )}

            {aiApplied && (
              <div className="mt-3 rounded-[10px] border border-success-bg bg-success-bg p-3">
                <p className="text-[12px] font-semibold text-success">
                  Sugestia a fost aplicată — verifică Descrierea și materialele bifate mai jos.
                </p>
                {unmatchedSuggestions.length > 0 && (
                  <p className="mt-1.5 text-[11.5px] text-[#7a5b0e]">
                    Nu sunt în catalog, adaugă-le manual dacă e nevoie: {unmatchedSuggestions.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

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
              <div className="flex gap-2">
                <input
                  name="address"
                  value={addressValue}
                  onChange={(e) => setAddressValue(e.target.value)}
                  placeholder="Str. Fabricii 12, București"
                  className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
                />
                {selectedClient?.address && (
                  <button
                    type="button"
                    onClick={() => setAddressValue(selectedClient.address!)}
                    className="shrink-0 rounded-[10px] border border-[#d0d5dd] px-3 py-2.5 text-[12.5px] font-bold text-[#344054]"
                  >
                    Adresa clientului
                  </button>
                )}
              </div>
            </Field>
          ) : (
            <input type="hidden" name="locationId" value={locationChoice} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tip lucrare">
              <select
                name="jobType"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
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
                defaultValue={defaultTeamId ?? ""}
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
                defaultValue={defaultDate}
                placeholder="Azi"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
            <Field label="Ora start">
              <input
                name="startTime"
                type="time"
                placeholder="Acum"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
            <Field label="Ora sfârșit">
              <input
                name="endTime"
                type="time"
                placeholder="20:00"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
          </div>
          <p className="-mt-2 text-[11.5px] text-muted-2">
            Lăsate necompletate, lucrarea se programează azi, cu ora de start acum și ora de sfârșit la 20:00.
          </p>

          <Field label="Descriere">
            <textarea
              name="description"
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              rows={5}
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>

          <Field label="Mesaj pentru tehnician (opțional)">
            <textarea
              name="adminMessage"
              rows={2}
              placeholder="Ex: Ai grijă la siguranță, succes!"
              className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
            />
          </Field>

          {materials.length > 0 && (
            <div className="rounded-[12px] border border-[#eaecf0] bg-neutral-bg p-4">
              <div className="mb-1 text-[13px] font-bold text-foreground">
                Materiale & scule necesare
              </div>
              <p className="mb-3 text-[12px] text-muted-2">
                {template
                  ? "Sugerate pentru acest tip de lucrare, pe baza catalogului tău. Bifează ce e nevoie — tehnicianul le va vedea alocate lucrării încă de la început."
                  : "Alege un titlu din listă pentru sugestii, sau bifează direct din tot catalogul mai jos."}
              </p>

              {suggested.length > 0 && (
                <div className="mb-3 flex flex-col gap-1.5">
                  {suggested.map((m) => (
                    <MaterialCheckbox
                      key={m.id}
                      material={m}
                      checked={checkedMaterialIds.has(m.id)}
                      onToggle={() => toggleMaterial(m.id)}
                    />
                  ))}
                </div>
              )}

              {rest.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowFullCatalog((v) => !v)}
                    className="text-[12px] font-bold text-electric"
                  >
                    {showFullCatalog ? "Ascunde restul catalogului" : `Arată tot catalogul (${rest.length})`}
                  </button>
                  {showFullCatalog && (
                    <div className="mt-2.5 flex max-h-52 flex-col gap-1.5 overflow-y-auto">
                      {rest.map((m) => (
                        <MaterialCheckbox
                          key={m.id}
                          material={m}
                          checked={checkedMaterialIds.has(m.id)}
                          onToggle={() => toggleMaterial(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {Array.from(checkedMaterialIds).map((id) => (
                <input key={id} type="hidden" name="requiredMaterialIds" value={id} />
              ))}
            </div>
          )}

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

function MaterialCheckbox({
  material,
  checked,
  onToggle,
}: {
  material: Material;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = material.kind === "tool" ? Wrench : Package;
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[8px] bg-white px-2.5 py-2 text-[12.5px]">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-3.5 w-3.5 accent-[#2f6fed]" />
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-2" />
      <span className="flex-1 truncate">{material.name}</span>
      <span className="shrink-0 text-[11px] text-muted-2">{material.category ?? "—"}</span>
    </label>
  );
}
