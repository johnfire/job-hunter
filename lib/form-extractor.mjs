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

  const hasNextPage = await page.evaluate(
    () =>
      !!document.querySelector(
        'button[data-action=next], input[value="Next"], input[value="Continue"], button[aria-label*="Next"], button[aria-label*="Continue"]',
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
