"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IconChat, IconTrash } from "@/components/admin/icons"

interface Announcement {
  id: string
  title: string
  message: string
  createdAt: string
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const resetForm = () => {
    setTitle("")
    setMessage("")
    setEditingId(null)
  }

  const submit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(
        editingId ? `/api/admin/notifications/${editingId}` : "/api/admin/notifications",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, message }),
        }
      )
      if (!res.ok) throw new Error("save failed")
      toast({
        title: editingId ? "Announcement updated" : "Announcement published",
        description: editingId ? undefined : "Everyone will see it in their notifications.",
        variant: "success",
      })
      resetForm()
      load()
    } catch {
      toast({ title: "Couldn't save the announcement", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (a: Announcement) => {
    setEditingId(a.id)
    setTitle(a.title)
    setMessage(a.message)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const remove = async (id: string) => {
    if (!window.confirm("Delete this announcement for everyone?")) return
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      if (editingId === id) resetForm()
      setItems((prev) => prev.filter((a) => a.id !== id))
      toast({ title: "Announcement deleted" })
    } catch {
      toast({ title: "Couldn't delete", variant: "destructive" })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Masthead */}
      <header>
        <div className="flex items-end justify-between gap-4 border-b border-ink/70 pb-5">
          <div className="space-y-1">
            <p className="type-data text-[11px] uppercase tracking-[0.18em] text-pencil">Overview</p>
            <h1 className="type-display text-3xl text-ink sm:text-4xl">Announcements</h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-ballpoint">
            <IconChat className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-pencil">
          Site-wide notifications shown to every signed-in user in their notification bell.
        </p>
      </header>

      {/* Composer */}
      <section className="paper-sheet p-5 sm:p-6">
        <h2 className="type-display text-base text-ink">
          {editingId ? "Edit announcement" : "New announcement"}
        </h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ann-title" className="text-sm text-pencil">Title</label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled maintenance on Sunday"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ann-message" className="text-sm text-pencil">Message</label>
            <Textarea
              id="ann-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="What do you want everyone to know?"
              maxLength={2000}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Save changes" : "Publish"}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Existing announcements */}
      <section className="paper-sheet overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="type-display text-base text-ink">Published</h2>
        </div>
        {loading ? (
          <div className="divide-y divide-rule">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-secondary" />
                <div className="mt-2 h-2.5 w-2/3 animate-pulse rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <IconChat className="h-8 w-8 text-pencil" />
            <p className="text-sm text-ink">No announcements yet.</p>
            <p className="type-data text-xs text-pencil">Publish one above to reach every user.</p>
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {items.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium text-ink">{a.title}</p>
                  <p className="mt-0.5 break-words text-sm text-pencil">{a.message}</p>
                  <p className="type-data mt-1 text-[11px] text-pencil">
                    {new Date(a.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(a)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    title="Delete announcement"
                    onClick={() => remove(a.id)}
                  >
                    <IconTrash className="h-4 w-4 text-redpen" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
