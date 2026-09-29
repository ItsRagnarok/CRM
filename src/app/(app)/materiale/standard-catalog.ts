// A starting catalog of materials and tools a residential/commercial
// electrician crew commonly carries. Meant as an editable starting point —
// "Importă catalog standard" only adds items whose name doesn't already
// exist in the org, so it's safe to run more than once and everything
// stays fully editable (rename, re-categorize, delete) afterward.
export const STANDARD_CATALOG: {
  name: string;
  category: string;
  unit: string;
  minStock: number;
  kind: "material" | "tool";
}[] = [
  // Scule de mână
  { name: "Cleşte dezizolator", category: "Scule de mână", unit: "buc", minStock: 2, kind: "tool" },
  { name: "Cleşte patent", category: "Scule de mână", unit: "buc", minStock: 2, kind: "tool" },
  { name: "Cleşte cu tăiş lateral", category: "Scule de mână", unit: "buc", minStock: 2, kind: "tool" },
  { name: "Cleşte de sertizat papuci", category: "Scule de mână", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Set şurubelniţe izolate VDE 1000V", category: "Scule de mână", unit: "set", minStock: 2, kind: "tool" },
  { name: "Cheie reglabilă (cheie franceză)", category: "Scule de mână", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Ciocan electrician", category: "Scule de mână", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Cutter/cuţit universal", category: "Scule de mână", unit: "buc", minStock: 2, kind: "tool" },
  { name: "Fierăstrău manual pentru metal", category: "Scule de mână", unit: "buc", minStock: 1, kind: "tool" },

  // Scule electrice
  { name: "Maşină de găurit cu percuţie", category: "Scule electrice", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Set burghie beton (diverse diametre)", category: "Scule electrice", unit: "set", minStock: 1, kind: "tool" },
  { name: "Șurubelniţă electrică/acumulator", category: "Scule electrice", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Disc de tăiere flex — metal/inox", category: "Scule electrice", unit: "buc", minStock: 5, kind: "material" },

  // Scule specifice electrice / aparate de măsură
  { name: "Multimetru digital", category: "Aparate de măsură", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Tester ordine faze / nul-fază", category: "Aparate de măsură", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Creion fazometric", category: "Aparate de măsură", unit: "buc", minStock: 2, kind: "tool" },
  { name: "Detector cabluri/metale sub tencuială", category: "Aparate de măsură", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Megohmetru (tester izolaţie)", category: "Aparate de măsură", unit: "buc", minStock: 1, kind: "tool" },

  // Acces la înălţime
  { name: "Scară telescopică 3m", category: "Acces la înălțime", unit: "buc", minStock: 1, kind: "tool" },
  { name: "Schelă mobilă mică", category: "Acces la înălțime", unit: "buc", minStock: 1, kind: "tool" },

  // Echipament de protecţie
  { name: "Mănuşi electroizolante", category: "Echipament de protecție", unit: "pereche", minStock: 2, kind: "tool" },
  { name: "Ochelari de protecţie", category: "Echipament de protecție", unit: "buc", minStock: 2, kind: "tool" },
  { name: "Cască de protecţie", category: "Echipament de protecție", unit: "buc", minStock: 2, kind: "tool" },

  // Cabluri şi conductori
  { name: "Cablu CYA 1.5mm²", category: "Cabluri și conductori", unit: "m", minStock: 100, kind: "material" },
  { name: "Cablu CYA 2.5mm²", category: "Cabluri și conductori", unit: "m", minStock: 100, kind: "material" },
  { name: "Cablu FY 1.5mm²", category: "Cabluri și conductori", unit: "m", minStock: 50, kind: "material" },
  { name: "Cablu MYYM 3x2.5", category: "Cabluri și conductori", unit: "m", minStock: 50, kind: "material" },

  // Doze, tuburi şi canale cablu
  { name: "Doză derivaţie", category: "Doze, tuburi și canale cablu", unit: "buc", minStock: 20, kind: "material" },
  { name: "Tub riflat (copex) Ø16", category: "Doze, tuburi și canale cablu", unit: "m", minStock: 50, kind: "material" },
  { name: "Canal cablu PVC", category: "Doze, tuburi și canale cablu", unit: "m", minStock: 20, kind: "material" },

  // Fixare şi conectică
  { name: "Bridă (colier) cablu 2.5x100mm", category: "Fixare și conectică", unit: "buc", minStock: 50, kind: "material" },
  { name: "Clemă de legătură (tip Wago)", category: "Fixare și conectică", unit: "buc", minStock: 50, kind: "material" },
  { name: "Papuc terminal cablu (set diverse)", category: "Fixare și conectică", unit: "set", minStock: 5, kind: "material" },
  { name: "Bandă izolatoare electrică", category: "Fixare și conectică", unit: "buc", minStock: 10, kind: "material" },

  // Prize şi întrerupătoare
  { name: "Priză simplă cu împământare", category: "Prize și întrerupătoare", unit: "buc", minStock: 20, kind: "material" },
  { name: "Întrerupător simplu, îngropat", category: "Prize și întrerupătoare", unit: "buc", minStock: 20, kind: "material" },
  { name: "Întrerupător cap scară", category: "Prize și întrerupătoare", unit: "buc", minStock: 10, kind: "material" },
  { name: "Ramă/capac pentru mecanism priză-întrerupător", category: "Prize și întrerupătoare", unit: "buc", minStock: 20, kind: "material" },

  // Corpuri de iluminat
  { name: "Bec LED", category: "Corpuri de iluminat", unit: "buc", minStock: 20, kind: "material" },
  { name: "Spot LED încastrat", category: "Corpuri de iluminat", unit: "buc", minStock: 10, kind: "material" },

  // Tablouri şi componente
  { name: "Siguranţă automată (disjunctor)", category: "Tablouri și componente", unit: "buc", minStock: 10, kind: "material" },
  { name: "Siguranţă diferenţială (RCD)", category: "Tablouri și componente", unit: "buc", minStock: 5, kind: "material" },
  { name: "Tablou electric modular", category: "Tablouri și componente", unit: "buc", minStock: 2, kind: "material" },

  // Împământare
  { name: "Electrod de împământare", category: "Împământare", unit: "buc", minStock: 5, kind: "material" },
  { name: "Bandă/platbandă de împământare", category: "Împământare", unit: "m", minStock: 20, kind: "material" },
];
