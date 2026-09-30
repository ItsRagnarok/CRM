"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Package, Sparkles, Camera, Loader2, Mic, Square } from "lucide-react";
import { createJob } from "../actions";
import { generateJobSuggestion, transcribeAudio } from "./ai-actions";
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
  const [customTitleValue, setCustomTitleValue] = useState("");
  const [jobType, setJobType] = useState("interventie");
  const [priorityValue, setPriorityValue] = useState("normala");
  const [startTimeValue, setStartTimeValue] = useState("");
  const [endTimeValue, setEndTimeValue] = useState("");
  const [checkedMaterialIds, setCheckedMaterialIds] = useState<Set<string>>(new Set());
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiState, setAiState] = useState<Awaited<ReturnType<typeof generateJobSuggestion>> | undefined>(undefined);
  const [aiPending, setAiPending] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  async function handleToggleRecording() {
    setVoiceError(null);

    if (voiceStatus === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceStatus("transcribing");
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const fd = new FormData();
        fd.set("audio", blob);
        try {
          const result = await transcribeAudio(fd);
          if (result.error) {
            setVoiceError(result.error);
          } else if (result.text) {
            setAiPrompt((prev) => (prev.trim() ? `${prev.trim()} ${result.text}` : result.text!));
          }
        } finally {
          setVoiceStatus("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setVoiceStatus("recording");
    } catch (err) {
      console.error("getUserMedia failed", err);
      setVoiceError("Nu am acces la microfon — verifică permisiunile browserului/telefonului.");
      setVoiceStatus("idle");
    }
  }

  async function handleGenerateAi() {
    setAiPending(true);
    setAiState(undefined);
    const fd = new FormData();
    fd.set("aiDescription", aiPrompt);
    fd.set("aiJobType", JOB_TYPE_LABELS[jobType as keyof typeof JOB_TYPE_LABELS] ?? jobType);
    fd.set("aiClientName", selectedClient?.name ?? "");
    try {
      const result = await generateJobSuggestion(undefined, fd);
      setAiState(result);
    } finally {
      setAiPending(false);
    }
  }
  const [customItems, setCustomItems] = useState<{ name: string; quantity: number; unit: string; kind: "material" | "tool" }[]>([]);
  const [aiSteps, setAiSteps] = useState<string[]>([]);
  const [aiApplied, setAiApplied] = useState(false);
  const [requireArrivalPhoto, setRequireArrivalPhoto] = useState(true);
  const [requireDuringPhoto, setRequireDuringPhoto] = useState(true);
  const [requireFinalPhoto, setRequireFinalPhoto] = useState(true);
  const [photoGuidanceBefore, setPhotoGuidanceBefore] = useState("");
  const [photoGuidanceDuring, setPhotoGuidanceDuring] = useState("");
  const [photoGuidanceAfter, setPhotoGuidanceAfter] = useState("");

  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  function addHours(hhmm: string, hours: number) {
    const [h, m] = hhmm.split(":").map(Number);
    let totalMinutes = h * 60 + m + Math.round(hours * 60);
    totalMinutes = Math.min(totalMinutes, 23 * 60 + 59);
    return `${pad2(Math.floor(totalMinutes / 60))}:${pad2(totalMinutes % 60)}`;
  }

  function findCatalogMatch(name: string) {
    return materials.find(
      (m) => m.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.name.toLowerCase())
    );
  }

  function applyAiSuggestion() {
    const suggestion = aiState?.suggestion;
    if (!suggestion) return;

    if (suggestion.title) {
      setTitleChoice(CUSTOM_TITLE);
      setCustomTitleValue(suggestion.title);
    }
    if (suggestion.jobType) setJobType(suggestion.jobType);
    if (suggestion.priority) setPriorityValue(suggestion.priority);
    setAiSteps(Array.isArray(suggestion.steps) ? suggestion.steps.filter(Boolean) : []);

    const now = new Date();
    const nowHM = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    setStartTimeValue(nowHM);
    setEndTimeValue(addHours(nowHM, suggestion.estimatedHoursTwoPeople || 2));

    // Compose the description ourselves instead of trusting the model's raw
    // "instructions" string to contain real line breaks between steps (it
    // often doesn't, producing an unreadable wall of text) — the numbered
    // list is built from the structured "steps" array with guaranteed \n
    // between each one.
    const steps = Array.isArray(suggestion.steps) ? suggestion.steps.filter(Boolean) : [];
    const stepsBlock = steps.length > 0 ? steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "";
    setDescriptionValue([suggestion.instructions?.trim(), stepsBlock].filter(Boolean).join("\n\n"));
    if (suggestion.photos?.before) setPhotoGuidanceBefore(suggestion.photos.before);
    if (suggestion.photos?.during) setPhotoGuidanceDuring(suggestion.photos.during);
    if (suggestion.photos?.after) setPhotoGuidanceAfter(suggestion.photos.after);

    // Take control of the materials/tools section entirely: catalog matches
    // get checked directly, and anything AI suggested that isn't in the
    // catalog is added as its own editable, removable line — not just
    // listed as text the admin has to act on manually elsewhere.
    const nextChecked = new Set(checkedMaterialIds);
    const nextCustom: typeof customItems = [];
    for (const m of suggestion.materials) {
      const match = findCatalogMatch(m.name);
      if (match) nextChecked.add(match.id);
      else nextCustom.push({ name: m.name, quantity: Math.max(1, Number(m.quantity) || 1), unit: m.unit || "buc", kind: "material" });
    }
    for (const toolName of suggestion.tools) {
      const match = findCatalogMatch(toolName);
      if (match) nextChecked.add(match.id);
      else nextCustom.push({ name: toolName, quantity: 1, unit: "buc", kind: "tool" });
    }
    setCheckedMaterialIds(nextChecked);
    setCustomItems(nextCustom);
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
                value={customTitleValue}
                onChange={(e) => setCustomTitleValue(e.target.value)}
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
              trebuie făcute înainte, în timpul și la final.{" "}
              <b className="text-[#7a5b0e]">
                Pașii tehnici generați de AI trebuie verificați de un electrician autorizat înainte de execuție —
                nu îi trimite direct tehnicianului fără să-i citești.
              </b>
            </p>
            <div className="flex items-start gap-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={2}
                placeholder="Ex: Înlocuire tablou electric vechi cu unul nou, 12 module, apartament la etaj 3"
                className="w-full rounded-[10px] border border-[#d0d5dd] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={voiceStatus === "transcribing"}
                title={voiceStatus === "recording" ? "Oprește înregistrarea" : "Dictează descrierea"}
                className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] border transition-colors disabled:opacity-60 ${
                  voiceStatus === "recording"
                    ? "border-danger bg-danger/10 text-danger"
                    : "border-[#d0d5dd] bg-white text-[#475467] hover:bg-neutral-bg"
                }`}
              >
                {voiceStatus === "transcribing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : voiceStatus === "recording" ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>
            {voiceStatus === "recording" && (
              <p className="mt-1.5 text-[12px] font-semibold text-danger">● Se înregistrează… apasă din nou ca să oprești.</p>
            )}
            {voiceStatus === "transcribing" && (
              <p className="mt-1.5 text-[12px] font-semibold text-muted">Se transcrie înregistrarea…</p>
            )}
            {voiceError && <p className="mt-1.5 text-[12px] font-semibold text-danger">{voiceError}</p>}
            {/* A <form> here would nest inside the page's own create-job
                <form> below — invalid HTML that browsers silently break
                (dropping the inner form entirely), which is why this button
                did nothing / misbehaved. Call the server action directly and
                await it instead of relying on native form submission or
                useActionState's pending flag (unreliable when the action
                isn't dispatched through an actual <form> submit), so the
                loading state is never in doubt. */}
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                disabled={aiPending}
                onClick={handleGenerateAi}
                className="flex items-center gap-1.5 rounded-[9px] bg-electric px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-80"
              >
                {aiPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {aiPending ? "Se generează…" : "Generează cu AI"}
              </button>
            </div>

            {aiPending && (
              <div className="mt-3 flex items-center gap-2.5 rounded-[10px] border border-[#d9e6ff] bg-white p-3.5">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-electric" />
                <p className="text-[12.5px] text-[#344054]">
                  AI-ul analizează descrierea și completează titlul, materialele, sculele, pașii, pozele necesare și
                  timpul estimat…
                </p>
              </div>
            )}

            {aiState?.error && <p className="mt-2.5 text-[12.5px] font-semibold text-danger">{aiState.error}</p>}

            {aiState?.suggestion && !aiApplied && (
              <div className="mt-3 rounded-[10px] border border-[#d9e6ff] bg-white p-3.5">
                <div className="text-[12.5px] font-bold text-foreground">{aiState.suggestion.title}</div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold text-electric">
                  <span className="rounded-full bg-electric-soft px-2 py-0.5">
                    {JOB_TYPE_LABELS[aiState.suggestion.jobType as keyof typeof JOB_TYPE_LABELS] ?? aiState.suggestion.jobType}
                  </span>
                  <span className="rounded-full bg-electric-soft px-2 py-0.5">
                    {JOB_PRIORITY_LABELS[aiState.suggestion.priority as keyof typeof JOB_PRIORITY_LABELS] ?? aiState.suggestion.priority}
                  </span>
                  <span className="rounded-full bg-electric-soft px-2 py-0.5">
                    ~{aiState.suggestion.estimatedHoursTwoPeople}h · 2 persoane
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-[12px] text-[#344054]">{aiState.suggestion.instructions}</p>
                {aiState.suggestion.steps.length > 0 && (
                  <ol className="mt-2 list-decimal pl-4 text-[12px] text-[#344054]">
                    {aiState.suggestion.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
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
                  Aplică sugestia (completează tot formularul)
                </button>
              </div>
            )}

            {aiApplied && (
              <div className="mt-3 rounded-[10px] border border-success-bg bg-success-bg p-3">
                <p className="text-[12px] font-semibold text-success">
                  Sugestia a fost aplicată — verifică toate câmpurile completate mai jos înainte să salvezi.
                </p>
              </div>
            )}
          </div>

          {aiSteps.length > 0 && (
            <input type="hidden" name="aiChecklistSteps" value={JSON.stringify(aiSteps)} />
          )}

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
                value={priorityValue}
                onChange={(e) => setPriorityValue(e.target.value)}
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
                value={startTimeValue}
                onChange={(e) => setStartTimeValue(e.target.value)}
                placeholder="Acum"
                className="w-full rounded-[10px] border border-[#d0d5dd] px-3.5 py-2.5 text-sm outline-none focus:border-electric"
              />
            </Field>
            <Field label="Ora sfârșit">
              <input
                name="endTime"
                type="time"
                value={endTimeValue}
                onChange={(e) => setEndTimeValue(e.target.value)}
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

          {customItems.length > 0 && (
            <div className="rounded-[12px] border border-[#d9e6ff] bg-electric-soft/30 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-electric" /> Sugerate de AI, nu sunt în catalog
              </div>
              <p className="mb-2.5 text-[12px] text-muted-2">
                Se adaugă lucrării ca elemente separate. Șterge-le pe cele care nu se aplică.
              </p>
              <div className="flex flex-col gap-1.5">
                {customItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-[9px] bg-white px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.kind === "tool" ? "bg-purple-soft text-purple" : "bg-electric-soft text-electric"
                      }`}
                    >
                      {item.kind === "tool" ? "SCULĂ" : "MATERIAL"}
                    </span>
                    <span className="flex-1 text-[12.5px] text-[#344054]">
                      {item.name} · {item.quantity} {item.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomItems((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-[11px] font-bold text-danger"
                    >
                      Șterge
                    </button>
                  </div>
                ))}
              </div>
              <input type="hidden" name="customRequiredItems" value={JSON.stringify(customItems)} />
            </div>
          )}

          <div className="rounded-[12px] border border-[#eaecf0] bg-neutral-bg p-4">
            <div className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-foreground">
              <Camera className="h-4 w-4 text-muted" /> Fotografii necesare
            </div>
            <PhotoRequirementField
              label="Poză la sosire (înainte)"
              checkboxName="requireArrivalPhoto"
              checked={requireArrivalPhoto}
              onToggle={() => setRequireArrivalPhoto((v) => !v)}
              guidanceName="photoGuidanceBefore"
              guidance={photoGuidanceBefore}
              onGuidanceChange={setPhotoGuidanceBefore}
            />
            <PhotoRequirementField
              label="Poză în timpul lucrării"
              checkboxName="requireDuringPhoto"
              checked={requireDuringPhoto}
              onToggle={() => setRequireDuringPhoto((v) => !v)}
              guidanceName="photoGuidanceDuring"
              guidance={photoGuidanceDuring}
              onGuidanceChange={setPhotoGuidanceDuring}
            />
            <PhotoRequirementField
              label="Poză la final"
              checkboxName="requireFinalPhoto"
              checked={requireFinalPhoto}
              onToggle={() => setRequireFinalPhoto((v) => !v)}
              guidanceName="photoGuidanceAfter"
              guidance={photoGuidanceAfter}
              onGuidanceChange={setPhotoGuidanceAfter}
              last
            />
          </div>

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

function PhotoRequirementField({
  label,
  checkboxName,
  checked,
  onToggle,
  guidanceName,
  guidance,
  onGuidanceChange,
  last,
}: {
  label: string;
  checkboxName: string;
  checked: boolean;
  onToggle: () => void;
  guidanceName: string;
  guidance: string;
  onGuidanceChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-3 border-b border-[#eaecf0] pb-3"}>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#344054]">
        <input
          type="checkbox"
          name={checkboxName}
          checked={checked}
          onChange={onToggle}
          className="h-3.5 w-3.5 accent-[#2f6fed]"
        />
        {label} <span className="text-[11px] font-normal text-muted-2">— obligatorie</span>
      </label>
      <textarea
        name={guidanceName}
        value={guidance}
        onChange={(e) => onGuidanceChange(e.target.value)}
        rows={2}
        placeholder="Ce trebuie să se vadă în poză și de unde se face (opțional, completat automat de AI)"
        className="mt-1.5 w-full rounded-[9px] border border-[#d0d5dd] bg-white px-3 py-2 text-[12.5px] outline-none focus:border-electric"
      />
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
