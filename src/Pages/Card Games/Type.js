import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';
import { EditableMathField, addStyles } from 'react-mathquill';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameSettings, { SettingToggle } from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import useGameStudySession from '../../hooks/useGameStudySession';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';
import { answersMatchTyped, gradeTypedTokens, playableCard } from '../../components/Study/gradeAnswer';
import { decodeCloze } from '../../components/Study/cipher';
import SessionSummary from '../../components/Study/SessionSummary';

addStyles();

function Type() {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [cardCount, setCardCount] = useState(20);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(null);
  const [weakIds, setWeakIds] = useState([]);
  const [retryIds, setRetryIds] = useState([]);
  const [started, setStarted] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { shadow, secondaryColor, tertiaryColor, textClass } = theme;
  const textTone = textClass || 'textColor';
  const navigate = useNavigate();
  const study = useGameStudySession('type');

  const handleOpenSubjectListModal = () => setIsSubjectListModalOpen(true);
  const handleSwitchToCreate = () => {
    if (subject) navigate(`/create/${subject.id}`, { state: { subject } });
    else navigate('/create');
  };

  const shuffleCards = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const subjectId = subject?.id ?? null;
  const userId = user?.id ?? null;
  const playableCount = cards.filter((c) => c.backMode !== 3).length;

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }

    if (!subjectId) {
      setCards([]);
      setStarted(false);
      setFinished(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadCards = async () => {
      setLoading(true);
      setStarted(false);
      setFinished(false);
      setShowAnswer(false);
      setUserAnswer('');
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      setCards(data);
      const playable = data.filter((c) => c.backMode !== 3).length || 1;
      setCardCount(Math.max(1, playable));
      setLoading(false);
    };

    loadCards();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, userId]);

  const handleStart = async () => {
    const nonImageCards = cards.filter((card) => card.backMode !== 3 && (!reverse || card.frontMode !== 3));
    const focused = retryIds.length
      ? nonImageCards.filter((card) => retryIds.includes(card.id))
      : nonImageCards;
    const source = focused.length ? focused : nonImageCards;
    let pool = shuffleOn ? shuffleCards(source) : source;
    pool = pool.slice(0, Math.min(cardCount, pool.length));
    setFilteredCards(pool);
    setCurrentCardIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setAutoCorrect(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSkippedCount(0);
    setProcessedCount(0);
    setWeakIds([]);
    setRetryIds([]);
    setSessionStartedAt(Date.now());
    setFinished(false);
    setStarted(true);
    await study.begin(subjectId);
  };

  const currentPlayable = playableCard(filteredCards[currentCardIndex], reverse);
  const expectedAnswer = decodeCloze(currentPlayable?.answer);
  const checkedTokens = useMemo(
    () => (showAnswer ? gradeTypedTokens(userAnswer, expectedAnswer) : []),
    [showAnswer, userAnswer, expectedAnswer]
  );

  const handleAnswerSubmit = () => {
    if (!currentPlayable) return;
    const ok = answersMatchTyped(userAnswer, expectedAnswer);
    setAutoCorrect(ok);
    setShowAnswer(true);
  };

  const handleSkipCard = () => {
    setSkippedCount((s) => s + 1);
    const nextProcessed = processedCount + 1;
    if (nextProcessed >= filteredCards.length) {
      setFinished(true);
    } else {
      setProcessedCount(nextProcessed);
      setCurrentCardIndex((prev) => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setAutoCorrect(null);
    }
  };

  const commitAndAdvance = (ok) => {
    if (ok) setCorrectCount((c) => c + 1);
    else {
      setIncorrectCount((i) => i + 1);
      const id = filteredCards[currentCardIndex]?.id;
      if (id) setWeakIds((ids) => [...new Set([...ids, id])]);
    }
    advanceCard();
  };

  const advanceCard = () => {
    const nextProcessed = processedCount + 1;
    if (nextProcessed >= filteredCards.length) {
      setFinished(true);
    } else {
      setProcessedCount(nextProcessed);
      setCurrentCardIndex((prev) => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setAutoCorrect(null);
    }
  };

  useEffect(() => {
    if (!finished || !started) return undefined;
    study.finish({
      correct: correctCount,
      incorrect: incorrectCount,
      cards_seen: filteredCards.length,
      weak_card_ids: weakIds,
    });
    return undefined;
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const playAgain = () => {
    setFinished(false);
    setStarted(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSkippedCount(0);
    setProcessedCount(0);
    setCurrentCardIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setAutoCorrect(null);
    setWeakIds([]);
  };

  const durationSec = Math.round((Date.now() - sessionStartedAt) / 1000);

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
        <TitleBar text="Type" />

        {loading ? (
          <LoadingSpinner text="Loading Type…" />
        ) : !subject || playableCount === 0 ? (
          <PageEmptyState>
            {subject ? (
              <NoSelectionModal
                text={`${subject.name} has no typeable flashcards`}
                subtext="Add text or math answer cards to play Type."
                text1={`Add Flashcards to ${subject.name}`}
                action1={handleSwitchToCreate}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Pick a subject to start playing Type."
                text1="Select a subject to practice"
                action1={handleOpenSubjectListModal}
              />
            )}
          </PageEmptyState>
        ) : finished ? (
          <SessionSummary
            title="Session complete!"
            correct={correctCount}
            incorrect={incorrectCount}
            cardsSeen={filteredCards.length}
            durationSec={durationSec}
            weakCount={weakIds.length}
            onHome={() => navigate('/home')}
            onStudyAgain={playAgain}
            onRetryWeak={
              weakIds.length
                ? () => {
                    setRetryIds(weakIds);
                    setCardCount(Math.max(1, weakIds.length));
                    playAgain();
                  }
                : undefined
            }
          />
        ) : !started ? (
          <PageEmptyState>
            <GameSettings
              cardCount={cardCount}
              setCardCount={setCardCount}
              maxCards={Math.max(1, playableCount)}
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
          <div className="flex-1 min-h-0 flex flex-col items-center px-3 sm:px-5 pb-4">
            <div className="w-full max-w-4xl">
              <GameHUD
                items={[
                  {
                    key: 'progress',
                    icon: hudIcons.layers,
                    value: `${currentCardIndex + 1}/${filteredCards.length}`,
                    label: 'Progress',
                  },
                  {
                    key: 'correct',
                    icon: hudIcons.check,
                    value: correctCount,
                    hint: 'correct',
                  },
                  {
                    key: 'incorrect',
                    icon: hudIcons.x,
                    value: incorrectCount,
                    hint: 'miss',
                  },
                  {
                    key: 'skip',
                    icon: hudIcons.skip,
                    value: skippedCount,
                    hint: 'skipped',
                  },
                ]}
              />
            </div>

            <div className="w-full max-w-4xl flex-1 min-h-0 flex flex-col">
              <div className="w-full flex-1 min-h-[40vh] mb-4">
                <Card
                  card={currentPlayable}
                  flipped={false}
                  setFlipped={() => {}}
                  animateFlip={false}
                  practice={false}
                />
              </div>

              <div className="w-full max-w-2xl mx-auto mb-4">
                <div
                  className={`bg-white w-full p-3 rounded-2xl min-h-[5.5rem] flex items-center background-shadow-new ${
                    showAnswer
                      ? autoCorrect
                        ? 'ring-4 ring-green-400'
                        : 'ring-4 ring-red-400'
                      : 'focus-within:ring-2 focus-within:ring-[var(--theme-border-color)]'
                  }`}
                >
                  {showAnswer && currentPlayable?.backMode !== 1 ? (
                    <TypedAnswerTokens tokens={checkedTokens} />
                  ) : currentPlayable?.backMode === 1 ? (
                    <EditableMathField
                      latex={userAnswer}
                      onChange={(mathField) => setUserAnswer(mathField.latex())}
                      onKeyUp={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent',
                        color: showAnswer
                          ? autoCorrect
                            ? '#15803d'
                            : '#dc2626'
                          : 'inherit',
                        border: 'none',
                        minHeight: '1.5rem',
                        pointerEvents: showAnswer ? 'none' : 'auto',
                      }}
                      disabled={showAnswer}
                    />
                  ) : (
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAnswerSubmit();
                      }}
                      placeholder="Type your answer here..."
                      className="w-full bg-transparent text-xl text-gray-800 focus:outline-none"
                      disabled={showAnswer}
                    />
                  )}
                </div>
              </div>

              {showAnswer ? (
                <p className={`text-center text-lg font-bold py-2 ${textTone} ${shadow ? 'drop-shadow-custom' : ''}`}>
                  {autoCorrect ? 'Looks right' : 'Not quite'}
                </p>
              ) : null}

              <div className="flex justify-center gap-4">
                {!showAnswer ? (
                  <>
                    <BackgroundButton
                      text="Skip"
                      bgColor={
                        theme
                          ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
                          : 'bg-orange-500 hover:bg-orange-400'
                      }
                      onClick={handleSkipCard}
                    />
                    <BackgroundButton
                      text="Submit"
                      bgColor={
                        theme
                          ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                          : 'bg-purple-500 hover:bg-purple-400'
                      }
                      onClick={handleAnswerSubmit}
                    />
                  </>
                ) : (
                  <>
                    <BackgroundButton
                      text="I was wrong"
                      bgColor="bg-red-500 hover:bg-red-400"
                      onClick={() => commitAndAdvance(false)}
                    />
                    <BackgroundButton
                      text="I was right"
                      bgColor="bg-green-500 hover:bg-green-400"
                      onClick={() => commitAndAdvance(true)}
                    />
                    <BackgroundButton
                      text="Next"
                      bgColor={
                        theme
                          ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                          : 'bg-purple-500 hover:bg-purple-400'
                      }
                      onClick={() => commitAndAdvance(Boolean(autoCorrect))}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <SubjectList
          isOpen={isSubjectListModalOpen}
          onClose={() => setIsSubjectListModalOpen(false)}
          user={user}
          page="type"
        />
      </div>
    </div>
  );
}

function TypedAnswerTokens({ tokens }) {
  if (!tokens?.length) {
    return <p className="w-full text-xl font-bold text-center text-red-600">—</p>;
  }

  return (
    <p className="w-full text-xl sm:text-2xl font-bold text-center leading-relaxed flex flex-wrap justify-center">
      {tokens.map((token, index) => (
        <span
          key={`${token.guess}-${token.expected}-${index}`}
          className={`inline-flex items-baseline align-baseline mx-1 mb-1 px-3 py-1 min-h-[2rem] rounded-xl border-2 bg-white ${
            token.correct
              ? 'border-green-600 text-green-700 shadow-[2px_2px_0_0_#16a34a]'
              : 'border-red-500 text-red-600 shadow-[2px_2px_0_0_#ef4444]'
          }`}
        >
          <span className="font-bold">{token.guess || '—'}</span>
          {!token.correct && token.expected ? (
            <span className="ml-1.5 text-green-700 font-bold">({token.expected})</span>
          ) : null}
        </span>
      ))}
    </p>
  );
}

export default Type;
