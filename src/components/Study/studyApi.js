import supabase from '../../supabaseClient';
import { createDefaultSrs, sm2Update, srsFromCard } from './sm2';

export async function upsertCardSrs(cardId, quality, existing) {
  const next = sm2Update(existing || createDefaultSrs(), quality);
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
  const { data, error } = await supabase
    .from('study_sessions')
    .upsert(
      {
        user_id: userId,
        subject_id: subjectId,
        mode,
        started_at: now,
        ended_at: null,
        correct: 0,
        incorrect: 0,
        cards_seen: 0,
        duration_sec: 0,
        weak_card_ids: [],
      },
      { onConflict: 'user_id,subject_id,mode' }
    )
    .select()
    .single();
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

export async function recordStudyActivity(profile, durationSec = 0) {
  if (!profile?.id) return profile;
  const today = dateKey();
  const last = profile.last_study_date;
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

  const { data, error } = await supabase
    .from('profiles')
    .update({
      streak_current: streak,
      streak_best: best,
      last_study_date: today,
      study_minutes_total: minutes,
    })
    .eq('id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('recordStudyActivity', error);
    return {
      ...profile,
      streak_current: streak,
      streak_best: best,
      last_study_date: today,
      study_minutes_total: minutes,
    };
  }
  return data;
}
