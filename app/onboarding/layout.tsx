import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter, deskFontVars } from "../fonts";
import { Toaster } from "@/components/ui/toaster";
import SessionWrapper from "@/components/compliance/SessionWrapper";

export const metadata = {
  title: "Welcome to Penwise",
  description: "A few details before you start.",
  metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
};

/**
 * Minimal, deliberately escape-hatch-free layout for the onboarding gate — no
 * nav/footer, since the user must complete onboarding before using the app.
 */
export default function OnboardingLayout({
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
          <SessionWrapper>
            <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-16">
              {children}
            </main>
            <Toaster />
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
