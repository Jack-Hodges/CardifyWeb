import { fetchCards } from '../Card/CardManipulation';
import { isDue, srsFromCard } from './sm2';
import { applyPersonalSrs } from './studyApi';

export async function fetchMixedReview(userId, subjects, { limit = 40 } = {}) {
  const usable = (subjects || []).filter(
    (subject) => !subject?.deleted_at && (subject.flashcard_count || 0) > 0
  );
  const decks = await Promise.all(
    usable.slice(0, 24).map((subject) => fetchCards(subject.id, { limit: 80 }))
  );
  let cards = decks.flat().filter(Boolean);
  cards = await applyPersonalSrs(userId, cards);
  const names = new Map(usable.map((subject) => [String(subject.id), subject.name]));
  cards = cards.map((card) => ({
    ...card,
    _subjectName: names.get(String(card.subject_id)) || '',
  }));
  const due = cards.filter((card) => isDue(srsFromCard(card)));
  const pool = (due.length > 0 ? due : cards).sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.max(1, limit));
}
