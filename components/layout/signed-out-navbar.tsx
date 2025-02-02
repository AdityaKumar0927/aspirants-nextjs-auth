"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSignInModal } from "./sign-in"
import { Menu, X, ChevronDown } from "lucide-react"
import useScroll from "@/lib/hooks/use-scroll"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
    href: "/issues",
    description: "Report issues or provide feedback.",
  },
  {
    title: "Contact",
    href: "/Contact",
    description: "Get in touch with us for support.",
  },
]

export default function SignedOutNavbar() {
  const { SignInModal, setShowSignInModal } = useSignInModal()
  const scrolled = useScroll(50)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [supportOpen, setSupportOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
    setSupportOpen(false)
  }

  const toggleSupport = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSupportOpen(!supportOpen)
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
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

      <motion.nav
        className={cn("fixed top-0 left-0 right-0 z-30", scrolled ? "backdrop-blur-md shadow-sm" : "")}
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
              <Image src="/bulb.svg" alt="aspirants logo" width={30} height={30} className="ml-2" />
              <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">BETA</span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              <DesktopNavLinks />
              <Button
                variant="outline"
                onClick={() => setShowSignInModal(true)}
                className="hover:border-blue-400 hover:bg-blue-200 hover:text-blue-500"
              >
                <p className="font-display tracking-[-0.02em] sm:leading-[2rem]">sign-in</p>
              </Button>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-black dark:text-white focus:outline-none"
                onClick={toggleMenu}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={menuRef}
              className="absolute top-full left-0 right-0 bg-white dark:bg-dark-background shadow-lg z-20 md:hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MobileNavLinks
                setMenuOpen={setMenuOpen}
                setShowSignInModal={setShowSignInModal}
                supportOpen={supportOpen}
                toggleSupport={toggleSupport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}

function DesktopNavLinks() {
  return (
    <nav>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/QuestionBank/guest" passHref legacyBehavior>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black dark:text-white")}
              >
                Question Bank
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/mock-exam" passHref legacyBehavior>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black dark:text-white")}
              >
                Mock Exam
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-display text-sm text-black dark:text-white">
              Support
            </NavigationMenuTrigger>
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
    </nav>
  )
}

interface MobileNavLinksProps {
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  setShowSignInModal: React.Dispatch<React.SetStateAction<boolean>>
  supportOpen: boolean
  toggleSupport: (e: React.MouseEvent) => void
}

function MobileNavLinks({ setMenuOpen, setShowSignInModal, supportOpen, toggleSupport }: MobileNavLinksProps) {
  return (
    <nav className="p-4 space-y-4 top-0 left-0 right-0 bg-white dark:bg-dark-background shadow-md z-[100000000]">
      <Link
        href="/QuestionBank/guest"
        className="block w-full text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Question Bank
      </Link>
      <Link
        href="/mock-exam"
        className="block w-full text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Mock Exam
      </Link>
      <div>
        <button
          className="flex items-center justify-between w-full text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          onClick={toggleSupport}
          aria-expanded={supportOpen}
        >
          Support
          <ChevronDown size={20} className={cn("transition-transform", supportOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {supportOpen && (
            <motion.ul
              className="mt-2 space-y-2 pl-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {supportLinks.map((link) => (
                <ListItem key={link.title} title={link.title} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.description}
                </ListItem>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setMenuOpen(false)
            setShowSignInModal(true)
          }}
        >
          sign-in
        </Button>
      </div>
    </nav>
  )
}

interface ListItemProps {
  title: string
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ title, href, children, className, onClick, ...props }, ref) => {
    return (
      <li>
        <Link
          href={href}
          className={cn(
            "block select-none rounded-md p-2 font-display text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors",
            className,
          )}
          onClick={onClick}
          {...props}
        >
          <div className="font-medium">{title}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{children}</p>
        </Link>
      </li>
    )
  },
)

ListItem.displayName = "ListItem"

