import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import SessionWrapper from "@/components/compliance/SessionWrapper";

export const metadata = {
  title: "Account suspended — Penwise",
  description: "Your account access is currently restricted.",
  metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
};

export default function SuspendedLayout({
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark", "pink"]}>
          <SessionWrapper>
            <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-16">
              {children}
            </main>
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
