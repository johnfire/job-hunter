# Form Auto-Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `fill-form.mjs` — a Playwright-based job application form filler that opens a URL, fills all fields from profile data + Claude-generated answers, and holds the browser open for user review before manual submission.

**Architecture:** Two-phase workflow. Phase 1 (`extract`, headless): Claude calls `fill-form.mjs extract <URL>` which navigates the page, detects the ATS platform, and dumps all form fields to `output/form-fields-<hash>.json` + a screenshot. Claude reads this JSON, generates an answers JSON from `config/profile.yml` + `cv.md` + the evaluation report, and writes `output/form-answers-<hash>.json`. Phase 2 (`fill`, headful): Claude calls `fill-form.mjs fill <URL> --answers <file>` which opens a visible browser, fills every field, takes a final screenshot, and keeps the browser alive until Ctrl+C so the user can review and submit manually.

**Tech Stack:** Node.js ESM (`.mjs`), Playwright ^1.58.1 (already installed), js-yaml ^4.1.1 (already installed), node:test (built-in)

---

## File Map

| File                                 | Role                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| `fill-form.mjs`                      | CLI entry point — `extract` and `fill` subcommands                |
| `lib/ats-detect.mjs`                 | URL → platform string (`greenhouse`, `ashby`, `lever`, `generic`) |
| `lib/profile-loader.mjs`             | Loads `config/profile.yml` → normalized profile object            |
| `lib/form-extractor.mjs`             | Playwright page → fields JSON (dispatches to ATS adapter)         |
| `lib/ats/greenhouse.mjs`             | Greenhouse-specific selectors + extraction logic                  |
| `lib/ats/ashby.mjs`                  | Ashby-specific selectors + extraction logic                       |
| `lib/ats/lever.mjs`                  | Lever-specific selectors + extraction logic                       |
| `lib/ats/generic.mjs`                | Generic label-based field detection (fallback)                    |
| `lib/field-filler.mjs`               | Playwright page + answers JSON → fills each field                 |
| `test/fixtures/greenhouse-form.html` | Mock Greenhouse form for integration tests                        |
| `test/fixtures/ashby-form.html`      | Mock Ashby form for integration tests                             |
| `test/fixtures/lever-form.html`      | Mock Lever form for integration tests                             |
| `test-fill-form.mjs`                 | Unit + integration test runner                                    |
| `modes/apply.md`                     | Updated to reference auto-fill workflow as Phase 2                |

---

## JSON Schemas

### Fields JSON (`output/form-fields-<hash>.json`)

```json
{
  "url": "https://job-boards.greenhouse.io/company/jobs/12345",
  "platform": "greenhouse",
  "extractedAt": "2026-04-29T10:30:00.000Z",
  "screenshotPath": "output/form-fields-abc123.png",
  "hasNextPage": false,
  "fields": [
    {
      "id": "first_name",
      "label": "First Name",
      "type": "text",
      "required": true,
      "selector": "#first_name",
      "options": null,
      "maxLength": null,
      "placeholder": "e.g. Jane"
    },
    {
      "id": "resume_upload",
      "label": "Resume/CV",
      "type": "file",
      "required": true,
      "selector": "input[data-source='resume']",
      "options": null,
      "maxLength": null,
      "placeholder": null
    },
    {
      "id": "why_company",
      "label": "Why do you want to work here?",
      "type": "textarea",
      "required": false,
      "selector": "#question_12345",
      "options": null,
      "maxLength": 500,
      "placeholder": null
    }
  ]
}
```

### Answers JSON (`output/form-answers-<hash>.json`) — **Claude generates this**

```json
{
  "url": "https://job-boards.greenhouse.io/company/jobs/12345",
  "platform": "greenhouse",
  "answers": [
    {
      "id": "first_name",
      "selector": "#first_name",
      "type": "text",
      "value": "Christopher"
    },
    {
      "id": "last_name",
      "selector": "#last_name",
      "type": "text",
      "value": "Rehm"
    },
    {
      "id": "email",
      "selector": "#email",
      "type": "email",
      "value": "car2187bus@pm.me"
    },
    {
      "id": "phone",
      "selector": "#phone",
      "type": "tel",
      "value": "+49 176 82 060 154"
    },
    {
      "id": "resume_upload",
      "selector": "input[data-source='resume']",
      "type": "file",
      "value": "output/cv-042-company-2026-04-29.pdf"
    },
    {
      "id": "why_company",
      "selector": "#question_12345",
      "type": "textarea",
      "value": "I'm excited by this role because..."
    }
  ]
}
```

---

## Task 1: CLI Skeleton + `lib/` Directory

**Files:**

- Create: `fill-form.mjs`
- Create: `lib/.gitkeep` (ensures lib/ is committed)

- [ ] **Step 1: Create `lib/` directory marker**

```bash
mkdir -p lib/ats
touch lib/.gitkeep
```

- [ ] **Step 2: Create the CLI skeleton `fill-form.mjs`**

```javascript
#!/usr/bin/env node
/**
 * fill-form.mjs — Playwright-based job application form auto-filler
 *
 * Usage:
 *   node fill-form.mjs extract <URL>
 *   node fill-form.mjs fill <URL> --answers <path-to-answers.json>
 */

import { createHash } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export const ROOT = dirname(fileURLToPath(import.meta.url));

const [, , subcommand, url, ...rest] = process.argv;

const USAGE = `
Usage:
  node fill-form.mjs extract <URL>
  node fill-form.mjs fill <URL> --answers <path>
`.trim();

if (!subcommand || !url) {
  console.error(USAGE);
  process.exit(1);
}

export function urlHash(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 8);
}

if (subcommand === "extract") {
  const { runExtract } = await import("./lib/extract-cmd.mjs");
  await runExtract(url);
} else if (subcommand === "fill") {
  const answersIdx = rest.indexOf("--answers");
  if (answersIdx === -1) {
    console.error("Missing --answers <path>");
    process.exit(1);
  }
  const answersPath = rest[answersIdx + 1];
  const { runFill } = await import("./lib/fill-cmd.mjs");
  await runFill(url, answersPath);
} else {
  console.error(`Unknown subcommand: ${subcommand}\n${USAGE}`);
  process.exit(1);
}
```

- [ ] **Step 3: Verify the CLI prints usage on empty args**

```bash
node fill-form.mjs
```

Expected: prints usage and exits with code 1.

- [ ] **Step 4: Commit**

```bash
git add fill-form.mjs lib/.gitkeep
git commit -m "feat: add fill-form.mjs CLI skeleton and lib/ structure"
```

---

## Task 2: ATS Detection (`lib/ats-detect.mjs`)

**Files:**

- Create: `lib/ats-detect.mjs`
- Modify: `test-fill-form.mjs` (create)

- [ ] **Step 1: Write the failing test**

Create `test-fill-form.mjs`:

```javascript
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
console.log("1. ATS detection");

// Will fail until lib/ats-detect.mjs exists
try {
  const { detectPlatform } = await import("./lib/ats-detect.mjs");

  const cases = [
    ["https://job-boards.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://boards.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://job-boards.eu.greenhouse.io/acme/jobs/123", "greenhouse"],
    ["https://jobs.ashbyhq.com/acme/123", "ashby"],
    ["https://jobs.lever.co/acme/123", "lever"],
    ["https://acme.com/careers/apply", "generic"],
  ];

  for (const [url, expected] of cases) {
    try {
      assert.equal(detectPlatform(url), expected);
      pass(`detectPlatform("${url.split("/")[2]}") → ${expected}`);
    } catch (e) {
      fail(`detectPlatform for ${url}`, e);
    }
  }
} catch (e) {
  fail("import lib/ats-detect.mjs", e);
}

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run to verify it fails**

```bash
node test-fill-form.mjs
```

Expected: `❌ import lib/ats-detect.mjs: Cannot find module`

- [ ] **Step 3: Implement `lib/ats-detect.mjs`**

```javascript
const PATTERNS = {
  greenhouse: /(?:job-boards|boards)\.(?:eu\.)?greenhouse\.io/,
  ashby: /jobs\.ashbyhq\.com/,
  lever: /jobs\.lever\.co/,
};

export function detectPlatform(url) {
  for (const [platform, re] of Object.entries(PATTERNS)) {
    if (re.test(url)) return platform;
  }
  return "generic";
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
node test-fill-form.mjs
```

Expected: 6 passing, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add lib/ats-detect.mjs test-fill-form.mjs
git commit -m "feat: add ATS platform detection"
```

---

## Task 3: Profile Loader (`lib/profile-loader.mjs`)

**Files:**

- Create: `lib/profile-loader.mjs`
- Modify: `test-fill-form.mjs`

- [ ] **Step 1: Add failing test to `test-fill-form.mjs`**

Append to `test-fill-form.mjs` (before the results line):

```javascript
console.log("2. Profile loader");

try {
  const { loadProfile } = await import("./lib/profile-loader.mjs");
  const profile = loadProfile(new URL(".", import.meta.url).pathname);

  try {
    assert.equal(typeof profile.firstName, "string");
    pass("firstName is string");
  } catch (e) {
    fail("firstName", e);
  }
  try {
    assert.ok(profile.email.includes("@"));
    pass("email contains @");
  } catch (e) {
    fail("email", e);
  }
  try {
    assert.ok(profile.fullName.length > 0);
    pass("fullName non-empty");
  } catch (e) {
    fail("fullName", e);
  }
  try {
    assert.ok(profile.phone.startsWith("+"));
    pass("phone starts with +");
  } catch (e) {
    fail("phone", e);
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
} catch (e) {
  fail("import lib/profile-loader.mjs", e);
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
node test-fill-form.mjs
```

Expected: `❌ import lib/profile-loader.mjs: Cannot find module`

- [ ] **Step 3: Implement `lib/profile-loader.mjs`**

```javascript
import { readFileSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

export function loadProfile(rootDir) {
  const raw = readFileSync(join(rootDir, "config/profile.yml"), "utf-8");
  const p = yaml.load(raw);
  const c = p.candidate;

  const nameParts = (c.full_name || "").split(" ");
  const locationParts = (c.location || "").split(",").map((s) => s.trim());

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    fullName: c.full_name || "",
    email: c.email || "",
    phone: c.phone || "",
    location: c.location || "",
    city: locationParts[0] || "",
    country: locationParts.at(-1) || "",
    linkedinUrl: c.linkedin_url || "",
    githubUrl: c.github_url || "",
    portfolioUrl: c.portfolio_url || "",
    salaryMin: p.compensation?.minimum || "",
    salaryTarget: p.compensation?.target_range || "",
    currency: p.compensation?.currency || "EUR",
    workAuth: c.visa_status || "Authorized to work",
  };
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
node test-fill-form.mjs
```

Expected: all profile loader tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/profile-loader.mjs test-fill-form.mjs
git commit -m "feat: add profile loader — reads config/profile.yml into normalized object"
```

---

## Task 4: Greenhouse Form Extractor + Test Fixture

**Files:**

- Create: `lib/ats/greenhouse.mjs`
- Create: `test/fixtures/greenhouse-form.html`
- Modify: `test-fill-form.mjs` (add Playwright integration test)

- [ ] **Step 1: Create the Greenhouse fixture HTML**

Create `test/fixtures/greenhouse-form.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Apply — Greenhouse Test Fixture</title>
  </head>
  <body>
    <form id="application-form">
      <div class="field">
        <label for="first_name">First Name *</label
        ><input type="text" id="first_name" name="first_name" required />
      </div>
      <div class="field">
        <label for="last_name">Last Name *</label
        ><input type="text" id="last_name" name="last_name" required />
      </div>
      <div class="field">
        <label for="email">Email *</label
        ><input type="email" id="email" name="email" required />
      </div>
      <div class="field">
        <label for="phone">Phone</label
        ><input type="tel" id="phone" name="phone" />
      </div>
      <div class="field">
        <label>Resume/CV *</label
        ><input
          type="file"
          data-source="resume"
          accept=".pdf,.doc,.docx"
          required
        />
      </div>
      <div class="field">
        <label for="cover_letter">Cover Letter</label
        ><textarea
          id="cover_letter"
          name="cover_letter"
          maxlength="5000"
        ></textarea>
      </div>
      <div class="field">
        <label for="hear_about">How did you hear about us?</label>
        <select id="hear_about" name="hear_about">
          <option value="">Select...</option>
          <option value="linkedin">LinkedIn</option>
          <option value="referral">Referral</option>
          <option value="job_board">Job Board</option>
        </select>
      </div>
      <div class="custom-question">
        <label for="question_why"
          >Why do you want to work here? (500 chars max)</label
        ><textarea
          id="question_why"
          name="question[1234]"
          maxlength="500"
        ></textarea>
      </div>
      <button type="submit">Submit Application</button>
    </form>
  </body>
</html>
```

- [ ] **Step 2: Add failing integration test to `test-fill-form.mjs`**

Add this section (before the results line). Note: this test launches a real browser — it will be slow (~3s) and requires a display or CI with `xvfb`:

```javascript
console.log("3. Greenhouse form extraction (Playwright)");

try {
  const { chromium } = await import("playwright");
  const { extractFields } = await import("./lib/form-extractor.mjs");
  const { readFileSync } = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const fixturePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "test/fixtures/greenhouse-form.html",
  );
  const fixtureUrl = `file://${fixturePath}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(fixtureUrl);

  const result = await extractFields(page, fixtureUrl);
  await browser.close();

  try {
    assert.equal(result.platform, "generic");
    pass("fixture detected as generic (file:// URL)");
  } catch (e) {
    fail("platform", e);
  }
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
    fail("field count", e);
  }

  const firstNameField = result.fields.find(
    (f) =>
      f.id === "first_name" || f.label.toLowerCase().includes("first name"),
  );
  try {
    assert.ok(firstNameField);
    pass("found first_name field");
  } catch (e) {
    fail("first_name field", e);
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
    assert.ok(Array.isArray(selectField.options));
    assert.ok(selectField.options.length > 0);
    pass(`found select field with ${selectField.options.length} options`);
  } catch (e) {
    fail("select field with options", e);
  }
} catch (e) {
  fail("Playwright extraction test", e);
}
```

- [ ] **Step 3: Run to verify it fails**

```bash
node test-fill-form.mjs
```

Expected: `❌ Playwright extraction test: Cannot find module './lib/form-extractor.mjs'`

- [ ] **Step 4: Implement `lib/ats/greenhouse.mjs`**

```javascript
/**
 * Greenhouse-specific form field extractor.
 * Targets known Greenhouse DOM patterns: #first_name, #last_name, etc.
 */

export async function extractGreenhouseFields(page) {
  return page.evaluate(() => {
    const fields = [];

    // Known Greenhouse structured fields
    const knownFields = [
      { id: "first_name", label: "First Name", type: "text" },
      { id: "last_name", label: "Last Name", type: "text" },
      { id: "email", label: "Email", type: "email" },
      { id: "phone", label: "Phone", type: "tel" },
    ];

    for (const kf of knownFields) {
      const el = document.querySelector(`#${kf.id}`);
      if (el) {
        fields.push({
          id: kf.id,
          label: kf.label,
          type: kf.type,
          required: el.hasAttribute("required"),
          selector: `#${kf.id}`,
          options: null,
          maxLength: el.maxLength > 0 ? el.maxLength : null,
          placeholder: el.placeholder || null,
        });
      }
    }

    // Resume file input
    const resumeInput = document.querySelector(
      "input[data-source='resume'], input[data-source='cover_letter'], input[type='file']",
    );
    if (resumeInput) {
      const label =
        resumeInput
          .closest(".field, .form-group, div")
          ?.querySelector("label")
          ?.textContent?.trim() || "Resume/CV";
      fields.push({
        id: "resume_upload",
        label,
        type: "file",
        required: resumeInput.hasAttribute("required"),
        selector: resumeInput.getAttribute("data-source")
          ? `input[data-source='${resumeInput.getAttribute("data-source")}']`
          : "input[type='file']",
        options: null,
        maxLength: null,
        placeholder: null,
      });
    }

    // Textareas (cover letter + custom questions)
    document.querySelectorAll("textarea").forEach((ta) => {
      const labelEl =
        document.querySelector(`label[for='${ta.id}']`) ||
        ta.closest(".field, .custom-question, div")?.querySelector("label");
      const label =
        labelEl?.textContent?.trim() || ta.name || ta.id || "Text field";
      if (label) {
        fields.push({
          id: ta.id || ta.name || `textarea_${fields.length}`,
          label,
          type: "textarea",
          required: ta.hasAttribute("required"),
          selector: ta.id ? `#${ta.id}` : `textarea[name='${ta.name}']`,
          options: null,
          maxLength: ta.maxLength > 0 ? ta.maxLength : null,
          placeholder: ta.placeholder || null,
        });
      }
    });

    // Selects
    document.querySelectorAll("select").forEach((sel) => {
      const labelEl =
        document.querySelector(`label[for='${sel.id}']`) ||
        sel.closest(".field, div")?.querySelector("label");
      const label = labelEl?.textContent?.trim() || sel.name || sel.id;
      const options = Array.from(sel.options)
        .map((o) => o.value)
        .filter((v) => v !== "");
      if (label) {
        fields.push({
          id: sel.id || sel.name || `select_${fields.length}`,
          label,
          type: "select",
          required: sel.hasAttribute("required"),
          selector: sel.id ? `#${sel.id}` : `select[name='${sel.name}']`,
          options,
          maxLength: null,
          placeholder: null,
        });
      }
    });

    return fields;
  });
}
```

- [ ] **Step 5: Implement `lib/form-extractor.mjs`**

```javascript
import { detectPlatform } from "./ats-detect.mjs";
import { extractGreenhouseFields } from "./ats/greenhouse.mjs";
import { extractGenericFields } from "./ats/generic.mjs";

export async function extractFields(page, url) {
  const platform = detectPlatform(url);

  let fields;
  switch (platform) {
    case "greenhouse":
      fields = await extractGreenhouseFields(page);
      break;
    case "ashby": {
      const { extractAshbyFields } = await import("./ats/ashby.mjs");
      fields = await extractAshbyFields(page);
      break;
    }
    case "lever": {
      const { extractLeverFields } = await import("./ats/lever.mjs");
      fields = await extractLeverFields(page);
      break;
    }
    default:
      fields = await extractGenericFields(page);
  }

  // Detect next page button
  const hasNextPage = await page.evaluate(
    () =>
      !!document.querySelector(
        'button[type=submit][data-action=next], input[value="Next"], button:is([aria-label*="Next"], [aria-label*="Continue"])',
      ),
  );

  return {
    url,
    platform,
    extractedAt: new Date().toISOString(),
    screenshotPath: null,
    hasNextPage,
    fields,
  };
}
```

- [ ] **Step 6: Create `lib/ats/generic.mjs`**

```javascript
export async function extractGenericFields(page) {
  return page.evaluate(() => {
    const fields = [];
    const seen = new Set();

    function addField(el, labelText) {
      if (!el || seen.has(el)) return;
      seen.add(el);
      const id = el.id || el.name || `field_${fields.length}`;
      const selector = el.id
        ? `#${el.id}`
        : el.name
          ? `[name='${el.name}']`
          : el.tagName.toLowerCase();
      let type =
        el.tagName.toLowerCase() === "textarea"
          ? "textarea"
          : el.tagName.toLowerCase() === "select"
            ? "select"
            : el.type || "text";
      const options =
        type === "select"
          ? Array.from(el.options)
              .map((o) => o.value)
              .filter((v) => v)
          : null;
      fields.push({
        id,
        label: labelText,
        type,
        required: el.hasAttribute("required"),
        selector,
        options,
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        placeholder: el.placeholder || null,
      });
    }

    // Follow label[for] → input/textarea/select
    document.querySelectorAll("label[for]").forEach((label) => {
      const el = document.getElementById(label.htmlFor);
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
        addField(el, label.textContent.trim());
      }
    });

    // Inputs/textareas without labels (find closest label in parent)
    document
      .querySelectorAll(
        "input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select",
      )
      .forEach((el) => {
        if (seen.has(el)) return;
        const closestLabel = el
          .closest("div, fieldset, .field, .form-group")
          ?.querySelector("label");
        const labelText =
          closestLabel?.textContent?.trim() ||
          el.placeholder ||
          el.name ||
          el.id;
        if (labelText) addField(el, labelText);
      });

    return fields;
  });
}
```

- [ ] **Step 7: Run to verify tests pass**

```bash
node test-fill-form.mjs
```

Expected: all previous tests + Playwright extraction tests passing.

- [ ] **Step 8: Commit**

```bash
git add lib/ats-detect.mjs lib/form-extractor.mjs lib/ats/greenhouse.mjs lib/ats/generic.mjs test/fixtures/greenhouse-form.html test-fill-form.mjs
git commit -m "feat: add form extractor — Greenhouse + generic ATS adapters"
```

---

## Task 5: Ashby and Lever Adapters

**Files:**

- Create: `lib/ats/ashby.mjs`
- Create: `lib/ats/lever.mjs`
- Create: `test/fixtures/ashby-form.html`
- Create: `test/fixtures/lever-form.html`

- [ ] **Step 1: Create `test/fixtures/ashby-form.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Ashby Test Fixture</title>
  </head>
  <body>
    <form>
      <div data-testid="question-name">
        <label for="ashby_name">Full Name *</label
        ><input type="text" id="ashby_name" required />
      </div>
      <div data-testid="question-email">
        <label for="ashby_email">Email *</label
        ><input type="email" id="ashby_email" required />
      </div>
      <div data-testid="question-phone">
        <label for="ashby_phone">Phone</label
        ><input type="tel" id="ashby_phone" />
      </div>
      <div data-testid="question-resume">
        <label>Resume *</label><input type="file" accept=".pdf" required />
      </div>
      <div data-testid="question-linkedin">
        <label for="ashby_linkedin">LinkedIn Profile</label
        ><input type="url" id="ashby_linkedin" />
      </div>
      <div data-testid="question-custom">
        <label for="ashby_q1">What motivates you?</label
        ><textarea id="ashby_q1"></textarea>
      </div>
      <button type="submit">Submit</button>
    </form>
  </body>
</html>
```

- [ ] **Step 2: Create `test/fixtures/lever-form.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Lever Test Fixture</title>
  </head>
  <body>
    <form class="application-form">
      <div class="application-field">
        <label for="lever_name">Full Name *</label
        ><input type="text" id="lever_name" name="name" required />
      </div>
      <div class="application-field">
        <label for="lever_email">Email *</label
        ><input type="email" id="lever_email" name="email" required />
      </div>
      <div class="application-field">
        <label for="lever_phone">Phone</label
        ><input type="tel" id="lever_phone" name="phone" />
      </div>
      <div class="application-field">
        <label>Resume *</label><input type="file" name="resume" required />
      </div>
      <div class="application-field">
        <label for="lever_q1">Why this role?</label
        ><textarea id="lever_q1" name="question[1]"></textarea>
      </div>
      <button type="submit">Submit Application</button>
    </form>
  </body>
</html>
```

- [ ] **Step 3: Implement `lib/ats/ashby.mjs`**

```javascript
export async function extractAshbyFields(page) {
  return page.evaluate(() => {
    const fields = [];
    const seen = new Set();

    document
      .querySelectorAll(
        '[data-testid^="question-"], .ashby-application-form .field, div:has(> label)',
      )
      .forEach((container) => {
        const label = container.querySelector("label");
        const input = container.querySelector("input, textarea, select");
        if (!label || !input || seen.has(input)) return;
        seen.add(input);

        const id = input.id || input.name || `ashby_${fields.length}`;
        const type =
          input.tagName === "TEXTAREA"
            ? "textarea"
            : input.tagName === "SELECT"
              ? "select"
              : input.type || "text";
        const options =
          type === "select"
            ? Array.from(input.options)
                .map((o) => o.value)
                .filter((v) => v)
            : null;

        fields.push({
          id,
          label: label.textContent.trim(),
          type,
          required: input.hasAttribute("required"),
          selector: input.id ? `#${input.id}` : `[name='${input.name}']`,
          options,
          maxLength: input.maxLength > 0 ? input.maxLength : null,
          placeholder: input.placeholder || null,
        });
      });

    return fields;
  });
}
```

- [ ] **Step 4: Implement `lib/ats/lever.mjs`**

```javascript
export async function extractLeverFields(page) {
  return page.evaluate(() => {
    const fields = [];
    const seen = new Set();

    document
      .querySelectorAll(".application-field, .field, div:has(> label)")
      .forEach((container) => {
        const label = container.querySelector("label");
        const input = container.querySelector("input, textarea, select");
        if (!label || !input || seen.has(input)) return;
        seen.add(input);

        const id = input.id || input.name || `lever_${fields.length}`;
        const type =
          input.tagName === "TEXTAREA"
            ? "textarea"
            : input.tagName === "SELECT"
              ? "select"
              : input.type || "text";
        const options =
          type === "select"
            ? Array.from(input.options)
                .map((o) => o.value)
                .filter((v) => v)
            : null;

        fields.push({
          id,
          label: label.textContent.trim(),
          type,
          required: input.hasAttribute("required"),
          selector: input.id ? `#${input.id}` : `[name='${input.name}']`,
          options,
          maxLength: input.maxLength > 0 ? input.maxLength : null,
          placeholder: input.placeholder || null,
        });
      });

    return fields;
  });
}
```

- [ ] **Step 5: Add Ashby + Lever tests to `test-fill-form.mjs`**

Append before the results line:

```javascript
console.log("4. Ashby + Lever extraction (Playwright)");

const { chromium: cr2 } = await import("playwright");
const { extractFields: ef2 } = await import("./lib/form-extractor.mjs");
const path2 = await import("path");
const { fileURLToPath: ftu2 } = await import("url");
const rootDir2 = path2.default.dirname(ftu2(import.meta.url));

for (const [platform, fixture] of [
  ["ashby", "ashby-form.html"],
  ["lever", "lever-form.html"],
]) {
  try {
    const fixtureUrl = `file://${path2.default.join(rootDir2, "test/fixtures", fixture)}`;
    const browser = await cr2.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(fixtureUrl);
    const result = await ef2(
      page,
      `https://jobs.${platform === "ashby" ? "ashbyhq" : "lever"}.co/test/123`,
    );
    await browser.close();

    try {
      assert.ok(result.fields.length >= 4);
      pass(`${platform}: extracted ${result.fields.length} fields`);
    } catch (e) {
      fail(`${platform}: field count`, e);
    }

    const fileField = result.fields.find((f) => f.type === "file");
    try {
      assert.ok(fileField);
      pass(`${platform}: found file upload`);
    } catch (e) {
      fail(`${platform}: file field`, e);
    }
  } catch (e) {
    fail(`${platform} extraction`, e);
  }
}
```

- [ ] **Step 6: Run to verify tests pass**

```bash
node test-fill-form.mjs
```

Expected: all tests passing including Ashby and Lever.

- [ ] **Step 7: Commit**

```bash
git add lib/ats/ashby.mjs lib/ats/lever.mjs test/fixtures/ashby-form.html test/fixtures/lever-form.html test-fill-form.mjs
git commit -m "feat: add Ashby and Lever form extractors"
```

---

## Task 6: Field Filler (`lib/field-filler.mjs`)

**Files:**

- Create: `lib/field-filler.mjs`
- Modify: `test-fill-form.mjs`

- [ ] **Step 1: Add failing test to `test-fill-form.mjs`**

Append before the results line:

```javascript
console.log("5. Field filler (Playwright)");

try {
  const { chromium: cr3 } = await import("playwright");
  const { fillFields } = await import("./lib/field-filler.mjs");
  const path3 = await import("path");
  const { fileURLToPath: ftu3 } = await import("url");
  const rootDir3 = path3.default.dirname(ftu3(import.meta.url));

  const fixtureUrl = `file://${path3.default.join(rootDir3, "test/fixtures/greenhouse-form.html")}`;
  const browser = await cr3.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(fixtureUrl);

  const answers = [
    {
      id: "first_name",
      selector: "#first_name",
      type: "text",
      value: "Christopher",
    },
    { id: "last_name", selector: "#last_name", type: "text", value: "Rehm" },
    { id: "email", selector: "#email", type: "email", value: "test@test.com" },
    {
      id: "cover_letter",
      selector: "#cover_letter",
      type: "textarea",
      value: "Hello world",
    },
    {
      id: "hear_about",
      selector: "#hear_about",
      type: "select",
      value: "linkedin",
    },
  ];

  const result = await fillFields(page, answers);

  const firstNameVal = await page.$eval("#first_name", (el) => el.value);
  const coverLetterVal = await page.$eval("#cover_letter", (el) => el.value);
  const selectVal = await page.$eval("#hear_about", (el) => el.value);

  await browser.close();

  try {
    assert.equal(firstNameVal, "Christopher");
    pass("text field filled correctly");
  } catch (e) {
    fail("text field value", e);
  }
  try {
    assert.equal(coverLetterVal, "Hello world");
    pass("textarea filled correctly");
  } catch (e) {
    fail("textarea value", e);
  }
  try {
    assert.equal(selectVal, "linkedin");
    pass("select field set correctly");
  } catch (e) {
    fail("select value", e);
  }
  try {
    assert.ok(result.filled >= 4);
    pass(`filled ${result.filled} fields`);
  } catch (e) {
    fail("filled count", e);
  }
  try {
    assert.equal(result.errors.length, 0);
    pass("zero fill errors");
  } catch (e) {
    fail("fill errors", e);
  }
} catch (e) {
  fail("field filler test", e);
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
node test-fill-form.mjs
```

Expected: `❌ field filler test: Cannot find module './lib/field-filler.mjs'`

- [ ] **Step 3: Implement `lib/field-filler.mjs`**

```javascript
/**
 * Fills form fields on a Playwright page from an answers array.
 * File inputs are skipped (require special setInputFiles handling in the caller).
 * Returns { filled: number, errors: string[] }.
 */

export async function fillFields(page, answers) {
  let filled = 0;
  const errors = [];

  for (const answer of answers) {
    if (answer.type === "file") continue; // handled separately by fill-cmd.mjs

    try {
      const el = await page.locator(answer.selector).first();
      const count = await page.locator(answer.selector).count();
      if (count === 0) {
        errors.push(
          `Selector not found: ${answer.selector} (id: ${answer.id})`,
        );
        continue;
      }

      switch (answer.type) {
        case "select":
          await page.selectOption(answer.selector, { value: answer.value });
          break;
        case "radio":
        case "checkbox":
          if (answer.value === "true" || answer.value === true) {
            await page.check(answer.selector);
          } else {
            await page.uncheck(answer.selector).catch(() => {}); // may not support uncheck
          }
          break;
        case "text":
        case "email":
        case "tel":
        case "url":
        case "number":
        case "textarea":
        default:
          await page.fill(answer.selector, String(answer.value));
          break;
      }
      filled++;
    } catch (err) {
      errors.push(
        `Failed to fill ${answer.id} (${answer.selector}): ${err.message}`,
      );
    }
  }

  return { filled, errors };
}

/**
 * Uploads a file to a file input field.
 * Separate from fillFields because setInputFiles works differently.
 */
export async function uploadFile(page, selector, filePath) {
  const count = await page.locator(selector).count();
  if (count === 0) throw new Error(`File input not found: ${selector}`);
  await page.setInputFiles(selector, filePath);
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
node test-fill-form.mjs
```

Expected: all tests passing including field filler.

- [ ] **Step 5: Commit**

```bash
git add lib/field-filler.mjs test-fill-form.mjs
git commit -m "feat: add field filler — fills text/textarea/select/radio/checkbox from answers JSON"
```

---

## Task 7: Extract Subcommand (`lib/extract-cmd.mjs`)

**Files:**

- Create: `lib/extract-cmd.mjs`

- [ ] **Step 1: Implement `lib/extract-cmd.mjs`**

```javascript
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ROOT, urlHash } from "../fill-form.mjs";
import { extractFields } from "./form-extractor.mjs";

export async function runExtract(url) {
  const hash = urlHash(url);
  const outputDir = join(ROOT, "output");
  mkdirSync(outputDir, { recursive: true });

  console.log(`Extracting form fields from: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch (e) {
    console.error(`Navigation failed: ${e.message}`);
    await browser.close();
    process.exit(1);
  }

  const screenshotPath = join(outputDir, `form-fields-${hash}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = await extractFields(page, url);
  result.screenshotPath = screenshotPath;

  await browser.close();

  const fieldsPath = join(outputDir, `form-fields-${hash}.json`);
  writeFileSync(fieldsPath, JSON.stringify(result, null, 2));

  console.log(`\nExtracted ${result.fields.length} fields`);
  console.log(`Platform: ${result.platform}`);
  console.log(`Has next page: ${result.hasNextPage}`);
  console.log(`\nFields saved to: ${fieldsPath}`);
  console.log(`Screenshot saved to: ${screenshotPath}`);
  console.log("\nFields:");
  for (const f of result.fields) {
    const req = f.required ? " *" : "";
    const opts = f.options
      ? ` [${f.options.slice(0, 3).join("|")}${f.options.length > 3 ? "..." : ""}]`
      : "";
    console.log(`  ${f.type.padEnd(10)} ${f.label}${req}${opts}`);
  }
  console.log(
    `\nNext: generate answers JSON and run:\n  node fill-form.mjs fill "${url}" --answers output/form-answers-${hash}.json`,
  );
}
```

- [ ] **Step 2: Test against a live Greenhouse posting**

Use any known-good Greenhouse URL from the pipeline. For example:

```bash
node fill-form.mjs extract https://job-boards.greenhouse.io/anthropic/jobs/4020305008
```

Expected:

- Outputs `output/form-fields-<hash>.json`
- Outputs `output/form-fields-<hash>.png`
- Prints field list to stdout

- [ ] **Step 3: Commit**

```bash
git add lib/extract-cmd.mjs
git commit -m "feat: add extract subcommand — headless field extraction to output/form-fields-*.json"
```

---

## Task 8: Fill Subcommand (`lib/fill-cmd.mjs`)

**Files:**

- Create: `lib/fill-cmd.mjs`

- [ ] **Step 1: Implement `lib/fill-cmd.mjs`**

```javascript
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ROOT, urlHash } from "../fill-form.mjs";
import { fillFields, uploadFile } from "./field-filler.mjs";

export async function runFill(url, answersPath) {
  const hash = urlHash(url);
  const outputDir = join(ROOT, "output");
  mkdirSync(outputDir, { recursive: true });

  let answers;
  try {
    answers = JSON.parse(readFileSync(answersPath, "utf-8")).answers;
  } catch (e) {
    console.error(`Could not read answers file: ${answersPath}\n${e.message}`);
    process.exit(1);
  }

  console.log(`Opening form: ${url}`);
  console.log(`Filling ${answers.length} fields from: ${answersPath}`);
  console.log(
    "\nBrowser will stay open for review. Submit manually, then close the browser or press Ctrl+C here.\n",
  );

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch (e) {
    console.error(`Navigation failed: ${e.message}`);
    await browser.close();
    process.exit(1);
  }

  // Fill text/textarea/select/radio/checkbox fields
  const { filled, errors } = await fillFields(page, answers);

  // Handle file uploads separately
  for (const answer of answers) {
    if (answer.type !== "file") continue;
    const filePath = join(ROOT, answer.value);
    try {
      await uploadFile(page, answer.selector, filePath);
      console.log(`  Uploaded: ${answer.value} → ${answer.selector}`);
    } catch (e) {
      errors.push(`File upload failed for ${answer.id}: ${e.message}`);
    }
  }

  // Screenshot after fill
  const screenshotPath = join(outputDir, `form-filled-${hash}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`\nFilled ${filled} fields`);
  if (errors.length > 0) {
    console.log(`\nWarnings (${errors.length}):`);
    errors.forEach((e) => console.log(`  ⚠️  ${e}`));
  }
  console.log(`\nScreenshot saved: ${screenshotPath}`);
  console.log(
    "\nBrowser is open. Review the form, make any manual adjustments, then submit.",
  );
  console.log("Press Ctrl+C here when done.\n");

  // Keep process alive until user presses Ctrl+C
  await new Promise((resolve) => {
    process.on("SIGINT", resolve);
    process.on("SIGTERM", resolve);
  });

  await browser.close();
  console.log("Done.");
}
```

- [ ] **Step 2: Smoke test the fill command with the fixture (manual)**

```bash
# First, create a minimal answers JSON
cat > /tmp/test-answers.json << 'EOF'
{
  "url": "file:///tmp/test.html",
  "platform": "generic",
  "answers": [
    { "id": "first_name", "selector": "#first_name", "type": "text", "value": "Christopher" },
    { "id": "last_name",  "selector": "#last_name",  "type": "text", "value": "Rehm" },
    { "id": "email",      "selector": "#email",      "type": "email", "value": "car2187bus@pm.me" }
  ]
}
EOF

# Run against the test fixture (headful - opens a real browser)
node fill-form.mjs fill "file://$(pwd)/test/fixtures/greenhouse-form.html" --answers /tmp/test-answers.json
```

Expected: browser opens, fields are filled, screenshot saved to `output/form-filled-<hash>.png`.

- [ ] **Step 3: Commit**

```bash
git add lib/fill-cmd.mjs
git commit -m "feat: add fill subcommand — headful form fill with browser-open review pause"
```

---

## Task 9: Apply Mode Update

**Files:**

- Modify: `modes/apply.md`

- [ ] **Step 1: Add auto-fill section to `modes/apply.md`**

Open `modes/apply.md` and append after the final `## Scroll handling` section:

````markdown
## Auto-fill mode (Phase 2 — faster workflow)

When the candidate says "auto-fill" or "fill the form for me" instead of the default copy-paste flow:

### Step A — Extract fields

```bash
node fill-form.mjs extract <URL>
```
````

This saves `output/form-fields-<hash>.json` and a screenshot. Read both and show the candidate:

- Which platform was detected
- How many fields were found
- Any warnings (login required, CAPTCHA, etc.)

### Step B — Generate answers JSON

Read `output/form-fields-<hash>.json` + `cv.md` + `config/profile.yml` + matching report.
For each field, generate the answer following the same rules as Step 5 above (proof points, STAR stories, etc.).
Write `output/form-answers-<hash>.json` matching this schema:

```json
{
  "url": "<same URL>",
  "platform": "<detected platform>",
  "answers": [
    {
      "id": "<field id>",
      "selector": "<CSS selector>",
      "type": "<field type>",
      "value": "<answer>"
    }
  ]
}
```

For file fields (resume), set `"value"` to the path of the most recent PDF in `output/` for this company, or generate one first with `/career-ops pdf`.

Show the answers to the candidate for review before running the fill command.

### Step C — Fill the form

```bash
node fill-form.mjs fill <URL> --answers output/form-answers-<hash>.json
```

This opens a visible browser, fills all fields, takes a screenshot, and keeps the browser open.
The candidate reviews in the browser and submits manually.

### Modification flow

If the candidate wants to change an answer: update `output/form-answers-<hash>.json`, then rerun Step C. The browser relaunches and re-fills.

````

- [ ] **Step 2: Verify apply.md is valid markdown**

```bash
node -e "const s = require('fs').readFileSync('modes/apply.md', 'utf-8'); console.log('lines:', s.split('\n').length)"
````

- [ ] **Step 3: Commit**

```bash
git add modes/apply.md
git commit -m "docs: add auto-fill workflow to apply mode"
```

---

## Task 10: End-to-End Smoke Test

**Files:**

- No new files — manual verification

- [ ] **Step 1: Run the full test suite**

```bash
node test-fill-form.mjs
```

Expected: all unit + integration tests passing, 0 failed.

- [ ] **Step 2: Run the system health check**

```bash
node test-all.mjs --quick
```

Expected: no regressions in existing tests.

- [ ] **Step 3: End-to-end smoke test against a live Greenhouse URL**

Pick an open job from `data/applications.md` with status `Evaluated` and a Greenhouse URL.

```bash
# Extract
node fill-form.mjs extract <GREENHOUSE_URL>
# Review output/form-fields-<hash>.json and output/form-fields-<hash>.png
# Generate answers JSON (Claude does this step in the conversation)
# Fill
node fill-form.mjs fill <GREENHOUSE_URL> --answers output/form-answers-<hash>.json
```

Verify:

- [ ] Browser opens
- [ ] Name, email, phone fields are pre-filled correctly
- [ ] Textarea questions have sensible answers
- [ ] Screenshot saved to `output/form-filled-<hash>.png`
- [ ] Browser stays open after fill completes
- [ ] Ctrl+C exits cleanly

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: form auto-fill complete — extract + fill + apply mode integration"
```

---

## Known Limitations (V1)

- **Multi-page forms**: `extract` only reads page 1. Multi-page Workday/SuccessFactors forms are not supported. Workaround: run `/career-ops apply` (manual mode) for those.
- **Login-gated forms**: Script cannot log in. If the URL requires auth, the form will be empty or redirect. Workaround: log in first in a regular browser, then use Playwright's `--storage-state` option (future enhancement).
- **CAPTCHA**: Cannot bypass. If encountered, falls back gracefully — the browser stays open for manual completion.
- **iFrame-embedded forms**: Some career sites embed the ATS in an iFrame. The extractor may miss fields. Generic fallback will attempt to find them.
- **Workday / SAP SuccessFactors**: Not supported in V1. Both use heavy React/Angular SPA patterns requiring platform-specific adapters (future task).

---

## Commit History (expected)

```
feat: add fill-form.mjs CLI skeleton and lib/ structure
feat: add ATS platform detection
feat: add profile loader — reads config/profile.yml into normalized object
feat: add form extractor — Greenhouse + generic ATS adapters
feat: add Ashby and Lever form extractors
feat: add field filler — fills text/textarea/select/radio/checkbox from answers JSON
feat: add extract subcommand — headless field extraction to output/form-fields-*.json
feat: add fill subcommand — headful form fill with browser-open review pause
docs: add auto-fill workflow to apply mode
feat: form auto-fill complete — extract + fill + apply mode integration
```
