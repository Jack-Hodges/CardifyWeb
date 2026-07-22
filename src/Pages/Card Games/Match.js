import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import TitleBar from '../../components/Navigation/TitleBar';
import SubjectList from '../../components/Subject/SubjectList';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameComplete from '../../components/Elements/GameComplete';
import GameSettings from '../../components/Games/GameSettings';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';

function Match() {
  const [allCards, setAllCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerSec, setTimerSec] = useState(60);
  const [cardCount, setCardCount] = useState(12);
  const [shuffle, setShuffle] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const { shadow } = theme;
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const setupNewRound = useCallback(() => {
    if (cards.length < 4) return;

    const randomIndex = Math.floor(Math.random() * cards.length);
    const newCurrentCard = cards[randomIndex];
    setCurrentCard(newCurrentCard);

    const availableCards = cards.filter((card) => card.id !== newCurrentCard.id);
    const wrongOptions = [...availableCards].sort(() => 0.5 - Math.random()).slice(0, 2);

    const allOptions = [...wrongOptions, newCurrentCard].sort(() => 0.5 - Math.random());

    setOptions(allOptions);
    setSelectedOption(null);
    setIsCorrect(null);
  }, [cards]);

  useEffect(() => {
    if (!user) {
      getUser();
      return;
    }
    if (!subject) {
      setAllCards([]);
      setCards([]);
      return;
    }
    (async () => {
      const data = await fetchCards(subject.id);
      setAllCards(data);
      setCardCount(Math.min(12, data.length || 1));
    })();
  }, [subject, user, getUser]);

  useEffect(() => {
    if (started && cards.length >= 4) {
      setupNewRound();
    }
  }, [started, cards, setupNewRound]);

  useEffect(() => {
    if (!started || finished) return undefined;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, finished]);

  const handleStart = () => {
    let pool = [...allCards];
    if (shuffle) pool = pool.sort(() => 0.5 - Math.random());
    pool = pool.slice(0, Math.min(cardCount, pool.length));
    setCards(pool);
    setScore(0);
    setMisses(0);
    setTimeLeft(timerSec);
    setFinished(false);
    setStarted(true);
  };

  const handleOptionSelect = (selectedCard) => {
    if (selectedOption || finished) return;

    setSelectedOption(selectedCard);
    const correct = selectedCard.id === currentCard.id;
    setIsCorrect(correct);

    if (correct) setScore((prev) => prev + 1);
    else setMisses((prev) => prev + 1);

    setTimeout(() => {
      if (!finished) setupNewRound();
    }, 1200);
  };

  const playAgain = () => {
    setStarted(false);
    setFinished(false);
  };

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{
        background:
          theme.image.startsWith('url(') ||
          theme.image.startsWith('linear-gradient') ||
          theme.image.startsWith('#')
            ? theme.image
            : `url(${theme.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="hidden sm:block fixed inset-0 w-screen h-[100lvh] sm:h-screen bg-cover bg-center bg-no-repeat z-0"
        style={{
          background:
            theme.image.startsWith('url(') ||
            theme.image.startsWith('linear-gradient') ||
            theme.image.startsWith('#')
              ? theme.image
              : `url(${theme.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 min-h-[100lvh] sm:min-h-screen pb-20">
        <TitleBar text="Match" />

        {!subject || allCards.length < 4 ? (
          <PageEmptyState>
            {subject ? (
              <NoSelectionModal
                text="Need at least 4 flashcards to play"
                subtext={`Add more cards to ${subject.name} to start a Match game.`}
                text1={`Add More Flashcards to ${subject.name}`}
                action1={() => navigate(`/create/${subject.id}`, { state: { subject } })}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Pick a subject to start playing Match."
                text1="Select a subject to practice"
                action1={() => setIsSubjectListModalOpen(true)}
              />
            )}
          </PageEmptyState>
        ) : finished ? (
          <GameComplete
            title="Time's up!"
            primaryText="Back to Home"
            onPrimary={() => navigate('/home')}
            secondaryText="Play again"
            onSecondary={playAgain}
          >
            <p className={`${theme ? theme.textClass : 'textColor'} text-xl font-semibold`}>
              Score: {score} · Missed: {misses}
            </p>
          </GameComplete>
        ) : !started ? (
          <PageEmptyState>
            <GameSettings
              cardCount={cardCount}
              setCardCount={setCardCount}
              maxCards={allCards.length}
              timerSec={timerSec}
              setTimerSec={setTimerSec}
              shuffle={shuffle}
              setShuffle={setShuffle}
              onStart={handleStart}
            />
          </PageEmptyState>
        ) : (
          <div className="flex flex-col items-center p-4">
            <div className="flex justify-between w-full max-w-2xl mb-8">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6" />
                <span className={`${theme ? theme.textClass : 'textColor'} text-xl`}>
                  Score: {score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-6 h-6" />
                <span className={`${theme ? theme.textClass : 'textColor'} text-xl`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            <div
              className={`w-full max-w-2xl p-6 mb-8 rounded-lg ${theme ? theme.cardClass : 'bg-white'} ${shadow ? 'shadow-lg' : ''}`}
            >
              <SafeMarkdown className={`${theme ? theme.textClass : 'textColor'}`}>
                {currentCard?.question}
              </SafeMarkdown>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-lg transition-all ${
                    selectedOption === option
                      ? isCorrect
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : theme
                        ? theme.cardClass
                        : 'bg-white'
                  } ${shadow ? 'shadow-lg' : ''} ${selectedOption === null ? 'hover:scale-105' : ''}`}
                >
                  <SafeMarkdown className={`${theme ? theme.textClass : 'textColor'}`}>
                    {option.answer}
                  </SafeMarkdown>
                </button>
              ))}
            </div>
          </div>
        )}

        <SubjectList
          isOpen={isSubjectListModalOpen}
          onClose={() => setIsSubjectListModalOpen(false)}
          user={user}
          page="match"
        />
      </div>
    </div>
  );
}

export default Match;
