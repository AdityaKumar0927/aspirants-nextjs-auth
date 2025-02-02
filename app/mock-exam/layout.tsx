import "../globals.css"
import cx from "classnames"
import { sfPro, inter } from "../fonts"
import Nav from "@/components/layout/nav"
import { Footer } from "@/components/layout/footer"
import { Suspense } from "react"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import "@fortawesome/fontawesome-svg-core/styles.css"
import { config } from "@fortawesome/fontawesome-svg-core"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Toaster } from "@/components/ui/toaster"
import { LoadingProvider } from "@/components/layout/LoadingContext"
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext"

// Prevent FontAwesome from adding its CSS automatically
config.autoAddCss = false

export const metadata = {
  title: "aspirants",
  description: "",
  metadataBase: new URL("https://aspirants.tech/"),
}

// Placeholder function simulating user ID retrieval
const getUserId = () => {
  // Replace with actual authentication logic as needed
  return null // null means "no user signed in"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId()

  return (
    <html lang="en">
      <head>
        {/* Preconnect to load Inter from rsms.me */}
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

        {/* MathJax for LaTeX rendering */}
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
                  skipHtmlTags: ['script','noscript','style','textarea','pre'],
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

        {/* FontAwesome CSS (can also just import at the top) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          integrity="sha384-k6RqeWeci5ZR/Lv4MR0sA0FfDOMGd8V0ER0VgLRW3UppZWW1tBgFO7VVHAb7FZk5"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
                link.integrity = 'sha384-k6RqeWeci5ZR/Lv4MR0sA0FfDOMGd8V0ER0VgLRW3UppZWW1tBgFO7VVHAb7FZk5';
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
              })();
            `,
          }}
        />

        {/* Crucial for responsiveness on mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body className={cx(sfPro.variable, inter.variable, "bg-white")}>
        <UserPerformanceProvider userId={userId}>
          <TooltipProvider>
            {/* Optional background or gradient if needed */}
            <div className="fixed inset-0 z-[-10]" />

            {/* Suspense if Nav is code-split or async */}
            <Suspense fallback="Loading...">
              <Nav />
            </Suspense>

            {/* 
              MAIN CONTENT 
              - Removed `items-center justify-center py-32`
              - Now uses minimal padding, and can be refined at breakpoints
            */}
            <main className="min-h-screen w-full flex flex-col px-4 py-6">
              {children}
            </main>

            {/* Optional Footer (remove if not needed) */}
            <Footer />

            {/* Vercel Analytics */}
            <VercelAnalytics />

          </TooltipProvider>

          {/* Toast notifications */}
          <Toaster />
        </UserPerformanceProvider>
      </body>
    </html>
  )
}
