"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import cx from "classnames"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Refresh, Trophy, Crown, X } from "@/components/desk/icons"
import type { LeaderboardEntry } from "@/lib/leaderboard"
import LeaderboardPrivacy from "./leaderboard-privacy"

type SortKey = "solved" | "accuracy" | "attempted"

/** Medal treatment for the top three — the page's only warm accent. */
const MEDAL: Record<number, { label: string; v: string }> = {
  1: { label: "Gold", v: "var(--gold)" },
  2: { label: "Silver", v: "var(--silver)" },
  3: { label: "Bronze", v: "var(--bronze)" },
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** Coin-style rank medallion (top 3) or a plain ledger numeral. */
function RankCell({ rank }: { rank: number }) {
  const m = MEDAL[rank]
  if (m) {
    return (
      <span
        className="type-data grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold text-paper"
        style={{
          background: `linear-gradient(150deg, color-mix(in srgb, ${m.v} 62%, white), ${m.v})`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${m.v} 52%, black)`,
        }}
      >
        {rank}
      </span>
    )
  }
  return <span className="type-data block w-8 text-center text-sm text-pencil">{rank}</span>
}

/** Accuracy meter — a ballpoint fill on a printed rule, with the figure. */
function AccuracyMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center justify-end gap-2.5">
      <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-rule sm:block">
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--ballpoint)" }}
        />
      </span>
      <span className="type-data w-12 text-right text-sm text-ballpoint">{value}%</span>
    </div>
  )
}

/** Single-value accuracy ring for the report card. */
function AccuracyRing({ value }: { value: number }) {
  const R = 15.9155
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
        <circle cx="18" cy="18" r={R} fill="none" stroke="var(--rule)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke="var(--ballpoint)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${pct} ${100 - pct}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="type-data text-2xl text-ink">{value}%</span>
        <span className="type-data text-[10px] uppercase tracking-wider text-pencil">accuracy</span>
      </div>
    </div>
  )
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="type-data text-2xl font-semibold leading-none text-ink sm:text-[1.7rem]">
        {value}
      </dt>
      <dd className="type-data mt-1.5 text-[11px] uppercase tracking-[0.14em] text-pencil">
        {label}
      </dd>
    </div>
  )
}

export default function LeaderboardClient({
  entries,
  meId,
  asOf,
}: {
  entries: LeaderboardEntry[]
  meId: string | null
  asOf?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("solved")
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  const totals = useMemo(
    () => ({
      ranked: entries.length,
      solved: entries.reduce((s, e) => s + e.solved, 0),
      attempts: entries.reduce((s, e) => s + e.attempted, 0),
      best: entries.length ? Math.max(...entries.map((e) => e.accuracy)) : 0,
    }),
    [entries]
  )
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter((e) => e.name.toLowerCase().includes(q))
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [entries, search, sortBy])

  const myRank = meId ? entries.find((e) => e.userId === meId)?.rank : undefined

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      {/* Masthead — soft gradient panel matching the landing "Join aspirants" CTA. */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 px-6 py-7 dark:border-gray-700 dark:bg-gray-900 sm:px-9 sm:py-9">
        {/* blurred orange → white → blue wash rising from the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-r from-orange-400/20 via-white/10 to-blue-400/20 blur-3xl dark:from-orange-600/20 dark:via-gray-800/10 dark:to-blue-600/20" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="type-data flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-pencil">
                <Trophy className="h-4 w-4" style={{ color: "var(--gold)" }} />
                Live rankings
              </p>
              <h1 className="type-display mt-2.5 text-4xl leading-none text-ink sm:text-5xl">
                The Merit List
              </h1>
              <p className="mt-3 max-w-md text-sm text-pencil">
                Every aspirant ranked by questions solved — compiled live from real practice on the
                Question Bank.
              </p>
              {myRank && (
                <span className="type-data mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper/70 px-3 py-1 text-xs text-pencil">
                  Your standing
                  <span className="font-semibold" style={{ color: "var(--gold)" }}>
                    #{myRank}
                  </span>
                  of {entries.length.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <button
                type="button"
                onClick={() => startTransition(() => router.refresh())}
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-rule bg-paper px-3.5 text-sm text-pencil transition-colors hover:border-ballpoint hover:text-ink"
              >
                <Refresh className={cx("h-4 w-4", isPending && "animate-spin")} />
                Refresh
              </button>
              {asOf && <span className="type-data text-[11px] text-pencil/80">As of {asOf} IST</span>}
            </div>
          </div>

          {entries.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink/10 pt-6 sm:grid-cols-4">
              <Figure value={totals.ranked.toLocaleString("en-IN")} label="Aspirants ranked" />
              <Figure value={totals.solved.toLocaleString("en-IN")} label="Questions solved" />
              <Figure value={totals.attempts.toLocaleString("en-IN")} label="Total attempts" />
              <Figure value={`${totals.best}%`} label="Best accuracy" />
            </dl>
          )}
        </div>
      </section>

      {meId && <LeaderboardPrivacy />}

      {entries.length === 0 ? (
        <div className="paper-sheet mt-6 flex flex-col items-center gap-3 px-4 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-pencil">
            <Trophy className="h-7 w-7" />
          </span>
          <p className="type-display text-lg text-ink">No rankings yet</p>
          <p className="type-data max-w-xs text-sm text-pencil">
            Answer questions in the Question Bank to be the first aspirant on the merit list.
          </p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-4 mt-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="type-display text-xl text-ink">Standings</h2>
              <p className="type-data mt-0.5 text-sm text-pencil">
                {filtered.length.toLocaleString("en-IN")}{" "}
                {filtered.length === 1 ? "aspirant" : "aspirants"}
                {search ? " matched" : " ranked"}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
                <Input
                  placeholder="Search aspirants"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-paper pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                <SelectTrigger className="min-h-11 w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solved">Most solved</SelectItem>
                  <SelectItem value="accuracy">Highest accuracy</SelectItem>
                  <SelectItem value="attempted">Most attempted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ledger */}
          <div className="paper-sheet overflow-hidden">
            <div className="flex items-center gap-4 border-b border-rule bg-secondary/40 px-5 py-3 sm:px-6">
              <span className="type-data w-8 text-center text-[11px] uppercase tracking-[0.14em] text-pencil">
                #
              </span>
              <span className="type-data flex-1 text-[11px] uppercase tracking-[0.14em] text-pencil">
                Aspirant
              </span>
              <span className="type-data w-16 text-right text-[11px] uppercase tracking-[0.14em] text-pencil sm:w-20">
                Solved
              </span>
              <span className="type-data hidden text-right text-[11px] uppercase tracking-[0.14em] text-pencil sm:block sm:w-40 sm:pr-1">
                Accuracy
              </span>
              <span className="type-data hidden w-16 text-right text-[11px] uppercase tracking-[0.14em] text-pencil md:block">
                Attempted
              </span>
            </div>

            <div className="divide-y divide-rule">
              {filtered.map((e) => {
                const isMe = !!meId && e.userId === meId
                const isChampion = e.rank === 1
                return (
                  <button
                    key={e.userId}
                    type="button"
                    onClick={() => setSelected(e)}
                    className={cx(
                      "flex w-full items-center gap-4 border-l-2 px-5 py-4 text-left transition-colors sm:px-6",
                      isMe
                        ? "border-l-ballpoint bg-ballpoint/6"
                        : isChampion
                          ? "bg-[color-mix(in_srgb,var(--gold)_7%,transparent)]"
                          : "border-l-transparent hover:bg-secondary"
                    )}
                    style={isChampion && !isMe ? { borderLeftColor: "var(--gold)" } : undefined}
                  >
                    <span className="flex w-8 justify-center">
                      <RankCell rank={e.rank} />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="block shrink-0 rounded-full"
                        style={
                          MEDAL[e.rank]
                            ? { boxShadow: `0 0 0 2px ${MEDAL[e.rank].v}` }
                            : undefined
                        }
                      >
                        <Avatar className="h-11 w-11">
                          {e.image && <AvatarImage src={e.image} alt={e.name} />}
                          <AvatarFallback className="bg-secondary text-sm text-ballpoint">
                            {initialsOf(e.name)}
                          </AvatarFallback>
                        </Avatar>
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-ink">{e.name}</span>
                          {isChampion && (
                            <Crown
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: "var(--gold)" }}
                            />
                          )}
                          {isMe && (
                            <span className="type-data rounded-sm bg-ballpoint px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-paper">
                              You
                            </span>
                          )}
                        </span>
                        <span className="type-data mt-0.5 text-xs text-pencil sm:hidden">
                          {e.solved.toLocaleString("en-IN")} solved · {e.accuracy}%
                        </span>
                      </span>
                    </span>
                    <span className="type-data w-16 text-right text-base text-ink sm:w-20">
                      {e.solved.toLocaleString("en-IN")}
                    </span>
                    <span className="hidden sm:block sm:w-40">
                      <AccuracyMeter value={e.accuracy} />
                    </span>
                    <span className="type-data hidden w-16 text-right text-pencil md:block">
                      {e.attempted.toLocaleString("en-IN")}
                    </span>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="px-5 py-12 text-center text-sm text-pencil">
                  No aspirants match your search.
                </p>
              )}
            </div>
          </div>

          {/* How it works + a clear next step — gives the page substance below the list. */}
          <div className="mt-6 grid gap-4 sm:grid-cols-[1.5fr_1fr]">
            <section className="paper-sheet p-6">
              <h3 className="type-display text-base text-ink">How the Merit List works</h3>
              <ul className="mt-4 space-y-3.5">
                {([
                  ["var(--gold)", "Ranked by questions solved — the distinct questions you’ve answered correctly."],
                  ["var(--ballpoint)", "Accuracy is your correct answers as a share of every attempt."],
                  ["var(--pencil)", "Standings refresh continuously as aspirants keep practising."],
                ] as [string, string][]).map(([c, text]) => (
                  <li key={text} className="flex gap-3 text-sm text-pencil">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c }}
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="paper-sheet flex flex-col justify-between gap-5 p-6">
              <div>
                <h3 className="type-display text-base text-ink">Climb the ranks</h3>
                <p className="mt-2 text-sm text-pencil">
                  Every solved question moves you up the list. Start a set in the Question Bank.
                </p>
              </div>
              <a
                href="/question-bank"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ballpoint"
              >
                Practice now
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </section>
          </div>
        </>
      )}

      {/* Report-card modal */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} — report card`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-[2px]"
          onClick={() => setSelected(null)}
        >
          <div
            className="paper-sheet relative w-full max-w-md p-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1.5 text-pencil hover:bg-secondary hover:text-ink"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>

            <div className="flex items-center gap-4">
              <span
                className="block rounded-full"
                style={
                  MEDAL[selected.rank]
                    ? { boxShadow: `0 0 0 2.5px ${MEDAL[selected.rank].v}` }
                    : undefined
                }
              >
                <Avatar className="h-14 w-14">
                  {selected.image && <AvatarImage src={selected.image} alt={selected.name} />}
                  <AvatarFallback className="bg-secondary text-ballpoint">
                    {initialsOf(selected.name)}
                  </AvatarFallback>
                </Avatar>
              </span>
              <div className="min-w-0">
                <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                  Report card
                </p>
                <h2 className="type-display truncate text-xl text-ink">{selected.name}</h2>
                <p className="type-data text-sm text-ballpoint">
                  Ranked #{selected.rank} of {entries.length} · Top{" "}
                  {Math.max(1, Math.round((selected.rank / entries.length) * 100))}%
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-6">
              <AccuracyRing value={selected.accuracy} />
              <dl className="flex-1 space-y-3">
                <div className="flex items-baseline justify-between border-b border-rule pb-2">
                  <dt className="text-sm text-pencil">Solved</dt>
                  <dd className="type-data text-lg text-ink">
                    {selected.solved.toLocaleString("en-IN")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-rule pb-2">
                  <dt className="text-sm text-pencil">Attempted</dt>
                  <dd className="type-data text-lg text-ink">
                    {selected.attempted.toLocaleString("en-IN")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-sm text-pencil">Accuracy</dt>
                  <dd className="type-data text-lg text-ink">{selected.accuracy}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
