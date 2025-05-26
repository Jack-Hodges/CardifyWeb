import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, upsertCard, deleteCard, sortCardsById } from '../components/Card/CardManipulation';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { saveSubject } from '../components/Subject/SubjectManipulation';
import { useUser } from '../UserContext';
import SubjectList from '../components/Subject/SubjectList';
import CustomModal from "../components/Modal/CustomModal";
import CreateImage from '../images/tutorial/Create.png';
import EditModal from '../components/Card/EditModal';
import ImportModal from '../components/Card/ImportModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Create() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('5');
  const [generateTerm, setGenerateTerm] = useState('');
  const [createPopUp, setCreatePopUp] = useState(false);
  const [generateFlash, setGenerateFlash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};

  const { user, theme, popupStates, updatePopupState, profile } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor, shadow, textClass } = theme;


  // Tutorial popup logic (won't refetch cards when window focus changes)
  useEffect(() => {
    if (popupStates && popupStates.create_popup === true) {
      setCreatePopUp(false);
    } else {
      setCreatePopUp(true);
    }
  }, [popupStates]);

  // Fetch cards once when the subject ID changes
  useEffect(() => {
    if (!subject?.id) {
      setCards([]);
      setLoading(false);
      return;
    }
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCards(subject.id);
        sortCardsById(data);
        if (isMounted) setCards(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [subject?.id]);

  // === 3) The universal upsert callback ===
  //     (called by EditModal after saving or editing a card)
  const handleUpsertCard = async (cardData, file) => {
    // Determine if we're creating a new card (no id provided)
    const isNewCard = !cardData.id;
    // upsertCard will insert or update depending on cardData.id
    await upsertCard(cardData, file);
    // Refresh cards list
    const updatedCards = await fetchCards(subject.id);
    sortCardsById(updatedCards);
    setCards(updatedCards);
    // If it's a new card, set the active card to be the last one in the sorted array
    if (isNewCard) {
      setCurrentCardIndex(updatedCards.length - 1);
    }
  };

  // === 4) Delete card logic ===
  const handleDeleteCard = async (cardId) => {
    await deleteCard(cards, cardId, currentCardIndex, setCards, setCurrentCardIndex);
  };

  // === 5) Card selection logic ===
  const handleCardClick = (index) => {
    setFlipped(false);
    setCurrentCardIndex(index);
  };

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true);
  };

  // === 6) AddSubject logic ===
  const handleCreateNewSubject = () => {
    setIsAddSubjectModalOpen(true);
  };
  const handleSaveSubject = async (id, subjectName, subjectColor, collectionId) => {
    const data = await saveSubject(id, subjectName, subjectColor, user.id, null, collectionId); 
    if (data) {
      setIsAddSubjectModalOpen(false);
      navigate('/create', { state: { subject: data[0] } });
    }
  };

  // === 7) Tutorial popup dismiss ===
  const handleDismissPopup = () => {
    setCreatePopUp(false); 
    updatePopupState("create_popup", true);
  };

  const handleOpenAddCardModal = () => {
    const maxCards = profile.pro ? 500 : 100;
    if (profile.flashcard_count >= maxCards) {
      toast.error(`You've reached your card limit of ${maxCards} cards. ${profile.pro ? '' : 'Upgrade to Pro for up to 500 cards!'}`);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div 
      className="w-screen h-[100dvh] bg-cover bg-screen overflow-y-scroll lg:overflow-y-hidden" 
      style={{ backgroundImage: theme ? theme.image : ''}}
    >
      <TitleBar text="Create" user={user}/>

      <div className="block lg:flex w-full h-full">
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
            <div className="w-full lg:w-[70%] px-5 h-3/5 mt-5 sm:mt-14">
                {/* The main Card display */}
                <Card
                  card={cards[currentCardIndex]}
                  flipped={flipped}
                  setFlipped={setFlipped}
                  animateFlip={animateFlip}
                  cardId={cards[currentCardIndex]?.id}
                  onDeleteCard={handleDeleteCard}
                  edit={true}
                  onUpsertCard={handleUpsertCard}
                />
                <CardControls
                  currentCardIndex={currentCardIndex + 1}
                  totalCards={cards.length}
                  onPrevClick={() => 
                    setCurrentCardIndex(
                      currentCardIndex > 0 ? currentCardIndex - 1 : cards.length - 1
                    )
                  }
                  onNextClick={() => 
                    setCurrentCardIndex(
                      currentCardIndex < cards.length - 1 ? currentCardIndex + 1 : 0
                    )
                  }
                  create
                  themeText={theme.textClass}
                  themeSecondary={secondaryColor}
                  themeTertiary={tertiaryColor}
                  cards={cards}
                  generateClick={() => setGenerateFlash(true)}
                  onUpsertCard={handleUpsertCard}
                  subject={subject}
                />
            </div>

            <div className="w-full lg:w-[30%] mt-20 lg:mt-0">
              {/* The sidebar CardList */}
              <CardList 
                cards={cards}
                onCardClick={handleCardClick}
                onUpsertCard={handleUpsertCard}
                onDeleteCard={handleDeleteCard}
                subject={subject}
                themeText={theme.textClass}
                passedInColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                onAddClick={() => {
                  const maxCards = profile.pro ? 500 : 100;
                  if (profile.flashcard_count >= maxCards) {
                    toast.error(`You've reached your card limit of ${maxCards} cards. ${profile.pro ? '' : 'Upgrade to Pro for up to 500 cards!'}`);
                    return false;
                  }
                  return true;
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center w-full h-full mt-[-5%]">
            {subject ? (
              <div className="flex flex-col justify-center items-center gap-4">
                <p 
                  className={`${theme ? theme.textClass : 'text-gray-500'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}
                >
                  {subject.name} has no flashcards
                </p>
                <p className={`${theme ? theme.textClass : 'textColor'} text-2xl font-semibold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>This subject is currently empty, click the button below to add a card.
                  <br></br>You can add a text, math, image, or drawing card.
                  <br></br>Cards can be exported to a PDF to study on paper.
                </p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-auto">
                  <BackgroundButton
                    text={`Add Card to ${subject.name}`}
                    bgColor={
                      theme 
                        ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` 
                        : "bg-orange-500 hover:bg-orange-400"
                    }
                    onClick={handleOpenAddCardModal}
                    wWidth="w-full sm:w-auto mb-3 sm:mb-0"
                  />
                  <BackgroundButton
                    text="Import Cards"
                    bgColor={
                      theme 
                        ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` 
                        : "bg-orange-500 hover:bg-orange-400"
                    }
                    onClick={() => setIsImportModalOpen(true)}
                    wWidth="w-full sm:w-auto mb-3 sm:mb-0"
                  />
                  <BackgroundButton
                    text="Create New Subject"
                    bgColor={
                      theme 
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` 
                        : "bg-purple-500 hover:bg-purple-400"
                    }
                    onClick={handleCreateNewSubject}
                    wWidth="w-full sm:w-auto"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p 
                  className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}
                >
                  No subject selected
                </p>
                <div className="block sm:flex gap-4 mt-5 mx-4 sm:mx-0">
                  <BackgroundButton
                    text="Add Cards to Subject"
                    bgColor={
                      theme 
                        ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` 
                        : "bg-orange-500 hover:bg-orange-400"
                    }
                    onClick={handleOpenSubjectListModal}
                    wWidth="w-full sm:w-auto mb-3 sm:mb-0"
                  />
                  <BackgroundButton
                    text="Create New Subject"
                    bgColor={
                      theme 
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` 
                        : "bg-purple-500 hover:bg-purple-400"
                    }
                    onClick={handleCreateNewSubject}
                    wWidth="w-full sm:w-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EditModal
        subject={subject}
        card={cards[currentCardIndex]}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        text="Edit Question and Answer"
        handleUpsertCard={handleUpsertCard}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleUpsertCard}
        subject={subject}
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

      {/* Tooltip Popup for "Create" tutorial */}
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
                  Here you will create the flashcards to study in your Subjects! 
                  <br />
                  If you don't have a Subject, create one by clicking "Create New Subject".
                  <br />
                  Once you select a Subject, you can add new flashcards by clicking the "Add" button.
                  <li>You can edit a flashcard by clicking the pencil.</li>
                  <li>You can flip a flashcard by clicking anywhere on it.</li>
                  <li>You can delete a flashcard using the trash can icon.</li>
                  <li>You can export flashcards to a PDF to study on paper.</li>
                </p>
              </div>
            </div>
          </div>
        }
        firstActionText={'Got it!'}
        firstActionCol="bg-green-500 hover:bg-green-400"
        onFirstAction={handleDismissPopup}
      />

      {/* Popup for generating flashcards (not changed) */}
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

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default Create;