"use client";

import { useTheme } from "next-themes";

/**
 * Sitewide light/dark toggle. In light mode it shows a full, cratered moon with
 * a subtle glow (tap to go dark); in dark mode a sun (tap to go light). The two
 * cross-fade via CSS keyed off the html.dark class, so there's no hydration
 * mismatch and it works the moment it mounts.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md text-pencil transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40 ${className}`}
    >
      {/* Moon — full, cratered, faint glow. Shown in light mode. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute h-[18px] w-[18px] scale-100 rotate-0 text-[#7b83b8] transition-all duration-500 [filter:drop-shadow(0_0_4px_rgba(123,131,184,0.55))] dark:scale-0 dark:-rotate-90"
      >
        <circle cx="12" cy="12" r="8.5" fill="currentColor" />
        <circle cx="9.2" cy="9.4" r="1.7" className="fill-black/20" />
        <circle cx="14.6" cy="13.9" r="2.2" className="fill-black/20" />
        <circle cx="10.4" cy="15.4" r="1.05" className="fill-black/15" />
        <circle cx="15.3" cy="8.5" r="0.85" className="fill-black/15" />
      </svg>

      {/* Sun — rays + core, warm glow. Shown in dark mode. */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="absolute h-[19px] w-[19px] scale-0 rotate-90 text-amber-400 transition-all duration-500 [filter:drop-shadow(0_0_4px_rgba(251,191,36,0.45))] dark:scale-100 dark:rotate-0"
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

      <span className="sr-only">Toggle dark mode</span>
    </button>
  );
}
