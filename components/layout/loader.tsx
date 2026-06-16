"use client";

import { cn } from "@/lib/utils";

/**
 * The one loading indicator for the whole app. A ballpoint ring spinner that
 * inherits the desk palette, so it adapts to light/dark automatically
 * (--ballpoint + --paper flip with the theme). Use <Loader/> inline and
 * <FullPageLoader/> for blocking/full-screen states.
 */
const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export function Loader({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-ballpoint/25 border-t-ballpoint",
        SIZES[size],
        className
      )}
    />
  );
}

export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-paper/70 backdrop-blur-sm"
    >
      <Loader size="lg" />
      {label ? <p className="type-data text-sm text-pencil">{label}</p> : null}
    </div>
  );
}

export default Loader;
