import { useSsmtDialog } from "./ssmtDialog.js";
import {
  getSsmtRedirectToken,
  clearSsmtRedirectToken,
} from "./ssmtAuthRedirect.js";
import React, { useEffect, useState } from "react";
import { ssmtRequest } from "./ssmtClient.js";
const cls =
  "rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900";
export default function SsmtAccessGate({ children, onBack }) {
  const [state, setState] = useState("loading"),
    [member, setMember] = useState(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [setup, setSetup] = useState(false),
    [panel, setPanel] = useState(""),
    [recovery, setRecovery] = useState(() => new URLSearchParams(window.location.search).get("ssmt") === "setup");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await ssmtRequest("status");
        if (!active) return;
        if (!status.enabled) {
          setState("legacy");
          return;
        }
        const accessToken = getSsmtRedirectToken();
        if (accessToken) {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
          let result;
          try {
            result = await ssmtRequest("exchange", { accessToken });
          } catch (error) {
            clearSsmtRedirectToken();
            if (active) {
              setRecovery(true);
              setState("login");
              setMessage(error.status === 401 || error.status === 403
                ? "This reset link is expired or already used. Enter your email to request a new reset email."
                : "The reset link could not be verified. Please try again or request a new reset email.");
            }
            return;
          }
          clearSsmtRedirectToken();
          if (active) {
            setMember(result.member);
            setSetup(true);
            setState("ready");
          }
          return;
        }
        if (recovery) {
          setState("login");
          setMessage("This reset link is expired, already used, or incomplete. Enter your email to request a new reset email, then open the newest link.");
          return;
        }
        try {
          const result = await ssmtRequest("session");
          if (active) {
            setMember(result.member);
            setState("ready");
          }
        } catch (e) {
          if (active) {
            setState("login");
            if (e.status !== 401) setMessage(e.message);
          }
        }
      } catch {
        if (active) {
          setState("error");
          setMessage(
            "SSMT access could not be verified. If you opened a reset email, request a new link from the sign-in screen.",
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function act(action) {
    setBusy(true);
    setMessage("");
    try {
      const result = await ssmtRequest(action, { email, password });
      setPassword("");
      if (action === "login") {
        setMember(result.member);
        setState("ready");
      } else if (action === "password") {
        setSetup(false);
        setMessage("Password updated.");
      } else setMessage(result.message);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (state === "legacy") return children(null);
  if (state !== "ready" || setup)
    return (
      <main className="mx-auto my-8 max-w-lg space-y-4 rounded-xl border bg-white p-6 text-slate-950">
        <button className={cls} onClick={onBack}>
          Back to Platform
        </button>
        <h1 className="text-2xl font-black">
          SSMT {setup ? "Set your password" : recovery ? "Reset your password" : "Sign in"}
        </h1>
        <p>
          Invite-only individual access. The rest of Culinary Tools remains
          accessible.
        </p>
        {state === "loading" ? (
          <p>Checking SSMT access…</p>
        ) : state === "error" ? null : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              act(setup ? "password" : recovery ? "reset" : "login");
            }}
          >
            {!setup && (
              <label className="block">
                Email
                <input
                  className={`${cls} block w-full`}
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {(!recovery || setup) && <label className="block">
              {setup ? "New password" : "Password"}
              <input
                className={`${cls} block w-full`}
                type="password"
                autoComplete={setup ? "new-password" : "current-password"}
                minLength={setup ? 12 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>}
            <button className={cls} disabled={busy}>
              {setup ? "Set password" : recovery ? "Send new reset email" : "Sign in to SSMT"}
            </button>
            {!setup && (
              <button
                className={cls}
                type="button"
                disabled={busy}
                onClick={() => recovery ? setRecovery(false) : act("reset")}
              >
                {recovery ? "Back to sign in" : "Reset password"}
              </button>
            )}
          </form>
        )}
        {message && <p role="status">{message}</p>}
      </main>
    );
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-2 text-sm text-slate-900">
        <strong>{member.name || member.email}</strong>
        <span>
          {member.role}
          {member.isAdmin ? " • Admin" : ""}
        </span>
        <button className={cls} onClick={() => setPanel("history")}>
          Activity History
        </button>
        {member.isAdmin && (
          <button className={cls} onClick={() => setPanel("members")}>
            Manage access
          </button>
        )}
        <button className={cls} onClick={() => setSetup(true)}>
          Change password
        </button>
        <button
          className={cls}
          onClick={async () => {
            if (
              !window.confirm("Sign out? Unsaved edits will not be submitted.")
            )
              return;
            await ssmtRequest("logout", {});
            setMember(null);
            setState("login");
          }}
        >
          Sign out
        </button>
      </div>
      {children(member)}
      {panel && <AccountPanel type={panel} onClose={() => setPanel("")} />}
    </>
  );
}
function AccountPanel({ type, onClose }) {
  const dialogRef = useSsmtDialog(onClose);
  const [data, setData] = useState([]),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState(""),
    [offset, setOffset] = useState(0),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      email: "",
      name: "",
      role: "Chef",
      isAdmin: false,
    });
  const load = async () => {
    try {
      const result = await ssmtRequest(
        type === "history" ? `history&offset=${offset}` : "members",
      );
      setData(result.entries || result.members || []);
    } catch (e) {
      setMessage(e.message);
    }
  };
  // Fetch fixed query separately; action names are encoded by the shared helper.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await (type === "history"
          ? fetch(`/api/ssmt?action=history&offset=${offset}`).then(
              async (r) => {
                const j = await r.json();
                if (!r.ok) throw new Error(j.message);
                return j;
              },
            )
          : ssmtRequest("members"));
        if (active) setData(result.entries || result.members || []);
      } catch (e) {
        if (active) setMessage(e.message);
      }
    })();
    return () => {
      active = false;
    };
  }, [type, offset]);
  async function write(action, body) {
    setBusy(true);
    setMessage("");
    try {
      const result = await ssmtRequest(action, body);
      setMessage(result.message);
      if (type === "members") await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const events = data
    .flatMap((batch) =>
      (batch.events || []).map((event) => ({
        ...event,
        time: batch.created_at,
        actor: batch.actor_name || batch.actor_email,
        actorEmail: batch.actor_email,
        id: `${batch.id}-${event.entityId}`,
      })),
    )
    .filter((event) =>
      JSON.stringify(event).toLowerCase().includes(search.toLowerCase()),
    );
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={type === "history" ? "Activity History" : "Manage access"}
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4"
    >
      <section className="mx-auto my-6 max-w-5xl space-y-4 rounded-xl bg-white p-5 text-slate-950">
        <div className="flex justify-between">
          <h2 className="text-xl font-black">
            {type === "history" ? "Activity History" : "Manage access"}
          </h2>
          <button className={cls} onClick={onClose}>
            Close
          </button>
        </div>
        {message && <p role="status">{message}</p>}
        {type === "history" ? (
          <>
            <label>
              Filter this page by person, menu/item, action, value, or date
              <input
                className={`${cls} block w-full`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <p className="text-sm">
              Saved changes only. Same-menu ordering and generation clicks are
              excluded. History cannot be edited.
            </p>
            <div className="space-y-2">
              {events.map((e, index) => (
                <details
                  key={`${e.id}-${index}`}
                  className="rounded border p-3"
                >
                  <summary>
                    {new Date(e.time).toLocaleString()} • {e.actor} • {e.action}{" "}
                    • {e.label || e.entityId}
                  </summary>
                  <p className="text-xs">
                    {e.actorEmail} •{" "}
                    {e.menuNames?.join(", ") || e.menuId || e.kind}
                  </p>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(
                      e.changes || { before: e.before, after: e.after },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              ))}
            </div>
            <button
              className={cls}
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 50))}
            >
              Newer
            </button>
            <button
              className={cls}
              disabled={data.length < 50}
              onClick={() => setOffset(offset + 50)}
            >
              Older
            </button>
          </>
        ) : (
          <>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                write("invite", form);
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  required
                  className={`${cls} block w-full`}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Name
                <input
                  required
                  className={`${cls} block w-full`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Work role
                <select
                  className={`${cls} block w-full`}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {["Chef", "Experience", "IT"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={(e) =>
                    setForm({ ...form, isAdmin: e.target.checked })
                  }
                />{" "}
                Admin account management
              </label>
              <button className={cls} disabled={busy}>
                Send invitation
              </button>
            </form>
            <div className="space-y-3">
              {data.map((m) => (
                <MemberRow
                  key={m.user_id}
                  member={m}
                  busy={busy}
                  onSave={(body) => write("member", body)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function MemberRow({ member: m, busy, onSave }) {
  const [role, setRole] = useState(m.work_role),
    [admin, setAdmin] = useState(m.is_admin);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded border p-3">
      <strong>{m.display_name || m.email}</strong>
      <span>
        {m.email} • {m.active ? "Active" : "Revoked"}
      </span>
      <select
        aria-label={`Role for ${m.email}`}
        className={cls}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        {["Chef", "Experience", "IT"].map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <label>
        <input
          type="checkbox"
          checked={admin}
          onChange={(e) => setAdmin(e.target.checked)}
        />{" "}
        Admin
      </label>
      <button
        className={cls}
        disabled={busy}
        onClick={() =>
          onSave({
            userId: m.user_id,
            name: m.display_name,
            role,
            isAdmin: admin,
            active: m.active,
          })
        }
      >
        Save permissions
      </button>
      <button
        className={cls}
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              `${m.active ? "Revoke" : "Restore"} SSMT access for ${m.email}?`,
            )
          )
            onSave({
              userId: m.user_id,
              name: m.display_name,
              role,
              isAdmin: admin,
              active: !m.active,
            });
        }}
      >
        {m.active ? "Revoke access" : "Restore access"}
      </button>
    </div>
  );
}
