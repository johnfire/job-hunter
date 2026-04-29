export async function extractGreenhouseFields(page) {
  return page.evaluate(() => {
    const fields = [];

    // Known structured fields with fixed IDs
    const knownFields = [
      { id: "first_name", label: "First Name", type: "text" },
      { id: "last_name", label: "Last Name", type: "text" },
      { id: "email", label: "Email", type: "email" },
      { id: "phone", label: "Phone", type: "tel" },
    ];

    for (const kf of knownFields) {
      const el = document.querySelector(`#${kf.id}`);
      if (el) {
        fields.push({
          id: kf.id,
          label: kf.label,
          type: kf.type,
          required: el.hasAttribute("required"),
          selector: `#${kf.id}`,
          options: null,
          maxLength: el.maxLength > 0 ? el.maxLength : null,
          placeholder: el.placeholder || null,
        });
      }
    }

    // Resume / cover letter file inputs
    const fileInput = document.querySelector(
      "input[data-source='resume'], input[data-source='cover_letter'], input[type='file']",
    );
    if (fileInput) {
      const labelEl = fileInput
        .closest(".field, .form-group, div")
        ?.querySelector("label");
      const label = labelEl?.textContent?.trim() || "Resume/CV";
      const src = fileInput.getAttribute("data-source");
      fields.push({
        id: "resume_upload",
        label,
        type: "file",
        required: fileInput.hasAttribute("required"),
        selector: src ? `input[data-source='${src}']` : "input[type='file']",
        options: null,
        maxLength: null,
        placeholder: null,
      });
    }

    // Textareas (cover letter + custom questions)
    document.querySelectorAll("textarea").forEach((ta) => {
      const labelEl =
        document.querySelector(`label[for='${ta.id}']`) ||
        ta.closest(".field, .custom-question, div")?.querySelector("label");
      const label =
        labelEl?.textContent?.trim() || ta.name || ta.id || "Text field";
      if (!label) return;
      fields.push({
        id: ta.id || ta.name || `textarea_${fields.length}`,
        label,
        type: "textarea",
        required: ta.hasAttribute("required"),
        selector: ta.id
          ? `#${ta.id}`
          : `textarea[name='${CSS.escape(ta.name)}']`,
        options: null,
        maxLength: ta.maxLength > 0 ? ta.maxLength : null,
        placeholder: ta.placeholder || null,
      });
    });

    // Selects
    document.querySelectorAll("select").forEach((sel) => {
      const labelEl =
        document.querySelector(`label[for='${sel.id}']`) ||
        sel.closest(".field, div")?.querySelector("label");
      const label = labelEl?.textContent?.trim() || sel.name || sel.id;
      if (!label) return;
      const options = Array.from(sel.options)
        .map((o) => o.value)
        .filter((v) => v !== "");
      fields.push({
        id: sel.id || sel.name || `select_${fields.length}`,
        label,
        type: "select",
        required: sel.hasAttribute("required"),
        selector: sel.id ? `#${sel.id}` : `select[name='${sel.name}']`,
        options,
        maxLength: null,
        placeholder: null,
      });
    });

    return fields;
  });
}
