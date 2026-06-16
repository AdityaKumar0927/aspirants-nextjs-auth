import "../globals.css";
import cx from "classnames";
import { sfPro, inter, deskFontVars } from "../fonts";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { Suspense } from "react";
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import Bar from '@/components/layout/Bar';
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from "@/components/layout/LoadingContext";
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext";
import DeskThemeProvider from "@/components/theme/theme-provider"

config.autoAddCss = false;

export const metadata = {
  title: "penwise",
  description: "",
  metadataBase: new URL("https://penwise-git-main-aditya-kumar-s-projects.vercel.app/"),
};

// Assuming you get the userId from some authentication context or similar.
const getUserId = () => {
  // Replace this with actual logic to fetch user ID, e.g., from a session or a context.
  // Return null if user is not signed in.
  const userId = null; // Simulate unsigned user. Replace with actual authentication logic.
  return userId;
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId(); // Fetch the user ID

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
      <body className={cx(sfPro.variable, inter.variable, deskFontVars, "theme-desk desk-grid")}>
        <DeskThemeProvider>
        <LoadingProvider>
          <UserPerformanceProvider userId={userId}> 
            <TooltipProvider>
              <div className="fixed inset-0 z-[-10]"></div>
              <Suspense fallback="...">
                <Nav />
              </Suspense>
              <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
                {children}
              </main>
              {/* Render the Bar for both signed-in and non-signed-in users */}
              <Bar userId={userId} />
              <Footer />
              <ComplianceProviders />
            </TooltipProvider>
            <Toaster />
          </UserPerformanceProvider> 
        </LoadingProvider>
        </DeskThemeProvider>
      </body>
    </html>
  );
}
