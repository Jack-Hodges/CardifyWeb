import { useState, useEffect } from 'react';
import Card from './Card';
import CardControls from './CardControls';
import CardList from './CardList'; // Import the new CardList component

function CardMain() {
  const [cards, setCards] = useState([
    { frontContent: "What is the largest planet in the Solar System?", backContent: "The largest planet in the Solar System is Jupiter!" },
    { frontContent: "What is the smallest country in the world?", backContent: "The smallest country in the world is Vatican City." },
    { frontContent: "What is the capital of France?", backContent: "The capital of France is Paris" },
    { frontContent: "What element does 'O' represent on the periodic table?", backContent: "'O' represents Oxygen." },
    { frontContent: "What is the longest river in the world?", backContent: "The longest river in the world is the Nile." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." },
    { frontContent: "What is the hardest natural substance on Earth?", backContent: "The hardest natural substance on Earth is Diamond." }
  ]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip, setAnimateFlip] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const handlePrevClick = () => {
    resetFlipAndEdit();
    setCurrentCardIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : cards.length - 1));
  };

  const handleNextClick = () => {
    resetFlipAndEdit();
    setCurrentCardIndex((prevIndex) => (prevIndex < cards.length - 1 ? prevIndex + 1 : 0));
  };

  const resetFlipAndEdit = () => {
    setAnimateFlip(false); 
    setFlipped(false);
    setIsEditing(false);
  };

  const handleUpdateCard = (index, newFrontContent, newBackContent) => {
    const updatedCards = cards.map((card, i) => 
      i === index ? { frontContent: newFrontContent, backContent: newBackContent } : card
    );
    setCards(updatedCards);
  };

  const handleCardClick = (index) => {
    resetFlipAndEdit(); 
    setCurrentCardIndex(index); // Set the clicked card as the active card
  };

  useEffect(() => {
    setAnimateFlip(true);
  }, [currentCardIndex]);

  return (
    <div className="w-screen h-screen">

      {/* Title */}
      <div className="flex w-full text-left text-5xl font-bold text-gray-500 dark:text-gray-200 pl-5 pt-5 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 mr-4">
          <path fill-rule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
        </svg>

        <p>Create Flashcards</p>
      </div>

      <div className="flex w-full h-full">
        <div className="w-[70%] h-full flex flex-col mt-5"> {/* Adjusted alignment */}

          {/* Currently active card */}
          <div className="w-full h-[80%] sm:h-1/2 mt-7 px-5">
            <Card 
              frontContent={cards[currentCardIndex].frontContent} 
              backContent={cards[currentCardIndex].backContent} 
              flipped={flipped}
              setFlipped={setFlipped}
              animateFlip={animateFlip}
              onUpdateCard={handleUpdateCard} 
              currentCardIndex={currentCardIndex}
              isEditing={isEditing} 
              setIsEditing={setIsEditing}
            />
            {/* Controls for moving to prev and next card, and card count */}
            <CardControls 
              currentCardIndex={currentCardIndex + 1} 
              totalCards={cards.length} 
              onPrevClick={handlePrevClick} 
              onNextClick={handleNextClick} 
            />
          </div>
        </div>

        {/* List of all cards */}
        <div className="w-[30%] h-full overflow-y-auto">
          <CardList cards={cards} onCardClick={handleCardClick} />
        </div>

      </div>
      
    </div>
  );
}

export default CardMain;