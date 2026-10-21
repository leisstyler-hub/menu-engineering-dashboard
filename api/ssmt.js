import {
  enabled,
  failure,
  service,
  identity,
  publicMember,
  assertOrigin,
  sessionCookie,
  storedWorkspace,
  pack,
} from "../lib/ssmtServer.js";
import {
  auditChanges,
  validateExperienceChange,
  validateWorkspaceShape,
} from "../src/features/ssmt/ssmtAudit.js";
const roles = new Set(["Chef", "Experience", "IT"]);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const action = req.method === "GET" ? req.query?.action : req.body?.action;
  try {
    if (req.method === "GET" && action === "status")
      return res.status(200).json({ ok: true, enabled: enabled() });
    if (!enabled())
      throw failure("SSMT accounts have not been activated.", 503);
    if (!["GET", "POST"].includes(req.method))
      throw failure("Method not allowed.", 405);
    const reads = new Set([
      "status",
      "calendar",
      "session",
      "workspace",
      "history",
      "members",
    ]);
    if ((req.method === "GET") !== reads.has(action))
      throw failure("Method not allowed for this SSMT action.", 405);
    if (req.method === "POST") assertOrigin(req);
    if (action === "login") {
      const { email, password } = req.body;
      if (
        typeof email !== "string" ||
        email.length > 320 ||
        typeof password !== "string" ||
        !password ||
        password.length > 1024
      )
        throw failure("Enter your email and password.");
      const session = await service(
        "token?grant_type=password",
        { method: "POST", body: JSON.stringify({ email, password }) },
        true,
      ).catch(() => {
        throw failure("SSMT sign-in failed.", 401);
      });
      const member = await identity(req, session.access_token);
      sessionCookie(res, session.access_token, session.expires_in);
      return res.status(200).json({ ok: true, member: publicMember(member) });
    }
    if (action === "exchange") {
      let accessToken = req.body.accessToken;
      if (req.body.tokenHash !== undefined) {
        const { tokenHash, type } = req.body;
        if (typeof tokenHash !== "string" || !/^[a-fA-F0-9]{40,128}$/.test(tokenHash) || !["recovery", "invite"].includes(type))
          throw failure("This password link is invalid.");
        const session = await service("verify", {
          method: "POST", body: JSON.stringify({ token_hash: tokenHash, type }),
        }, true).catch(() => { throw failure("This password link is expired or already used. Request a new email.", 401); });
        accessToken = session?.access_token;
      }
      const member = await identity(req, accessToken);
      sessionCookie(res, member.token, 900);
      return res.status(200).json({ ok: true, member: publicMember(member) });
    }
    if (action === "logout") {
      sessionCookie(res, "", 0);
      return res.status(200).json({ ok: true });
    }
    if (action === "reset") {
      const email = String(req.body.email || "").trim().toLowerCase();
      if (email.length > 320 || !email.includes("@"))
        throw failure("Enter your invited email address.");
      // Generic response prevents account enumeration; Supabase applies recovery throttling.
      const matches = await service(
        `ssmt_members?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&active=eq.true&select=user_id&limit=1`,
      );
      if (matches?.length)
        await service(
          `recover?redirect_to=${encodeURIComponent(`${process.env.SSMT_APP_ORIGIN}/?ssmt=setup`)}`,
          { method: "POST", body: JSON.stringify({ email }) },
          true,
        ).catch((error) => {
          throw failure(
            error.statusCode === 429
              ? "Password reset is temporarily rate limited. Please wait before requesting another email."
              : "Password reset email is temporarily unavailable. Please try again later.",
            error.statusCode === 429 ? 429 : 503,
          );
        });
      return res.status(200).json({
        ok: true,
        message:
          "If the address is registered, a password-reset email has been requested. Check your inbox and spam folder; delivery may be delayed.",
      });
    }
    if (action === "calendar") {
      const { workspace } = await storedWorkspace();
      return res.status(200).json({
        ok: true,
        menus: workspace.menus
          .filter((m) => !m.hiddenFromDownstream)
          .map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            phase: m.phase,
            activeStart: m.activeStart,
            activeEnd: m.activeEnd,
            promotionSchedule: m.promotionSchedule,
          })),
      });
    }
    const actor = await identity(req);
    if (action === "session")
      return res.status(200).json({ ok: true, member: publicMember(actor) });
    if (action === "password") {
      const password = req.body.password;
      if (
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128
      )
        throw failure("Use a new password with at least 12 characters.");
      await service(
        "user",
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${actor.token}` },
          body: JSON.stringify({ password }),
        },
        true,
      );
      return res.status(200).json({ ok: true, message: "Password updated." });
    }
    if (action === "history") {
      const offset = Math.max(
        0,
        Math.min(1000000, Number(req.query.offset) || 0),
      );
      const events = await service(
        `ssmt_audit?select=id,created_at,actor_id,actor_name,actor_email,events&order=id.desc&limit=50&offset=${offset}`,
      );
      return res.status(200).json({ ok: true, entries: events });
    }
    if (action === "members") {
      if (!actor.is_admin) throw failure("Admin access is required.", 403);
      const members = await service(
        "ssmt_members?select=user_id,email,display_name,work_role,is_admin,active&order=email",
      );
      // Read Auth metadata only for registered SSMT members; never return Auth records.
      const withSignIn = [];
      for (let index = 0; index < members.length; index += 10) {
        withSignIn.push(...await Promise.all(members.slice(index, index + 10).map(async member => {
          try {
            const user = await service(`admin/users/${encodeURIComponent(member.user_id)}`, {}, true);
            return { ...member, last_sign_in_at: user.last_sign_in_at || null };
          } catch {
            return { ...member, last_sign_in_at: null, last_sign_in_unavailable: true };
          }
        })));
      }
      return res.status(200).json({
        ok: true,
        members: withSignIn,
      });
    }
    if (action === "invite" || action === "member") {
      if (!actor.is_admin) throw failure("Admin access is required.", 403);
      const body = req.body;
      if (!roles.has(body.role) || typeof body.isAdmin !== "boolean")
        throw failure("Choose one work role and admin permission.");
      let target = body.userId,
        email = body.email;
      if (action === "invite") {
        if (
          typeof email !== "string" ||
          email.length > 320 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )
          throw failure("Enter a valid email.");
        const user = await service(
          `invite?redirect_to=${encodeURIComponent(`${process.env.SSMT_APP_ORIGIN}/?ssmt=setup`)}`,
          { method: "POST", body: JSON.stringify({ email }) },
          true,
        );
        target = user.id;
        if (!target) throw failure("Invitation could not be created.", 503);
      }
      if (typeof target !== "string" || !/^[0-9a-f-]{36}$/.test(target))
        throw failure("Select a valid account.");
      await service("rpc/ssmt_set_member", {
        method: "POST",
        body: JSON.stringify({
          p_actor: actor.user_id,
          p_user: target,
          p_email: action === "invite" ? email.trim().toLowerCase() : null,
          p_name: String(body.name || "").slice(0, 100),
          p_role: body.role,
          p_admin: body.isAdmin,
          p_active: action === "invite" ? true : Boolean(body.active),
        }),
      });
      return res.status(200).json({
        ok: true,
        message:
          action === "invite" ? "Invitation sent." : "Account access updated.",
      });
    }
    if (action === "workspace") {
      const stored = await storedWorkspace();
      return res.status(200).json({
        ok: true,
        workspace: stored.workspace,
        revision: stored.revision,
      });
    }
    if (action === "save") {
      const stored = await storedWorkspace();
      if (req.body.revision !== stored.revision)
        throw failure(
          "The shared workspace changed. Reload and reconcile your draft before saving.",
          409,
        );
      const draft = req.body.workspace;
      if (
        !draft ||
        !Array.isArray(draft.menus) ||
        !Array.isArray(draft.modifierGroups) ||
        draft.menus.length === 0
      )
        throw failure("Refusing an empty or malformed workspace.");
      const shapeError = validateWorkspaceShape(draft);
      if (shapeError) throw failure(shapeError);
      const next = {
        ...stored.workspace,
        ...draft,
        "Record ID": "ssmt|workspace|current",
        "Record Type": "SSMT Workspace",
        updatedAt: new Date().toISOString(),
      };
      if (actor.work_role === "Experience") {
        const message = validateExperienceChange(stored.workspace, next);
        if (message) throw failure(message, 403);
      }
      const events = auditChanges(stored.workspace, next);
      // Preserve unknown existing fields. Revision comparison and append-only history run atomically in SQL.
      const packed = pack(next);
      await service("rpc/ssmt_commit_workspace", {
        method: "POST",
        body: JSON.stringify({
          p_actor: actor.user_id,
          p_expected: stored.payload,
          p_next: packed,
          p_events: events,
          p_role: actor.work_role,
        }),
      });
      const { revision } = await import("../lib/ssmtServer.js");
      return res.status(200).json({
        ok: true,
        revision: revision(packed),
        message: "Shared SSMT workspace saved.",
      });
    }
    throw failure("Unsupported SSMT action.");
  } catch (error) {
    return res.status(error.statusCode || 503).json({
      ok: false,
      message: error.statusCode
        ? error.message
        : "SSMT is unavailable. Your data has not been replaced.",
    });
  }
}
