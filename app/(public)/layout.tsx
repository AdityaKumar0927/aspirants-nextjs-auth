import { ThemeProvider } from "next-themes";
import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
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
import { getCurrentSession } from "@/lib/auth";
import { getAppConfig } from "@/lib/app-config";
import { isMaintenanceBlocked } from "@/lib/admin-controls";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/site-config";

config.autoAddCss = false;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(undefined, {
    metadataBase: new URL('https://penwise-git-main-aditya-kumar-s-projects.vercel.app/'),
  });
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Impersonation-aware: when an admin is impersonating, the whole public app
  // renders as the target user (and the banner shows it). Fails soft to signed-out.
  let session = null;
  try {
    session = await getCurrentSession();
  } catch (error) {
    console.error('Error fetching session:', error);
  }
  const userId = session?.user?.id ?? null;

  // Node-layer maintenance gate (the authoritative fallback when the edge mirror
  // / Upstash isn't configured). Admins and allow-listed IPs bypass.
  const config = await getAppConfig();
  if (config.maintenanceMode) {
    const hdrs = await headers();
    const ip = (hdrs.get('x-forwarded-for')?.split(',')[0] || hdrs.get('x-real-ip') || '').trim();
    if (isMaintenanceBlocked(config, { ip, isAdmin: session?.user?.role === 'administrator' })) {
      redirect('/maintenance');
    }
  }

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
      <body className={cx(sfPro.variable, inter.variable, 'theme-desk desk-grid-flat')}>
      <ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false} themes={["light", "dark", "pink"]}
>
          <LoadingProvider>
            <UserPerformanceProvider userId={userId}>
              {/* ComplianceProviders supplies SessionProvider + ConsentProvider;
                  it must WRAP the page tree so client components rendered in
                  {children} (e.g. the question card's discussion panel, which
                  calls useSession) have a session context. It also renders the
                  cookie banner + analytics gate after its children. */}
              <ComplianceProviders>
                <TooltipProvider>
                  <div className="fixed inset-0 z-[-10]"></div>
                  <Suspense fallback={null}>
                    <AnnouncementBanner />
                  </Suspense>
                  <Suspense fallback="...">
                    <Nav />
                  </Suspense>
                  <main className="flex min-h-screen w-full flex-col items-center justify-center py-20 sm:py-32">
                    {children}
                  </main>
                  <Bar userId={userId} />
                  <Footer />
                  <ImpersonationBanner />
                  <Toaster />
                </TooltipProvider>
              </ComplianceProviders>
            </UserPerformanceProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

