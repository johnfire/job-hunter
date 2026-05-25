# career-ops Workflow

How the system works end-to-end, and where AI is (and isn't) used.

---

## Stage 1 — Discovery (Zero AI)

**`scan.mjs`** runs entirely without LLM tokens. It hits Greenhouse, Ashby, and Lever job board APIs directly, applies keyword filters from `portals.yml`, deduplicates against `data/scan-history.tsv`, and writes new job URLs into `data/pipeline.md`.

No AI is used here — it's pure HTTP + JSON filtering.

---

## Stage 2 — Evaluation (Heavy AI)

This is where Claude does the real work. Triggered by `/career-ops oferta` or the auto-pipeline (when you paste a URL or JD).

**Steps Claude performs:**

1. **Fetch the JD** — uses Playwright (browser) to render SPAs, WebFetch as fallback
2. **Blocks A–G evaluation** — reads your `cv.md`, `article-digest.md`, `config/profile.yml`, and `modes/_profile.md`, then:
   - Classifies the role archetype (LLMOps, Agentic, SA, FDE, PM, Transformation)
   - Maps every JD requirement to specific lines in your CV
   - Scores salary vs. market (uses WebSearch for salary data)
   - Assesses cultural signals and red flags
   - Assesses posting legitimacy (ghost posting detection)
   - Produces a global 1–5 score
3. **Saves a `.md` report** to `reports/`

---

## Stage 3 — CV Generation (AI + Playwright)

`/career-ops pdf` — Claude does the text work, Playwright does the rendering:

1. **AI part**: reads your canonical `cv.md`, extracts 15–20 keywords from the JD, rewrites the Professional Summary, reorders bullet points by relevance, injects keywords naturally — never inventing facts
2. **Non-AI part**: writes the tailored CV as HTML to `/tmp/`, then `generate-pdf.mjs` (Playwright) renders it to a PDF in `output/`

---

## Stage 4 — Pipeline Processing

`/career-ops pipeline` processes all URLs queued in `data/pipeline.md`, running the full Stage 2+3 pipeline on each one.

**Batch mode** (`/career-ops batch`) spawns multiple parallel `claude -p` workers — each is a separate Claude invocation running `batch/batch-prompt.md` as a self-contained prompt, one per job offer. After all workers finish, `merge-tracker.mjs` stitches the results back into `data/applications.md`.

---

## Supporting AI Modes

| Mode             | What AI does                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `contacto`       | Researches LinkedIn targets via WebSearch, generates 3-sentence outreach by contact type       |
| `deep`           | Full company research report                                                                   |
| `interview-prep` | Generates STAR+R stories from your CV mapped to a specific company and role                    |
| `apply`          | Navigates application forms with Playwright, drafts answers — always stops before Submit       |
| `patterns`       | Reads all reports in `reports/`, analyzes rejection patterns, recommends targeting adjustments |
| `followup`       | Reads `data/applications.md`, calculates follow-up cadence                                     |
| `training`       | Evaluates a course or cert against your profile and target archetypes                          |
| `project`        | Evaluates a portfolio project idea for ROI on your job search                                  |

---

## Alternative LLM Evaluators

`gemini-eval.mjs` and `mistral-eval.mjs` run the same evaluation pipeline through Gemini and Mistral APIs respectively. They are alternative backends, not parallel workers — useful for comparing outputs or when Claude is unavailable.

---

## Memory Layer

`open-brain-client.mjs` connects to the Open Brain MCP server. This persists decisions, blockers, and session context across conversations so the AI agent retains continuity between sessions without relying on conversation history.

---

## AI vs. Not-AI at a Glance

| Step                                  | AI?                                     |
| ------------------------------------- | --------------------------------------- |
| Portal scanning (`scan.mjs`)          | No — pure HTTP                          |
| JD fetching                           | No — Playwright / WebFetch              |
| Role scoring and evaluation           | **Yes — Claude**                        |
| CV keyword injection and rewriting    | **Yes — Claude**                        |
| HTML → PDF rendering                  | No — Playwright                         |
| LinkedIn outreach drafting            | **Yes — Claude**                        |
| Application form answer drafting      | **Yes — Claude**                        |
| Rejection pattern analysis            | **Yes — Claude**                        |
| Salary market research                | Partial — WebSearch + Claude interprets |
| Tracker merging (`merge-tracker.mjs`) | No — deterministic Node.js              |
