import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import { Suspense } from "react";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import DeskThemeProvider from "@/components/theme/theme-provider"
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Exam blueprints — decode any exam from its past papers", {
    description:
      "Chapter-wise weightage, recurring concepts and year-over-year trends mined from years of past papers. See exactly what each exam tests.",
    metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
  });
}

export default function BlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body
        className={cx(
          sfPro.variable,
          inter.variable,
          "theme-desk desk-grid"
        )}
      >
        <DeskThemeProvider>
        <TooltipProvider>
          <Suspense fallback="...">
            <Nav />
          </Suspense>
          <main className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
            {children}
          </main>
          <Footer />
          <ComplianceProviders />
        </TooltipProvider>
        </DeskThemeProvider>
      </body>
    </html>
  );
}
