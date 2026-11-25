import { strict as assert } from "node:assert";
import { pageName } from "../src/lib/site-pages";
assert.equal(pageName("/"), "Prima pagină");
assert.equal(pageName("/programare"), "Programare (formular)");
assert.match(pageName("/blog/panouri-fotovoltaice-produc-putin-verificari"), /fotovoltaice/i);
assert.equal(pageName("/blog/articol-nou-inca-nemapat"), "Articol: articol nou inca nemapat");
console.log("site-pages: ok");
