import React from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import T from '@/components/i18n/T';

// Labels are i18n keys (resolved client-side via <T/>); hrefs stay literal.
const footerNavs = [
  {
    key: "footer.product",
    items: [
      { href: "/blueprint", key: "footer.items.examBlueprints" },
      { href: "/question-bank", key: "footer.items.questionBank" },
    ],
  },
  {
    key: "footer.legal",
    items: [
      { href: "/privacy-policy", key: "footer.items.privacy" },
      { href: "/terms-of-service", key: "footer.items.terms" },
      { href: "/cookie-policy", key: "footer.items.cookies" },
      { href: "/consent-notice", key: "footer.items.consent" },
      { href: "/grievance", key: "footer.items.grievance" },
    ],
  },
];

// Colors use the desk design tokens (paper/ink/pencil/rule), which are defined
// globally for every theme (:root / .dark / .pink) — so the footer follows the
// light, dark AND heart/pink themes instead of being hard-coded white.
export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex flex-col items-start">
              <span className="self-start text-3xl font-light tracking-tight whitespace-nowrap text-ink">Penwise</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-pencil">
              <T k="footer.description" />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-2 lg:col-span-2">
            {footerNavs.map((nav) => (
              <div key={nav.key}>
                <h2 className="mb-6 text-sm font-semibold uppercase text-ink">
                  <T k={nav.key} />
                </h2>
                <ul className="text-pencil">
                  {nav.items.map((item) => (
                    <li key={item.key} className="mb-1 sm:mb-4">
                      <Link
                        href={item.href}
                        className="flex min-h-11 items-center wrap-break-word transition-colors duration-200 hover:text-ink hover:underline sm:min-h-0"
                      >
                        <T k={item.key} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-rule pt-8">
          <div className="mb-6 flex justify-start sm:justify-end">
            <LanguageSwitcher />
          </div>
          <div className="sm:flex sm:justify-between">
            <p className="text-xs text-pencil">
              © {new Date().getFullYear()} Penwise. <T k="footer.rights" />
            </p>
            <p className="mt-4 text-xs text-pencil sm:mt-0">
              <T k="footer.madeWith" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
