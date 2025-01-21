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
import CustomModal from "../components/Modal/CustomModal";
import CreateImage from '../images/tutorial/Create.png';

function Create() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false); // New state for SubjectList modal
  const [newFrontContent, setNewFrontContent] = useState('');
  const [newBackContent, setNewBackContent] = useState('');
  const [selectedSort, setSelectedSort] = useState('5');
  const [generateTerm, setGenerateTerm] = useState('');
  const [createPopUp, setCreatePopUp] = useState(false);
  const [generateFlash, setGenerateFlash] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser, theme, userLoading, popupStates, updatePopupState } = useUser();
  const { secondaryColor, tertiaryColor, shadow, textClass } = theme;

  useEffect(() => {

    if (userLoading) {
      return;
    }

    if (!user) {
      getUser();
      return;
    }

    if (!popupStates?.create_popup) {
      setCreatePopUp(true); 
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

  const handleDismissPopup = () => {
    setCreatePopUp(false); 
    updatePopupState("create_popup", true); // Update Supabase
  };

  const handleAddNewCard = async (newFrontContent, newBackContent, file) => {
    console.log("File is: ", file);
    await addNewCard(
      cards,
      newFrontContent,
      newBackContent,
      setCards,
      subject.id,
      user.id,
      file  // pass it here
    );
    
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

  const handleSaveNewCard = (front, back, file) => {
    // Now pass all three (including 'file') to handleAddNewCard
    console.log("Save file is: ", file);
    handleAddNewCard(front, back, file);
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
    <div className="w-screen h-[100dvh] bg-cover bg-screen overflow-y-hidden" style={{ backgroundImage: theme ? theme.image : ''}}>
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
                  imageUrl={cards[currentCardIndex]?.image_url}
                  flipped={flipped}
                  setFlipped={setFlipped}
                  animateFlip={animateFlip}
                  onUpdateCard={handleUpdateCard}
                  cardId={cards[currentCardIndex]?.id}
                  onDeleteCard={handleDeleteCard}
                  edit={true}
                  user={user}
                  themeShadow={'background-shadow-new'}
                />
                <CardControls
                  currentCardIndex={currentCardIndex + 1}
                  totalCards={cards.length}
                  onPrevClick={() => setCurrentCardIndex(currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1)}
                  onNextClick={() => setCurrentCardIndex(currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0)}
                  create
                  themeText={theme.textClass}
                  themeSecondary={secondaryColor}
                  themeTertiary={tertiaryColor}
                  cards={cards}
                  generateClick={() => setGenerateFlash(true)}
                />
              </div>
            </div>

            <div className="w-full sm:w-[30%] h-full mt-[-10%] sm:mt-0">
              <CardList cards={cards} onCardClick={handleCardClick} onAddNewCard={handleAddNewCard} subject={subject} themeText={theme.textClass} themeShadow={'background-shadow-new'} passedInColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}/>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            {subject ? (
              <div>
                <p className={`${theme ? theme.textClass : 'text-gray-500'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>{subject.name} has no flashcards</p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-auto">
                  <BackgroundButton text={`Add Card to ${subject.name}`} bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"} onClick={handleOpenModal}  wWidth='w-full sm:w-auto mb-3 sm:mb-0'/> {/* Open modal */}
                  <BackgroundButton text="Create New Subject" bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"} onClick={handleCreateNewSubject} wWidth='w-full sm:w-auto'/>
                </div>
              </div>
            ) : (
              <div>
                <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>No subject selected</p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-0">
                  <BackgroundButton text="Add Cards to Subject" bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"} onClick={handleOpenSubjectListModal} wWidth='w-full sm:w-auto mb-3 sm:mb-0'/>
                  <BackgroundButton text="Create New Subject" bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"} onClick={handleCreateNewSubject} wWidth='w-full sm:w-auto'/>
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

      {/* Tooltip */}
      <CustomModal
        isOpen={createPopUp}
        content={
            <div className="text-center">
                <p className="text-2xl font-semibold mb-6">This is Create</p>
                <div className="flex items-center h-full">
                    <div className="w-[40%]">
                        <img src={CreateImage} alt="Home Tutorial" className="w-[90%]" />
                    </div>
                    <div className="w-2/3 flex items-center text-left">
                        <p className="mt-5 text-lg text-gray-500 dark:text-gray-200">
                          Here you will create the flashcards to study in your Subjects! You need to select a Subject to start creating flashcards. 
                          <br></br>If you don't have a Subject, you can create one by clicking the Create New Subject button.
                          <br></br>Once you have selected a Subject, you can add new flashcards by clicking the Add button at the top of the flashcard stack
                          <li>You can edit a flashcard by clicking the pencil</li>
                          <li>You can flip a flashcard by clicking anywhere on the flashcard</li>
                          <li>Flashcards can be deleted using the trash can icon</li>
                          <li>If you prefer studying on paper, you can export your flashcards to a printable PDF</li>
                        </p>
                    </div>
                </div>
            </div>
        }
        firstActionText={'Got it!'}
        firstActionCol="bg-green-500 hover:bg-green-400"
        onFirstAction={handleDismissPopup}
      />

      <CustomModal 
        isOpen={generateFlash}
        content={
          <div>
            <h1 className="text-2xl font-semibold mb-6 text-green-500">Cardify Generate</h1>
            <div className="w-full h-12 flex items-center justify-center p-2 rounded-lg space-x-4 mt-10">
              <p className="text-xl">Generate</p>

              <div className="relative group">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className={`border-2 border-[rgba(3,15,64,1)] rounded-full pl-2 pr-8 background-shadow-new background-hover ${secondaryColor.bgClass} ${secondaryColor.hoverClass} text-white font-bold focus:outline-none h-10 cursor-pointer appearance-none w-full transition-colors duration-300`}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none transition-transform duration-300 sm:group-hover:translate-x-1 sm:group-hover:translate-y-1">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <p className="text-xl">{`${selectedSort === "1" ? 'card about' : 'cards about'}`}</p>

              <div className="flex gap-2 items-center w-[58%] sm:w-1/4">
                <input
                  type="text"
                  value={generateTerm}
                  onChange={(e) => setGenerateTerm(e.target.value)}
                  className={`w-full h-10 px-4 py-2 text-left rounded-full ${secondaryColor.bgClass} ${textClass} background-shadow-new background-focus focus:outline-none placeholder-gray-200`}
                  placeholder="Enter topic..."
                />
              </div>
            </div>
          </div>
        }
        firstActionText={'Got it!'}
        firstActionCol="bg-green-500 hover:bg-green-400"
        onFirstAction={() => setGenerateFlash(false)}
      />

    </div>
  );
}

export default Create;