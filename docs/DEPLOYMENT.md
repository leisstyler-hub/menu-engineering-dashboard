# Deployment Notes

This repo is deployed to Vercel through GitHub. The fastest reliable path in the
current Windows/Codex workspace is to push to GitHub with the repo-local publish
script and let the Vercel Git integration build production.

## Preferred Command

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish-live.ps1 -CommitMessage "Describe the change"
```

Or through npm:

```powershell
pnpm run publish:live -- -CommitMessage "Describe the change"
```

The script:

- Reads the visible app version from `src/shared/appConfig.js`.
- Uses the portable GitHub CLI token without printing it.
- Commits dirty work only when a commit message is provided.
- Runs `pnpm run verify` by default.
- Fetches `origin/main` through tokenized HTTPS using the portable Git executable
  and OpenSSL.
- Refuses to publish if local work is behind GitHub unless `-AllowBehind` is
  explicitly provided.
- Pushes `HEAD` to `main`.
- Updates local `origin/main` to the pushed commit immediately after a
  successful push, so the shell does not look stale while Vercel is building.
- Polls the live app for the current version stamp so Vercel deployment status is
  obvious.

## Fast Preflight

Before a quick publish, run the small source/credential check:

```powershell
pnpm run release:preflight
```

The preflight is intentionally light. It checks the handoff/release files, reads
the visible version stamp, and runs the GitHub HTTPS repair/sync path. It does
not run the full app verification suite. Use it when you want confidence that
GitHub auth/source sync is healthy without adding several minutes to a small
release.

## Fast Docs-Only Publish

For documentation or handoff-only changes where the app bundle should not change:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish-live.ps1 `
  -CommitMessage "Update deployment notes" `
  -SkipVerify `
  -SkipVercelWait
```

Do not use `-SkipVerify` for app behavior, data integrity, storage, or UI changes.

## Why This Exists

Normal `git push` has been unreliable in this Windows workspace because the shell
can hit missing or locked Git credentials. GitHub API writes have also been slow
or blocked in prior sessions. The proven stable path is:

1. Get a token from the GitHub CLI.
2. Use the portable Git executable.
3. Force `http.sslBackend=openssl`.
4. Disable credential helper prompts.
5. Push to a tokenized GitHub HTTPS URL.

The script codifies that path so future Codex sessions and collaborators do not
need to rediscover it.

## Repair GitHub HTTPS

If the shell reports `SEC_E_NO_CREDENTIALS`, `git-remote-https` is missing, or
`git status` looks stale after a publish, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/repair-git-https.ps1
```

Or through npm:

```powershell
pnpm run repair:git
```

The repair check:

- Uses the same portable Git executable as `publish-live.ps1`.
- Forces `http.sslBackend=openssl` for the GitHub operation.
- Uses the GitHub CLI token without printing it.
- Refreshes `origin/main` through the known-good HTTPS path.
- Warns when the bundled Codex runtime Git is missing `git-remote-https.exe`.

This does not change app code or credentials. It only avoids the broken Windows
Schannel/runtime-Git path for this project.

## If It Fails

- If authentication fails, reconnect GitHub or run `gh auth login`.
- If the branch is behind, fetch/rebase or review the GitHub changes before
  using `-AllowBehind`.
- If verification fails, fix the app before publishing.
- If live polling times out, check the Vercel dashboard; the push may still have
  started a deployment.
