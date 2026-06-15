import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import { Suspense } from "react";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export const metadata = {
  title: "Exam blueprints — decode any exam from its past papers | Penwise",
  description:
    "Chapter-wise weightage, recurring concepts and year-over-year trends mined from years of past papers. See exactly what each exam tests.",
  metadataBase: new URL("https://aspirants.tech/"),
};

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
      </body>
    </html>
  );
}
