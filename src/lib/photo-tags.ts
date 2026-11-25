// Etichetele pozelor (coloana photos.category). Tehnicianul alege eticheta înainte de poză,
// cu o atingere; biroul vede pozele grupate după ea.

export type PhotoTag = "before" | "during" | "after" | "hidden" | "receipt" | "problem";

export const PHOTO_TAGS: { id: PhotoTag; label: string; hint: string }[] = [
  { id: "before", label: "Înainte", hint: "Locul de muncă înainte să începi: tabloul, panoul, zona." },
  { id: "during", label: "În lucru", hint: "Pașii importanți din timpul lucrării." },
  { id: "hidden", label: "Ascuns", hint: "Ce se acoperă după montaj: trasee în perete, doze, împământare. Fă poza înainte să închizi." },
  { id: "after", label: "După", hint: "Lucrarea terminată, ca dovadă pentru client." },
  { id: "receipt", label: "Bon", hint: "Bonul sau factura unei cumpărături pentru lucrare." },
  { id: "problem", label: "Problemă", hint: "Defectul sau situația care împiedică lucrarea." },
];

export const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  before: "Înainte",
  during: "În lucru",
  after: "După",
  hidden: "Ascuns",
  receipt: "Bon",
  problem: "Problemă",
  material: "Material",
  document: "Document",
  depot_pickup: "Ridicare depozit",
};

/** Eticheta potrivită pentru o poză rapidă, după etapa lucrării. */
export function defaultPhotoTag(stage: { arrived: boolean; working: boolean; beforeCount: number }): PhotoTag {
  if (stage.arrived && !stage.working && stage.beforeCount === 0) return "before";
  return stage.working ? "during" : "before";
}
