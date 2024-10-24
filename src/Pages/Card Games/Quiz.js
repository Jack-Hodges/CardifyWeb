import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';

function Quiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [randomizedOptions, setRandomizedOptions] = useState([]); // To store randomized options for all cards
  const [selectedAnswers, setSelectedAnswers] = useState({}); // To track selected (wrong) answers and correct answers per card
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser } = useUser();
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const navToCreate = () => {
    navigate('/create', { state: { subject } });
  }

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
      randomizeOptions(data); // Randomize the answers at the start
      setLoading(false);
    };

    loadCards();
  }, [subject, user, getUser]);

  // Function to randomize answers only once for all cards
  const randomizeOptions = (cards) => {
    const optionsPerCard = cards.map(card => {
      const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
      const randomOptions = shuffledCards
        .filter(c => c.id !== card.id)
        .slice(0, 3);
      
      const correctAnswer = card.answer;
      const optionsWithCorrect = [...randomOptions, { answer: correctAnswer }];
      return optionsWithCorrect.sort(() => Math.random() - 0.5); // Shuffle once
    });
    setRandomizedOptions(optionsPerCard); // Store the randomized options for each card
  };

  const handleAnswerClick = (answer, correctAnswer) => {
    // If the card is already answered, prevent changing the answer
    if (selectedAnswers[currentCardIndex]?.selected !== undefined) return;

    // Save the selected (incorrect or correct) answer for the current card, along with the correct answer
    setSelectedAnswers(prev => ({
      ...prev,
      [currentCardIndex]: {
        selected: answer,
        correct: correctAnswer
      }
    }));
  };

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  return (
    <div className="w-screen h-[100dvh] overflow-y-auto">
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
          <>
            <div className="w-full h-full flex flex-col">
              <div className="mx-auto w-4/5 h-4/5 sm:h-3/5 mt-5 px-5">
                <Card
                  frontContent={cards[currentCardIndex]?.question}
                  backContent={cards[currentCardIndex]?.answer}
                  cardId={cards[currentCardIndex]?.id}
                  edit={false}
                  user={user}
                />
              </div>

              <div className="grid grid-cols-2 grid-rows-2 w-4/5 mx-auto gap-4 mt-4">
                {randomizedOptions[currentCardIndex]?.map((option, index) => (
                  <SelectionBox
                    key={index}
                    text={option.answer.slice(0, 50)} // Limit the text to 50 characters
                    correct={option.answer === cards[currentCardIndex].answer}
                    selectedAnswer={selectedAnswers[currentCardIndex]?.selected} // Pass the selected answer for this card
                    correctAnswer={selectedAnswers[currentCardIndex]?.correct} // Pass the correct answer for this card
                    onClick={() => handleAnswerClick(option.answer, cards[currentCardIndex].answer)}
                  />
                ))}
              </div>

              <div className="flex justify-around mt-4 mx-auto gap-4">
                <BackgroundButton text="Previous Card" bgColor={'orange'} wWidth='w-40' onClick={goToPreviousCard} />
                <BackgroundButton text={currentCardIndex === cards.length-1 ? `Finish Quiz` : `Next Card`} bgColor={'purple'} wWidth='w-40' onClick={goToNextCard} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            {subject ? (
              <div className="flex flex-col justify-center items-center gap-4">
                <p className="font-bold text-2xl text-gray-700 dark:text-gray-200">{subject.name} does not have enough cards.</p>
                <p>At least 4 cards are required to start a quiz</p>
                <div className="flex gap-4">
                  <BackgroundButton text={`Choose a different subject`} bgColor={'orange'} onClick={() => setIsSubjectListModalOpen(true)}/>
                  <BackgroundButton text={`Add cards to ${subject.name}`} bgColor={'purple'} onClick={navToCreate}/>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p>No Subject Selected</p>
                <BackgroundButton text="Select a subject" bgColor={'purple'} onClick={() => setIsSubjectListModalOpen(true)}/>
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

function SelectionBox({ text, onClick, selectedAnswer, correctAnswer }) {
  let boxColor = 'bg-white dark:bg-gray-600'; // Default color if no answer is selected

  if (selectedAnswer) {
    if (selectedAnswer === text) {
      // If this is the selected answer, check if it's correct or incorrect
      boxColor = text === correctAnswer ? 'bg-green-400' : 'bg-red-400';
    } else if (text === correctAnswer) {
      // Highlight the correct answer even if it's not the selected one
      boxColor = 'bg-green-200 dark:text-gray-500';
    }
  }

  return (
    <div 
      className={`w-full h-20 ${boxColor} background-shadow background-hover cursor-pointer rounded-xl p-2 flex items-center font-bold text-xl text-gray-700 dark:text-gray-200`} 
      onClick={onClick}
    >
      {text}
    </div>
  );
}