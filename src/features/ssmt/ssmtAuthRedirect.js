let pendingToken = "";
let pendingRecovery = null;
// Run before monitoring starts. Redirect credentials live only in module memory.
export function captureSsmtAuthRedirect(location, history) {
  const query = new URLSearchParams(location.search);
  if (query.get("ssmt") !== "setup") return;
  const fragment = new URLSearchParams(location.hash.slice(1));
  pendingToken = fragment.get("access_token") || "";
  const type = fragment.get("type");
  pendingRecovery = fragment.get("token_hash") && ["recovery", "invite"].includes(type)
    ? { tokenHash: fragment.get("token_hash"), type } : null;
  // Recovery errors must not remain in the URL or silently turn into login.
  if (location.hash)
    history.replaceState(null, "", `${location.pathname}${location.search}`);
}
export const getSsmtRedirectToken = () => pendingToken;
export const getSsmtRecovery = () => pendingRecovery;
export const clearSsmtRedirectToken = () => {
  pendingToken = "";
  pendingRecovery = null;
};
