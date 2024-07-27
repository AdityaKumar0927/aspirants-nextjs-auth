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
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <div className="gap-4 p-4 py-16 sm:pb-16 md:flex md:justify-between">
          <div className="mb-12 flex flex-col gap-4">
            <a href="/" className="flex items-center gap-2">
              <img
                className="h-20 w-20"
                src="bulb.svg"
                alt="aspirants Logo"
              />
              <span className="self-center whitespace-nowrap  font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem] text-neutral-900 dark:text-white">
                aspirants
              </span>
            </a>
            <div className="max-w-sm">
              <div className="z-10 mt-4 flex w-full flex-col items-start text-left">
                <p className="mt-2">
                  Use aspirants, save time.
                </p>
                <a
                  href="/signup"
                  className={cn(
                    buttonVariants({
                      size: "lg",
                      variant: "default",
                    }),
                    "mt-4 w-full rounded-full px-6 text-sm font-semibold tracking-tighter transition-all ease-out hover:ring-2 hover:ring-neutral-800 hover:ring-offset-2 hover:ring-offset-current dark:hover:ring-neutral-50",
                  )}
                >
                  Get Started
                  <ChevronRightIcon className="ml-1 size-4 transition-all duration-300 ease-out group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
          <span className="text-sm tracking-tight text-neutral-500 dark:text-neutral-400 sm:text-center">
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
