import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameSettings, { SettingToggle } from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import SessionSummary from '../../components/Study/SessionSummary';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import useGameStudySession from '../../hooks/useGameStudySession';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';
import { answersMatch, playableCard } from '../../components/Study/gradeAnswer';
import PracticeModeMenu from '../../components/Study/PracticeModeMenu';

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function Learn() {
  const [allCards, setAllCards] = useState([]);
  const [deck, setDeck] = useState([]);
  const [phase, setPhase] = useState('settings');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [guess, setGuess] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [weakIds, setWeakIds] = useState([]);
  const [cardCount, setCardCount] = useState(8);
  const [reverse, setReverse] = useState(false);
  const [retryIds, setRetryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { secondaryColor, tertiaryColor, textClass } = theme;
  const navigate = useNavigate();
  const location = useLocation();
  const study = useGameStudySession('learn');
  const autoStart = Boolean(location.state?.autoStart);
  const autoStartedRef = useRef(false);
  const subjectId = subject?.id ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }
    if (!subjectId) {
      setAllCards([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      const playable = data.filter((card) => card.backMode !== 3);
      setAllCards(playable);
      const incoming = Number(location.state?.cardCount);
      setCardCount(
        Number.isFinite(incoming) && incoming > 0
          ? Math.min(Math.max(1, incoming), playable.length || 1)
          : Math.min(8, Math.max(1, playable.length || 1))
      );
      if (location.state?.reverse != null) setReverse(Boolean(location.state.reverse));
      setPhase('settings');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(async (overrides = {}) => {
    const useReverse = overrides.reverse ?? reverse;
    const useCount = overrides.cardCount ?? cardCount;
    const source = retryIds.length
      ? allCards.filter((card) => retryIds.includes(card.id))
      : allCards;
    const pool = source.length ? source : allCards;
    const next = shuffle(pool)
      .slice(0, Math.min(useCount, pool.length))
      .map((card) => playableCard(card, useReverse));
    setDeck(next);
    setIndex(0);
    setFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setWeakIds([]);
    setRetryIds([]);
    setPicked(null);
    setGuess('');
    setPhase('intro');
    await study.begin(subjectId);
  }, [allCards, retryIds, reverse, cardCount, subjectId, study]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current || loading || allCards.length < 2) return;
    autoStartedRef.current = true;
    start({
      reverse: location.state?.reverse,
      cardCount: location.state?.cardCount,
    });
  }, [autoStart, loading, allCards, start, location.state]);

  const current = deck[index];

  const buildOptions = (card, pool) => {
    const correct = card?.answer || '';
    const wrong = shuffle(pool.filter((item) => item.id !== card.id).map((item) => item.answer)).slice(0, 3);
    return shuffle([correct, ...wrong]);
  };

  const goIntroNext = () => {
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
      return;
    }
    setIndex(0);
    setPicked(null);
    setOptions(buildOptions(deck[0], deck));
    setPhase('quiz');
  };

  const chooseOption = (option) => {
    if (picked !== null) return;
    const ok = option === current.answer;
    setPicked(option);
    if (ok) setCorrectCount((n) => n + 1);
    else {
      setIncorrectCount((n) => n + 1);
      setWeakIds((ids) => [...new Set([...ids, current.id])]);
    }
  };

  const goQuizNext = () => {
    const lastMiss = picked !== current.answer;
    const nextWeak = lastMiss ? [...new Set([...weakIds, current.id])] : weakIds;
    if (index < deck.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      setPicked(null);
      setOptions(buildOptions(deck[nextIndex], deck));
      return;
    }
    const misses = deck.filter((card) => nextWeak.includes(card.id));
    const typeDeck = misses.length ? misses : deck;
    setDeck(typeDeck);
    setIndex(0);
    setGuess('');
    setPicked(null);
    setPhase('type');
  };

  const submitType = () => {
    const ok = answersMatch(guess, current.answer);
    setPicked(ok ? 'correct' : 'incorrect');
    if (ok) setCorrectCount((n) => n + 1);
    else {
      setIncorrectCount((n) => n + 1);
      setWeakIds((ids) => [...new Set([...ids, current.id])]);
    }
  };

  const goTypeNext = () => {
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setGuess('');
      setPicked(null);
      return;
    }
    setPhase('done');
    study.finish({
      correct: correctCount,
      incorrect: incorrectCount,
      cards_seen: Math.max(cardCount, correctCount + incorrectCount),
      weak_card_ids: weakIds,
    });
  };

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ ...getThemeBackgroundStyle(theme.image) }}
    >
      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ ...getThemeBackgroundStyle(theme.image) }}
      />
      <div className="relative z-10 min-h-[100lvh] sm:h-screen flex flex-col sm:overflow-hidden">
        <TitleBar text="Practice" />
        {!loading && phase !== 'done' ? <PracticeModeMenu current="learn" subject={subject} /> : null}
        {loading || (autoStart && phase === 'settings' && allCards.length >= 2) ? (
          <LoadingSpinner text="Loading Learn…" />
        ) : allCards.length < 2 ? (
          <PageEmptyState>
            {subject ? (
              <NoSelectionModal
                text={`${subject.name} needs a few more cards`}
                subtext="Learn works best with at least 2 text cards."
                text1={`Add Flashcards to ${subject.name}`}
                action1={() => navigate(`/create/${subject.id}`, { state: { subject } })}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Pick a subject to start Learn."
                text1="Select a subject"
                action1={() => setIsSubjectListModalOpen(true)}
              />
            )}
          </PageEmptyState>
        ) : phase === 'settings' ? (
          <PageEmptyState>
            <GameSettings
              cardCount={cardCount}
              setCardCount={setCardCount}
              maxCards={Math.max(1, allCards.length)}
              showTimer={false}
              onStart={start}
            >
              <SettingToggle
                label="Study the other way"
                description="Prompt from the back of the card"
                checked={reverse}
                onChange={setReverse}
              />
            </GameSettings>
          </PageEmptyState>
        ) : phase === 'done' ? (
          <SessionSummary
            title="Learn complete"
            correct={correctCount}
            incorrect={incorrectCount}
            cardsSeen={correctCount + incorrectCount}
            weakCount={weakIds.length}
            durationSec={Math.round((Date.now() - (study.startedAtRef.current || Date.now())) / 1000)}
            onStudyAgain={() => setPhase('settings')}
            onRetryWeak={
              weakIds.length
                ? () => {
                    setRetryIds(weakIds);
                    setCardCount(Math.max(1, weakIds.length));
                    setPhase('settings');
                  }
                : undefined
            }
            onHome={() => navigate('/home')}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center px-3 sm:px-5 pb-4">
            <div className="w-full max-w-4xl">
              <GameHUD
                items={[
                  {
                    key: 'phase',
                    icon: hudIcons.layers,
                    value: phase === 'intro' ? 'Intro' : phase === 'quiz' ? 'Quiz' : 'Type',
                    label: 'Step',
                  },
                  { key: 'progress', icon: hudIcons.zap, value: `${index + 1}/${deck.length}`, label: 'Progress' },
                  { key: 'correct', icon: hudIcons.check, value: correctCount, hint: 'correct' },
                ]}
              />
            </div>
            {phase === 'intro' && current ? (
              <>
                <div className="w-full max-w-4xl flex-1 min-h-[40vh] mb-4">
                  <Card card={current} flipped={flipped} setFlipped={setFlipped} animateFlip practice />
                </div>
                <BackgroundButton
                  text={index === deck.length - 1 ? 'Start quiz' : 'Next'}
                  bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                  onClick={goIntroNext}
                />
              </>
            ) : null}
            {phase === 'quiz' && current ? (
              <>
                <div className="w-full max-w-4xl h-[28vh] mb-3">
                  <Card card={current} flipped={false} setFlipped={() => {}} animateFlip={false} practice={false} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-4xl mb-4">
                  {options.map((option, optionIndex) => {
                    let color = 'bg-white hover:bg-gray-100 text-gray-800';
                    if (picked !== null) {
                      if (option === current.answer) color = 'bg-green-500 text-white';
                      else if (option === picked) color = 'bg-red-500 text-white';
                    }
                    return (
                      <button
                        key={`${optionIndex}-${option}`}
                        type="button"
                        disabled={picked !== null}
                        onClick={() => chooseOption(option)}
                        className={`${color} rounded-2xl p-4 font-bold background-shadow-new`}
                      >
                        <SafeMarkdown className="text-lg">{option}</SafeMarkdown>
                      </button>
                    );
                  })}
                </div>
                {picked !== null ? (
                  <BackgroundButton
                    text={index === deck.length - 1 ? 'Type the misses' : 'Next'}
                    bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                    onClick={goQuizNext}
                  />
                ) : null}
              </>
            ) : null}
            {phase === 'type' && current ? (
              <>
                <div className="w-full max-w-4xl h-[28vh] mb-3">
                  <Card card={current} flipped={Boolean(picked)} setFlipped={() => {}} animateFlip={false} practice={false} />
                </div>
                {picked === null ? (
                  <div className="w-full max-w-2xl mb-4">
                    <input
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitType()}
                      placeholder="Type the answer"
                      className="w-full bg-white rounded-2xl p-4 text-xl text-gray-800 background-shadow-new focus:outline-none"
                    />
                  </div>
                ) : (
                  <p className={`mb-3 text-lg font-bold ${textClass}`}>
                    {picked === 'correct' ? 'Correct' : current.answer}
                  </p>
                )}
                <div className="flex gap-3">
                  {picked === null ? (
                    <BackgroundButton
                      text="Submit"
                      bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                      onClick={submitType}
                    />
                  ) : (
                    <BackgroundButton
                      text={index === deck.length - 1 ? 'Finish' : 'Next'}
                      bgColor={`${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`}
                      onClick={goTypeNext}
                    />
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
        <SubjectList isOpen={isSubjectListModalOpen} onClose={() => setIsSubjectListModalOpen(false)} user={user} page="learn" />
      </div>
    </div>
  );
}

export default Learn;
