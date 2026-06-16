"use client";

import { useId } from "react";
import { useTheme } from "next-themes";

/**
 * Sitewide theme control: a light/dark button (warm sun ⇄ shiny crescent moon,
 * cross-faded via the html.dark class) plus a heart button that toggles the
 * baby-pink theme. The heart fills rose via the html.pink class (CSS, so no
 * hydration flash) and carries a "Make pink" tooltip.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Unique SVG ids — the toggle renders twice per page (desktop + mobile nav),
  // so shared gradient/mask ids would collide.
  const uid = useId().replace(/:/g, "");
  const shineId = `moon-shine-${uid}`;
  const cutId = `moon-cut-${uid}`;

  const btn =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-pencil transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40";

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {/* Light / dark */}
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
        className={btn}
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

      {/* Baby-pink theme — heart toggle, with a "Make pink" tooltip */}
      <div className="group relative">
        <button
          type="button"
          onClick={() => setTheme(theme === "pink" ? "light" : "pink")}
          aria-label="Make pink"
          aria-pressed={theme === "pink"}
          className={`${btn} hover:text-[#2596be]`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="theme-heart h-[18px] w-[18px] transition-transform duration-300 group-active:scale-90"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z" />
          </svg>
          <span className="sr-only">Make pink</span>
        </button>

        {/* Tooltip — only on the heart */}
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-[#2596be] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg shadow-[#2596be]/40 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Make pink
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#2596be]" />
        </span>
      </div>
    </div>
  );
}
