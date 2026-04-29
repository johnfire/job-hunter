#!/usr/bin/env node
import assert from "node:assert/strict";

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}
function fail(msg, err) {
  console.log(`  ❌ ${msg}: ${err?.message || err}`);
  failed++;
}

console.log("\n🧪 fill-form test suite\n");

// ── 1. ATS DETECTION ──────────────────────────────────────────────

console.log("1. ATS detection");

try {
  const { detectPlatform } = await import("./lib/ats-detect.mjs");

  const cases = [
    ["https://job-boards.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://boards.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://job-boards.eu.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://boards.eu.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://jobs.ashbyhq.com/acme/123", "ashby"],
    ["https://jobs.lever.co/acme/123-abc", "lever"],
    ["https://acme.com/careers/apply", "generic"],
    ["https://personio.de/jobs/123", "generic"],
  ];

  for (const [url, expected] of cases) {
    try {
      assert.equal(detectPlatform(url), expected);
      pass(`${url.split("/")[2]} → ${expected}`);
    } catch (e) {
      fail(`detectPlatform("${url}")`, e);
    }
  }
} catch (e) {
  fail("import lib/ats-detect.mjs", e);
}

// ── RESULTS ───────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
