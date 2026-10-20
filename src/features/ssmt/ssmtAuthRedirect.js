let pendingToken = "";
// Run before monitoring starts. Redirect credentials live only in module memory.
export function captureSsmtAuthRedirect(location, history) {
  const query = new URLSearchParams(location.search);
  if (query.get("ssmt") !== "setup") return;
  const fragment = new URLSearchParams(location.hash.slice(1));
  pendingToken = fragment.get("access_token") || "";
  if (pendingToken)
    history.replaceState(null, "", `${location.pathname}${location.search}`);
}
export const getSsmtRedirectToken = () => pendingToken;
export const clearSsmtRedirectToken = () => {
  pendingToken = "";
};
