"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface FeatureRequestRow {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  tags: string[];
  votes: number;
  comments: number;
  submittedBy: string;
  submitterEmail: string | null;
  createdAt: string;
}

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"] as const;

function statusDot(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-st-answered";
    case "IN_PROGRESS":
      return "bg-st-review";
    case "REJECTED":
      return "bg-redpen";
    default:
      return "bg-st-notvisited";
  }
}
function statusLabel(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function AdminFeatureRequestsPage() {
  const [items, setItems] = useState<FeatureRequestRow[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/feature-requests${qs}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/feature-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) {
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Permanently delete this feature request (and its votes/comments)?")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/feature-requests/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Support</p>
          <h1 className="type-display text-2xl text-ink sm:text-3xl">Feature requests</h1>
          <p className="text-sm text-pencil">
            What users have asked for, by votes. Update status or remove a request.
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
        <div className="paper-sheet p-8 text-center text-sm text-pencil">No feature requests yet.</div>
      ) : (
        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rule">
              <tr className="type-data text-[11px] uppercase tracking-wider text-pencil">
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="px-4 py-3 font-medium">Votes</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-rule align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.title}</div>
                    <div className="mt-0.5 line-clamp-2 max-w-md break-words text-xs text-pencil">
                      {r.description}
                    </div>
                    <div className="type-data mt-1 text-[11px] text-pencil">
                      {r.category}
                      {r.comments > 0 ? ` · ${r.comments} comment${r.comments === 1 ? "" : "s"}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{r.votes}</td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{r.submittedBy}</div>
                    {r.submitterEmail && (
                      <div className="type-data text-xs text-pencil">{r.submitterEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      disabled={busy === r.id}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                      className="h-9 rounded-md border border-rule bg-paper px-2 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                    <span className="type-data mt-1 flex items-center gap-1.5 text-[11px] text-pencil">
                      <span className={`h-2 w-2 rounded-full ${statusDot(r.status)}`} />
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === r.id}
                      className="text-redpen hover:bg-redpen/10 hover:text-redpen"
                      onClick={() => remove(r.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
