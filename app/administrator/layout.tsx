"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { HomeIcon, LayoutDashboardIcon, UsersIcon, SettingsIcon, MenuIcon, SearchIcon, BellIcon } from 'lucide-react'
import ApplicationLayout from './application-layout';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar className="hidden lg:block" />
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <MenuIcon className="h-6 w-6" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-lg font-semibold">Administrator Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <form className="hidden lg:block">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-[200px] pl-8 sm:w-[300px] md:w-[400px]"
                  />
                </div>
              </form>
              <Button size="icon" variant="ghost">
                <BellIcon className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <UserNav />
            </div>
          </div>
        </header>
        <main className="container py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-60 border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            <NavItem href="/administrator" icon={HomeIcon} active={pathname === '/administrator'}>
              Home
            </NavItem>
            <NavItem href="/administrator/question-bank" icon={LayoutDashboardIcon} active={pathname.startsWith('/administrator/question-bank')}>
              Question Bank
            </NavItem>
            <NavItem href="/administrator/manage-roles" icon={UsersIcon} active={pathname.startsWith('/administrator/manage-roles')}>
              User Roles
            </NavItem>
            <NavItem href="/administrator/settings" icon={SettingsIcon} active={pathname.startsWith('/administrator/settings')}>
              Settings
            </NavItem>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ href, icon: Icon, active, children }: { href: string; icon: React.ElementType; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(
      "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
      active ? "bg-accent text-accent-foreground" : "transparent"
    )}>
      <Icon className="mr-2 h-4 w-4" />
      <span>{children}</span>
    </Link>
  )
}

function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="@johndoe" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              john.doe@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}