export async function extractGenericFields(page) {
  return page.evaluate(() => {
    const fields = [];
    const seen = new Set();

    function addField(el, labelText) {
      if (!el || seen.has(el)) return;
      seen.add(el);
      const id = el.id || el.name || `field_${fields.length}`;
      const selector = el.id
        ? `#${el.id}`
        : el.name
          ? `[name='${el.name}']`
          : el.tagName.toLowerCase();
      const type =
        el.tagName.toLowerCase() === "textarea"
          ? "textarea"
          : el.tagName.toLowerCase() === "select"
            ? "select"
            : el.type || "text";
      const options =
        type === "select"
          ? Array.from(el.options)
              .map((o) => o.value)
              .filter((v) => v)
          : null;
      fields.push({
        id,
        label: labelText,
        type,
        required: el.hasAttribute("required"),
        selector,
        options,
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        placeholder: el.placeholder || null,
      });
    }

    // label[for] → matching input
    document.querySelectorAll("label[for]").forEach((label) => {
      const el = document.getElementById(label.htmlFor);
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
        addField(el, label.textContent.trim());
      }
    });

    // Inputs without associated labels — find closest label in parent
    document
      .querySelectorAll(
        "input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select",
      )
      .forEach((el) => {
        if (seen.has(el)) return;
        const closestLabel = el
          .closest("div, fieldset, .field, .form-group")
          ?.querySelector("label");
        const labelText =
          closestLabel?.textContent?.trim() ||
          el.placeholder ||
          el.name ||
          el.id;
        if (labelText) addField(el, labelText);
      });

    return fields;
  });
}
