import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createBridge } from "./server.mjs";
import { createBuzzSender } from "./buzz.mjs";

const state = resolve(process.env.PEBBLE_BRIDGE_STATE || "");
if (!process.env.PEBBLE_BRIDGE_STATE) throw new Error("PEBBLE_BRIDGE_STATE required");
const config = JSON.parse(readFileSync(join(state, "config.json"), "utf8"));
if (config.mode !== "forward") throw new Error("Bridge has not been enabled after review");
const server = createBridge({
  secret: config.signingSecret,
  receiptDir: join(state, "receipts"),
  send: createBuzzSender({ executable: config.buzzExecutable, privateKey: config.botPrivateKey }),
});
server.listen(4319, "127.0.0.1", () => {
  console.log("Pebble bridge listening on loopback port4319");
  process.send?.({ type: "ready", port: 4319 });
});
server.on("error", () => { console.error("Bridge could not start"); process.exit(1); });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
