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
      { href: "/mission", key: "footer.items.mission" },
      { href: "/contact", key: "footer.items.contact" },
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

export function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex flex-col items-start">
              <span className="self-start text-3xl font-light tracking-tight whitespace-nowrap dark:text-white">Penwise</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              <T k="footer.description" />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-2 lg:col-span-2">
            {footerNavs.map((nav) => (
              <div key={nav.key}>
                <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">
                  <T k={nav.key} />
                </h2>
                <ul className="text-gray-600 dark:text-gray-400">
                  {nav.items.map((item) => (
                    <li key={item.key} className="mb-4">
                      <Link
                        href={item.href}
                        className="hover:underline transition-all duration-200"
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
        <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
          <div className="mb-6 flex justify-start sm:justify-end">
            <LanguageSwitcher />
          </div>
          <div className="sm:flex sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Penwise. <T k="footer.rights" />
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 sm:mt-0">
              <T k="footer.madeWith" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

