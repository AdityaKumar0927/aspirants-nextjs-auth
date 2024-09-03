"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSignInModal } from "./sign-in-modal";
import { Menu } from "lucide-react";
import useScroll from "@/lib/hooks/use-scroll";
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
  const scrolled = useScroll(50);
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <SignInModal />
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
                      <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black")}>
                        Question Bank
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-display text-sm text-black">Support</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[300px] gap-3 p-4 md:w-[400px] md:grid-cols-1 lg:w-[500px]">
                        {supportLinks.map((link) => (
                          <ListItem key={link.title} title={link.title} href={link.href}>
                            {link.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <button
                className="rounded-lg text-center border border-black bg-black p-1.5 px-4 text-sm text-white transition-all hover:bg-gray-800"
                onClick={() => setShowSignInModal(true)}
              >
                Log In
              </button>
              <button
                className="rounded-lg text-center border border-black p-1.5 px-4 text-sm text-black transition-all hover:bg-gray-200"
                onClick={() => setShowSignInModal(true)}
              >
                Sign Up
              </button>
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
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black opacity-25" onClick={() => setMenuOpen(false)}></div>
            <motion.div
              className="absolute top-16 inset-x-4 bg-white rounded-lg shadow-lg p-4"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex flex-col space-y-4">
                <Link href="/QuestionBank" onClick={() => setMenuOpen(false)}>
                  <motion.p
                    className="text-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Question Bank
                  </motion.p>
                </Link>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Support</p>
                  {supportLinks.map((link) => (
                    <Link key={link.title} href={link.href} onClick={() => setMenuOpen(false)}>
                      <motion.p
                        className="text-sm pl-4"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {link.title}
                      </motion.p>
                    </Link>
                  ))}
                </div>
                <motion.button
                  className="w-full rounded-lg text-center border border-black bg-black p-2 text-sm text-white transition-all"
                  onClick={() => {
                    setShowSignInModal(true);
                    setMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Log In
                </motion.button>
                <motion.button
                  className="w-full rounded-lg text-center border border-black p-2 text-sm text-black transition-all"
                  onClick={() => {
                    setShowSignInModal(true);
                    setMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground font-display text-sm text-black",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";