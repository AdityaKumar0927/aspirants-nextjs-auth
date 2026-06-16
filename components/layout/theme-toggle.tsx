"use client";

import { useId } from "react";
import { useTheme } from "next-themes";

/**
 * Sitewide light/dark toggle. Light mode shows a warm sun (tap to go dark);
 * dark mode shows a white, shiny, cratered crescent moon with a soft glow (tap
 * to go light). The two cross-fade/rotate via CSS keyed off the html.dark class.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Unique SVG ids — the toggle renders twice per page (desktop + mobile nav),
  // so shared gradient/mask ids would collide.
  const uid = useId().replace(/:/g, "");
  const shineId = `moon-shine-${uid}`;
  const cutId = `moon-cut-${uid}`;

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md text-pencil transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40 ${className}`}
    >
      {/* Sun — shown in light mode (tap to go dark) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="absolute h-[19px] w-[19px] scale-100 rotate-0 text-amber-400 transition-all duration-500 [filter:drop-shadow(0_0_4px_rgba(251,191,36,0.45))] dark:scale-0 dark:rotate-90"
      >
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="2.6" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21.4" />
          <line x1="2.6" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21.4" y2="12" />
          <line x1="5.5" y1="5.5" x2="7.2" y2="7.2" />
          <line x1="16.8" y1="16.8" x2="18.5" y2="18.5" />
          <line x1="5.5" y1="18.5" x2="7.2" y2="16.8" />
          <line x1="16.8" y1="7.2" x2="18.5" y2="5.5" />
        </g>
      </svg>

      {/* Moon — shown in dark mode: white, shiny crescent with subtle craters + glow */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute h-5 w-5 scale-0 -rotate-90 transition-all duration-500 [filter:drop-shadow(0_0_5px_rgba(226,232,255,0.6))] dark:scale-100 dark:rotate-0"
      >
        <defs>
          <radialGradient id={shineId} cx="34%" cy="30%" r="82%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#eef1fb" />
            <stop offset="100%" stopColor="#c9d0e8" />
          </radialGradient>
          <mask id={cutId}>
            <rect width="24" height="24" fill="black" />
            <circle cx="12" cy="12" r="9" fill="white" />
            <circle cx="15.5" cy="9.5" r="8" fill="black" />
          </mask>
        </defs>
        <g mask={`url(#${cutId})`}>
          <circle cx="12" cy="12" r="9" fill={`url(#${shineId})`} />
          <circle cx="7.5" cy="12.2" r="1.05" fill="#9aa6c8" opacity="0.5" />
          <circle cx="8.7" cy="14.8" r="0.7" fill="#9aa6c8" opacity="0.45" />
          <circle cx="6.7" cy="9.6" r="0.6" fill="#9aa6c8" opacity="0.4" />
        </g>
      </svg>

      <span className="sr-only">Toggle dark mode</span>
    </button>
  );
}
