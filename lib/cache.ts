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
// In-flight productions, keyed the same as `store`, so a burst on a cold key
// awaits one shared produce() (single-flight) instead of stampeding the DB.
const inflight = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 500;

export async function cached<T>(
  key: string,
  ttlMs: number,
  produce: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as T;

  // Coalesce concurrent misses on the same cold key onto one produce() call.
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const value = await produce();

    // Evict the oldest entry when full (simple FIFO is enough here).
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
    store.set(key, { value, expires: Date.now() + ttlMs });
    return value;
  })();

  // Track the in-flight promise so siblings join it; always clear it once
  // settled so a rejection can be retried and resolved values don't pin memory.
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}
