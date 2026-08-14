import { useRef } from 'react';
import { useUser } from '../UserContext';
import { startStudySession, endStudySession, recordStudyActivity } from '../components/Study/studyApi';

export default function useGameStudySession(mode) {
  const { user, profile, setProfile } = useUser();
  const sessionIdRef = useRef(null);
  const startedAtRef = useRef(null);
  const recordedRef = useRef(false);

  const begin = async (subjectId) => {
    recordedRef.current = false;
    startedAtRef.current = Date.now();
    sessionIdRef.current = null;
    if (!user?.id) return;
    const session = await startStudySession(user.id, subjectId || null, mode);
    sessionIdRef.current = session?.id || null;
  };

  const finish = async (stats = {}) => {
    if (recordedRef.current) return 0;
    recordedRef.current = true;
    const durationSec = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : stats.duration_sec || 0;
    await endStudySession(sessionIdRef.current, {
      correct: stats.correct || 0,
      incorrect: stats.incorrect || 0,
      cards_seen: stats.cards_seen || 0,
      weak_card_ids: stats.weak_card_ids || [],
      duration_sec: durationSec,
    });
    if (profile) {
      const updated = await recordStudyActivity(profile, durationSec, {
        cardsSeen: stats.cards_seen || 0,
        correct: stats.correct || 0,
        mode,
      });
      if (updated && setProfile) setProfile(updated);
    }
    return durationSec;
  };

  return { begin, finish, startedAtRef };
}
