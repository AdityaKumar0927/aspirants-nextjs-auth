"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface FeedbackUser {
  name: string | null;
  email: string | null;
  image: string | null;
}
interface FeedbackRow {
  id: string;
  content: string;
  emoji: string | null;
  feedbackType: string;
  status: string;
  anonymous: boolean;
  questionId: string | null;
  createdAt: string;
  messageCount: number;
  user: FeedbackUser | null;
}
interface ThreadMessage {
  id: string;
  fromAdmin: boolean;
  content: string;
  createdAt: string;
}
interface Thread extends Omit<FeedbackRow, "messageCount"> {
  messages: ThreadMessage[];
}

const STATUSES = ["OPEN", "AWAITING_USER", "RESOLVED"] as const;

function statusDot(status: string) {
  switch (status) {
    case "RESOLVED":
      return "bg-st-answered";
    case "AWAITING_USER":
      return "bg-st-review";
    default:
      return "bg-st-notvisited";
  }
}
function statusLabel(status: string) {
  return status === "AWAITING_USER" ? "Awaiting user" : status.charAt(0) + status.slice(1).toLowerCase();
}
function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [thread, setThread] = useState<Thread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/feedback${qs}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openThread = useCallback(async (id: string) => {
    setThreadLoading(true);
    setReply("");
    const res = await fetch(`/api/admin/feedback/${id}`);
    if (res.ok) setThread(await res.json());
    setThreadLoading(false);
  }, []);

  async function sendReply() {
    if (!thread || !reply.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/admin/feedback/${thread.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setReply("");
      await openThread(thread.id);
      load();
    }
  }

  async function setStatus(status: string) {
    if (!thread) return;
    setBusy(true);
    const res = await fetch(`/api/admin/feedback/${thread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (res.ok) {
      setThread({ ...thread, status });
      load();
    }
  }

  const who = (f: { anonymous: boolean; user: FeedbackUser | null }) =>
    f.anonymous ? "Anonymous" : f.user?.name || f.user?.email || "Unknown";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Support</p>
          <h1 className="type-display text-2xl text-ink sm:text-3xl">Feedback</h1>
          <p className="text-sm text-pencil">
            Read what users sent, ask for clarification, and resolve. Replies reach users in their
            notifications.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="paper-sheet p-8 text-center text-sm text-pencil">Loading…</div>
      ) : items.length === 0 ? (
        <div className="paper-sheet p-8 text-center text-sm text-pencil">No feedback yet.</div>
      ) : (
        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rule">
              <tr className="type-data text-[11px] uppercase tracking-wider text-pencil">
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Feedback</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-rule align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      {f.anonymous && <span aria-hidden="true">🕶️</span>}
                      {who(f)}
                    </div>
                    {!f.anonymous && f.user?.email && (
                      <div className="type-data text-xs text-pencil">{f.user.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-md items-start gap-2">
                      {f.emoji && <span aria-hidden="true">{f.emoji}</span>}
                      <span className="line-clamp-2 break-words text-pencil">{f.content}</span>
                    </div>
                    {f.messageCount > 0 && (
                      <div className="type-data mt-1 text-[11px] text-ballpoint">
                        {f.messageCount} message{f.messageCount === 1 ? "" : "s"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="type-data inline-flex items-center gap-2 text-xs text-pencil">
                      <span className={`h-2 w-2 rounded-full ${statusDot(f.status)}`} />
                      {statusLabel(f.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="type-data text-xs text-pencil">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" onClick={() => openThread(f.id)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Thread modal */}
      {(thread || threadLoading) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Feedback conversation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-[2px]"
          onClick={() => setThread(null)}
        >
          <div
            className="paper-sheet relative flex max-h-[85vh] w-full max-w-lg flex-col p-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            {threadLoading || !thread ? (
              <div className="py-16 text-center text-sm text-pencil">Loading…</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                      {thread.anonymous ? "Anonymous feedback" : who(thread)}
                    </p>
                    <h2 className="type-display flex items-center gap-2 text-lg text-ink">
                      {thread.emoji && <span aria-hidden="true">{thread.emoji}</span>}
                      Conversation
                    </h2>
                    {!thread.anonymous && thread.user?.email && (
                      <p className="type-data text-xs text-pencil">{thread.user.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-pencil hover:bg-secondary hover:text-ink"
                    onClick={() => setThread(null)}
                  >
                    ✕<span className="sr-only">Close</span>
                  </button>
                </div>

                <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                  {/* Original feedback */}
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="type-data mb-1 text-[10px] uppercase tracking-wide text-pencil">
                      {thread.anonymous ? "Anonymous" : who(thread)} · {when(thread.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm text-ink">{thread.content}</p>
                  </div>
                  {/* Thread */}
                  {thread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-lg p-3 ${
                        m.fromAdmin
                          ? "ml-auto bg-ballpoint/10"
                          : "mr-auto bg-secondary/40"
                      }`}
                    >
                      <p className="type-data mb-1 text-[10px] uppercase tracking-wide text-pencil">
                        {m.fromAdmin ? "Team" : thread.anonymous ? "Anonymous" : who(thread)} ·{" "}
                        {when(m.createdAt)}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm text-ink">{m.content}</p>
                    </div>
                  ))}
                </div>

                {/* Composer */}
                <div className="mt-4 space-y-3 border-t border-rule pt-4">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Ask for clarification or reply…"
                    rows={3}
                    className="w-full resize-none rounded-md border border-rule bg-paper p-3 text-sm text-ink placeholder:text-pencil focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="type-data inline-flex items-center gap-1.5 text-xs text-pencil">
                        <span className={`h-2 w-2 rounded-full ${statusDot(thread.status)}`} />
                        {statusLabel(thread.status)}
                      </span>
                      {thread.status !== "RESOLVED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => setStatus("RESOLVED")}
                        >
                          Mark resolved
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => setStatus("OPEN")}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={busy || !reply.trim()}
                      onClick={sendReply}
                      className="bg-ballpoint text-paper hover:bg-ballpoint/90"
                    >
                      {busy ? "Sending…" : "Send reply"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
