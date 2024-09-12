import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useLocation } from 'react-router-dom';
import { fetchCards, updateCard, addNewCard, deleteCard } from '../components/Card/CardManipulation';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import EditModal from '../components/Card/EditModal';

function CardMain() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false); // State to track if modal is open
  const [newFrontContent, setNewFrontContent] = useState(''); // State for new card front content
  const [newBackContent, setNewBackContent] = useState(''); // State for new card back content

  const location = useLocation();
  const { subject } = location.state || {};

  useEffect(() => {
    if (subject) {
      const loadCards = async () => {
        const data = await fetchCards(subject.id);
        setCards(data);
      };
      loadCards();
    }
  }, [subject]);

  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    updateCard(cards, currentCardIndex, updatedFrontContent, updatedBackContent, setCards, subject.id);
  };

  const handleAddNewCard = async (newFrontContent, newBackContent) => {
    await addNewCard(cards, newFrontContent, newBackContent, setCards, subject.id);
    const updatedCards = await fetchCards(subject.id);
    setCards(updatedCards);
  };

  const handleDeleteCard = (cardId) => {
    deleteCard(cards, cardId, currentCardIndex, setCards, setCurrentCardIndex);
  };

  const handleCardClick = (index) => {
    setFlipped(false);
    setCurrentCardIndex(index);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true); // Open modal when button is clicked
  };

  const handleSaveNewCard = () => {
    handleAddNewCard(newFrontContent, newBackContent);
    setIsModalOpen(false); // Close modal after saving
    setNewFrontContent(''); // Clear the input fields
    setNewBackContent(''); // Clear the input fields
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
                  onUpdateCard={handleUpdateCard}
                  cardId={cards[currentCardIndex]?.id}
                  onDeleteCard={handleDeleteCard}
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

            <div className="w-[30%] h-full">
              <CardList cards={cards} onCardClick={handleCardClick} onAddNewCard={handleAddNewCard} subject={subject} />
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            { subject ? (
              <div>
                <p className="text-gray-500 text-4xl font-bold text-center">{subject.name} has no flashcards</p>
                <div className="flex gap-4 mt-5">
                 <BackgroundButton text="Create New Subject" bgColor={"purple"} />
                 <BackgroundButton text={`Add Card to ${subject.name}`} bgColor={"orange"} onClick={handleOpenModal} /> {/* Open modal */}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-4xl font-bold text-center">No flashcards</p>
                <div className="flex gap-4 mt-5">
                 <BackgroundButton text="Create New Subject" bgColor={"purple"} />
                 <BackgroundButton text="Add Cards to Subject" bgColor={"orange"} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EditModal for adding new cards */}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewCard}
        frontContent={newFrontContent}
        backContent={newBackContent}
        setFrontContent={setNewFrontContent}
        setBackContent={setNewBackContent}
        text="Add New Flashcard"
      />
    </div>
  );
}

export default CardMain;