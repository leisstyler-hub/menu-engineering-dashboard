import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdirSync, accessSync, constants } from "node:fs";
import { open, readFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { MAX_BODY, fault, verifyDelivery, parseDelivery, notificationText } from "./protocol.mjs";

export function createBridge({ secret, receiptDir, send, now = () => Math.floor(Date.now() / 1000) }) {
  if (typeof secret !== "string" || secret.length < 43 || typeof send !== "function") throw new Error("Bridge configuration missing");
  mkdirSync(receiptDir, { recursive: true, mode: 0o700 });
  accessSync(receiptDir, constants.R_OK | constants.W_OK);
  let queue = Promise.resolve();
  let outstanding = 0;
  let count = 0;
  let minute = 0;
  const server = createServer({ maxHeaderSize: 8192 }, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const finish = (status, result) => { if (!res.writableEnded) { res.writeHead(status); res.end(JSON.stringify(result)); } };
    try {
      if (req.url === "/health" && req.method === "GET") return finish(200, { ok: true });
      if (req.url !== "/webhook") return finish(404, { error: "Not found" });
      if (req.method !== "POST") return finish(405, { error: "POST required" });
      const currentMinute = Math.floor(now() / 60);
      if (currentMinute !== minute) { minute = currentMinute; count = 0; }
      if (++count > 60) throw fault(429, "Rate limited");
      if (Number(req.headers["content-length"]) > MAX_BODY) throw fault(413, "Payload too large");
      const chunks = [];
      let length = 0;
      req.setTimeout(10000, () => req.destroy());
      for await (const chunk of req) {
        length += chunk.length;
        if (length > MAX_BODY) throw fault(413, "Payload too large");
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      const delivery = parseDelivery(req.headers, raw, verifyDelivery(req.headers, raw, secret, now()));
      if (delivery.isTest) return finish(200, { ok: true, status: "test_verified_no_post" });
      if (!/^\s*chief(?:\s|[,.:!?;]|$)/i.test(delivery.transcription)) return finish(200, { ok: true, status: "ignored_not_addressed_to_chief" });
      if (outstanding >= 4) throw fault(429, "Delivery queue busy; retry later");
      outstanding++;
      try {
      const key = createHash("sha256").update(delivery.id).digest("hex");
      const receipt = join(receiptDir, `${key}.json`);
      let handle;
      try { handle = await open(receipt, "wx", 0o600); }
      catch (error) {
        if (error.code !== "EEXIST") throw fault(503, "Receipt store unavailable");
        let prior;
        try { prior = JSON.parse(await readFile(receipt, "utf8")); } catch { throw fault(503, "Delivery receipt requires review"); }
        if (prior.digest !== delivery.digest) throw fault(409, "Delivery id content conflict");
        if (prior.status === "sent") return finish(200, { ok: true, status: "duplicate", event_id: prior.event_id });
        throw fault(503, "Delivery pending or uncertain; operator review required");
      }
      const pending = { id: delivery.id, digest: delivery.digest, status: "pending", createdAt: now() };
      try { await handle.writeFile(JSON.stringify(pending)); await handle.sync(); } finally { await handle.close(); }
      try {
        const operation = queue.then(() => send(notificationText(delivery.transcription, delivery.id)));
        queue = operation.catch(() => {});
        const result = await operation;
        if (!/^[a-f0-9]{64}$/.test(result?.event_id || "")) throw new Error("Unconfirmed delivery");
        const temp = `${receipt}.tmp`;
        const saved = await open(temp, "w", 0o600);
        try { await saved.writeFile(JSON.stringify({ ...pending, status: "sent", event_id: result.event_id })); await saved.sync(); } finally { await saved.close(); }
        await rename(temp, receipt);
        return finish(200, { ok: true, status: "sent", event_id: result.event_id });
      } catch {
        // Never repeat a possibly accepted remote post. Pending receipt survives restart.
        throw fault(503, "Delivery unconfirmed; operator review required");
      }
      } finally { outstanding--; }
    } catch (error) { finish(error.status || 503, { error: error.status ? error.message : "Receiver unavailable" }); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxConnections = 16;
  return server;
}
