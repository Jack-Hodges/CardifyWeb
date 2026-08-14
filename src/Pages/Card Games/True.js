import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import GameSettings, { SettingToggle } from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import useGameStudySession from '../../hooks/useGameStudySession';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';
import { playableCard } from '../../components/Study/gradeAnswer';
import SessionSummary from '../../components/Study/SessionSummary';
import PracticeModeMenu from '../../components/Study/PracticeModeMenu';

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function TrueFalse() {
  // Question + proposed answer are shown together; no flip Card.
  const [allCards, setAllCards] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [weakIds, setWeakIds] = useState([]);
  const [picked, setPicked] = useState(null);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [cardCount, setCardCount] = useState(12);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [retryIds, setRetryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { secondaryColor, textClass, shadow } = theme;
  const textTone = textClass || 'textColor';
  const navigate = useNavigate();
  const location = useLocation();
  const study = useGameStudySession('true');
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
      setStarted(false);
      setFinished(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      setAllCards(data);
      const incoming = Number(location.state?.cardCount);
      setCardCount(
        Number.isFinite(incoming) && incoming > 0
          ? Math.min(Math.max(1, incoming), data.length || 1)
          : Math.max(1, data.length || 1)
      );
      if (location.state?.reverse != null) setReverse(Boolean(location.state.reverse));
      if (location.state?.shuffle != null) setShuffleOn(Boolean(location.state.shuffle));
      setStarted(false);
      setFinished(false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async (overrides = {}) => {
    const useReverse = overrides.reverse ?? reverse;
    const useShuffle = overrides.shuffle ?? shuffleOn;
    const useCount = overrides.cardCount ?? cardCount;
    const focused = retryIds.length ? allCards.filter((card) => retryIds.includes(card.id)) : allCards;
    const source = focused.length >= 2 ? focused : allCards;
    let pool = useShuffle ? shuffle(source) : [...source];
    pool = pool.slice(0, Math.min(useCount, pool.length));
    const decoys = allCards.length >= 2 ? allCards : pool;
    const built = pool.map((card, i) => {
      const shown = playableCard(card, useReverse);
      const truth = Math.random() < 0.5;
      const decoy = decoys[(i + 1) % decoys.length];
      const decoyShown = playableCard(decoy, useReverse);
      return {
        card: shown,
        sourceId: card.id,
        isTrue: truth,
        shownAnswer: truth ? shown.answer : decoyShown.answer,
        shownAnswerMode: truth ? shown.backMode : decoyShown.backMode,
        shownImageUrl: truth ? shown.image_url : decoyShown.image_url,
      };
    });
    setRounds(built);
    setIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setWeakIds([]);
    setRetryIds([]);
    setPicked(null);
    setFinished(false);
    setStarted(true);
    await study.begin(subjectId);
  }, [allCards, retryIds, reverse, shuffleOn, cardCount, subjectId, study]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current || loading || allCards.length < 2) return;
    autoStartedRef.current = true;
    handleStart({
      reverse: location.state?.reverse,
      shuffle: location.state?.shuffle,
      cardCount: location.state?.cardCount,
    });
  }, [autoStart, loading, allCards, handleStart, location.state]);

  useEffect(() => {
    if (!finished || !started) return undefined;
    study.finish({
      correct: correctCount,
      incorrect: incorrectCount,
      cards_seen: rounds.length,
      weak_card_ids: weakIds,
    });
    return undefined;
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (value) => {
    if (picked !== null) return;
    const round = rounds[index];
    const ok = value === round.isTrue;
    setPicked(value);
    if (ok) setCorrectCount((n) => n + 1);
    else {
      setIncorrectCount((n) => n + 1);
      setWeakIds((ids) => [...new Set([...ids, round.sourceId])]);
    }
  };

  const goNext = () => {
    if (index >= rounds.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const round = rounds[index];

  const renderSide = (text, mode, imageUrl) => {
    if ((mode === 2 || mode === 3) && imageUrl) {
      return <img src={imageUrl} alt="" className="max-h-full max-w-full mx-auto object-contain" />;
    }
    return (
      <SafeMarkdown className="text-2xl sm:text-4xl font-bold text-gray-800 text-center leading-snug">
        {text || ''}
      </SafeMarkdown>
    );
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
        {!loading && !finished ? <PracticeModeMenu current="true" subject={subject} /> : null}
        {loading || (autoStart && !started && !finished && allCards.length >= 2) ? (
          <LoadingSpinner text="Loading True / False…" />
        ) : allCards.length < 2 ? (
          <PageEmptyState>
            {subject ? (
              <NoSelectionModal
                text={`${subject.name} needs at least 2 cards`}
                subtext="Add more flashcards to play True / False."
                text1={`Add Flashcards to ${subject.name}`}
                action1={() => navigate(`/create/${subject.id}`, { state: { subject } })}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Pick a subject to start True / False."
                text1="Select a subject"
                action1={() => setIsSubjectListModalOpen(true)}
              />
            )}
          </PageEmptyState>
        ) : finished ? (
          <SessionSummary
            title="True / False complete"
            correct={correctCount}
            incorrect={incorrectCount}
            cardsSeen={rounds.length}
            weakCount={weakIds.length}
            durationSec={Math.round((Date.now() - (study.startedAtRef.current || Date.now())) / 1000)}
            onStudyAgain={() => {
              setFinished(false);
              setStarted(false);
            }}
            onRetryWeak={
              weakIds.length
                ? () => {
                    setRetryIds(weakIds);
                    setCardCount(Math.max(1, weakIds.length));
                    setFinished(false);
                    setStarted(false);
                  }
                : undefined
            }
            onHome={() => navigate('/home')}
          />
        ) : !started ? (
          <PageEmptyState>
            <GameSettings
              cardCount={cardCount}
              setCardCount={setCardCount}
              maxCards={allCards.length}
              shuffle={shuffleOn}
              setShuffle={setShuffleOn}
              showTimer={false}
              onStart={handleStart}
            >
              <SettingToggle
                label="Study the other way"
                description="Prompt from the back of the card"
                checked={reverse}
                onChange={setReverse}
              />
            </GameSettings>
          </PageEmptyState>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col w-full max-w-5xl mx-auto px-3 sm:px-5 pb-4">
            <GameHUD
              items={[
                { key: 'progress', icon: hudIcons.layers, value: `${index + 1}/${rounds.length}`, label: 'Progress' },
                { key: 'correct', icon: hudIcons.check, value: correctCount, hint: 'correct' },
                { key: 'miss', icon: hudIcons.x, value: incorrectCount, hint: 'miss' },
              ]}
            />
            {round ? (
              <div className="flex-1 min-h-0 grid grid-rows-2 gap-3 my-1">
                <section className="min-h-0 flex flex-col justify-center bg-white rounded-2xl px-4 py-5 sm:px-8 sm:py-8 background-shadow-new overflow-auto">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 text-center mb-3">Question</p>
                  {renderSide(round.card.question, round.card.frontMode, round.card.image_url)}
                </section>
                <section
                  className={`min-h-0 flex flex-col justify-center bg-white rounded-2xl px-4 py-5 sm:px-8 sm:py-8 background-shadow-new overflow-auto ${
                    picked === null
                      ? ''
                      : picked === round.isTrue
                        ? 'ring-4 ring-green-400'
                        : 'ring-4 ring-red-400'
                  }`}
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 text-center mb-3">Answer</p>
                  {renderSide(round.shownAnswer, round.shownAnswerMode, round.shownImageUrl)}
                  {picked !== null && !round.isTrue ? (
                    <p className="mt-4 text-base font-semibold text-gray-500 text-center">
                      Real answer:{' '}
                      <span className="text-gray-800">{round.card.answer || 'see the card'}</span>
                    </p>
                  ) : null}
                </section>
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <p className={`text-center text-lg font-semibold py-2 ${textTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
              {picked === null
                ? 'Is this the right answer?'
                : picked === round?.isTrue
                  ? 'Correct'
                  : 'Not this time'}
            </p>
            <div className="flex justify-center gap-4 shrink-0">
              {picked === null ? (
                <>
                  <BackgroundButton text="True" bgColor="bg-green-500 hover:bg-green-400" onClick={() => choose(true)} />
                  <BackgroundButton text="False" bgColor="bg-red-500 hover:bg-red-400" onClick={() => choose(false)} />
                </>
              ) : (
                <BackgroundButton
                  text={index === rounds.length - 1 ? 'Finish' : 'Next'}
                  bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                  onClick={goNext}
                />
              )}
            </div>
          </div>
        )}
        <SubjectList isOpen={isSubjectListModalOpen} onClose={() => setIsSubjectListModalOpen(false)} user={user} page="true" />
      </div>
    </div>
  );
}

export default TrueFalse;
