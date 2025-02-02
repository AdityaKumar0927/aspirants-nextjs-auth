import "../globals.css"
import cx from "classnames"
import { sfPro, inter } from "../fonts"

import Nav from "@/components/layout/nav"
import { Footer } from "@/components/layout/footer"

// For lazy loading your Nav, etc.
import { Suspense } from "react"

// Vercel Analytics
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"

// Font Awesome / MathJax config
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'
config.autoAddCss = false

// Radix / Shadcn Tooltip & Toast
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"

// Your Providers
import { LoadingProvider } from "@/components/layout/LoadingContext"
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext"

export const metadata = {
  title: "aspirants",
  description: "",
}

// Example function to get userId. Replace with real auth logic.
const getUserId = () => {
  return null
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId()

  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        {/* MathJax, Inter font, Font Awesome, etc. */}
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <script
          async
          id="MathJax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\(', '\\)']],
                  displayMath: [['$$', '$$'], ['\\[', '\\]']],
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                },
                startup: {
                  ready: () => {
                    window.MathJax.startup.defaultReady();
                    window.MathJax.startup.promise.then(() => {
                      console.log('MathJax is loaded, configured, and ready');
                    });
                  },
                },
              };
            `,
          }}
        />
      </head>

      {/* 
        Make the body a flex container that fills the screen, 
        so that the main area can be scrollable. 
      */}
      <body className={cx(sfPro.variable, inter.variable, "bg-white h-full flex flex-col")}>
        <UserPerformanceProvider userId={userId}>
          <TooltipProvider>
            {/* If Nav is expensive, use Suspense fallback */}
            <Suspense fallback="Loading navigation...">
              <Nav />
            </Suspense>

            {/* 
              Make the main area flex-1 so it expands/scrolls.
              Remove `items-center justify-center py-32`. 
              That was forcing the child to stay pinned in the center.
            */}
            <main className="flex-1 w-full overflow-auto">
              {children}
            </main>

            {/* (Optional) Place a global Footer at the bottom */}
            <Footer />

            {/* Vercel analytics and toaster for notifications */}
            <VercelAnalytics />
            <Toaster />
          </TooltipProvider>
        </UserPerformanceProvider>
      </body>
    </html>
  )
}
