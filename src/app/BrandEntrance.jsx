import React, { useEffect, useState } from "react";
import "./brandEntrance.css";

const SESSION_KEY = "culinaryToolsBrandEntranceSeen";

function shouldShowEntrance() {
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      && window.sessionStorage.getItem(SESSION_KEY) !== "true";
  } catch {
    // Access to the tools takes priority when browser storage is unavailable.
    return false;
  }
}

export default function BrandEntrance() {
  const [visible, setVisible] = useState(shouldShowEntrance);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const dismiss = () => setVisible(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      dismiss();
      return undefined;
    }
    // Independent of image load and animation events: a failed intro never traps users.
    const timeout = window.setTimeout(dismiss, 1600);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { if (motion.matches) dismiss(); };
    motion.addEventListener("change", onMotionChange);
    window.addEventListener("pointerdown", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });
    return () => {
      window.clearTimeout(timeout);
      motion.removeEventListener("change", onMotionChange);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`brand-entrance${ready ? " brand-entrance--ready" : ""}`}
      data-testid="brand-entrance"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === "brand-line-top") setVisible(false);
      }}
    >
      <div className="brand-entrance__backdrop" />
      <div className="brand-entrance__logo">
        <img src="/brand/compass-one-culinary.svg" alt="" width="1000" height="330"
          fetchPriority="high" decoding="sync" onLoad={() => setReady(true)} onError={() => setVisible(false)} />
      </div>
      <div className="brand-entrance__panel brand-entrance__panel--top" />
      <div className="brand-entrance__panel brand-entrance__panel--bottom" />
      <div className="brand-entrance__line brand-entrance__line--top" />
      <div className="brand-entrance__line brand-entrance__line--bottom" />
    </div>
  );
}
