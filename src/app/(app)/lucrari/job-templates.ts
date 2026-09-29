import type { Database } from "@/lib/supabase/database.types";

type JobType = Database["public"]["Enums"]["job_type"];

// Real, common job categories for a residential/commercial electrician
// crew — an editable starting point, not a fixed list: the title field
// still accepts free text, this just gives a faster, niche-correct default
// instead of a blank box. suggestedCategories matches the material
// categories used elsewhere in the app (standard catalog + admin-entered
// ones), so picking a template can also suggest relevant materials/tools.
export const JOB_TITLE_TEMPLATES: { title: string; jobType: JobType; suggestedCategories: string[] }[] = [
  {
    title: "Instalare tablou electric nou",
    jobType: "instalare",
    suggestedCategories: ["Tablouri și componente", "Scule electrice", "Scule de mână", "Aparate de măsură", "Echipament de protecție"],
  },
  {
    title: "Extindere/modificare circuit electric",
    jobType: "instalare",
    suggestedCategories: ["Cabluri și conductori", "Fixare și conectică", "Doze, tuburi și canale cablu", "Scule de mână"],
  },
  {
    title: "Montaj prize și întrerupătoare",
    jobType: "instalare",
    suggestedCategories: ["Prize și întrerupătoare", "Scule de mână"],
  },
  {
    title: "Montaj corpuri de iluminat",
    jobType: "instalare",
    suggestedCategories: ["Corpuri de iluminat", "Scule de mână", "Acces la înălțime"],
  },
  {
    title: "Spargere și canalizare perete pentru cablu",
    jobType: "instalare",
    suggestedCategories: ["Scule electrice", "Doze, tuburi și canale cablu", "Echipament de protecție"],
  },
  {
    title: "Găurire pentru trecere cabluri",
    jobType: "instalare",
    suggestedCategories: ["Scule electrice", "Echipament de protecție"],
  },
  {
    title: "Instalare sistem de împământare",
    jobType: "instalare",
    suggestedCategories: ["Împământare", "Scule de mână", "Aparate de măsură"],
  },
  {
    title: "Montaj rețea de date/internet",
    jobType: "instalare",
    suggestedCategories: ["Fixare și conectică", "Doze, tuburi și canale cablu", "Scule de mână"],
  },
  {
    title: "Instalare sistem supraveghere video (CCTV)",
    jobType: "instalare",
    suggestedCategories: ["Fixare și conectică", "Cabluri și conductori", "Scule electrice", "Acces la înălțime"],
  },
  {
    title: "Instalare interfon/sonerie",
    jobType: "instalare",
    suggestedCategories: ["Fixare și conectică", "Cabluri și conductori", "Scule de mână"],
  },
  {
    title: "Verificare și remediere defecțiune electrică",
    jobType: "reparatie",
    suggestedCategories: ["Aparate de măsură", "Scule de mână", "Fixare și conectică"],
  },
  {
    title: "Înlocuire siguranțe/disjunctor",
    jobType: "reparatie",
    suggestedCategories: ["Tablouri și componente", "Scule de mână", "Aparate de măsură"],
  },
  {
    title: "Reparație scurtcircuit",
    jobType: "reparatie",
    suggestedCategories: ["Aparate de măsură", "Scule de mână", "Fixare și conectică", "Echipament de protecție"],
  },
  {
    title: "Mentenanță periodică tablou electric",
    jobType: "mentenanta",
    suggestedCategories: ["Aparate de măsură", "Tablouri și componente"],
  },
  {
    title: "Verificare rezistență priză de pământ (PRAM)",
    jobType: "inspectie",
    suggestedCategories: ["Aparate de măsură", "Împământare"],
  },
  {
    title: "Recepție/verificare instalație electrică nouă",
    jobType: "inspectie",
    suggestedCategories: ["Aparate de măsură"],
  },
  {
    title: "Intervenție de urgență — pană de curent",
    jobType: "urgenta",
    suggestedCategories: ["Aparate de măsură", "Scule de mână", "Tablouri și componente"],
  },
  {
    title: "Automatizare/casă inteligentă",
    jobType: "instalare",
    suggestedCategories: ["Fixare și conectică", "Cabluri și conductori", "Scule de mână"],
  },
  {
    title: "Demontare instalație electrică veche",
    jobType: "demontare",
    suggestedCategories: ["Scule de mână", "Scule electrice", "Echipament de protecție"],
  },
  {
    title: "Service echipamente electrice",
    jobType: "service",
    suggestedCategories: ["Scule de mână", "Aparate de măsură"],
  },
];
