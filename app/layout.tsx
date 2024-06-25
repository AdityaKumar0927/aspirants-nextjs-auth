import React, { Suspense } from 'react';
import "./globals.css";
import cx from "classnames";
import { sfPro, inter } from "./fonts";
import Footer from "@/components/layout/footer";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

const Nav = React.lazy(() => import("@/components/layout/nav"));

export const metadata = {
  title: "aspirants",
  description: "",
  metadataBase: new URL("https://aspirants.tech/"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cx(sfPro.variable, inter.variable)}>
        <div className="fixed inset-0 h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100 z-[-10]" />
        <Suspense fallback={<div>Loading...</div>}>
          <Nav />
        </Suspense>
        <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
          {children}
        </main>
        <Footer />
        <VercelAnalytics />
      </body>
    </html>
  );
}
