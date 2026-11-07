import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, openSync, closeSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { supervise } from "./supervise.mjs";

const state = process.env.PEBBLE_BRIDGE_STATE;
if (!state) throw new Error("PEBBLE_BRIDGE_STATE required");
const config = JSON.parse(readFileSync(join(state, "config.json"), "utf8"));
if (config.mode !== "forward") throw new Error("Independent review and activation required");
const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).trim();
if (sha !== config.codeSha || execFileSync("git", ["status", "--porcelain"], { encoding: "utf8", windowsHide: true }).trim()) throw new Error("Reviewed commit must match a clean worktree");
const env = {};
for (const key of ["SystemRoot", "WINDIR", "PATH", "PATHEXT", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA"]) if (process.env[key]) env[key] = process.env[key];
env.PEBBLE_BRIDGE_STATE = resolve(state);
const processes = [];
function start(file, args, name, ipc = false) {
  const log = openSync(join(state, `${name}.log`), "a", 0o600);
  const child = spawn(file, args, { env, windowsHide: true, stdio: ["ignore", log, log, ...(ipc ? ["ipc"] : [])], cwd: process.cwd() });
  closeSync(log);
  child.on("error", () => console.error(`${name} could not launch; inspect local logs`));
  processes.push({ name, pid: child.pid, executable: file });
  writeFileSync(join(state, "processes.json"), JSON.stringify({ sha, supervisor: process.pid, processes }, null, 2), { mode: 0o600 });
  return child;
}
const receiver = start(process.execPath, [fileURLToPath(new URL("./run.mjs", import.meta.url))], "receiver", true);
const stop = supervise(receiver, () => start(join(state, "cloudflared.exe"), ["tunnel", "--url", "http://127.0.0.1:4319", "--protocol", "http2", "--no-autoupdate", "--metrics", "127.0.0.1:4320"], "tunnel"), () => { console.error("Bridge stopped; receiver or tunnel unavailable"); process.exitCode = 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
console.log(JSON.stringify({ sha, supervisor: process.pid }));
