import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  IconPaper,
  IconPeople,
  IconChat,
  IconShield,
  IconClipboard,
  IconPencil,
  IconImport,
  IconRoles,
  IconArrow,
  IconArrowUpRight,
  IconTrendUp,
  IconTrendFlat,
  IconCheck,
  IconAlert,
} from "@/components/admin/icons"

// Admin counts must always reflect the live DB, never a build-time snapshot.
export const dynamic = "force-dynamic"

const ROLE_ORDER = ["administrator", "moderator", "volunteer", "member"] as const

const ROLE_COLOR: Record<string, string> = {
  administrator: "var(--redpen)",
  moderator: "var(--ballpoint)",
  volunteer: "var(--st-review)",
  member: "var(--pencil)",
}

function plain(s: string | null) {
  return (s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export default async function AdminDashboard() {
  // Access is gated upstream: the edge middleware blocks /administrator/* for
  // anyone whose JWT role !== "administrator", and the admin layout re-checks
  // client-side. No per-page redirect here (it would race the session read).
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    activeQuestions,
    draftQuestions,
    archivedQuestions,
    questionsThisWeek,
    totalUsers,
    usersThisWeek,
    openFeedback,
    openRequests,
    overdueRequests,
    pendingApplications,
    recentQuestions,
    roles,
    usersByRole,
    subjectGroups,
  ] = await prisma.$transaction([
    prisma.question.count({ where: { status: "ACTIVE" } }),
    prisma.question.count({ where: { status: "DRAFT" } }),
    prisma.question.count({ where: { status: "ARCHIVED" } }),
    prisma.question.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.feedback.count({ where: { resolved: false } }),
    prisma.dataRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.dataRequest.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, dueAt: { lt: now } },
    }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        questionId: true,
        title: true,
        text: true,
        subject: true,
        difficulty: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.userRole.findMany({ select: { id: true, name: true } }),
    prisma.user.groupBy({ by: ["roleId"], _count: { _all: true } }),
    prisma.question.groupBy({
      by: ["subject"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
  ])

  const bankTotal = activeQuestions + draftQuestions + archivedQuestions
  const statusSegments = [
    { label: "Active", value: activeQuestions, color: "var(--st-answered)" },
    { label: "Draft", value: draftQuestions, color: "var(--st-review)" },
    { label: "Archived", value: archivedQuestions, color: "var(--pencil)" },
  ]

  // Role distribution, normalised to the canonical order.
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]))
  const roleCounts = new Map<string, number>()
  for (const row of usersByRole) {
    const name = roleNameById.get(row.roleId) ?? row.roleId
    roleCounts.set(name, (roleCounts.get(name) ?? 0) + row._count._all)
  }
  const roleDistribution = ROLE_ORDER.map((name) => ({ name, count: roleCounts.get(name) ?? 0 }))
  const roleTotal = roleDistribution.reduce((s, r) => s + r.count, 0) || 1

  const subjects = subjectGroups
    .map((s) => ({ subject: s.subject?.trim() || "Unspecified", count: s._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  const maxSubjectCount = Math.max(...subjects.map((s) => s.count), 1)

  const attention = [
    {
      label: "Data requests",
      count: openRequests,
      note: overdueRequests > 0 ? `${overdueRequests} overdue` : "within SLA",
      urgent: overdueRequests > 0,
      href: "/administrator/data-requests",
      icon: IconShield,
    },
    {
      label: "Pending applications",
      count: pendingApplications,
      note: pendingApplications > 0 ? "awaiting review" : "none waiting",
      urgent: false,
      href: "/administrator/applications",
      icon: IconClipboard,
    },
    {
      label: "Draft questions",
      count: draftQuestions,
      note: draftQuestions > 0 ? "not yet published" : "all published",
      urgent: false,
      href: "/administrator/question-bank",
      icon: IconPencil,
    },
  ]
  const totalToClear = openRequests + pendingApplications + draftQuestions

  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Masthead */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/70 pb-5">
          <div className="space-y-1">
            <p className="type-data text-[11px] uppercase tracking-[0.18em] text-pencil">Administration</p>
            <h1 className="type-display text-3xl text-ink sm:text-4xl">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-st-answered opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-st-answered" />
            </span>
            <span className="type-data text-xs text-pencil">Live · {dateStr}</span>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-pencil">
          A real-time view of the question bank, the community, and everything waiting on your review.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active questions"
          value={activeQuestions}
          icon={<IconPaper className="h-5 w-5" />}
          delta={questionsThisWeek > 0 ? `+${questionsThisWeek} this week` : "no new this week"}
          trend={questionsThisWeek > 0 ? "up" : "flat"}
        />
        <KpiCard
          label="Members"
          value={totalUsers}
          icon={<IconPeople className="h-5 w-5" />}
          delta={usersThisWeek > 0 ? `+${usersThisWeek} this week` : "no new this week"}
          trend={usersThisWeek > 0 ? "up" : "flat"}
        />
        <KpiCard
          label="Open feedback"
          value={openFeedback}
          icon={<IconChat className="h-5 w-5" />}
          delta={openFeedback > 0 ? "needs triage" : "inbox clear"}
          trend={openFeedback > 0 ? "urgent" : "flat"}
        />
        <KpiCard
          label="Data requests"
          value={openRequests}
          icon={<IconShield className="h-5 w-5" />}
          delta={overdueRequests > 0 ? `${overdueRequests} overdue` : "within SLA"}
          trend={overdueRequests > 0 ? "urgent" : "flat"}
        />
      </div>

      {/* Bank composition + recently added (left) · needs attention (right) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Question bank" action={{ href: "/administrator/question-bank", label: "Manage" }}>
            <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:gap-8">
              <StatusDonut segments={statusSegments} total={bankTotal} />
              <dl className="flex-1 space-y-3">
                {statusSegments.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <dt className="flex-1 text-sm text-ink">{s.label}</dt>
                    <dd className="type-data text-sm text-ink">{s.value.toLocaleString("en-IN")}</dd>
                    <dd className="type-data w-12 text-right text-xs text-pencil">
                      {bankTotal ? Math.round((s.value / bankTotal) * 100) : 0}%
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Panel>

          <Panel
            title="Recently added"
            action={{ href: "/administrator/question-bank", label: "View all" }}
          >
            {recentQuestions.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-pencil">No questions in the bank yet.</p>
            ) : (
              <div className="divide-y divide-rule">
                {recentQuestions.map((q) => (
                  <div key={q.questionId} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">
                        {plain(q.title) || plain(q.text).slice(0, 80) || "Untitled question"}
                      </p>
                      <p className="type-data mt-0.5 truncate text-xs text-pencil">
                        {[q.subject, q.difficulty].filter(Boolean).join(" · ") || q.questionId}
                      </p>
                    </div>
                    <StatusBadge status={q.status} />
                    <span className="type-data hidden w-16 shrink-0 text-right text-xs text-pencil sm:block">
                      {q.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Needs attention" titleAccessory={totalToClear === 0 ? <IconCheck className="h-4 w-4 text-st-answered" /> : undefined}>
          {totalToClear === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <IconCheck className="h-8 w-8 text-st-answered" />
              <p className="text-sm text-ink">You&apos;re all caught up.</p>
              <p className="type-data text-xs text-pencil">No queues need action.</p>
            </div>
          ) : (
            <div className="divide-y divide-rule">
              {attention.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      item.urgent ? "bg-redpen/10 text-redpen" : "bg-secondary text-ballpoint"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="type-data text-lg text-ink">{item.count}</span>
                      <span className="truncate text-sm text-ink">{item.label}</span>
                    </span>
                    <span
                      className={`type-data flex items-center gap-1 text-xs ${
                        item.urgent ? "text-redpen" : "text-pencil"
                      }`}
                    >
                      {item.urgent && <IconAlert className="h-3 w-3" />}
                      {item.note}
                    </span>
                  </span>
                  <IconArrow className="h-4 w-4 shrink-0 text-pencil transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Community by role · bank by subject */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Community by role" action={{ href: "/administrator/manage-roles", label: "Manage" }}>
          <div className="space-y-4 p-5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
              {roleDistribution
                .filter((r) => r.count > 0)
                .map((r) => (
                  <div
                    key={r.name}
                    style={{ width: `${(r.count / roleTotal) * 100}%`, background: ROLE_COLOR[r.name] }}
                    title={`${r.name}: ${r.count}`}
                  />
                ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
              {roleDistribution.map((r) => (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ROLE_COLOR[r.name] }} />
                  <dt className="flex-1 text-sm capitalize text-ink">{r.name}</dt>
                  <dd className="type-data text-sm text-pencil">{r.count.toLocaleString("en-IN")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>

        <Panel title="Bank by subject">
          {subjects.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-pencil">No active questions yet.</p>
          ) : (
            <div className="space-y-3 p-5">
              {subjects.map((s) => (
                <div key={s.subject} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-ink" title={s.subject}>
                    {s.subject}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-ballpoint"
                      style={{ width: `${Math.max((s.count / maxSubjectCount) * 100, 3)}%` }}
                    />
                  </div>
                  <span className="type-data w-14 shrink-0 text-right text-sm text-pencil">
                    {s.count.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard href="/administrator/question-bank/import" title="Import questions" desc="Add from a PDF paper" icon={<IconImport className="h-5 w-5" />} />
          <ActionCard href="/administrator/question-bank" title="Question bank" desc="Browse, edit & publish" icon={<IconPaper className="h-5 w-5" />} />
          <ActionCard href="/administrator/manage-roles" title="User roles" desc="Promote moderators & staff" icon={<IconRoles className="h-5 w-5" />} />
          <ActionCard href="/administrator/data-requests" title="Data requests" desc="Resolve DPDP requests" icon={<IconShield className="h-5 w-5" />} />
        </div>
      </section>
    </div>
  )
}

/* ---------------------------------- bits --------------------------------- */

function Panel({
  title,
  action,
  titleAccessory,
  children,
}: {
  title: string
  action?: { href: string; label: string }
  titleAccessory?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="paper-sheet overflow-hidden">
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="type-display text-base text-ink">{title}</h2>
          {titleAccessory}
        </div>
        {action && (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-1 type-data text-xs text-ballpoint hover:underline"
          >
            {action.label}
            <IconArrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function KpiCard({
  label,
  value,
  icon,
  delta,
  trend,
}: {
  label: string
  value: number
  icon: React.ReactNode
  delta: string
  trend: "up" | "flat" | "urgent"
}) {
  return (
    <div className="paper-sheet p-5">
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-ballpoint">
          {icon}
        </span>
        <Delta trend={trend} label={delta} />
      </div>
      <p className="type-data mt-4 text-3xl text-ink">{value.toLocaleString("en-IN")}</p>
      <p className="mt-0.5 text-sm text-pencil">{label}</p>
    </div>
  )
}

function Delta({ trend, label }: { trend: "up" | "flat" | "urgent"; label: string }) {
  const color = trend === "urgent" ? "text-redpen" : trend === "up" ? "text-st-answered" : "text-pencil"
  const Glyph = trend === "urgent" ? IconAlert : trend === "up" ? IconTrendUp : IconTrendFlat
  return (
    <span className={`inline-flex items-center gap-1 type-data text-xs ${color}`}>
      <Glyph className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function ActionCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href} className="paper-sheet group flex flex-col gap-3 p-5 transition-colors hover:border-ballpoint">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-ballpoint">
          {icon}
        </span>
        <IconArrowUpRight className="h-4 w-4 text-pencil transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="type-data mt-0.5 text-xs text-pencil">{desc}</p>
      </div>
    </Link>
  )
}

function StatusDonut({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[]
  total: number
}) {
  const R = 15.9155 // circumference ≈ 100, so values map straight to %
  // Precompute each arc's length and its start offset (sum of preceding arcs)
  // without mutating across the render.
  const pcts = segments.map((s) => (total ? (s.value / total) * 100 : 0))
  const arcs = segments.map((s, i) => ({
    ...s,
    pct: pcts[i],
    offset: -pcts.slice(0, i).reduce((a, b) => a + b, 0),
  }))
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
        <circle cx="18" cy="18" r={R} fill="none" stroke="var(--rule)" strokeWidth="3.2" />
        {arcs.map((s) => (
          <circle
            key={s.label}
            cx="18"
            cy="18"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="3.2"
            strokeDasharray={`${s.pct} ${100 - s.pct}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="type-data text-2xl text-ink">{total.toLocaleString("en-IN")}</span>
        <span className="type-data text-[10px] uppercase tracking-wider text-pencil">questions</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "ACTIVE" | "DRAFT" | "ARCHIVED" }) {
  const dot =
    status === "ACTIVE" ? "bg-st-answered" : status === "DRAFT" ? "bg-st-review" : "bg-st-notvisited"
  const label = status.charAt(0) + status.slice(1).toLowerCase()
  return (
    <span className="type-data hidden items-center gap-1.5 text-xs text-pencil sm:inline-flex">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
