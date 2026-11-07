import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { supervise } from "../scripts/pebble-bridge/supervise.mjs";

function child() { const result = new EventEmitter(); result.killed = false; result.kill = () => { result.killed = true; }; return result; }
test("never exposes tunnel before receiver-specific ready message", () => {
  const receiver = child(); let tunnel;
  const stop = supervise(receiver, () => { tunnel = child(); return tunnel; }, () => {}, 1000);
  assert.equal(tunnel, undefined);
  receiver.emit("message", { type: "ready", port: 9999 });
  assert.equal(tunnel, undefined);
  receiver.emit("message", { type: "ready", port: 4319 });
  assert.ok(tunnel);
  receiver.emit("exit", 1);
  assert.ok(tunnel.killed);
  stop();
});
test("port binding failure prevents tunnel launch", () => {
  const receiver = child(); let launches = 0; let failed = false;
  const stop = supervise(receiver, () => { launches++; return child(); }, () => { failed = true; }, 1000);
  receiver.emit("exit", 1);
  assert.equal(launches, 0);
  assert.ok(failed);
  stop();
});
test("tunnel exit stops receiver", () => {
  const receiver = child(); const tunnel = child();
  const stop = supervise(receiver, () => tunnel, () => {}, 1000);
  receiver.emit("message", { type: "ready", port: 4319 });
  tunnel.emit("exit", 1);
  assert.ok(receiver.killed);
  stop();
});
