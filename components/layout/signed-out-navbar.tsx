"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSignInModal } from "./sign-in"
import { Menu, X, ChevronDown } from "lucide-react"
import useScroll from "@/lib/hooks/use-scroll"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/layout/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"
import { useT } from "@/components/i18n/T"
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

// Labels resolve via i18n keys (nav.supportLinks.<key>.title/.desc); hrefs stay literal.
const supportLinks = [
  { key: "report", href: "/issues" },
  { key: "featureRequests", href: "/feature-requests" },
]

export default function SignedOutNavbar() {
  const t = useT()
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
        className={cn("fixed top-0 left-0 right-0 z-30 transition-colors", scrolled ? "bg-paper/70 backdrop-blur-md shadow-sm" : "")}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 h-16">
            <Link href="/" className="flex min-w-0 items-center font-display text-2xl">
              <p className="font-display text-2xl tracking-[-0.07em] sm:text-3xl sm:leading-[4rem]">
                penwise
              </p>
              <Image src="/bulb.svg" alt="penwise logo" width={30} height={30} className="ml-1.5 h-6 w-6 shrink-0 sm:ml-2 sm:h-7.5 sm:w-7.5" />
              <span className="ml-1.5 shrink-0 text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full sm:ml-2 sm:text-xs sm:px-2 sm:py-1">BETA</span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              <DesktopNavLinks />
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => setShowSignInModal(true)}
                className="hover:border-blue-400 hover:bg-blue-200 hover:text-blue-500"
              >
                <p className="font-display tracking-[-0.02em] sm:leading-[2rem]">{t("nav.signIn")}</p>
              </Button>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
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
              className="absolute top-full left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-dark-background shadow-lg z-20 md:hidden"
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
  const t = useT()
  return (
    <nav>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/question-bank/guest"
                className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black dark:text-white")}
              >
                {t("nav.questionBank")}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/mock-exam"
                className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black dark:text-white")}
              >
                {t("nav.mockExam")}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/leaderboard"
                className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black dark:text-white")}
              >
                {t("nav.leaderboard")}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/blueprint"
                className={cn(navigationMenuTriggerStyle(), "font-display text-sm text-black dark:text-white")}
              >
                {t("nav.blueprint")}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-display text-sm text-black dark:text-white">
              {t("nav.support")}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-3 p-4 md:w-[400px] md:grid-cols-1 lg:w-[500px]">
                {supportLinks.map((link) => (
                  <ListItem
                    key={link.key}
                    title={t(`nav.supportLinks.${link.key}.title`)}
                    href={link.href}
                  >
                    {t(`nav.supportLinks.${link.key}.desc`)}
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
  const t = useT()
  return (
    <nav className="p-4 space-y-2 top-0 left-0 right-0 bg-white dark:bg-dark-background shadow-md z-[100000000]">
      <Link
        href="/question-bank/guest"
        className="flex min-h-11 w-full items-center text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.questionBank")}
      </Link>
      <Link
        href="/mock-exam"
        className="flex min-h-11 w-full items-center text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.mockExam")}
      </Link>
      <Link
        href="/leaderboard"
        className="flex min-h-11 w-full items-center text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.leaderboard")}
      </Link>
      <Link
        href="/blueprint"
        className="flex min-h-11 w-full items-center text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.blueprint")}
      </Link>
      <div>
        <button
          className="flex min-h-11 items-center justify-between w-full text-left font-display text-lg text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          onClick={toggleSupport}
          aria-expanded={supportOpen}
        >
          {t("nav.support")}
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
                <ListItem
                  key={link.key}
                  title={t(`nav.supportLinks.${link.key}.title`)}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(`nav.supportLinks.${link.key}.desc`)}
                </ListItem>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full min-h-11"
          onClick={() => {
            setMenuOpen(false)
            setShowSignInModal(true)
          }}
        >
          {t("nav.signIn")}
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

