// app/(public)/layout.tsx
import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "@/app/fonts";
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
import { getServerSession } from 'next-auth/next'; // Ensure this points to NextAuth setup
import authOptions from "../[...nextauth]/options";
import { cookies } from 'next/headers'; // Import cookies for server-side session management

config.autoAddCss = false;

// Function to get the user ID from the session
const getUserId = async () => {
  try {
    // Fetch the session using NextAuth's getServerSession with the defined options
    const session = await getServerSession(authOptions);

    // Check if session exists and has a user with an ID
    if (session && session.user && session.user.id) {
      return session.user.id;
    }

    // Return null if the session does not contain a valid user ID
    return null;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
};


export const metadata = {
  title: 'aspirants',
  description: '',
  metadataBase: new URL('https://aspirants.tech/'),
};


export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Fetch the user ID before rendering the component
  const userId = await getUserId();


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
