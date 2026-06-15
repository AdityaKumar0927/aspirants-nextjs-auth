import Link from "next/link";
import { getKnownBugs, type KnownBug } from "@/lib/known-bugs";
import { CheckCircle2, Info } from "@/components/desk/icons";

// Reads live from the Issue tracker (cached briefly underneath).
export const dynamic = "force-dynamic";

const STATUS_META: Record<KnownBug["status"], { label: string; color: string; Icon: typeof Info }> = {
  IN_PROGRESS: { label: "Known · in progress", color: "var(--redpen)", Icon: Info },
  RESOLVED: { label: "Fixed", color: "var(--st-answered)", Icon: CheckCircle2 },
};

const PRIORITY_LABEL: Record<KnownBug["priority"], string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso));

export default async function KnownBugsPage() {
  const bugs = await getKnownBugs();
  const active = bugs.filter((b) => b.status === "IN_PROGRESS");
  const fixed = bugs.filter((b) => b.status === "RESOLVED");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-5">
        <div>
          <p className="type-data text-[11px] uppercase tracking-[0.2em] text-pencil">Status board</p>
          <h1 className="type-display mt-2 text-3xl text-ink sm:text-4xl">Known issues</h1>
          <p className="mt-2 max-w-md text-sm text-pencil">
            Bugs we’re aware of and actively tracking, plus what we’ve recently fixed.
          </p>
        </div>
        <Link
          href="/issues"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-rule bg-paper px-3.5 text-sm text-pencil transition-colors hover:border-ballpoint hover:text-ink"
        >
          Report a bug
        </Link>
      </header>

      {bugs.length === 0 ? (
        <div className="paper-sheet flex flex-col items-center gap-3 px-4 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-st-answered">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="type-display text-lg text-ink">No known issues right now</p>
          <p className="type-data max-w-xs text-sm text-pencil">
            The board is clean. Spotted something off?{" "}
            <Link href="/issues" className="text-ballpoint underline">
              Let us know
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <BugSection
            title="Active"
            count={active.length}
            empty="Nothing actively broken right now."
            bugs={active}
          />
          {fixed.length > 0 && <BugSection title="Recently fixed" count={fixed.length} bugs={fixed} />}
        </div>
      )}
    </div>
  );
}

function BugSection({
  title,
  count,
  empty,
  bugs,
}: {
  title: string;
  count: number;
  empty?: string;
  bugs: KnownBug[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="type-display text-lg text-ink">{title}</h2>
        <span className="type-data text-sm text-pencil">{count}</span>
      </div>
      {bugs.length === 0 ? (
        <p className="paper-sheet px-5 py-8 text-center text-sm text-pencil">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bugs.map((bug) => {
            const meta = STATUS_META[bug.status];
            return (
              <article key={bug.id} className="paper-sheet flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span style={{ color: meta.color }}>
                    <meta.Icon className="h-4 w-4" />
                  </span>
                  <span
                    className="type-data text-[11px] uppercase tracking-[0.14em]"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="type-data ml-auto rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-pencil">
                    {PRIORITY_LABEL[bug.priority]}
                  </span>
                </div>
                <h3 className="type-display mt-2.5 text-base text-ink">{bug.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-pencil">{bug.description}</p>
                <p className="type-data mt-3 text-[11px] text-pencil">
                  Updated {fmtDate(bug.updatedAt)}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
