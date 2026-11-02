import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePreview, readOnlyFetch } from "../src/lib/preview.ts";
import { startOfOrgDay } from "../src/lib/date.ts";

test("activity day boundaries follow Romania's summer/winter time", () => {
  assert.equal(startOfOrgDay("2026-03-29"), "2026-03-28T22:00:00.000Z");
  assert.equal(startOfOrgDay("2026-10-25"), "2026-10-24T21:00:00.000Z");
  assert.equal(startOfOrgDay("2026-11-02"), "2026-11-01T22:00:00.000Z");
});

test("preview context accepts only two complete UUIDs", () => {
  assert.equal(parsePreview("tenant:owner"), null);
  assert.equal(parsePreview(""), null);
  assert.equal(parsePreview("11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222:extra"), null);
  assert.deepEqual(parsePreview("11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222"), { organizationId: "11111111-1111-4111-8111-111111111111", profileId: "22222222-2222-4222-8222-222222222222" });
});

test("preview blocks table writes, mutating RPCs and file uploads before network", async () => {
  let requests = 0;
  const client = readOnlyFetch(async () => { requests++; return new Response("ok"); });
  for (const [pathname, method] of [["/rest/v1/jobs", "POST"], ["/rest/v1/jobs", "PATCH"], ["/rest/v1/jobs", "DELETE"], ["/rest/v1/rpc/next_invoice_number", "POST"], ["/rest/v1/rpc/platform_admin_delete_company", "POST"], ["/storage/v1/object/attachments/test", "POST"]]) {
    assert.equal((await client(`https://example.invalid${pathname}`, { method })).status, 403);
  }
  assert.equal(requests, 0);
});

test("preview permits reads, scoped employee-email lookup and signed attachment URLs", async () => {
  let requests = 0;
  const client = readOnlyFetch(async () => { requests++; return new Response("ok"); });
  for (const [pathname, method] of [["/rest/v1/jobs", "GET"], ["/rest/v1/jobs", "HEAD"], ["/rest/v1/rpc/ef_preview_employee_email", "POST"], ["/storage/v1/object/sign/attachments", "POST"]]) {
    assert.equal((await client(`https://example.invalid${pathname}`, { method })).status, 200);
  }
  assert.equal(requests, 4);
});
