// Tiny TTL + in-flight dedupe helper for Supabase read calls.
// Keeps cache scope module-local so it resets on full reload.

const cache = new Map(); // key -> { expiresAt, value }
const inFlight = new Map(); // key -> Promise<value>

export async function cachedAsync(key, fn, ttlMs = 20_000) {
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const value = await fn();
    cache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  })();

  inFlight.set(key, p);

  try {
    return await p;
  } finally {
    inFlight.delete(key);
  }
}

