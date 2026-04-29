import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ROOT, urlHash } from "./utils.mjs";
import { fillFields, uploadFile } from "./field-filler.mjs";

export async function runFill(url, answersPath) {
  const hash = urlHash(url);
  const outputDir = join(ROOT, "output");
  mkdirSync(outputDir, { recursive: true });

  let answers;
  try {
    answers = JSON.parse(readFileSync(answersPath, "utf-8")).answers;
    if (!Array.isArray(answers)) throw new Error('"answers" must be an array');
  } catch (e) {
    console.error(`Could not read answers file: ${answersPath}\n${e.message}`);
    process.exit(1);
  }

  console.log(`Opening: ${url}`);
  console.log(`Filling ${answers.length} fields from: ${answersPath}`);
  console.log(
    "\nBrowser will stay open for your review. Submit manually, then Ctrl+C here.\n",
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

  // Fill all non-file fields
  const { filled, errors } = await fillFields(page, answers);

  // Handle file uploads separately
  for (const answer of answers) {
    if (answer.type !== "file") continue;
    const filePath = join(ROOT, answer.value);
    try {
      await uploadFile(page, answer.selector, filePath);
      console.log(`  Uploaded: ${answer.value}`);
    } catch (e) {
      errors.push(`File upload failed for ${answer.id}: ${e.message}`);
    }
  }

  // Screenshot after fill
  const screenshotPath = join(outputDir, `form-filled-${hash}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Filled ${filled} fields`);
  if (errors.length > 0) {
    console.log(`\nWarnings (${errors.length}):`);
    errors.forEach((e) => console.log(`  ⚠️  ${e}`));
  }
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(
    "\nReview the form in the browser. Submit when ready, then press Ctrl+C.\n",
  );

  // Keep process alive — browser stays open until user is done
  await new Promise((resolve) => {
    process.on("SIGINT", resolve);
    process.on("SIGTERM", resolve);
  });

  await browser.close();
  console.log("Done.");
}
