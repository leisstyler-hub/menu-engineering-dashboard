import { execFile } from "node:child_process";

export const CHANNEL = "178af29c-e43f-43b4-9ddd-66a04facd711";
export const THREAD = "7bcd03cdd12cb2db982edfe6713a354d493c2231c37a2ff5e65eb95071420cf5";
export const CHIEF = "71a2331dd5d247d15f9093339d37d8dea84729056025bb06b34c9d947d9c94cd";
export const RELAY = "wss://culinarytools.communities.buzz.xyz";

export function createBuzzSender({ executable, privateKey, run = execFile }) {
  if (!executable || !/^[a-f0-9]{64}$/.test(privateKey || "")) throw new Error("Dedicated bridge identity required");
  // Do not inherit Chief key, auth tags, signing config or other runtime secrets.
  const env = {};
  for (const key of ["SystemRoot", "WINDIR", "PATH", "PATHEXT", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA"]) if (process.env[key]) env[key] = process.env[key];
  env.BUZZ_PRIVATE_KEY = privateKey;
  env.BUZZ_RELAY_URL = RELAY;
  return content => new Promise((resolve, reject) => {
    const child = run(executable, ["messages", "send", "--channel", CHANNEL, "--reply-to", THREAD, "--mention", CHIEF, "--content", "-"],
      { env, timeout: 15000, maxBuffer: 32768, windowsHide: true, shell: false }, (error, stdout) => {
        if (error) return reject(new Error("Buzz delivery outcome unconfirmed"));
        try {
          const result = JSON.parse(stdout);
          if (result.accepted !== true || !/^[a-f0-9]{64}$/.test(result.event_id || "") || !Array.isArray(result.mention_pubkeys)
            || result.mention_pubkeys.length !== 1 || result.mention_pubkeys[0] !== CHIEF) throw new Error();
          resolve({ event_id: result.event_id });
        } catch { reject(new Error("Buzz acceptance or recipient unconfirmed")); }
      });
    child.stdin.on("error", () => reject(new Error("Buzz input unavailable")));
    child.stdin.end(content);
  });
}
