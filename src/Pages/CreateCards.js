import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, updateCard, addNewCard, deleteCard } from '../components/Card/CardManipulation';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import EditModal from '../components/Card/EditModal';
import AddSubject from '../components/Subject/AddSubject';
import { saveSubject } from '../components/Subject/SubjectManipulation';
import { useUser } from '../UserContext';

function CreateCards() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to track if modal is open
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false); // For adding new subject
  const [newFrontContent, setNewFrontContent] = useState(''); // State for new card front content
  const [newBackContent, setNewBackContent] = useState(''); // State for new card back content
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true); // Loading state

  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser } = useUser();

  useEffect(() => {

    if (!user) {
      getUser();
      return;
    }

    if (subject) {
      const loadCards = async () => {
        setLoading(true); // Start loading
        const data = await fetchCards(subject.id); // Fetch flashcards with subject_id
        setCards(data);
        setLoading(false); // Stop loading
      };

      loadCards();
    } else {
      setLoading(false); // Stop loading if no subject
    }
  }, [subject, user, getUser]);

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

  const handleCreateNewSubject = () => {
    setIsAddSubjectModalOpen(true); // Open AddSubject modal
  };

  const handleSaveSubject = async (id, subjectName, subjectColor) => {
    const data = await saveSubject(id, subjectName, subjectColor, user.id); // Save subject
    if (data) {
      setIsAddSubjectModalOpen(false); // Close AddSubject modal
      navigate('/create', { state: { subject: data[0] } }); // Navigate to CreateCards with new subject
    }
  };

  return (
    <div className="w-screen h-[100dvh]">
      <TitleBar text="Create" />

      <div className="flex w-full h-full">
        {loading ? (
          // Skeleton loader while loading cards
          <div className="flex w-full h-full justify-center items-center">
            <div className="animate-pulse space-y-4 w-[70%] h-full">
              <div className="bg-[#d9d6d1] h-48 w-full rounded-lg"></div>
              <div className="bg-[#d9d6d1] h-12 w-3/4 rounded"></div>
              <div className="bg-[#d9d6d1] h-12 w-1/2 rounded"></div>
            </div>
          </div>
        ) : cards.length > 0 ? (
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
                <div className="block sm:flex gap-4 mt-5">
                 <BackgroundButton text="Create New Subject" bgColor={"purple"} onClick={handleCreateNewSubject} wWidth='w-full sm:w-auto mb-3 sm:mb-0'/>
                 <BackgroundButton text={`Add Card to ${subject.name}`} bgColor={"orange"} onClick={handleOpenModal}  wWidth='w-full sm:w-auto'/> {/* Open modal */}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-4xl font-bold text-center">No flashcards</p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-0">
                 <BackgroundButton text="Create New Subject" bgColor={"purple"} onClick={handleCreateNewSubject} wWidth='w-full sm:w-auto mb-3 sm:mb-0'/>
                 <BackgroundButton text="Add Cards to Subject" bgColor={"orange"} wWidth='w-full sm:w-auto'/>
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

      <AddSubject
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        text="Create New Subject"
      />
    </div>
  );
}

export default CreateCards;