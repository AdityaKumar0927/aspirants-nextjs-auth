"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { IconSearch, IconSpinner, IconChevronDown, IconClipboard } from "@/components/admin/icons"

interface Application {
  id: string
  name: string
  email: string
  role: "VOLUNTEER" | "MODERATOR"
  experience: string
  motivation: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  userId: string
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

const PER_PAGE = 10

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-st-review",
  APPROVED: "bg-st-answered",
  REJECTED: "bg-redpen",
}

function initialsOf(name: string) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="type-data inline-flex items-center gap-1.5 text-xs text-pencil">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[value] ?? "bg-st-notvisited"}`} />
      {value.toLowerCase()}
    </span>
  )
}

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const router = useRouter()

  const fetchApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/applications")
      if (!response.ok) throw new Error("Failed to fetch applications")
      setApplications(await response.json())
    } catch {
      toast({ title: "Error", description: "Failed to fetch applications.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "administrator")) {
      router.push("/unauthorized")
    } else if (status === "authenticated" && session?.user?.role === "administrator") {
      // Loading state is set inside fetchApplications after the await, not synchronously.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchApplications()
    }
  }, [status, session, router, fetchApplications])

  const handleStatusUpdate = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setUpdatingId(id)
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update application status")
      const updated = await response.json()
      if (newStatus === "APPROVED") await updateUserRole(updated.userId, updated.role)
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
      toast({ title: "Status updated", description: `Application ${newStatus.toLowerCase()}.` })
    } catch {
      toast({ title: "Error", description: "Failed to update application status.", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const updateUserRole = async (userId: string, roleName: string) => {
    try {
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleName }),
      })
      if (!response.ok) throw new Error("Failed to update user role")
      const data = await response.json()
      toast({ title: "Role updated", description: `User is now ${data.user.role}.` })
    } catch {
      toast({ title: "Error", description: "Failed to update user role.", variant: "destructive" })
    }
  }

  const counts = useMemo(() => {
    const c = { PENDING: 0, APPROVED: 0, REJECTED: 0 }
    for (const a of applications) c[a.status] += 1
    return c
  }, [applications])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return applications.filter(
      (a) =>
        (a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) &&
        (statusFilter === "ALL" || a.status === statusFilter)
    )
  }, [applications, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: applications.length },
    { key: "PENDING", label: "Pending", count: counts.PENDING },
    { key: "APPROVED", label: "Approved", count: counts.APPROVED },
    { key: "REJECTED", label: "Rejected", count: counts.REJECTED },
  ]

  if (status === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <IconSpinner className="h-6 w-6 animate-spin text-pencil" />
      </div>
    )
  }
  if (status === "unauthenticated" || session?.user?.role !== "administrator") return null

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Masthead */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/70 pb-5">
          <div className="space-y-1">
            <p className="type-data text-[11px] uppercase tracking-[0.18em] text-pencil">People</p>
            <h1 className="type-display text-3xl text-ink sm:text-4xl">Applications</h1>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2">
            <IconClipboard className="h-4 w-4 text-ballpoint" />
            <span className="type-data text-xs text-pencil">
              <span className="text-ink">{counts.PENDING}</span> pending
            </span>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-pencil">
          Review volunteer and moderator applications — approving promotes the applicant&apos;s role automatically.
        </p>
      </header>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
          <Input
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusChips.map((chip) => {
            const active = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  setStatusFilter(chip.key)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-ballpoint bg-secondary font-medium text-ballpoint"
                    : "border-rule text-pencil hover:border-ballpoint hover:text-ink"
                }`}
              >
                {chip.label}
                <span className="type-data opacity-70">{chip.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div className="paper-sheet overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-rule">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-secondary" />
                  <div className="h-2.5 w-56 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <IconClipboard className="h-8 w-8 text-pencil" />
            <p className="text-sm text-ink">
              {applications.length === 0 ? "No applications yet." : "No applications match your filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {pageItems.map((app) => {
              const open = expandedId === app.id
              const busy = updatingId === app.id
              return (
                <div key={app.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : app.id)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-secondary/60"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-secondary text-xs text-ballpoint">
                        {initialsOf(app.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{app.name}</p>
                      <p className="type-data truncate text-xs text-pencil">{app.email}</p>
                    </div>
                    <span className="hidden w-28 shrink-0 rounded-full border border-rule bg-paper px-2 py-0.5 text-center type-data text-[10px] uppercase tracking-wide text-pencil sm:block">
                      {app.role.toLowerCase()}
                    </span>
                    <span className="hidden w-24 shrink-0 sm:block">
                      <StatusBadge value={app.status} />
                    </span>
                    <span className="type-data hidden w-20 shrink-0 text-right text-xs text-pencil md:block">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <IconChevronDown
                      className={`h-4 w-4 shrink-0 text-pencil transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-rule bg-paper/60 px-5 py-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Email">{app.email}</Detail>
                            <Detail label="Applying for" className="capitalize">
                              {app.role.toLowerCase()}
                            </Detail>
                            <Detail label="Status">
                              <StatusBadge value={app.status} />
                            </Detail>
                            <Detail label="Date applied">
                              {new Date(app.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </Detail>
                          </div>
                          <div className="mt-4 space-y-4">
                            <Detail label="Experience" block>
                              {app.experience}
                            </Detail>
                            <Detail label="Motivation" block>
                              {app.motivation}
                            </Detail>
                          </div>
                          <div className="mt-5 flex justify-end gap-2">
                            <Button
                              onClick={() => handleStatusUpdate(app.id, "APPROVED")}
                              disabled={app.status !== "PENDING" || busy}
                            >
                              {busy ? <IconSpinner className="h-4 w-4 animate-spin" /> : "Approve"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                              disabled={app.status !== "PENDING" || busy}
                            >
                              {busy ? <IconSpinner className="h-4 w-4 animate-spin" /> : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="type-data text-sm text-pencil">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function Detail({
  label,
  children,
  block,
  className,
}: {
  label: string
  children: React.ReactNode
  block?: boolean
  className?: string
}) {
  return (
    <div>
      <h4 className="type-data text-[11px] uppercase tracking-wider text-pencil">{label}</h4>
      <div className={`mt-1 break-words text-sm text-ink ${block ? "leading-relaxed" : ""} ${className ?? ""}`}>
        {children}
      </div>
    </div>
  )
}
