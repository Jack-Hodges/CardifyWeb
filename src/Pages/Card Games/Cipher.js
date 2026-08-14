import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameSettings, { SettingToggle } from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import SessionSummary from '../../components/Study/SessionSummary';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import useGameStudySession from '../../hooks/useGameStudySession';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';
import { playableCard } from '../../components/Study/gradeAnswer';
import { answersMatchLoose, cipherFromCard, gradeCloze } from '../../components/Study/cipher';

function blankWidthCh(value, expected) {
  const typed = String(value || '').length;
  const hint = Math.min(Math.max(String(expected || '').length, 6), 22);
  return Math.max(typed + 1, hint, 4);
}

function ClozeBlank({
  value,
  expected,
  index,
  total,
  revealed,
  correct,
  inputRef,
  onChange,
  onEnter,
}) {
  const width = `${blankWidthCh(value, expected)}ch`;
  const label = total > 1 ? `Blank ${index + 1} of ${total}` : 'Fill in the blank';

  if (revealed) {
    return (
      <span
        className={`inline-flex items-baseline align-baseline mx-1 mb-1 px-3 py-1 min-h-[2rem] rounded-xl border-2 bg-white text-xl sm:text-2xl ${
          correct
            ? 'border-green-600 text-green-700 shadow-[2px_2px_0_0_#16a34a]'
            : 'border-red-500 text-red-600 shadow-[2px_2px_0_0_#ef4444]'
        }`}
        style={{ minWidth: width }}
      >
        <span className="font-bold">{value || '—'}</span>
        {!correct && expected ? (
          <span className="ml-1.5 text-green-700 font-bold">({expected})</span>
        ) : null}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      aria-label={label}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        onEnter();
      }}
      style={{ width }}
      className="inline-block align-baseline mx-1 mb-1 px-3 py-1 text-xl sm:text-2xl font-bold text-gray-800 text-center bg-white rounded-xl border-2 border-[var(--theme-border-color)] shadow-[2px_2px_0_0_var(--theme-border-color)] focus:outline-none focus:translate-x-px focus:translate-y-px focus:shadow-none"
    />
  );
}

function ClozePrompt({
  puzzle,
  guesses,
  revealed,
  blankRefs,
  onChange,
  onEnterBlank,
  startIndex = 0,
  totalBlanks = 0,
  className = 'text-lg sm:text-xl font-semibold',
}) {
  let blankIndex = 0;
  const segments = puzzle.segments?.length
    ? puzzle.segments
    : [{ type: 'text', value: puzzle.prompt || '' }];
  const total = totalBlanks || puzzle.answers?.length || 0;

  return (
    <p className={`${className} text-gray-800 text-center leading-relaxed whitespace-pre-wrap`}>
      {segments.map((segment, i) => {
        if (segment.type !== 'blank') {
          return <span key={`t-${i}`}>{segment.value}</span>;
        }
        const currentIndex = startIndex + blankIndex;
        blankIndex += 1;
        return (
          <ClozeBlank
            key={`b-${i}`}
            index={currentIndex}
            total={total}
            value={guesses[currentIndex] || ''}
            expected={segment.answer}
            revealed={revealed}
            correct={revealed && answersMatchLoose(guesses[currentIndex], segment.answer)}
            inputRef={(el) => {
              blankRefs.current[currentIndex] = el;
            }}
            onChange={(next) => onChange(currentIndex, next)}
            onEnter={() => onEnterBlank(currentIndex)}
          />
        );
      })}
    </p>
  );
}

function hasLine(side) {
  return Boolean(side?.segments?.length || side?.answers?.length);
}

function LineLabel({ children }) {
  return <p className="text-sm font-bold uppercase tracking-wide text-gray-500 text-center mb-3">{children}</p>;
}

function Cipher() {
  const [cards, setCards] = useState([]);
  const [pool, setPool] = useState([]);
  const [index, setIndex] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [weakIds, setWeakIds] = useState([]);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [cardCount, setCardCount] = useState(12);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [retryIds, setRetryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const blankRefs = useRef([]);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { secondaryColor, tertiaryColor, textClass, shadow } = theme;
  const textTone = textClass || 'textColor';
  const navigate = useNavigate();
  const study = useGameStudySession('cipher');
  const subjectId = subject?.id ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }
    if (!subjectId) {
      setCards([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      const playable = data.filter((card) => card.backMode !== 3 && card.frontMode !== 3);
      setCards(playable);
      setCardCount(Math.max(1, playable.length || 1));
      setStarted(false);
      setFinished(false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    const focused = retryIds.length ? cards.filter((card) => retryIds.includes(card.id)) : cards;
    const source = focused.length ? focused : cards;
    let next = shuffleOn ? [...source].sort(() => Math.random() - 0.5) : [...source];
    next = next.slice(0, Math.min(cardCount, next.length)).map((card) => playableCard(card, reverse));
    setPool(next);
    setIndex(0);
    setGuesses([]);
    setShowAnswer(false);
    setAutoCorrect(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setWeakIds([]);
    setRetryIds([]);
    setFinished(false);
    setStarted(true);
    await study.begin(subjectId);
  };

  useEffect(() => {
    if (!finished || !started) return undefined;
    study.finish({
      correct: correctCount,
      incorrect: incorrectCount,
      cards_seen: pool.length,
      weak_card_ids: weakIds,
    });
    return undefined;
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = pool[index];
  const puzzle = useMemo(
    () =>
      current
        ? cipherFromCard(current)
        : { front: { segments: [], answers: [] }, back: { segments: [], answers: [] }, answers: [] },
    [current]
  );

  useEffect(() => {
    setGuesses((puzzle.answers || []).map(() => ''));
    blankRefs.current = [];
  }, [index, current?.id, puzzle.answers]);

  useEffect(() => {
    if (!started || finished || showAnswer) return undefined;
    const frame = requestAnimationFrame(() => {
      blankRefs.current[0]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [started, finished, showAnswer, index]);

  const updateGuess = (blankIndex, value) => {
    setGuesses((prev) => {
      const next = [...prev];
      next[blankIndex] = value;
      return next;
    });
  };

  const submit = () => {
    if (!current) return;
    const ok = gradeCloze(guesses, puzzle.answers);
    setAutoCorrect(ok);
    setShowAnswer(true);
  };

  const enterBlank = (blankIndex) => {
    if (blankIndex >= (puzzle.answers?.length || 1) - 1) {
      submit();
      return;
    }
    blankRefs.current[blankIndex + 1]?.focus();
  };

  const commit = (ok) => {
    if (ok) setCorrectCount((n) => n + 1);
    else {
      setIncorrectCount((n) => n + 1);
      setWeakIds((ids) => [...new Set([...ids, current.id])]);
    }
    if (index >= pool.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setGuesses([]);
    setShowAnswer(false);
    setAutoCorrect(null);
  };

  const frontBlanks = puzzle.front?.answers?.length || 0;
  const showFront = hasLine(puzzle.front);
  const showBack = hasLine(puzzle.back);

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
        <TitleBar text="Cipher" />
        {loading ? (
          <LoadingSpinner text="Loading Cipher…" />
        ) : cards.length === 0 ? (
          <PageEmptyState>
            {subject ? (
              <NoSelectionModal
                text={`${subject.name} has no Cipher cards`}
                subtext="Add text cards to fill in the blanks."
                text1={`Add Flashcards to ${subject.name}`}
                action1={() => navigate(`/create/${subject.id}`, { state: { subject } })}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Pick a subject to start Cipher."
                text1="Select a subject"
                action1={() => setIsSubjectListModalOpen(true)}
              />
            )}
          </PageEmptyState>
        ) : finished ? (
          <SessionSummary
            title="Cipher complete"
            correct={correctCount}
            incorrect={incorrectCount}
            cardsSeen={pool.length}
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
              maxCards={cards.length}
              shuffle={shuffleOn}
              setShuffle={setShuffleOn}
              showTimer={false}
              onStart={handleStart}
            >
              <SettingToggle
                label="Study the other way"
                description="Swap which line is the question and which is the answer. Both still have blanks."
                checked={reverse}
                onChange={setReverse}
              />
            </GameSettings>
          </PageEmptyState>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col w-full max-w-5xl mx-auto px-3 sm:px-5 pb-4">
            <GameHUD
              items={[
                { key: 'progress', icon: hudIcons.layers, value: `${index + 1}/${pool.length}`, label: 'Progress' },
                { key: 'correct', icon: hudIcons.check, value: correctCount, hint: 'correct' },
                { key: 'miss', icon: hudIcons.x, value: incorrectCount, hint: 'miss' },
              ]}
            />
            <div
              className={`flex-1 min-h-0 grid gap-3 my-1 ${
                showFront && showBack ? 'grid-rows-2' : 'grid-rows-1'
              }`}
            >
              {showFront ? (
                <section className="min-h-0 flex flex-col justify-center bg-white rounded-2xl px-4 py-5 sm:px-8 sm:py-8 background-shadow-new overflow-auto">
                  <LineLabel>Question</LineLabel>
                  <ClozePrompt
                    key={`${current?.id || index}-front`}
                    puzzle={puzzle.front}
                    guesses={guesses}
                    revealed={showAnswer}
                    blankRefs={blankRefs}
                    onChange={updateGuess}
                    onEnterBlank={enterBlank}
                    startIndex={0}
                    totalBlanks={puzzle.answers.length}
                    className="text-2xl sm:text-4xl font-bold"
                  />
                </section>
              ) : null}
              {showBack ? (
                <section className="min-h-0 flex flex-col justify-center bg-white rounded-2xl px-4 py-5 sm:px-8 sm:py-8 background-shadow-new overflow-auto">
                  <LineLabel>Answer</LineLabel>
                  <ClozePrompt
                    key={`${current?.id || index}-back`}
                    puzzle={puzzle.back}
                    guesses={guesses}
                    revealed={showAnswer}
                    blankRefs={blankRefs}
                    onChange={updateGuess}
                    onEnterBlank={enterBlank}
                    startIndex={frontBlanks}
                    totalBlanks={puzzle.answers.length}
                    className="text-2xl sm:text-4xl font-bold"
                  />
                </section>
              ) : null}
              {!showFront && !showBack ? (
                <section className="min-h-0 flex items-center justify-center bg-white rounded-2xl background-shadow-new">
                  <p className="text-sm font-bold text-gray-500 text-center">Fill the blanks</p>
                </section>
              ) : null}
            </div>
            {showAnswer ? (
              <p className={`text-center text-lg font-bold py-2 ${textTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
                {autoCorrect ? 'Looks right' : 'Not quite'}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-3 pt-2 shrink-0">
              {!showAnswer ? (
                <>
                  <BackgroundButton
                    text="Skip"
                    bgColor={`${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`}
                    onClick={() => commit(false)}
                  />
                  <BackgroundButton
                    text="Submit"
                    bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                    onClick={submit}
                  />
                </>
              ) : (
                <>
                  <BackgroundButton text="I was wrong" bgColor="bg-red-500 hover:bg-red-400" onClick={() => commit(false)} />
                  <BackgroundButton text="I was right" bgColor="bg-green-500 hover:bg-green-400" onClick={() => commit(true)} />
                  <BackgroundButton
                    text="Next"
                    bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                    onClick={() => commit(Boolean(autoCorrect))}
                  />
                </>
              )}
            </div>
          </div>
        )}
        <SubjectList isOpen={isSubjectListModalOpen} onClose={() => setIsSubjectListModalOpen(false)} user={user} page="cipher" />
      </div>
    </div>
  );
}

export default Cipher;
