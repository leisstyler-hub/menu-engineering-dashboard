import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { playwrightBin, playwrightEnvironment } from "./playwright-utils.mjs";
import { root } from "./release-utils.mjs";

const localBaseUrl = "http://127.0.0.1:4174";
const shell = process.platform === "win32";
const viteBin = join(root, "node_modules", ".bin", process.platform === "win32" ? "vite.CMD" : "vite");
const distRoot = resolve(root, "dist");
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function safeFilePath(requestUrl = "/") {
  const url = new URL(requestUrl, localBaseUrl);
  const pathname = decodeURIComponent(url.pathname);
  const requested = normalize(pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""));
  const candidate = resolve(distRoot, requested);
  if (!candidate.startsWith(distRoot)) return join(distRoot, "index.html");
  if (!existsSync(candidate)) return join(distRoot, "index.html");
  if (statSync(candidate).isDirectory()) return join(distRoot, "index.html");
  return candidate;
}

function startServer() {
  const server = createServer((req, res) => {
    const filePath = safeFilePath(req.url);
    res.setHeader("Content-Type", mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream");
    createReadStream(filePath)
      .on("error", () => {
        res.statusCode = 500;
        res.end("Unable to read preview asset.");
      })
      .pipe(res);
  });
  return new Promise((resolveStart) => {
    server.listen(4174, "127.0.0.1", () => resolveStart(server));
  });
}

let server = null;
const env = playwrightEnvironment();

if (!env.PLAYWRIGHT_BASE_URL) {
  const build = spawnSync(viteBin, ["build"], {
    env,
    stdio: "inherit",
    shell,
  });
  if (build.error) {
    console.error(build.error.message);
  }
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
  server = await startServer();
  env.PLAYWRIGHT_BASE_URL = localBaseUrl;
}

const status = await new Promise((resolveRun) => {
  const child = spawn(playwrightBin(), ["test", ...process.argv.slice(2)], {
    env,
    stdio: "inherit",
    shell,
  });
  child.on("exit", (code) => resolveRun(code ?? 1));
  child.on("error", (error) => {
    console.error(error.message);
    resolveRun(1);
  });
});

if (server) {
  await new Promise((resolveClose) => server.close(resolveClose));
}

process.exit(status);
