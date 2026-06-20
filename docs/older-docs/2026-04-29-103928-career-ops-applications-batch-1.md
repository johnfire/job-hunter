# Handoff: career-ops Batch 1 Applications — 2026-04-29

## Session Metadata

- Created: 2026-04-29 10:39:28
- Project: /home/christopher/programming/job-hunter
- Branch: main
- Session duration: ~4 hours

### Recent Commits (for context)

- 2c1c275 chore: auto-update system files to v1.3.0
- 2ed9d9b fix: tighten location filter to reject Remote-USA patterns
- a11fae8 feat: add location filter and --limit flag to scan.mjs

## Handoff Chain

- **Continues from**: None (this session covered full pipeline run + first application batch)
- **Supersedes**: None

## Current State Summary

Christopher ran the full career-ops pipeline on 50 queued job offers (Anthropic, Parloa, Intercom, ElevenLabs, Vercel, Deepgram, Arize AI, n8n, Cohere, DeepL, Black Forest Labs, Helsing). All 50 were evaluated and scored. Tailored PDFs and form answers were generated for the top-scoring roles. 4 applications were submitted today. 2 more are ready to submit (ElevenLabs #023 and Parloa #007) — Christopher is taking a break and will do those next session.

## Codebase Understanding

### Architecture Overview

- `data/pipeline.md`: inbox of URLs → all 50 moved to Processed with scores
- `data/applications.md`: master tracker — 60 rows (50 pipeline + duplicates from n8n batch; merge-tracker.mjs handles dedup)
- `reports/`: one markdown file per evaluation (NNN-company-role-date.md), Blocks A–G
- `output/`: generated PDFs (gitignored)
- `modes/_profile.md`: user customization layer — UPDATED this session with German language preference and company priority
- `portals.yml`: scanner config — UPDATED this session with 11 new German companies

### Critical Files

| File                               | Purpose                                                    | Relevance                  |
| ---------------------------------- | ---------------------------------------------------------- | -------------------------- |
| `data/applications.md`             | Master application tracker                                 | Source of truth for status |
| `data/pipeline.md`                 | All 50 offers processed — Pending section empty            | Do not re-process          |
| `output/cv-christopher-rehm-*.pdf` | Generated tailored CVs                                     | Ready to attach to forms   |
| `modes/_profile.md`                | User customization — archetypes, German pref, company pref | Updated this session       |
| `portals.yml`                      | Scanner config with 11 new German companies added          | Use on next scan           |
| `reports/023-elevenlabs-*.md`      | ElevenLabs eval report                                     | PDF ✅, ready to submit    |
| `reports/007-parloa-*.md`          | Parloa eval report                                         | PDF ✅, ready to submit    |

### Key Patterns Discovered

- Playwright constraint: NEVER run 2+ PDF-generating agents in parallel — generate-pdf.mjs uses Playwright, conflicts cause failures
- Arize AI EMEA roles (#030, #032): form has a US location disqualifier question — likely copy-paste error; Christopher should answer No and note the discrepancy, or email recruiting first
- Arize AI roles were confirmed US-only in practice despite "EMEA" label — Christopher chose not to apply
- contact info: car2187bus@pm.me | +49 176 82 060 154 | linkedin.com/in/christopher-r-3883921 (corrected earlier in this project — always use these)
- German is C1/engineering-level (Fachsprache) — treat as hard differentiator, not just "fluent"

## Work Completed

### Tasks Finished

- [x] Updated career-ops from v0.0.0 to v1.3.0
- [x] Evaluated all 50 pipeline offers (reports 001–060)
- [x] Generated PDFs for 9 top-scoring roles
- [x] Submitted 4 applications: Anthropic TDL, Vercel SA, Deepgram SA Europe, Deepgram Pre-Sales Europe
- [x] Generated PDFs + form answers for ElevenLabs #023 and Parloa #007 (ready to submit)
- [x] Updated modes/\_profile.md with German language preference and company priority
- [x] Added 11 German companies to portals.yml (Personio, TeamViewer, Scalable Capital, Scout24, Flix, Usercentrics, Merantix, Staffbase, Babbel, Pitch, REWE Digital)
- [x] Corrected contact info in cv.md, config/profile.yml, and memory

### Files Modified

| File                   | Changes                                             | Rationale                                                                                 |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `cv.md`                | Email + LinkedIn corrected                          | Old contact info was wrong                                                                |
| `config/profile.yml`   | Email + LinkedIn corrected                          | Same fix                                                                                  |
| `modes/_profile.md`    | Added German language + company preference sections | Christopher confirmed C1 engineering German, prefers German-HQ or German-branch companies |
| `portals.yml`          | Added 11 new German companies                       | Improve DACH market coverage on next scan                                                 |
| `data/applications.md` | 60 rows added/updated; 4 statuses = Applied         | All pipeline offers tracked                                                               |
| `data/pipeline.md`     | All 50 URLs moved to Processed                      | Pipeline inbox is empty                                                                   |

### Decisions Made

| Decision                                     | Options Considered                    | Rationale                                                             |
| -------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Skip Arize AI roles                          | Apply anyway vs. skip                 | Form has US location disqualifier; confirmed US-only in practice      |
| Skip n8n roles                               | Apply vs. skip                        | User decided to skip n8n entirely this round                          |
| Score German language as hard differentiator | General fluency vs. engineering-level | Christopher confirmed C1 Fachsprache — eliminates most EU competitors |
| Sequential PDF generation                    | Parallel vs. sequential               | Playwright can only run one instance at a time                        |

## Pending Work

## Immediate Next Steps

1. **Submit ElevenLabs** (#023, 3.8/5) — PDF ready at `output/cv-christopher-rehm-elevenlabs-2026-04-28.pdf`, apply at https://jobs.ashbyhq.com/elevenlabs/b95f7f0b-f22f-4fc4-9d9f-87f5485b0a1f — form answers in reports/023 or previous session context
2. **Submit Parloa** (#007, 3.8/5) — PDF ready at `output/cv-christopher-rehm-parloa-2026-04-28.pdf`, apply at https://job-boards.eu.greenhouse.io/parloa/jobs/4688953101 — form answers in reports/007 or previous session context
3. **Decide on Intercom** (#016, #018) — 3.8–3.9/5 but require Berlin relocation. Ask Christopher if he's open to it before generating PDFs.
4. **Consider Deepgram Pre-Sales companion** — already submitted SA Europe (#026) and Pre-Sales (#025); both Deepgram apps filed
5. **Run next scan** — portals.yml now has 11 new German companies; run `/career-ops scan` to find new DACH opportunities

### Blockers/Open Questions

- [ ] Intercom roles: Berlin relocation required — Christopher has not confirmed willingness
- [ ] Arize AI EMEA roles: disqualifier question may be a form error — Christopher chose to skip for now; could revisit if recruiting confirms it's an error

### Deferred Items

- n8n roles (4.4, 4.3, 4.2, 3.9, 3.8/5) — user chose to skip this round; high scores if he reconsiders
- Anthropic FDE (#001, 3.8/5) — Python-primary gap + Native German requirement flagged; skipped
- ElevenLabs role 3 months on market — worth checking if still active before submitting

## Context for Resuming Agent

## Important Context

- **Applied today (2026-04-29):** #006 Anthropic TDL, #024 Vercel SA, #026 Deepgram SA Europe, #025 Deepgram Pre-Sales Europe
- **PDF ready, not yet submitted:** #023 ElevenLabs Enterprise SE EU, #007 Parloa EM
- **Contact info (always use these):** car2187bus@pm.me | +49 176 82 060 154 | linkedin.com/in/christopher-r-3883921 | github.com/johnfire
- **German:** C1/fluent, engineering-level (Fachsprache) — treat as hard differentiator in all CVs and cover letters for DACH roles
- **Company preference:** German-HQ > German-branch international > US-centric EMEA remote
- **Location:** Klosterlechfeld, Bavaria, Germany (86836) — remote preferred, open to hybrid Bavaria/Munich
- **Comp target:** €65,000–€90,000 EUR (but several applied roles are likely €90k–€130k+ — Christopher may be under-pricing himself)
- **Available:** Immediately, no notice period
- **Work auth:** Unrestricted Germany/EU — always answer "No" to sponsorship questions
- **n8n:** User explicitly skipped — do not bring up unless user asks

### Assumptions Made

- Arize AI EMEA roles are effectively US-only (form disqualifier confirmed) — do not recommend applying unless user asks
- Intercom roles require Berlin relocation — confirm with user before generating PDFs
- German C1 = Fachsprache level, not just conversational — use this framing in all applications

### Potential Gotchas

- Never run 2+ PDF agents in parallel — Playwright conflicts
- applications.md was modified by a linter during the session — always re-read before editing
- pipeline.md Pending section is empty — don't accidentally re-process the 50 already-evaluated offers
- PDF filenames use date 2026-04-28 even though applications were submitted 2026-04-29 (generation date vs. submission date — this is fine, don't rename)

## Environment State

### Tools/Services Used

- career-ops v1.3.0
- generate-pdf.mjs (Playwright) — sequential only
- merge-tracker.mjs — used to merge 50 TSV files into applications.md
- Greenhouse JSON API + Ashby API — used for form field analysis
- Subagents (general-purpose) — for parallel evaluation and sequential PDF generation

### Active Processes

- None — all background agents completed

### Environment Variables

- No special env vars required for this workflow

## Related Resources

- All 60 evaluation reports: `reports/` directory
- Pipeline status: `data/pipeline.md` (all Processed)
- Application tracker: `data/applications.md`
- Generated PDFs: `output/` directory
- Scanner config: `portals.yml`
- User profile: `modes/_profile.md`, `config/profile.yml`
