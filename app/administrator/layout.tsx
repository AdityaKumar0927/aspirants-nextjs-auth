// app/administrator/layout.tsx
"use client";

import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { AdminLayout } from "./application-layout";
import DeskThemeProvider from "@/components/theme/theme-provider"
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Configuration for FontAwesome
config.autoAddCss = false;

// Client-side guard by ROLE (not a hardcoded email allowlist). This is a UX
// convenience only — the authoritative gate is the edge middleware, which
// blocks /administrator for anyone whose JWT role !== "administrator".
function AuthorizationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "administrator";

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) router.replace("/");
  }, [isAdmin, status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-desk text-pencil">
        Checking access…
      </div>
    );
  }
  return isAdmin ? <>{children}</> : null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        </head>
      <body className={cx(sfPro.variable, inter.variable, "theme-desk")}>
        <DeskThemeProvider>
        <SessionProvider>
          <AuthorizationGuard>
            <AdminLayout>
              {children}
            </AdminLayout>
          </AuthorizationGuard>
        </SessionProvider>
        <ComplianceProviders />
        </DeskThemeProvider>
      </body>
    </html>
  );
}
