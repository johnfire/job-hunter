export async function extractAshbyFields(page) {
  // Ashby shows the JD first; click "Apply for this Job" to reveal the form
  const applyBtn = page
    .locator(
      'a:has-text("Apply for this Job"), button:has-text("Apply for this Job"), a:has-text("Apply Now"), button:has-text("Apply Now")',
    )
    .first();
  const btnVisible = await applyBtn.isVisible().catch(() => false);
  if (btnVisible) {
    await applyBtn.click();
    await page.waitForTimeout(2000);
  }

  return page.evaluate(() => {
    const fields = [];
    const seen = new Set();

    // Ashby wraps each question in [data-testid="question-*"] containers
    // Fall back to any div with a direct label child
    const containers = document.querySelectorAll(
      '[data-testid^="question-"], div:has(> label)',
    );

    containers.forEach((container) => {
      const label = container.querySelector("label");
      const input = container.querySelector("input, textarea, select");
      if (!label || !input || seen.has(input)) return;
      seen.add(input);

      const id = input.id || input.name || `ashby_${fields.length}`;
      const type =
        input.tagName === "TEXTAREA"
          ? "textarea"
          : input.tagName === "SELECT"
            ? "select"
            : input.type || "text";
      const options =
        type === "select"
          ? Array.from(input.options)
              .map((o) => o.value)
              .filter((v) => v)
          : null;

      fields.push({
        id,
        label: label.textContent.trim(),
        type,
        required: input.hasAttribute("required"),
        selector: input.id ? `[id="${input.id}"]` : `[name='${input.name}']`,
        options,
        maxLength: input.maxLength > 0 ? input.maxLength : null,
        placeholder: input.placeholder || null,
      });
    });

    return fields;
  });
}
