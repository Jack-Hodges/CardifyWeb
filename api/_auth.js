import { createClient } from '@supabase/supabase-js';

const rateBuckets = new Map();

export function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin credentials are not configured');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verify Bearer JWT and return user; throws/returns null on failure. */
export async function requireUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return { error: 'Missing Authorization bearer token', status: 401 };
  }

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Invalid or expired token', status: 401 };
  }
  return { user: data.user, admin };
}

/** Simple sliding-window rate limit per key (e.g. user id or IP). */
export function rateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return false;
  }
  return true;
}

export async function getProfileGenerationState(admin, userId) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, pro, generation_count')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}
