// components/layout/signed-out-navbar.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSignInModal } from "./sign-in";
import { useSignUpModal } from "./sign-up"; // Import the sign-up modal hook
import { Menu } from "lucide-react";
import useScroll from "@/lib/hooks/use-scroll";
import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const supportLinks = [
  {
    title: "Donate",
    href: "/Donate",
    description: "Support our platform with your donations.",
  },
  {
    title: "Report",
    href: "/Report",
    description: "Report issues or provide feedback.",
  },
  {
    title: "Contact",
    href: "/Contact",
    description: "Get in touch with us for support.",
  },
];

export default function SignedOutNavbar() {
  const { SignInModal, setShowSignInModal } = useSignInModal();
  const { SignUpModal, setShowSignUpModal } = useSignUpModal(); // Use the sign-up modal hook
  const scrolled = useScroll(50);
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <SignInModal />
      <SignUpModal />
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-30 ${
          scrolled
            ? "bg-white/50 backdrop-blur-sm shadow-sm"
            : "bg-white/90"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center font-display text-2xl">
              <p className="font-display text-2xl tracking-[-0.07em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
                aspirants
              </p>
              <Image
                src="/bulb.svg"
                alt="aspirants logo"
                width={30}
                height={30}
                className="ml-2"
              />
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link href="/QuestionBank" passHref legacyBehavior>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "font-display text-sm text-black"
                        )}
                      >
                        Question Bank
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-display text-sm text-black">
                      Support
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[300px] gap-3 p-4 md:w-[400px] md:grid-cols-1 lg:w-[500px]">
                        {supportLinks.map((link) => (
                          <ListItem
                            key={link.title}
                            title={link.title}
                            href={link.href}
                          >
                            {link.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <Button variant="outline"
                onClick={() => setShowSignInModal(true)}
              >
                Log In
              </Button>
              <Button variant="secondary"
                onClick={() => setShowSignUpModal(true)} // Open the sign-up modal
              >
                Sign Up
              </Button>
            </div>
            <div className="md:hidden">
              <button
                className="text-black focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Menu />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>
      {/* ... rest of your code ... */}
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string;
    children: React.ReactNode;
  }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 font-display text-sm text-black",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-500">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
