import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUserAgent, cleanScreen, cleanLang } from "../src/lib/user-agent.ts";

test("iPhone cu Safari", () => {
  assert.deepEqual(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1"), { os: "iOS 18", browser: "Safari", model: "iPhone" });
});
test("Samsung cu Chrome: modelul din Sec-CH-UA-Model", () => {
  const ua = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
  assert.deepEqual(parseUserAgent(ua, '"SM-S918B"'), { os: "Android 10", browser: "Chrome", model: "Samsung SM-S918B" });
  assert.equal(parseUserAgent(ua).model, "Telefon Android");
});
test("Samsung Internet cu modelul în UA", () => {
  const r = parseUserAgent("Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36");
  assert.deepEqual(r, { os: "Android 14", browser: "Samsung Internet", model: "Samsung SM-A546B" });
});
test("calculator Windows cu Edge, Mac cu Safari, Facebook în aplicație", () => {
  assert.deepEqual(parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"), { os: "Windows", browser: "Edge", model: "Calculator" });
  assert.deepEqual(parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15"), { os: "macOS", browser: "Safari", model: "Mac" });
  assert.equal(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]").browser, "Facebook (în aplicație)");
});
test("ecran și limbă", () => {
  assert.equal(cleanScreen("390x844"), "390x844");
  assert.equal(cleanScreen("abc"), null);
  assert.equal(cleanLang("ro-RO"), "ro");
  assert.equal(cleanLang("<script>"), null);
});
