import { useState, useEffect } from 'react';
import { fetchCards } from "../components/Card/CardManipulation";
import Card from "../components/Card/Card";
import CardControls from "../components/Card/CardControls";
import TitleBar from '../components/Navigation/TitleBar';
import { useLocation } from 'react-router-dom'; // Import useLocation

function FlashcardQuiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);

  // get subjectId from state
  const location = useLocation(); // Access location object
  const { subject } = location.state || {}; // Get subjectId from location state

  useEffect(() => {
    if (subject) {
      const loadCards = async () => {
        const data = await fetchCards(subject.id); // Fetch flashcards with subject_id
        setCards(data);
      };

      loadCards(); 
    }
  }, [subject]);

  return (
    <div className="w-screen h-screen relative">

      <TitleBar text="Practice" />

      <div className="flex w-full h-full">
        <div className="w-4/5 h-full flex flex-col mt-5 mx-auto">
          <div className="w-full h-4/5 sm:h-[70%] mt-4 px-5">
            {cards.length > 0 ? (
              <Card
                frontContent={cards[currentCardIndex]?.question}
                backContent={cards[currentCardIndex]?.answer}
                flipped={flipped}
                setFlipped={setFlipped}
                animateFlip={animateFlip}
              />
            ) : (
              <div>
                { subject ? (
                  <p className="text-gray-500 text-4xl font-bold">{subject.name} has no flashcards</p>
                ) : (
                  <p className="text-gray-500 text-4xl font-bold">No flashcards</p>
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