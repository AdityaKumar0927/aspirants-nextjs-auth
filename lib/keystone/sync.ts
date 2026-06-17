/**
 * Keystone — optional cloud sync for the shelf.
 *
 * The shelf works fully offline (localStorage). When the student is SIGNED IN,
 * these helpers mirror it to /api/keystone so it follows them across devices.
 * Auth is detected from the API itself: GET returns 401 for guests. Every call
 * fails SOFT — a network/permission error never breaks the local experience,
 * and if the DB table isn't migrated yet the feature simply stays local-only.
 */
import type { KLibraryItem } from "@/lib/keystone/storage";

export async function fetchRemoteItems(): Promise<{ signedIn: boolean; items: KLibraryItem[] }> {
  try {
    const res = await fetch("/api/keystone", { cache: "no-store" });
    if (!res.ok) return { signedIn: false, items: [] }; // 401 guest, or table not migrated
    const data = await res.json();
    return { signedIn: true, items: Array.isArray(data.items) ? (data.items as KLibraryItem[]) : [] };
  } catch {
    return { signedIn: false, items: [] };
  }
}

export async function pushRemoteItem(item: KLibraryItem): Promise<void> {
  try {
    await fetch("/api/keystone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    /* offline / blocked — the local copy is still saved */
  }
}

export async function deleteRemoteItem(id: string): Promise<void> {
  try {
    await fetch(`/api/keystone/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {
    /* ignore */
  }
}
