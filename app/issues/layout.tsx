import "../globals.css";
import { sfPro, inter } from "../fonts";
import { Suspense } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import Script from 'next/script';
import ClientLayout from './ClientLayout';

config.autoAddCss = false;

export const metadata = {
  title: "aspirants - Issues",
  description: "Track and manage issues efficiently",
  metadataBase: new URL("https://aspirants.tech/"),
};

async function getUserId() {
  // Replace this with actual server-side logic to fetch user ID
  // For example, you might use getServerSession from next-auth
  return null; // Simulate unsigned user. Replace with actual authentication logic.
}

export default async function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();

  return (
    <html lang="en" className={`${sfPro.variable} ${inter.variable}`}>
      <body className="bg-white">
        <ClientLayout userId={userId}>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </ClientLayout>

        <VercelAnalytics />

        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
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
        <Script
          id="mathjax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="lazyOnload"
        />
        <Script
          id="font-awesome-cdn"
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}