"use client"

import { useState } from "react"

const MIN = 50

/**
 * Volunteer application form (volunteer role only — moderators are promoted from
 * active volunteers by an admin). Desk-themed, with inline success + a honeypot.
 */
export default function ApplyForm({
  name: initialName,
  email,
}: {
  name: string
  email: string
}) {
  const [name, setName] = useState(initialName)
  const [experience, setExperience] = useState("")
  const [motivation, setMotivation] = useState("")
  const [company, setCompany] = useState("") // honeypot — must stay empty
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expLeft = Math.max(0, MIN - experience.trim().length)
  const motLeft = Math.max(0, MIN - motivation.trim().length)
  const canSubmit =
    name.trim().length >= 2 && expLeft === 0 && motLeft === 0 && !submitting

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email,
          role: "VOLUNTEER",
          experience: experience.trim(),
          motivation: motivation.trim(),
          honeypot: company,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || "Couldn't submit your application. Please try again.")
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="paper-sheet p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-st-answered/15 text-st-answered">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="type-display text-2xl text-ink">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-pencil">
          Thanks{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}! We review volunteer
          applications regularly and will reach out by email. Keep practising in the meantime —
          active contributors are the first we consider for moderator roles.
        </p>
        <a
          href="/question-bank"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ballpoint"
        >
          Back to the Question Bank
        </a>
      </div>
    )
  }

  const fieldClass =
    "mt-2 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
  const labelClass = "type-data text-[11px] uppercase tracking-[0.14em] text-pencil"

  return (
    <form onSubmit={submit} className="paper-sheet space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="apply-name" className={labelClass}>
          Your name
        </label>
        <input
          id="apply-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={fieldClass}
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="apply-email" className={labelClass}>
          Email
        </label>
        <input id="apply-email" value={email} disabled className={`${fieldClass} opacity-70`} />
        <p className="mt-1 text-xs text-pencil">We&rsquo;ll contact you here about your application.</p>
      </div>

      <div>
        <label htmlFor="apply-exp" className={labelClass}>
          Relevant experience
        </label>
        <textarea
          id="apply-exp"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Exams you've prepared for, subjects you're strong in, content/community work you've done…"
          className={`${fieldClass} resize-none`}
        />
        <p className="mt-1 text-xs text-pencil">
          {expLeft > 0 ? `${expLeft} more characters needed` : "Looks good ✓"}
        </p>
      </div>

      <div>
        <label htmlFor="apply-mot" className={labelClass}>
          Why do you want to volunteer?
        </label>
        <textarea
          id="apply-mot"
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="What you'd like to help with and why it matters to you…"
          className={`${fieldClass} resize-none`}
        />
        <p className="mt-1 text-xs text-pencil">
          {motLeft > 0 ? `${motLeft} more characters needed` : "Looks good ✓"}
        </p>
      </div>

      {/* Honeypot — hidden from humans */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && <p className="text-sm text-redpen">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ballpoint px-5 text-sm font-medium text-paper transition-colors hover:bg-ballpoint/90 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit volunteer application"}
      </button>
    </form>
  )
}
