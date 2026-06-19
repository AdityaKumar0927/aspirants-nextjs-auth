import "../globals.css"
import cx from "classnames"
import { sfPro, inter, deskFontVars } from "../fonts";
import Nav from "@/components/layout/nav"
import { Footer } from "@/components/layout/footer"
import { Suspense } from "react"
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import "@fortawesome/fontawesome-svg-core/styles.css"
import { config } from "@fortawesome/fontawesome-svg-core"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import Bar from "@/components/layout/Bar"
import { Toaster } from "@/components/ui/toaster"
import { LoadingProvider } from "@/components/layout/LoadingContext"
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext"
import { ThemeProvider } from "@/components/landing/theme-provider"
import type { Metadata } from "next"
import { buildMetadata } from "@/lib/site-config"

config.autoAddCss = false

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Learn", {
    description:
      "Understand hard material instead of just memorizing it. It compiles a personalized lesson prompt for your own AI, then plays the result back as an interactive, science-based lesson — no API key, your material never leaves your AI.",
  })
}

export default function KeystoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          integrity="sha384-k6RqeWeci5ZR/Lv4MR0sA0FfDOMGd8V0ER0VgLRW3UppZWW1tBgFO7VVHAb7FZk5"
          crossOrigin="anonymous"
        />
      </head>
      <body className={cx(sfPro.variable, inter.variable, deskFontVars, "theme-desk desk-grid")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light", "dark", "pink"]}>
          <LoadingProvider>
            <UserPerformanceProvider userId={null}>
              <TooltipProvider>
                <div className="fixed inset-0 z-[-10]"></div>
                <Suspense fallback="...">
                  <Nav />
                </Suspense>
                <main className="flex min-h-screen w-full flex-col items-center px-4 py-24 sm:py-28">
                  {children}
                </main>
                <Bar userId={null} />
                <Footer />
                <ComplianceProviders />
              </TooltipProvider>
              <Toaster />
            </UserPerformanceProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
