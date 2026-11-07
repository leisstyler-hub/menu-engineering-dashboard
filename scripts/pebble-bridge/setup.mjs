import { createECDH, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const state = process.env.PEBBLE_BRIDGE_STATE;
const buzzExecutable = process.env.PEBBLE_BUZZ_EXECUTABLE;
if (!state || !buzzExecutable) throw new Error("Explicit state directory and Buzz executable required");
const ecdh = createECDH("secp256k1");
ecdh.generateKeys();
const botPrivateKey = ecdh.getPrivateKey("hex");
const botPublicKey = ecdh.getPublicKey("hex", "compressed").slice(2);
mkdirSync(resolve(state), { recursive: true, mode: 0o700 });
const signingSecret = randomBytes(32).toString("hex");
writeFileSync(join(state, "config.json"), JSON.stringify({ botPrivateKey, botPublicKey, signingSecret, buzzExecutable, mode: "disabled" }, null, 2), { flag: "wx", mode: 0o600 });
writeFileSync(join(state, "SIGNING_SECRET.txt"), signingSecret, { flag: "wx", mode: 0o600 });
console.log(JSON.stringify({ botPublicKey, mode: "disabled", state: resolve(state) }));
