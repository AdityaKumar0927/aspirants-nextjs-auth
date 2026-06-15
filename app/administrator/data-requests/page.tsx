"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface DataRequest {
  id: string;
  type: string;
  status: string;
  message: string | null;
  response: string | null;
  dueAt: string;
  createdAt: string;
  resolvedAt: string | null;
  User: { name: string | null; email: string | null } | null;
}

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;

export default function AdminDataRequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/data-requests${qs}`);
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // Fetch the queue on mount and whenever the filter changes; state is set
    // inside load() after the await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function update(id: string, status: string, response?: string) {
    const res = await fetch(`/api/data-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, response }),
    });
    if (res.ok) load();
  }

  const isOverdue = (r: DataRequest) =>
    r.status !== "RESOLVED" && r.status !== "REJECTED" && new Date(r.dueAt) < new Date();

  const statusDotColor = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "bg-st-answered";
      case "IN_PROGRESS":
        return "bg-st-review";
      case "REJECTED":
        return "bg-redpen";
      default:
        return "bg-st-notvisited";
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Compliance</p>
          <h1 className="type-display text-2xl text-ink sm:text-3xl">Data requests</h1>
          <p className="text-sm text-pencil">DPDP data subject requests and their resolution status.</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="paper-sheet p-8 text-center text-sm text-pencil">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="paper-sheet p-8 text-center text-sm text-pencil">No requests yet.</div>
      ) : (
        <div className="paper-sheet overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rule">
              <tr className="type-data text-[11px] uppercase tracking-wider text-pencil">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-rule last:border-b-0 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.User?.name ?? "—"}</div>
                    <div className="type-data text-xs text-pencil">{r.User?.email ?? ""}</div>
                    {r.message && (
                      <div className="mt-1 max-w-xs break-words text-xs text-pencil">{r.message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-pencil">{r.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <span className="type-data inline-flex items-center gap-2 text-xs text-pencil">
                      <span className={`h-2 w-2 rounded-full ${statusDotColor(r.status)}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        isOverdue(r)
                          ? "type-data font-medium text-redpen"
                          : "type-data text-pencil"
                      }
                    >
                      {new Date(r.dueAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {r.status !== "IN_PROGRESS" && (
                        <Button variant="outline" size="sm" onClick={() => update(r.id, "IN_PROGRESS")}>
                          Start
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => update(r.id, "RESOLVED", "Resolved.")}>
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-redpen hover:text-redpen"
                        onClick={() => update(r.id, "REJECTED", "Rejected.")}
                      >
                        Reject
                      </Button>
                    </div>
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
