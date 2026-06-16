import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter, deskFontVars } from "../fonts";
import { Suspense } from "react";
import ComplianceProviders from "@/components/compliance/ComplianceProviders";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from "@/components/layout/LoadingContext";
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext";
import Nav from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import Bar from '@/components/layout/Bar';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "../api/auth/[...nextauth]/options";

config.autoAddCss = false;

const getUserId = async () => {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id ?? null;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
};

export const metadata = {
  title: 'penwise',
  description: '',
  metadataBase: new URL('https://penwise-git-main-aditya-kumar-s-projects.vercel.app/'),
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const userId = await getUserId();

  return (
    <html lang="en" suppressHydrationWarning>
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
                <Bar userId={userId} />
                <Footer />
                <ComplianceProviders />
                <Toaster />
              </TooltipProvider>
            </UserPerformanceProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

