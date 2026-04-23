import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

// Snapshot existing tracker so we can restore it
const original = (() => {
  try {
    return readFileSync("data/applications.md", "utf-8");
  } catch {
    return null;
  }
})();

// Case 1: empty tracker should pass
let out = execSync("node verify-pipeline.mjs 2>&1", { encoding: "utf-8" });
if (!out.includes("Pipeline is clean")) {
  console.error("FAIL: empty tracker should be clean\n", out);
  process.exit(1);
}
console.log("PASS: empty tracker is clean");

// Case 2: tracker with a valid row should pass
writeFileSync(
  "data/applications.md",
  `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-04-23 | Acme | Senior Engineer | 4.2/5 | Evaluated | ❌ | — | Test |
`,
);
out = execSync("node verify-pipeline.mjs 2>&1", { encoding: "utf-8" });
if (!out.includes("Pipeline is clean")) {
  console.error("FAIL: valid row should pass\n", out);
  process.exit(1);
}
console.log("PASS: valid tracker row passes");

// Restore
if (original !== null) {
  writeFileSync("data/applications.md", original);
} else {
  writeFileSync(
    "data/applications.md",
    `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
`,
  );
}

console.log("PASS: verify-pipeline.mjs works correctly");
