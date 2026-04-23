# Mode: scan — Portal Scanner (Offer Discovery)

Scans configured job portals, filters by title relevance, and adds new offers to the pipeline for later evaluation.

> **Note (v1.5+):** The default scanner (`scan.mjs` / `npm run scan`) is **zero-token** and only hits Greenhouse, Ashby, and Lever public APIs directly. The Playwright/WebSearch levels described below are the **agent** flow (run by Claude), not what `scan.mjs` does. If a company has no Greenhouse/Ashby/Lever API, `scan.mjs` will skip it — for those cases the agent must complete Level 1 (Playwright) or Level 3 (WebSearch) manually.

## Recommended Execution

Run as a subagent to avoid consuming the main context window:

```
Agent(
    subagent_type="general-purpose",
    prompt="[contents of this file + specific data]",
    run_in_background=True
)
```

## Configuration

Read `portals.yml` which contains:

- `search_queries`: WebSearch queries with `site:` filters per portal (broad discovery)
- `tracked_companies`: Specific companies with `careers_url` for direct navigation
- `title_filter`: positive/negative/seniority_boost keywords for title filtering

## Discovery Strategy (3 levels)

### Level 1 — Playwright Direct (PRIMARY)

**For each company in `tracked_companies`:** Navigate to its `careers_url` with Playwright (`browser_navigate` + `browser_snapshot`), read ALL visible job listings, and extract title + URL from each. This is the most reliable method because:

- Sees the page in real time (no Google-cached results)
- Works with SPAs (Ashby, Lever, Workday)
- Detects new offers instantly
- Does not depend on Google indexing

**Every company MUST have `careers_url` in portals.yml.** If missing, find it once, save it, and use it in future scans.

### Level 2 — ATS APIs / Feeds (COMPLEMENTARY)

For companies with a public API or structured feed, use the JSON/XML response as a fast complement to Level 1.

**Supported endpoints (variables in `{}`):**

- **Greenhouse:** `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- **Ashby:** `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Lever:** `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor:** `https://{company}.teamtailor.com/jobs.rss`
- **Workday:** `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**Parsing conventions per provider:**

- `greenhouse`: `jobs[]` → `title`, `absolute_url`
- `ashby`: POST GraphQL `ApiJobBoardWithTeams` with `organizationHostedJobsPageName={company}` → `jobBoard.jobPostings[]` (`title`, `id`)
- `bamboohr`: list `result[]` → `jobOpeningName`, `id`; GET detail for full JD → `result.jobOpening` (`jobOpeningName`, `description`, `jobOpeningShareUrl`)
- `lever`: root array `[]` → `text`, `hostedUrl` (fallback: `applyUrl`)
- `teamtailor`: RSS items → `title`, `link`
- `workday`: `jobPostings[]` → `title`, `externalPath`

### Level 3 — WebSearch Queries (BROAD DISCOVERY)

`search_queries` with `site:` filters cover portals cross-sectionally (all Ashby, all Greenhouse, etc.). Useful for discovering NEW companies not yet in `tracked_companies`, but results may be stale.

**Execution priority:**

1. Level 1: Playwright → all `tracked_companies` with `careers_url`
2. Level 2: API → all `tracked_companies` with `api:`
3. Level 3: WebSearch → all `search_queries` with `enabled: true`

Levels are additive — run all, mix results, then deduplicate.

## Workflow

1. **Read config:** `portals.yml`
2. **Read history:** `data/scan-history.tsv` → already-seen URLs
3. **Read dedup sources:** `data/applications.md` + `data/pipeline.md`

4. **Level 1 — Playwright scan** (parallel in batches of 3-5):
   For each company in `tracked_companies` with `enabled: true` and `careers_url` defined:
   a. `browser_navigate` to `careers_url`
   b. `browser_snapshot` to read all job listings
   c. If the page has filters/departments, navigate relevant sections
   d. Extract `{title, url, company}` from each listing
   e. If paginated, navigate additional pages
   f. Accumulate in candidates list
   g. If `careers_url` returns 404/redirect, fall back to `scan_query` and flag for URL update

5. **Level 2 — ATS APIs / feeds** (parallel):
   For each company in `tracked_companies` with `api:` and `enabled: true`:
   a. WebFetch the API/feed URL
   b. Infer provider from domain if `api_provider` not set
   c. For **Ashby**: send POST with `operationName: ApiJobBoardWithTeams` + GraphQL query
   d. For **BambooHR**: list endpoint gives metadata only — GET detail for each relevant item
   e. For **Workday**: POST `{"appliedFacets":{},"limit":20,"offset":0,"searchText":""}` and paginate by offset
   f. Normalize each result to `{title, url, company}`
   g. Accumulate (dedup with Level 1)

6. **Level 3 — WebSearch queries** (parallel where possible):
   For each query in `search_queries` with `enabled: true`:
   a. Execute WebSearch with the defined `query`
   b. Extract `{title, url, company}` from each result
   - **title:** from result title (before " @ " or " | ")
   - **company:** after " @ " in the title, or extract from domain/path
     c. Accumulate (dedup with Levels 1+2)

7. **Filter by title** using `title_filter` from `portals.yml`:
   - At least 1 `positive` keyword must appear in the title (case-insensitive)
   - 0 `negative` keywords may appear
   - `seniority_boost` keywords give priority but are not required

8. **Deduplicate** against 3 sources:
   - `scan-history.tsv` → exact URL already seen
   - `applications.md` → company + normalized role already evaluated
   - `pipeline.md` → exact URL already pending or processed

8.5. **Verify liveness of Level 3 results** — BEFORE adding to pipeline:

WebSearch results may be stale (Google caches results for weeks or months). Verify with Playwright each new URL from Level 3. Levels 1 and 2 are inherently real-time and don't need this check.

For each new Level 3 URL (sequential — NEVER Playwright in parallel):
a. `browser_navigate` to the URL
b. `browser_snapshot` to read content
c. Classify: - **Active:** job title visible + role description + Apply/Submit button within main content (not just header/navbar/footer) - **Expired** (any of these signals): - Final URL contains `?error=true` (Greenhouse redirects closed offers this way) - Page contains: "job no longer available" / "no longer open" / "position has been filled" / "this job has expired" / "page not found" - Only navbar and footer visible, no JD content (content < ~300 chars)
d. If expired: record in `scan-history.tsv` with status `skipped_expired` and discard
e. If active: continue to step 9

**Do not abort the entire scan if one URL fails.** If `browser_navigate` errors (timeout, 403, etc.), mark as `skipped_expired` and continue.

9. **For each new verified offer that passes filters:**
   a. Add to `pipeline.md` Pending section: `- [ ] {url} | {company} | {title}`
   b. Record in `scan-history.tsv`: `{url}\t{date}\t{query_name}\t{title}\t{company}\tadded`

10. **Title-filtered offers:** record in `scan-history.tsv` with status `skipped_title`
11. **Duplicate offers:** record with status `skipped_dup`
12. **Expired offers (Level 3):** record with status `skipped_expired`

## Extracting Title and Company from WebSearch Results

Results come in formats like: `"Job Title @ Company"` or `"Job Title | Company"` or `"Job Title — Company"`.

Extraction patterns by portal:

- **Ashby:** `"Senior AI PM (Remote) @ EverAI"` → title: `Senior AI PM`, company: `EverAI`
- **Greenhouse:** `"AI Engineer at Anthropic"` → title: `AI Engineer`, company: `Anthropic`
- **Lever:** `"Product Manager - AI @ Temporal"` → title: `Product Manager - AI`, company: `Temporal`

Generic regex: `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## Private URLs

If a URL is not publicly accessible:

1. Save the JD to `jds/{company}-{role-slug}.md`
2. Add to pipeline.md as: `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan History

`data/scan-history.tsv` tracks ALL seen URLs:

```
url	first_seen	portal	title	company	status
https://...	2026-04-23	Ashby — AI PM	PM AI	Acme	added
https://...	2026-04-23	Greenhouse — SA	Junior Dev	BigCo	skipped_title
https://...	2026-04-23	Ashby — AI PM	SA AI	OldCo	skipped_dup
https://...	2026-04-23	WebSearch — AI PM	PM AI	ClosedCo	skipped_expired
```

## Output Summary

```
Portal Scan — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries run: N
Offers found: N total
Title-filtered: N relevant
Duplicates: N (already evaluated or in pipeline)
Expired discarded: N (dead links, Level 3)
New added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...

→ Run /career-ops pipeline to evaluate the new offers.
```

## careers_url Management

**RULE: Always use the company's own corporate URL; fall back to the ATS endpoint only if no corporate careers page exists.**

| Correct (corporate)              | Incorrect as first choice (ATS direct)     |
| -------------------------------- | ------------------------------------------ |
| `https://careers.mastercard.com` | `https://mastercard.wd1.myworkdayjobs.com` |
| `https://openai.com/careers`     | `https://job-boards.greenhouse.io/openai`  |
| `https://stripe.com/jobs`        | `https://jobs.lever.co/stripe`             |

**Known URL patterns per platform:**

- **Ashby:** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse:** `https://job-boards.greenhouse.io/{slug}` or `https://job-boards.eu.greenhouse.io/{slug}`
- **Lever:** `https://jobs.lever.co/{slug}`
- **BambooHR:** `https://{company}.bamboohr.com/careers/list`
- **Teamtailor:** `https://{company}.teamtailor.com/jobs`
- **Workday:** `https://{company}.{shard}.myworkdayjobs.com/{site}`

**If `careers_url` is missing:** Search `"{company}" careers jobs`, verify with Playwright, save to portals.yml.

**If `careers_url` returns 404:** Note in output summary, try scan_query fallback, flag for manual update.

## portals.yml Maintenance

- **Always save `careers_url`** when adding a new company
- Add queries as new portals or roles are discovered
- Disable noisy queries with `enabled: false`
- Adjust filter keywords as target roles evolve
- Verify `careers_url` periodically — companies change ATS platforms
