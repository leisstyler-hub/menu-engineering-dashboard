// Only a receiver-specific IPC message can authorize exposing its loopback port.
export function supervise(receiver, startTunnel, onFailure, timeoutMs = 10000) {
  let tunnel;
  let stopped = false;
  let ready = false;
  const timer = setTimeout(() => fail(), timeoutMs);
  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    receiver.kill();
    tunnel?.kill();
  }
  function fail() { if (!stopped) { stop(); onFailure(); } }
  receiver.on("message", message => {
    if (stopped || ready || message?.type !== "ready" || message.port !== 4319) return;
    ready = true;
    clearTimeout(timer);
    try {
      tunnel = startTunnel();
      tunnel.on("error", fail);
      tunnel.on("exit", fail);
    } catch { fail(); }
  });
  receiver.on("error", fail);
  receiver.on("exit", fail);
  return stop;
}
