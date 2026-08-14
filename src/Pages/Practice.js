import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCards, sortCardsById } from '../components/Card/CardManipulation';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import TitleBar from '../components/Navigation/TitleBar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../UserContext';
import SubjectList from '../components/Subject/SubjectList';
import { fetchSubjects, saveSubjectProgress, TUTORIAL_SUBJECT_ID } from '../components/Subject/SubjectManipulation';
import NoSelectionModal from '../components/Modals/NoSelectionModal';
import PageEmptyState from '../components/Elements/PageEmptyState';
import SessionSummary from '../components/Study/SessionSummary';
import {
  upsertCardSrs,
  startStudySession,
  endStudySession,
  recordStudyActivity,
  applyPersonalSrs,
} from '../components/Study/studyApi';
import { fetchMixedReview } from '../components/Study/mixedReview';
import { isDue, srsFromCard, srsFilterBucket } from '../components/Study/sm2';
import { playableCard } from '../components/Study/gradeAnswer';
import useSubjectFromRoute from '../hooks/useSubjectFromRoute';
import { Helmet } from 'react-helmet-async';
import BackgroundButton from '../components/Elements/BackgroundButton';
import TickSelector from '../components/Elements/TickSelector';
import { CirclePlay, Share2 } from 'lucide-react';
import SpotlightTour from '../components/Tutorial/SpotlightTour';
import usePageTour from '../components/Tutorial/usePageTour';
import { PRACTICE_STEPS } from '../components/Tutorial/tourSteps';
import { getThemeBackgroundStyle } from '../components/Functions/getTheme';
import ShareSubjectModal from '../components/Modals/ShareSubjectModal';
import PracticeModeMenu, { goToPracticeMode, PRACTICE_MODE_OPTIONS } from '../components/Study/PracticeModeMenu';
import GameSettings, { SettingToggle } from '../components/Games/GameSettings';

const GRADE_LABELS = [
  { q: 0, label: 'Again', color: 'bg-red-500 hover:bg-red-400' },
  { q: 1, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-400' },
  { q: 2, label: 'Good', color: 'bg-green-500 hover:bg-green-400' },
  { q: 3, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-400' },
];

const SRS_FILTERS = [
  { id: 'new', label: 'New' },
  { id: 'again', label: 'Again' },
  { id: 'hard', label: 'Hard' },
  { id: 'good', label: 'Good' },
  { id: 'easy', label: 'Easy' },
];

const DEFAULT_SRS_FILTERS = {
  new: true,
  again: true,
  hard: true,
  good: true,
  easy: true,
};

const PAGE_SIZE = 100;
const MIXED_MAX_CARDS = 80;

function shuffleCards(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function initialPracticeMode(location) {
  if (location.pathname === '/review' || location.state?.mixed) return 'mixed';
  if (location.state?.practiceMode === 'srs') return 'srs';
  return 'classic';
}

function PracticeModePicker({ mode, onChange, primaryColor, labelTone, shadow }) {
  const selected = PRACTICE_MODE_OPTIONS.find((option) => option.id === mode);
  return (
    <div className="w-full max-w-md mx-auto mb-4 px-1 sm:px-0" data-tour="practice-mode">
      <p className={`text-sm font-bold mb-2 ${labelTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
        Mode
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {PRACTICE_MODE_OPTIONS.map((option) => {
          const active = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold background-shadow-new background-hover
                ${active
                  ? `${primaryColor?.bgClass || 'bg-green-500'} text-white`
                  : 'bg-white text-gray-800'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {selected?.hint ? (
        <p className={`text-sm font-semibold opacity-80 ${labelTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
          {selected.hint}
        </p>
      ) : null}
    </div>
  );
}

function Practice() {
  const { subject, loadingSubject } = useSubjectFromRoute();
  const { user, getUser, theme, profile, setProfile } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const mixed = location.pathname === '/review' || Boolean(location.state?.mixed);
  const autoStartMixed = Boolean(location.state?.autoStart);
  const routeRetryIds = location.state?.retryCardIds;

  const [cards, setCards] = useState([]);
  const cardsRef = useRef(cards);
  const [queue, setQueue] = useState([]);
  const queueRef = useRef(queue);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(() => !(mixed && !autoStartMixed));
  const [animateFlip] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [mode, setMode] = useState(() => initialPracticeMode(location));
  const [srsFilters, setSrsFilters] = useState(DEFAULT_SRS_FILTERS);
  const [started, setStarted] = useState(false);
  const [cardCount, setCardCount] = useState(
    typeof location.state?.cardCount === 'number' ? location.state.cardCount : 40
  );
  const [shuffleOn, setShuffleOn] = useState(location.state?.shuffle !== false);
  const [retryFocusIds, setRetryFocusIds] = useState(() =>
    Array.isArray(routeRetryIds) ? routeRetryIds : []
  );
  const [sessionId, setSessionId] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    cards_seen: 0,
    weak_card_ids: [],
    duration_sec: 0,
  });
  const [finished, setFinished] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const [loadingMoreCards, setLoadingMoreCards] = useState(false);
  const [reverse, setReverse] = useState(Boolean(location.state?.reverse));

  const { primaryColor, textClass, shadow } = theme;
  const labelTone = textClass || 'textColor';

  const canShareSubject =
    subject &&
    !subject.permission &&
    subject.id !== TUTORIAL_SUBJECT_ID;

  const tour = usePageTour({
    key: 'practice_popup',
    steps: PRACTICE_STEPS,
    ready: !loading && !loadingSubject,
  });

  const currentCardIndexRef = useRef(0);
  const cardsLengthRef = useRef(0);
  const statsRef = useRef(stats);
  const sessionIdRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const finishedRef = useRef(false);
  const loadedKeyRef = useRef(null);
  const modeRef = useRef(mode);
  const subjectRef = useRef(subject);
  const userRef = useRef(user);
  const cardsOffsetRef = useRef(0);
  const hasMoreCardsRef = useRef(true);
  const loadingMoreCardsRef = useRef(false);
  const srsFiltersRef = useRef(srsFilters);
  const startedRef = useRef(false);
  const sessionLimitedRef = useRef(false);
  const subjectId = subject?.id;
  const userId = user?.id;

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentCardIndexRef.current = currentCardIndex;
  }, [currentCardIndex]);
  useEffect(() => {
    cardsLengthRef.current = queue.length || cards.length;
  }, [queue, cards]);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  useEffect(() => {
    sessionStartedAtRef.current = sessionStartedAt;
  }, [sessionStartedAt]);
  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    subjectRef.current = subject;
  }, [subject]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    hasMoreCardsRef.current = hasMoreCards;
  }, [hasMoreCards]);
  useEffect(() => {
    loadingMoreCardsRef.current = loadingMoreCards;
  }, [loadingMoreCards]);
  useEffect(() => {
    srsFiltersRef.current = srsFilters;
  }, [srsFilters]);
  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const persistClassicProgress = useCallback(async (index, total, { clear = false } = {}) => {
    const subj = subjectRef.current;
    const u = userRef.current;
    if (!subj?.id || !u?.id) return;
    // Skip shared decks; if user_id missing from route state, still try (RLS enforces ownership)
    if (subj.user_id != null && String(subj.user_id) !== String(u.id)) return;
    // Don't overwrite a completed/cleared session (e.g. unmount after finish)
    if (!clear && finishedRef.current) return;
    if (modeRef.current !== 'classic' && !clear) return;

    let upToIndex = null;
    if (!clear) {
      // Any card past the first counts as in-progress (including the last before finish)
      if (total > 1 && index > 0) {
        upToIndex = index;
      } else {
        return;
      }
    }

    await saveSubjectProgress(subj.id, upToIndex);
  }, []);

  const finalizeSession = useCallback(
    async (finalStats) => {
      const started = sessionStartedAtRef.current;
      const durationSec = started ? Math.round((Date.now() - started) / 1000) : 0;
      const payload = { ...finalStats, duration_sec: durationSec };
      await endStudySession(sessionIdRef.current, payload);
      if (profile) {
        const updated = await recordStudyActivity(profile, durationSec, {
          cardsSeen: payload.cards_seen || 0,
          correct: payload.correct || 0,
          mode: mixed ? 'mixed' : modeRef.current,
        });
        if (updated && setProfile) setProfile(updated);
      }
      return durationSec;
    },
    [profile, setProfile, mixed]
  );

  useEffect(() => {
    if (
      !started &&
      !loading &&
      cards.length > 0 &&
      subject &&
      subject.up_to_index != null &&
      user &&
      String(subject.user_id) === String(user.id) &&
      mode === 'classic'
    ) {
      setIsModalOpen(true);
    } else if (started || mode !== 'classic') {
      setIsModalOpen(false);
    }
  }, [subjectId, mode, started, loading, cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildQueue = useCallback((deck, practiceMode, filters) => {
    if (practiceMode !== 'srs') return deck;

    const active = SRS_FILTERS.filter((f) => filters[f.id]).map((f) => f.id);
    if (active.length === 0) return [];

    let pool = deck.filter((c) => active.includes(srsFilterBucket(c)));
    const due = pool.filter((c) => isDue(srsFromCard(c)));
    return due.length > 0 ? due : pool;
  }, []);

  const beginSession = useCallback(
    async (deck, practiceMode, filters, options = {}) => {
      let ordered = buildQueue(deck, practiceMode, filters);
      if (options.shuffle) ordered = shuffleCards(ordered);
      if (options.limit && ordered.length > options.limit) {
        ordered = ordered.slice(0, options.limit);
        sessionLimitedRef.current = true;
      } else {
        sessionLimitedRef.current = Boolean(options.limit && options.limit < (deck?.length || 0));
      }
      setQueue(ordered);
      setCurrentCardIndex(0);
      setFlipped(false);
      setFinished(false);
      finishedRef.current = false;
      setStats({ correct: 0, incorrect: 0, cards_seen: 0, weak_card_ids: [], duration_sec: 0 });
      statsRef.current = { correct: 0, incorrect: 0, cards_seen: 0, weak_card_ids: [], duration_sec: 0 };

      if (!userId || (!subjectId && !mixed)) return;
      const session = await startStudySession(
        userId,
        subjectId || null,
        mixed ? 'mixed' : practiceMode === 'srs' ? 'practice_srs' : 'practice'
      );
      setSessionId(session?.id || null);
      setSessionStartedAt(Date.now());
    },
    [buildQueue, userId, subjectId, mixed]
  );

  const loadMoreCards = useCallback(async () => {
    if (!subjectId) return false;
    if (sessionLimitedRef.current) return false;
    if (loadingMoreCardsRef.current || !hasMoreCardsRef.current) return false;

    const offset = cardsOffsetRef.current;
    if (offset == null) return false;

    setLoadingMoreCards(true);
    loadingMoreCardsRef.current = true;

    const more = await fetchCards(subjectId, { limit: PAGE_SIZE, offset });
    sortCardsById(more);

    if (!more?.length) {
      setHasMoreCards(false);
      hasMoreCardsRef.current = false;
      setLoadingMoreCards(false);
      loadingMoreCardsRef.current = false;
      return false;
    }

    setCards((prev) => [...prev, ...more]);

    const nextOffset = offset + more.length;
    cardsOffsetRef.current = nextOffset;

    const nextHasMore = more.length === PAGE_SIZE;
    setHasMoreCards(nextHasMore);
    hasMoreCardsRef.current = nextHasMore;

    // Keep queue + activeCards consistent with the current mode.
    if (modeRef.current === 'srs') {
      const currentCardId = queueRef.current[currentCardIndexRef.current]?.id;
      const nextDeck = [...cardsRef.current, ...more];
      const ordered = buildQueue(nextDeck, 'srs', srsFiltersRef.current);
      setQueue(ordered);

      const nextIndex = currentCardId ? ordered.findIndex((c) => c.id === currentCardId) : 0;
      setCurrentCardIndex(nextIndex >= 0 ? nextIndex : 0);
    } else {
      // Classic mode: queue === deck (buildQueue returns deck for non-srs)
      setQueue((prev) => [...prev, ...more]);
    }

    setLoadingMoreCards(false);
    loadingMoreCardsRef.current = false;
    return true;
  }, [buildQueue, subjectId]);

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }
    if (!mixed && (loadingSubject || !subjectId)) {
      if (!subjectId && !loadingSubject) {
        setCards([]);
        setQueue([]);
        setStarted(false);
        setLoading(false);
      }
      return;
    }

    // Mixed settings: wait for Start unless this navigation already confirmed Start.
    if (mixed && !autoStartMixed) {
      if (!startedRef.current) {
        setStarted(false);
        setLoading(false);
      }
      return;
    }

    const retryKey = Array.isArray(routeRetryIds) ? routeRetryIds.join(',') : '';
    const key = mixed ? `${userId}:mixed:${cardCount}` : `${userId}:${subjectId}:${retryKey}`;
    if (loadedKeyRef.current === key) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setStarted(false);
      setFinished(false);
      let deck = [];
      let hasMore = false;
      if (mixed) {
        const requested = typeof location.state?.cardCount === 'number' ? location.state.cardCount : cardCount || 40;
        const limit = Math.min(Math.max(1, requested), MIXED_MAX_CARDS);
        const subjects = await fetchSubjects(user, profile);
        deck = await fetchMixedReview(userId, subjects, { limit });
        if (location.state?.shuffle !== false) deck = shuffleCards(deck);
        setMode('srs');
      } else {
        const data = await fetchCards(subjectId, { limit: PAGE_SIZE, offset: 0 });
        sortCardsById(data);
        deck = await applyPersonalSrs(userId, data);
        hasMore = data.length === PAGE_SIZE;
        let nextOffset = data.length;

        const upToIndex = subject?.up_to_index;
        const shouldPrefetch =
          mode === 'classic' &&
          upToIndex != null &&
          Number.isFinite(upToIndex) &&
          upToIndex >= deck.length &&
          String(subject?.user_id ?? '') === String(userId);

        if (shouldPrefetch) {
          const targetCount = upToIndex + 1;
          while (deck.length < targetCount && hasMore) {
            const more = await fetchCards(subjectId, { limit: PAGE_SIZE, offset: nextOffset });
            sortCardsById(more);
            if (!more?.length) {
              hasMore = false;
              break;
            }
            deck = await applyPersonalSrs(userId, [...deck, ...more]);
            nextOffset += more.length;
            hasMore = more.length === PAGE_SIZE;
          }
        }
      }

      if (cancelled) return;
      if (Array.isArray(routeRetryIds) && routeRetryIds.length) {
        const retrySet = new Set(routeRetryIds.map(String));
        const filtered = deck.filter((card) => retrySet.has(String(card.id)));
        if (filtered.length) deck = filtered;
        setMode('srs');
        setRetryFocusIds(routeRetryIds);
      }

      setCards(deck);
      if (!mixed) setCardCount(Math.max(1, deck.length || 1));
      loadedKeyRef.current = key;
      cardsOffsetRef.current = deck.length;
      setHasMoreCards(hasMore);
      hasMoreCardsRef.current = hasMore;

      if (mixed && autoStartMixed) {
        const requested = typeof location.state?.cardCount === 'number' ? location.state.cardCount : cardCount;
        const limit = Math.min(Math.max(1, requested || 40), MIXED_MAX_CARDS);
        await beginSession(deck, 'srs', srsFilters, { limit });
        setStarted(true);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      if (startedRef.current && !finishedRef.current && !mixed) {
        persistClassicProgress(currentCardIndexRef.current, cardsLengthRef.current);
      }
    };
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [subjectId, userId, loadingSubject, mixed, autoStartMixed]);

  // Keep Home "In Progress" updated while studying classic
  useEffect(() => {
    if (!started || loading || finished || mode !== 'classic') return;
    if (!cards.length) return;
    persistClassicProgress(currentCardIndex, queue.length || cards.length);
  }, [started, currentCardIndex, mode, loading, finished, cards.length, queue.length, persistClassicProgress]);

  const applyMode = async (nextMode) => {
    if (nextMode === 'mixed' || nextMode === 'learn' || nextMode === 'true') {
      goToPracticeMode(navigate, nextMode, subject);
      return;
    }
    if (mixed) {
      goToPracticeMode(navigate, nextMode, subject);
      return;
    }
    if (!subject?.id) {
      setIsSubjectListModalOpen(true);
      return;
    }
    if (nextMode === mode) return;
    if (mode === 'classic') {
      persistClassicProgress(currentCardIndexRef.current, cardsLengthRef.current);
    }
    setMode(nextMode);
    await beginSession(cards, nextMode, srsFilters);
  };

  const toggleSrsFilter = (id) => {
    setSrsFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applySrsFilters = async () => {
    await beginSession(cards, 'srs', srsFilters);
  };

  const focusDeck = (deck) => {
    if (!Array.isArray(retryFocusIds) || !retryFocusIds.length) return deck;
    const retrySet = new Set(retryFocusIds.map(String));
    const filtered = deck.filter((card) => retrySet.has(String(card.id)));
    return filtered.length ? filtered : deck;
  };

  const chooseStartMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'mixed') {
      setCardCount((n) => Math.min(Math.max(1, n), MIXED_MAX_CARDS));
    }
  };

  const handleStart = async () => {
    if (mode === 'learn' || mode === 'true') {
      if (!subject?.id) {
        setIsSubjectListModalOpen(true);
        return;
      }
      goToPracticeMode(navigate, mode, subject, {
        autoStart: true,
        reverse,
        shuffle: shuffleOn,
        cardCount,
      });
      return;
    }

    if (mode === 'mixed' && !mixed) {
      navigate('/review', {
        state: {
          mixed: true,
          autoStart: true,
          reverse,
          shuffle: shuffleOn,
          cardCount: Math.min(Math.max(1, cardCount), MIXED_MAX_CARDS),
        },
      });
      return;
    }

    if (mode === 'mixed' && mixed) {
      const limit = Math.min(Math.max(1, cardCount), MIXED_MAX_CARDS);
      setLoading(true);
      const subjects = await fetchSubjects(user, profile);
      let deck = await fetchMixedReview(userId, subjects, { limit });
      deck = focusDeck(deck);
      if (shuffleOn) deck = shuffleCards(deck);
      setCards(deck);
      setMode('srs');
      await beginSession(deck, 'srs', srsFilters, { limit });
      setRetryFocusIds([]);
      setStarted(true);
      setLoading(false);
      return;
    }

    if (!subject?.id) {
      setIsSubjectListModalOpen(true);
      return;
    }

    const deck = focusDeck(cards);
    await beginSession(deck, mode, srsFilters, {
      shuffle: mode === 'classic' && shuffleOn,
      limit: cardCount < deck.length ? cardCount : undefined,
    });
    setRetryFocusIds([]);
    setStarted(true);
  };

  const activeCards = queue.length ? queue : mode === 'classic' ? cards : [];
  const currentCard = activeCards[currentCardIndex];

  const completeSession = async (finalStats) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (mode === 'classic') {
      // Await clear so unmount / navigation can't race and re-save progress
      await persistClassicProgress(0, 0, { clear: true });
    }
    const durationSec = await finalizeSession(finalStats || statsRef.current);
    setStats((s) => ({ ...(finalStats || s), duration_sec: durationSec }));

    // Session summary is SM-2 only; classic just wraps up and returns home
    if (mode === 'srs') {
      setFinished(true);
    } else {
      navigate('/home');
    }
  };

  const handleNextCard = () => {
    if (mode === 'srs') return;
    const go = () => {
      if (currentCardIndex < activeCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        return;
      }

      // End of loaded page: attempt to load the next page.
      (async () => {
        const loaded = await loadMoreCards();
        if (loaded) setCurrentCardIndex((i) => i + 1);
        else completeSession(statsRef.current);
      })();
    };
    if (flipped) {
      setFlipped(false);
      setTimeout(go, 300);
    } else {
      go();
    }
  };

  const handlePrevCard = () => {
    if (mode === 'srs') return;
    const go = () => {
      if (currentCardIndex > 0) setCurrentCardIndex(currentCardIndex - 1);
      else setCurrentCardIndex(activeCards.length - 1);
    };
    if (flipped) {
      setFlipped(false);
      setTimeout(go, 300);
    } else {
      go();
    }
  };

  const handleGrade = async (quality) => {
    if (!currentCard || !user || finishedRef.current) return;
    const updated = await upsertCardSrs(currentCard.id, quality, { ...srsFromCard(currentCard), ...currentCard }, userId);
    const patch = {
      srs_ease: updated.srs_ease ?? updated.ease,
      srs_interval: updated.srs_interval ?? updated.interval,
      srs_repetitions: updated.srs_repetitions ?? updated.repetitions,
      srs_due_at: updated.srs_due_at ?? updated.due_at,
      srs_last_reviewed_at: updated.srs_last_reviewed_at ?? updated.last_reviewed_at,
      srs_last_quality: updated.srs_last_quality ?? updated.last_quality,
    };
    setCards((prev) => prev.map((c) => (c.id === currentCard.id ? { ...c, ...patch } : c)));
    setQueue((prev) => prev.map((c) => (c.id === currentCard.id ? { ...c, ...patch } : c)));

    const prev = statsRef.current;
    const nextStats = {
      correct: quality >= 2 ? prev.correct + 1 : prev.correct,
      incorrect: quality < 2 ? prev.incorrect + 1 : prev.incorrect,
      cards_seen: prev.cards_seen + 1,
      weak_card_ids:
        quality < 2
          ? [...new Set([...prev.weak_card_ids, currentCard.id])]
          : prev.weak_card_ids,
      duration_sec: prev.duration_sec || 0,
    };
    statsRef.current = nextStats;
    setStats(nextStats);

    setFlipped(false);
    setTimeout(() => {
      (async () => {
        if (currentCardIndex < activeCards.length - 1) {
          setCurrentCardIndex((i) => i + 1);
          return;
        }

        // End of loaded queue: attempt to load the next page.
        const loaded = await loadMoreCards();
        if (loaded) setCurrentCardIndex((i) => i + 1);
        else completeSession(nextStats);
      })();
    }, 200);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (finished || loading || !started || !activeCards.length) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight' && mode === 'classic') {
        handleNextCard();
      } else if (e.key === 'ArrowLeft' && mode === 'classic') {
        handlePrevCard();
      } else if (mode === 'srs' && flipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleGrade(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, loading, started, activeCards.length, flipped, mode, currentCardIndex]);

  const studyAgain = () => {
    setRetryFocusIds([]);
    setFinished(false);
    setStarted(false);
  };

  const retryWeak = () => {
    const ids = stats.weak_card_ids || [];
    if (ids.length) {
      setRetryFocusIds(ids);
      setMode('srs');
      setCardCount(Math.max(1, ids.length));
    }
    setFinished(false);
    setStarted(false);
  };

  const filterCounts = SRS_FILTERS.reduce((acc, f) => {
    acc[f.id] = cards.filter((c) => srsFilterBucket(c) === f.id).length;
    return acc;
  }, {});

  const showCardCount = mode === 'mixed' || mode === 'classic' || mode === 'srs' || mode === 'true' || mode === 'learn';
  const showShuffle = mode === 'mixed' || mode === 'classic' || mode === 'true';
  const showReverse = mode === 'mixed' || mode === 'classic' || mode === 'srs' || mode === 'true' || mode === 'learn';
  const showSrsFilters = mode === 'srs';
  const settingsMaxCards = mode === 'mixed' ? MIXED_MAX_CARDS : Math.max(1, cards.length || 1);
  const boundedCardCount = Math.min(Math.max(1, cardCount), settingsMaxCards);

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{...getThemeBackgroundStyle(theme.image)}}
    >
      <Helmet>
        <title>Practice Flashcards - Cardify | Study & Review Your Cards</title>
        <meta
          name="description"
          content="Practice your custom flashcards with spaced repetition. Track progress and master your materials with Cardify."
        />
        <link rel="canonical" href="https://cardify.app/practice" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{...getThemeBackgroundStyle(theme.image)}}
      />

      <div className="relative z-10 min-h-[100lvh] sm:h-full flex flex-col sm:overflow-hidden">
        <TitleBar
          text="Practice"
          content={
            canShareSubject ? (
              <BackgroundButton
                image={<Share2 size={18} />}
                bgColor={
                  theme
                    ? `${primaryColor.bgClass} ${primaryColor.hoverClass}`
                    : 'bg-blue-500 hover:bg-blue-400'
                }
                onClick={() => setIsShareModalOpen(true)}
              />
            ) : null
          }
        />

        <div className="flex-1 min-h-0 sm:overflow-y-auto">
          {started && !finished && !isModalOpen && !loading && (
            <PracticeModeMenu current={mixed ? 'mixed' : mode} subject={subject} onSelect={applyMode}>
              <button
                type="button"
                className={`w-full text-left font-bold text-lg px-3 py-2 rounded-2xl ${primaryColor.hoverClass} ${reverse ? 'bg-black/20' : ''}`}
                onClick={() => setReverse((value) => !value)}
              >
                Other way {reverse ? 'on' : 'off'}
              </button>
              {mode === 'srs' && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <p className="px-3 text-sm font-semibold text-white/80 mb-2">
                    Include in SM-2 session
                  </p>
                  <div className="space-y-1 px-1 mb-3">
                    {SRS_FILTERS.map((f) => (
                      <TickSelector
                        key={f.id}
                        checked={Boolean(srsFilters[f.id])}
                        onChange={() => toggleSrsFilter(f.id)}
                        label={f.label}
                        hint={filterCounts[f.id] || 0}
                        className="px-2 rounded-xl"
                      />
                    ))}
                  </div>
                  <BackgroundButton
                    text="Apply filters"
                    bgColor="bg-green-500 hover:bg-green-400"
                    wWidth="w-full"
                    disabled={!Object.values(srsFilters).some(Boolean)}
                    onClick={applySrsFilters}
                  />
                </div>
              )}
            </PracticeModeMenu>
          )}

          {!finished ? (
            isModalOpen ? (
              <PageEmptyState>
                <NoSelectionModal
                  text="Continue where you left off?"
                  subtext={`You were up to card ${(subject?.up_to_index || 0) + 1}. Continue from there?`}
                  text1="Yes, continue"
                  text2="No, start over"
                  icon={<CirclePlay size={44} strokeWidth={2.5} />}
                  action1={async () => {
                    await beginSession(cards, 'classic', srsFilters);
                    setCurrentCardIndex(subject?.up_to_index || 0);
                    setStarted(true);
                    handleClose();
                  }}
                  action2={() => {
                    persistClassicProgress(0, 0, { clear: true });
                    handleClose();
                  }}
                />
              </PageEmptyState>
            ) : loading || (loadingSubject && !mixed) ? (
              <PageEmptyState>
                <div className="animate-pulse flex flex-col space-y-4 w-full max-w-2xl">
                  <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg" />
                  <div className="bg-gray-300 dark:bg-gray-600 h-8 w-3/4 rounded" />
                </div>
              </PageEmptyState>
            ) : !started ? (
              !mixed && !subject && mode !== 'mixed' ? (
                <PageEmptyState>
                  <PracticeModePicker
                    mode={mode}
                    onChange={chooseStartMode}
                    primaryColor={primaryColor}
                    labelTone={labelTone}
                    shadow={shadow}
                  />
                  <NoSelectionModal
                    text="No subject selected"
                    subtext="Pick a subject to start practicing, or choose Mixed review above."
                    text1="Select a subject to practice"
                    action1={() => setIsSubjectListModalOpen(true)}
                    dataTour="practice-pick-subject"
                  />
                </PageEmptyState>
              ) : !mixed && subject && cards.length === 0 && mode !== 'mixed' ? (
                <PageEmptyState>
                  <PracticeModePicker
                    mode={mode}
                    onChange={chooseStartMode}
                    primaryColor={primaryColor}
                    labelTone={labelTone}
                    shadow={shadow}
                  />
                  <NoSelectionModal
                    text={`${subject.name} has no flashcards`}
                    subtext="Add some flashcards to this subject to start practicing."
                    text1={`Add Flashcards to ${subject.name}`}
                    action1={() => navigate(`/create/${subject.id}`, { state: { subject } })}
                  />
                </PageEmptyState>
              ) : (
                <PageEmptyState>
                  <PracticeModePicker
                    mode={mode}
                    onChange={chooseStartMode}
                    primaryColor={primaryColor}
                    labelTone={labelTone}
                    shadow={shadow}
                  />
                  <GameSettings
                    cardCount={showCardCount ? boundedCardCount : undefined}
                    setCardCount={showCardCount ? setCardCount : undefined}
                    maxCards={settingsMaxCards}
                    shuffle={showShuffle ? shuffleOn : undefined}
                    setShuffle={showShuffle ? setShuffleOn : undefined}
                    showTimer={false}
                    onStart={handleStart}
                  >
                    {showSrsFilters && (
                      <div className="mb-4">
                        <p className={`text-sm font-bold mb-2 ${labelTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
                          Include in SM-2 session
                        </p>
                        <div className="space-y-1 mb-1">
                          {SRS_FILTERS.map((f) => (
                            <TickSelector
                              key={f.id}
                              checked={Boolean(srsFilters[f.id])}
                              onChange={() => toggleSrsFilter(f.id)}
                              label={f.label}
                              hint={filterCounts[f.id] || 0}
                              className={labelTone}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {showReverse && (
                      <SettingToggle
                        label="Study the other way"
                        description="Prompt from the back of the card"
                        checked={reverse}
                        onChange={setReverse}
                      />
                    )}
                  </GameSettings>
                </PageEmptyState>
              )
            ) : activeCards.length > 0 && currentCard ? (
              <div className="w-full sm:w-4/5 flex flex-col mt-5 mx-auto px-5 pb-8">
                {mixed && currentCard?._subjectName ? (
                  <p className={`text-center text-sm font-semibold mb-2 ${theme.textClass} ${shadow ? 'drop-shadow-custom' : ''}`}>
                    From {currentCard._subjectName}
                  </p>
                ) : null}
                <div className="w-full h-[50vh] sm:h-[60vh]" data-tour="practice-card">
                  <Card
                    card={playableCard(currentCard, reverse)}
                    flipped={flipped}
                    setFlipped={setFlipped}
                    animateFlip={animateFlip}
                    practice
                  />
                </div>

                {mode === 'srs' && flipped ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4" data-tour="practice-controls">
                    {GRADE_LABELS.map((g) => (
                      <BackgroundButton
                        key={g.q}
                        text={`${g.label} (${g.q + 1})`}
                        bgColor={g.color}
                        wWidth="w-full"
                        onClick={() => handleGrade(g.q)}
                      />
                    ))}
                  </div>
                ) : (
                  <CardControls
                    currentCardIndex={currentCardIndex + 1}
                    totalCards={activeCards.length}
                    onPrevClick={handlePrevCard}
                    onNextClick={mode === 'srs' ? () => setFlipped(true) : handleNextCard}
                    themeText={theme.textClass}
                    cards={activeCards}
                    generateClick={() => {}}
                    flipped={flipped}
                    setFlipped={setFlipped}
                  />
                )}
                {mode === 'srs' && !flipped && (
                  <p className="text-center text-sm font-medium opacity-80 mt-2 text-white drop-shadow">
                    Flip the card, then rate Again / Hard / Good / Easy
                  </p>
                )}
              </div>
            ) : (
              <PageEmptyState>
                {subject || mixed ? (
                  <NoSelectionModal
                    text={
                      mixed
                        ? 'No due cards right now'
                        : cards.length === 0
                        ? `${subject.name} has no flashcards`
                        : 'No cards match these filters'
                    }
                    subtext={
                      mixed
                        ? 'Study a subject first, then come back for a mixed review across your decks.'
                        : cards.length === 0
                        ? 'Add some flashcards to this subject to start practicing.'
                        : 'Go back to settings and enable New / Again / Hard / Good / Easy.'
                    }
                    text1={
                      mixed
                        ? 'Back to Home'
                        : cards.length === 0
                        ? `Add Flashcards to ${subject.name}`
                        : 'Back to settings'
                    }
                    action1={() => {
                      if (mixed) {
                        navigate('/home');
                      } else if (cards.length === 0) {
                        navigate(`/create/${subject.id}`, { state: { subject } });
                      } else {
                        setStarted(false);
                      }
                    }}
                  />
                ) : (
                  <NoSelectionModal
                    text="No subject selected"
                    subtext="Pick a subject to start practicing."
                    text1="Select a subject to practice"
                    action1={() => setIsSubjectListModalOpen(true)}
                    dataTour="practice-pick-subject"
                  />
                )}
              </PageEmptyState>
            )
          ) : mode === 'srs' ? (
            <SessionSummary
              correct={stats.correct}
              incorrect={stats.incorrect}
              cardsSeen={stats.cards_seen || activeCards.length}
              durationSec={stats.duration_sec || 0}
              weakCount={stats.weak_card_ids?.length || 0}
              onStudyAgain={studyAgain}
              onRetryWeak={retryWeak}
              onHome={() => navigate('/home')}
            />
          ) : null}

          <SubjectList
            isOpen={isSubjectListModalOpen}
            onClose={() => setIsSubjectListModalOpen(false)}
            user={user}
            page="practice"
          />
          <ShareSubjectModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            subject={subject}
          />
        </div>
      </div>

      <SpotlightTour
        active={tour.active}
        step={tour.currentStep}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        isLast={tour.isLast}
        onNext={tour.next}
        onSkip={tour.skip}
      />
    </div>
  );
}

export default Practice;
