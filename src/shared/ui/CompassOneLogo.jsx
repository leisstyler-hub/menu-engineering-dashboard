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
      className="block shrink-0"
    >
      <rect width="190" height="58" fill="transparent" />
      <text
        x="0"
        y="36"
        fill="#111827"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="-0.7"
      >
        compass
      </text>
      <circle cx="143" cy="29" r="28" fill="#b99b55" />
      <text
        x="103"
        y="37"
        fill="#ffffff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="-0.6"
      >
        one
      </text>
      <circle cx="171" cy="21" r="2.4" fill="#ffffff" opacity="0.9" />
      <path d="M174 21h9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
