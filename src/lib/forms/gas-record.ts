// Fișa de evidență a verificării / reviziei instalației de utilizare a gazelor naturale,
// după Ord. ANRE 179/2015, anexele 4 și 5. Textul operațiunilor 1–14 (verificare) și 1–16
// (revizie) e copiat din forma agregată din 2020; ultima operațiune (testarea detectorului și a
// electroventilului cu butonul „Test”) apare în forma consolidată după Ord. 96/2023.
// Firma trebuie să verifice formularul în vigoare înainte de folosire.
// Fără importuri cu „@/”: fișierul e testat direct cu node.
import type { FieldDef, FormTemplate, StepDef } from "./templates";

const OPS_COMMON_START = [
  "Verificarea arzătoarelor și a stării îmbinărilor și garniturilor de etanșare aferente",
  "Verificarea stabilității conductelor montate aparent pe suporturi",
  "Verificarea etanșeității îmbinării conductelor și armăturilor la presiunea de lucru a gazului din instalație, cu spumă de apă cu săpun sau cu alte tehnologii de verificare a etanșeității",
  "Verificarea funcționării aparatelor de măsurare, control, reglare și de siguranță",
  "Demontarea/Debranșarea aparatelor consumatoare de combustibili gazoși fără aprobare legală și a instalațiilor de utilizare a gazelor naturale aferente (tipul aparatului și debitul nominal se trec la justificare)",
  "Verificarea funcționării echipamentului de reglare din instalațiile de utilizare",
  "Verificarea stării răsuflătorilor și a căminelor existente",
];
const OP_COS = (lucrare: string) =>
  `Verificarea documentelor prezentate de client, din care să reiasă că a fost efectuată curățarea și verificarea coșurilor și a canalelor de evacuare a gazelor de ardere de către personal specializat în activități de coșerit, respectiv personal calificat în curățarea coșurilor de fum, emise cu maximum 6 luni înainte de data ${lucrare} tehnice a instalației de utilizare a gazelor naturale`;
const OP_STATII = "Verificarea stării construcțiilor care adăpostesc stațiile și posturi de reglare sau reglare–măsurare";
const OP_ISCIR =
  "Verificarea documentelor, prezentate de client, care să ateste efectuarea în termen a verificării tehnice periodice a aparatelor consumatoare de combustibili gazoși de către operatorii economici autorizați de Inspecția de Stat pentru Controlul Cazanelor, Recipientelor sub Presiune și Instalațiilor de Ridicat";
const OP_COMUNA = (lucrare: string) =>
  `${lucrare} tehnică a instalației comune de utilizare a gazelor naturale care deservește mai mulți clienți finali, cuprinsă între stația sau postul de reglare și sistemele/mijloacele de măsurare a gazelor naturale`;
const OP_RACORD =
  "Verificarea faptului că racordul flexibil montat în instalația de utilizare este în termen de valabilitate, având în vedere durata normată de utilizare specificată în prescripțiile tehnice ale producătorului";
const OP_DETECTOR =
  "Verificarea faptului că detectorul/detectoarele automat/automate de gaze montat/montate la locul de consum este/sunt în termen de valabilitate, având în vedere durata normată de utilizare specificată în prescripțiile tehnice ale producătorului";
const OP_INSTRUCTIUNI =
  "Verificarea existenței instrucțiunilor de utilizare a gazelor naturale, întocmite conform prevederilor Procedurii aprobate prin Ordinul ANRE nr. 32/2012 (dacă lipsesc, se predă clientului gratuit un exemplar)";
const OP_TEST =
  "Testarea funcționării detectorului automat de gaze și a electroventilului, prin acționarea butonului „Test” (forma consolidată a procedurii)";

export const VERIFICARE_OPS = [
  ...OPS_COMMON_START,
  OP_COS("verificării"),
  OP_STATII,
  OP_ISCIR,
  OP_COMUNA("Verificarea"),
  OP_RACORD,
  OP_DETECTOR,
  OP_INSTRUCTIUNI,
  OP_TEST,
];

export const REVIZIE_OPS = [
  ...OPS_COMMON_START,
  OP_COS("reviziei"),
  OP_STATII,
  OP_ISCIR,
  "Efectuarea probei de rezistență la presiune, conform prevederilor normelor tehnice din domeniul gazelor naturale, numai pentru partea de instalație la care s-au făcut înlocuiri și/sau modificări",
  "Efectuarea probei de etanșeitate la presiune, conform prevederilor normelor tehnice din domeniul gazelor naturale, a întregii instalații de utilizare a gazelor naturale",
  OP_RACORD,
  OP_DETECTOR,
  OP_COMUNA("Revizia"),
  OP_INSTRUCTIUNI,
  OP_TEST,
];

const DA_NU = [
  { value: "da", label: "Da" },
  { value: "nu", label: "Nu" },
];

function locStep(kind: "verificare" | "revizie"): StepDef {
  return {
    title: "Loc de consum",
    fields: [
      { key: "client", label: "Client final (nume / denumire)", type: "text", required: true },
      { key: "adresa", label: "Adresa locului de consum", type: "text", required: true, placeholder: "stradă, nr., bloc, scară, ap., localitate, județ" },
      { key: "cod_loc", label: "Codul locului de consum", type: "text" },
      { key: "contract_nr", label: "Contract de prestări servicii: număr", type: "text" },
      { key: "contract_data", label: "Contract: data", type: "date" },
      { key: "documentatie", label: "Documentația tehnică (anul) sau „nu deține”", type: "text" },
      { key: "ultima_lucrare", label: "Data ultimei verificări, din notificare", type: "date" },
      {
        key: "scadenta_notificare",
        label: "Data scadentă, din notificare",
        type: "date",
        hint: "Fișa se înregistrează la operator în cel mult 5 zile lucrătoare, dar nu după această dată.",
      },
      {
        key: "motiv",
        label: kind === "verificare" ? "Situația (tabelul 1)" : "Situația (tabelul 1)",
        type: "choice",
        required: true,
        options:
          kind === "verificare"
            ? [
                { value: "periodic", label: "La max. 2 ani" },
                { value: "cerere", label: "La cererea clientului" },
              ]
            : [
                { value: "periodic", label: "La max. 10 ani" },
                { value: "intrerupere", label: "Întrerupere > 6 luni" },
                { value: "eveniment", label: "După un eveniment" },
                { value: "cerere", label: "La cererea clientului" },
              ],
      },
      {
        key: "instalatie",
        label: "Instalația (tabelul 2)",
        type: "choice",
        required: true,
        options: [
          { value: "individuala", label: "Individuală" },
          { value: "comuna", label: "Comună" },
          { value: "ambele", label: "Ambele" },
        ],
      },
      { key: "ultima_fisa", label: "Nr. și data ultimei fișe (observații tabel 2)", type: "text" },
    ],
  };
}

const INSTALATOR: StepDef = {
  title: "Instalator autorizat",
  fields: [
    { key: "instalator_nume", label: "Nume și prenume", type: "text", required: true },
    { key: "legitimatie_tip", label: "Legitimație ANRE: tip", type: "text", required: true, placeholder: "ex. EGD, EDIB" },
    { key: "legitimatie_nr", label: "Legitimație: număr / an", type: "text", required: true },
    { key: "legitimatie_valabila", label: "Legitimație valabilă până la", type: "date", required: true, hint: "Data se ține minte pentru fișele următoare." },
  ],
};

const APARATE: StepDef = {
  title: "Aparate și documente",
  repeater: {
    key: "aparate",
    itemLabel: "Aparat",
    addLabel: "Adaugă aparat",
    min: 1,
    max: 10,
    fields: [
      { key: "tip", label: "Tip aparat", type: "text", required: true, placeholder: "ex. centrală murală, aragaz" },
      { key: "debit", label: "Debit nominal", type: "number", unit: "m³/h" },
      {
        key: "sursa",
        label: "Aparatul este",
        type: "choice",
        options: [
          { value: "notificat", label: "Notificat" },
          { value: "identificat", label: "Identificat" },
          { value: "ambele", label: "Ambele" },
        ],
      },
      { key: "cos_nr", label: "Document coș: număr", type: "text" },
      { key: "cos_data", label: "Document coș: data", type: "date", hint: "Emis cu cel mult 6 luni înainte." },
      { key: "iscir_nr", label: "Verificare ISCIR: număr", type: "text", hint: "Nu se aplică aragazului." },
      { key: "iscir_data", label: "Verificare ISCIR: data", type: "date" },
    ],
  },
};

function opsStep(items: string[]): StepDef {
  return {
    title: "Operațiuni (tabelul 3)",
    fields: [{ key: "operatiuni", label: "Operațiuni", type: "ops", items, required: true, hint: "Toate sunt obligatorii. La „Nu” scrii motivul, pe rând." }],
  };
}

const DOCUMENTE: StepDef = {
  title: "Racord, detector, instrucțiuni",
  fields: [
    { key: "racord_valabil", label: "Racordul flexibil e valabil până la", type: "date", hint: "Intră în scadențarul apartamentului." },
    { key: "detector_valabil", label: "Detectorul automat e valabil până la", type: "date" },
    {
      key: "instructiuni",
      label: "Instrucțiuni de utilizare",
      type: "choice",
      required: true,
      options: [
        { value: "exista", label: "Clientul le are" },
        { value: "predate", label: "Le-am predat acum" },
      ],
    },
  ],
};

const PROBE: StepDef = {
  title: "Probe de presiune (tabelul 4)",
  fields: [
    {
      key: "material", label: "Material", type: "choice", required: true,
      options: [{ value: "OL", label: "OL" }, { value: "PE100", label: "PE100" }, { value: "PE80", label: "PE80" }],
    },
    {
      key: "amplasare", label: "Amplasare", type: "choice", required: true,
      options: [{ value: "subteran", label: "Subteran" }, { value: "suprateran", label: "Suprateran" }],
    },
    {
      key: "regim", label: "Regim de presiune", type: "choice", required: true,
      options: [{ value: "joasa", label: "Joasă" }, { value: "redusa", label: "Redusă" }, { value: "medie", label: "Medie" }],
    },
    { key: "rezistenta_facuta", label: "S-a făcut proba de rezistență (doar pe partea înlocuită sau modificată)?", type: "yesno", required: true },
    { key: "rezistenta_presiune", label: "Proba de rezistență: presiune", type: "number", unit: "bar", required: true, showIf: { key: "rezistenta_facuta", equals: true } },
    { key: "rezistenta_timp", label: "Proba de rezistență: timp", type: "number", unit: "h", required: true, showIf: { key: "rezistenta_facuta", equals: true } },
    {
      key: "rezistenta_rezultat", label: "Proba de rezistență: rezultat", type: "choice", required: true, showIf: { key: "rezistenta_facuta", equals: true },
      options: [{ value: "admis", label: "Admis" }, { value: "respins", label: "Respins" }],
    },
    { key: "etanseitate_presiune", label: "Proba de etanșeitate: presiune", type: "number", unit: "bar", required: true, hint: "Cu aer comprimat, pe toată instalația." },
    { key: "etanseitate_timp", label: "Proba de etanșeitate: timp", type: "number", unit: "h", required: true },
    {
      key: "etanseitate_rezultat", label: "Proba de etanșeitate: rezultat", type: "choice", required: true,
      options: [{ value: "admis", label: "Admis" }, { value: "respins", label: "Respins" }],
    },
    { key: "client_confirma_probe", label: "Clientul confirmă că au fost efectuate probele", type: "yesno", required: true },
  ],
};

const DEFECTE: StepDef = {
  title: "Defecte constatate",
  repeater: {
    key: "defecte",
    itemLabel: "Defect",
    addLabel: "Adaugă defect",
    min: 0,
    max: 15,
    fields: [
      { key: "defect", label: "Defectul constatat", type: "text", required: true },
      { key: "remediere", label: "Modul de remediere", type: "text" },
      { key: "remediat", label: "Remediat", type: "choice", required: true, options: DA_NU },
    ],
  },
};

const CONCLUZII: StepDef = {
  title: "Concluzii",
  fields: [
    { key: "siguranta", label: "Instalația îndeplinește condițiile tehnice de funcționare în siguranță (tabelul 5)", type: "choice", required: true, options: DA_NU },
    { key: "siguranta_obs", label: "Ce condiții nu sunt îndeplinite și cum se pot remedia", type: "textarea", required: true, showIf: { key: "siguranta", equals: "nu" } },
    { key: "concluzie", label: "Instalația respectă normele tehnice și poate funcționa în condiții de siguranță", type: "choice", required: true, options: DA_NU },
    { key: "concluzie_obs", label: "Prevederile nerespectate și măsurile luate", type: "textarea", required: true, showIf: { key: "concluzie", equals: "nu" } },
    { key: "intrerupt", label: "Am întrerupt alimentarea cu gaze", type: "yesno", required: true },
    {
      key: "intrerupt_robinet", label: "De la ce robinet", type: "choice", required: true, showIf: { key: "intrerupt", equals: true },
      options: [
        { value: "incendiu", label: "De incendiu" },
        { value: "contor", label: "Contor" },
        { value: "sectionare", label: "Secționare" },
        { value: "aparat", label: "Aparat" },
      ],
    },
    { key: "intrerupt_motiv", label: "Motivul întreruperii (intră în fișă)", type: "textarea", required: true, showIf: { key: "intrerupt", equals: true } },
    {
      key: "operator_anuntat", label: "Anunț la operator (Tel Verde): ora și numărul de înregistrare", type: "text", showIf: { key: "intrerupt", equals: true },
      hint: "La o scăpare care nu se remediază imediat, anunți operatorul imediat (art. 10).",
    },
  ],
};

const SEMNATURI: StepDef = {
  title: "Semnături",
  fields: [
    { key: "client_confirma_operatii", label: "Clientul confirmă că au fost efectuate operațiunile din tabelul 3", type: "yesno", required: true },
    { key: "client_confirma_instructiuni", label: "Clientul confirmă că a primit un exemplar al instrucțiunilor de utilizare", type: "yesno", required: true },
    { key: "semnatura_client_nume", label: "Client: nume și prenume / denumire", type: "text", required: true },
    { key: "semnatura_client", label: "Semnătura clientului", type: "signature", required: true },
    { key: "semnatura_instalator", label: "Semnătura instalatorului autorizat", type: "signature", required: true },
    { key: "reprezentant_nume", label: "Reprezentantul legal sau împuternicitul firmei", type: "text", hint: "Poate semna și la birou, pe fișa tipărită." },
    { key: "semnatura_reprezentant", label: "Semnătura reprezentantului firmei", type: "signature" },
  ],
};

export const GAS_TEMPLATES: Record<"verificare" | "revizie", FormTemplate> = {
  verificare: {
    id: "gaze_verificare",
    domain: "gaze",
    label: "Fișa de evidență · verificare",
    description: "Ord. ANRE 179/2015, anexa 4",
    steps: [locStep("verificare"), INSTALATOR, APARATE, opsStep(VERIFICARE_OPS), DOCUMENTE, DEFECTE, CONCLUZII, SEMNATURI],
  },
  revizie: {
    id: "gaze_revizie",
    domain: "gaze",
    label: "Fișa de evidență · revizie",
    description: "Ord. ANRE 179/2015, anexa 5",
    steps: [locStep("revizie"), INSTALATOR, APARATE, opsStep(REVIZIE_OPS), PROBE, DOCUMENTE, DEFECTE, CONCLUZII, SEMNATURI],
  },
};

/** Câmpurile instalatorului se țin minte de la o fișă la alta. */
export const INSTALLER_KEYS = ["instalator_nume", "legitimatie_tip", "legitimatie_nr", "legitimatie_valabila"] as const;

const latest = (dates: unknown[]) =>
  dates.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().pop() ?? null;

/** Ce se scrie separat din fișă: concluzia, întreruperea și datele documentelor pentru scadențar. */
export function summarizeGasRecord(data: Record<string, unknown>) {
  const aparate = Array.isArray(data.aparate) ? (data.aparate as Record<string, unknown>[]) : [];
  return {
    conform: data.concluzie === "da" ? true : data.concluzie === "nu" ? false : null,
    gasInterrupted: data.intrerupt === true,
    docCos: latest(aparate.map((a) => a.cos_data)),
    docIscir: latest(aparate.map((a) => a.iscir_data)),
  };
}

export type GasField = FieldDef;
