export async function ssmtRequest(action, body) {
  const response = await fetch(
    `/api/ssmt${body === undefined ? `?action=${encodeURIComponent(action)}` : ""}`,
    body === undefined
      ? { credentials: "same-origin" }
      : {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...body }),
        },
  );
  const data = await response.json();
  if (!response.ok || data.ok === false)
    throw Object.assign(new Error(data.message || "SSMT request failed."), {
      status: response.status,
    });
  return data;
}
