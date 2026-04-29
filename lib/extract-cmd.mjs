import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ROOT, urlHash } from "./utils.mjs";
import { extractFields } from "./form-extractor.mjs";

export async function runExtract(url) {
  const hash = urlHash(url);
  const outputDir = join(ROOT, "output");
  mkdirSync(outputDir, { recursive: true });

  console.log(`Extracting fields from: ${url}`);

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

  console.log(`\nPlatform:      ${result.platform}`);
  console.log(`Fields found:  ${result.fields.length}`);
  console.log(`Has next page: ${result.hasNextPage}`);
  console.log(`\nFields:`);
  for (const f of result.fields) {
    const req = f.required && !f.label.includes("*") ? " *" : "";
    const opts = f.options
      ? ` [${f.options.slice(0, 3).join("|")}${f.options.length > 3 ? "…" : ""}]`
      : "";
    console.log(`  ${f.type.padEnd(10)} ${f.label}${req}${opts}`);
  }
  console.log(`\nSaved:  ${fieldsPath}`);
  console.log(`        ${screenshotPath}`);
  console.log(
    `\nNext: generate answers JSON, then run:\n  node fill-form.mjs fill "${url}" --answers output/form-answers-${hash}.json`,
  );
}
