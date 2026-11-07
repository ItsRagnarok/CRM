import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const gradle = read("android-app/android/app/build.gradle");
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
const web = read("src/lib/android-release.ts").match(/ANDROID_APP_VERSION\s*=\s*"([^"]+)"/)?.[1];

const problems = [];
if (!versionName) problems.push("versionName not found in build.gradle");
if (!web) problems.push("ANDROID_APP_VERSION not found in src/lib/android-release.ts");
if (versionName && web && versionName !== web) {
  problems.push(`build.gradle versionName "${versionName}" != ANDROID_APP_VERSION "${web}"`);
}
if (!Number.isInteger(versionCode) || versionCode < 1) problems.push("versionCode not found in build.gradle");

if (problems.length) {
  console.error("Android release metadata is inconsistent:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(`Android release metadata OK: v${versionName} (versionCode ${versionCode})`);
