# Pebble development request bridge

Tyler approved the scoped bridge at Buzz event `9e4e29c0f934f76491e2f120d1524fd77307bbd65bc52b1fb65541a79e6970aa`. It forwards signed transcription-only requests beginning with Chief into the existing Culinary Tools exploration thread. It is a local development pilot, with a temporary HTTPS Quick Tunnel; it requires this computer awake and both processes running. It does not add an API to the hosted app or modify operational data.

## Boundaries

- Separate local bridge bot identity, not Tyler or Chief. Captured speech never grants administrator, deployment or data-change authority.
- Fixed channel, thread and Chief recipient in `scripts/pebble-bridge/buzz.mjs`. No shell execution, command arguments or destinations from speech. Captured `@` and `nostr:` mentions are neutralized to prevent extra notifications.
- Exact signed Pebble v1 raw-body format, five-minute request window,32KiB body limit and4000-character transcript limit. No audio parts, repeated fields or unknown protocol versions.60 requests/minute,16 connections and4 outstanding delivery handlers. Only `POST /webhook` and `GET /health` are exposed.
- Ordinary notes reach the receiver when the phone webhook is enabled but are discarded without retention. Audio is rejected. Receipts contain delivery id, digest, status and Buzz event id, not the transcript. No request body or secrets are logged.
- Exclusive, synced pending receipt exists before sending. A confirmed duplicate returns200; a content conflict returns409. Pending/uncertain attempts return503 and never send automatically again, including after restart. Distinct accepted deliveries send sequentially. Receipts are retained for deduplication; monitor local disk during the pilot.
- Signing proves possession of the webhook secret, not an authenticated human identity. HTTPS terminates at Cloudflare; text passes through that service. Local loopback connection is HTTP.

## Setup

Use a local state directory **outside Git and shared folders**, restricted to the current Windows user and SYSTEM before generating credentials. Set `PEBBLE_BRIDGE_STATE` and `PEBBLE_BUZZ_EXECUTABLE` to the directory and trusted Buzz executable; run `node scripts/pebble-bridge/setup.mjs`. Setup refuses to overwrite existing config, generates a separate secp256k1 bot key and32-byte random signing secret, and starts disabled.

The relay owner must first admit the dedicated bot identity at the community/relay level. Channel membership alone does not grant relay admission: a profile write returning `relay_membership_required` is a blocking setup failure. The bundled CLI exposes channel membership commands but no relay admission command. After admission, register the bot profile and add only its public key as a bot member of the approved channel. Never grant an administrative role. CLI child environments must use the bot key and must not inherit Chief `BUZZ_AUTH_TAG` or signing settings.

After relay admission, required independent review, tests and commit, set local config `mode` to `forward` and `codeSha` to the reviewed commit. Place the verified official Windows `cloudflared.exe` in the protected state directory. Run `node scripts/pebble-bridge/launch.mjs` in a hidden supervised process from the clean reviewed checkout with `PEBBLE_BRIDGE_STATE` set. Child environments strip inherited credentials. Launch records process ids, requires receiver-specific IPC readiness after binding before starting the tunnel, and stops the peer if either child fails. Receiver listens only on127.0.0.1:4319; tunnel metrics only on127.0.0.1:4320. Do not start a second supervisor against the same state directory.

Copy the generated HTTPS hostname from the local tunnel log; use `<hostname>/webhook` in Pebble. Choose **Transcription**, leave custom headers blank, enable **Sign requests**, and copy the exact secret from the local `SIGNING_SECRET.txt` file. Never send that file/secret in Buzz or a screenshot. The URL alone is not authentication.

First run **Send test event**. A valid signed test returns `test_verified_no_post` and does not notify Chief. Then say “Chief, this is a connection test; do not change anything.” Verify one bot message in the correct thread and a Chief notification. Phone/ring gestures are separate webhook configurations; confirm the intended recording path fires the webhook. Source docs state recordings with unknown gesture do not send a webhook; typed/phone recordings must be proven on the installed app. Do not claim phone-to-Buzz acceptance before this succeeds.

## Recovery and shutdown

Use the recorded process ids only after checking each live process image and command line match this exact receiver/tunnel. Stop those two processes. Disable the phone webhook to stop delivery. The temporary URL expires with the tunnel; restarting it changes the hostname. For retirement, remove the bot membership and rotate/revoke its local key/secret under owner authorization. This service is not configured to autostart on reboot.

For a pending receipt, stop intake and inspect the delivery id in Buzz. If a matching accepted message exists, reconcile the receipt to `sent` with its event id; if the remote outcome cannot be established, retain pending and do not resend. Never delete receipts to retry blindly. A key/digest conflict or unavailable receipt directory is a fail-closed condition.

Tests: `node --test tests/pebble-bridge.test.mjs`. Also run the repository full `npm run verify` before publication. Signing and relay credentials stay out of Git, logs and reports.

Sources: [Pebble webhook protocol](https://developer.repebble.com/index-01/webhooks/), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
