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
import CustomModal from "../components/Modals/CustomModal";
import CreateImage from '../images/tutorial/Create.png';
import EditModal from '../components/Card/EditModal';
import ImportModal from '../components/Modals/ImportModal';
import GenerateModal from '../components/Modals/GenerateModal';
import { ToastContainer, toast } from 'react-toastify';
import NoSelectionModal from '../components/Modals/NoSelectionModal';
import PageEmptyState from '../components/Elements/PageEmptyState';
import { saveProfile } from '../components/Profile/ProfileManipulation';
import { parseGeneratedFlashcards } from '../components/Card/ImportService';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from 'react-helmet-async';

function Create() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createPopUp, setCreatePopUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};

  const { user, theme, popupStates, updatePopupState, profile } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor, shadow } = theme;


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

  const handleGenerate = async (count, topic) => {
    try {
      setIsGenerating(true);
      // Check if user has exceeded their daily limit
      const dailyLimit = profile.pro ? 60 : 20;
      if (profile.generation_count + count > dailyLimit) {
        toast.error(`Daily limit exceeded. You can generate ${dailyLimit - profile.generation_count} more cards today. Generation resets at 12am Australian Eastern Time.`);
        setIsGenerating(false);
        setIsGenerateModalOpen(false);
        return;
      }

      const response = await fetch('/api/flashcardGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count, topic })
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const text = await response.text();
      const cards = parseGeneratedFlashcards(text);
      
      // Add subject_id and user_id to each card
      const cardsToImport = cards.map(card => ({
        ...card,
        subject_id: subject.id,
        user_id: subject.user_id
      }));

      // Import each card
      for (const card of cardsToImport) {
        await handleUpsertCard(card);
      }

      // Update the generation count
      await saveProfile(
        profile.id,
        profile.first_name,
        profile.theme,
        profile.sort_preference,
        profile.card_art,
        profile.generation_count + cards.length
      );

      toast.success(`Successfully generated ${cards.length} cards about ${topic}`);
      setIsGenerateModalOpen(false);
    } catch (error) {
      toast.error('Error generating cards: ' + error.message);
      setIsGenerateModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

        return (
    <div className="w-screen h-screen relative">
      <Helmet>
        <title>Create Flashcards - Cardify | Design Custom Study Cards</title>
        <meta name="description" content="Create custom flashcards with text, mathematical equations, images, and drawings. Use AI-powered generation, import from files, or design from scratch. Export to PDF when ready." />
        <meta name="keywords" content="create flashcards, custom study cards, math equations, flashcard design, AI flashcard generation, study materials creation" />
        <link rel="canonical" href="https://cardify.app/create" />
        <meta property="og:title" content="Create Flashcards - Cardify" />
        <meta property="og:description" content="Create custom flashcards with text, math, images, and drawings. AI-powered generation available." />
        <meta property="og:url" content="https://cardify.app/create" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      {/* Fixed background - ensure it covers entire viewport */}
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
        style={{
          background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#')
            ? theme.image
            : `url(${theme.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
        
        {/* Scrolling content */}
        <div className="relative z-10 min-h-screen pb-20">
      <TitleBar text="Create" user={user}/>

      <div className="block lg:flex w-screen h-screen">
        {loading ? (
          <PageEmptyState>
            <div className="animate-pulse space-y-4 w-full max-w-2xl">
              <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-12 w-3/4 rounded"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-12 w-1/2 rounded"></div>
            </div>
          </PageEmptyState>
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
                  generateClick={() => setIsGenerateModalOpen(true)}
                  onUpsertCard={handleUpsertCard}
                  subject={subject}
                  isGenerateModalOpen={isGenerateModalOpen}
                  setIsGenerateModalOpen={setIsGenerateModalOpen}
                  isGenerating={isGenerating}
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
          <PageEmptyState>
            {subject ? (
              <div className="flex flex-col justify-center items-center gap-4 max-w-2xl">
                <p 
                  className={`${theme ? theme.textClass : 'text-gray-500'} text-3xl sm:text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}
                >
                  {subject.name} has no flashcards
                </p>
                <p className={`${theme ? theme.textClass : 'textColor'} text-lg sm:text-xl font-medium text-center opacity-90 ${shadow ? 'drop-shadow-custom' : ''}`}>
                  This subject is currently empty. Add a text, math, image, or drawing card — or import and generate cards in bulk.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-3 w-full sm:w-auto items-center justify-center">
                  <BackgroundButton
                    text={`Add Card to ${subject.name}`}
                    bgColor={
                      theme 
                        ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` 
                        : "bg-orange-500 hover:bg-orange-400"
                    }
                    onClick={handleOpenAddCardModal}
                    wWidth="w-full sm:w-auto"
                  />
                  <BackgroundButton
                    text="Import Cards"
                    bgColor={
                      theme 
                        ? `${primaryColor.bgClass} ${primaryColor.hoverClass}` 
                        : "bg-orange-500 hover:bg-orange-400"
                    }
                    onClick={() => setIsImportModalOpen(true)}
                    wWidth="w-full sm:w-auto"
                  />
                  <BackgroundButton
                    text="Generate Flashcards"
                    bgColor={
                      theme 
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` 
                        : "bg-purple-500 hover:bg-purple-400"
                    }
                    wWidth="w-full sm:w-auto"
                    onClick={() => setIsGenerateModalOpen(true)}
                  />
                </div>
              </div>
            ) : (
              <NoSelectionModal
                text="No subject selected"
                subtext="Choose an existing subject or create a new one to start adding cards."
                text1="Add Cards to Subject"
                text2="Create New Subject"
                action1={handleOpenSubjectListModal}
                action2={handleCreateNewSubject}
              />
            )}
          </PageEmptyState>
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

      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
}

export default Create;