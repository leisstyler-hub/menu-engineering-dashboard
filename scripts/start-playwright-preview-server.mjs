import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { root } from "./release-utils.mjs";

const viteBin = join(root, "node_modules", ".bin", process.platform === "win32" ? "vite.CMD" : "vite");
const shell = process.platform === "win32";

const build = spawnSync(viteBin, ["build"], {
  env: process.env,
  stdio: "inherit",
  shell,
});

if (build.error) {
  console.error(build.error.message);
}
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

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
  const url = new URL(requestUrl, "http://127.0.0.1:4174");
  const pathname = decodeURIComponent(url.pathname);
  const requested = normalize(pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""));
  const candidate = resolve(distRoot, requested);
  if (!candidate.startsWith(distRoot)) return join(distRoot, "index.html");
  if (!existsSync(candidate)) return join(distRoot, "index.html");
  if (statSync(candidate).isDirectory()) return join(distRoot, "index.html");
  return candidate;
}

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

server.listen(4174, "127.0.0.1", () => {
  console.log("Playwright preview server listening on http://127.0.0.1:4174");
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
