"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconSearch,
  IconSpinner,
  IconTrash,
  IconChecklist,
  IconPaper,
  IconGrid,
  IconAlert,
  IconTrendUp,
  IconChat,
} from "@/components/admin/icons"
import type { SVGProps } from "react"

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
type IssueArea = "CONTENT" | "UI" | "BUG" | "FEATURE" | "OTHER"

interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  area: IssueArea
  createdAt: string
  questionId: string | null
  createdBy: { id: string; name: string | null; image: string | null } | null
}

const STATUSES: IssueStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
const AREAS: IssueArea[] = ["CONTENT", "UI", "BUG", "FEATURE", "OTHER"]
const PRIORITIES: IssuePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

const STATUS_LABEL: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

const PRIORITY_DOT: Record<IssuePriority, string> = {
  LOW: "bg-pencil",
  MEDIUM: "bg-ballpoint",
  HIGH: "bg-st-review",
  CRITICAL: "bg-redpen",
}

const AREA_ICON: Record<IssueArea, (p: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  CONTENT: IconPaper,
  UI: IconGrid,
  BUG: IconAlert,
  FEATURE: IconTrendUp,
  OTHER: IconChat,
}

function initialsOf(name: string | null) {
  const base = (name || "?").trim()
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function AdminIssuesPage() {
  const { toast } = useToast()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all")
  const [areaFilter, setAreaFilter] = useState<IssueArea | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "all">("all")
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/issues")
      if (!res.ok) throw new Error("Failed to load issues")
      setIssues(await res.json())
    } catch {
      toast({ title: "Couldn't load issues", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const counts = useMemo(() => {
    const c: Record<IssueStatus, number> = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 }
    for (const i of issues) c[i.status] += 1
    return c
  }, [issues])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return issues.filter((i) => {
      const matchesStatus = statusFilter === "all" || i.status === statusFilter
      const matchesArea = areaFilter === "all" || i.area === areaFilter
      const matchesPriority = priorityFilter === "all" || i.priority === priorityFilter
      const matchesSearch =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.createdBy?.name?.toLowerCase().includes(q) ?? false)
      return matchesStatus && matchesArea && matchesPriority && matchesSearch
    })
  }, [issues, statusFilter, areaFilter, priorityFilter, search])

  const changeStatus = async (id: string, status: IssueStatus) => {
    setSavingId(id)
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Update failed")
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
      toast({ title: "Issue updated", description: `Marked ${STATUS_LABEL[status].toLowerCase()}.` })
    } catch (e) {
      toast({
        title: "Couldn't update issue",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSavingId(null)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm("Delete this issue? This cannot be undone.")) return
    setSavingId(id)
    try {
      const res = await fetch(`/api/issues/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setIssues((prev) => prev.filter((i) => i.id !== id))
      toast({ title: "Issue deleted" })
    } catch {
      toast({ title: "Couldn't delete issue", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const statusChips: { key: IssueStatus | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: issues.length },
    { key: "OPEN", label: "Open", count: counts.OPEN },
    { key: "IN_PROGRESS", label: "In progress", count: counts.IN_PROGRESS },
    { key: "RESOLVED", label: "Resolved", count: counts.RESOLVED },
    { key: "CLOSED", label: "Closed", count: counts.CLOSED },
  ]
  const needAction = counts.OPEN + counts.IN_PROGRESS

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Masthead */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/70 pb-5">
          <div className="space-y-1">
            <p className="type-data text-[11px] uppercase tracking-[0.18em] text-pencil">Overview</p>
            <h1 className="type-display text-3xl text-ink sm:text-4xl">Issues</h1>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2">
            <IconChecklist className="h-4 w-4 text-ballpoint" />
            <span className="type-data text-xs text-pencil">
              <span className="text-ink">{needAction}</span> need action
            </span>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-pencil">
          Triage reports from the community board — set status, sort by priority and area, and resolve.
        </p>
      </header>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
            <Input
              placeholder="Search title, description or reporter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as IssueArea | "all")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a} className="capitalize">
                  {a.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as IssuePriority | "all")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusChips.map((chip) => {
            const active = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
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
        {loading ? (
          <div className="divide-y divide-rule">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="h-10 w-10 animate-pulse rounded-md bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-secondary" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <IconChecklist className="h-8 w-8 text-pencil" />
            <p className="text-sm text-ink">
              {issues.length === 0 ? "No issues reported yet." : "No issues match your filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {filtered.map((issue) => {
              const saving = savingId === issue.id
              const AreaIcon = AREA_ICON[issue.area]
              return (
                <div key={issue.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start">
                  {/* Area glyph */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-ballpoint">
                    <AreaIcon className="h-5 w-5" />
                  </span>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 type-data text-[10px] uppercase tracking-wide text-pencil">
                        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[issue.priority]}`} />
                        {issue.priority.toLowerCase()}
                      </span>
                      <span className="rounded-full border border-rule bg-paper px-2 py-0.5 type-data text-[10px] uppercase tracking-wide text-pencil">
                        {issue.area.toLowerCase()}
                      </span>
                      {issue.questionId && (
                        <span className="type-data text-[10px] text-pencil">Q: {issue.questionId}</span>
                      )}
                    </div>
                    <p className="mt-1.5 font-medium text-ink">{issue.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-pencil">{issue.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        {issue.createdBy?.image && (
                          <AvatarImage src={issue.createdBy.image} alt={issue.createdBy.name ?? ""} />
                        )}
                        <AvatarFallback className="bg-secondary text-[9px] text-ballpoint">
                          {initialsOf(issue.createdBy?.name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="type-data text-xs text-pencil">
                        {issue.createdBy?.name || "Unknown"} ·{" "}
                        {new Date(issue.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={issue.status}
                      onValueChange={(v) => changeStatus(issue.id, v as IssueStatus)}
                      disabled={saving}
                    >
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {saving ? (
                      <IconSpinner className="h-4 w-4 animate-spin text-pencil" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        title="Delete issue"
                        onClick={() => remove(issue.id)}
                      >
                        <IconTrash className="h-4 w-4 text-redpen" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
