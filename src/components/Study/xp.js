import supabase from '../../supabaseClient';

export const BADGES = [
  { id: 'first_session', name: 'First session', hint: 'Finish any study session' },
  { id: 'week_streak', name: 'Week streak', hint: 'Study 7 days in a row' },
  { id: 'month_streak', name: 'Month streak', hint: 'Study 30 days in a row' },
  { id: 'goal', name: 'Daily goal', hint: 'Hit your daily card goal' },
  { id: 'quiz_100', name: 'Quiz 100', hint: 'Get 100 Quiz answers right' },
  { id: 'scholar', name: 'Scholar', hint: 'Reach 500 XP' },
  { id: 'first_share', name: 'First share', hint: 'Share a subject' },
  { id: 'publisher', name: 'Publisher', hint: 'Publish a deck to Discover' },
];

const XP_PER_CARD = 8;
const XP_CORRECT_BONUS = 4;

export function xpForSession({ cardsSeen = 0, correct = 0 } = {}) {
  return Math.max(0, Math.round(cardsSeen * XP_PER_CARD + correct * XP_CORRECT_BONUS));
}

export function badgeList(profile) {
  const earned = new Set(profile?.badges || []);
  return BADGES.map((badge) => ({ ...badge, earned: earned.has(badge.id) }));
}

function withBadge(profile, badgeId) {
  const current = Array.isArray(profile?.badges) ? profile.badges : [];
  if (current.includes(badgeId)) return { profile, added: null };
  return { profile: { ...profile, badges: [...current, badgeId] }, added: badgeId };
}

export function evaluateBadges(profile, extra = {}) {
  let next = profile;
  const unlocked = [];
  const tryUnlock = (id, ok) => {
    if (!ok) return;
    const result = withBadge(next, id);
    next = result.profile;
    if (result.added) unlocked.push(result.added);
  };

  tryUnlock('first_session', (next.study_minutes_total || 0) > 0 || (extra.cardsSeen || 0) > 0);
  tryUnlock('week_streak', (next.streak_best || 0) >= 7);
  tryUnlock('month_streak', (next.streak_best || 0) >= 30);
  tryUnlock('goal', (next.cards_studied_today || 0) >= (next.daily_goal || 20));
  tryUnlock('quiz_100', (next.quiz_correct_total || 0) >= 100);
  tryUnlock('scholar', (next.xp || 0) >= 500);
  if (extra.shared) tryUnlock('first_share', true);
  if (extra.published) tryUnlock('publisher', true);
  return { profile: next, unlocked };
}

export async function persistProfileProgress(profile, patch) {
  if (!profile?.id) return profile;
  const next = { ...profile, ...patch };
  const { data, error } = await supabase
    .from('profiles')
    .update({
      streak_current: next.streak_current,
      streak_best: next.streak_best,
      last_study_date: next.last_study_date,
      study_minutes_total: next.study_minutes_total,
      daily_goal: next.daily_goal ?? 20,
      cards_studied_today: next.cards_studied_today ?? 0,
      xp: next.xp ?? 0,
      quiz_correct_total: next.quiz_correct_total ?? 0,
      badges: next.badges ?? [],
    })
    .eq('id', profile.id)
    .select()
    .single();
  if (error) {
    console.error('persistProfileProgress', error);
    return next;
  }
  return data;
}

export async function unlockBadge(profile, setProfile, badgeId) {
  if (!profile?.id || !badgeId) return profile;
  const { profile: next, added } = withBadge(profile, badgeId);
  if (!added) return profile;
  const saved = await persistProfileProgress(profile, { badges: next.badges });
  if (typeof setProfile === 'function') setProfile(saved);
  return saved;
}

export async function saveDailyGoal(profile, setProfile, dailyGoal) {
  const goal = Math.min(200, Math.max(5, Number(dailyGoal) || 20));
  const saved = await persistProfileProgress(profile, { daily_goal: goal });
  if (typeof setProfile === 'function') setProfile(saved);
  return saved;
}
