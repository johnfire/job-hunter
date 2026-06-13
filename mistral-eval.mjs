#!/usr/bin/env node
/**
 * mistral-eval.mjs — Mistral-powered Job Offer Evaluator for career-ops
 *
 * Uses Mistral's OpenAI-compatible API (no extra dependencies — native fetch).
 * Reads evaluation logic from modes/oferta.md + modes/_shared.md,
 * reads the user's resume from cv.md, and evaluates a Job Description
 * passed as a command-line argument.
 *
 * Usage:
 *   node mistral-eval.mjs "Paste full JD text here"
 *   node mistral-eval.mjs --file ./jds/my-job.txt
 *   node mistral-eval.mjs --model mistral-small-latest "JD text"
 *
 * Requires:
 *   MISTRAL_API_KEY in .env (or environment variable)
 *
 * Models (cheapest to most capable):
 *   mistral-small-latest   — fast, cheap, good for batch
 *   mistral-medium-latest  — balanced
 *   mistral-large-latest   — most capable (default)
 */

import {
  readFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { captureThought } from "./open-brain-client.mjs";

// ---------------------------------------------------------------------------
// Bootstrap: load .env before anything else
// ---------------------------------------------------------------------------
try {
  const { config } = await import("dotenv");
  config();
} catch {
  // dotenv is optional — fall back to process.env
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = dirname(fileURLToPath(import.meta.url));

const PATHS = {
  shared: join(ROOT, "modes", "_shared.md"),
  oferta: join(ROOT, "modes", "oferta.md"),
  cv: join(ROOT, "cv.md"),
  reports: join(ROOT, "reports"),
  tracker: join(ROOT, "data", "applications.md"),
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           career-ops — Mistral Evaluator                        ║
╚══════════════════════════════════════════════════════════════════╝

  Evaluate a job offer using Mistral AI.

  USAGE
    node mistral-eval.mjs "<JD text>"
    node mistral-eval.mjs --file ./jds/my-job.txt
    node mistral-eval.mjs --model mistral-small-latest "<JD text>"

  OPTIONS
    --file <path>    Read JD from a file instead of inline text
    --model <name>   Mistral model to use (default: mistral-large-latest)
    --no-save        Do not save report to reports/ directory
    --no-brain       Skip Open Brain capture after evaluation
    --help           Show this help

  SETUP
    1. Get an API key at https://console.mistral.ai/api-keys/
    2. Add MISTRAL_API_KEY=<your-key> to .env
    3. Run: node mistral-eval.mjs "<JD text>"

  MODELS
    mistral-small-latest    fast, cheap — good for batch
    mistral-medium-latest   balanced
    mistral-large-latest    most capable (default)

  EXAMPLES
    node mistral-eval.mjs "We are looking for a Senior AI Engineer..."
    node mistral-eval.mjs --file ./jds/openai-swe.txt
    node mistral-eval.mjs --model mistral-small-latest --file ./jds/job.txt
`);
  process.exit(0);
}

// Parse flags
let jdText = "";
let modelName = process.env.MISTRAL_MODEL || "mistral-large-latest";
let saveReport = true;
let useBrain = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--file" && args[i + 1]) {
    const filePath = args[++i];
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    jdText = readFileSync(filePath, "utf-8").trim();
  } else if (args[i] === "--model" && args[i + 1]) {
    modelName = args[++i];
  } else if (args[i] === "--no-save") {
    saveReport = false;
  } else if (args[i] === "--no-brain") {
    useBrain = false;
  } else if (!args[i].startsWith("--")) {
    jdText += (jdText ? "\n" : "") + args[i];
  }
}

if (!jdText) {
  console.error(
    "Error: No Job Description provided. Run with --help for usage.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error(`
Error: MISTRAL_API_KEY not found.

   1. Get a key at https://console.mistral.ai/api-keys/
   2. Add it to .env:   MISTRAL_API_KEY=your_key_here
   3. Or export it:     export MISTRAL_API_KEY=your_key_here
`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------
function readFile(path, label) {
  if (!existsSync(path)) {
    console.warn(`Warning: ${label} not found at: ${path}`);
    return `[${label} not found — skipping]`;
  }
  return readFileSync(path, "utf-8").trim();
}

function nextReportNumber() {
  if (!existsSync(PATHS.reports)) return "001";
  const files = readdirSync(PATHS.reports)
    .filter((f) => /^\d{3}-/.test(f))
    .map((f) => parseInt(f.slice(0, 3)))
    .filter((n) => !isNaN(n));
  if (files.length === 0) return "001";
  return String(Math.max(...files) + 1).padStart(3, "0");
}

// ---------------------------------------------------------------------------
// Load context files
// ---------------------------------------------------------------------------
console.log("\nLoading context files...");

const sharedContext = readFile(PATHS.shared, "modes/_shared.md");
const ofertaLogic = readFile(PATHS.oferta, "modes/oferta.md");
const cvContent = readFile(PATHS.cv, "cv.md");

// ---------------------------------------------------------------------------
// Build system prompt
// ---------------------------------------------------------------------------
const systemPrompt = `You are career-ops, an AI-powered job search assistant.
You evaluate job offers against the user's CV using a structured A-G scoring system.

Your evaluation methodology is defined below. Follow it exactly.

═══════════════════════════════════════════════════════
SYSTEM CONTEXT (_shared.md)
═══════════════════════════════════════════════════════
${sharedContext}

═══════════════════════════════════════════════════════
EVALUATION MODE (oferta.md)
═══════════════════════════════════════════════════════
${ofertaLogic}

═══════════════════════════════════════════════════════
CANDIDATE RESUME (cv.md)
═══════════════════════════════════════════════════════
${cvContent}

═══════════════════════════════════════════════════════
IMPORTANT OPERATING RULES FOR THIS CLI SESSION
═══════════════════════════════════════════════════════
1. You do NOT have access to WebSearch, Playwright, or file writing tools.
   - For Block D (Comp research): provide salary estimates based on your training data, clearly noted as estimates.
   - For Block G (Legitimacy): analyze the JD text only; skip URL/page freshness checks.
   - Post-evaluation file saving is handled by the script, not by you.
2. Generate Blocks A through G in full, in English, unless the JD is in another language.
3. At the very end, output a machine-readable summary block in this exact format:

---SCORE_SUMMARY---
COMPANY: <company name or "Unknown">
ROLE: <role title>
SCORE: <global score as decimal, e.g. 3.8>
ARCHETYPE: <detected archetype>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---
`;

// ---------------------------------------------------------------------------
// Call Mistral API (OpenAI-compatible)
// ---------------------------------------------------------------------------
console.log(`Calling Mistral (${modelName})... this may take 30-60 seconds.\n`);

const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: modelName,
    temperature: 0.4,
    max_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `JOB DESCRIPTION TO EVALUATE:\n\n${jdText}` },
    ],
  }),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Mistral API error ${response.status}: ${body}`);
  if (response.status === 401) {
    console.error("Check your MISTRAL_API_KEY in .env");
  } else if (response.status === 429) {
    console.error("Rate limit hit. Wait a moment and retry.");
  }
  process.exit(1);
}

const data = await response.json();
const evaluationText = data.choices?.[0]?.message?.content;

if (!evaluationText) {
  console.error("Error: Empty response from Mistral API.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Display evaluation
// ---------------------------------------------------------------------------
console.log("\n" + "═".repeat(66));
console.log(`  CAREER-OPS EVALUATION — powered by Mistral (${modelName})`);
console.log("═".repeat(66) + "\n");
console.log(evaluationText);

// ---------------------------------------------------------------------------
// Parse score summary
// ---------------------------------------------------------------------------
const summaryMatch = evaluationText.match(
  /---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/,
);

let company = "unknown";
let role = "unknown";
let score = "?";
let archetype = "unknown";
let legitimacy = "unknown";

if (summaryMatch) {
  const block = summaryMatch[1];
  const extract = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : "unknown";
  };
  company = extract("COMPANY");
  role = extract("ROLE");
  score = extract("SCORE");
  archetype = extract("ARCHETYPE");
  legitimacy = extract("LEGITIMACY");
}

// ---------------------------------------------------------------------------
// Save report
// ---------------------------------------------------------------------------
if (saveReport) {
  try {
    if (!existsSync(PATHS.reports)) {
      mkdirSync(PATHS.reports, { recursive: true });
    }

    const num = nextReportNumber();
    const today = new Date().toISOString().split("T")[0];
    const companySlug = company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${num}-${companySlug}-${today}.md`;
    const reportPath = join(PATHS.reports, filename);

    const reportContent = `# Evaluation: ${company} — ${role}

**Date:** ${today}
**Archetype:** ${archetype}
**Score:** ${score}/5
**Legitimacy:** ${legitimacy}
**PDF:** pending
**Tool:** Mistral (${modelName})

---

${evaluationText.replace(/---SCORE_SUMMARY---[\s\S]*?---END_SUMMARY---/, "").trim()}
`;

    writeFileSync(reportPath, reportContent, "utf-8");
    console.log(`\nReport saved: reports/${filename}`);
    console.log(`\nTracker entry (add to data/applications.md):`);
    console.log(
      `    | ${num} | ${today} | ${company} | ${role} | ${score} | Evaluated | ❌ | [${num}](reports/${filename}) |`,
    );
  } catch (err) {
    console.warn(`Warning: Could not save report: ${err.message}`);
  }
}

console.log("\n" + "─".repeat(66));
console.log(
  `  Score: ${score}/5  |  Archetype: ${archetype}  |  Legitimacy: ${legitimacy}`,
);
console.log("─".repeat(66) + "\n");

// ---------------------------------------------------------------------------
// Capture to Open Brain
// ---------------------------------------------------------------------------
if (useBrain && company !== "unknown") {
  try {
    const today = new Date().toISOString().split("T")[0];
    const thought =
      `career-ops: Evaluated ${company} — ${role} on ${today}. ` +
      `Score ${score}/5, archetype: ${archetype}, legitimacy: ${legitimacy}. ` +
      `Tool: Mistral (${modelName}).`;
    await captureThought(thought, "career-ops");
    console.log("Captured to Open Brain.");
  } catch (err) {
    console.warn(`Open Brain capture skipped: ${err.message}`);
  }
}
