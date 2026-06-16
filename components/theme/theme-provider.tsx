"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Canonical theme provider for the whole app. There is no root layout, so each
 * route-group layout mounts this once around its <body> content; next-themes
 * then manages the `class="dark"` on <html> (with an inline anti-FOUC script).
 *
 * Locked config so the behaviour is identical on every page: class strategy,
 * light by default, no system-follow (the moon/sun toggle is the control).
 * Transitions are left ON so the toggle's icon cross-fade animates.
 */
export default function DeskThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
