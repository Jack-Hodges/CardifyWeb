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
import Ad from '../../components/Advertisement/Ad';
import { EditableMathField } from 'react-mathquill';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';

function Quiz() {
  // State variables
  const [cards, setCards] = useState([]);
  // randomizedOptions: each card gets an array of option objects: { mode: number, content: string }
  const [randomizedOptions, setRandomizedOptions] = useState([]);
  // selectedAnswers: stores the chosen option for each card index
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [leaveAd, setLeaveAd] = useState("Home");

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser, theme, profile } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor, shadow } = theme;

  // Navigation function to switch to the create page
  const handleSwitchToCreate = () => {
    navigate('/create', { state: { subject } });
  };

  // Load cards and generate randomized options
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
      setSelectedAnswers({});
      randomizeOptions(data);
      setLoading(false);
    };

    loadCards();
  }, [subject, user, getUser]);

  // Randomize options for each card.
  // Mode logic:
  // - If either frontMode or backMode is 1, use math mode (EditableMathField).
  // - If mode is 2 or 3, render as image.
  // - Otherwise, mode 0 uses text rendering via ReactMarkdown.
  const randomizeOptions = (cards) => {
    const optionsPerCard = cards.map((card) => {
      const mode = card.frontMode === 1 || card.backMode === 1 ? 1 : card.backMode;
      // Build the correct option
      const correctOption =
        mode === 2 || mode === 3
          ? { mode, content: card.image_url || '' }
          : { mode, content: card.answer || '' };

      // Build incorrect options from other cards
      const incorrectOptions = cards
        .filter((c) => c.id !== card.id)
        .map((c) => {
          const m = c.frontMode === 1 || c.backMode === 1 ? 1 : c.backMode;
          return m === 2 || m === 3
            ? { mode: m, content: c.image_url || '' }
            : { mode: m, content: c.answer || '' };
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Combine and shuffle the options
      const options = [...incorrectOptions, correctOption].sort(() => Math.random() - 0.5);
      return options;
    });
    setRandomizedOptions(optionsPerCard);
  };

  // Handle answer selection
  const handleAnswerClick = (selectedOption) => {
    if (selectedAnswers[currentCardIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentCardIndex]: selectedOption,
    }));
  };

  // Navigation functions
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

  // Compute quiz results when finished
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
    const roundedPercentage = Math.round(percentage / 5) * 5; // Round to nearest 5%

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

    message = messages[roundedPercentage] || "Good attempt! Keep practicing!";
  }

  return (
    <div className="w-screen h-screen-dynamic relative">
      {/* Fixed background - ensure it covers entire viewport */}
      <div 
        className="fixed inset-0 w-screen h-screen-dynamic bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#') 
            ? theme.image 
            : `url(${theme.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Scrolling content */}
      <div className="relative z-10 min-h-screen-dynamic pb-20">
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
              <div className="mx-auto w-[100vw] min-h-[40vh] h-[40vh] sm:w-[60vw] sm:h-[25vh] mt-5 px-5">
                <Card
                  card={cards[currentCardIndex]}
                  edit={false}
                  user={user}
                  themeShadow={'background-shadow-new'}
                />
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 mx-auto w-[90vw] gap-4 mt-4">
                {randomizedOptions[currentCardIndex]?.map((option, index) => {
                  // Determine the mode for the current card using the same logic:
                  const mode = cards[currentCardIndex].frontMode === 1 || cards[currentCardIndex].backMode === 1
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
                      themeShadow={'background-shadow-new'}
                    />
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 p-4">
                <BackgroundButton
                  text="Previous Card"
                  bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"}
                  wWidth="w-40"
                  onClick={goToPreviousCard}
                  disabled={currentCardIndex === 0}
                />
                <BackgroundButton
                  text={currentCardIndex === cards.length - 1 ? 'Finish Quiz' : 'Next Card'}
                  bgColor={
                    currentCardIndex === cards.length - 1
                      ? 'bg-green-500 hover:bg-green-400'
                      : theme
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
                        : 'bg-purple-500 hover:bg-purple-400'
                  }
                  wWidth="w-40"
                  disabled={!selectedAnswers[currentCardIndex]}
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
            !showAd ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <h2 className={`text-3xl font-bold mb-4 ${shadow ? 'drop-shadow-custom' : ''} ${theme ? theme.textClass : 'textClass'}`}>
                  {message}
                </h2>
                <p className={`text-7xl ${shadow ? 'drop-shadow-custom' : ''} ${theme ? theme.textClass : 'secondaryTextColor'}`}>
                  {percentage.toFixed(0)}%
                </p>
                <div className="flex gap-4 mt-4">
                  <BackgroundButton
                      text="Back to Home"
                      bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"}
                      onClick={() => {
                        if (profile.pro) {
                          navigate('/home');
                        } else {
                          setLeaveAd("Home");
                          setShowAd(true);
                        }
                      }}
                    />
                  <BackgroundButton
                    text={`Try ${subject.name} again`}
                    bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-green-500 hover:bg-green-400"}
                    onClick={() => {
                      if (profile.pro) {
                        setFinished(false);
                        setCurrentCardIndex(0);
                        setSelectedAnswers({});
                        randomizeOptions(cards);
                      } else {
                        setLeaveAd("Retry Quiz");
                        setShowAd(true);
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <h2 className={`text-3xl font-bold mb-4 ${shadow ? 'drop-shadow-custom' : ''} ${theme ? theme.textClass : 'textClass'}`}>
                  Advertisement
                </h2>
                <Ad />
                <BackgroundButton
                  text="Continue"
                  bgColor={theme ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"}
                  delay={5}
                  onClick={() => {
                    setShowAd(false);
                    if (leaveAd === "Home") {
                      navigate('/home');
                    } else {
                      setFinished(false);
                      setCurrentCardIndex(0);
                      setSelectedAnswers({});
                      randomizeOptions(cards);
                    }
                  }}
                />
              </div>
            )
          )
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            {subject ? (
              <div className="flex flex-col justify-center items-center gap-4">
                <p className={`font-bold text-2xl ${shadow ? 'drop-shadow-custom' : ''} ${theme ? theme.textClass : 'textColor'}`}>
                  {subject.name} does not have enough cards.
                </p>
                <p className={`${theme ? theme.textClass : 'textColor'} ${shadow ? 'drop-shadow-custom' : ''}`}>
                  At least 4 cards are required to start a quiz
                </p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-0">
                  <BackgroundButton
                    text="Choose a different subject"
                    bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"}
                    onClick={() => setIsSubjectListModalOpen(true)}
                    wWidth="w-full sm:w-auto mb-3 sm:mb-0"
                  />
                  <BackgroundButton
                    text={`Add cards to ${subject.name}`}
                    bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"}
                    onClick={handleSwitchToCreate}
                    wWidth="w-full sm:w-auto mb-3 sm:mb-0"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center w-full h-full">
                {subject ? (
                  <NoSelectionModal
                    text={`${subject.name} has no flashcards`}
                    text1={`Add Flashcards to ${subject.name}`}
                    action1={handleSwitchToCreate}
                  />
                ) : (
                  <NoSelectionModal
                    text="No subject selected"
                    text1="Select a subject to practice"
                    action1={() => setIsSubjectListModalOpen(true)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
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

// -----------------------------------------------------------------------
// SelectionBox Component
// Renders differently based on the option's mode:
// - Mode 0: Render text with ReactMarkdown.
// - Mode 1: Render an EditableMathField (MathQuill).
// - Modes 2 and 3: Render an image.
// The image is styled to fit inside the selection box.
// -----------------------------------------------------------------------
function SelectionBox({ option, onClick, selectedOption, correctOption, themeShadow }) {
  if (!option) return null;
  const optionContent = option.content || '';
  let boxColor = 'bg-white dark:bg-gray-600';

  if (selectedOption !== undefined) {
    const isSelected = (selectedOption.content || '') === optionContent && selectedOption.mode === option.mode;
    const isCorrect =
      correctOption &&
      (correctOption.content || '') === optionContent &&
      correctOption.mode === option.mode;
    if (isSelected) {
      boxColor = isCorrect ? 'bg-green-400' : 'bg-red-400';
    } else if (isCorrect) {
      boxColor = 'bg-green-200 dark:text-gray-500';
    }
  }

  // Function to determine font size based on content length
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
    <div
      className={`w-full h-auto sm:h-[20vh] ${boxColor} ${themeShadow} background-hover cursor-pointer rounded-xl p-4 text-center flex items-center justify-center font-bold textColor`}
      onClick={onClick}
    >
      <div className="w-full h-full overflow-hidden flex items-center justify-center">
        {option.mode === 2 || option.mode === 3 ? (
          <img
            src={optionContent}
            alt="Answer option"
            className="w-full h-full object-contain"
          />
        ) : option.mode === 1 ? (
          <EditableMathField
            latex={optionContent}
            style={{
              minHeight: '4rem',
              width: '100%',
              backgroundColor: 'transparent',
              color: 'inherit',
              border: 'none',
              pointerEvents: 'none',
              fontSize: optionContent.length > 50 ? '1.5rem' : '2rem',
              fontWeight: 'semibold',
              textAlign: 'center',
            }}
          />
        ) : (
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{ u: ({ node, ...props }) => <u {...props} /> }}
            className={`inline ${getFontSize(optionContent)}`}
          >
            {optionContent}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}