import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

function Quiz() {
  // State variables
  const [cards, setCards] = useState([]);
  const [randomizedOptions, setRandomizedOptions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser, theme } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor } = theme;

  // Navigation function
  const navToCreate = () => {
    navigate('/create', { state: { subject } });
  };

  // Load cards and randomize options
  useEffect(() => {
    if (!user) {
      getUser();
      return;
    }

    if (!subject) {
      setCards([]);
      setLoading(false);
      return;
    }

    const loadCards = async () => {
      setLoading(true);
      const data = await fetchCards(subject.id);
      sortCardsById(data);
      setCards(data);
      randomizeOptions(data);
      setLoading(false);
    };

    loadCards();
  }, [subject, user, getUser]);

  // Randomize options for each card
  const randomizeOptions = (cards) => {
    const optionsPerCard = cards.map((card) => {
      const incorrectAnswers = cards
        .filter((c) => c.id !== card.id)
        .map((c) => c.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [...incorrectAnswers, card.answer].sort(() => Math.random() - 0.5);
      return options;
    });
    setRandomizedOptions(optionsPerCard);
  };

  // Handle answer selection
  const handleAnswerClick = (selectedAnswer) => {
    if (selectedAnswers[currentCardIndex] !== undefined) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentCardIndex]: selectedAnswer,
    }));
  };

  // Navigation between cards
  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  // Compute quiz results
  let correctCount = 0;
  let incorrectCount = 0;
  let percentage = 0;
  let message = '';

  if (finished) {
    cards.forEach((card, index) => {
      const selectedAnswer = selectedAnswers[index];
      if (selectedAnswer === card.answer) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    });

    const totalAnswered = correctCount + incorrectCount;
    percentage = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    const roundedPercentage = Math.round(percentage / 5) * 5; // Round to nearest 5%

    // Define unique messages for each 5% increment with emojis at the end
    const messages = {
      0: "Don't worry, keep trying! 😕",
      5: "A rough start, but don't give up! 😟",
      10: "Review the material, you can do it! 📖",
      15: "Keep studying, progress awaits! 📚",
      20: "Practice makes perfect, keep going! 📝",
      25: "You're getting the hang of it! 👍",
      30: "Good effort, continue practicing! 💪",
      35: "Nice work, you're improving! 👏",
      40: "Steady progress, well done! 😊",
      45: "Halfway there, keep pushing! 🚀",
      50: "Great job, you're halfway! 🎯",
      55: "More than halfway, excellent! 🥳",
      60: "You're doing well, keep it up! 🌟",
      65: "Impressive work, almost there! 🎉",
      70: "Fantastic effort, keep shining! ✨",
      75: "Excellent performance, well done! 🏅",
      80: "You're mastering this! 🎓",
      85: "Outstanding, keep up the great work! 🏆",
      90: "Almost perfect, amazing job! 🌟",
      95: "So close to perfection! 🌠",
      100: "Perfect score! Outstanding! 🎉",
    };

    // Get the message based on the rounded percentage
    message = messages[roundedPercentage] || "Good attempt! Keep practicing!";

    // Ensure message is different for each 5% increment
  }

  return (
    <div className="w-screen h-[100dvh] overflow-y-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
      <TitleBar text="Quiz" />

      <div className="block sm:flex w-full h-full">
        {loading ? (
          <div className="flex w-full h-full justify-center items-center">
            <div className="animate-pulse space-y-4 w-[70%] h-full">
              <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-12 w-3/4 rounded"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-12 w-1/2 rounded"></div>
            </div>
          </div>
        ) : cards.length >= 4 ? (
          !finished ? (
            <div className="w-full h-full flex flex-col">
              <div className="mx-auto w-full h-2/5 sm:h-3/5 mt-5 px-5">
                <Card
                  frontContent={cards[currentCardIndex]?.question}
                  backContent={cards[currentCardIndex]?.answer}
                  cardId={cards[currentCardIndex]?.id}
                  edit={false}
                  user={user}
                  themeShadow={theme ? theme.shadowClass : 'background-shadow'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 w-4/5 mx-auto gap-4 mt-4">
                {randomizedOptions[currentCardIndex]?.map((option, index) => (
                  <SelectionBox
                    key={index}
                    text={option.slice(0, 50)}
                    correctAnswer={cards[currentCardIndex].answer}
                    selectedAnswer={selectedAnswers[currentCardIndex]}
                    onClick={() => handleAnswerClick(option)}
                    themeShadow={theme ? theme.shadowClass : 'background-shadow'}
                  />
                ))}
              </div>

              <div className="flex justify-around mt-4 mx-auto gap-4">
                <BackgroundButton
                  text="Previous Card"
                  bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"}
                  wWidth="w-40"
                  onClick={goToPreviousCard}
                />
                <BackgroundButton
                  text={currentCardIndex === cards.length - 1 ? 'Finish Quiz' : 'Next Card'}
                  bgColor={currentCardIndex === cards.length - 1 ? 'bg-green-500 hover:bg-green-400' : theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : 'bg-purple-500 hover:bg-purple-400'}
                  wWidth="w-40"
                  disabled={!selectedAnswers[currentCardIndex]} // Disable button if no answer is selected
                  onClick={() => {
                    if (currentCardIndex === cards.length - 1) {
                      setFinished(true);
                    } else {
                      goToNextCard();
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <h2 className={`text-3xl font-bold mb-4 drop-shadow-custom ${theme ? theme.textClass : 'textClass'}`}>{message}</h2>
              <p className={`text-7xl drop-shadow-custom ${theme ? theme.textClass : 'secondaryTextColor'}`}>{percentage.toFixed(0)}%</p>
              <div className="flex gap-4 mt-4">
                <BackgroundButton
                  text="Retry Quiz"
                  bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-green-500 hover:bg-green-400"}
                  onClick={() => {
                    setFinished(false);
                    setCurrentCardIndex(0);
                    setSelectedAnswers({});
                    randomizeOptions(cards);
                  }}
                />
                <BackgroundButton
                  text="Go to Home"
                  bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"}
                  onClick={() => navigate('/home')}
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            {subject ? (
              <div className="flex flex-col justify-center items-center gap-4">
                <p className={`font-bold text-2xl drop-shadow-custom ${theme ? theme.textClass : 'textColor'}`}>
                  {subject.name} does not have enough cards.
                </p>
                <p className="textColor drop-shadow-custom">At least 4 cards are required to start a quiz</p>
                <div className="flex gap-4">
                  <BackgroundButton
                    text="Choose a different subject"
                    bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"}
                    onClick={() => setIsSubjectListModalOpen(true)}
                  />
                  <BackgroundButton
                    text={`Add cards to ${subject.name}`}
                    bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"}
                    onClick={navToCreate}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center drop-shadow-custom`}>No subject selected</p>
                <div className="flex justify-center gap-4 mt-5 mx-auto">
                <BackgroundButton
                  text="Select a subject"
                  bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : 'bg-purple-500 hover:bg-purple-400'}
                  onClick={() => setIsSubjectListModalOpen(true)}
                  wWidth='w-full sm:w-auto'
                />
                </div>
              </div>
            )}
          </div>
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

function SelectionBox({ text, onClick, selectedAnswer, correctAnswer, themeShadow }) {
  let boxColor = 'bg-white dark:bg-gray-600';

  if (selectedAnswer !== undefined) {
    if (selectedAnswer === text) {
      boxColor = text === correctAnswer ? 'bg-green-400' : 'bg-red-400';
    } else if (text === correctAnswer) {
      boxColor = 'bg-green-200 dark:text-gray-500';
    }
  }

  return (
    <div
      className={`w-full h-20 ${boxColor} ${themeShadow ? themeShadow : 'background-shadow'} background-hover cursor-pointer rounded-xl p-2 flex items-center font-bold text-xl textColor`}
      onClick={onClick}
    >
      <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{ u: ({ node, ...props }) => <u {...props} /> }}
          className="inline"
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}