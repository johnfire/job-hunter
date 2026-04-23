# Mode: pdf — ATS-Optimized PDF Generation

## Full Pipeline

1. Read `cv.md` as source of truth
2. Ask user for the JD if not in context (text or URL)
3. Extract 15-20 keywords from the JD
4. Detect JD language → CV language (EN default)
5. Detect company location → paper format:
   - US/Canada → `letter`
   - Rest of world → `a4`
6. Detect role archetype → adapt framing
7. Rewrite Professional Summary injecting JD keywords + narrative bridge
8. Select top 3-4 most relevant projects for this offer
9. Reorder experience bullets by JD relevance
10. Build competency grid from JD requirements (6-8 keyword phrases)
11. Inject keywords naturally into existing achievements (NEVER invent)
12. Generate complete HTML from template + personalized content
13. Read `name` from `config/profile.yml` → normalize to kebab-case lowercase (e.g. "John Doe" → "john-doe") → `{candidate}`
14. Write HTML to `/tmp/cv-{candidate}-{company}.html`
15. Run: `node generate-pdf.mjs /tmp/cv-{candidate}-{company}.html output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf --format={letter|a4}`
16. Report: PDF path, page count, keyword coverage %

## ATS Rules (clean parsing)

- Single-column layout (no sidebars, no parallel columns)
- Standard headers: "Professional Summary", "Work Experience", "Education", "Skills", "Certifications", "Projects"
- No text inside images/SVGs
- No critical info in PDF headers/footers (ATS ignores them)
- UTF-8, selectable text (not rasterized)
- No nested tables
- JD keywords distributed: Summary (top 5), first bullet of each role, Skills section

## PDF Design

- **Fonts:** Space Grotesk (headings, 600-700) + DM Sans (body, 400-500)
- **Fonts self-hosted:** `fonts/`
- **Header:** name in Space Grotesk 24px bold + gradient line `linear-gradient(to right, hsl(187,74%,32%), hsl(270,70%,45%))` 2px + contact row
- **Section headers:** Space Grotesk 10px, uppercase, letter-spacing 0.08em, cyan primary
- **Body:** DM Sans 11px, line-height 1.5
- **Company names:** accent purple `hsl(270,70%,45%)`
- **Margins:** 0.6in
- **Background:** pure white

## Section Order (optimized for "6-second recruiter scan")

1. Header (large name, gradient, contact, portfolio link)
2. Professional Summary (3-4 lines, keyword-dense)
3. Core Competencies (6-8 keyword phrases in flex-grid)
4. Work Experience (reverse chronological)
5. Projects (top 3-4 most relevant)
6. Education & Certifications
7. Skills (languages + technical)

## Keyword Injection Strategy (ethical, truth-based)

Examples of legitimate reformulation:

- JD says "RAG pipelines" and CV says "LLM workflows with retrieval" → change to "RAG pipeline design and LLM orchestration workflows"
- JD says "MLOps" and CV says "observability, evals, error handling" → change to "MLOps and observability: evals, error handling, cost monitoring"
- JD says "stakeholder management" and CV says "collaborated with team" → change to "stakeholder management across engineering, operations, and business"

**NEVER add skills the candidate doesn't have. Only reformulate real experience with the exact vocabulary from the JD.**

## HTML Template

Use the template at `templates/cv-template.html`. Replace `{{...}}` placeholders with personalized content:

| Placeholder                  | Content                                             |
| ---------------------------- | --------------------------------------------------- |
| `{{LANG}}`                   | `en`                                                |
| `{{PAGE_WIDTH}}`             | `8.5in` (letter) or `210mm` (A4)                    |
| `{{NAME}}`                   | from profile.yml                                    |
| `{{PHONE}}`                  | from profile.yml — omit `<span>` entirely if empty  |
| `{{EMAIL}}`                  | from profile.yml                                    |
| `{{LINKEDIN_URL}}`           | from profile.yml                                    |
| `{{LINKEDIN_DISPLAY}}`       | from profile.yml                                    |
| `{{PORTFOLIO_URL}}`          | from profile.yml                                    |
| `{{PORTFOLIO_DISPLAY}}`      | from profile.yml                                    |
| `{{LOCATION}}`               | from profile.yml                                    |
| `{{SECTION_SUMMARY}}`        | Professional Summary                                |
| `{{SUMMARY_TEXT}}`           | personalized summary with keywords                  |
| `{{SECTION_COMPETENCIES}}`   | Core Competencies                                   |
| `{{COMPETENCIES}}`           | `<span class="competency-tag">keyword</span>` × 6-8 |
| `{{SECTION_EXPERIENCE}}`     | Work Experience                                     |
| `{{EXPERIENCE}}`             | HTML for each job with reordered bullets            |
| `{{SECTION_PROJECTS}}`       | Projects                                            |
| `{{PROJECTS}}`               | HTML for top 3-4 projects                           |
| `{{SECTION_EDUCATION}}`      | Education                                           |
| `{{EDUCATION}}`              | HTML for education                                  |
| `{{SECTION_CERTIFICATIONS}}` | Certifications                                      |
| `{{CERTIFICATIONS}}`         | HTML for certifications                             |
| `{{SECTION_SKILLS}}`         | Skills                                              |
| `{{SKILLS}}`                 | HTML for skills                                     |

## Canva CV Generation (optional)

If `config/profile.yml` has `canva_resume_design_id` set, offer the user a choice before generating:

- **"HTML/PDF (fast, ATS-optimized)"** — standard flow above
- **"Canva CV (visual, design-preserving)"** — flow below

If the user has no `canva_resume_design_id`, skip this prompt and use the HTML/PDF flow.

### Canva workflow

#### Step 1 — Duplicate the base design

a. `export-design` the base design (using `canva_resume_design_id`) as PDF → get download URL
b. `import-design-from-url` using that download URL → creates a new editable design (the duplicate)
c. Note the new `design_id` for the duplicate

#### Step 2 — Read the design structure

a. `get-design-content` on the new design → returns all text elements with their content
b. Map text elements to CV sections by content matching (name → header, "Summary" → summary, company names → experience, etc.)
c. If mapping fails, show the user what was found and ask for guidance

#### Step 3 — Generate tailored content

Same content generation as the HTML flow (Steps 1-11 above).

**IMPORTANT — Character budget rule:** Each replacement MUST be approximately the same length as the original (within ±15% character count). Canva text boxes are fixed-size — longer text causes overlap.

#### Step 4 — Apply edits

a. `start-editing-transaction` on the duplicate design
b. `perform-editing-operations` with `find_and_replace_text` for each section
c. Reflow layout: after text replacement, use `position_element` to maintain consistent spacing between experience sections
d. `get-design-thumbnail` → visually inspect for overlaps, cut-off text, uneven spacing — fix before committing
e. Show preview, get user approval, then `commit-editing-transaction`

#### Step 5 — Export and download PDF

a. `export-design` the duplicate as PDF
b. Download immediately via Bash (pre-signed S3 URL expires in ~2 hours):

```bash
curl -sL -o "output/cv-{candidate}-{company}-canva-{YYYY-MM-DD}.pdf" "{download_url}"
```

c. Verify: `file output/cv-*.pdf` must show "PDF document"

#### Error handling

- `import-design-from-url` fails → fall back to HTML/PDF pipeline
- Text elements can't be mapped → warn user, ask for manual mapping
- `find_and_replace_text` finds no matches → try broader substring matching
- Always provide the Canva design URL so the user can edit manually if auto-edit fails

## Post-generation

Update tracker if the offer is already registered: flip PDF from ❌ to ✅.
