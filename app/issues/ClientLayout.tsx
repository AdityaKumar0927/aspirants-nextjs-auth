'use client'

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { LoadingProvider } from "@/components/layout/LoadingContext";
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext";
import Nav from "@/components/layout/nav";
import Bar from '@/components/layout/Bar';
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";

interface ClientLayoutProps {
  children: React.ReactNode;
  userId: string | null;
}

export default function ClientLayout({ children, userId }: ClientLayoutProps) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <UserPerformanceProvider userId={userId}>
          <TooltipProvider>
            <div className="fixed inset-0 z-[-10]"></div>
            <Nav />
            <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
              {children}
            </main>
            <Bar userId={userId} />
            <Footer />
          </TooltipProvider>
          <Toaster />
        </UserPerformanceProvider>
      </LoadingProvider>
    </SessionProvider>
  );
}