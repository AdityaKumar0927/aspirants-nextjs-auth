import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Maintenance", {
    description: "We'll be back shortly.",
  });
}

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className={cx(sfPro.variable, inter.variable, "theme-desk desk-grid")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark", "pink"]}>
          <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
