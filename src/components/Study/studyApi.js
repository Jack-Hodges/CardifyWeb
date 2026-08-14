import supabase from '../../supabaseClient';
import { createDefaultSrs, sm2Update, srsFromCard } from './sm2';
import { evaluateBadges, persistProfileProgress, xpForSession } from './xp';

function usesPersonalSrs(card, userId) {
  if (!card || !userId) return false;
  if (card._personalSrs) return true;
  return Boolean(card.user_id) && String(card.user_id) !== String(userId);
}

export async function applyPersonalSrs(userId, cards) {
  if (!userId || !cards?.length) return cards;
  const personalIds = cards.filter((card) => usesPersonalSrs(card, userId)).map((card) => card.id);
  if (personalIds.length === 0) return cards;
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .in('flashcard_id', personalIds);
  if (error) {
    console.error('applyPersonalSrs', error);
    return cards.map((card) =>
      usesPersonalSrs(card, userId) ? { ...card, _personalSrs: true } : card
    );
  }
  const byId = new Map((data || []).map((row) => [row.flashcard_id, row]));
  return cards.map((card) => {
    if (!usesPersonalSrs(card, userId)) return card;
    const row = byId.get(card.id);
    if (!row) {
      return { ...card, _personalSrs: true, srs_due_at: new Date().toISOString(), srs_last_reviewed_at: null };
    }
    return {
      ...card,
      _personalSrs: true,
      srs_ease: row.srs_ease,
      srs_interval: row.srs_interval,
      srs_repetitions: row.srs_repetitions,
      srs_due_at: row.srs_due_at,
      srs_last_reviewed_at: row.srs_last_reviewed_at,
      srs_last_quality: row.srs_last_quality,
    };
  });
}

export async function upsertCardSrs(cardId, quality, existing, userId) {
  const next = sm2Update(existing || createDefaultSrs(), quality);
  const personal = usesPersonalSrs(existing, userId) || Boolean(existing?._personalSrs);

  if (personal && userId) {
    const { data, error } = await supabase
      .from('card_progress')
      .upsert(
        {
          user_id: userId,
          flashcard_id: cardId,
          srs_ease: next.ease,
          srs_interval: next.interval,
          srs_repetitions: next.repetitions,
          srs_due_at: next.due_at,
          srs_last_reviewed_at: next.last_reviewed_at,
          srs_last_quality: next.last_quality,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,flashcard_id' }
      )
      .select()
      .single();
    if (error) {
      console.error('upsertCardSrs personal', error);
      return { ...srsFromCard({}), ...next, _personalSrs: true };
    }
    return { ...data, _personalSrs: true };
  }

  const { data, error } = await supabase
    .from('flashcards')
    .update({
      srs_ease: next.ease,
      srs_interval: next.interval,
      srs_repetitions: next.repetitions,
      srs_due_at: next.due_at,
      srs_last_reviewed_at: next.last_reviewed_at,
      srs_last_quality: next.last_quality,
    })
    .eq('id', cardId)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    console.error('upsertCardSrs', error);
    return { ...srsFromCard({}), ...next };
  }
  return data;
}

export async function startStudySession(userId, subjectId, mode = 'practice') {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    subject_id: subjectId || null,
    mode,
    started_at: now,
    ended_at: null,
    correct: 0,
    incorrect: 0,
    cards_seen: 0,
    duration_sec: 0,
    weak_card_ids: [],
  };
  const query = subjectId
    ? supabase.from('study_sessions').upsert(row, { onConflict: 'user_id,subject_id,mode' })
    : supabase.from('study_sessions').insert(row);
  const { data, error } = await query.select().single();
  if (error) {
    console.error('startStudySession', error);
    return null;
  }
  return data;
}

export async function endStudySession(sessionId, stats) {
  if (!sessionId) return null;
  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      ended_at: new Date().toISOString(),
      correct: stats.correct || 0,
      incorrect: stats.incorrect || 0,
      cards_seen: stats.cards_seen || 0,
      duration_sec: stats.duration_sec || 0,
      weak_card_ids: stats.weak_card_ids || [],
    })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) console.error('endStudySession', error);
  return data;
}

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function recordStudyActivity(profile, durationSec = 0, extra = {}) {
  if (!profile?.id) return profile;
  const today = dateKey();
  const last = profile.last_study_date ? String(profile.last_study_date).slice(0, 10) : null;
  let streak = profile.streak_current || 0;

  if (last === today) {
    // same day — keep streak
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (last === dateKey(yesterday)) streak += 1;
    else streak = 1;
  }

  const best = Math.max(profile.streak_best || 0, streak);
  const minutes = (profile.study_minutes_total || 0) + Math.round((durationSec || 0) / 60);
  const cardsSeen = Number(extra.cardsSeen) || 0;
  const studiedToday =
    last === today ? (profile.cards_studied_today || 0) + cardsSeen : cardsSeen;
  const xp = (profile.xp || 0) + xpForSession({ cardsSeen, correct: extra.correct || 0 });
  const quizCorrect =
    extra.mode === 'quiz'
      ? (profile.quiz_correct_total || 0) + (Number(extra.correct) || 0)
      : profile.quiz_correct_total || 0;

  const evaluated = evaluateBadges(
    {
      ...profile,
      streak_current: streak,
      streak_best: best,
      last_study_date: today,
      study_minutes_total: minutes,
      cards_studied_today: studiedToday,
      xp,
      quiz_correct_total: quizCorrect,
    },
    { cardsSeen }
  );

  return persistProfileProgress(profile, {
    streak_current: evaluated.profile.streak_current,
    streak_best: evaluated.profile.streak_best,
    last_study_date: evaluated.profile.last_study_date,
    study_minutes_total: evaluated.profile.study_minutes_total,
    cards_studied_today: evaluated.profile.cards_studied_today,
    xp: evaluated.profile.xp,
    quiz_correct_total: evaluated.profile.quiz_correct_total,
    badges: evaluated.profile.badges,
    daily_goal: profile.daily_goal ?? 20,
  });
}
