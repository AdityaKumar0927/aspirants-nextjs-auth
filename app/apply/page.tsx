import type { Metadata } from "next"
import Link from "next/link"
import { getCurrentSession } from "@/lib/auth"
import { buildMetadata, getSiteName } from "@/lib/site-config"
import ApplyForm from "./apply-form"

export async function generateMetadata(): Promise<Metadata> {
  const name = await getSiteName()
  return buildMetadata("Become a volunteer", {
    description: `Apply to volunteer with ${name} — help build free, high-quality exam prep for every aspirant.`,
  })
}

const CONTRIBUTIONS = [
  {
    title: "Sharpen the question bank",
    body: "Add questions, write clear markschemes, and flag errors so every answer can be trusted.",
  },
  {
    title: "Help fellow aspirants",
    body: "Answer doubts, suggest resources, and make the community a place people want to study in.",
  },
  {
    title: "Shape the platform",
    body: "Propose and vote on features, and tell us what would make your own prep easier.",
  },
]

export default async function ApplyPage() {
  const session = await getCurrentSession()
  const name = await getSiteName()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
      {/* Hero */}
      <header className="text-center">
        <p className="type-data text-[11px] uppercase tracking-[0.22em] text-pencil">
          Join the team
        </p>
        <h1 className="type-display mt-3 text-4xl text-ink sm:text-5xl">
          Become a <span className="highlight-sweep">{name}</span> volunteer
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-pencil">
          {name} is built by aspirants, for aspirants. Volunteers help keep exam prep free,
          accurate, and genuinely useful for millions preparing across India.
        </p>
      </header>

      {/* What volunteers do */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {CONTRIBUTIONS.map((c) => (
          <div key={c.title} className="paper-sheet p-5">
            <h2 className="type-display text-base text-ink">{c.title}</h2>
            <p className="mt-2 text-sm text-pencil">{c.body}</p>
          </div>
        ))}
      </section>

      {/* Path to moderator */}
      <p className="mt-8 rounded-lg border border-rule bg-secondary/40 px-4 py-3 text-sm text-pencil">
        <span className="font-medium text-ink">Looking to moderate?</span> Moderators are chosen
        from active volunteers — start here, contribute for a while, and we&rsquo;ll invite the most
        dedicated volunteers to take on moderation.
      </p>

      {/* Apply */}
      <section className="mt-10">
        <h2 className="type-display mb-4 text-2xl text-ink">Your application</h2>
        {session?.user ? (
          <ApplyForm
            name={session.user.name ?? ""}
            email={session.user.email ?? ""}
          />
        ) : (
          <div className="paper-sheet p-8 text-center">
            <p className="text-sm text-pencil">
              Sign in to apply — we use your account so we can reply and track your application.
            </p>
            <Link
              href="/api/auth/signin?callbackUrl=/apply"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ballpoint"
            >
              Sign in to apply
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
