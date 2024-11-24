import React from 'react';
import { LinkedInLogoIcon, TwitterLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import Link from 'next/link';
import { Roboto_Slab } from 'next/font/google';
import Script from 'next/script';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: '300' });

const footerNavs = [
  {
    label: "Company",
    items: [
      { href: "/mission", name: "Our Mission" },
      { href: "/Contact", name: "Contact" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/privacy-policy", name: "Privacy Policy" },
      { href: "/terms-of-service", name: "Terms of Service" },
      { href: "/cookies", name: "Cookie Policy" },
    ],
  },
];

const footerSocials = [
  {
    href: "#",
    name: "LinkedIn",
    icon: <LinkedInLogoIcon className="h-5 w-5" />,
  },
  {
    href: "#",
    name: "Twitter",
    icon: <TwitterLogoIcon className="h-5 w-5" />,
  },
  {
    href: "#",
    name: "GitHub",
    icon: <GitHubLogoIcon className="h-5 w-5" />,
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex flex-col items-start">
              <span className="self-start text-3xl font-light tracking-tight whitespace-nowrap dark:text-white">Aspirants</span>
              <span className={`${robotoSlab.className} text-sm text-blue-500 mt-1`}>Shaping Dreams</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              Empowering aspirants to achieve their goals through innovative solutions and support.
            </p>
            <div className="mt-8 flex space-x-6">
              {footerSocials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-2 lg:col-span-2">
            {footerNavs.map((nav) => (
              <div key={nav.label}>
                <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">
                  {nav.label}
                </h2>
                <ul className="text-gray-600 dark:text-gray-400">
                  {nav.items.map((item) => (
                    <li key={item.name} className="mb-4">
                      <Link
                        href={item.href}
                        className="hover:underline transition-all duration-200"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">
                Subscribe to our newsletter
              </h2>
              <div id="custom-substack-embed"></div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
          <div className="sm:flex sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Aspirants. All rights reserved.
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 sm:mt-0">
              Designed with ❤️ for aspirants worldwide.
            </p>
          </div>
        </div>
      </div>
      <Script id="substack-widget" strategy="afterInteractive">
        {`
          window.CustomSubstackWidget = {
            substackUrl: "aspirantstech.substack.com",
            placeholder: "example@gmail.com",
            buttonText: "Subscribe",
            theme: "green"
          };
        `}
      </Script>
      <Script 
        src="https://substackapi.com/widget.js" 
        strategy="lazyOnload"
      />
    </footer>
  );
}

