// app/administrator/layout.tsx
"use client";

import "../globals.css";
import cx from "classnames";
import { sfPro, inter } from "../fonts";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { AdminLayout } from "./application-layout";
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Configuration for FontAwesome
config.autoAddCss = false;

// Define the updated Event type to match the ApplicationLayout's expected type
interface Event {
  id: number;
  name: string;
  url: string;
  date: string;
  time: string;
  location: string;
  totalRevenue: string;
  totalRevenueChange: string;
  ticketsAvailable: number;
  ticketsSold: number;
  ticketsSoldChange: string;
  thumbUrl: string;
  pageViews: string; // Corrected to match the expected type
  pageViewsChange: string;
  status: string;
  imgUrl: string;
}

function AuthorizationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const allowedEmails = ['artistadityakumar@gmail.com', 'aditanshu.sinha@gmail.com'];

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !allowedEmails.includes(session.user?.email || '')) {
      router.push('/'); // Redirect unauthorized users
    }
  }, [session, status, router]);

  return session && allowedEmails.includes(session.user?.email || '') ? <>{children}</> : null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Correctly typed events array, initializing with an empty array
  const events: Event[] = []; // Replace with actual events fetching logic if needed

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
      </head>
      <body className={cx(sfPro.variable, inter.variable, "bg-white")}>
        <SessionProvider>
          <AuthorizationGuard>
            <AdminLayout>
              {children}
            </AdminLayout>
          </AuthorizationGuard>
        </SessionProvider>
      </body>
    </html>
  );
}
