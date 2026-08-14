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
    .select('id, pro, unlimited, generation_count')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export function generationDailyLimit(profile) {
  return profile?.pro || profile?.unlimited ? 60 : 20;
}

/** Atomically consume generation quota. Throws { status: 403 } when over the cap. */
export async function consumeGenerationQuota(admin, userId, amount) {
  const profile = await getProfileGenerationState(admin, userId);
  const dailyLimit = generationDailyLimit(profile);
  const used = profile.generation_count || 0;
  if (used + amount > dailyLimit) {
    const err = new Error(
      `Daily limit exceeded. You can generate ${Math.max(0, dailyLimit - used)} more cards today.`
    );
    err.status = 403;
    throw err;
  }

  let query = admin
    .from('profiles')
    .update({ generation_count: used + amount })
    .eq('id', userId);

  if (profile.generation_count == null) {
    query = query.is('generation_count', null);
  } else {
    query = query.eq('generation_count', used);
  }

  const { data, error } = await query.select('generation_count').maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error('Daily limit exceeded. Please try again.');
    err.status = 403;
    throw err;
  }
  return data.generation_count;
}
