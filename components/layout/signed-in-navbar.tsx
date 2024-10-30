"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSignInModal } from "./sign-in"
import UserDropdown from "./user-dropdown"
import { Button } from "@/components/ui/button"
import NotificationDropdown from "@/components/shared/NotificationDropdown"
import { Session } from "next-auth"
import { Menu, X, ChevronDown } from "lucide-react"
import useScroll from "@/lib/hooks/use-scroll"
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
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

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
]

const supportLinks = [
  {
    title: "Survey",
    href: "/survey",
    description: "Support our platform by surveying with us.",
  },
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
]

const examsLinks = [
  { title: "JEE", href: "/#" },
  { title: "CUET", href: "/#" },
  { title: "CBSE", href: "/#" },
  { title: "A Levels", href: "/#" },
  { title: "CAT", href: "/#" },
  { title: "UPSC", href: "/#" },
]

export default function NavBar({ session }: { session: Session | null }) {
  const { SignInModal, setShowSignInModal } = useSignInModal()
  const scrolled = useScroll(50)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [examsOpen, setExamsOpen] = React.useState(false)
  const [supportOpen, setSupportOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
    setExamsOpen(false)
    setSupportOpen(false)
  }

  const toggleExams = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExamsOpen(!examsOpen)
    setSupportOpen(false)
  }

  const toggleSupport = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSupportOpen(!supportOpen)
    setExamsOpen(false)
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
        setExamsOpen(false)
        setSupportOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <>
      <SignInModal />
      <nav
        className={cn(
          "fixed left-1/2 transform -translate-x-1/2 w-full max-w-screen-{1000px} z-30 transition-all duration-300 ease-in-out",
          scrolled
            ? "backdrop-blur-sm shadow-sm"
            : ""
        )}
      >
        <div className="mx-auto flex h-16 items-center justify-between w-11/12 md:w-10/12 lg:w-9/12">
          <Link href="/" className="flex items-center font-display text-2xl">
            <p className="text-left font-display text-2xl tracking-[-0.07em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
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
        <Link href={session ? "/QuestionBank" : "/QuestionBank/guest"} passHref legacyBehavior>
          <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black")}>
               Question Bank
         </NavigationMenuLink>
              </Link>
          </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-display text-sm text-black">Exams</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-4 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
                      {examsLinks.map((exam) => (
                        <ListItem key={exam.title} title={exam.title} href={exam.href}>
                          {exam.title}
                        </ListItem>
                      ))}
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
              <Button
                variant="outline"
                onClick={() => setShowSignInModal(true)}
              >
                Sign In
              </Button>
            )}
          </div>
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-black focus:outline-none"
              onClick={toggleMenu}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 right-0 bg-white shadow-lg z-20 md:hidden"
          >
            <div className="p-4 space-y-4">
              <Link
                href="/QuestionBank"
                className="block w-full text-left font-display text-lg text-black hover:text-gray-600 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Question Bank
              </Link>
              <div>
                <button
                  className="flex items-center justify-between w-full text-left font-display text-lg text-black hover:text-gray-600 transition-colors"
                  onClick={toggleExams}
                  aria-expanded={examsOpen}
                >
                  Exams
                  <ChevronDown
                    size={20}
                    className={cn("transition-transform", examsOpen && "rotate-180")}
                  />
                </button>
                {examsOpen && (
                  <ul className="mt-2 space-y-2 pl-4">
                    {examsLinks.map((exam) => (
                      <li key={exam.title}>
                        <Link
                          href={exam.href}
                          className="block text-sm text-gray-600 hover:text-black transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          {exam.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <button
                  className="flex items-center justify-between w-full text-left font-display text-lg text-black hover:text-gray-600 transition-colors"
                  onClick={toggleSupport}
                  aria-expanded={supportOpen}
                >
                  Support
                  <ChevronDown
                    size={20}
                    className={cn("transition-transform", supportOpen && "rotate-180")}
                  />
                </button>
                {supportOpen && (
                  <ul className="mt-2 space-y-2 pl-4">
                    {supportLinks.map((link) => (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="block text-sm text-gray-600 hover:text-black transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {session ? (
                <UserDropdown session={session} />
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowSignInModal(true)
                    setMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
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
  )
})
ListItem.displayName = "ListItem"