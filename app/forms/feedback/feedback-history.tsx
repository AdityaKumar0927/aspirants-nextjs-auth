"use client"

import { useCallback, useEffect, useState } from "react"

interface Msg {
  id: string
  fromAdmin: boolean
  content: string
  createdAt: string
}
interface Item {
  id: string
  content: string
  emoji: string | null
  status: string
  anonymous: boolean
  createdAt: string
  messages: Msg[]
}

function statusMeta(status: string) {
  switch (status) {
    case "RESOLVED":
      return { label: "Resolved", dot: "bg-st-answered" }
    case "AWAITING_USER":
      return { label: "Awaiting your reply", dot: "bg-st-review" }
    default:
      return { label: "Open", dot: "bg-st-notvisited" }
  }
}
function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

export default function FeedbackHistory() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/feedback")
      if (res.ok) setItems(await res.json())
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function sendReply(id: string) {
    const content = (drafts[id] || "").trim()
    if (!content) return
    setBusy(id)
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        setDrafts((d) => ({ ...d, [id]: "" }))
        await load()
      }
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="paper-sheet p-6 text-center text-sm text-pencil">Loading…</div>
  }
  if (!items.length) {
    return (
      <div className="paper-sheet p-6 text-center text-sm text-pencil">
        You haven&apos;t sent any feedback yet. Use the “Feedback” button anywhere on the site.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((f) => {
        const s = statusMeta(f.status)
        return (
          <div key={f.id} className="paper-sheet p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="type-data inline-flex items-center gap-2 text-xs text-pencil">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                {s.label}
              </span>
              <span className="type-data text-xs text-pencil">{when(f.createdAt)}</span>
            </div>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink">
              {f.emoji && <span className="mr-1">{f.emoji}</span>}
              {f.content}
            </p>
            {f.anonymous && (
              <p className="type-data mt-1 text-[11px] text-pencil">Sent anonymously</p>
            )}

            {f.messages.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-rule pt-3">
                {f.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg p-2.5 ${
                      m.fromAdmin ? "mr-auto bg-secondary/50" : "ml-auto bg-ballpoint/10"
                    }`}
                  >
                    <p className="type-data mb-0.5 text-[10px] uppercase tracking-wide text-pencil">
                      {m.fromAdmin ? "Team" : "You"} · {when(m.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm text-ink">{m.content}</p>
                  </div>
                ))}
              </div>
            )}

            {f.status === "AWAITING_USER" && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={drafts[f.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [f.id]: e.target.value }))}
                  rows={2}
                  placeholder="Reply to the team…"
                  className="w-full resize-none rounded-md border border-rule bg-paper p-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                />
                <button
                  type="button"
                  disabled={busy === f.id || !(drafts[f.id] || "").trim()}
                  onClick={() => sendReply(f.id)}
                  className="rounded-md bg-ballpoint px-3 py-1.5 text-sm text-paper transition-colors hover:bg-ballpoint/90 disabled:opacity-50"
                >
                  {busy === f.id ? "Sending…" : "Send reply"}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
