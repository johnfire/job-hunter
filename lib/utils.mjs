import { createHash } from "crypto";
import { dirname } from "path";
import { fileURLToPath } from "url";

export const ROOT = dirname(fileURLToPath(import.meta.url + "/.."));

export function urlHash(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 8);
}
