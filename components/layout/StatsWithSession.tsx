"use client";

import { SessionProvider } from "next-auth/react";
import Stats, { type StatsDemoData } from "../shared/Stats";

/**
 * A simple wrapper that ensures <Stats/> is inside <SessionProvider>.
 * Pass `demo` to render it as a populated preview (home page) without fetching.
 */
export default function StatsWithSession({ demo }: { demo?: StatsDemoData } = {}) {
  return (
    <SessionProvider>
      <Stats demo={demo} />
    </SessionProvider>
  );
}
