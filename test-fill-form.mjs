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

// ── 3. GREENHOUSE FORM EXTRACTION (PLAYWRIGHT) ────────────────────

console.log("3. Greenhouse form extraction (Playwright)");

try {
  const { chromium } = await import("playwright");
  const { extractFields } = await import("./lib/form-extractor.mjs");
  const { dirname, join } = await import("path");
  const { fileURLToPath } = await import("url");

  const rootDir = dirname(fileURLToPath(import.meta.url));
  const fixtureUrl = `file://${join(rootDir, "test/fixtures/greenhouse-form.html")}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(fixtureUrl);

  // Pass a Greenhouse URL so the platform is detected correctly
  const result = await extractFields(
    page,
    "https://job-boards.greenhouse.io/acme/jobs/1",
  );
  await browser.close();

  try {
    assert.ok(Array.isArray(result.fields));
    pass("fields is array");
  } catch (e) {
    fail("fields array", e);
  }
  try {
    assert.ok(result.fields.length >= 4);
    pass(`extracted ${result.fields.length} fields`);
  } catch (e) {
    fail("field count >= 4", e);
  }
  try {
    assert.equal(result.platform, "greenhouse");
    pass("platform = greenhouse");
  } catch (e) {
    fail("platform", e);
  }

  const firstName = result.fields.find((f) => f.id === "first_name");
  try {
    assert.ok(firstName);
    pass("found first_name field");
  } catch (e) {
    fail("first_name field", e);
  }
  try {
    assert.equal(firstName?.type, "text");
    pass("first_name type = text");
  } catch (e) {
    fail("first_name type", e);
  }
  try {
    assert.equal(firstName?.required, true);
    pass("first_name required = true");
  } catch (e) {
    fail("first_name required", e);
  }

  const fileField = result.fields.find((f) => f.type === "file");
  try {
    assert.ok(fileField);
    pass("found file upload field");
  } catch (e) {
    fail("file field", e);
  }

  const selectField = result.fields.find((f) => f.type === "select");
  try {
    assert.ok(selectField);
    assert.ok(
      Array.isArray(selectField.options) && selectField.options.length >= 2,
    );
    pass(`select field has ${selectField.options.length} options`);
  } catch (e) {
    fail("select field with options", e);
  }

  const textareas = result.fields.filter((f) => f.type === "textarea");
  try {
    assert.ok(textareas.length >= 1);
    pass(`found ${textareas.length} textarea(s)`);
  } catch (e) {
    fail("textarea count", e);
  }
} catch (e) {
  fail("Greenhouse extraction (Playwright)", e);
}

// ── RESULTS ───────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
