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

function FlashcardQuiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animateFlip] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser } = useUser();
  const navigate = useNavigate();

  const currentCardIndexRef = useRef(currentCardIndex);
  const cardsLengthRef = useRef(cards.length);

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true);
  };

  const handleSwitchToCreate = () => {
    navigate('/create', { state: { subject } });
  };

  const [isModalOpen, setIsModalOpen] = useState(false); // To control the modal

  // Function to handle closing the modal with animation
  const handleClose = () => {
    setTimeout(() => {
      setIsModalOpen(false);
    }, 100); // Match this duration with your transition timing (300ms in this case)
  };

  const handleExitBeforeCompletion = useCallback(() => {
    if (currentCardIndexRef.current > 0 && currentCardIndexRef.current < cardsLengthRef.current - 1) {
      console.log(`Practice exited before completing all cards. Current index: ${currentCardIndexRef.current}`);
      saveSubject(subject.id, subject.name, subject.bgCol, user.id, currentCardIndexRef.current);
      // Add additional logic here, such as saving progress or an API call
    } else if (subject) {
      saveSubject(subject.id, subject.name, subject.bgCol, user.id);
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
    if (subject?.up_to_index !== null) {
      setIsModalOpen(true);
    }
  }, [subject?.up_to_index]);

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

  return (
    <div className="w-screen h-[100dvh] relative">
      <div className="mt-2">
       <TitleBar text="Practice" />
      </div>

      <div className="flex w-full h-full">
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
                setCurrentCardIndex(subject.up_to_index); // Continue from last saved progress
                handleClose();
              }}
              text="Continue where you left off?"
              mainText={`You were up to card ${subject.up_to_index + 1}. Would you like to continue from there?`}
              firstActionText="No, start over"
              secondActionText="Yes, continue"
              firstActionCol="gray"
              secondActionCol="green"
            />

            {loading ? (
              // Skeleton loader while loading
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="bg-[#d9d6d1] h-48 w-full rounded-lg"></div>
                <div className="bg-[#d9d6d1] h-8 w-3/4 rounded"></div>
                <div className="bg-[#d9d6d1] h-8 w-1/2 rounded"></div>
              </div>
            ) : cards.length > 0 ? (
              <Card
                frontContent={cards[currentCardIndex]?.question}
                backContent={cards[currentCardIndex]?.answer}
                flipped={flipped}
                setFlipped={setFlipped}
                animateFlip={animateFlip}
                practice
              />
            ) : (
              <div className="flex flex-col justify-center items-center w-full h-full">
                {subject ? (
                  <div>
                    <p className="text-gray-500 text-4xl font-bold text-center">{subject.name} has no flashcards</p>
                    <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                      <BackgroundButton text={`Add Flashcards to ${subject.name}`} bgColor={"orange"} onClick={handleSwitchToCreate} wWidth='w-full sm:w-auto'/>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 text-4xl font-bold text-center">No flashcards</p>
                    <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                      <BackgroundButton text="Select a subject to practice" bgColor={"orange"} onClick={handleOpenSubjectListModal} wWidth='w-full sm:w-auto'/>
                    </div>
                  </div>
                )}
              </div>
            )}

            { subject && (
              <CardControls
                currentCardIndex={currentCardIndex + 1}
                totalCards={cards.length}
                onPrevClick={() => setCurrentCardIndex(currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1)}
                onNextClick={() => setCurrentCardIndex(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)}
              />
            )}

            <SubjectList 
              isOpen={isSubjectListModalOpen} 
              onClose={() => setIsSubjectListModalOpen(false)}
              user={user}
            />
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardQuiz;