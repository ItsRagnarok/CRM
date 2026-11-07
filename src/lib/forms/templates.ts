// Technical forms the technician fills on site. The platform does NOT judge a
// measurement against a norm (limits differ by regime and standard and must be
// confirmed with an authorized person) — the technician records the values and
// states the result; the office reviews.

export type FieldType = "text" | "number" | "date" | "yesno" | "textarea" | "choice";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export type RepeaterDef = {
  key: string;
  itemLabel: string; // e.g. "String", "Circuit"
  addLabel: string;
  min: number;
  max: number;
  fields: FieldDef[];
};

export type StepDef = {
  title: string;
  fields?: FieldDef[];
  repeater?: RepeaterDef;
};

export type FormTemplate = {
  id: "gaze_etanseitate" | "pv_punere_in_functiune" | "electric_verificare";
  domain: "gaze" | "fotovoltaic" | "electric";
  label: string;
  description: string;
  steps: StepDef[];
};

const RESULT_CHOICE = [
  { value: "conform", label: "Conform" },
  { value: "neconform", label: "Neconform" },
];

export const FORM_TEMPLATES: Record<FormTemplate["id"], FormTemplate> = {
  gaze_etanseitate: {
    id: "gaze_etanseitate",
    domain: "gaze",
    label: "Probă de etanșeitate (gaze)",
    description: "Aparat, presiuni, rezultat",
    steps: [
      {
        title: "Aparat de măsură",
        fields: [
          { key: "aparat", label: "Aparat de măsură", type: "text", required: true, placeholder: "ex. Manometru digital" },
          { key: "serie_aparat", label: "Serie aparat", type: "text", required: true },
          { key: "calibrare_pana", label: "Calibrare valabilă până la", type: "date", required: true, hint: "Un aparat necalibrat face procesul-verbal contestabil." },
        ],
      },
      {
        title: "Probă",
        fields: [
          { key: "presiune_proba", label: "Presiune de probă", type: "number", unit: "mbar", required: true, hint: "Valoarea depinde de regimul și amplasarea instalației. Completeaz-o conform proiectului." },
          { key: "durata", label: "Durată", type: "number", unit: "min", required: true },
          { key: "presiune_inceput", label: "Presiune la început", type: "number", unit: "mbar", required: true },
          { key: "presiune_final", label: "Presiune la final", type: "number", unit: "mbar", required: true },
          { key: "detector", label: "Verificare cu detector/spumant la racorduri și robinet", type: "yesno", required: true },
        ],
      },
      {
        title: "Rezultat",
        fields: [
          { key: "rezultat", label: "Rezultat probă", type: "choice", options: RESULT_CHOICE, required: true },
          { key: "observatii", label: "Observații", type: "textarea" },
        ],
      },
    ],
  },
  pv_punere_in_functiune: {
    id: "pv_punere_in_functiune",
    domain: "fotovoltaic",
    label: "Punere în funcțiune fotovoltaic",
    description: "Invertor, stringuri, rezultat",
    steps: [
      {
        title: "Invertor și panouri",
        fields: [
          { key: "invertor_model", label: "Model invertor", type: "text", required: true },
          { key: "invertor_serie", label: "Serie invertor", type: "text", required: true },
          { key: "nr_panouri", label: "Număr panouri", type: "number", required: true },
          { key: "putere_panou", label: "Putere panou", type: "number", unit: "W", required: true },
        ],
      },
      {
        title: "Măsurători pe stringuri",
        repeater: {
          key: "stringuri",
          itemLabel: "String",
          addLabel: "Adaugă string",
          min: 1,
          max: 12,
          fields: [
            { key: "voc", label: "Voc", type: "number", unit: "V", required: true },
            { key: "isc", label: "Isc", type: "number", unit: "A", required: true },
            { key: "izolatie", label: "Rezistență izolație", type: "number", unit: "MΩ", required: true },
          ],
        },
      },
      {
        title: "Rezultat",
        fields: [
          { key: "priza_pamant", label: "Rezistență priză de pământ", type: "number", unit: "Ω" },
          { key: "rezultat", label: "Rezultat punere în funcțiune", type: "choice", options: RESULT_CHOICE, required: true },
          { key: "observatii", label: "Observații", type: "textarea" },
        ],
      },
    ],
  },
  electric_verificare: {
    id: "electric_verificare",
    domain: "electric",
    label: "Verificare tablou electric",
    description: "Circuite, măsurători, rezultat",
    steps: [
      {
        title: "Tablou",
        fields: [
          { key: "tablou", label: "Tablou / locație", type: "text", required: true, placeholder: "ex. Tablou general, parter" },
          { key: "producator", label: "Producător și tip", type: "text" },
          { key: "serie", label: "Serie", type: "text" },
        ],
      },
      {
        title: "Circuite",
        repeater: {
          key: "circuite",
          itemLabel: "Circuit",
          addLabel: "Adaugă circuit",
          min: 1,
          max: 40,
          fields: [
            { key: "denumire", label: "Denumire circuit", type: "text", required: true, placeholder: "ex. C3 prize bucătărie" },
            { key: "protectie", label: "Protecție", type: "text", placeholder: "ex. B16" },
            { key: "izolatie", label: "Rezistență izolație", type: "number", unit: "MΩ", required: true },
            { key: "bucla", label: "Impedanță buclă defect", type: "number", unit: "Ω" },
            { key: "continuitate_pe", label: "Continuitate PE", type: "number", unit: "Ω" },
            { key: "rcd_ms", label: "Timp declanșare RCD", type: "number", unit: "ms" },
          ],
        },
      },
      {
        title: "Rezultat",
        fields: [
          { key: "rezultat", label: "Rezultat verificare", type: "choice", options: RESULT_CHOICE, required: true },
          { key: "observatii", label: "Observații", type: "textarea" },
        ],
      },
    ],
  },
};

export const TEMPLATE_BY_DOMAIN: Record<string, FormTemplate["id"]> = {
  gaze: "gaze_etanseitate",
  fotovoltaic: "pv_punere_in_functiune",
  electric: "electric_verificare",
};

export type FormValues = Record<string, string | number | boolean | Record<string, string>[] | undefined>;

/** Returns the labels of required fields that are still empty. */
export function missingRequired(template: FormTemplate, data: Record<string, unknown>): string[] {
  const missing: string[] = [];
  const empty = (v: unknown) => v === undefined || v === null || v === "";
  for (const step of template.steps) {
    for (const f of step.fields ?? []) {
      if (f.required && empty(data[f.key])) missing.push(f.label);
    }
    if (step.repeater) {
      const rows = Array.isArray(data[step.repeater.key]) ? (data[step.repeater.key] as Record<string, unknown>[]) : [];
      if (rows.length < step.repeater.min) missing.push(`${step.repeater.itemLabel} (cel puțin ${step.repeater.min})`);
      rows.forEach((row, i) => {
        for (const f of step.repeater!.fields) {
          if (f.required && empty(row[f.key])) missing.push(`${step.repeater!.itemLabel} ${i + 1}: ${f.label}`);
        }
      });
    }
  }
  return missing;
}
