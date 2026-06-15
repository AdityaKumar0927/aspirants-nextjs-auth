"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Plus,
  Upload,
  Trash2,
  Edit,
  CheckCircle2,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  FileQuestion,
} from "lucide-react"
import type { Question, QuestionStatus } from "./types"
import { QuestionForm } from "./QuestionForm"

// Minimal trailing debounce (replaces lodash/debounce — lodash is no longer a
// dependency). Returns a debounced wrapper that fires `fn` `ms` after the last call.
function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: A) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

const PAGE_SIZE = 20

type FiltersType = {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: QuestionStatus | "all"
}

const EMPTY_FILTERS: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  types: [],
  years: [],
  status: "all",
}

// Facet category -> the filters key + the API query param it maps to.
const FACETS = [
  { key: "exams", label: "Exams", param: "exam", optionsKey: "exams" },
  { key: "subjects", label: "Subjects", param: "subject", optionsKey: "subjects" },
  { key: "difficulties", label: "Difficulty", param: "difficulty", optionsKey: "difficulties" },
  { key: "types", label: "Type", param: "type", optionsKey: "types" },
  { key: "years", label: "Years", param: "year", optionsKey: "years" },
  { key: "topics", label: "Topics", param: "topic", optionsKey: "topics" },
  { key: "subtopics", label: "Subtopics", param: "subtopic", optionsKey: "subtopics" },
] as const

type FacetKey = (typeof FACETS)[number]["key"]

interface FilterOptions {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  years: (string | number)[]
  types: string[]
}

interface QuestionsResponse {
  data: Question[]
  currentPage: number
  pageSize: number
  totalCount: number
}

interface QuestionStats {
  total: number
  active: number
  draft: number
  archived: number
}

function buildQuery(filters: FiltersType, search: string, page: number): string {
  const p = new URLSearchParams()
  p.set("page", String(page))
  p.set("pageSize", String(PAGE_SIZE))
  p.set("status", filters.status === "all" ? "all" : filters.status)
  for (const facet of FACETS) {
    const values = filters[facet.key]
    if (values.length) p.set(facet.param, values.join(","))
  }
  if (search.trim()) p.set("q", search.trim())
  return p.toString()
}

function StatusDot({ status }: { status: QuestionStatus }) {
  const dot =
    status === "ACTIVE" ? "bg-st-answered" : status === "DRAFT" ? "bg-st-review" : "bg-st-notvisited"
  const label = status.charAt(0) + status.slice(1).toLowerCase()
  return (
    <span className="type-data inline-flex items-center gap-2 text-xs text-pencil">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

function plain(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\$+/g, "").replace(/\s+/g, " ").trim()
}

/** A collapsible facet group with an in-list filter for long option sets. */
function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  defaultOpen,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const [needle, setNeedle] = useState("")

  if (!options.length) return null

  const shown =
    needle.trim().length > 0
      ? options.filter((o) => o.toLowerCase().includes(needle.toLowerCase()))
      : options

  return (
    <div className="border-b border-rule pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <span className="type-data text-[11px] uppercase tracking-[0.12em] text-pencil">
          {label}
          {selected.length > 0 && (
            <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-ballpoint">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-pencil transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-2">
          {options.length > 10 && (
            <Input
              value={needle}
              onChange={(e) => setNeedle(e.target.value)}
              placeholder={`Filter ${label.toLowerCase()}…`}
              className="h-8 text-xs"
            />
          )}
          <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {shown.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink"
              >
                <Checkbox
                  checked={selected.includes(value)}
                  onCheckedChange={() => onToggle(value)}
                />
                <span className="truncate" title={value}>
                  {value}
                </span>
              </label>
            ))}
            {shown.length === 0 && (
              <p className="type-data text-xs text-pencil">No matches.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function QuestionBankDashboardContent() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<FiltersType>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)

  // A filter/search/status change invalidates both the page number and any
  // cross-page selection.
  const resetPaging = () => {
    setPage(1)
    setSelected(new Set())
  }

  const toggleFacet = (key: FacetKey, value: string) => {
    setFilters((prev) => {
      const current = prev[key]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [key]: next }
    })
    resetPaging()
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value)
        resetPaging()
      }, 300),
    []
  )

  const clearAll = () => {
    setFilters(EMPTY_FILTERS)
    setSearch("")
    setSearchInput("")
    resetPaging()
  }

  const qs = buildQuery(filters, search, page)

  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["question-filters"],
    queryFn: async () => {
      const res = await fetch("/api/filters", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch filters")
      return res.json()
    },
  })

  const { data: stats } = useQuery<QuestionStats>({
    queryKey: ["admin-question-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/question-stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const {
    data: result,
    isLoading,
    isFetching,
    error,
  } = useQuery<QuestionsResponse>({
    queryKey: ["admin-questions", qs],
    queryFn: async () => {
      const res = await fetch(`/api/questions?${qs}`)
      if (!res.ok) throw new Error("Failed to fetch questions")
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const questions = result?.data ?? []
  const totalCount = result?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-questions"] })
    queryClient.invalidateQueries({ queryKey: ["admin-question-stats"] })
  }

  const addMutation = useMutation({
    mutationFn: async (q: Partial<Question>) => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Failed to add question")
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      setIsAddOpen(false)
      toast({ title: "Question added", description: "The question has been created." })
    },
    onError: (e: unknown) =>
      toast({
        title: "Couldn't add question",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      }),
  })

  const editMutation = useMutation({
    mutationFn: async (q: Partial<Question>) => {
      const res = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Failed to update question")
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      setEditing(null)
      toast({ title: "Question updated", description: "Your changes have been saved." })
    },
    onError: (e: unknown) =>
      toast({
        title: "Couldn't update question",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await fetch("/api/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      })
      if (!res.ok) throw new Error("Failed to delete question")
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      toast({ title: "Question deleted" })
    },
    onError: () =>
      toast({ title: "Couldn't delete question", variant: "destructive" }),
  })

  const setStatus = (questionId: string, status: QuestionStatus) =>
    editMutation.mutate({ questionId, status })

  const toggleSelect = (questionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === questions.length ? new Set() : new Set(questions.map((q) => q.questionId))
    )
  }

  // Bulk actions loop the per-question endpoints (there is no bulk-mutate API,
  // and the server's mass-delete guard still applies — by design).
  const [bulkBusy, setBulkBusy] = useState(false)
  const runBulk = async (action: "activate" | "archive" | "delete") => {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (action === "delete" && !window.confirm(`Delete ${ids.length} question(s)? This cannot be undone.`)) {
      return
    }
    setBulkBusy(true)
    const results = await Promise.allSettled(
      ids.map((id) =>
        action === "delete"
          ? fetch("/api/questions", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ questionId: id }),
            }).then((r) => {
              if (!r.ok) throw new Error()
            })
          : fetch("/api/questions", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questionId: id,
                status: action === "activate" ? "ACTIVE" : "ARCHIVED",
              }),
            }).then((r) => {
              if (!r.ok) throw new Error()
            })
      )
    )
    const ok = results.filter((r) => r.status === "fulfilled").length
    const failed = results.length - ok
    setBulkBusy(false)
    setSelected(new Set())
    invalidate()
    toast({
      title: `${ok} question(s) ${action === "delete" ? "deleted" : action === "activate" ? "activated" : "archived"}`,
      description: failed ? `${failed} failed (possibly rate-limited).` : undefined,
      variant: failed ? "destructive" : undefined,
    })
  }

  // Active filter chips (everything currently narrowing the list).
  const activeChips: { label: string; onRemove: () => void }[] = []
  for (const facet of FACETS) {
    for (const value of filters[facet.key]) {
      activeChips.push({
        label: `${facet.label.replace(/s$/, "")}: ${value}`,
        onRemove: () => toggleFacet(facet.key, value),
      })
    }
  }
  if (filters.status !== "all") {
    activeChips.push({
      label: `Status: ${filters.status}`,
      onRemove: () => {
        setFilters((prev) => ({ ...prev, status: "all" }))
        resetPaging()
      },
    })
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Content</p>
          <h1 className="type-display text-2xl text-ink sm:text-3xl">Question bank</h1>
          <p className="text-sm text-pencil">
            {stats
              ? `${stats.total.toLocaleString("en-IN")} questions in the bank.`
              : "Browse, review and publish the question bank."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button className="w-full sm:w-auto" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/administrator/question-bank/import">
              <Upload className="mr-2 h-4 w-4" />
              Import from PDF
            </Link>
          </Button>
        </div>
      </div>

      {/* Accurate stat cards (from the DB, not a capped client tally) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total questions" value={stats?.total} />
        <StatCard label="Active" value={stats?.active} tone="active" />
        <StatCard label="Drafts to review" value={stats?.draft} tone={stats && stats.draft > 0 ? "review" : undefined} />
        <StatCard label="Archived" value={stats?.archived} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="shrink-0 lg:w-60">
          <div className="paper-sheet p-4">
            <div className="flex items-center justify-between">
              <h2 className="type-display text-sm text-ink">Filters</h2>
              {activeChips.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="type-data text-xs text-ballpoint hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="mt-3 space-y-1">
              {FACETS.map((facet, i) => (
                <FilterGroup
                  key={facet.key}
                  label={facet.label}
                  options={(filterOptions?.[facet.optionsKey] ?? []).map(String)}
                  selected={filters[facet.key]}
                  onToggle={(v) => toggleFacet(facet.key, v)}
                  defaultOpen={i < 2}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
              <Input
                type="text"
                placeholder="Search question text, topic, subject…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  debouncedSearch(e.target.value)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, status: value as QuestionStatus | "all" }))
                resetPaging()
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft (needs review)</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-2.5 py-1 text-xs text-ink hover:border-redpen hover:text-redpen"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {/* Result summary / bulk action bar */}
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-ballpoint bg-secondary px-4 py-2.5">
              <span className="text-sm font-medium text-ink">{selected.size} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => runBulk("activate")}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Activate
                </Button>
                <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => runBulk("archive")}>
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-redpen hover:text-redpen"
                  disabled={bulkBusy}
                  onClick={() => runBulk("delete")}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <p className="type-data text-xs text-pencil">
              {totalCount > 0
                ? `Showing ${rangeStart.toLocaleString("en-IN")}–${rangeEnd.toLocaleString("en-IN")} of ${totalCount.toLocaleString("en-IN")}`
                : isLoading
                  ? "Loading…"
                  : "No questions match."}
            </p>
          )}

          {/* Table */}
          <div className="paper-sheet overflow-hidden">
            {/* header row */}
            <div className="flex items-center gap-3 border-b border-rule px-4 py-2.5">
              <Checkbox
                checked={questions.length > 0 && selected.size === questions.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all on this page"
              />
              <span className="type-data flex-1 text-[11px] uppercase tracking-wider text-pencil">
                Question
              </span>
              <span className="type-data hidden w-28 text-[11px] uppercase tracking-wider text-pencil sm:block">
                Subject
              </span>
              <span className="type-data hidden w-24 text-[11px] uppercase tracking-wider text-pencil md:block">
                Status
              </span>
              <span className="type-data w-24 text-right text-[11px] uppercase tracking-wider text-pencil">
                Actions
              </span>
            </div>

            {isLoading ? (
              <div className="divide-y divide-rule">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="px-4 py-12 text-center text-sm text-redpen">
                Couldn&apos;t load questions. Please retry.
              </p>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                <FileQuestion className="h-8 w-8 text-pencil" />
                <p className="text-sm text-ink">No questions match your filters.</p>
                {activeChips.length > 0 && (
                  <button type="button" onClick={clearAll} className="text-xs text-ballpoint hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`divide-y divide-rule ${isFetching ? "opacity-60" : ""}`}>
                {questions.map((q) => (
                  <div key={q.questionId} className="flex items-center gap-3 px-4 py-3">
                    <Checkbox
                      checked={selected.has(q.questionId)}
                      onCheckedChange={() => toggleSelect(q.questionId)}
                      aria-label="Select question"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">
                        {plain(q.text).slice(0, 110) || "Untitled question"}
                      </p>
                      <p className="type-data mt-0.5 truncate text-xs text-pencil">
                        {[q.exam, q.year, q.difficulty, q.type].filter(Boolean).join(" · ") || q.questionId}
                      </p>
                    </div>
                    <span className="hidden w-28 truncate text-sm text-pencil sm:block" title={q.subject}>
                      {q.subject || "—"}
                    </span>
                    <span className="hidden w-24 md:block">
                      <StatusDot status={q.status} />
                    </span>
                    <div className="flex w-24 shrink-0 items-center justify-end gap-0.5">
                      {q.status !== "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Publish (set active)"
                          onClick={() => setStatus(q.questionId, "ACTIVE")}
                        >
                          <CheckCircle2 className="h-4 w-4 text-st-answered" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Archive (hide from bank)"
                          onClick={() => setStatus(q.questionId, "ARCHIVED")}
                        >
                          <Archive className="h-4 w-4 text-st-review" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => setEditing(q)}>
                        <Edit className="h-4 w-4 text-pencil" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Delete"
                        onClick={() => {
                          if (window.confirm("Delete this question? This cannot be undone.")) {
                            deleteMutation.mutate(q.questionId)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-redpen" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1))
                  setSelected(new Set())
                }}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="type-data text-sm text-pencil">
                Page {page} of {totalPages.toLocaleString("en-IN")}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1))
                  setSelected(new Set())
                }}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>Add new question</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-3">
            <QuestionForm
              onSubmit={(q) => addMutation.mutate(q)}
              onCancel={() => setIsAddOpen(false)}
              submitting={addMutation.isPending}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-h-[90vh] sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle>Edit question</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] pr-3">
              <QuestionForm
                initialData={editing}
                onSubmit={(q) => editMutation.mutate({ ...q, questionId: editing.questionId })}
                onCancel={() => setEditing(null)}
                submitting={editMutation.isPending}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value?: number
  tone?: "active" | "review"
}) {
  const valueColor = tone === "review" ? "text-redpen" : "text-ink"
  return (
    <div className={`paper-sheet p-5 ${tone === "review" && value ? "border-st-review" : ""}`}>
      <p className="text-sm text-pencil">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <p className={`type-data mt-2 text-3xl ${valueColor}`}>{value.toLocaleString("en-IN")}</p>
      )}
    </div>
  )
}
