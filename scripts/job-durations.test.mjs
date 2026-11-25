import { test } from "node:test";
import assert from "node:assert/strict";
import { jobKind, durationStats, estimateFor, formatMinutes, addMinutes, planningGap, actualMinutes, plannedMinutes } from "../src/lib/job-durations.ts";

test("tipul lucrării = titlul fără client", () => {
  assert.equal(jobKind("Montaj sistem fotovoltaic — Familia Rusu (casă)"), "montaj sistem fotovoltaic");
  assert.equal(jobKind("Revizie instalație gaze – casă"), "revizie instalație gaze");
  assert.equal(jobKind("  Înlocuire   tablou electric "), "înlocuire tablou electric");
});

test("mediană, interval, plan, fără pontaje aberante", () => {
  const s = (t, a, p = 180) => ({ title: t, actualMin: a, plannedMin: p });
  const stats = durationStats([
    s("Montaj sistem fotovoltaic — A", 240), s("Montaj sistem fotovoltaic — B", 300), s("Montaj sistem fotovoltaic — C", 270),
    s("Montaj sistem fotovoltaic — D", 330), s("Montaj sistem fotovoltaic — E", 2000), s("Montaj sistem fotovoltaic — F", 3),
    s("PRAM — X", 90, 120),
  ]);
  const pv = stats[0];
  assert.equal(pv.label, "Montaj sistem fotovoltaic");
  assert.equal(pv.count, 4);
  assert.equal(pv.medianMin, 285);
  assert.equal(pv.lowMin, 265);
  assert.equal(pv.highMin, 310);
  assert.equal(pv.plannedMedianMin, 180);
  assert.deepEqual(planningGap(pv), { kind: "under", diffMin: 105 });
  assert.equal(estimateFor("Montaj sistem fotovoltaic — Școala 18", stats).medianMin, 285);
  assert.equal(estimateFor("PRAM — Y", stats), null); // o singură lucrare: puține date
});

test("formatare și ora de sfârșit", () => {
  assert.equal(formatMinutes(285), "4 h 45 min");
  assert.equal(formatMinutes(120), "2 h");
  assert.equal(formatMinutes(40), "40 min");
  assert.equal(addMinutes("09:30", 200), "12:50");
  assert.equal(addMinutes("22:00", 180), null);
});

test("durata reală: de la primul start la ultimul stop, chiar cu doi tehnicieni", () => {
  const e = (t, at) => ({ job_id: "j", event_type: t, occurred_at: at });
  assert.equal(actualMinutes([e("work_start", "2026-11-20T08:00:00Z"), e("work_start", "2026-11-20T08:10:00Z"), e("work_end", "2026-11-20T11:00:00Z"), e("work_end", "2026-11-20T11:30:00Z")], { start: null, end: null }), 210);
  assert.equal(actualMinutes([], { start: "2026-11-20T08:00:00Z", end: "2026-11-20T09:00:00Z" }), 60);
  assert.equal(actualMinutes([], { start: null, end: null }), null);
  assert.equal(plannedMinutes("09:00:00", "13:30:00"), 270);
  assert.equal(plannedMinutes("13:00", "09:00"), null);
});
