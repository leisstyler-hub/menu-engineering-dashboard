let authEpoch=0;
export async function ssmtRequest(action, body) {
  const requestEpoch=authEpoch;
  const response = await fetch(
    `/api/ssmt${body === undefined ? `?action=${encodeURIComponent(action)}` : ""}`,
    body === undefined
      ? { credentials: "same-origin", signal: AbortSignal.timeout(25000) }
      : {
          method: "POST",
          signal: AbortSignal.timeout(25000),
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...body }),
        },
  );
  const data = await response.json().catch(()=>({}));
  if (!response.ok || !data || typeof data!=="object" || data.ok !== true) {
    if(requestEpoch===authEpoch && response.status===401 && !["login","exchange","reset","password","status","calendar","logout"].includes(action) && typeof window!=="undefined") window.dispatchEvent(new CustomEvent("ssmt-session-expired"));
    throw Object.assign(new Error(data?.message || "SSMT request failed."), {
      status: response.status,
    });
  }
  if(["login","exchange","logout"].includes(action))authEpoch++;
  return data;
}
