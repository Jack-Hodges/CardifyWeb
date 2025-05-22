import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCards, sortCardsById } from "../components/Card/CardManipulation";
import Card from "../components/Card/Card";
import CardControls from "../components/Card/CardControls";
import TitleBar from '../components/Navigation/TitleBar';
import { useLocation } from 'react-router-dom';
import { useUser } from '../UserContext';
import BackgroundButton from '../components/Elements/BackgroundButton';
import SubjectList from '../components/Subject/SubjectList';
import { useNavigate } from 'react-router-dom';
import { saveSubject } from '../components/Subject/SubjectManipulation';
import Modal from '../components/Modal/Modal';
import confetti from "canvas-confetti"; // Import the confetti library

function FlashcardQuiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animateFlip] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser, theme } = useUser();
  const { secondaryColor, tertiaryColor, shadow } = theme;

  const navigate = useNavigate();

  const currentCardIndexRef = useRef(currentCardIndex);
  const cardsLengthRef = useRef(cards.length);

  const [isModalOpen, setIsModalOpen] = useState(false); // To control the modal

  const [finished, setFinished] = useState(false);

  // Function to handle closing the modal with animation
  const handleClose = () => {
    setTimeout(() => {
      setIsModalOpen(false);
    }, 100); // Match this duration with your transition timing (300ms in this case)
  };

  const handleExitBeforeCompletion = useCallback(() => {
    if (currentCardIndexRef.current > 0 && currentCardIndexRef.current < cardsLengthRef.current - 1) {
      saveSubject(subject.id, subject.name, subject.bgCol, subject.colourIntensity, user.id, currentCardIndexRef.current, subject.collection_id, subject.pinned);
    } else if (subject) {
      saveSubject(subject.id, subject.name, subject.bgCol, subject.colourIntensity, user.id, null, subject.collection_id, subject.pinned);
    }
  }, [currentCardIndexRef, cardsLengthRef, subject, user]);

  useEffect(() => {
    // Keep currentCardIndexRef in sync with currentCardIndex
    currentCardIndexRef.current = currentCardIndex;
  }, [currentCardIndex]);

  useEffect(() => {
    // Keep cardsLengthRef in sync with cards length
    cardsLengthRef.current = cards.length;
  }, [cards]);

  useEffect(() => {
    if (subject && subject.up_to_index !== null) {
      setIsModalOpen(true);
    }
  }, [subject, subject?.up_to_index]);

  useEffect(() => {
    if (!user) {
      getUser();
      return;
    }

    // Only fetch cards if there is a valid subject and cards are not already loaded
    if (subject && cards.length === 0) {
      const loadCards = async () => {
        setLoading(true);
        const data = await fetchCards(subject.id);
        if (data.length > 0) {
          sortCardsById(data);
          setCards(data);
        }
        setLoading(false);
      };

      loadCards();
    } else if (!subject) {
      setCards([]); // Clear cards if there's no subject
      setLoading(false);
    }

    // The return function is the cleanup function that runs when the component is unmounted
    return () => {
      handleExitBeforeCompletion();
    };
  }, [subject, user, getUser, cards.length, handleExitBeforeCompletion]);

  // Trigger confetti when finished becomes true
  useEffect(() => {
    if (finished) {
      confetti({
        particleCount: 300,
        spread: 100,
        origin: { y: 0.5 },
        gravity: 0.9
      });
    }
  }, [finished]);

  // Delay changing the card until after the flip animation (300ms)
  const handleNextCard = () => {
    if (flipped) {
      // If viewing answer, flip back then change card after animation
      setFlipped(false);
      setTimeout(() => {
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
        } else {
          setFinished(true);
        }
      }, 300);
    } else {
      // If on question side, go to next card immediately
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        setFinished(true);
      }
    }
  };

  const handlePrevCard = () => {
    if (flipped) {
      // If viewing answer, flip back then go to previous card after animation
      setFlipped(false);
      setTimeout(() => {
        if (currentCardIndex > 0) {
          setCurrentCardIndex(currentCardIndex - 1);
        } else {
          setCurrentCardIndex(cards.length - 1);
        }
      }, 300);
    } else {
      // If on question side, go to previous card immediately
      if (currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      } else {
        setCurrentCardIndex(cards.length - 1);
      }
    }
  };

  return (
    <div className="w-screen h-[100dvh] bg-cover bg-screen overflow-y-auto" style={{ backgroundImage: theme ? theme.image : ''}}>
      <TitleBar text="Practice" />

      <div className="flex w-full h-full">

        {!finished ? (
          <div className="w-full sm:w-4/5 h-[90%] sm:h-full flex flex-col mt-5 mx-auto">
            <div className="w-full h-[85%] sm:h-[70%] mt-4 px-5">

              {/* Use the Modal component here */}
              <Modal 
                isOpen={isModalOpen}
                onFirstAction={() => {
                  setCurrentCardIndex(0); // Start from the beginning
                  handleClose();
                }}
                onSecondAction={() => {
                  setCurrentCardIndex(subject?.up_to_index); // Continue from last saved progress
                  handleClose();
                }}
                text="Continue where you left off?"
                mainText={`You were up to card ${subject?.up_to_index + 1}. Would you like to continue from there?`}
                firstActionText="No, start over"
                secondActionText="Yes, continue"
                firstActionCol={"bg-gray-500 hover:bg-gray-400"}
                secondActionCol={"bg-green-500 hover:bg-green-400"}
                titleCol='text-green-500'
              />

              {loading ? (
                // Skeleton loader while loading
                <div className="animate-pulse flex flex-col space-y-4">
                  <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-8 w-3/4 rounded"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-8 w-1/2 rounded"></div>
                </div>
              ) : cards.length > 0 ? (
                <Card
                  card={cards[currentCardIndex]}
                  flipped={flipped}
                  setFlipped={setFlipped}
                  animateFlip={animateFlip}
                  practice
                />
              ) : (
                <div className="flex flex-col justify-center items-center w-full h-full">
                  {subject ? (
                    <div>
                      <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>{subject.name} has no flashcards</p>
                      <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton text={`Add Flashcards to ${subject.name}`} bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} onClick={() => navigate('/create', { state: { subject } })} wWidth='w-full sm:w-auto'/>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>No subject selected</p>
                      <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton text="Select a subject to practice" bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} onClick={() => setIsSubjectListModalOpen(true)} wWidth='w-full sm:w-auto'/>
                      </div>
                    </div>
                  )}
                </div>
              )}

              { subject && cards.length > 0 && (
                <CardControls
                  currentCardIndex={currentCardIndex + 1} // Display card index starting from 1
                  totalCards={cards.length}
                  onPrevClick={handlePrevCard}
                  onNextClick={handleNextCard}
                  themeText={theme.textClass}
                  cards={cards}
                  generateClick={() => {
                      // Add logic for flashcard generation if needed
                      console.log("Generate Flashcards button clicked!");
                  }}
                  flipped={flipped}
                  setFlipped={setFlipped}
              />
              )}

              <SubjectList 
                isOpen={isSubjectListModalOpen} 
                onClose={() => setIsSubjectListModalOpen(false)}
                user={user}
              />
              
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full w-full">
            <h1 className="text-9xl font-bold text-green-500 mb-10">🎉</h1>
            <p className={`${theme ? theme.textClass : 'textColor'} font-bold text-2xl mb-10 ${shadow ? 'drop-shadow-custom' : ''}`}>You have completed all the cards.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <BackgroundButton text="Back to Home" bgColor={
                      theme 
                        ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` 
                        : "bg-orange-500 hover:bg-orange-400"
                    } onClick={() => navigate('/home')} />
              <BackgroundButton text={`Review ${subject.name} Again`} bgColor={
                      theme 
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` 
                        : "bg-purple-500 hover:bg-purple-400"
                    } onClick={() => {setFinished(false); setCurrentCardIndex(0);}} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlashcardQuiz;