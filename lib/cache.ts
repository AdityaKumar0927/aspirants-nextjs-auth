/**
 * Tiny in-memory TTL cache with bounded size.
 *
 * Used to absorb repeated heavy aggregation queries on public (guest-browsable)
 * facet endpoints so a burst of requests can't translate into a burst of
 * full-table scans. Per-instance only (fine on serverless: it caps load on each
 * warm instance); not a correctness-critical store.
 */
type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 500;

export async function cached<T>(
  key: string,
  ttlMs: number,
  produce: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as T;

  const value = await produce();

  // Evict the oldest entry when full (simple FIFO is enough here).
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: now + ttlMs });
  return value;
}
