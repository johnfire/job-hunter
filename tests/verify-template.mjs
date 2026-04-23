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
