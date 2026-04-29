import { readFileSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

export function loadProfile(rootDir) {
  const raw = readFileSync(join(rootDir, "config/profile.yml"), "utf-8");
  const p = yaml.load(raw);
  const c = p.candidate;

  const nameParts = (c.full_name || "").split(" ");
  const locationParts = (c.location || "").split(",").map((s) => s.trim());

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    fullName: c.full_name || "",
    email: c.email || "",
    phone: c.phone || "",
    location: c.location || "",
    city: locationParts[0] || "",
    country: locationParts.at(-1) || "",
    linkedinUrl: c.linkedin_url || "",
    githubUrl: c.github_url || "",
    portfolioUrl: c.portfolio_url || "",
    salaryMin: p.compensation?.minimum || "",
    salaryTarget: p.compensation?.target_range || "",
    currency: p.compensation?.currency || "EUR",
    workAuth: c.visa_status || "Authorized to work",
  };
}
