"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import Stats from "../shared/Stats";

/**
 * A simple wrapper that ensures <Stats/> is inside <SessionProvider>.
 */
export default function StatsWithSession() {
  return (
    <SessionProvider>
      <Stats />
    </SessionProvider>
  );
}
