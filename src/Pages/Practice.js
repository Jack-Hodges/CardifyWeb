import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCards, sortCardsById } from '../components/Card/CardManipulation';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import TitleBar from '../components/Navigation/TitleBar';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import SubjectList from '../components/Subject/SubjectList';
import { saveSubjectProgress, TUTORIAL_SUBJECT_ID } from '../components/Subject/SubjectManipulation';
import NoSelectionModal from '../components/Modals/NoSelectionModal';
import PageEmptyState from '../components/Elements/PageEmptyState';
import SessionSummary from '../components/Study/SessionSummary';
import {
  upsertCardSrs,
  startStudySession,
  endStudySession,
  recordStudyActivity,
} from '../components/Study/studyApi';
import { isDue, srsFromCard, srsFilterBucket } from '../components/Study/sm2';
import useSubjectFromRoute from '../hooks/useSubjectFromRoute';
import { Helmet } from 'react-helmet-async';
import BackgroundButton from '../components/Elements/BackgroundButton';
import { ChevronDown, CirclePlay, Share2 } from 'lucide-react';
import SpotlightTour from '../components/Tutorial/SpotlightTour';
import usePageTour from '../components/Tutorial/usePageTour';
import { PRACTICE_STEPS } from '../components/Tutorial/tourSteps';
import { getThemeBackgroundStyle } from '../components/Functions/getTheme';
import ShareSubjectModal from '../components/Modals/ShareSubjectModal';

const GRADE_LABELS = [
  { q: 0, label: 'Again', color: 'bg-red-500 hover:bg-red-400' },
  { q: 1, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-400' },
  { q: 2, label: 'Good', color: 'bg-green-500 hover:bg-green-400' },
  { q: 3, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-400' },
];

const MODE_LABELS = {
  classic: 'Classic',
  srs: 'Spaced (SM-2)',
};

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

function Practice() {
  const [cards, setCards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animateFlip] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [mode, setMode] = useState('classic');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [srsFilters, setSrsFilters] = useState(DEFAULT_SRS_FILTERS);
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

  const { subject, loadingSubject } = useSubjectFromRoute();
  const { user, getUser, theme, profile, setProfile } = useUser();
  const navigate = useNavigate();
  const { primaryColor } = theme;

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
  const modeMenuRef = useRef(null);
  const modeRef = useRef(mode);
  const subjectRef = useRef(subject);
  const userRef = useRef(user);
  const subjectId = subject?.id;
  const userId = user?.id;

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
    if (!modeMenuOpen) return undefined;
    const onDoc = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [modeMenuOpen]);

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
        const updated = await recordStudyActivity(profile, durationSec);
        if (updated && setProfile) setProfile(updated);
      }
      return durationSec;
    },
    [profile, setProfile]
  );

  useEffect(() => {
    if (
      subject &&
      subject.up_to_index != null &&
      user &&
      subject.user_id === user.id &&
      mode === 'classic'
    ) {
      setIsModalOpen(true);
    }
  }, [subjectId, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildQueue = useCallback((deck, practiceMode, filters) => {
    if (practiceMode !== 'srs') return deck;

    const active = SRS_FILTERS.filter((f) => filters[f.id]).map((f) => f.id);
    if (active.length === 0) return [];

    let pool = deck.filter((c) => active.includes(srsFilterBucket(c)));
    const due = pool.filter((c) => isDue(srsFromCard(c)));
    return due.length > 0 ? due : pool;
  }, []);

  const beginSession = useCallback(
    async (deck, practiceMode, filters) => {
      const ordered = buildQueue(deck, practiceMode, filters);
      setQueue(ordered);
      setCurrentCardIndex(0);
      setFlipped(false);
      setFinished(false);
      finishedRef.current = false;
      setStats({ correct: 0, incorrect: 0, cards_seen: 0, weak_card_ids: [], duration_sec: 0 });
      statsRef.current = { correct: 0, incorrect: 0, cards_seen: 0, weak_card_ids: [], duration_sec: 0 };

      if (!userId || !subjectId) return;
      const session = await startStudySession(
        userId,
        subjectId,
        practiceMode === 'srs' ? 'practice_srs' : 'practice'
      );
      setSessionId(session?.id || null);
      setSessionStartedAt(Date.now());
    },
    [buildQueue, userId, subjectId]
  );

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }
    if (loadingSubject || !subjectId) {
      if (!subjectId && !loadingSubject) {
        setCards([]);
        setQueue([]);
        setLoading(false);
      }
      return;
    }

    const key = `${userId}:${subjectId}`;
    if (loadedKeyRef.current === key) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchCards(subjectId);
      sortCardsById(data);
      if (cancelled) return;
      setCards(data);

      loadedKeyRef.current = key;
      await beginSession(data, mode, srsFilters);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      if (!finishedRef.current) {
        persistClassicProgress(currentCardIndexRef.current, cardsLengthRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, userId, loadingSubject]);

  // Keep Home "In Progress" updated while studying classic
  useEffect(() => {
    if (loading || finished || mode !== 'classic') return;
    if (!cards.length) return;
    persistClassicProgress(currentCardIndex, queue.length || cards.length);
  }, [currentCardIndex, mode, loading, finished, cards.length, queue.length, persistClassicProgress]);

  const applyMode = async (nextMode) => {
    if (nextMode === mode) {
      setModeMenuOpen(false);
      return;
    }
    if (mode === 'classic') {
      persistClassicProgress(currentCardIndexRef.current, cardsLengthRef.current);
    }
    setMode(nextMode);
    setModeMenuOpen(false);
    await beginSession(cards, nextMode, srsFilters);
  };

  const toggleSrsFilter = (id) => {
    setSrsFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applySrsFilters = async () => {
    setModeMenuOpen(false);
    await beginSession(cards, 'srs', srsFilters);
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
      } else {
        completeSession(statsRef.current);
      }
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
    const updated = await upsertCardSrs(currentCard.id, quality, srsFromCard(currentCard));
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
      if (currentCardIndex < activeCards.length - 1) {
        setCurrentCardIndex((i) => i + 1);
      } else {
        completeSession(nextStats);
      }
    }, 200);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (finished || loading || !activeCards.length) return;
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
  }, [finished, loading, activeCards.length, flipped, mode, currentCardIndex]);

  const studyAgain = async () => {
    await beginSession(cards, mode, srsFilters);
  };

  const filterCounts = SRS_FILTERS.reduce((acc, f) => {
    acc[f.id] = cards.filter((c) => srsFilterBucket(c) === f.id).length;
    return acc;
  }, {});

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
          {subject && !finished && !isModalOpen && (
            <div className="flex justify-center mt-3 px-4 relative z-40" ref={modeMenuRef} data-tour="practice-mode">
              <div className="relative inline-block text-left">
                <BackgroundButton
                  text={MODE_LABELS[mode]}
                  bgColor={
                    theme
                      ? `${primaryColor.bgClass} ${primaryColor.hoverClass}`
                      : 'bg-blue-500 hover:bg-blue-400'
                  }
                  wWidth="w-52"
                  image={<ChevronDown size={18} />}
                  flip
                  onClick={() => setModeMenuOpen((o) => !o)}
                />

                <div
                  className={`absolute left-1/2 -translate-x-1/2 mt-2 w-[min(92vw,22rem)] ${primaryColor.bgClass} background-shadow-new rounded-3xl p-2 text-white transform transition-all duration-300 origin-top ${
                    modeMenuOpen
                      ? 'scale-y-100 opacity-100 pointer-events-auto'
                      : 'scale-y-0 opacity-0 pointer-events-none'
                  }`}
                  style={{ transformOrigin: 'top' }}
                >
                  <button
                    type="button"
                    className={`w-full text-left font-bold text-lg px-3 py-2 rounded-2xl ${primaryColor.hoverClass} ${mode === 'classic' ? 'bg-black/20' : ''}`}
                    onClick={() => applyMode('classic')}
                  >
                    Classic
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left font-bold text-lg px-3 py-2 rounded-2xl ${primaryColor.hoverClass} ${mode === 'srs' ? 'bg-black/20' : ''}`}
                    onClick={() => applyMode('srs')}
                  >
                    Spaced (SM-2)
                  </button>

                  {mode === 'srs' && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="px-3 text-sm font-semibold text-white/80 mb-2">
                        Include in SM-2 session
                      </p>
                      <div className="space-y-1 px-1 mb-3">
                        {SRS_FILTERS.map((f) => (
                          <label
                            key={f.id}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-black/15 cursor-pointer"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={Boolean(srsFilters[f.id])}
                                onChange={() => toggleSrsFilter(f.id)}
                              />
                              {f.label}
                            </span>
                            <span className="text-xs opacity-70">{filterCounts[f.id] || 0}</span>
                          </label>
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
                </div>
              </div>
            </div>
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
                  action1={() => {
                    setCurrentCardIndex(subject?.up_to_index || 0);
                    handleClose();
                  }}
                  action2={() => {
                    setCurrentCardIndex(0);
                    persistClassicProgress(0, 0, { clear: true });
                    handleClose();
                  }}
                />
              </PageEmptyState>
            ) : loading || loadingSubject ? (
              <PageEmptyState>
                <div className="animate-pulse flex flex-col space-y-4 w-full max-w-2xl">
                  <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg" />
                  <div className="bg-gray-300 dark:bg-gray-600 h-8 w-3/4 rounded" />
                </div>
              </PageEmptyState>
            ) : activeCards.length > 0 && currentCard ? (
              <div className="w-full sm:w-4/5 flex flex-col mt-5 mx-auto px-5 pb-8">
                <div className="w-full h-[50vh] sm:h-[60vh]" data-tour="practice-card">
                  <Card
                    card={currentCard}
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
                {subject ? (
                  <NoSelectionModal
                    text={
                      cards.length === 0
                        ? `${subject.name} has no flashcards`
                        : 'No cards match these filters'
                    }
                    subtext={
                      cards.length === 0
                        ? 'Add some flashcards to this subject to start practicing.'
                        : 'Open the mode menu and enable New / Again / Hard / Good / Easy, then Apply.'
                    }
                    text1={
                      cards.length === 0
                        ? `Add Flashcards to ${subject.name}`
                        : 'Open filters'
                    }
                    action1={() => {
                      if (cards.length === 0) {
                        navigate(`/create/${subject.id}`, { state: { subject } });
                      } else {
                        setMode('srs');
                        setModeMenuOpen(true);
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
