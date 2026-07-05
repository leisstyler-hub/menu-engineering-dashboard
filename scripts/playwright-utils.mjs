import { join } from "node:path";
import { root } from "./release-utils.mjs";

export function playwrightEnvironment() {
  return {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || join(root, ".playwright-browsers"),
  };
}

export function playwrightBin() {
  return join(root, "node_modules", ".bin", process.platform === "win32" ? "playwright.CMD" : "playwright");
}
