/**
 * Fills form fields on a Playwright page from an answers array.
 * File inputs are skipped here — handled separately via uploadFile().
 * Returns { filled: number, errors: string[] }.
 */
export async function fillFields(page, answers) {
  let filled = 0;
  const errors = [];

  for (const answer of answers) {
    if (answer.type === "file") continue;

    try {
      const count = await page.locator(answer.selector).count();
      if (count === 0) {
        errors.push(
          `Selector not found: ${answer.selector} (id: ${answer.id})`,
        );
        continue;
      }

      switch (answer.type) {
        case "select":
          await page.selectOption(answer.selector, {
            value: String(answer.value),
          });
          break;
        case "radio":
        case "checkbox":
          if (answer.value === "true" || answer.value === true) {
            await page.check(answer.selector);
          } else {
            await page.uncheck(answer.selector).catch(() => {});
          }
          break;
        default:
          // text, email, tel, url, number, textarea
          await page.fill(answer.selector, String(answer.value));
      }
      filled++;
    } catch (err) {
      errors.push(
        `Failed to fill ${answer.id} (${answer.selector}): ${err.message}`,
      );
    }
  }

  return { filled, errors };
}

/**
 * Uploads a file to a file input. Separate from fillFields because
 * setInputFiles requires a real path and works differently from fill().
 */
export async function uploadFile(page, selector, filePath) {
  const count = await page.locator(selector).count();
  if (count === 0) throw new Error(`File input not found: ${selector}`);
  await page.setInputFiles(selector, filePath);
}
