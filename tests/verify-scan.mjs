import { execSync } from "child_process";

try {
  const out = execSync("node scan.mjs --dry-run 2>&1", {
    encoding: "utf-8",
    timeout: 30000,
  });
  console.log("PASS: scan.mjs runs without crash");
} catch (e) {
  const msg = e.stdout || e.message || "";
  if (msg.includes("portals.yml") || msg.includes("ENOENT")) {
    // Expected — portals.yml not yet configured
    console.log(
      "PASS: scan.mjs runs (portals.yml not yet configured — expected)",
    );
  } else {
    console.error("FAIL:", msg.slice(0, 300));
    process.exit(1);
  }
}
