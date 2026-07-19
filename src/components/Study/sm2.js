/**
 * SM-2 spaced repetition (simplified Anki-style).
 * quality: 0 Again, 1 Hard, 2 Good, 3 Easy
 */
export function createDefaultSrs() {
  return {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    due_at: new Date().toISOString(),
    last_reviewed_at: null,
    last_quality: null,
  };
}

/** Read SM-2 fields from a flashcard row */
export function srsFromCard(card) {
  if (!card) return createDefaultSrs();
  return {
    ease: card.srs_ease ?? 2.5,
    interval: card.srs_interval ?? 0,
    repetitions: card.srs_repetitions ?? 0,
    due_at: card.srs_due_at || new Date().toISOString(),
    last_reviewed_at: card.srs_last_reviewed_at ?? null,
    last_quality: card.srs_last_quality ?? null,
  };
}

export function sm2Update(srs, quality) {
  const prev = { ...createDefaultSrs(), ...srs };
  let { ease, interval, repetitions } = prev;
  const now = new Date();

  if (quality < 2) {
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = quality === 3 ? 2 : 1;
    } else if (repetitions === 1) {
      interval = quality === 3 ? 6 : 3;
    } else {
      const hardFactor = quality === 1 ? 1.2 : quality === 3 ? 1.3 : 1;
      interval = Math.max(1, Math.round(interval * ease * hardFactor));
    }
    repetitions += 1;
  }

  // Ease adjustment (mapped from 0-3 quality)
  const q = quality === 0 ? 1 : quality === 1 ? 3 : quality === 2 ? 4 : 5;
  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const due = new Date(now);
  if (interval <= 0) {
    due.setMinutes(due.getMinutes() + 10);
  } else {
    due.setDate(due.getDate() + interval);
  }

  return {
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    due_at: due.toISOString(),
    last_reviewed_at: now.toISOString(),
    last_quality: quality,
  };
}

export function isDue(srs, now = new Date()) {
  if (!srs?.due_at) return true;
  return new Date(srs.due_at) <= now;
}

/** Bucket for SM-2 session filters */
export function srsFilterBucket(srsOrCard) {
  const srs =
    srsOrCard && ('srs_ease' in srsOrCard || 'srs_last_reviewed_at' in srsOrCard)
      ? srsFromCard(srsOrCard)
      : srsOrCard || createDefaultSrs();
  if (!srs?.last_reviewed_at) return 'new';
  if (srs.last_quality === 0) return 'again';
  if (srs.last_quality === 1) return 'hard';
  if (srs.last_quality === 2) return 'good';
  if (srs.last_quality === 3) return 'easy';
  if (srs.interval === 0 || srs.repetitions === 0) return 'again';
  return 'good';
}
