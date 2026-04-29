#!/usr/bin/env node
/**
 * fill-form.mjs — Playwright-based job application form auto-filler
 *
 * Usage:
 *   node fill-form.mjs extract <URL>
 *   node fill-form.mjs fill <URL> --answers <path-to-answers.json>
 */

import { createHash } from "crypto";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

export const ROOT = dirname(fileURLToPath(import.meta.url));

const [, , subcommand, url, ...rest] = process.argv;

const USAGE = `
Usage:
  node fill-form.mjs extract <URL>
  node fill-form.mjs fill <URL> --answers <path>
`.trim();

if (!subcommand || !url) {
  console.error(USAGE);
  process.exit(1);
}

export function urlHash(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 8);
}

mkdirSync(`${ROOT}/output`, { recursive: true });

if (subcommand === "extract") {
  const { runExtract } = await import("./lib/extract-cmd.mjs");
  await runExtract(url);
} else if (subcommand === "fill") {
  const answersIdx = rest.indexOf("--answers");
  if (answersIdx === -1) {
    console.error("Missing --answers <path>");
    process.exit(1);
  }
  const answersPath = rest[answersIdx + 1];
  const { runFill } = await import("./lib/fill-cmd.mjs");
  await runFill(url, answersPath);
} else {
  console.error(`Unknown subcommand: ${subcommand}\n\n${USAGE}`);
  process.exit(1);
}
