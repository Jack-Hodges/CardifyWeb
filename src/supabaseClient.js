// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Lightweight RPC caching/deduping to avoid duplicate network calls.
// This is intentionally small + TTL-based so it doesn't hide real changes for long.
const RPC_CACHE_TTL_MS = 30_000;
const rpcCache = new Map(); // key -> { expiresAt, value }
const rpcInFlight = new Map(); // key -> Promise<{data,error}>

const READ_ONLY_RPCS = new Set([
  'list_discover_subjects',
  'get_discover_subject',
  'get_public_subject_by_token',
]);

const stableStringify = (value) => {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
};

const originalRpc = supabase.rpc.bind(supabase);
supabase.rpc = async (fn, params) => {
  if (!READ_ONLY_RPCS.has(fn)) {
    return originalRpc(fn, params);
  }

  const key = `${fn}:${stableStringify(params)}`;
  const now = Date.now();

  const cached = rpcCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const inFlight = rpcInFlight.get(key);
  if (inFlight) return inFlight;

  const p = originalRpc(fn, params).then((res) => {
    rpcInFlight.delete(key);
    // Cache only successful reads (no error).
    if (!res?.error) {
      rpcCache.set(key, { expiresAt: Date.now() + RPC_CACHE_TTL_MS, value: res });
    }
    return res;
  });

  rpcInFlight.set(key, p);
  return p;
};

export default supabase