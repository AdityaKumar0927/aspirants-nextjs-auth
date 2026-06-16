import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter, deskFontVars } from "../fonts";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Parental approval — Penwise",
  description: "Approve your child's Penwise account.",
  metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
};

/** Public layout for the parental-consent verification landing page. */
export default function ParentalConsentLayout({
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
          <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-16">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
