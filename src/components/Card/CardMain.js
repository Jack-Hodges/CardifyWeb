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

  // Save cards to the backend (overwrite the JSON file)
  const saveCards = (updatedCards) => {
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

  // Update card content in the state and save it to the backend
  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    const updatedCards = cards.map((card, i) =>
      i === currentCardIndex
        ? { frontContent: updatedFrontContent, backContent: updatedBackContent }
        : card
    );
    setCards(updatedCards);
    setIsModalOpen(false); // Close the modal
    saveCards(updatedCards); // Save the updated cards to the backend
  };

  // Handle adding a new flashcard
  const handleAddNewCard = (newFrontContent, newBackContent) => {
    const newCard = {
      frontContent: newFrontContent,
      backContent: newBackContent,
    };
    const updatedCards = [...cards, newCard]; // Add the new card to the existing cards array
    setCards(updatedCards); // Update the cards array, which will re-render the list
    saveCards(updatedCards); // Save the new card to the backend
  };

  const handleCardClick = (index) => {
    setFlipped(false);
    setCurrentCardIndex(index); // Set the clicked card as the active card
  };

  return (
    <div className="w-screen h-screen">
      <div className="flex w-full text-left text-5xl font-bold text-gray-500 dark:text-gray-200 pl-5 pt-5 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 mr-4">
          <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        <p>Create Flashcards</p>
      </div>

      <div className="flex w-full h-full">
        <div className="w-[70%] h-full flex flex-col mt-5">
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
            <CardControls
              currentCardIndex={currentCardIndex + 1}
              totalCards={cards.length}
              onPrevClick={() => setCurrentCardIndex(currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1)}
              onNextClick={() => setCurrentCardIndex(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)}
            />
          </div>
        </div>

        {/* List of all cards with add new card functionality */}
        <div className="w-[30%] h-full overflow-y-auto">
          <CardList cards={cards} onCardClick={handleCardClick} onAddNewCard={handleAddNewCard} />
        </div>
      </div>

      {/* EditModal for editing a card */}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateCard}
        frontContent={frontContent}
        backContent={backContent}
        setFrontContent={setFrontContent}
        setBackContent={setBackContent}
      />
    </div>
  );
}

export default CardMain;