// app/(public)/layout.tsx
import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import { Suspense } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from "@/components/layout/LoadingContext";
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import Bar from '@/components/layout/Bar';
import CookiePopup from "@/components/layout/cookie-popup"; // Import the updated CookiePopup component

config.autoAddCss = false;

// Function to get the user ID; replace this with actual authentication logic
const getUserId = () => {
  // Replace this with the actual logic to fetch user ID, e.g., from a session or a context.
  // Return null if the user is not signed in.
  const userId = null; // Simulate unsigned user. Replace with actual authentication logic.
  return userId;
};

export const metadata = {
  title: 'aspirants',
  description: '',
  metadataBase: new URL('https://aspirants.tech/'),
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId(); // Fetch the user ID

  return (
    <html lang="en">
      <head>
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
      <body className={cx(sfPro.variable, inter.variable, 'bg-white')}>
        <LoadingProvider>
          <UserPerformanceProvider userId={userId}>
            <TooltipProvider>
              <div className="fixed inset-0 z-[-10]"></div>
              <Suspense fallback="...">
                <Nav />
              </Suspense>
              {/* Render the CookiePopup only if the user is not signed in */}
              {!userId && <CookiePopup />}
              <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
                {children}
              </main>
              <Bar userId={userId} />
              <Footer />
              <VercelAnalytics />
              <Toaster />
            </TooltipProvider>
          </UserPerformanceProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
