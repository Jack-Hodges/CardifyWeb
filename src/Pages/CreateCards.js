import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useLocation } from 'react-router-dom'; // Import useLocation

// Import card manipulation to interact with Supabase
import { fetchCards, updateCard, addNewCard, deleteCard } from '../components/Card/CardManipulation'; 
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';

function CardMain() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);

  // Get subjectId from state
  const location = useLocation(); // Access location object
  const { subject } = location.state || {}; // Get subjectId from location state

  // Fetch cards from the Supabase database
  useEffect(() => {
    if (subject) {
      const loadCards = async () => {
        const data = await fetchCards(subject.id); // Fetch flashcards with subject_id
        setCards(data);
      };

      loadCards(); 
    }
  }, [subject]);

  // Update card content
  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    updateCard(cards, currentCardIndex, updatedFrontContent, updatedBackContent, setCards, subject.id);
  };

  // Add new card
  const handleAddNewCard = async (newFrontContent, newBackContent) => {
    await addNewCard(cards, newFrontContent, newBackContent, setCards, subject.id);
    
    // Refetch cards to ensure the latest state
    const updatedCards = await fetchCards(subject.id); 
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
        {cards.length > 0 ? (
          <>
            <div className="w-[70%] h-full flex flex-col mt-10">
              <div className="w-full h-4/5 sm:h-3/5 mt-4 px-5">
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
                <CardControls
                  currentCardIndex={currentCardIndex + 1}
                  totalCards={cards.length}
                  onPrevClick={() => setCurrentCardIndex(currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1)}
                  onNextClick={() => setCurrentCardIndex(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)}
                />
              </div>
            </div>

            {/* List of all cards with add new card functionality */}
            <div className="w-[30%] h-full">
              <CardList cards={cards} onCardClick={handleCardClick} onAddNewCard={handleAddNewCard} />
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            { subject ? (
              <p className="text-gray-500 text-4xl font-bold">{subject.name} has no flashcards</p>
            ) : (
              <p className="text-gray-500 text-4xl font-bold">No flashcards</p>
            )}
            
            <div class="flex gap-4 mt-5">
              <BackgroundButton text="Create New Subject" bgColor={"purple"}/>
              <BackgroundButton text="Add Cards to Subject" bgColor={"orange"}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardMain;