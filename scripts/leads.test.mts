import { test } from "node:test";
import assert from "node:assert/strict";
import { nextStage, followUpState, pipelineValue, winRate, dayMonth, isLeadStage, sourceLabel, buildBrief } from "../src/lib/leads";

test("etapa următoare", () => {
  assert.equal(nextStage("nou"), "contactat");
  assert.equal(nextStage("contactat"), "discutie");
  assert.equal(nextStage("negociere"), null);
  assert.equal(nextStage("castigat"), null);
});

test("reluarea leadului", () => {
  assert.equal(followUpState("2026-11-25", "2026-11-26", "nou"), "intarziat");
  assert.equal(followUpState("2026-11-26", "2026-11-26", "oferta"), "azi");
  assert.equal(followUpState("2026-11-30", "2026-11-26", "contactat"), "viitor");
  assert.equal(followUpState(null, "2026-11-26", "nou"), "fara");
  assert.equal(followUpState("2026-11-01", "2026-11-26", "pierdut"), "fara");
});

test("valoarea din pipeline numără doar leadurile deschise", () => {
  const r = pipelineValue([
    { stage: "nou", estimated_value: "1500.50" },
    { stage: "negociere", estimated_value: 2000 },
    { stage: "castigat", estimated_value: 9000 },
    { stage: "oferta", estimated_value: null },
  ]);
  assert.equal(r.total, 3500.5);
  assert.equal(r.counted, 2);
});

test("rata de câștig", () => {
  assert.equal(winRate([{ stage: "nou" }]), null);
  assert.equal(winRate([{ stage: "castigat" }, { stage: "castigat" }, { stage: "pierdut" }, { stage: "nou" }]), 67);
});

test("etichete și date", () => {
  assert.equal(dayMonth("2026-11-27"), "27.11");
  assert.equal(isLeadStage("discutie"), true);
  assert.equal(isLeadStage("demo"), false);
  assert.equal(sourceLabel("targ"), "Târg");
});

test("briefului pentru Claude: date, istoric și ce nu știm", () => {
  const brief = buildBrief(
    { company_name: "Therm Gaz Ploiești", contact_name: "Cătălin Ene", phone: null, email: null, stage: "negociere", source: "recomandare", team_size: 9, domains: ["gaze"], estimated_value: 349, next_follow_up: "2026-11-27", current_tools: null, problems: null, lost_reason: null, created_at: "2026-11-20T10:00:00Z" },
    [
      { kind: "apel", body: "Cere reducere pentru plata anuală.", created_at: "2026-11-25T16:00:00Z" },
      { kind: "email", body: "Ofertă trimisă.", created_at: "2026-11-20T10:30:00Z" },
    ],
    "2026-11-26",
  );
  assert.match(brief, /Firmă: Therm Gaz Ploiești/);
  assert.match(brief, /Telefon: necunoscut/);
  assert.match(brief, /Ce folosesc acum: necunoscut/);
  assert.match(brief, /Domenii: Gaze/);
  assert.match(brief, /Etapă: Negociere/);
  assert.ok(brief.indexOf("Cere reducere") < brief.indexOf("Ofertă trimisă"), "cele mai noi primele");
  assert.match(brief, /nu există\)/, "listează ce lipsește din platformă");
  assert.match(brief, /pe „tu”/);
  const empty = buildBrief({ company_name: "X", contact_name: null, phone: null, email: null, stage: "nou", source: "site", team_size: null, domains: [], estimated_value: null, next_follow_up: null, current_tools: null, problems: null, lost_reason: null, created_at: "2026-11-26T08:00:00Z" }, [], "2026-11-26");
  assert.match(empty, /nimic notat încă/);
});

test("etichete: curățare, dubluri, limită, bifă", async () => {
  const { normalizeTags, toggleTag, hasTag } = await import("../src/lib/leads");
  assert.deepEqual(normalizeTags(["  Important ", "important", "", "Urgent", 5, "a".repeat(40)]), ["Important", "Urgent", "a".repeat(24)]);
  assert.equal(normalizeTags(Array.from({ length: 12 }, (_, i) => `t${i}`)).length, 8);
  assert.deepEqual(toggleTag(["Important"], "IMPORTANT"), []);
  assert.deepEqual(toggleTag([], "Cald"), ["Cald"]);
  assert.equal(hasTag(["De urmărit"], "de urmărit"), true);
  assert.equal(hasTag(null, "x"), false);
});
