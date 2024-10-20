import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, updateCard, addNewCard, deleteCard, sortCardsById } from '../components/Card/CardManipulation';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import EditModal from '../components/Card/EditModal';
import AddSubject from '../components/Subject/AddSubject';
import { saveSubject } from '../components/Subject/SubjectManipulation';
import { useUser } from '../UserContext';
import SubjectList from '../components/Subject/SubjectList';

function CreateCards() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false); // New state for SubjectList modal
  const [newFrontContent, setNewFrontContent] = useState('');
  const [newBackContent, setNewBackContent] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser } = useUser();

  useEffect(() => {
    if (!user) {
      getUser();
      return;
    }

    if (subject === null) {
      setCards([]);
      setLoading(false);
      return;
    }

    if (subject) {
      const loadCards = async () => {
        setLoading(true);
        const data = await fetchCards(subject.id);
        sortCardsById(data);
        setCards(data);
        setLoading(false);
      };
      loadCards();
    } else {
      setLoading(false);
    }
  }, [subject, user, getUser]);

  const handleUpdateCard = (updatedFrontContent, updatedBackContent) => {
    updateCard(cards, currentCardIndex, updatedFrontContent, updatedBackContent, setCards, subject.id);
  };

  const handleAddNewCard = async (newFrontContent, newBackContent) => {
    await addNewCard(cards, newFrontContent, newBackContent, setCards, subject.id, user.id);
    const updatedCards = await fetchCards(subject.id);
    sortCardsById(updatedCards);
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
    setIsModalOpen(true);
  };

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true); // Open SubjectList modal
  };

  const handleSaveNewCard = () => {
    handleAddNewCard(newFrontContent, newBackContent);
    setIsModalOpen(false);
    setNewFrontContent('');
    setNewBackContent('');
  };

  const handleCreateNewSubject = () => {
    setIsAddSubjectModalOpen(true);
  };

  const handleSaveSubject = async (id, subjectName, subjectColor, collectionId) => {
    const data = await saveSubject(id, subjectName, subjectColor, user.id, null, collectionId); // Ensure collectionId is passed
    if (data) {
        setIsAddSubjectModalOpen(false);
        navigate('/create', { state: { subject: data[0] } });
    }
  };

  return (
    <div className="w-screen h-[100dvh]">
      <TitleBar text="Create" user={user}/>
      

      <div className="block sm:flex w-full h-full">
        {loading ? (
          <div className="flex w-full h-full justify-center items-center">
            <div className="animate-pulse space-y-4 w-[70%] h-full">
              <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-12 w-3/4 rounded"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-12 w-1/2 rounded"></div>
            </div>
          </div>
        ) : cards.length > 0 ? (
          <>
            <div className="w-full sm:w-[70%] h-[90%] sm:h-full flex flex-col sm:mt-10">
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
                  user={user}
                />
                <CardControls
                  currentCardIndex={currentCardIndex + 1}
                  totalCards={cards.length}
                  onPrevClick={() => setCurrentCardIndex(currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1)}
                  onNextClick={() => setCurrentCardIndex(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)}
                  create
                />
              </div>
            </div>

            <div className="w-full sm:w-[30%] h-full mt-[-10%] sm:mt-0">
              <CardList cards={cards} onCardClick={handleCardClick} onAddNewCard={handleAddNewCard} subject={subject} />
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            {subject ? (
              <div>
                <p className="text-gray-500 text-4xl font-bold text-center">{subject.name} has no flashcards</p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-auto">
                  <BackgroundButton text={`Add Card to ${subject.name}`} bgColor={"orange"} onClick={handleOpenModal}  wWidth='w-full sm:w-auto mb-3 sm:mb-0'/> {/* Open modal */}
                  <BackgroundButton text="Create New Subject" bgColor={"purple"} onClick={handleCreateNewSubject} wWidth='w-full sm:w-auto'/>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-4xl font-bold text-center">No flashcards</p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-0">
                  <BackgroundButton text="Add Cards to Subject" bgColor={"orange"} onClick={handleOpenSubjectListModal} wWidth='w-full sm:w-auto mb-3 sm:mb-0'/>
                  <BackgroundButton text="Create New Subject" bgColor={"purple"} onClick={handleCreateNewSubject} wWidth='w-full sm:w-auto'/>
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

      {/* AddSubject Modal */}
      <AddSubject
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        text="Create New Subject"
        user={user}
      />

      {/* SubjectList Modal */}
      <SubjectList 
        isOpen={isSubjectListModalOpen} 
        onClose={() => setIsSubjectListModalOpen(false)}
        user={user}
        page="create"
      />

    </div>
  );
}

export default CreateCards;