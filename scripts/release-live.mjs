import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAppVersion,
  getGitStatus,
  getGhToken,
  getToolPaths,
  getVercelProject,
  isReleaseSyncCandidate,
  root,
  run,
  runChecked,
} from "./release-utils.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipDeploy = args.has("--skip-vercel");
const skipGitHub = args.has("--skip-github");
const allowPartialSourceSync = args.has("--allow-partial-source-sync");
const allowLiveOnly = args.has("--allow-live-only");

function argValue(name) {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : "";
}

function releaseFilesFromArgs() {
  if (args.has("--sync-all")) return [];
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
  return aliasMatch?.[1] || productionMatch?.[1] || "https://project-d8v25.vercel.app";
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

function githubContentPath(path) {
  return path.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");
}

async function githubContentExists(token, repo, path, ref) {
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${githubContentPath(path)}?ref=${encodeURIComponent(ref)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};
    throw new Error(`GitHub API GET contents/${path} failed: ${response.status} ${json.message || text}`);
  }
  return true;
}

async function changedTextFilesFromGit(tools) {
  const status = await getGitStatus(tools);
  if (!status.available) return [];
  return status.changedFiles
    .map((entry) => entry.path)
    .filter(isReleaseSyncCandidate);
}

function formatFileList(files) {
  const preview = files.slice(0, 12).join(", ");
  return files.length > 12 ? `${preview}, and ${files.length - 12} more` : preview;
}

async function preflightReleaseSource(tools) {
  const explicitFiles = releaseFilesFromArgs();
  const changedFiles = await changedTextFilesFromGit(tools);
  const filesToSync = explicitFiles.length ? explicitFiles : changedFiles;

  if (skipGitHub && !skipDeploy && changedFiles.length && !allowLiveOnly) {
    throw new Error(
      `Release source guard stopped publish: ${changedFiles.length} changed file(s) would deploy without syncing to GitHub. ` +
      "Remove --skip-github, commit/sync the source first, or pass --allow-live-only for a deliberate emergency deploy."
    );
  }

  if (explicitFiles.length && changedFiles.length && !allowPartialSourceSync) {
    const explicitSet = new Set(explicitFiles.map((file) => file.replace(/\\/g, "/")));
    const omitted = changedFiles.filter((file) => !explicitSet.has(file.replace(/\\/g, "/")));
    if (omitted.length) {
      throw new Error(
        `Release source guard stopped publish: ${omitted.length} changed file(s) would deploy but not sync to GitHub: ${formatFileList(omitted)}. ` +
        "Use --sync-all, add every changed app file to --github-files, or pass --allow-partial-source-sync only for an intentional source-only patch."
      );
    }
  }

  if (filesToSync.length) {
    console.log(`[info] Release source guard will sync ${filesToSync.length} changed file(s) before deploying.`);
  } else {
    console.log("[info] Release source guard found no changed source files to sync.");
  }

  return filesToSync;
}

async function syncSourceToGitHub(tools, guardedFiles = null) {
  if (skipGitHub) {
    console.log("[skip] GitHub source sync skipped by --skip-github");
    return null;
  }

  const token = await getGhToken(tools.gh);
  if (!token) throw new Error("GitHub source sync is not authenticated. Run gh auth login or set GH_TOKEN.");

  const files = guardedFiles || await changedTextFilesFromGit(tools);
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
    if (!existsSync(absolute)) {
      const remoteExists = await githubContentExists(token, repo, path, baseSha);
      if (!remoteExists) {
        console.log(`[info] GitHub source already deleted: ${path}`);
        continue;
      }
      tree.push({ path, mode: "100644", type: "blob", sha: null });
      continue;
    }
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
  const guardedFiles = await preflightReleaseSource(tools);
  await syncSourceToGitHub(tools, guardedFiles);
  const liveUrl = await deployToVercel(tools);
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
