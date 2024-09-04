import { useState, useEffect } from 'react';
import Card from './Card';
import CardControls from './CardControls';

function CardMain() {
  const [cards, setCards] = useState([
    { frontContent: "What is the largest planet in the Solar System?", backContent: "The largest planet in the Solar System is Jupiter!" },
    { frontContent: "What is the smallest country in the world?", backContent: "The smallest country in the world is Vatican City." },
    { frontContent: "What is the capital of France?", backContent: "The capital of France is Paris" },
    { frontContent: "What element does 'O' represent on the periodic table?", backContent: "'O' represents Oxygen." },
    { frontContent: "What is the longest river in the world?", backContent: "The longest river in the world is the Nile." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." }
  ]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip, setAnimateFlip] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // Track if in edit mode

  const handlePrevClick = () => {
    resetFlipAndEdit(); // Reset flip and exit edit mode
    setCurrentCardIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : cards.length - 1));
  };

  const handleNextClick = () => {
    resetFlipAndEdit(); // Reset flip and exit edit mode
    setCurrentCardIndex((prevIndex) => (prevIndex < cards.length - 1 ? prevIndex + 1 : 0));
  };

  const resetFlipAndEdit = () => {
    setAnimateFlip(false); 
    setFlipped(false); // Reset flip when changing cards
    setIsEditing(false); // Exit edit mode when changing cards
  };

  const handleUpdateCard = (index, newFrontContent, newBackContent) => {
    const updatedCards = cards.map((card, i) => 
      i === index ? { frontContent: newFrontContent, backContent: newBackContent } : card
    );
    setCards(updatedCards);
  };

  useEffect(() => {
    setAnimateFlip(true); // Re-enable flip animation after card change
  }, [currentCardIndex]);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="w-full h-[80%] sm:w-3/5 sm:h-1/2 m-auto">
        <Card 
          frontContent={cards[currentCardIndex].frontContent} 
          backContent={cards[currentCardIndex].backContent} 
          flipped={flipped}
          setFlipped={setFlipped}
          animateFlip={animateFlip}
          onUpdateCard={handleUpdateCard} 
          currentCardIndex={currentCardIndex}
          isEditing={isEditing} // Pass editing state
          setIsEditing={setIsEditing} // Pass function to update editing state
        />
        <CardControls 
          currentCardIndex={currentCardIndex + 1} 
          totalCards={cards.length} 
          onPrevClick={handlePrevClick} 
          onNextClick={handleNextClick} 
        />
      </div>
    </div>
  );
}

export default CardMain;