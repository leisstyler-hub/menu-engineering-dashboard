const readJson = (response) => response.json().catch(() => ({}));

export async function loadCommissaryOrders() {
  const response = await fetch("/api/storage/records?tool=commissaryOrders&includeHidden=1");
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to load commissary orders.");
  return Array.isArray(payload.records) ? payload.records : [];
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
