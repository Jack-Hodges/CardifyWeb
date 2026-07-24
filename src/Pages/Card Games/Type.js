import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';
import { EditableMathField, addStyles } from 'react-mathquill';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import GameComplete from '../../components/Elements/GameComplete';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameSettings from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';

addStyles();

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

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
  const [started, setStarted] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { shadow, secondaryColor, tertiaryColor, primaryColor, textClass } = theme;
  const textTone = textClass || 'textColor';
  const navigate = useNavigate();

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

  const handleStart = () => {
    const nonImageCards = cards.filter((card) => card.backMode !== 3);
    let pool = shuffleOn ? shuffleCards(nonImageCards) : nonImageCards;
    pool = pool.slice(0, Math.min(cardCount, pool.length));
    setFilteredCards(pool);
    setCurrentCardIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSkippedCount(0);
    setProcessedCount(0);
    setSessionStartedAt(Date.now());
    setFinished(false);
    setStarted(true);
  };

  const handleAnswerSubmit = () => {
    if (!filteredCards[currentCardIndex]) return;
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
    }
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
    }
  };

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
  };

  const graded = correctCount + incorrectCount;
  const accuracy = graded > 0 ? Math.round((correctCount / graded) * 100) : 0;
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
          <GameComplete
            title="Session complete!"
            primaryText="Back to Home"
            onPrimary={() => navigate('/home')}
            secondaryText="Play again"
            onSecondary={playAgain}
          >
            <p className={`${textTone} text-xl font-semibold ${shadow ? 'drop-shadow-custom' : ''}`}>
              {correctCount} correct · {incorrectCount} incorrect · {skippedCount} skipped
            </p>
            <p className={`${textTone} text-base opacity-80 mt-2 ${shadow ? 'drop-shadow-custom' : ''}`}>
              {accuracy}% accuracy · {formatTime(durationSec)}
            </p>
          </GameComplete>
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
            />
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

            <div
              className={`w-full max-w-4xl flex-1 min-h-0 flex flex-col transition-opacity duration-300 ${
                showAnswer ? 'opacity-100' : 'opacity-100'
              }`}
            >
              {!showAnswer ? (
                <div className="w-full flex-1 min-h-[40vh] mb-4">
                  <Card
                    card={filteredCards[currentCardIndex]}
                    flipped={false}
                    setFlipped={() => {}}
                    animateFlip={false}
                    practice={false}
                  />
                </div>
              ) : (
                <div className="w-full flex-1 min-h-0 flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                  <RevealPanel
                    label="Answer"
                    labelClass={primaryColor?.bgClass || 'bg-green-500'}
                  >
                    {filteredCards[currentCardIndex].backMode === 1 ? (
                      <EditableMathField
                        latex={filteredCards[currentCardIndex].answer}
                        style={{
                          minHeight: '3rem',
                          width: '100%',
                          backgroundColor: 'transparent',
                          color: 'inherit',
                          border: 'none',
                          pointerEvents: 'none',
                          fontSize: '1.75rem',
                          fontWeight: 'semibold',
                        }}
                      />
                    ) : (
                      <SafeMarkdown
                        components={{ u: ({ node, ...props }) => <u {...props} /> }}
                        className="text-xl sm:text-3xl text-gray-800 font-bold text-center"
                      >
                        {filteredCards[currentCardIndex].answer}
                      </SafeMarkdown>
                    )}
                  </RevealPanel>

                  <RevealPanel
                    label="Your answer"
                    labelClass={secondaryColor?.bgClass || 'bg-purple-500'}
                  >
                    {filteredCards[currentCardIndex].backMode === 1 ? (
                      <EditableMathField
                        latex={userAnswer}
                        style={{
                          minHeight: '3rem',
                          width: '100%',
                          backgroundColor: 'transparent',
                          color: 'inherit',
                          border: 'none',
                          pointerEvents: 'none',
                          fontSize: '1.75rem',
                          fontWeight: 'semibold',
                        }}
                      />
                    ) : (
                      <SafeMarkdown
                        components={{ u: ({ node, ...props }) => <u {...props} /> }}
                        className="text-xl sm:text-3xl text-gray-800 font-bold text-center"
                      >
                        {userAnswer || '—'}
                      </SafeMarkdown>
                    )}
                  </RevealPanel>
                </div>
              )}

              {!showAnswer && (
                <div className="w-full max-w-2xl mx-auto mb-4">
                  <div className="bg-white w-full p-3 rounded-2xl min-h-[5.5rem] flex items-center background-shadow-new focus-within:ring-2 focus-within:ring-[var(--theme-border-color)]">
                    {filteredCards[currentCardIndex].backMode === 1 ? (
                      <EditableMathField
                        latex={userAnswer}
                        onChange={(mathField) => setUserAnswer(mathField.latex())}
                        onKeyUp={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'transparent',
                          color: 'inherit',
                          border: 'none',
                          minHeight: '1.5rem',
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
              )}

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
                      text="Incorrect"
                      bgColor="bg-red-500 hover:bg-red-400"
                      onClick={() => {
                        setIncorrectCount((i) => i + 1);
                        advanceCard();
                      }}
                    />
                    <BackgroundButton
                      text="Correct"
                      bgColor="bg-green-500 hover:bg-green-400"
                      onClick={() => {
                        setCorrectCount((c) => c + 1);
                        advanceCard();
                      }}
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

function RevealPanel({ label, labelClass, children }) {
  return (
    <div className="relative flex-1 min-h-[12rem] flex bg-white background-shadow-new p-5 pt-10 rounded-2xl items-center justify-center overflow-auto">
      <span
        className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-sm font-bold background-shadow-new ${labelClass}`}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export default Type;
