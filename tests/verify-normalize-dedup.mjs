import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

const restore = (content) => writeFileSync("data/applications.md", content);

const empty = `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`;

// ── normalize-statuses ────────────────────────────────────────────────────────

// Seed tracker with a non-canonical status (lowercase "evaluated")
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-04-23 | Acme | Engineer | 4.2/5 | evaluated | ❌ | — | Test |
`,
);

execSync("node normalize-statuses.mjs", { stdio: "pipe" });
let md = readFileSync("data/applications.md", "utf-8");

// After normalization the status should be canonical "Evaluated"
if (!md.includes("Evaluated")) {
  console.error("FAIL: normalize-statuses did not fix lowercase status");
  process.exit(1);
}
console.log("PASS: normalize-statuses fixes non-canonical status");

// ── dedup-tracker ─────────────────────────────────────────────────────────────

// Role needs 2+ non-stopword content words for the fuzzy matcher to fire.
// "Engineer" alone is a stopword — use "AI Platform Architect" instead.
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-04-23 | Acme | AI Platform Architect | 4.2/5 | Evaluated | ❌ | — | first |
| 2 | 2026-04-24 | Acme | AI Platform Architect | 4.2/5 | Evaluated | ❌ | — | dupe |
`,
);

execSync("node dedup-tracker.mjs", { stdio: "pipe" });
md = readFileSync("data/applications.md", "utf-8");
const rows = md
  .split("\n")
  .filter(
    (l) =>
      l.startsWith("| ") && l.includes("Acme") && l.includes("AI Platform"),
  );

if (rows.length !== 1) {
  console.error(`FAIL: expected 1 Acme row after dedup, got ${rows.length}`);
  process.exit(1);
}
console.log("PASS: dedup-tracker removes duplicate company+role rows");

restore(empty);
console.log(
  "PASS: normalize-statuses.mjs and dedup-tracker.mjs work correctly",
);
