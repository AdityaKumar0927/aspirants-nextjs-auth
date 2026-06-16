import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter, deskFontVars } from "../fonts";
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Consent Notice — Penwise",
  description: "What personal data we collect and why.",
  metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
};

export default function ConsentNoticeLayout({
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Nav />
          <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-16">
            {children}
          </main>
          <Footer />
          <ComplianceProviders />
        </ThemeProvider>
      </body>
    </html>
  );
}
