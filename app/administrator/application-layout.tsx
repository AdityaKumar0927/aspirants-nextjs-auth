"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconGrid,
  IconChecklist,
  IconClipboard,
  IconRoles,
  IconPaper,
  IconShield,
  IconChat,
  IconGear,
  IconLogout,
  IconMenu,
  IconClose,
  IconArrow,
  IconDeskMark,
} from "@/components/admin/icons"

type IconType = React.ComponentType<{ className?: string }>
type NavItem = { href: string; label: string; icon: IconType }
type NavGroup = { heading: string; items: NavItem[] }

// Grouped navigation — hrefs point at the real /administrator/* routes.
const navGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { href: "/administrator", label: "Dashboard", icon: IconGrid },
      { href: "/administrator/issues", label: "Issues", icon: IconChecklist },
      { href: "/administrator/notifications", label: "Announcements", icon: IconChat },
    ],
  },
  {
    heading: "People",
    items: [
      { href: "/administrator/applications", label: "Applications", icon: IconClipboard },
      { href: "/administrator/manage-roles", label: "User roles", icon: IconRoles },
    ],
  },
  {
    heading: "Content",
    items: [{ href: "/administrator/question-bank", label: "Question bank", icon: IconPaper }],
  },
  {
    heading: "Compliance",
    items: [{ href: "/administrator/data-requests", label: "Data requests", icon: IconShield }],
  },
]

const allNavItems = navGroups.flatMap((group) => group.items)

function isItemActive(pathname: string, href: string) {
  if (href === "/administrator") return pathname === "/administrator"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function currentPageTitle(pathname: string) {
  // Longest matching href wins so nested routes resolve to their section.
  const match = allNavItems
    .filter((item) => isItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match?.label ?? "Admin"
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const pageTitle = currentPageTitle(pathname)
  const userName = session?.user?.name ?? "Administrator"
  const userEmail = session?.user?.email ?? "Signed in"
  const userImage = session?.user?.image ?? undefined
  const initials = (userName || "A")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const wordmark = (
    <div className="flex h-16 items-center gap-3 border-b border-rule px-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ballpoint text-paper">
        <IconDeskMark className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="type-display text-sm text-ink">Penwise</p>
        <p className="type-data text-[10px] uppercase tracking-[0.18em] text-pencil">Admin console</p>
      </div>
    </div>
  )

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-5">
      {navGroups.map((group) => (
        <div key={group.heading} className="space-y-1">
          <p className="type-data px-3 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-pencil/80">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const active = isItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group relative flex min-h-[42px] items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                  active
                    ? "bg-secondary font-medium text-ballpoint"
                    : "text-pencil hover:bg-secondary/60 hover:text-ink"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-ballpoint" />
                )}
                <item.icon
                  className={`h-[18px] w-[18px] shrink-0 ${active ? "text-ballpoint" : "text-pencil group-hover:text-ink"}`}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}

      {/* Footer */}
      <div className="mt-auto border-t border-rule px-1 pt-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-pencil transition-colors hover:bg-secondary/60 hover:text-ink"
        >
          <IconArrow className="h-4 w-4 rotate-180" />
          Back to site
        </Link>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-desk text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-rule bg-paper lg:flex">
        {wordmark}
        <div className="flex flex-1 flex-col overflow-y-auto">{renderNav()}</div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-rule bg-paper">
            <div className="flex h-16 items-center justify-between border-b border-rule pr-3">
              <div className="flex flex-1 items-center gap-3 px-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ballpoint text-paper">
                  <IconDeskMark className="h-5 w-5" />
                </span>
                <div className="leading-tight">
                  <p className="type-display text-sm text-ink">Penwise</p>
                  <p className="type-data text-[10px] uppercase tracking-[0.18em] text-pencil">Admin console</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <IconClose className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">{renderNav(() => setMobileNavOpen(false))}</div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-rule bg-paper px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <IconMenu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="type-data text-pencil">Admin</span>
              <IconArrow className="h-3.5 w-3.5 text-pencil/60" />
              <span className="type-display text-ink">{pageTitle}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-11 items-center gap-2 rounded-md px-2 hover:bg-secondary"
              >
                <Avatar className="h-8 w-8">
                  {userImage && <AvatarImage src={userImage} alt={userName} />}
                  <AvatarFallback className="bg-secondary text-xs text-ballpoint">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-ink sm:inline">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-ink">{userName}</p>
                  <p className="type-data text-xs leading-none text-pencil">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/administrator/settings" className="cursor-pointer">
                  <IconGear className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-redpen focus:text-redpen"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
