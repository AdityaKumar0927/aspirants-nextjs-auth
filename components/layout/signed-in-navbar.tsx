"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSignInModal } from "./sign-in-modal";
import UserDropdown from "./user-dropdown";
import NotificationDropdown from "@/components/shared/NotificationDropdown";
import { Session } from "next-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import useScroll from "@/lib/hooks/use-scroll";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
  NavigationMenuIndicator,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const components = [
  {
    title: "PDF to Mock Exam",
    href: "/#",
    description: "Convert your PDF files into a mock exam format.",
  },
  {
    title: "Develop",
    href: "/#",
    description: "Tools to help you develop your skills and knowledge.",
  },
  {
    title: "Productivity",
    href: "/#",
    description: "Increase your productivity with our tools.",
  },
];

const supportLinks = [
  {
    title: "Donate",
    href: "/#",
    description: "Support our platform with your donations.",
  },
  {
    title: "Report",
    href: "/#",
    description: "Report issues or provide feedback.",
  },
  {
    title: "Contact",
    href: "/#",
    description: "Get in touch with us for support.",
  },
];

const examsLinks = [
  { title: "JEE", href: "/#" },
  { title: "CUET", href: "/#" },
  { title: "CBSE", href: "/#" },
  { title: "A Levels", href: "/#" },
  { title: "CAT", href: "/#" },
  { title: "UPSC", href: "/#" },
];

export default function NavBar({ session }: { session: Session | null }) {
  const { SignInModal, setShowSignInModal } = useSignInModal();
  const scrolled = useScroll(50);
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <SignInModal />
      <div
        className={`fixed left-1/2 transform -translate-x-1/2 w-full max-w-screen-{1000px} ${
          scrolled
            ? "bg-white/50 backdrop-blur-sm"
            : "bg-white/90"
        } flex justify-between items-center z-30 transition-all duration-300 ease-in-out`}
      >
        <div className="mx-5 flex h-16 items-center justify-between w-full">
          <Link href="/" className="flex items-center font-display text-2xl">
            <p className="text-left font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
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
          <div className="hidden md:flex items-center justify-center space-x-4 flex-1">
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
                  <NavigationMenuTrigger className="font-display text-sm text-black">Exams</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-4 md:w-[400px] md:grid-cols-3 lg:w-[500px]">
                      <li>
                       
                        <ul>
                          {examsLinks.map((exam) => (
                            <ListItem key={exam.title} title={exam.title} href={exam.href}>
                              {exam.title}
                            </ListItem>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </NavigationMenuContent>
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
              <NavigationMenuIndicator />
              <NavigationMenuViewport />
            </NavigationMenu>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <NotificationDropdown />
                <UserDropdown session={session} />
              </>
            ) : (
              <button
                className="rounded-full border border-black bg-white p-1.5 px-4 text-sm text-black transition-all hover:bg-black hover:text-white"
                onClick={() => setShowSignInModal(true)}
              >
                Sign In
              </button>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="text-black focus:outline-none">
                  <FontAwesomeIcon icon={faBars} size="lg" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-3/4 sm:w-1/3">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  <Link href="/QuestionBank" onClick={() => setMenuOpen(false)}>
                    <p className="text-center font-display text-2xl font-bold tracking-tight drop-shadow-sm">
                      Question Bank
                    </p>
                  </Link>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="features">
                      <AccordionTrigger className="text-center font-display text-2xl font-bold tracking-tight drop-shadow-sm">
                        Features
                      </AccordionTrigger>
                      <AccordionContent>
                        <div>
                          <p className="text-center font-display text-lg font-medium tracking-tight drop-shadow-sm">Exams</p>
                          {examsLinks.map((exam) => (
                            <Link key={exam.title} href={exam.href} onClick={() => setMenuOpen(false)}>
                              <p className="text-center font-display text-lg font-medium tracking-tight drop-shadow-sm">
                                {exam.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                        <div>
                          <p className="text-center font-display text-lg font-medium tracking-tight drop-shadow-sm">Automation Tools</p>
                          {components.map((component) => (
                            <Link key={component.title} href={component.href} onClick={() => setMenuOpen(false)}>
                              <p className="text-center font-display text-lg font-medium tracking-tight drop-shadow-sm">
                                {component.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="support">
                      <AccordionTrigger className="text-center font-display text-2xl font-bold tracking-tight drop-shadow-sm">
                        Support
                      </AccordionTrigger>
                      <AccordionContent>
                        {supportLinks.map((link) => (
                          <Link key={link.title} href={link.href} onClick={() => setMenuOpen(false)}>
                            <p className="text-center font-display text-lg font-medium tracking-tight drop-shadow-sm">
                              {link.title}
                            </p>
                          </Link>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  {session ? (
                    <UserDropdown session={session} />
                  ) : (
                    <button
                      className="rounded-full border border-black bg-white p-1.5 px-4 text-lg text-black transition-all hover:bg-black hover:text-white"
                      onClick={() => {
                        setShowSignInModal(true);
                        setMenuOpen(false);
                      }}
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
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
