import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function assertReleaseVersion(candidate, previous, history) {
  const parse = (value) => /^(\d{4}\.\d{2}\.\d{2})\.(\d{3})-.+$/.exec(value);
  const next = parse(candidate);
  if (!next) throw new Error("Invalid release version format: YYYY.MM.DD.NNN-description required.");
  if (candidate === previous) return; // Documentation-only publication.
  const prior = parse(previous);
  if (prior && next[1] < prior[1]) throw new Error("Release date cannot precede the shared release date.");
  const stamps = [...history.matchAll(/\b(\d{4}\.\d{2}\.\d{2})\.(\d{3})-[\w-]+/g)];
  const highest = Math.max(0, ...stamps.filter(match => match[1] === next[1]).map(match => Number(match[2])));
  if (Number(next[2]) <= highest) {
    throw new Error(`Daily release sequence is shared across all publishers. Use ${next[1]}.${String(highest + 1).padStart(3, "0")} or higher.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ref = process.argv[2] || "origin/main";
  const git = (...args) => execFileSync(process.env.GIT_PATH || "git", ["-c", `safe.directory=${process.cwd()}`, ...args], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const file = "src/shared/appConfig.js";
  const stamp = text => text.match(/APP_VERSION_STAMP\s*=\s*"([^"]+)"/)?.[1] || "";
  const previous = stamp(git("show", `${ref}:${file}`));
  const history = git("log", "--format=", "-p", ref, "--", file);
  assertReleaseVersion(stamp(readFileSync(file, "utf8")), previous, history);
  console.log(`Shared release version sequence passed against ${ref}.`);
}
