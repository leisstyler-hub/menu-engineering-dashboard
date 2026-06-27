import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

export const root = process.cwd();

export function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

export function getAppVersion() {
  const match = readText("src/shared/appConfig.js").match(/APP_VERSION_STAMP\s*=\s*"([^"]+)"/);
  return match?.[1] || "unknown";
}

export function getVercelProject() {
  const path = join(root, ".vercel", "project.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function commandExists(command) {
  const paths = String(process.env.PATH || "").split(process.platform === "win32" ? ";" : ":");
  const names = process.platform === "win32" && !/\.(exe|cmd|bat)$/i.test(command)
    ? [`${command}.cmd`, `${command}.exe`, command]
    : [command];
  for (const folder of paths) {
    for (const name of names) {
      const candidate = join(folder, name);
      if (existsSync(candidate)) return normalizeWindowsExecutable(candidate);
    }
  }
  return null;
}

function safeChildren(path) {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

export function findExecutable(names, options = {}) {
  const explicit = options.envVar ? process.env[options.envVar] : null;
  if (explicit && existsSync(explicit)) return explicit;

  for (const name of names) {
    const fromPath = commandExists(name);
    if (fromPath) return fromPath;
  }

  const startDirs = options.startDirs || [];
  const maxDepth = options.maxDepth ?? 5;
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const queue = [];

  for (const dir of startDirs) {
    if (dir && existsSync(dir)) queue.push({ dir: resolve(dir), depth: 0 });
  }

  while (queue.length) {
    const { dir, depth } = queue.shift();
    for (const entry of safeChildren(dir)) {
      const full = join(dir, entry.name);
      if (entry.isFile() && wanted.has(entry.name.toLowerCase())) return normalizeWindowsExecutable(full);
      if (entry.isDirectory() && depth < maxDepth) {
        if (entry.name === ".git" || entry.name === ".pnpm-store") continue;
        queue.push({ dir: full, depth: depth + 1 });
      }
    }
  }

  return null;
}

function normalizeWindowsExecutable(path) {
  if (process.platform !== "win32") return path;
  if (/\.(cmd|bat|exe)$/i.test(path)) return path;
  for (const extension of [".cmd", ".CMD", ".exe", ".EXE", ".bat", ".BAT"]) {
    if (existsSync(`${path}${extension}`)) return `${path}${extension}`;
  }
  return path;
}

export function getToolPaths() {
  const workspace = dirname(root);
  const codexHome = resolve(workspace, "..", "..");
  const dependencyBin = resolve(dirname(process.execPath), "..", "..", "bin");
  return {
    git: findExecutable(["git.exe", "git"], {
      envVar: "GIT_PATH",
      startDirs: [workspace, codexHome],
      maxDepth: 7,
    }),
    pnpm: findExecutable(["pnpm.cmd", "pn.cmd", "pnpm", "pn"], {
      envVar: "PNPM_PATH",
      startDirs: [dependencyBin, workspace, codexHome],
      maxDepth: 7,
    }),
    gh: findExecutable(["gh.exe", "gh"], {
      envVar: "GH_CLI_PATH",
      startDirs: [workspace, codexHome],
      maxDepth: 10,
    }),
    vercel: findExecutable(["vercel.cmd", "vercel.CMD", "vercel"], {
      envVar: "VERCEL_CLI_PATH",
      startDirs: [join(workspace, "work"), workspace, codexHome],
      maxDepth: 12,
    }),
  };
}

export function run(command, args, options = {}) {
  return new Promise((resolvePromise) => {
    const commandSpec = commandForSpawn(command, args);
    const child = spawn(commandSpec.command, commandSpec.args, {
      cwd: options.cwd || root,
      env: { ...releaseEnv(), ...(options.env || {}) },
      shell: false,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";
    if (options.capture) {
      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    }

    child.on("error", (error) => resolvePromise({ code: 1, stdout, stderr: `${stderr}${error.message}` }));
    child.on("close", (code) => resolvePromise({ code, stdout, stderr }));
  });
}

function commandForSpawn(command, args) {
  if (process.platform !== "win32" || !/\.(cmd|bat)$/i.test(command)) {
    return { command, args };
  }
  const comspec = process.env.ComSpec || "cmd.exe";
  return { command: comspec, args: ["/d", "/c", command, ...args] };
}

export async function runChecked(command, args, options = {}) {
  const result = await run(command, args, options);
  if (result.code !== 0) {
    const detail = options.capture ? `\n${result.stderr || result.stdout}`.trim() : "";
    throw new Error(`${options.label || command} failed with exit code ${result.code}${detail ? `: ${detail}` : ""}`);
  }
  return result;
}

export function printCheck(label, state, detail) {
  const prefix = state === "pass" ? "[pass]" : state === "warn" ? "[warn]" : "[fail]";
  console.log(`${prefix} ${label}${detail ? ` - ${detail}` : ""}`);
}

export async function getGhToken(ghPath) {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (!ghPath) return null;
  const result = await run(ghPath, ["auth", "token", "--hostname", "github.com"], { capture: true });
  return result.code === 0 ? result.stdout.trim() : null;
}

export function releaseEnv() {
  const env = { ...process.env };
  const workspace = dirname(root);
  const ghConfig = join(workspace, "work", "gh-config");
  const workRoot = join(workspace, "work");
  const nodeDir = dirname(process.execPath);
  const dependencyBin = resolve(nodeDir, "..", "..", "bin");
  const separator = process.platform === "win32" ? ";" : ":";
  for (const dir of [nodeDir, dependencyBin]) {
    if (dir && existsSync(dir) && !String(env.PATH || "").split(separator).includes(dir)) {
      env.PATH = `${dir}${separator}${env.PATH || ""}`;
    }
  }
  if (!env.GH_CONFIG_DIR && existsSync(ghConfig)) {
    env.GH_CONFIG_DIR = ghConfig;
  }
  if (!env.XDG_DATA_HOME) env.XDG_DATA_HOME = join(workRoot, "xdg-data");
  if (!env.XDG_CONFIG_HOME) env.XDG_CONFIG_HOME = join(workRoot, "xdg-config");
  if (!env.XDG_CACHE_HOME) env.XDG_CACHE_HOME = join(workRoot, "xdg-cache");
  if (!env.VERCEL_CACHE_DIR) env.VERCEL_CACHE_DIR = join(workRoot, "vercel-cache");
  return env;
}
