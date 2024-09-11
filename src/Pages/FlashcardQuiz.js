import { useState, useEffect } from 'react';
import { fetchCards } from "../components/Card/CardManipulation";
import Card from "../components/Card/Card";
import CardControls from "../components/Card/CardControls";
import TitleBar from '../components/Navigation/TitleBar';

function FlashcardQuiz() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      const data = await fetchCards(1);
      setCards(data);
    }

    loadCards();
  }, []);

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
              <p>No flashcards available</p>
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