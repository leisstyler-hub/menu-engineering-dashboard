const readJson = (response) => response.json().catch(() => ({}));

export const prepProgressKey = (record = {}) => `${record.hub || "Cricket"}|${record.weekStart || ""}`;

export function mergePendingPrepProgress(serverRecords = [], pendingRecords = new Map()) {
  const merged = new Map(serverRecords.map((record) => [prepProgressKey(record), record]));
  pendingRecords.forEach((pending, key) => {
    const server = merged.get(key);
    const serverUpdatedAt = Date.parse(server?.updatedAt || "") || 0;
    const pendingUpdatedAt = Date.parse(pending.updatedAt || "") || 0;
    if (server && serverUpdatedAt >= pendingUpdatedAt) pendingRecords.delete(key);
    else merged.set(key, pending);
  });
  return [...merged.values()];
}

export async function loadCommissaryRecords() {
  const response = await fetch("/api/storage/records?tool=commissaryOrders&includeHidden=1");
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to load commissary orders.");
  return Array.isArray(payload.records) ? payload.records : [];
}

export async function loadCommissaryOrders() {
  return (await loadCommissaryRecords()).filter((record) => record["Record Type"] === "Commissary Order");
}

export async function saveCommissaryMetadata(record) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsertRecords", records: [record], context: { tool: "commissaryOrders" } }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to save Commissary metadata.");
  return payload;
}

export async function saveCommissaryOrder(record) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsertRecords", records: [record], context: { tool: "commissaryOrders" } }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to save the commissary order.");
  return payload;
}

export async function saveCommissaryPrepProgress(record) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsertRecords", records: [record], context: { tool: "commissaryOrders" } }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to save Prep List progress.");
  return payload;
}

export async function saveCommissaryPackoutPacket(record) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsertRecords", records: [record], context: { tool: "commissaryOrders" } }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to save the Packout Packet in Supabase.");
  return payload;
}
