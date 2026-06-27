import { existsSync } from "node:fs";
import { getAppVersion, getGhToken, getGitStatus, getToolPaths, getVercelProject, printCheck, readText, run } from "./release-utils.mjs";

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

const gitStatus = await getGitStatus(tools);
if (gitStatus.available) {
  add(
    "Working tree",
    gitStatus.dirtyCount ? "warn" : "pass",
    gitStatus.dirtyCount ? `${gitStatus.dirtyCount} changed file(s); release:live will sync before deploy or stop` : "clean"
  );
  add(
    "Branch sync",
    gitStatus.behind ? "warn" : "pass",
    gitStatus.branchLine || "branch status unavailable"
  );
} else {
  add("Working tree", "warn", "git status unavailable");
}

async function githubSourceHasVersion(version) {
  const url = "https://raw.githubusercontent.com/leisstyler-hub/menu-engineering-dashboard/main/src/shared/appConfig.js";
  const response = await fetch(url);
  if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
  const text = await response.text();
  return { ok: text.includes(version), detail: text.includes(version) ? version : "GitHub main has a different app version" };
}

async function liveBundleHasVersion(version) {
  const liveUrl = "https://project-d8v25.vercel.app";
  const htmlResponse = await fetch(liveUrl);
  if (!htmlResponse.ok) return { ok: false, detail: `HTTP ${htmlResponse.status}` };
  const html = await htmlResponse.text();
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((match) => new URL(match[1], liveUrl).href);
  let bundle = "";
  for (const script of scripts) {
    const scriptResponse = await fetch(script);
    if (scriptResponse.ok) bundle += await scriptResponse.text();
  }
  return { ok: bundle.includes(version), detail: bundle.includes(version) ? version : "live bundle has a different app version" };
}

try {
  const source = await githubSourceHasVersion(appVersion);
  add("GitHub source version", source.ok ? "pass" : "warn", source.detail);
} catch (error) {
  add("GitHub source version", "warn", error.message);
}

try {
  const live = await liveBundleHasVersion(appVersion);
  add("Live app version", live.ok ? "pass" : "warn", live.detail);
} catch (error) {
  add("Live app version", "warn", error.message);
}

const failed = checks.filter((check) => check.state === "fail");
const warnings = checks.filter((check) => check.state === "warn");

if (jsonMode) {
  console.log(JSON.stringify({ appVersion, project, checks, failed: failed.length, warnings: warnings.length }, null, 2));
}

if (!jsonMode) {
  console.log("");
  if (failed.length) {
    console.log(`Release health needs attention: ${failed.length} failed check(s).`);
  } else if (warnings.length) {
    console.log(`Release health has ${warnings.length} warning(s). release:live will block unsafe drift before production deploy.`);
  } else {
    console.log("Release health is clean.");
  }
}

process.exit(failed.length ? 1 : 0);
