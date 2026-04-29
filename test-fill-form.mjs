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

// ── 2. PROFILE LOADER ─────────────────────────────────────────────

console.log("2. Profile loader");

try {
  const { loadProfile } = await import("./lib/profile-loader.mjs");
  const { dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const root = dirname(fileURLToPath(import.meta.url));
  const profile = loadProfile(root);

  try {
    assert.equal(typeof profile.firstName, "string");
    pass("firstName is string");
  } catch (e) {
    fail("firstName", e);
  }
  try {
    assert.ok(profile.firstName.length > 0);
    pass("firstName non-empty");
  } catch (e) {
    fail("firstName non-empty", e);
  }
  try {
    assert.ok(profile.lastName.length > 0);
    pass("lastName non-empty");
  } catch (e) {
    fail("lastName", e);
  }
  try {
    assert.ok(profile.email.includes("@"));
    pass("email contains @");
  } catch (e) {
    fail("email", e);
  }
  try {
    assert.ok(profile.phone.startsWith("+"));
    pass("phone starts with +");
  } catch (e) {
    fail("phone", e);
  }
  try {
    assert.ok(profile.fullName.includes(profile.firstName));
    pass("fullName contains firstName");
  } catch (e) {
    fail("fullName", e);
  }
  try {
    assert.equal(profile.currency, "EUR");
    pass("currency is EUR");
  } catch (e) {
    fail("currency", e);
  }
  try {
    assert.ok(profile.workAuth.length > 0);
    pass("workAuth non-empty");
  } catch (e) {
    fail("workAuth", e);
  }
  try {
    assert.ok(profile.linkedinUrl.startsWith("http"));
    pass("linkedinUrl is a URL");
  } catch (e) {
    fail("linkedinUrl", e);
  }
  try {
    assert.ok(profile.city.length > 0);
    pass("city non-empty");
  } catch (e) {
    fail("city", e);
  }
} catch (e) {
  fail("import lib/profile-loader.mjs", e);
}

// ── RESULTS ───────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
