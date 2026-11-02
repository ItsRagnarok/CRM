import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Exercise actual PostgREST relationship resolution; SQL joins alone do not test it.
// Public anon credentials and limit=0 ensure no account data is fetched.
const source = await readFile(new URL("../public/programare.html", import.meta.url), "utf8");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || source.match(/const SUPABASE_URL = "([^"]+)"/)[1];
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || source.match(/const SUPABASE_KEY = "([^"]+)"/)[1];
for (const select of [
  "id,organizations(id)", // Existing deployments must also remain compatible.
  "id,organizations!profiles_organization_id_fkey(id)",
  "role,full_name,organizations!profiles_organization_id_fkey(id,name,is_active,terms_accepted_at)",
]) {
  const response = await fetch(`${url}/rest/v1/profiles?select=${encodeURIComponent(select)}&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const result = await response.json();
  assert.equal(response.status, 200, `Profile relationship resolution failed: ${result.code ?? response.status}`);
  assert.deepEqual(result, [], "This probe must not fetch account data");
}
console.log("Live PostgREST auth relationship checks passed (legacy, explicit FK, terms flow).");
