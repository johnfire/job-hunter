import { writeFileSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";

mkdirSync("batch/tracker-additions", { recursive: true });
mkdirSync("data", { recursive: true });

// Seed empty tracker
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`,
);

// Seed a TSV addition (status before score — merge script swaps columns)
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

// Cleanup — merge script may have already removed the TSV (expected)
import { existsSync } from "fs";
if (existsSync("batch/tracker-additions/001-acme.tsv")) {
  unlinkSync("batch/tracker-additions/001-acme.tsv");
}
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`,
);
