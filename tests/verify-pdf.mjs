import { execSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";

const testHtml = `<!DOCTYPE html><html><body style="font-family:Arial">
<h1>Test PDF</h1><p>ATS compatible content</p>
</body></html>`;
writeFileSync("/tmp/test-cv.html", testHtml);

try {
  execSync(
    "node generate-pdf.mjs /tmp/test-cv.html /tmp/test-cv.pdf --format=a4",
    { stdio: "pipe" },
  );
  if (!existsSync("/tmp/test-cv.pdf")) throw new Error("PDF not created");
  console.log("PASS: generate-pdf.mjs works");
  unlinkSync("/tmp/test-cv.pdf");
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
