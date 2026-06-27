import { existsSync } from "node:fs";
import { getAppVersion, getGhToken, getToolPaths, getVercelProject, printCheck, readText, run } from "./release-utils.mjs";

const jsonMode = process.argv.includes("--json");
const checks = [];

function add(label, state, detail = "") {
  checks.push({ label, state, detail });
  if (!jsonMode) printCheck(label, state, detail);
}

if (!jsonMode) {
  console.log("Release Health");
  console.log("No secret values are printed.");
}

const tools = getToolPaths();
const project = getVercelProject();
const appVersion = getAppVersion();

add("App version", appVersion === "unknown" ? "fail" : "pass", appVersion);
add("Package verify script", readText("package.json").includes("\"verify\"") ? "pass" : "fail", "required before every release");
add("Package release commands", readText("package.json").includes("release:live") ? "pass" : "fail", "release:health and release:live");
add("Vercel project link", project?.projectId && project?.orgId ? "pass" : "fail", project ? `${project.projectName || "project"} / ${project.projectId}` : ".vercel/project.json missing");
add("pnpm available", tools.pnpm ? "pass" : "fail", tools.pnpm || "set PNPM_PATH or install pnpm");
add("GitHub CLI", tools.gh ? "pass" : "warn", tools.gh || "GH_TOKEN/GITHUB_TOKEN can be used instead");
add("Vercel deploy", tools.vercel || process.env.VERCEL_TOKEN ? "pass" : "fail", tools.vercel ? tools.vercel : "set VERCEL_CLI_PATH or VERCEL_TOKEN");

const token = await getGhToken(tools.gh);
add("GitHub source sync", token ? "pass" : "fail", token ? "authenticated without printing token" : "run gh auth login or set GH_TOKEN");

if (tools.gh) {
  const result = await run(tools.gh, ["auth", "status", "--hostname", "github.com"], { capture: true });
  add("GitHub auth status", result.code === 0 ? "pass" : "warn", result.code === 0 ? "ready" : "gh exists but is not authenticated");
}

if (tools.vercel && existsSync(tools.vercel)) {
  const result = await run(tools.vercel, ["--version"], { capture: true });
  add("Vercel CLI status", result.code === 0 ? "pass" : "warn", result.code === 0 ? result.stdout.trim().split("\n")[0] : "vercel command did not answer");
}

const failed = checks.filter((check) => check.state === "fail");
const warnings = checks.filter((check) => check.state === "warn");

if (jsonMode) {
  console.log(JSON.stringify({ appVersion, project, checks, failed: failed.length, warnings: warnings.length }, null, 2));
}

if (!jsonMode) {
  console.log("");
  console.log(failed.length ? `Release health needs attention: ${failed.length} failed check(s).` : "Release health is ready enough to run release:live.");
}

process.exit(failed.length ? 1 : 0);
