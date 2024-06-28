import "./globals.css";
import cx from "classnames";
import { sfPro, inter } from "./fonts";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import { Suspense } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

export const metadata = {
  title: "aspirants",
  description: "",
  metadataBase: new URL("https://aspirants.tech/"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head> <script
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
          /></head>
      <body className={cx(sfPro.variable, inter.variable, "bg-gradient-to-br from-indigo-50 via-white to-cyan-100")}>
        <div className="fixed inset-0 z-[-10]"></div>
        <Suspense fallback="...">
          <Nav />
        </Suspense>
        <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
          {children}
        </main>
        <Footer />
        <VercelAnalytics />
      </body>
    </html>
  );
}
