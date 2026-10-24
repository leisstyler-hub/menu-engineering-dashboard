# Changelog standard

Authority: Tyler, Buzz event `8a68c7fa334efa1b0454db24b288e1bb3d02e832c81bfd9bcd73cfec9c6abd84`, 2026-10-24. Applies to Chief and Donnie.

## Every commit

The committing agent posts one concise top-level message to Buzz **Changelog**, channel `9cd1797f-0203-4ffa-8fb8-4cbf75d9fcda`, after each successful project commit, including documentation commits. Include every SHA if a tool creates multiple commits. Record the returned message event ID in the originating work thread. A failed post is an outstanding delivery task; report it and retry when access is restored. Never create a follow-up commit merely to record a posting receipt.

Use this format, with one to three short bullets and approximately 100 words maximum:

```markdown
**Short change title** · Oct 24, 10:34 AM PT

- What changed for the user.
- Another meaningful change, if needed.

**State:** COMMITTED · **Commit:** abc1234 · **Owner:** Chief
**Checks:** Documentation checks passed.
```

Use the actual Los Angeles time, actual owner, exact commit and evidence-backed state. Add version only when it changes. Link the GitHub commit when published; link a detailed work record when useful. Use `Not run (reason)` for missing checks. Do not call a commit deployed or LIVE without release evidence. After authorized production verification, post a short status update referencing the same commit; do not repeat the full release report.

## App and source wording

Use the same plain-language change sentences in Buzz and `CHANGELOG.md`. Start each timestamped app/source bullet with a complete user-facing sentence of at most 146 characters, matching the existing landing-page summary limit. Put the most useful change first. Avoid agent narration, deployment IDs, long test inventories and internal implementation detail in that sentence. Put audit evidence in linked work/release records, not in the summary.

Retain existing date headings and `[Mon D, h:mm AM/PM]` timestamps required by the parser and timestamp guard. Buzz adds status/commit/checks metadata; the app keeps its existing compact cards. Do not rewrite historical entries or retroactively change release states. This standard changes future authoring, not the historical record or the app layout.
