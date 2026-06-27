import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAppVersion,
  getGhToken,
  getToolPaths,
  getVercelProject,
  root,
  run,
  runChecked,
} from "./release-utils.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipDeploy = args.has("--skip-vercel");
const skipGitHub = args.has("--skip-github");

function argValue(name) {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : "";
}

function releaseFilesFromArgs() {
  const explicit = argValue("--github-files") || process.env.RELEASE_SYNC_FILES || "";
  if (explicit.trim()) {
    return explicit.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function runPackageScript(scriptName) {
  return async (tools) => {
    if (!tools.pnpm) throw new Error("pnpm was not found. Run npm install -g pnpm, set PNPM_PATH, or run release:health.");
    await runChecked(tools.pnpm, ["run", scriptName], { label: `pnpm run ${scriptName}` });
  };
}

async function deployToVercel(tools) {
  if (skipDeploy) {
    console.log("[skip] Vercel deploy skipped by --skip-vercel");
    return null;
  }
  if (!tools.vercel) throw new Error("Vercel CLI was not found. Set VERCEL_CLI_PATH or run release:health.");
  if (dryRun) {
    console.log("[dry-run] Would deploy to Vercel production.");
    return null;
  }
  const result = await runChecked(tools.vercel, ["deploy", "--prod", "--yes"], {
    label: "Vercel production deploy",
    capture: true,
  });
  process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const aliasMatch = result.stdout.match(/Aliased\s+(https:\/\/[^\s]+)/);
  const productionMatch = result.stdout.match(/Production\s+(https:\/\/[^\s]+)/);
  return aliasMatch?.[1] || "https://project-d8v25.vercel.app" || productionMatch?.[1] || null;
}

async function githubApi(token, method, endpoint, body) {
  const response = await fetch(`https://api.github.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${response.status} ${json.message || text}`);
  }
  return json;
}

async function changedTextFilesFromGit(tools) {
  if (!tools.git) return [];
  const result = await run(tools.git, ["status", "--porcelain"], { capture: true });
  if (result.code !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^.. /, ""))
    .filter((path) => path && !path.endsWith("/") && existsSync(join(root, path)))
    .filter((path) => !path.startsWith("dist/") && !path.startsWith("node_modules/") && !path.startsWith(".git/"))
    .filter((path) => /\.(js|jsx|mjs|json|md|css|html|sql|yml|yaml|txt|csv)$/i.test(path));
}

async function syncSourceToGitHub(tools) {
  if (skipGitHub) {
    console.log("[skip] GitHub source sync skipped by --skip-github");
    return null;
  }

  const token = await getGhToken(tools.gh);
  if (!token) throw new Error("GitHub source sync is not authenticated. Run gh auth login or set GH_TOKEN.");

  const explicitFiles = releaseFilesFromArgs();
  const files = explicitFiles.length ? explicitFiles : await changedTextFilesFromGit(tools);
  if (!files.length) {
    console.log("[info] No local source changes detected for GitHub sync.");
    return null;
  }

  if (dryRun) {
    console.log(`[dry-run] Would sync ${files.length} file(s) to GitHub: ${files.join(", ")}`);
    return null;
  }

  const repo = "leisstyler-hub/menu-engineering-dashboard";
  const ref = await githubApi(token, "GET", `repos/${repo}/git/ref/heads/main`);
  const baseSha = ref.object.sha;
  const baseCommit = await githubApi(token, "GET", `repos/${repo}/git/commits/${baseSha}`);
  const tree = [];

  for (const path of files) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) continue;
    const content = readFileSync(absolute, "utf8");
    const blob = await githubApi(token, "POST", `repos/${repo}/git/blobs`, { content, encoding: "utf-8" });
    tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }

  if (!tree.length) {
    console.log("[info] No readable text files found for GitHub sync.");
    return null;
  }

  const newTree = await githubApi(token, "POST", `repos/${repo}/git/trees`, { base_tree: baseCommit.tree.sha, tree });
  const commit = await githubApi(token, "POST", `repos/${repo}/git/commits`, {
    message: `Release ${getAppVersion()}`,
    tree: newTree.sha,
    parents: [baseSha],
  });
  await githubApi(token, "PATCH", `repos/${repo}/git/refs/heads/main`, { sha: commit.sha, force: false });
  console.log(`[pass] GitHub source synced: ${commit.sha.slice(0, 7)}`);
  return commit.sha;
}

async function verifyLiveBundle(liveUrl, version) {
  if (dryRun) {
    console.log(`[dry-run] Would verify live bundle contains version ${version}`);
    return;
  }
  if (!liveUrl) return;
  const htmlResponse = await fetch(liveUrl);
  if (!htmlResponse.ok) throw new Error(`Live URL check failed: HTTP ${htmlResponse.status}`);
  const html = await htmlResponse.text();
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((match) => new URL(match[1], liveUrl).href);
  let bundle = "";
  for (const script of scripts) {
    const scriptResponse = await fetch(script);
    if (scriptResponse.ok) bundle += await scriptResponse.text();
  }
  if (!bundle.includes(version)) {
    throw new Error(`Live bundle does not contain version ${version}`);
  }
  console.log(`[pass] Live bundle contains version ${version}`);
}

async function main() {
  const version = getAppVersion();
  const project = getVercelProject();
  const tools = getToolPaths();

  console.log(`Release start: ${version}`);
  if (project?.projectId) console.log(`Vercel project: ${project.projectName || project.projectId}`);

  await runPackageScript("verify")(tools);
  const liveUrl = await deployToVercel(tools);
  await syncSourceToGitHub(tools);
  await verifyLiveBundle(liveUrl || "https://project-d8v25.vercel.app", version);

  console.log("Release complete");
  console.log(`Live URL: ${liveUrl || "https://project-d8v25.vercel.app"}`);
}

main().catch((error) => {
  console.error("");
  console.error("[fail] Release stopped");
  console.error(error.message);
  console.error("");
  console.error("Run `pnpm run release:health` for the fastest next fix.");
  process.exit(1);
});
