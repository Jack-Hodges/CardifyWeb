import { useState, useEffect } from 'react';
import { fetchCards } from "../components/Card/CardManipulation";
import Card from "../components/Card/Card";
import CardControls from "../components/Card/CardControls";
import TitleBar from '../components/Navigation/TitleBar';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { useUser } from '../UserContext';

function FlashcardQuiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state
  const [animateFlip] = useState(true);

  const location = useLocation(); // Access location object
  const { subject } = location.state || {};
  const { user, getUser } = useUser();

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
      <TitleBar text="Practice" />

      <div className="flex w-full h-full">
        <div className="w-4/5 h-full flex flex-col mt-5 mx-auto">
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
              <div>
                {subject ? (
                  <p className="text-gray-500 text-4xl font-bold text-center">{subject.name} has no flashcards</p>
                ) : (
                  <p className="text-gray-500 text-4xl font-bold text-center">No flashcards</p>
                )}
              </div>
            )}
            <CardControls
              currentCardIndex={currentCardIndex + 1}
              totalCards={cards.length}
              onPrevClick={() => setCurrentCardIndex(currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1)}
              onNextClick={() => setCurrentCardIndex(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardQuiz;