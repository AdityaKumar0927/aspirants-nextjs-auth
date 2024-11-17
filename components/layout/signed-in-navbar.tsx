"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSignInModal } from "./sign-in"
import UserDropdown from "@/components/layout/user-dropdown"
import { Button } from "@/components/ui/button"
import NotificationDropdown from "@/components/shared/NotificationDropdown"
import { Session } from "next-auth"
import { Menu, X, ChevronDown, Bell } from 'lucide-react'
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
import { signOut } from "next-auth/react"
import { MultiStepLoader } from "@/components/aceternity-ui/multi-step-loader"

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

const logoutSteps = [
  { text: "Saving your progress" },
  { text: "Clearing session data" },
  { text: "Securing your account" },
  { text: "Logging you out" },
  { text: "See you soon!" },
]

export default function NavBar({ session }: { session: Session | null }) {
  const router = useRouter()
  const { SignInModal, setShowSignInModal } = useSignInModal()
  const scrolled = useScroll(50)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [supportOpen, setSupportOpen] = React.useState(false)
  const [showLogoutLoader, setShowLogoutLoader] = React.useState(false)
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

  const handleLogout = async () => {
    setShowLogoutLoader(true)
    try {
      await signOut({ redirect: false })
      router.push('/') // Redirect to home page after logout
    } finally {
      setShowLogoutLoader(false)
    }
  }

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
            <DesktopNavLinks session={session} />
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
            <MobileNavLinks
              session={session}
              setMenuOpen={setMenuOpen}
              setShowSignInModal={setShowSignInModal}
              supportOpen={supportOpen}
              toggleSupport={toggleSupport}
              handleLogout={handleLogout}
            />
          </div>
        )}
      </nav>
      <MultiStepLoader loadingStates={logoutSteps} loading={showLogoutLoader} duration={1000} loop={false} />
    </>
  )
}

function DesktopNavLinks({ session }: { session: Session | null }) {
  return (
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
  )
}

interface MobileNavLinksProps {
  session: Session | null
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  setShowSignInModal: React.Dispatch<React.SetStateAction<boolean>>
  supportOpen: boolean
  toggleSupport: (e: React.MouseEvent) => void
  handleLogout: () => Promise<void>
}

function MobileNavLinks({
  session,
  setMenuOpen,
  setShowSignInModal,
  supportOpen,
  toggleSupport,
  handleLogout,
}: MobileNavLinksProps) {
  return (
    <nav className="p-4 space-y-4">
      <Link
        href={session ? "/QuestionBank" : "/QuestionBank/guest"}
        className="block w-full text-left font-display text-lg text-black hover:text-gray-600 transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Question Bank
      </Link>
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
        <>
          <div className="flex items-center justify-between py-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setMenuOpen(false)}
            >
              <Bell size={24} />
            </Button>
            <UserDropdown session={session} />
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              handleLogout()
              setMenuOpen(false)
            }}
          >
            Log Out
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => {
            setShowSignInModal(true)
            setMenuOpen(false)
          }}
        >
          Sign In
        </Button>
      )}
    </nav>
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