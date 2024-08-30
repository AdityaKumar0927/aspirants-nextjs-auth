import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRightIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";

const footerNavs = [
  {
    label: "Product",
    items: [
      {
        href: "#",
        name: "Features",
      },
      {
        href: "#",
        name: "Pricing",
      },
      {
        href: "#",
        name: "FAQ",
      },
      {
        href: "mailto:support@example.com",
        name: "Support",
      },
    ],
  },
  {
    label: "Company",
    items: [
      {
        href: "#",
        name: "About Us",
      },
      {
        href: "#",
        name: "Blog",
      },
      {
        href: "#",
        name: "Careers",
      },
      {
        href: "#",
        name: "Contact",
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        href: "#",
        name: "Documentation",
      },
      {
        href: "#",
        name: "API Reference",
      },
      {
        href: "#",
        name: "Community",
      },
    ],
  },
  {
    label: "Legal",
    items: [
      {
        href: "/privacy-policy",
        name: "Privacy Policy",
      },
      {
        href: "/terms-of-service",
        name: "Terms of Service",
      },
      {
        href: "/Cookie-Policy",
        name: "Cookie Policy",
      },
    ],
  },
];

const footerSocials = [
  {
    href: "#",
    name: "Linkedin",
    icon: <LinkedInLogoIcon className="size-4" />,
  },
  {
    href: "#",
    name: "Twitter",
    icon: <TwitterLogoIcon className="size-4" />,
  },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-96 w-full sm:w-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="gap-4 p-4 py-16 sm:pb-16 md:flex md:justify-between">
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {footerNavs.map((nav) => (
              <div key={nav.label}>
                <h2 className="mb-6 text-sm font-semibold uppercase text-neutral-900 dark:text-white">
                  {nav.label}
                </h2>
                <ul className="grid gap-2">
                  {nav.items.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[15px]/snug font-medium text-neutral-400 duration-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        {item.name}
                        <ChevronRightIcon className="h-4 w-4 translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t py-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="flex space-x-5 sm:mt-0 sm:justify-center">
            {footerSocials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="fill-neutral-500 text-neutral-500 hover:fill-neutral-900 hover:text-neutral-900 dark:hover:fill-neutral-600 dark:hover:text-neutral-600"
              >
                {social.icon}
                <span className="sr-only">{social.name}</span>
              </a>
            ))}
          </div>
          <span className="text-sm tracking-tight text-neutral-800 dark:text-neutral-400 sm:text-center">
            Copyright © {new Date().getFullYear()}{" "}
            <a href="/" className="cursor-pointer">
              aspirants
            </a>
            . All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
