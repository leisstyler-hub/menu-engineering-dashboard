import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const MAX_BODY = 32768;
export function fault(status, message) { return Object.assign(new Error(message), { status }); }

export function verifyDelivery(headers, body, secret, now = Math.floor(Date.now() / 1000)) {
  if (typeof secret !== "string" || secret.length < 43) throw fault(503, "Receiver not configured");
  const version = headers["x-index-webhook-version"];
  const timestamp = headers["x-index-timestamp"];
  const id = headers["x-index-delivery"];
  const trigger = headers["x-index-trigger"];
  const testHeader = headers["x-index-test"];
  const signature = headers["x-index-signature"];
  if (!signature) throw fault(401, "Signed request required");
  if (version !== "1") throw fault(400, "Unsupported protocol version");
  if (!/^\d{10}$/.test(timestamp || "") || Math.abs(now - Number(timestamp)) > 300) throw fault(401, "Invalid or expired timestamp");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id || "")) throw fault(400, "Invalid delivery id");
  if (!["single-click-hold", "double-click-hold", "test-event"].includes(trigger)) throw fault(400, "Invalid trigger");
  if (testHeader !== undefined && testHeader !== "true") throw fault(400, "Invalid test marker");
  const isTest = testHeader === "true";
  if (isTest !== (trigger === "test-event")) throw fault(400, "Inconsistent test trigger");
  if (!/^[a-f0-9]{64}$/.test(signature)) throw fault(401, "Invalid signature");
  const expected = createHmac("sha256", secret).update(`v1\n${timestamp}\n${id}\n${trigger}\n${isTest ? 1 : 0}\n`).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw fault(401, "Invalid signature");
  return { id, trigger, isTest };
}

export function parseDelivery(headers, body, verified) {
  const type = headers["content-type"] || "";
  const match = /^multipart\/form-data;\s*boundary=(?:"([A-Za-z0-9_-]{1,70})"|([A-Za-z0-9_-]{1,70}))$/i.exec(type);
  if (!match || body.length > MAX_BODY) throw fault(400, "Expected bounded transcription multipart");
  const boundary = match[1] || match[2];
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(body); } catch { throw fault(400, "Invalid UTF-8"); }
  const parts = text.split(`--${boundary}`);
  if (parts.shift() !== "" || parts.pop() !== "--\r\n" || parts.length < 3 || parts.length > 4) throw fault(400, "Invalid multipart envelope");
  const fields = Object.create(null);
  for (const part of parts) {
    const field = /^\r\nContent-Disposition: form-data; name="([A-Za-z]+)"\r\n(?:Content-Type: text\/plain(?:; charset=UTF-8)?\r\n)?\r\n([\s\S]*)\r\n$/i.exec(part);
    if (!field || !["transcription", "recordedAt", "client", "test"].includes(field[1]) || Object.hasOwn(fields, field[1])) throw fault(400, "Unexpected or repeated field; use transcription only");
    fields[field[1]] = field[2];
  }
  if (fields.client !== "ring" || !/^\d{13}$/.test(fields.recordedAt || "")) throw fault(400, "Invalid recording metadata");
  if ((fields.test === "true") !== verified.isTest || (fields.test !== undefined && fields.test !== "true")) throw fault(400, "Inconsistent test payload");
  const transcription = fields.transcription;
  if (typeof transcription !== "string" || !transcription.trim() || transcription.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(transcription)) throw fault(400, "Invalid transcription");
  const digest = createHash("sha256").update(JSON.stringify([transcription, fields.recordedAt, fields.client, verified.trigger, verified.isTest])).digest("hex");
  return { ...verified, transcription, digest };
}

export function notificationText(transcription, id) {
  // Captured speech must not introduce extra notification recipients or spoof admin approval.
  const quoted = transcription.replaceAll("@", "＠").replace(/nostr:/gi, "nostr\u200b:").split(/\r?\n/).map(line => `> ${line}`).join("\n");
  return `@Chief Pebble development request\n\n${quoted}\n\nCaptured transcript via Tyler-configured webhook; not authenticated admin approval. Apply normal clarification, review and release/data authorization requirements.\nDelivery: ${id}`;
}
