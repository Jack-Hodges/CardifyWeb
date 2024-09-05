import { useState, useEffect } from 'react';
import Card from './Card';
import CardControls from './CardControls';
import CardList from './CardList';
import EditModal from './EditModal'; // Import the EditModal component

function CardMain() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip, setAnimateFlip] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [frontContent, setFrontContent] = useState(''); // State for modal frontContent
  const [backContent, setBackContent] = useState(''); // State for modal backContent

  // Fetch cards from the backend API
  useEffect(() => {
    fetch('http://localhost:3001/cards')
      .then((response) => response.json())
      .then((data) => setCards(data))
      .catch((error) => console.error('Error fetching cards:', error));
  }, []);

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
  };

  // Update card content in the state and save it to the backend
  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    const updatedCards = cards.map((card, i) =>
      i === currentCardIndex
        ? { frontContent: updatedFrontContent, backContent: updatedBackContent }
        : card
    );
    
    setCards(updatedCards);
    setIsModalOpen(false); // Close the modal
  
    // Save the updated cards to the backend
    fetch('http://localhost:3001/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedCards), // Send the updated cards array
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log('Cards saved successfully');
        }
      })
      .catch((error) => console.error('Error saving cards:', error));
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 mr-4">
          <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>

        <p>Create Flashcards</p>
      </div>

      <div className="flex w-full h-full">
        <div className="w-[70%] h-full flex flex-col mt-5">
          {/* Currently active card */}
          <div className="w-full h-[80%] sm:h-1/2 mt-7 px-5">
            {cards.length > 0 ? (
              <Card
                frontContent={cards[currentCardIndex]?.frontContent}
                backContent={cards[currentCardIndex]?.backContent}
                flipped={flipped}
                setFlipped={setFlipped}
                animateFlip={animateFlip}
                onUpdateCard={handleUpdateCard} // Pass updated content to save
              />
            ) : (
              <p>Loading cards...</p>
            )}
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

      {/* EditModal */}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateCard} // Pass updated content to save
        frontContent={frontContent}
        backContent={backContent}
        setFrontContent={setFrontContent}
        setBackContent={setBackContent}
      />
    </div>
  );
}

export default CardMain;