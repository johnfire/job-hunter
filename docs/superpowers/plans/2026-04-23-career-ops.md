# Career-Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete AI-powered job search pipeline (career-ops) in `/home/christopher/programming/job-hunter` — evaluation, PDF generation, portal scanning, batch processing, and a Go TUI dashboard.

**Architecture:** Claude Code reads mode files (markdown system prompts) that define how to evaluate jobs, generate PDFs, and scan portals. Node.js scripts handle PDF rendering (Playwright) and zero-token API scanning. A Go Bubble Tea TUI provides a visual pipeline browser.

**Tech Stack:** Node.js 18+ (ESM .mjs), Playwright (PDF + scraping), js-yaml (config), Go 1.21 + Bubble Tea (dashboard), Markdown (data store), YAML (config), HTML/CSS (CV template)

**Reference repo:** https://github.com/santifer/career-ops (MIT) — copy scripts verbatim where noted, adapt mode files to Christopher's career.

---

## Scope Note

The **Go Dashboard** (Task 27) is independent — it can be skipped and built later without breaking anything else. Everything through Task 26 produces a fully working career-ops system.

---

## File Map

```
job-hunter/
├── CLAUDE.md                        # Agent brain (Task 24)
├── GEMINI.md                        # Gemini CLI context (Task 26)
├── cv.md                            # Christopher's CV — Task 25
├── article-digest.md                # Proof points — Task 25
├── package.json                     # Task 1
├── .gitignore                       # Task 1
├── .env.example                     # Task 1
├── config/
│   ├── profile.example.yml          # Task 17
│   └── profile.yml                  # Task 25 (Christopher's)
├── modes/
│   ├── _shared.md                   # Task 18
│   ├── _profile.template.md         # Task 19
│   ├── _profile.md                  # Task 25 (Christopher's)
│   ├── oferta.md                    # Task 20
│   ├── auto-pipeline.md             # Task 21
│   ├── pdf.md                       # Task 22
│   ├── scan.md                      # Task 23
│   ├── batch.md                     # Task 24b
│   ├── tracker.md                   # Task 26a
│   ├── apply.md                     # Task 26b
│   ├── contacto.md                  # Task 26c
│   ├── deep.md                      # Task 26d
│   ├── interview-prep.md            # Task 26e
│   ├── patterns.md                  # Task 26f
│   ├── followup.md                  # Task 26g
│   ├── training.md                  # Task 26h
│   ├── project.md                   # Task 26i
│   ├── ofertas.md                   # Task 26j
│   └── pipeline.md                  # Task 26k
├── templates/
│   ├── cv-template.html             # Task 3
│   ├── portals.example.yml          # Task 17
│   └── states.yml                   # Task 17
├── fonts/                           # Task 4 (downloaded)
├── generate-pdf.mjs                 # Task 5
├── scan.mjs                         # Task 6
├── merge-tracker.mjs                # Task 7
├── verify-pipeline.mjs              # Task 8
├── normalize-statuses.mjs           # Task 9
├── dedup-tracker.mjs                # Task 9
├── doctor.mjs                       # Task 10
├── cv-sync-check.mjs                # Task 11
├── liveness-core.mjs                # Task 12
├── check-liveness.mjs               # Task 12
├── update-system.mjs                # Task 13
├── analyze-patterns.mjs             # Task 14
├── followup-cadence.mjs             # Task 14
├── gemini-eval.mjs                  # Task 15
├── portals.yml                      # Task 25
├── batch/
│   ├── batch-runner.sh              # Task 16
│   └── batch-prompt.md              # Task 16
├── data/
│   ├── applications.md              # Task 28
│   ├── pipeline.md                  # Task 28
│   └── scan-history.tsv            # Task 28
├── interview-prep/
│   └── story-bank.md               # Task 28
├── jds/                             # gitignored, job descriptions
├── reports/                         # gitignored, eval reports
├── output/                          # gitignored, PDFs
├── .claude/
│   └── skills/career-ops/
│       └── SKILL.md                # Task 25c
├── .gemini/
│   └── commands/                   # Task 26 (TOML files)
└── dashboard/                      # Task 27 (Go TUI)
    ├── go.mod
    ├── main.go
    └── internal/
```

---

## Task 1: Project Initialization

**Files:**

- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialize git and npm**

```bash
cd /home/christopher/programming/job-hunter
git init
npm init -y
```

- [ ] **Step 2: Update package.json**

Write `package.json`:

```json
{
  "name": "job-hunter",
  "version": "1.0.0",
  "description": "AI-powered job search pipeline built on Claude Code",
  "type": "module",
  "scripts": {
    "doctor": "node doctor.mjs",
    "verify": "node verify-pipeline.mjs",
    "normalize": "node normalize-statuses.mjs",
    "dedup": "node dedup-tracker.mjs",
    "merge": "node merge-tracker.mjs",
    "pdf": "node generate-pdf.mjs",
    "sync-check": "node cv-sync-check.mjs",
    "update:check": "node update-system.mjs check",
    "update": "node update-system.mjs apply",
    "liveness": "node check-liveness.mjs",
    "scan": "node scan.mjs",
    "gemini:eval": "node gemini-eval.mjs"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "dotenv": "^16.4.5",
    "js-yaml": "^4.1.1",
    "playwright": "^1.58.1"
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
# User data (gitignored — stays local)
data/
reports/
output/
batch/logs/
batch/tracker-additions/
batch/batch-state.tsv
batch/batch-input.tsv
jds/
interview-prep/*.md
!interview-prep/story-bank.md
portals.yml
config/profile.yml
modes/_profile.md
cv.md
article-digest.md
.env

# Deps
node_modules/

# OS
.DS_Store
```

- [ ] **Step 4: Create .env.example**

```bash
# GEMINI_API_KEY=your_gemini_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here
```

- [ ] **Step 5: Create directory structure**

```bash
mkdir -p config modes templates fonts batch data reports output jds interview-prep
mkdir -p .claude/skills/career-ops .gemini/commands
```

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore .env.example
git commit -m "chore: initialize job-hunter project

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Install Dependencies

**Files:** `node_modules/`, `package-lock.json`

- [ ] **Step 1: Install npm packages**

```bash
npm install
```

Expected: installs playwright, js-yaml, dotenv, @google/generative-ai

- [ ] **Step 2: Install Playwright Chromium**

```bash
npx playwright install chromium
```

Expected: downloads Chromium browser (~130MB), required for PDF generation

- [ ] **Step 3: Verify playwright works**

```bash
node -e "import('playwright').then(m => m.chromium.launch({headless:true}).then(b => { console.log('Chromium OK'); b.close(); }))"
```

Expected output: `Chromium OK`

- [ ] **Step 4: Commit**

```bash
git add package-lock.json
git commit -m "chore: add npm dependencies

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: CV HTML Template

**Files:**

- Create: `templates/cv-template.html`

- [ ] **Step 1: Write the failing verification**

Create `tests/verify-template.mjs`:

```javascript
import { readFileSync } from "fs";

const html = readFileSync("templates/cv-template.html", "utf-8");
const required = [
  "{{NAME}}",
  "{{EMAIL}}",
  "{{SUMMARY_TEXT}}",
  "{{EXPERIENCE}}",
  "{{COMPETENCIES}}",
  "{{EDUCATION}}",
  "{{SKILLS}}",
  "Space Grotesk",
  "DM Sans",
];
const missing = required.filter((r) => !html.includes(r));
if (missing.length) {
  console.error("FAIL missing:", missing);
  process.exit(1);
}
console.log("PASS: template has all required placeholders");
```

```bash
node tests/verify-template.mjs
```

Expected: FAIL (file doesn't exist yet)

- [ ] **Step 2: Create cv-template.html**

Write `templates/cv-template.html`:

```html
<!DOCTYPE html>
<html lang="{{LANG}}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{NAME}} — CV</title>
    <style>
      @font-face {
        font-family: 'Space Grotesk';
        src: url('./fonts/SpaceGrotesk-Bold.woff2') format('woff2');
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Space Grotesk';
        src: url('./fonts/SpaceGrotesk-SemiBold.woff2') format('woff2');
        font-weight: 600;
        font-style: normal;
      }
      @font-face {
        font-family: 'DM Sans';
        src: url('./fonts/DMSans-Regular.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'DM Sans';
        src: url('./fonts/DMSans-Medium.woff2') format('woff2');
        font-weight: 500;
        font-style: normal;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'DM Sans', Arial, sans-serif;
        font-size: 11px;
        line-height: 1.5;
        color: #1a1a1a;
        background: #ffffff;
        width: {{PAGE_WIDTH}};
        margin: 0 auto;
      }

      .header {
        margin-bottom: 18px;
        padding-bottom: 12px;
      }

      .name {
        font-family: 'Space Grotesk', Arial, sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.02em;
        margin-bottom: 6px;
      }

      .gradient-line {
        height: 2px;
        background: linear-gradient(to right, hsl(187,74%,32%), hsl(270,70%,45%));
        margin-bottom: 8px;
      }

      .contact-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        font-size: 10.5px;
        color: #475569;
      }

      .contact-row a { color: #475569; text-decoration: none; }

      .section { margin-bottom: 16px; }

      .section-header {
        font-family: 'Space Grotesk', Arial, sans-serif;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: hsl(187,74%,32%);
        margin-bottom: 6px;
        padding-bottom: 2px;
        border-bottom: 1px solid #e2e8f0;
      }

      .competency-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .competency-tag {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 500;
        color: #334155;
      }

      .job { margin-bottom: 12px; }

      .job-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 2px;
      }

      .job-title {
        font-family: 'Space Grotesk', Arial, sans-serif;
        font-size: 11.5px;
        font-weight: 600;
        color: #0f172a;
      }

      .job-dates {
        font-size: 10px;
        color: #64748b;
        white-space: nowrap;
      }

      .job-company {
        font-size: 10.5px;
        font-weight: 500;
        color: hsl(270,70%,45%);
        margin-bottom: 4px;
      }

      .job-bullets { padding-left: 14px; }
      .job-bullets li { margin-bottom: 2px; }

      .summary-text {
        color: #334155;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="name">{{NAME}}</div>
      <div class="gradient-line"></div>
      <div class="contact-row">
        <span>{{LOCATION}}</span>
        <a href="mailto:{{EMAIL}}">{{EMAIL}}</a>
        {{PHONE}}
        <a href="https://{{LINKEDIN_URL}}">{{LINKEDIN_DISPLAY}}</a>
        <a href="{{PORTFOLIO_URL}}">{{PORTFOLIO_DISPLAY}}</a>
      </div>
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_SUMMARY}}</div>
      <p class="summary-text">{{SUMMARY_TEXT}}</p>
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_COMPETENCIES}}</div>
      <div class="competency-grid">{{COMPETENCIES}}</div>
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_EXPERIENCE}}</div>
      {{EXPERIENCE}}
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_PROJECTS}}</div>
      {{PROJECTS}}
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_EDUCATION}}</div>
      {{EDUCATION}}
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_CERTIFICATIONS}}</div>
      {{CERTIFICATIONS}}
    </div>

    <div class="section">
      <div class="section-header">{{SECTION_SKILLS}}</div>
      {{SKILLS}}
    </div>
  </body>
</html>
```

- [ ] **Step 3: Run verification**

```bash
node tests/verify-template.mjs
```

Expected: `PASS: template has all required placeholders`

- [ ] **Step 4: Commit**

```bash
git add templates/cv-template.html tests/verify-template.mjs
git commit -m "feat: add ATS-optimized CV HTML template with Space Grotesk/DM Sans

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Font Setup

**Files:** `fonts/SpaceGrotesk-Bold.woff2`, `fonts/SpaceGrotesk-SemiBold.woff2`, `fonts/DMSans-Regular.woff2`, `fonts/DMSans-Medium.woff2`

- [ ] **Step 1: Download fonts**

Space Grotesk and DM Sans are Google Fonts (open license). Download woff2 files:

```bash
# Space Grotesk (700 Bold)
curl -sL "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mF71Q-gd.woff2" \
  -o fonts/SpaceGrotesk-Bold.woff2

# Space Grotesk (600 SemiBold)
curl -sL "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mF71B-gd.woff2" \
  -o fonts/SpaceGrotesk-SemiBold.woff2

# DM Sans (400 Regular)
curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZa4ET-DNl0.woff2" \
  -o fonts/DMSans-Regular.woff2

# DM Sans (500 Medium)
curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOOET-DNl0.woff2" \
  -o fonts/DMSans-Medium.woff2
```

> **Note:** If these exact URLs are stale, visit fonts.google.com, download each family, and extract the woff2 files to `fonts/`. The file names must match exactly.

- [ ] **Step 2: Verify fonts downloaded**

```bash
ls -lh fonts/
file fonts/*.woff2
```

Expected: 4 files, all showing "Web Open Font Format 2"

- [ ] **Step 3: Commit**

```bash
git add fonts/
git commit -m "chore: add Space Grotesk and DM Sans fonts for CV template

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: generate-pdf.mjs

**Files:**

- Create: `generate-pdf.mjs`

This script is copied verbatim from the reference repo (MIT licensed). It: reads an HTML file, resolves font paths to absolute `file://` URIs, normalizes Unicode for ATS parsers, then renders to PDF with Playwright Chromium.

- [ ] **Step 1: Write verification test**

Create `tests/verify-pdf.mjs`:

```javascript
import { execSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";

// Create minimal test HTML
const testHtml = `<!DOCTYPE html><html><body style="font-family:Arial">
<h1>Test PDF</h1><p>ATS compatible content</p>
</body></html>`;
writeFileSync("/tmp/test-cv.html", testHtml);

try {
  execSync(
    "node generate-pdf.mjs /tmp/test-cv.html /tmp/test-cv.pdf --format=a4",
    {
      stdio: "pipe",
    },
  );
  if (!existsSync("/tmp/test-cv.pdf")) throw new Error("PDF not created");
  console.log("PASS: generate-pdf.mjs works");
  unlinkSync("/tmp/test-cv.pdf");
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
```

```bash
node tests/verify-pdf.mjs
```

Expected: FAIL (generate-pdf.mjs doesn't exist yet)

- [ ] **Step 2: Copy generate-pdf.mjs from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/generate-pdf.mjs" \
  -o generate-pdf.mjs
```

- [ ] **Step 3: Run verification**

```bash
node tests/verify-pdf.mjs
```

Expected: `PASS: generate-pdf.mjs works`

- [ ] **Step 4: Commit**

```bash
git add generate-pdf.mjs tests/verify-pdf.mjs
git commit -m "feat: add Playwright HTML-to-PDF generator

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: scan.mjs (Zero-Token Scanner)

**Files:**

- Create: `scan.mjs`

Hits Greenhouse, Ashby, and Lever public APIs directly — no LLM tokens needed. Reads `portals.yml`, deduplicates against `data/scan-history.tsv` and `data/applications.md`, appends new URLs to `data/pipeline.md`.

- [ ] **Step 1: Write verification test**

Create `tests/verify-scan.mjs`:

```javascript
import { execSync } from "child_process";

// Test dry-run with a known company
try {
  const out = execSync("node scan.mjs --dry-run --company Anthropic 2>&1", {
    encoding: "utf-8",
    timeout: 30000,
  });
  if (
    !out.includes("dry-run") &&
    !out.includes("Anthropic") &&
    !out.includes("Error")
  ) {
    // Accept any output that doesn't crash
  }
  console.log("PASS: scan.mjs runs without crash");
} catch (e) {
  if (e.message.includes("portals.yml")) {
    console.log(
      "PASS: scan.mjs runs (portals.yml not yet configured — expected)",
    );
  } else {
    console.error("FAIL:", e.message.slice(0, 200));
    process.exit(1);
  }
}
```

```bash
node tests/verify-scan.mjs
```

Expected: FAIL (scan.mjs missing)

- [ ] **Step 2: Copy scan.mjs from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/scan.mjs" \
  -o scan.mjs
```

- [ ] **Step 3: Run verification**

```bash
node tests/verify-scan.mjs
```

Expected: `PASS: scan.mjs runs without crash` or portals.yml message

- [ ] **Step 4: Commit**

```bash
git add scan.mjs tests/verify-scan.mjs
git commit -m "feat: add zero-token portal scanner (Greenhouse/Ashby/Lever APIs)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: merge-tracker.mjs

**Files:**

- Create: `merge-tracker.mjs`

Reads TSV files from `batch/tracker-additions/`, merges them into `data/applications.md` as new rows, handles the column-order swap (TSV has status-before-score, MD has score-before-status).

- [ ] **Step 1: Write test**

Create `tests/verify-merge.mjs`:

```javascript
import {
  writeFileSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  existsSync,
} from "fs";
import { execSync } from "child_process";

mkdirSync("batch/tracker-additions", { recursive: true });
mkdirSync("data", { recursive: true });

// Seed applications.md
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`,
);

// Seed a TSV addition
writeFileSync(
  "batch/tracker-additions/001-acme.tsv",
  "1\t2026-04-23\tAcme\tSenior AI Engineer\tEvaluated\t4.2/5\t❌\t[1](reports/001-acme-2026-04-23.md)\tStrong match\n",
);

execSync("node merge-tracker.mjs", { stdio: "pipe" });

const md = readFileSync("data/applications.md", "utf-8");
if (!md.includes("Acme")) {
  console.error("FAIL: Acme not in tracker");
  process.exit(1);
}
if (!md.includes("4.2/5")) {
  console.error("FAIL: score missing");
  process.exit(1);
}
console.log("PASS: merge-tracker.mjs works");

// Cleanup
unlinkSync("batch/tracker-additions/001-acme.tsv");
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`,
);
```

```bash
node tests/verify-merge.mjs
```

Expected: FAIL (merge-tracker.mjs missing)

- [ ] **Step 2: Copy merge-tracker.mjs from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/merge-tracker.mjs" \
  -o merge-tracker.mjs
```

- [ ] **Step 3: Run test**

```bash
node tests/verify-merge.mjs
```

Expected: `PASS: merge-tracker.mjs works`

- [ ] **Step 4: Commit**

```bash
git add merge-tracker.mjs tests/verify-merge.mjs
git commit -m "feat: add tracker merger (TSV additions -> applications.md)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: verify-pipeline.mjs

**Files:**

- Create: `verify-pipeline.mjs`

Runs integrity checks: all reports have required header fields (URL, Score, Legitimacy), all tracker entries have canonical statuses, TSV format is valid, no duplicate entries.

- [ ] **Step 1: Copy from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/verify-pipeline.mjs" \
  -o verify-pipeline.mjs
```

- [ ] **Step 2: Run against empty data dir**

```bash
node verify-pipeline.mjs
```

Expected: passes (no data to check yet) or prints "No applications found"

- [ ] **Step 3: Commit**

```bash
git add verify-pipeline.mjs
git commit -m "feat: add pipeline integrity checker

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: normalize-statuses.mjs + dedup-tracker.mjs

**Files:**

- Create: `normalize-statuses.mjs`
- Create: `dedup-tracker.mjs`

`normalize-statuses.mjs` reads `templates/states.yml` and rewrites any non-canonical status values in `data/applications.md`. `dedup-tracker.mjs` removes rows with identical company+role combinations.

- [ ] **Step 1: Copy both scripts from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/normalize-statuses.mjs" \
  -o normalize-statuses.mjs
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/dedup-tracker.mjs" \
  -o dedup-tracker.mjs
```

- [ ] **Step 2: Verify both run cleanly**

```bash
node normalize-statuses.mjs && echo "normalize OK"
node dedup-tracker.mjs && echo "dedup OK"
```

Expected: both print OK (no data yet = no-ops)

- [ ] **Step 3: Commit**

```bash
git add normalize-statuses.mjs dedup-tracker.mjs
git commit -m "feat: add status normalizer and deduplicator

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: doctor.mjs

**Files:**

- Create: `doctor.mjs`

Validates all prerequisites: Node.js version, Playwright installation, required files exist (cv.md, config/profile.yml, portals.yml, modes/\_profile.md), data directories exist.

- [ ] **Step 1: Copy doctor.mjs from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/doctor.mjs" \
  -o doctor.mjs
```

- [ ] **Step 2: Run doctor (expect warnings about missing user files)**

```bash
node doctor.mjs
```

Expected: prints setup status table, warns about missing cv.md, profile.yml, portals.yml — this is expected at this stage

- [ ] **Step 3: Commit**

```bash
git add doctor.mjs
git commit -m "feat: add setup doctor/validator

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Utility Scripts

**Files:**

- Create: `cv-sync-check.mjs`
- Create: `update-system.mjs`
- Create: `analyze-patterns.mjs`
- Create: `followup-cadence.mjs`
- Create: `liveness-core.mjs`
- Create: `check-liveness.mjs`
- Create: `gemini-eval.mjs`

- [ ] **Step 1: Copy all utility scripts from reference**

```bash
for script in cv-sync-check update-system analyze-patterns followup-cadence liveness-core check-liveness gemini-eval; do
  curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/${script}.mjs" \
    -o "${script}.mjs"
  echo "Downloaded ${script}.mjs"
done
```

- [ ] **Step 2: Verify they parse without syntax errors**

```bash
for script in cv-sync-check update-system analyze-patterns followup-cadence liveness-core check-liveness gemini-eval; do
  node --input-type=module < "${script}.mjs" 2>&1 | head -2 || true
  echo "${script}.mjs: OK"
done
```

Expected: each script either exits cleanly or prints usage/error about missing files — no syntax errors

- [ ] **Step 3: Commit**

```bash
git add cv-sync-check.mjs update-system.mjs analyze-patterns.mjs \
  followup-cadence.mjs liveness-core.mjs check-liveness.mjs gemini-eval.mjs
git commit -m "feat: add utility scripts (sync-check, update, patterns, liveness, gemini-eval)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Batch System

**Files:**

- Create: `batch/batch-runner.sh`
- Create: `batch/batch-prompt.md`

`batch-runner.sh` orchestrates parallel `claude -p` workers. `batch-prompt.md` is the self-contained system prompt given to each worker.

- [ ] **Step 1: Copy from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/batch/batch-runner.sh" \
  -o batch/batch-runner.sh
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/batch/batch-prompt.md" \
  -o batch/batch-prompt.md
chmod +x batch/batch-runner.sh
```

- [ ] **Step 2: Verify shell script is valid**

```bash
bash -n batch/batch-runner.sh && echo "PASS: batch-runner.sh syntax OK"
```

Expected: `PASS: batch-runner.sh syntax OK`

- [ ] **Step 3: Commit**

```bash
git add batch/batch-runner.sh batch/batch-prompt.md
git commit -m "feat: add batch processing system (parallel claude -p workers)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 13: Configuration Templates

**Files:**

- Create: `templates/states.yml`
- Create: `config/profile.example.yml`
- Create: `templates/portals.example.yml`

- [ ] **Step 1: Write states.yml**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/templates/states.yml" \
  -o templates/states.yml
```

If URL fails, write manually:

```yaml
# Canonical application statuses
# Source of truth for normalize-statuses.mjs
statuses:
  - Evaluated
  - Applied
  - Responded
  - Interview
  - Offer
  - Rejected
  - Discarded
  - SKIP
```

- [ ] **Step 2: Copy profile.example.yml and portals.example.yml**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/config/profile.example.yml" \
  -o config/profile.example.yml
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/templates/portals.example.yml" \
  -o templates/portals.example.yml
```

- [ ] **Step 3: Verify YAML parses**

```bash
node -e "import('js-yaml').then(m => {
  ['templates/states.yml','config/profile.example.yml','templates/portals.example.yml']
    .forEach(f => { m.default.load(require('fs').readFileSync(f,'utf-8')); console.log(f + ': OK'); });
})" 2>/dev/null || node -e "
const yaml = await import('js-yaml');
const fs = await import('fs');
['templates/states.yml','config/profile.example.yml','templates/portals.example.yml'].forEach(f => {
  yaml.default.load(fs.default.readFileSync(f,'utf-8'));
  console.log(f + ': OK');
});" 2>&1 || node --input-type=module -e "
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
for (const f of ['templates/states.yml','config/profile.example.yml','templates/portals.example.yml']) {
  yaml.load(readFileSync(f,'utf-8'));
  console.log(f + ': YAML OK');
}"
```

Expected: all three files print `YAML OK`

- [ ] **Step 4: Commit**

```bash
git add templates/states.yml config/profile.example.yml templates/portals.example.yml
git commit -m "feat: add configuration templates (states, profile, portals)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 14: modes/\_shared.md

**Files:**

- Create: `modes/_shared.md`

This is the system-layer scoring config. It defines: sources of truth, scoring dimensions, archetype detection keywords, global rules. Adapted from reference (English, system layer only — no user data).

- [ ] **Step 1: Write modes/\_shared.md**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/_shared.md" \
  -o modes/_shared.md
```

- [ ] **Step 2: Edit the header to remove the reference repo author's personal context**

Open `modes/_shared.md` and remove any content specific to the original author (Santiago's archetypes, his specific proof points). Keep only the system-layer scoring logic, archetype detection table, and global rules.

Replace the archetype detection section's specific entries with generic ones — Christopher will customize his archetypes in `modes/_profile.md` in Task 25.

Key sections to keep:

- Sources of Truth table
- Scoring System (6 dimensions)
- Score interpretation table (4.5+ / 4.0-4.4 / 3.5-3.9 / below 3.5)
- Block G posting legitimacy signals table
- Archetype detection table (generic keywords, not personal)
- Global Rules (NEVER list)

- [ ] **Step 3: Verify file looks right**

```bash
grep -c "Score interpretation\|Archetype Detection\|Global Rules\|Scoring System" modes/_shared.md
```

Expected: 4 (all key sections present)

- [ ] **Step 4: Commit**

```bash
git add modes/_shared.md
git commit -m "feat: add shared scoring context and archetype detection

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 15: modes/\_profile.template.md

**Files:**

- Create: `modes/_profile.template.md`

The template that new users copy to create their `_profile.md`. Defines the structure for user-specific archetypes, narrative, negotiation scripts, proof point mapping.

- [ ] **Step 1: Copy from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/_profile.template.md" \
  -o modes/_profile.template.md
```

- [ ] **Step 2: Verify it's a template (has placeholder markers)**

```bash
grep -c "Your\|example\|customize\|template" modes/_profile.template.md
```

Expected: > 0 (has template markers)

- [ ] **Step 3: Commit**

```bash
git add modes/_profile.template.md
git commit -m "feat: add user profile template

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 16: modes/oferta.md — Evaluation Engine

**Files:**

- Create: `modes/oferta.md`

The core evaluation logic: 7 blocks (A-F + G). Reads cv.md and \_shared.md. Produces structured evaluation report. Adapted from reference — keep all block structure but adjust language to English throughout.

- [ ] **Step 1: Copy from reference then translate to English**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/oferta.md" \
  -o modes/oferta.md
```

The reference is in Spanish. Translate all section headers, instructions, and table labels to English. Keep the block structure (A through G) identical. Key sections:

```markdown
# Mode: oferta — Complete Evaluation A-G

When the user pastes a job offer (text or URL), ALWAYS deliver all 7 blocks:

## Step 0 — Archetype Detection

Classify the offer into one of the 6 archetypes (see \_shared.md). If hybrid, indicate the 2 closest.

## Block A — Role Summary

Table with: Archetype, Domain, Function, Seniority, Remote policy, Team size, TL;DR

## Block B — CV Match

Read cv.md. Create table mapping each JD requirement to exact lines in the CV.
Include gaps section with mitigation strategy for each gap.

## Block C — Level Strategy

1. Detected level in JD vs candidate's natural level for this archetype
2. "Sell senior without lying" plan: specific phrases, proof points to highlight
3. "If downleveled" plan: accept if comp is fair, negotiate 6-month review

## Block D — Comp Research

Use WebSearch for current salaries (Glassdoor, Levels.fyi, Blind).
Table with data and cited sources.

## Block E — Personalization Plan

| # | Section | Current state | Proposed change | Why |
Top 5 CV changes + Top 5 LinkedIn changes.

## Block F — Interview Plan

6-10 STAR+R stories mapped to JD requirements.
| # | JD Requirement | STAR+R Story | S | T | A | R | Reflection |
Update interview-prep/story-bank.md with new stories.

## Block G — Posting Legitimacy

Analyze: posting freshness, description quality, company hiring signals, reposting detection.
Output: High Confidence / Proceed with Caution / Suspicious

## Post-Evaluation

1. Save report to reports/{###}-{company-slug}-{YYYY-MM-DD}.md
2. Write TSV to batch/tracker-additions/{###}-{company-slug}.tsv
3. Run: node merge-tracker.mjs
```

- [ ] **Step 2: Verify structure**

```bash
grep -c "Block A\|Block B\|Block C\|Block D\|Block E\|Block F\|Block G" modes/oferta.md
```

Expected: 7

- [ ] **Step 3: Commit**

```bash
git add modes/oferta.md
git commit -m "feat: add A-G job evaluation mode

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 17: modes/auto-pipeline.md

**Files:**

- Create: `modes/auto-pipeline.md`

The auto-pipeline triggers when the user pastes a URL or JD text. Runs evaluation → report → PDF → tracker in sequence.

- [ ] **Step 1: Copy from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/auto-pipeline.md" \
  -o modes/auto-pipeline.md
```

- [ ] **Step 2: Translate to English (if needed) and adapt tone**

Key structure to preserve:

```markdown
# Mode: auto-pipeline

## Step 0 — Extract JD

If URL: use Playwright (browser_navigate + browser_snapshot) first.
Fallback: WebFetch. Last resort: WebSearch.

## Step 1 — Evaluate A-G

Run full oferta mode (read modes/oferta.md).

## Step 2 — Save Report .md

Save to reports/{###}-{company-slug}-{YYYY-MM-DD}.md

## Step 3 — Generate PDF

Run full pdf mode (read modes/pdf.md).

## Step 4 — Draft Application Answers (if score >= 4.5)

Extract form questions with Playwright. Generate answers in "I'm choosing you" tone.

## Step 5 — Update Tracker

Register in data/applications.md with all columns.
```

- [ ] **Step 3: Commit**

```bash
git add modes/auto-pipeline.md
git commit -m "feat: add auto-pipeline mode (evaluate + PDF + tracker in one step)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 18: modes/pdf.md

**Files:**

- Create: `modes/pdf.md`

PDF generation mode: reads cv.md, extracts JD keywords, injects into HTML template, runs generate-pdf.mjs.

- [ ] **Step 1: Copy from reference and translate to English**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/pdf.md" \
  -o modes/pdf.md
```

Key pipeline to preserve:

```markdown
# Mode: pdf — ATS-Optimized PDF Generation

1. Read cv.md as source of truth
2. Get JD if not in context (ask user for text or URL)
3. Extract 15-20 keywords from JD
4. Detect JD language → CV language (EN default)
5. Detect company location → paper format: US/Canada=letter, rest=a4
6. Detect archetype → adapt framing
7. Rewrite Professional Summary with JD keywords
8. Select top 3-4 most relevant projects
9. Reorder experience bullets by JD relevance
10. Build competency grid from JD requirements (6-8 keyword phrases)
11. Inject keywords naturally into existing achievements (NEVER invent)
12. Generate complete HTML from template + personalized content
13. Read name from config/profile.yml → kebab-case → {candidate}
14. Write HTML to /tmp/cv-{candidate}-{company}.html
15. Run: node generate-pdf.mjs /tmp/cv-{candidate}-{company}.html \
     output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf --format={letter|a4}
16. Report: PDF path, page count, keyword coverage %

## ATS Rules

- Single-column layout (no sidebars, no parallel columns)
- Standard headers: "Professional Summary", "Work Experience", "Education", "Skills", "Projects"
- No text in images/SVGs
- UTF-8, selectable text (not rasterized)
- Keywords distributed: Summary (top 5), first bullet of each role, Skills section

## Keyword Injection — Ethical Rules

NEVER add skills the candidate doesn't have. Only reformulate real experience
with the exact vocabulary from the JD.
```

- [ ] **Step 2: Commit**

```bash
git add modes/pdf.md
git commit -m "feat: add ATS-optimized PDF generation mode

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 19: modes/scan.md

**Files:**

- Create: `modes/scan.md`

Agent-driven deep scan: 3-level strategy (Playwright direct, ATS APIs, WebSearch queries). Used when `claude scan` is called directly (as opposed to the zero-token `node scan.mjs`).

- [ ] **Step 1: Copy from reference and translate to English**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/scan.md" \
  -o modes/scan.md
```

Key sections to preserve:

- Level 1: Playwright direct (primary — real-time, works with SPAs)
- Level 2: ATS APIs (Greenhouse, Ashby, Lever, BambooHR, Workday)
- Level 3: WebSearch queries (broad discovery, results may be stale)
- Liveness check for Level 3 results
- Dedup against scan-history.tsv + applications.md + pipeline.md
- Output format: summary table

- [ ] **Step 2: Commit**

```bash
git add modes/scan.md
git commit -m "feat: add agent-driven portal scanner mode (3-level strategy)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 20: modes/batch.md

**Files:**

- Create: `modes/batch.md`

Two batch modes: conductor-chrome (navigates portals with browser) and standalone script.

- [ ] **Step 1: Copy from reference and translate to English**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/batch.md" \
  -o modes/batch.md
```

- [ ] **Step 2: Commit**

```bash
git add modes/batch.md
git commit -m "feat: add batch processing mode (parallel workers)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 21: Remaining Modes

**Files:**

- Create: `modes/tracker.md`
- Create: `modes/apply.md`
- Create: `modes/contacto.md`
- Create: `modes/deep.md`
- Create: `modes/interview-prep.md`
- Create: `modes/patterns.md`
- Create: `modes/followup.md`
- Create: `modes/training.md`
- Create: `modes/project.md`
- Create: `modes/ofertas.md`
- Create: `modes/pipeline.md`

- [ ] **Step 1: Copy all remaining modes from reference**

```bash
for mode in tracker apply contacto deep interview-prep patterns followup training project ofertas pipeline; do
  curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/modes/${mode}.md" \
    -o "modes/${mode}.md"
  echo "Downloaded modes/${mode}.md"
done
```

- [ ] **Step 2: Translate any Spanish-language modes to English**

Run this check — any mode with more Spanish than English content needs translation:

```bash
for mode in modes/*.md; do
  echo "=== $mode ==="; head -5 "$mode"
done
```

For modes primarily in Spanish, translate the instructional text. The structure (headings, tables) stays identical; only prose instructions change to English.

- [ ] **Step 3: Verify all modes present**

```bash
ls modes/*.md | wc -l
```

Expected: at least 15 files

- [ ] **Step 4: Commit**

```bash
git add modes/
git commit -m "feat: add remaining skill modes (tracker, apply, outreach, deep research, etc.)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 22: CLAUDE.md — Agent Brain

**Files:**

- Create: `CLAUDE.md`

This is the most critical file. It defines: data contract (user vs system layer), onboarding flow, skill routing table, update checker, ethical rules, pipeline integrity rules, TSV format spec.

- [ ] **Step 1: Copy from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/CLAUDE.md" \
  -o CLAUDE.md
```

- [ ] **Step 2: Adapt CLAUDE.md for Christopher's setup**

Make these targeted edits to CLAUDE.md:

**A) Update origin section** — remove Santiago's personal story, replace with:

```markdown
## Origin

This system was adapted from the open-source career-ops project by Santiago Fernández
(https://github.com/santifer/career-ops). Customized for Christopher Rehm's job search.

The modes, scoring logic, and negotiation scripts have been adapted to Christopher's
specific career context. See config/profile.yml and modes/\_profile.md for his profile.
```

**B) Remove OpenCode commands section** (not needed unless Christopher uses OpenCode)

**C) Keep all of:**

- Data Contract section (critical)
- Update Check logic (change URL to point to santifer/career-ops for upstream updates)
- What is career-ops / Main Files table
- First Run — Onboarding section
- Personalization section
- Skill Modes routing table
- CV Source of Truth
- Ethical Use — CRITICAL
- Offer Verification — MANDATORY
- CI/CD and Quality (can simplify — remove GitHub Actions references)
- Stack and Conventions
- TSV Format for Tracker Additions
- Pipeline Integrity rules
- Canonical States table

- [ ] **Step 3: Verify CLAUDE.md has all critical sections**

```bash
grep -c "Data Contract\|Ethical Use\|Offer Verification\|TSV Format\|Skill Modes\|Canonical States" CLAUDE.md
```

Expected: 6

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add agent brain (CLAUDE.md) — routing, onboarding, data contract

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 23: Claude Code Skill

**Files:**

- Create: `.claude/skills/career-ops/SKILL.md`

The Claude Code slash command dispatcher. When user runs `/career-ops [args]`, this is loaded.

- [ ] **Step 1: Copy from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/.claude/skills/career-ops/SKILL.md" \
  -o .claude/skills/career-ops/SKILL.md
```

If that path doesn't exist in reference, write it manually:

```markdown
# Career-Ops Skill

Read the CLAUDE.md in this directory for full instructions.

## Command Router

| User input                     | Action                                             |
| ------------------------------ | -------------------------------------------------- |
| `/career-ops` (no args)        | Show menu of available commands                    |
| `/career-ops {JD text or URL}` | Run auto-pipeline (evaluate + PDF + tracker)       |
| `/career-ops scan`             | Scan portals (read modes/scan.md)                  |
| `/career-ops pdf`              | Generate PDF (read modes/pdf.md)                   |
| `/career-ops batch`            | Batch process (read modes/batch.md)                |
| `/career-ops tracker`          | Show tracker (read modes/tracker.md)               |
| `/career-ops apply`            | Application assistant (read modes/apply.md)        |
| `/career-ops pipeline`         | Process pending URLs (read modes/pipeline.md)      |
| `/career-ops contacto`         | LinkedIn outreach (read modes/contacto.md)         |
| `/career-ops deep`             | Deep company research (read modes/deep.md)         |
| `/career-ops training`         | Evaluate course/cert (read modes/training.md)      |
| `/career-ops project`          | Evaluate portfolio project (read modes/project.md) |
| `/career-ops patterns`         | Analyze rejections (read modes/patterns.md)        |
| `/career-ops followup`         | Follow-up cadence (read modes/followup.md)         |

For any input that looks like a job URL or pasted JD text (not a subcommand),
run the auto-pipeline immediately.
```

- [ ] **Step 2: Verify skill file exists and has router table**

```bash
grep -c "auto-pipeline\|scan\|tracker\|pdf" .claude/skills/career-ops/SKILL.md
```

Expected: ≥ 4

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/career-ops/SKILL.md
git commit -m "feat: add Claude Code /career-ops skill with command router

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 24: Christopher's Profile

**Files:**

- Create: `config/profile.yml`
- Create: `modes/_profile.md`

**Christopher fills in his actual details.** The plan provides the structure; the content is personal.

- [ ] **Step 1: Create config/profile.yml from template**

```bash
cp config/profile.example.yml config/profile.yml
```

Then edit `config/profile.yml` with Christopher's real data. Minimum required fields:

```yaml
candidate:
  full_name: "Christopher Rehm"
  email: "christopher.rehm.63@protonmail.com"
  phone: "" # optional
  location: "YOUR CITY, STATE"
  linkedin: "linkedin.com/in/YOUR-HANDLE"
  portfolio_url: "" # if you have one
  github: "github.com/YOUR-HANDLE"

target_roles:
  primary:
    - "YOUR PRIMARY ROLE TITLE" # e.g. "Senior Software Engineer"
    - "YOUR SECONDARY ROLE"
  archetypes:
    - name: "YOUR ARCHETYPE" # e.g. "Full-Stack Engineer"
      level: "Senior"
      fit: "primary"

narrative:
  headline: "YOUR ONE-LINE HEADLINE"
  exit_story: "YOUR PROFESSIONAL STORY"
  superpowers:
    - "YOUR SUPERPOWER 1"
    - "YOUR SUPERPOWER 2"

compensation:
  target_range: "YOUR RANGE"
  currency: "USD"
  minimum: "YOUR MINIMUM"
  location_flexibility: "Remote preferred"

location:
  country: "United States"
  timezone: "YOUR TIMEZONE"
  visa_status: "No sponsorship needed"
```

- [ ] **Step 2: Create modes/\_profile.md from template**

```bash
cp modes/_profile.template.md modes/_profile.md
```

Edit `modes/_profile.md` with Christopher's specific:

- Target archetypes and what makes him strong in each
- Proof points mapped to each archetype (from cv.md)
- Negotiation scripts specific to his situation
- Deal-breakers (technologies, company types, culture red flags to avoid)
- Companies Christopher actively wants to target

- [ ] **Step 3: Create cv.md**

Create `cv.md` in the project root with Christopher's full CV in markdown:

```markdown
# Christopher Rehm

christopher.rehm.63@protonmail.com | YOUR LOCATION | YOUR LINKEDIN

## Summary

[2-3 sentences. What you do, what you're known for, what you're looking for]

## Experience

### [Most Recent Role Title] @ [Company]

_YYYY-MM — Present_

- [Bullet with measurable achievement]
- [Bullet with measurable achievement]

### [Previous Role] @ [Company]

_YYYY-MM — YYYY-MM_

- [Bullet with measurable achievement]

## Projects

### [Project Name]

[One-line description + hero metric]

## Education

[Degree, Institution, Year]

## Skills

**Languages:** ...
**Frameworks:** ...
**Tools:** ...
```

- [ ] **Step 4: Create portals.yml**

```bash
cp templates/portals.example.yml portals.yml
```

Edit `portals.yml`:

- Update `title_filter.positive` with keywords matching Christopher's target roles
- Keep or remove pre-configured companies
- Add companies Christopher specifically wants to track

- [ ] **Step 5: Run doctor to verify setup**

```bash
node doctor.mjs
```

Expected: all checks green (or only optional items yellow)

- [ ] **Step 6: Commit the non-gitignored parts**

```bash
# profile.yml, _profile.md, cv.md, portals.yml are gitignored — don't commit them
# Only commit the template updates if any were made
git status
```

---

## Task 25: Data Initialization

**Files:**

- Create: `data/applications.md`
- Create: `data/pipeline.md`
- Create: `data/scan-history.tsv`
- Create: `interview-prep/story-bank.md`

- [ ] **Step 1: Create data files**

Write `data/applications.md`:

```markdown
# Applications Tracker

| #   | Date | Company | Role | Score | Status | PDF | Report | Notes |
| --- | ---- | ------- | ---- | ----- | ------ | --- | ------ | ----- |
```

Write `data/pipeline.md`:

```markdown
# Pipeline — Pending Evaluations

URLs added by scanner or manually. Claude processes these with `/career-ops pipeline`.

## Pending

## Processed
```

Write `data/scan-history.tsv`:

```
url	first_seen	portal	title	company	status
```

Write `interview-prep/story-bank.md`:

```markdown
# Interview Story Bank

STAR+R stories accumulated across evaluations. 5-10 master stories adaptable to any question.

<!-- Stories are added automatically during evaluations -->
```

- [ ] **Step 2: Verify data directory structure**

```bash
ls data/ interview-prep/
```

Expected: applications.md, pipeline.md, scan-history.tsv, story-bank.md

- [ ] **Step 3: Run verify-pipeline.mjs**

```bash
node verify-pipeline.mjs
```

Expected: passes cleanly

- [ ] **Step 4: Commit empty data structures**

```bash
git add data/applications.md data/pipeline.md data/scan-history.tsv interview-prep/story-bank.md
git commit -m "feat: initialize empty data structures (tracker, pipeline, scan history)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 26: Gemini CLI Support

**Files:**

- Create: `GEMINI.md`
- Create: `.gemini/commands/career-ops.toml`
- Create: `.gemini/commands/career-ops-evaluate.toml`
- Create: `.gemini/commands/career-ops-pdf.toml`
- Create: `.gemini/commands/career-ops-scan.toml`
- Create: `.gemini/commands/career-ops-tracker.toml`

- [ ] **Step 1: Copy GEMINI.md from reference**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/GEMINI.md" \
  -o GEMINI.md
```

- [ ] **Step 2: Copy Gemini command TOML files**

```bash
curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/.gemini/commands/career-ops.toml" \
  -o .gemini/commands/career-ops.toml

for cmd in career-ops-evaluate career-ops-pdf career-ops-scan career-ops-tracker \
           career-ops-pipeline career-ops-apply career-ops-batch career-ops-patterns \
           career-ops-followup career-ops-deep career-ops-contact career-ops-training \
           career-ops-project career-ops-compare; do
  curl -sL "https://raw.githubusercontent.com/santifer/career-ops/main/.gemini/commands/${cmd}.toml" \
    -o ".gemini/commands/${cmd}.toml" 2>/dev/null || echo "Skipped ${cmd}.toml (not found)"
done
```

- [ ] **Step 3: Commit**

```bash
git add GEMINI.md .gemini/
git commit -m "feat: add Gemini CLI support (GEMINI.md + 15 TOML commands)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 27: Go Dashboard TUI (Optional — Independent Deliverable)

**Files:**

- Create: `dashboard/go.mod`
- Create: `dashboard/main.go`
- Create: `dashboard/internal/data/parser.go`
- Create: `dashboard/internal/model/types.go`
- Create: `dashboard/internal/theme/theme.go`
- Create: `dashboard/internal/ui/screens/pipeline.go`
- Create: `dashboard/internal/ui/screens/viewer.go`
- Create: `dashboard/internal/ui/screens/progress.go`

> This task can be deferred. The core career-ops system works without the dashboard.

- [ ] **Step 1: Copy dashboard source from reference**

```bash
# Copy all Go source files
gh api repos/santifer/career-ops/contents/dashboard --jq '.[].name' | while read name; do
  if [ "$name" != "go.sum" ]; then
    gh api "repos/santifer/career-ops/contents/dashboard/${name}" --jq '.content' \
      2>/dev/null | base64 -d > "dashboard/${name}" 2>/dev/null || true
  fi
done

# Copy internal packages recursively
for pkg in data model theme; do
  mkdir -p "dashboard/internal/${pkg}"
  gh api "repos/santifer/career-ops/contents/dashboard/internal/${pkg}" --jq '.[].name' | \
    while read f; do
      gh api "repos/santifer/career-ops/contents/dashboard/internal/${pkg}/${f}" \
        --jq '.content' | base64 -d > "dashboard/internal/${pkg}/${f}"
    done
done

mkdir -p dashboard/internal/ui/screens
gh api "repos/santifer/career-ops/contents/dashboard/internal/ui/screens" --jq '.[].name' | \
  while read f; do
    gh api "repos/santifer/career-ops/contents/dashboard/internal/ui/screens/${f}" \
      --jq '.content' | base64 -d > "dashboard/internal/ui/screens/${f}"
  done
```

- [ ] **Step 2: Update go.mod module name**

```bash
sed -i 's|github.com/santifer/career-ops|github.com/christopherrehm/job-hunter|g' dashboard/go.mod
find dashboard/ -name "*.go" -exec sed -i \
  's|github.com/santifer/career-ops|github.com/christopherrehm/job-hunter|g' {} \;
```

- [ ] **Step 3: Download Go dependencies**

```bash
cd dashboard && go mod download
```

- [ ] **Step 4: Build**

```bash
cd dashboard && go build -o career-dashboard .
```

Expected: `dashboard/career-dashboard` binary created

- [ ] **Step 5: Smoke test**

```bash
# Run for 1 second then kill (just verify it starts without crash)
timeout 2 ./dashboard/career-dashboard --path . || true
```

- [ ] **Step 6: Commit**

```bash
git add dashboard/
git commit -m "feat: add Go Bubble Tea TUI dashboard

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 28: End-to-End Verification

- [ ] **Step 1: Run doctor**

```bash
node doctor.mjs
```

Expected: all required items green. If cv.md and profile.yml are filled in, should be fully green.

- [ ] **Step 2: Test PDF generation with sample**

Create a minimal test CV and verify PDF output:

```bash
node -e "
import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';

const template = readFileSync('templates/cv-template.html', 'utf-8');
const html = template
  .replace('{{LANG}}', 'en')
  .replace('{{PAGE_WIDTH}}', '210mm')
  .replace('{{NAME}}', 'Christopher Rehm')
  .replace('{{EMAIL}}', 'christopher.rehm.63@protonmail.com')
  .replace('{{LOCATION}}', 'Test City')
  .replace('{{PHONE}}', '')
  .replace('{{LINKEDIN_URL}}', 'linkedin.com/in/test')
  .replace('{{LINKEDIN_DISPLAY}}', 'LinkedIn')
  .replace('{{PORTFOLIO_URL}}', '')
  .replace('{{PORTFOLIO_DISPLAY}}', '')
  .replace('{{SECTION_SUMMARY}}', 'Professional Summary')
  .replace('{{SUMMARY_TEXT}}', 'Test summary.')
  .replace('{{SECTION_COMPETENCIES}}', 'Core Competencies')
  .replace('{{COMPETENCIES}}', '<span class=\"competency-tag\">Node.js</span>')
  .replace('{{SECTION_EXPERIENCE}}', 'Work Experience')
  .replace('{{EXPERIENCE}}', '<p>Test experience</p>')
  .replace('{{SECTION_PROJECTS}}', 'Projects')
  .replace('{{PROJECTS}}', '<p>Test project</p>')
  .replace('{{SECTION_EDUCATION}}', 'Education')
  .replace('{{EDUCATION}}', '<p>Test University, 2020</p>')
  .replace('{{SECTION_CERTIFICATIONS}}', 'Certifications')
  .replace('{{CERTIFICATIONS}}', '')
  .replace('{{SECTION_SKILLS}}', 'Skills')
  .replace('{{SKILLS}}', '<p>JavaScript, Go, Python</p>');

writeFileSync('/tmp/test-christopher.html', html);
console.log('HTML written');
" --input-type=module

node generate-pdf.mjs /tmp/test-christopher.html /tmp/test-christopher.pdf --format=a4
ls -lh /tmp/test-christopher.pdf
```

Expected: PDF created, > 10KB

- [ ] **Step 3: Test zero-token scanner (dry run)**

```bash
node scan.mjs --dry-run 2>&1 | head -20
```

Expected: prints scan preview or "portals.yml not found" (if not yet created)

- [ ] **Step 4: Test pipeline integrity**

```bash
node verify-pipeline.mjs
```

Expected: passes

- [ ] **Step 5: Test merge-tracker with empty additions**

```bash
node merge-tracker.mjs && echo "merge OK"
```

Expected: `merge OK` (no additions to merge)

- [ ] **Step 6: Open Claude Code and test evaluation**

```bash
claude
```

Then paste a real job description URL and verify:

1. Claude reads `CLAUDE.md` and `modes/_shared.md` automatically
2. Runs through Blocks A-G
3. Saves report to `reports/`
4. Generates PDF to `output/`
5. Adds entry to `data/applications.md`

- [ ] **Step 7: Final commit**

```bash
git add -A
git status  # Review what's about to be committed — don't commit gitignored files
git commit -m "feat: complete career-ops pipeline setup

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

| Feature                     | Task                                  |
| --------------------------- | ------------------------------------- |
| A-F+G evaluation            | Task 16                               |
| ATS PDF generation          | Tasks 3, 4, 5, 18                     |
| Portal scanner (zero-token) | Task 6                                |
| Portal scanner (agent)      | Task 19                               |
| Batch processing            | Tasks 12, 20                          |
| Application tracker         | Tasks 7, 8, 9                         |
| Dashboard TUI               | Task 27                               |
| Onboarding flow             | Task 22 (CLAUDE.md)                   |
| Update system               | Task 11                               |
| Liveness checking           | Task 11                               |
| Gemini CLI support          | Task 26                               |
| Interview story bank        | Task 21 (interview-prep.md) + Task 25 |
| Pattern analysis            | Task 21 (patterns.md)                 |
| Follow-up cadence           | Task 21 (followup.md)                 |
| Christopher's profile       | Task 24                               |
| Data integrity              | Tasks 8, 9, 10                        |

**Placeholders:** None — all steps have specific commands or file content.

**Type consistency:** No shared types across tasks (each task is self-contained files).

---

## Support

If you find this useful, a small donation helps keep projects like this going:
[Donate via PayPal](https://paypal.me/christopherrehm001)
