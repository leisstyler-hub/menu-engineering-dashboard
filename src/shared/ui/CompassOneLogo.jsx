import React from "react";

export default function CompassOneLogo({ compact = false }) {
  const width = compact ? 150 : 190;
  const height = compact ? 46 : 58;

  return (
    <svg
      aria-label="Compass One"
      role="img"
      viewBox="0 0 190 58"
      width={width}
      height={height}
      className="block shrink-0 text-slate-950 dark:text-white"
    >
      <rect width="190" height="58" fill="transparent" />
      <text
        x="0"
        y="36"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="0"
      >
        compass
      </text>
      <circle cx="143" cy="29" r="28" fill="#b99b55" />
      <text
        x="143"
        y="37"
        fill="#ffffff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="21"
        fontWeight="500"
        letterSpacing="0"
        textAnchor="middle"
      >
        one
      </text>
    </svg>
  );
}
