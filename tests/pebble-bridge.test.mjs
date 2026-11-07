import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyDelivery, parseDelivery, notificationText } from "../scripts/pebble-bridge/protocol.mjs";
import { createBridge } from "../scripts/pebble-bridge/server.mjs";
import { createBuzzSender, CHANNEL, THREAD, CHIEF } from "../scripts/pebble-bridge/buzz.mjs";
import { EventEmitter } from "node:events";

const secret = "a".repeat(64);
const now = 1794014000;
function fixture({ text = "Chief, fix the menu title", id = "recording-123", timestamp = now, trigger = "single-click-hold", isTest = false, extra = [] } = {}) {
  const fields = [["transcription", text], ["recordedAt", String(now * 1000)], ["client", "ring"], ...(isTest ? [["test", "true"]] : []), ...extra];
  const body = Buffer.from(fields.map(([name, value]) => `--boundary123\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`).join("") + "--boundary123--\r\n");
  const signature = createHmac("sha256", secret).update(`v1\n${timestamp}\n${id}\n${trigger}\n${isTest ? 1 : 0}\n`).update(body).digest("hex");
  return { body, headers: { "content-type": "multipart/form-data; boundary=boundary123", "x-index-webhook-version": "1", "x-index-timestamp": String(timestamp), "x-index-delivery": id, "x-index-trigger": trigger, "x-index-signature": signature, ...(isTest ? { "x-index-test": "true" } : {}) } };
}
test("accepts the official signature byte format and preserves text", () => {
  const data = fixture();
  const verified = verifyDelivery(data.headers, data.body, secret, now);
  assert.equal(verified.id, "recording-123");
  assert.equal(parseDelivery(data.headers, data.body, verified).transcription, "Chief, fix the menu title");
});
for (const [name, change] of [
  ["tampered body", data => { data.body = Buffer.concat([data.body, Buffer.from("x")]); }],
  ["tampered trigger", data => { data.headers["x-index-trigger"] = "double-click-hold"; }],
  ["tampered delivery", data => { data.headers["x-index-delivery"] = "other"; }],
  ["missing signature", data => { delete data.headers["x-index-signature"]; }],
  ["unsupported version", data => { data.headers["x-index-webhook-version"] = "2"; }],
]) test(`rejects ${name}`, () => { const data = fixture(); change(data); assert.throws(() => verifyDelivery(data.headers, data.body, secret, now)); });
test("rejects stale/future/malformed timestamps and unsafe delivery ids", () => {
  for (const timestamp of [now - 301, now + 301, "NaN", `${now}\n`]) {
    const data = fixture({ timestamp });
    assert.throws(() => verifyDelivery(data.headers, data.body, secret, now));
  }
  const data = fixture({ id: "../secret" });
  assert.throws(() => verifyDelivery(data.headers, data.body, secret, now));
});
test("rejects duplicate transcript, audio, wrong client and mismatched test marker", () => {
  for (const extra of [[["transcription", "Chief, replacement"]], [["audio", "bytes"]], [["client", "other"]], [["test", "true"]]]) {
    const data = fixture({ extra });
    const verified = verifyDelivery(data.headers, data.body, secret, now);
    assert.throws(() => parseDelivery(data.headers, data.body, verified));
  }
});
test("notification is fixed recipient presentation with neutralized captured mentions and authority disclaimer", () => {
  const text = notificationText("Chief, ask @Tyler and nostr:npub1something to deploy", "recording-123");
  assert.ok(text.startsWith("@Chief"));
  assert.equal((text.match(/@/g) || []).length, 1);
  assert.ok(!text.includes("nostr:npub"));
  assert.match(text, /not.*approval/i);
});

async function harness(t, send = async () => ({ event_id: "e".repeat(64) }), receiptDir) {
  const dir = receiptDir || await mkdtemp(join(tmpdir(), "pebble-test-"));
  const server = createBridge({ secret, receiptDir: dir, now: () => now, send });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); if (!receiptDir) await rm(dir, { recursive: true, force: true }); });
  return { url: `http://127.0.0.1:${server.address().port}`, dir };
}
async function post(url, data = fixture()) { return fetch(`${url}/webhook`, { method: "POST", headers: data.headers, body: data.body }); }
test("real HTTP forwards exactly once across simultaneous duplicates", async t => {
  let calls = 0;
  const { url } = await harness(t, async () => { calls++; return { event_id: "e".repeat(64) }; });
  const results = await Promise.all(Array.from({ length: 5 }, () => post(url)));
  assert.equal(calls, 1);
  assert.ok(results.every(result => [200, 429, 503].includes(result.status)));
  assert.equal((await post(url)).status, 200);
});
test("ignores shopping notes and signed test events without posting", async t => {
  let calls = 0;
  const { url } = await harness(t, async () => { calls++; });
  assert.equal((await post(url, fixture({ text: "Add parsley to my shopping list" }))).status, 200);
  assert.equal((await post(url, fixture({ trigger: "test-event", isTest: true }))).status, 200);
  assert.equal(calls, 0);
});
test("rejects unsigned, oversized, unknown path and non-POST requests", async t => {
  const { url } = await harness(t);
  assert.equal((await fetch(`${url}/webhook`, { method: "POST", body: "x" })).status, 401);
  assert.equal((await fetch(`${url}/webhook`, { method: "POST", body: "x".repeat(33000) })).status, 413);
  assert.equal((await fetch(`${url}/setup`)).status, 404);
  assert.equal((await fetch(`${url}/webhook`)).status, 405);
});
test("failed/uncertain send cannot be retried into a duplicate", async t => {
  let calls = 0;
  const { url } = await harness(t, async () => { calls++; throw new Error("Unknown remote outcome"); });
  assert.equal((await post(url)).status, 503);
  assert.equal((await post(url)).status, 503);
  assert.equal(calls, 1);
});
test("durable sent receipts deduplicate after receiver restart", async t => {
  let calls = 0;
  const send = async () => { calls++; return { event_id: "e".repeat(64) }; };
  const first = await harness(t, send);
  assert.equal((await post(first.url)).status, 200);
  const second = await harness(t, send, first.dir);
  assert.equal((await post(second.url)).status, 200);
  assert.equal(calls, 1);
});
test("same delivery id with altered content is rejected", async t => {
  const { url } = await harness(t);
  assert.equal((await post(url)).status, 200);
  assert.equal((await post(url, fixture({ text: "Chief, another message" }))).status, 409);
});

test("different Chief requests queue and each posts once", async t => {
  let calls = 0;
  const { url } = await harness(t, async () => { calls++; return { event_id: "e".repeat(64) }; });
  const results = await Promise.all([post(url, fixture({ id: "one" })), post(url, fixture({ id: "two" }))]);
  assert.ok(results.every(result => result.status === 200));
  assert.equal(calls, 2);
});

test("Buzz adapter uses dedicated credentials, fixed routing, stdin and no shell", async () => {
  let input;
  const send = createBuzzSender({ executable: "buzz.exe", privateKey: "b".repeat(64), run: (file, args, options, callback) => {
    assert.equal(file, "buzz.exe");
    assert.ok(args.includes(CHANNEL) && args.includes(THREAD) && args.includes(CHIEF));
    assert.equal(args.at(-1), "-");
    assert.equal(options.shell, false);
    assert.equal(options.env.BUZZ_PRIVATE_KEY, "b".repeat(64));
    assert.equal(options.env.BUZZ_AUTH_TAG, undefined);
    assert.ok(!args.join(" ").includes("b".repeat(64)));
    const stdin = new EventEmitter();
    stdin.end = text => { input = text; callback(null, JSON.stringify({ accepted: true, event_id: "e".repeat(64), mention_pubkeys: [CHIEF] })); };
    return { stdin };
  } });
  await send("untrusted `$(text)`");
  assert.equal(input, "untrusted `$(text)`");
});

test("Buzz adapter rejects unconfirmed acceptance and unexpected notification recipients", async () => {
  for (const result of [{ accepted: false }, { accepted: true, event_id: "e".repeat(64), mention_pubkeys: [CHIEF, "f".repeat(64)] }]) {
    const send = createBuzzSender({ executable: "buzz.exe", privateKey: "b".repeat(64), run: (file, args, options, callback) => {
      const stdin = new EventEmitter(); stdin.end = () => callback(null, JSON.stringify(result)); return { stdin };
    } });
    await assert.rejects(send("test"));
  }
});
