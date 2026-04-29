export async function extractLeverFields(page) {
  return page.evaluate(() => {
    const fields = [];
    const seen = new Set();

    // Lever wraps fields in .application-field or similar containers
    const containers = document.querySelectorAll(
      ".application-field, .field, div:has(> label)",
    );

    containers.forEach((container) => {
      const label = container.querySelector("label");
      const input = container.querySelector("input, textarea, select");
      if (!label || !input || seen.has(input)) return;
      seen.add(input);

      const id = input.id || input.name || `lever_${fields.length}`;
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
        selector: input.id ? `#${input.id}` : `[name='${input.name}']`,
        options,
        maxLength: input.maxLength > 0 ? input.maxLength : null,
        placeholder: input.placeholder || null,
      });
    });

    return fields;
  });
}
