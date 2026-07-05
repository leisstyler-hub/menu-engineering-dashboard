import { spawnSync } from "node:child_process";
import { playwrightBin, playwrightEnvironment } from "./playwright-utils.mjs";

const result = spawnSync(playwrightBin(), ["install", "chromium"], {
  env: playwrightEnvironment(),
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
