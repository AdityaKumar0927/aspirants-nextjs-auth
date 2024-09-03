import React from 'react';
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRightIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import Link from 'next/link';

const footerNavs = [
  {
    label: "Product",
    items: [
      { href: "#", name: "Features" },
      { href: "#", name: "Pricing" },
      { href: "#", name: "FAQ" },
      { href: "mailto:support@example.com", name: "Support" },
    ],
  },
  {
    label: "Company",
    items: [
      { href: "#", name: "About Us" },
      { href: "#", name: "Blog" },
      { href: "#", name: "Careers" },
      { href: "#", name: "Contact" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "#", name: "Documentation" },
      { href: "#", name: "API Reference" },
      { href: "#", name: "Community" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/privacy-policy", name: "Privacy Policy" },
      { href: "/terms-&-conditions", name: "Terms of Service" },
      { href: "/cookie-policy", name: "Cookie Policy" },
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
];

export function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <Link href="/" className="flex items-center">
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Aspirants</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              Empowering aspirants to achieve their goals through innovative solutions and support.
            </p>
            <div className="mt-8 flex space-x-6">
              {footerSocials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
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
                        className="group inline-flex items-center hover:underline"
                      >
                        {item.name}
                        <ChevronRightIcon className="ml-2 h-4 w-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
          <div className="sm:flex sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Aspirants. All rights reserved.
            </p>
            <nav className="mt-4 flex space-x-4 sm:mt-0">
              <Link href="/privacy-policy" className="text-xs text-gray-500 hover:underline dark:text-gray-400">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-xs text-gray-500 hover:underline dark:text-gray-400">Terms of Service</Link>
              <Link href="/cookie-policy" className="text-xs text-gray-500 hover:underline dark:text-gray-400">Cookie Policy</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}