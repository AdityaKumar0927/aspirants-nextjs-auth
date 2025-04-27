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
import { ThemeProvider } from "../components/theme-provider"

config.autoAddCss = false

export const metadata = {
  title: "aspirants",
  description: "",
  metadataBase: new URL("https://aspirants.tech/"),
}

const getUserId = () => {
  const userId = null
  return userId
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId()

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <script async id="MathJax-script" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\$$', '\$$']],
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
      </head>
      <body className={cx(sfPro.variable, inter.variable, "bg-white")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LoadingProvider>
            <UserPerformanceProvider userId={userId}>
              <TooltipProvider>
                <div className="fixed inset-0 z-[-10]"></div>
                <Suspense fallback="...">
                  <Nav />
                </Suspense>
                <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">{children}</main>
                <VercelAnalytics />
              </TooltipProvider>
              <Toaster />
            </UserPerformanceProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

