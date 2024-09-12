import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useLocation } from 'react-router-dom'; // Import useLocation

// Import card manipulation to interact with Supabase
import { fetchCards, updateCard, addNewCard, deleteCard } from '../components/Card/CardManipulation'; 
import TitleBar from '../components/Navigation/TitleBar';

function CardMain() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);

  // get subjectId from state
  const location = useLocation(); // Access location object
  const { subjectId } = location.state || {}; // Get subjectId from location state

  // Fetch cards from the Supabase database
  useEffect(() => {
    const loadCards = async () => {
      const data = await fetchCards(subjectId); // Fetch flashcards with subject_id 1
      setCards(data);
    };

    loadCards(); 
  }, [subjectId]);

  // Update card content
  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    updateCard(cards, currentCardIndex, updatedFrontContent, updatedBackContent, setCards, subjectId);
  };

  // Add new card
  const handleAddNewCard = async (newFrontContent, newBackContent) => {
    await addNewCard(cards, newFrontContent, newBackContent, setCards, subjectId);
    
    // Refetch cards to ensure the latest state
    const updatedCards = await fetchCards(subjectId); 
    setCards(updatedCards);
  };

  // Delete a card
  const handleDeleteCard = (cardId) => {
    deleteCard(cards, cardId, currentCardIndex, setCards, setCurrentCardIndex);
  };

  const handleCardClick = (index) => {
    setFlipped(false);
    setCurrentCardIndex(index); // Set the clicked card as the active card
  };

  return (
    <div className="w-screen h-screen">

      <TitleBar text="Create" />

      <div className="flex w-full h-full">
        <div className="w-[70%] h-full flex flex-col mt-10">
          <div className="w-full h-4/5 sm:h-3/5 mt-4 px-5">
            {cards.length > 0 ? (
              <Card
                frontContent={cards[currentCardIndex]?.question}
                backContent={cards[currentCardIndex]?.answer}
                flipped={flipped}
                setFlipped={setFlipped}
                animateFlip={animateFlip}
                onUpdateCard={handleUpdateCard} // Pass updated content to save
                cardId={cards[currentCardIndex]?.id} // Pass the card ID for deletion
                onDeleteCard={handleDeleteCard} // Pass the delete handler to remove the card
                edit={true}
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

        {/* List of all cards with add new card functionality */}
        <div className="w-[30%] h-full overflow-y-auto">
          <CardList cards={cards} onCardClick={handleCardClick} onAddNewCard={handleAddNewCard} />
        </div>
      </div>
    </div>
  );
}

export default CardMain;