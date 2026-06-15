"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Role = "member" | "volunteer" | "moderator" | "administrator"

interface ApiUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  UserRole: { name: string } | null
}

interface UserRow {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  role: Role
}

const VALID_ROLES: Role[] = ["member", "volunteer", "moderator", "administrator"]

const ROLE_DOT: Record<Role, string> = {
  administrator: "bg-redpen",
  moderator: "bg-ballpoint",
  volunteer: "bg-st-review",
  member: "bg-pencil",
}

function initialsOf(name: string | null, email: string | null) {
  const base = (name || email || "?").trim()
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-2.5 py-1 text-xs capitalize text-ink">
      <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT[role]}`} />
      {role}
    </span>
  )
}

export default function ManageRoles() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const router = useRouter()

  const currentUserId = session?.user?.id

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/user/get")
        if (!response.ok) {
          if (response.status === 401) throw new Error("Unauthorized access")
          throw new Error("Failed to fetch users")
        }
        const data: ApiUser[] = await response.json()
        // The API returns the relation as `UserRole`; flatten it to a plain
        // `role` (defaulting to member) so the table can read it directly.
        setUsers(
          data.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            createdAt: u.createdAt,
            role: (u.UserRole?.name as Role) || "member",
          }))
        )
      } catch (err) {
        const message = (err as Error).message || "Failed to fetch users. Please try again."
        setError(message)
        toast({ title: "Error", description: message, variant: "destructive" })
        if (message === "Unauthorized access") router.push("/unauthorized")
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") fetchUsers()
  }, [toast, status, router])

  const roleCounts = useMemo(() => {
    const counts: Record<Role, number> = {
      member: 0,
      volunteer: 0,
      moderator: 0,
      administrator: 0,
    }
    for (const u of users) counts[u.role] += 1
    return counts
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setSavingId(userId)
    setError(null)
    try {
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleName: newRole }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update user role")

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      toast({ title: "Role updated", description: `User is now a ${newRole}.` })
    } catch (err) {
      // State is left untouched, so the controlled <Select> reverts to the
      // user's existing role automatically.
      toast({
        title: "Could not update role",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setSavingId(null)
    }
  }

  const filterChips: { key: Role | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    { key: "administrator", label: "Admins", count: roleCounts.administrator },
    { key: "moderator", label: "Moderators", count: roleCounts.moderator },
    { key: "volunteer", label: "Volunteers", count: roleCounts.volunteer },
    { key: "member", label: "Members", count: roleCounts.member },
  ]

  if (status === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-pencil" />
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">People</p>
          <h1 className="type-display text-2xl text-ink sm:text-3xl">User roles</h1>
          <p className="text-sm text-pencil">
            Promote members to volunteers, moderators or administrators.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-md border border-rule bg-paper px-3 py-2 text-sm text-pencil sm:self-auto">
          <Users className="h-4 w-4" />
          <span className="type-data text-ink">{users.length}</span>
          <span>members</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Toolbar: search + role filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
          <Input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => {
            const active = roleFilter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setRoleFilter(chip.key)}
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

      {/* User table */}
      <div className="paper-sheet overflow-hidden">
        {/* Column header (desktop) */}
        <div className="hidden items-center border-b border-rule px-5 py-2.5 sm:flex">
          <span className="type-data flex-1 text-[11px] uppercase tracking-wider text-pencil">
            User
          </span>
          <span className="type-data w-28 shrink-0 text-[11px] uppercase tracking-wider text-pencil">
            Joined
          </span>
          <span className="type-data w-36 shrink-0 text-[11px] uppercase tracking-wider text-pencil">
            Role
          </span>
          <span className="type-data w-44 shrink-0 text-[11px] uppercase tracking-wider text-pencil">
            Change role
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-rule">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                  <div className="h-2.5 w-56 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-ink">No users match your filters.</p>
            <p className="type-data mt-1 text-xs text-pencil">
              Try a different search term or role.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {filteredUsers.map((user) => {
              const isSelf = user.id === currentUserId
              const saving = savingId === user.id
              return (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center gap-y-3 px-5 py-3.5"
                >
                  {/* User identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                      <AvatarFallback className="bg-secondary text-xs text-ballpoint">
                        {initialsOf(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {user.name || "Unnamed user"}
                        {isSelf && (
                          <span className="type-data ml-2 text-[10px] uppercase tracking-wide text-pencil">
                            you
                          </span>
                        )}
                      </p>
                      <p className="type-data truncate text-xs text-pencil">{user.email}</p>
                    </div>
                  </div>

                  {/* Joined */}
                  <span className="type-data hidden w-28 shrink-0 text-xs text-pencil sm:block">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  {/* Current role badge */}
                  <div className="w-36 shrink-0">
                    <RoleBadge role={user.role} />
                  </div>

                  {/* Inline role select */}
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                      disabled={isSelf || saving}
                    >
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VALID_ROLES.map((role) => (
                          <SelectItem key={role} value={role} className="capitalize">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-pencil" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="type-data text-xs text-pencil">
        You can&apos;t change your own role, and the last administrator can&apos;t be demoted.
      </p>
    </div>
  )
}
