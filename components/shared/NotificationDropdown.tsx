"use client";

import { useCallback, useEffect, useState } from "react";
import Popover from "@/components/shared/popover";

interface Notif {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  userId: string | null;
  relatedFeedbackId?: string | null;
}

// Site-wide announcements have no per-user row, so their read state lives here.
const READ_KEY = "aspirants:readAnnouncements";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7
    ? `${days}d ago`
    : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Bell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 5.7 1.8 5.7H4.2S6 14 6 9.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  // Inline reply (for "the team replied to your feedback" notifications).
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setItems(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setReadAnnouncements(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    load();
  }, [load]);

  const isUnread = (n: Notif) => (n.userId ? !n.read : !readAnnouncements.has(n.id));
  const unread = items.filter(isUnread).length;

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const next = new Set([...readAnnouncements, ...items.filter((n) => !n.userId).map((n) => n.id)]);
    setReadAnnouncements(next);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      /* ignore */
    }
  };

  const openReply = (id: string) => {
    setReplyFor((cur) => (cur === id ? null : id));
    setDraft("");
  };

  const sendReply = async (n: Notif) => {
    if (!n.relatedFeedbackId || !draft.trim()) return;
    setReplyBusy(true);
    try {
      const res = await fetch(`/api/feedback/${n.relatedFeedbackId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      });
      if (res.ok) {
        setRepliedIds((prev) => new Set(prev).add(n.id));
        setReplyFor(null);
        setDraft("");
        // The clarification has been answered — mark it read.
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [n.id] }),
        }).catch(() => {});
      }
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <Popover
        content={
          <div className="theme-desk w-80 overflow-hidden rounded-lg border border-rule bg-paper">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <span className="type-display text-sm text-ink">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="type-data text-xs text-ballpoint hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-pencil">
                  {"You're all caught up."}
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {items.map((n) => {
                    const unr = isUnread(n);
                    return (
                      <li key={n.id} className={`flex gap-3 px-4 py-3 ${unr ? "bg-ballpoint/5" : ""}`}>
                        <span
                          aria-hidden="true"
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unr ? "bg-ballpoint" : "bg-transparent"}`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                            {!n.userId && (
                              <span className="rounded-sm bg-secondary px-1 py-0.5 type-data text-[9px] uppercase tracking-wide text-pencil">
                                News
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-3 text-xs text-pencil">{n.message}</p>
                          <p className="type-data mt-1 text-[10px] text-pencil">{timeAgo(n.createdAt)}</p>

                          {/* Inline reply for "the team replied to your feedback". */}
                          {n.type === "FEEDBACK_RESPONSE" && n.relatedFeedbackId && (
                            repliedIds.has(n.id) ? (
                              <p className="type-data mt-1.5 text-[11px] text-st-answered">
                                Reply sent ✓
                              </p>
                            ) : replyFor === n.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                  rows={2}
                                  autoFocus
                                  placeholder="Your reply…"
                                  className="w-full resize-none rounded-md border border-rule bg-paper p-2 text-xs text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={replyBusy || !draft.trim()}
                                    onClick={() => sendReply(n)}
                                    className="rounded-md bg-ballpoint px-2.5 py-1 type-data text-[11px] text-paper disabled:opacity-50"
                                  >
                                    {replyBusy ? "Sending…" : "Send"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReplyFor(null)}
                                    className="type-data text-[11px] text-pencil hover:underline"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReply(n.id)}
                                className="type-data mt-1.5 text-[11px] text-ballpoint hover:underline"
                              >
                                Reply
                              </button>
                            )
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        }
        align="end"
        openPopover={open}
        setOpenPopover={setOpen}
      >
        <button
          onClick={() => setOpen(!open)}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-pencil transition-colors hover:bg-secondary hover:text-ink focus:outline-none active:scale-95"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-redpen px-1 type-data text-[10px] font-medium text-paper">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </Popover>
    </div>
  );
}
