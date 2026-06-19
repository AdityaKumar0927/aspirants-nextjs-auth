import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter, deskFontVars } from "../fonts";
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Grievance & Data Protection", {
    description: "Raise a data-protection grievance or contact our Grievance Officer.",
    metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
  });
}

export default function GrievanceLayout({
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
        className={cx(sfPro.variable, inter.variable, deskFontVars,
          "theme-desk desk-grid"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark", "pink"]}>
          <Nav />
          <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-16">
            {children}
          </main>
          <Footer />
          <ComplianceProviders />
        </ThemeProvider>
      </body>
    </html>
  );
}
