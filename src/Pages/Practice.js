import { useState, useEffect } from 'react';
import { fetchCards } from "../components/Card/CardManipulation";
import Card from "../components/Card/Card";
import CardControls from "../components/Card/CardControls";
import TitleBar from '../components/Navigation/TitleBar';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { useUser } from '../UserContext';
import BackgroundButton from '../components/Elements/BackgroundButton';
import SubjectList from '../components/Subject/SubjectList';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router

function FlashcardQuiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state
  const [animateFlip] = useState(true);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false); // New state for SubjectList modal

  const location = useLocation(); // Access location object
  const { subject } = location.state || {};
  const { user, getUser } = useUser();

  const navigate = useNavigate();

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true); // Open SubjectList modal
  };

  const handleSwitchToCreate = () => {
    navigate('/create', { state: { subject } });
  }

  useEffect(() => {

    if (!user) {
      getUser();
      return;
    }

    if (subject) {
      const loadCards = async () => {
        setLoading(true); // Start loading
        const data = await fetchCards(subject.id); // Fetch flashcards with subject_id
        setCards(data);
        setLoading(false); // Stop loading
      };

      loadCards();
    } else {
      setLoading(false); // Stop loading if no subject
    }
  }, [subject, user, getUser]);

  return (
    <div className="w-screen h-screen relative">
      <div className="mt-2">
       <TitleBar text="Practice" />
      </div>

      <div className="flex w-full h-full">
        <div className="w-full sm:w-4/5 h-4/5 sm:h-full flex flex-col mt-5 mx-auto">
          <div className="w-full h-4/5 sm:h-[70%] mt-4 px-5">
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