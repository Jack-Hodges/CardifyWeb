import { useState, useEffect } from 'react';
import supabase from '../../supabaseClient'; // Import Supabase client
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

  // Fetch cards from the Supabase database
  useEffect(() => {
    const fetchCards = async () => {
      const { data, error } = await supabase
        .from('flashcards') // Table name in Supabase
        .select('*')
        .eq('subject_id', 1); // Only fetch flashcards with subject_id of 1

      if (error) {
        console.error('Error fetching flashcards:', error);
      } else {
        console.log('Flashcards fetched from Supabase:', data);
        setCards(data);
      }
    };

    fetchCards(); // Call the function to fetch data on component mount
  }, []);

  // Update card content in the state and save it to the backend
  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    const updatedCards = cards.map((card, i) =>
      i === currentCardIndex
        ? { ...card, question: updatedFrontContent, answer: updatedBackContent }
        : card
    );
    setCards(updatedCards);
    setIsModalOpen(false); // Close the modal
    // Add the code to save the updated card to Supabase (omitted for brevity)
  };

  // Handle adding a new flashcard (with subject_id of 1)
  const handleAddNewCard = async (newFrontContent, newBackContent) => {
    const newCard = {
      question: newFrontContent,
      answer: newBackContent,
      subject_id: 1 // Include subject_id of 1 for the new card
    };

    const { data, error } = await supabase
      .from('flashcards')
      .insert([newCard])
      .select('*'); // Insert the new card into the Supabase table and return the full row

    if (error) {
      console.error('Error adding new card:', error);
    } else if (data?.length > 0) {
      const updatedCards = [...cards, data[0]]; // Add the new card from Supabase to the existing array
      setCards(updatedCards); // Update the cards array, which will re-render the list
    } else {
      console.error('No data returned after inserting the new card.');
    }
  };

  // Handle card deletion (remove the card from the state)
  const handleDeleteCard = (cardId) => {
    const updatedCards = cards.filter(card => card.id !== cardId); // Remove the deleted card by filtering it out

    // Determine the new current index
    let newCurrentIndex = currentCardIndex;
    if (currentCardIndex === updatedCards.length) {
      // If the current card is the last one, show the previous one
      newCurrentIndex = currentCardIndex - 1;
    }

    setCards(updatedCards); // Update the cards array to reflect the removal
    setCurrentCardIndex(Math.max(newCurrentIndex, 0)); // Ensure index is not negative
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
                frontContent={cards[currentCardIndex]?.question}
                backContent={cards[currentCardIndex]?.answer}
                flipped={flipped}
                setFlipped={setFlipped}
                animateFlip={animateFlip}
                onUpdateCard={handleUpdateCard} // Pass updated content to save
                cardId={cards[currentCardIndex]?.id} // Pass the card ID for deletion
                onDeleteCard={handleDeleteCard} // Pass the delete handler to remove the card
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