import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import Ad from '../../components/Advertisement/Ad';
import { EditableMathField } from 'react-mathquill';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import SessionSummary from '../../components/Study/SessionSummary';
import GameSettings from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';

function quizMessage(percentage) {
  if (percentage >= 90) return 'Outstanding work';
  if (percentage >= 75) return 'Great session';
  if (percentage >= 50) return 'Solid progress';
  if (percentage >= 25) return 'Keep practicing';
  return 'Review and try again';
}

function Quiz() {
  const [allCards, setAllCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [randomizedOptions, setRandomizedOptions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [leaveAd, setLeaveAd] = useState('Home');
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [cardCount, setCardCount] = useState(10);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [started, setStarted] = useState(false);

  const navigate = useNavigate();
  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme, profile } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor, shadow, textClass } = theme;
  const textTone = textClass || 'textColor';

  const handleSwitchToCreate = () => {
    if (subject) navigate(`/create/${subject.id}`, { state: { subject } });
    else navigate('/create');
  };

  const subjectId = subject?.id ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }

    if (!subjectId) {
      setAllCards([]);
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
      setSelectedAnswers({});
      setCurrentCardIndex(0);
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      sortCardsById(data);
      setAllCards(data);
      setCardCount(Math.max(1, data.length || 1));
      setLoading(false);
    };

    loadCards();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, userId]);

  const handleStart = () => {
    let pool = [...allCards];
    if (shuffleOn) pool = [...pool].sort(() => 0.5 - Math.random());
    pool = pool.slice(0, Math.min(cardCount, pool.length));
    setCards(pool);
    setSelectedAnswers({});
    setCurrentCardIndex(0);
    randomizeOptions(pool);
    setSessionStartedAt(Date.now());
    setFinished(false);
    setStarted(true);
  };

  const randomizeOptions = (cardsPool) => {
    const optionsPerCard = cardsPool.map((card) => {
      const mode = card.frontMode === 1 || card.backMode === 1 ? 1 : card.backMode;
      const correctOption =
        mode === 2 || mode === 3
          ? { mode, content: card.image_url || '' }
          : { mode, content: card.answer || '' };

      const incorrectOptions = cardsPool
        .filter((c) => c.id !== card.id)
        .map((c) => {
          const m = c.frontMode === 1 || c.backMode === 1 ? 1 : c.backMode;
          return m === 2 || m === 3
            ? { mode: m, content: c.image_url || '' }
            : { mode: m, content: c.answer || '' };
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      return [...incorrectOptions, correctOption].sort(() => Math.random() - 0.5);
    });
    setRandomizedOptions(optionsPerCard);
  };

  const handleAnswerClick = (selectedOption) => {
    if (selectedAnswers[currentCardIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentCardIndex]: selectedOption,
    }));
  };

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) setCurrentCardIndex((prev) => prev - 1);
  };

  const goToNextCard = () => {
    if (currentCardIndex < cards.length - 1) setCurrentCardIndex((prev) => prev + 1);
  };

  let correctCount = 0;
  let incorrectCount = 0;
  let percentage = 0;
  let message = '';

  if (finished) {
    cards.forEach((card, index) => {
      const selectedOption = selectedAnswers[index];
      const mode = card.frontMode === 1 || card.backMode === 1 ? 1 : card.backMode;
      const correctOption =
        mode === 2 || mode === 3
          ? { mode, content: card.image_url }
          : { mode, content: card.answer };
      if (
        selectedOption &&
        selectedOption.content === correctOption.content &&
        selectedOption.mode === correctOption.mode
      ) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    });

    const totalAnswered = correctCount + incorrectCount;
    percentage = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    message = quizMessage(percentage);
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const liveCorrect = Object.entries(selectedAnswers).reduce((acc, [idx, selected]) => {
    const card = cards[Number(idx)];
    if (!card || !selected) return acc;
    const mode = card.frontMode === 1 || card.backMode === 1 ? 1 : card.backMode;
    const correct =
      mode === 2 || mode === 3
        ? { mode, content: card.image_url }
        : { mode, content: card.answer };
    return selected.content === correct.content && selected.mode === correct.mode
      ? acc + 1
      : acc;
  }, 0);

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
        <TitleBar text="Quiz" />

        {loading ? (
          <LoadingSpinner text="Loading quiz..." />
        ) : allCards.length >= 4 ? (
          !started ? (
            <PageEmptyState>
              <GameSettings
                cardCount={cardCount}
                setCardCount={setCardCount}
                maxCards={allCards.length}
                shuffle={shuffleOn}
                setShuffle={setShuffleOn}
                showTimer={false}
                onStart={handleStart}
              />
            </PageEmptyState>
          ) : !finished ? (
            <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-5 pb-3">
              <GameHUD
                items={[
                  {
                    key: 'progress',
                    icon: hudIcons.layers,
                    value: `${currentCardIndex + 1}/${cards.length}`,
                    label: 'Progress',
                  },
                  {
                    key: 'answered',
                    icon: hudIcons.check,
                    value: answeredCount,
                    hint: 'answered',
                    label: 'Answered',
                  },
                  {
                    key: 'correct',
                    icon: hudIcons.zap,
                    value: liveCorrect,
                    hint: 'correct',
                    label: 'Correct so far',
                  },
                ]}
              />

              <div className="mx-auto w-full max-w-3xl h-[44vh] sm:h-[42vh] shrink-0 px-1">
                <Card
                  card={cards[currentCardIndex]}
                  edit={false}
                  user={user}
                  themeShadow="background-shadow-new"
                />
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-2.5 sm:gap-3 max-w-4xl w-full mx-auto mt-3 auto-rows-fr">
                {randomizedOptions[currentCardIndex]?.map((option, index) => {
                  const mode =
                    cards[currentCardIndex].frontMode === 1 ||
                    cards[currentCardIndex].backMode === 1
                      ? 1
                      : cards[currentCardIndex].backMode;
                  const correctOption =
                    mode === 2 || mode === 3
                      ? { mode, content: cards[currentCardIndex].image_url }
                      : { mode, content: cards[currentCardIndex].answer };
                  return (
                    <SelectionBox
                      key={index}
                      option={option}
                      correctOption={correctOption}
                      selectedOption={selectedAnswers[currentCardIndex]}
                      onClick={() => handleAnswerClick(option)}
                    />
                  );
                })}
              </div>

              <div className="flex justify-center gap-4 pt-3 shrink-0">
                <BackgroundButton
                  text="Previous"
                  bgColor={
                    theme
                      ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                      : 'bg-orange-500 hover:bg-orange-400'
                  }
                  wWidth="w-36"
                  onClick={goToPreviousCard}
                  disabled={currentCardIndex === 0}
                />
                <BackgroundButton
                  text={currentCardIndex === cards.length - 1 ? 'Finish' : 'Next'}
                  bgColor={
                    currentCardIndex === cards.length - 1
                      ? 'bg-green-500 hover:bg-green-400'
                      : theme
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
                        : 'bg-purple-500 hover:bg-purple-400'
                  }
                  wWidth="w-36"
                  disabled={!selectedAnswers[currentCardIndex]}
                  onClick={() => {
                    if (currentCardIndex === cards.length - 1) setFinished(true);
                    else goToNextCard();
                  }}
                />
              </div>
            </div>
          ) : !showAd ? (
            <SessionSummary
              title={`${message} · ${Math.round(percentage)}%`}
              correct={correctCount}
              incorrect={incorrectCount}
              cardsSeen={cards.length}
              durationSec={Math.round((Date.now() - sessionStartedAt) / 1000)}
              weakCount={incorrectCount}
              onHome={() => {
                if (profile.pro) navigate('/home');
                else {
                  setLeaveAd('Home');
                  setShowAd(true);
                }
              }}
              onStudyAgain={() => {
                if (profile.pro) {
                  setFinished(false);
                  setStarted(false);
                  setCurrentCardIndex(0);
                  setSelectedAnswers({});
                } else {
                  setLeaveAd('Retry Quiz');
                  setShowAd(true);
                }
              }}
            />
          ) : (
            <PageEmptyState>
              <h2
                className={`text-3xl font-bold mb-4 ${shadow ? 'drop-shadow-custom' : ''} ${textTone}`}
              >
                Advertisement
              </h2>
              <Ad />
              <BackgroundButton
                text="Continue"
                bgColor={
                  theme
                    ? `${primaryColor.bgClass} ${primaryColor.hoverClass}`
                    : 'bg-purple-500 hover:bg-purple-400'
                }
                delay={5}
                onClick={() => {
                  setShowAd(false);
                  if (leaveAd === 'Home') navigate('/home');
                  else {
                    setFinished(false);
                    setStarted(false);
                    setCurrentCardIndex(0);
                    setSelectedAnswers({});
                  }
                }}
              />
            </PageEmptyState>
          )
        ) : (
          <PageEmptyState>
            {subject ? (
              <NoSelectionModal
                text={`${subject.name} doesn't have enough cards`}
                subtext="At least 4 cards are required to start a quiz."
                text1="Choose a different subject"
                action1={() => setIsSubjectListModalOpen(true)}
                text2={`Add cards to ${subject.name}`}
                action2={handleSwitchToCreate}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Pick a subject to start the quiz."
                text1="Select a subject to practice"
                action1={() => setIsSubjectListModalOpen(true)}
              />
            )}
          </PageEmptyState>
        )}
      </div>

      <SubjectList
        isOpen={isSubjectListModalOpen}
        onClose={() => setIsSubjectListModalOpen(false)}
        user={user}
        page="quiz"
      />
    </div>
  );
}

export default Quiz;

function SelectionBox({ option, onClick, selectedOption, correctOption }) {
  if (!option) return null;
  const optionContent = option.content || '';
  let boxColor = 'bg-white';
  let borderExtra = '';

  if (selectedOption !== undefined) {
    const isSelected =
      (selectedOption.content || '') === optionContent && selectedOption.mode === option.mode;
    const isCorrect =
      correctOption &&
      (correctOption.content || '') === optionContent &&
      correctOption.mode === option.mode;
    if (isSelected) {
      boxColor = isCorrect ? 'bg-green-400' : 'bg-red-400';
    } else if (isCorrect) {
      boxColor = 'bg-green-100';
      borderExtra = 'ring-2 ring-green-500';
    }
  }

  const getFontSize = (content) => {
    if (!content) return 'text-lg';
    const length = content.length;
    if (length > 200) return 'text-sm';
    if (length > 100) return 'text-base';
    if (length > 50) return 'text-lg';
    if (length > 20) return 'text-xl';
    return 'text-2xl';
  };

  return (
    <button
      type="button"
      className={`w-full h-full min-h-[3.5rem] ${boxColor} background-shadow-new background-hover
        cursor-pointer rounded-2xl p-3 sm:p-4 text-center flex items-center justify-center font-bold text-gray-800
        ${borderExtra}`}
      onClick={onClick}
    >
      <div className="w-full h-full overflow-hidden flex items-center justify-center">
        {option.mode === 2 || option.mode === 3 ? (
          <img
            src={optionContent}
            alt="Answer option"
            className="w-full h-full max-h-28 object-contain"
          />
        ) : option.mode === 1 ? (
          <EditableMathField
            latex={optionContent}
            style={{
              minHeight: '3rem',
              width: '100%',
              backgroundColor: 'transparent',
              color: 'inherit',
              border: 'none',
              pointerEvents: 'none',
              fontSize: optionContent.length > 50 ? '1.25rem' : '1.75rem',
              fontWeight: 'semibold',
              textAlign: 'center',
            }}
          />
        ) : (
          <SafeMarkdown
            components={{ u: ({ node, ...props }) => <u {...props} /> }}
            className={`inline ${getFontSize(optionContent)}`}
          >
            {optionContent}
          </SafeMarkdown>
        )}
      </div>
    </button>
  );
}
