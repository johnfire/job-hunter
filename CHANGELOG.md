# Changelog

## 1.0.0 (2026-04-30)


### Features

* add A-G job evaluation mode (translated to English) ([aca6be9](https://github.com/johnfire/job-hunter/commit/aca6be9e87315f176dfc5a66abaeeddaaead33e2))
* add agent brain (CLAUDE.md) — routing, onboarding, data contract ([e2b78fb](https://github.com/johnfire/job-hunter/commit/e2b78fbb688953d0f558702a945cf32507089755))
* add Ashby and Lever form extractors with Playwright tests ([9d71c97](https://github.com/johnfire/job-hunter/commit/9d71c97c73ca1e72313bcc75014913b9b63f8603))
* add ATS platform detection ([df00086](https://github.com/johnfire/job-hunter/commit/df000862da704e4819e8acffdb63f25f687bb88e))
* add ATS-optimized CV HTML template with Space Grotesk/DM Sans ([55df8f3](https://github.com/johnfire/job-hunter/commit/55df8f3a56da8865bb190babf35cdadca60739ca))
* add ATS-optimized PDF generation mode (HTML/Playwright + optional Canva) ([7db0a5b](https://github.com/johnfire/job-hunter/commit/7db0a5b2cab1ae0d1edc8bfcedabbf5541c463e3))
* add auto-pipeline mode (evaluate + PDF + tracker in one step) ([9b9125b](https://github.com/johnfire/job-hunter/commit/9b9125bee0d3bc9d5ca397b4dcc2916ae064b64f))
* add batch processing system (parallel claude -p workers + orchestrator) ([4593fce](https://github.com/johnfire/job-hunter/commit/4593fceb3c6234b14460b88e67672a0799183465))
* add Claude Code /career-ops skill with command router ([01bc3c9](https://github.com/johnfire/job-hunter/commit/01bc3c98e3a605eb5a923611efb7a85a48b7b0b3))
* add config templates (profile.example.yml, portals.example.yml) ([f2bf93a](https://github.com/johnfire/job-hunter/commit/f2bf93abfff21f99c40c80152217e718d6df71e5))
* add extract subcommand — headless field extraction to output/form-fields-*.json ([c8ebe10](https://github.com/johnfire/job-hunter/commit/c8ebe102afcc0fb538bc5d52c8bb6cec3da2da43))
* add field filler — fills text/textarea/select/radio/checkbox from answers JSON ([110b854](https://github.com/johnfire/job-hunter/commit/110b8542a99dd2e5cf75307c534d481a1b21d106))
* add fill subcommand — headful form fill with browser-open review pause ([8451534](https://github.com/johnfire/job-hunter/commit/84515347cb31d7b71226acd9446a63795e9a8416))
* add fill-form.mjs CLI skeleton and lib/ structure ([bcaf798](https://github.com/johnfire/job-hunter/commit/bcaf798a82d924b1fddcc730201c6b9b4a148857))
* add form extractor — Greenhouse + generic ATS adapters with Playwright tests ([e08061b](https://github.com/johnfire/job-hunter/commit/e08061b0e29da69b17bb8407d7ed3fef2151220f))
* add Gemini CLI support (GEMINI.md + 15 TOML commands) ([d5f7ae5](https://github.com/johnfire/job-hunter/commit/d5f7ae5e4969a497c9d711f09ea01918f82975c3))
* add Go Bubble Tea TUI dashboard source (build requires Go install) ([86c771b](https://github.com/johnfire/job-hunter/commit/86c771b95d31f8d776d8ef5c6fc1ddeb40a726b5))
* add location filter and --limit flag to scan.mjs ([a11fae8](https://github.com/johnfire/job-hunter/commit/a11fae8a48385ac6c28bd9f22b9a600446a87d48))
* add modes/batch.md — English translation of bulk offer processing mode ([36b3b28](https://github.com/johnfire/job-hunter/commit/36b3b287db4e4513a31e4bc58c97b910e264a806))
* add pipeline integrity checker (statuses, dupes, report links, formatting) ([d100460](https://github.com/johnfire/job-hunter/commit/d10046020401cee5c8cbd65c3d01c62efd7c07e5))
* add Playwright HTML-to-PDF generator with ATS Unicode normalization ([d2b18b8](https://github.com/johnfire/job-hunter/commit/d2b18b830bc1f8c333f2a870acca3418cb4d44bc))
* add portal scanner mode (3-level: Playwright + ATS APIs + WebSearch) ([11cf0ab](https://github.com/johnfire/job-hunter/commit/11cf0aba7d3bb0aa2f8afc509115eb3ea77bfaf3))
* add profile loader — reads config/profile.yml into normalized object ([898930c](https://github.com/johnfire/job-hunter/commit/898930ca9104c942266b7e15900ec814ea82b810))
* add remaining skill modes (tracker, apply, outreach, deep research, pipeline, etc.) ([a25245b](https://github.com/johnfire/job-hunter/commit/a25245bcf725bad8fddca07f2174dffda2b10a4e))
* add setup doctor (validates Node, Playwright, fonts, required user files) ([d7fba2e](https://github.com/johnfire/job-hunter/commit/d7fba2ec78a4147c184d646ea0758653b1a3e3c1))
* add shared scoring context (archetypes, scoring, legitimacy, global rules) ([43b2b65](https://github.com/johnfire/job-hunter/commit/43b2b65ee32853b40d0b80c90af0dd825eaa4e0d))
* add status normalizer, deduplicator, and canonical states config ([a434d22](https://github.com/johnfire/job-hunter/commit/a434d22ffc556faf3738696fcbbce723ea5231a4))
* add tracker merger (TSV batch additions -&gt; applications.md) ([3326a5c](https://github.com/johnfire/job-hunter/commit/3326a5c6dd75b7f8fb262d144a8faf448111f190))
* add user profile template (archetypes, narrative, negotiation placeholders) ([e3c114f](https://github.com/johnfire/job-hunter/commit/e3c114f873e0479cd4e8f776063528cbfbe6c896))
* add utility scripts (sync-check, update-system, patterns, liveness, gemini-eval) ([17cd201](https://github.com/johnfire/job-hunter/commit/17cd20129bea62d893a178b05159da56e5719870))
* add zero-token portal scanner (Greenhouse/Ashby/Lever APIs) ([a4bdbe2](https://github.com/johnfire/job-hunter/commit/a4bdbe23c330481db856f75ddb902d730263ac56))


### Bug Fixes

* add dashboard/internal/data/career.go, exclude from data/ gitignore ([086ba67](https://github.com/johnfire/job-hunter/commit/086ba67c6d2db394cfe189abb5969b7fb176a7cb))
* Ashby apply-button reveal + selector fix; add handoffs, plan docs, and base docs ([33646cf](https://github.com/johnfire/job-hunter/commit/33646cf405657362b158091245ecc093d46af126))
* tighten location filter to reject Remote-USA patterns ([2ed9d9b](https://github.com/johnfire/job-hunter/commit/2ed9d9bd866c8b62ea2348b60d52dc263e624048))
