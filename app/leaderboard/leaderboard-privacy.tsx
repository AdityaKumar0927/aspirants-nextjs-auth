"use client"

import { useEffect, useState } from "react"

/**
 * Self-contained "Your ranking visibility" panel shown to signed-in aspirants on
 * the Merit List. Lets them opt out, appear anonymously, or set a custom display
 * name. Loads + saves via /api/leaderboard/privacy.
 */
export default function LeaderboardPrivacy() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [optOut, setOptOut] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/leaderboard/privacy")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        setOptOut(!!d.optOut)
        setAnonymous(!!d.anonymous)
        setName(d.name || "")
        setLoaded(true)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    const res = await fetch("/api/leaderboard/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optOut, anonymous, name }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <section className="paper-sheet mt-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-secondary/40"
      >
        <span className="type-display text-sm text-ink">Your ranking visibility</span>
        <span className="type-data text-xs text-pencil">{open ? "Hide" : "Manage"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-rule px-5 py-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={optOut}
              onChange={(e) => setOptOut(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ballpoint"
            />
            <span>
              Hide me from the rankings
              <span className="block text-xs text-pencil">
                You won&rsquo;t appear on the Merit List at all.
              </span>
            </span>
          </label>

          <label
            className={`flex items-start gap-2.5 text-sm ${
              optOut ? "cursor-not-allowed text-pencil/50" : "cursor-pointer text-ink"
            }`}
          >
            <input
              type="checkbox"
              disabled={optOut}
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ballpoint"
            />
            <span>
              Show me as &ldquo;Anonymous&rdquo;
              <span className="block text-xs text-pencil">
                Your rank and stats stay, but your name and photo are hidden.
              </span>
            </span>
          </label>

          <div className={optOut || anonymous ? "opacity-50" : ""}>
            <label
              htmlFor="lb-name"
              className="type-data text-xs uppercase tracking-wide text-pencil"
            >
              Display name
            </label>
            <input
              id="lb-name"
              value={name}
              disabled={optOut || anonymous}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Your name on the board"
              className="mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
            />
            <p className="mt-1 text-xs text-pencil">Leave blank to use your account name.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving || !loaded}
              className="rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-paper transition-colors hover:bg-ballpoint disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && (
              <span className="type-data text-xs text-st-answered">
                Saved ✓ <span className="text-pencil">— may take a minute to show.</span>
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
