import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import CardControls from '../components/Card/CardControls';
import CardList from '../components/Card/CardList';
import { useNavigate } from 'react-router-dom';
import { fetchCards, upsertCard, deleteCard, restoreCard, sortCardsById, updateCardsSortOrder } from '../components/Card/CardManipulation';
import TitleBar from '../components/Navigation/TitleBar';
import BackgroundButton from '../components/Elements/BackgroundButton';
import AddSubject from '../components/Subject/AddSubject';
import { saveSubject, TUTORIAL_SUBJECT_ID } from '../components/Subject/SubjectManipulation';
import { useUser } from '../UserContext';
import SubjectList from '../components/Subject/SubjectList';
import EditModal from '../components/Card/EditModal';
import ImportModal from '../components/Modals/ImportModal';
import NoSelectionModal from '../components/Modals/NoSelectionModal';
import PageEmptyState from '../components/Elements/PageEmptyState';
import { saveProfile } from '../components/Profile/ProfileManipulation';
import featureFlags from '../config/featureFlags';
import NotesGeneratePanel from '../components/Card/NotesGeneratePanel';
import { parseGeneratedFlashcards } from '../components/Card/ImportService';
import useSubjectFromRoute from '../hooks/useSubjectFromRoute';
import supabase from '../supabaseClient';
import { Helmet } from 'react-helmet-async';
import { toast } from '../components/Toast';
import SpotlightTour from '../components/Tutorial/SpotlightTour';
import usePageTour from '../components/Tutorial/usePageTour';
import { CREATE_STEPS } from '../components/Tutorial/tourSteps';

function Create() {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animateFlip] = useState(true);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();
  const { subject, loadingSubject } = useSubjectFromRoute();
  const isTutorialSubject = subject?.id === TUTORIAL_SUBJECT_ID;

  const { user, theme, profile } = useUser();
  const { primaryColor, secondaryColor, tertiaryColor, shadow } = theme;

  const tour = usePageTour({
    key: 'create_popup',
    steps: CREATE_STEPS,
    ready: !loading && !loadingSubject,
  });

  useEffect(() => {
    if (loadingSubject) return;
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
    return () => {
      isMounted = false;
    };
  }, [subject?.id, loadingSubject]);

  const handleUpsertCard = async (cardData, file) => {
    if (isTutorialSubject) {
      toast.info('Sample subject cards are read only');
      return;
    }
    const isNewCard = !cardData.id;
    await upsertCard(cardData, file);
    const updatedCards = await fetchCards(subject.id);
    sortCardsById(updatedCards);
    setCards(updatedCards);
    if (isNewCard) {
      setCurrentCardIndex(updatedCards.length - 1);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (isTutorialSubject) {
      toast.info('Sample subject cards are read only');
      return;
    }
    const deleted = await deleteCard(cards, cardId, currentCardIndex, setCards, setCurrentCardIndex);
    if (!deleted) return;
    toast.info(
      ({ closeToast }) => (
        <div className="flex items-center gap-3">
          <span>Card deleted</span>
          <button
            type="button"
            className="underline font-bold text-blue-300 hover:text-blue-200"
            onClick={async () => {
              const restored = await restoreCard(deleted);
              if (restored) {
                const updated = await fetchCards(subject.id);
                sortCardsById(updated);
                setCards(updated);
                toast.success('Card restored');
              }
              closeToast();
            }}
          >
            Undo
          </button>
        </div>
      ),
      { autoClose: 10000 }
    );
  };

  const handleReorderCards = async (reordered, move) => {
    if (isTutorialSubject) return;
    setCards(reordered);
    if (move && currentCardIndex === move.from) {
      setCurrentCardIndex(move.to);
    } else if (move) {
      // Keep the same card selected when other cards move around it
      if (move.from < currentCardIndex && move.to >= currentCardIndex) {
        setCurrentCardIndex(currentCardIndex - 1);
      } else if (move.from > currentCardIndex && move.to <= currentCardIndex) {
        setCurrentCardIndex(currentCardIndex + 1);
      }
    }
    await updateCardsSortOrder(reordered);
  };

  const handleCardClick = (index) => {
    setFlipped(false);
    setCurrentCardIndex(index);
  };

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true);
  };

  const handleCreateNewSubject = () => {
    setIsAddSubjectModalOpen(true);
  };

  const handleSaveSubject = async (id, subjectName, subjectColor, subjectIntensity, up_to_index, collectionId) => {
    const data = await saveSubject(
      id,
      subjectName,
      subjectColor,
      subjectIntensity,
      user.id,
      up_to_index ?? null,
      collectionId
    );
    if (data) {
      setIsAddSubjectModalOpen(false);
      navigate(`/create/${data[0].id}`, { state: { subject: data[0] } });
    }
  };

  const handleOpenAddCardModal = () => {
    if (isTutorialSubject) {
      toast.info('Sample subject cards are read only');
      return;
    }
    const maxCards = profile.pro ? 500 : 100;
    if (profile.flashcard_count >= maxCards) {
      toast.error(
        `You've reached your card limit of ${maxCards} cards. ${profile.pro ? '' : 'Upgrade to Pro for up to 500 cards!'}`
      );
      return;
    }
    setIsModalOpen(true);
  };

  const openGenerate = () => {
    if (!featureFlags.aiGenerate) {
      toast.info('AI generate is currently disabled.');
      return;
    }
    setIsGenerateModalOpen(true);
  };

  const handleGenerate = async (count, topic) => {
    if (!featureFlags.aiGenerate) {
      toast.info('AI generate is currently disabled.');
      return;
    }
    try {
      setIsGenerating(true);
      const dailyLimit = profile.pro ? 60 : 20;
      if (profile.generation_count + count > dailyLimit) {
        toast.error(
          `Daily limit exceeded. You can generate ${dailyLimit - profile.generation_count} more cards today.`
        );
        setIsGenerating(false);
        setIsGenerateModalOpen(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error('You must be signed in to generate flashcards.');
      }

      const response = await fetch('/api/flashcardGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ count, topic }),
      });

      if (!response.ok) {
        let detail = 'Failed to generate flashcards';
        try {
          const errBody = await response.json();
          if (errBody?.error) detail = errBody.error;
        } catch {
          if (response.status === 404) {
            detail =
              'Generate API not reachable. Run `npm run server` on port 3001 for local development.';
          }
        }
        throw new Error(detail);
      }

      const text = await response.text();
      const generated = parseGeneratedFlashcards(text);

      const cardsToImport = generated.map((card) => ({
        ...card,
        subject_id: subject.id,
        user_id: subject.user_id,
      }));

      for (const card of cardsToImport) {
        await handleUpsertCard(card);
      }

      await saveProfile(
        profile.id,
        profile.first_name,
        profile.theme,
        profile.sort_preference,
        profile.card_art,
        profile.generation_count + generated.length
      );

      toast.success(`Successfully generated ${generated.length} cards about ${topic}`);
      setIsGenerateModalOpen(false);
    } catch (error) {
      toast.error('Error generating cards: ' + error.message);
      setIsGenerateModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-screen h-[100dvh] relative overflow-hidden">
      <Helmet>
        <title>Create Flashcards - Cardify | Design Custom Study Cards</title>
        <meta
          name="description"
          content="Create custom flashcards with text, mathematical equations, images, and drawings."
        />
        <link rel="canonical" href="https://cardify.app/create" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
        style={{
          background:
            theme.image.startsWith('url(') ||
            theme.image.startsWith('linear-gradient') ||
            theme.image.startsWith('#')
              ? theme.image
              : `url(${theme.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <TitleBar text="Create" user={user} />

        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div className="block lg:flex w-full h-auto lg:h-full lg:min-h-0">
            {loading || loadingSubject ? (
              <PageEmptyState>
                <div className="animate-pulse space-y-4 w-full max-w-2xl">
                  <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full rounded-lg" />
                  <div className="bg-gray-300 dark:bg-gray-600 h-12 w-3/4 rounded" />
                </div>
              </PageEmptyState>
            ) : cards.length > 0 ? (
              <>
                <div className="w-full lg:w-[70%] px-5 h-3/5 mt-5 sm:mt-14">
                  <Card
                    card={cards[currentCardIndex]}
                    flipped={flipped}
                    setFlipped={setFlipped}
                    animateFlip={animateFlip}
                    cardId={cards[currentCardIndex]?.id}
                    onDeleteCard={isTutorialSubject ? undefined : handleDeleteCard}
                    edit={!isTutorialSubject}
                    onUpsertCard={handleUpsertCard}
                    dataTour="create-card-flip"
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
                    readOnly={isTutorialSubject}
                    themeText={theme.textClass}
                    themeSecondary={secondaryColor}
                    themeTertiary={tertiaryColor}
                    cards={cards}
                    generateClick={openGenerate}
                    onGenerate={handleGenerate}
                    onUpsertCard={handleUpsertCard}
                    subject={subject}
                    isGenerateModalOpen={featureFlags.aiGenerate && isGenerateModalOpen}
                    setIsGenerateModalOpen={setIsGenerateModalOpen}
                    isGenerating={isGenerating}
                  />
                </div>

                <div className="w-full lg:w-[30%] mt-20 lg:mt-0 pr-5 lg:pr-6 pl-4 lg:pl-2" data-tour="create-card-list">
                  <CardList
                    cards={cards}
                    onCardClick={handleCardClick}
                    onUpsertCard={handleUpsertCard}
                    onDeleteCard={handleDeleteCard}
                    onReorder={isTutorialSubject ? undefined : handleReorderCards}
                    subject={subject}
                    themeText={theme.textClass}
                    passedInColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
                    selectedIndex={currentCardIndex}
                    readOnly={isTutorialSubject}
                    onAddClick={() => {
                      const maxCards = profile.pro ? 500 : 100;
                      if (profile.flashcard_count >= maxCards) {
                        toast.error(
                          `You've reached your card limit of ${maxCards} cards. ${profile.pro ? '' : 'Upgrade to Pro for up to 500 cards!'}`
                        );
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
                    <p
                      className={`${theme ? theme.textClass : 'textColor'} text-lg sm:text-xl font-medium text-center opacity-90 ${shadow ? 'drop-shadow-custom' : ''}`}
                    >
                      {isTutorialSubject
                        ? 'This is a sample subject — browse the cards to see how Cardify works.'
                        : 'Add a card, import a file, or generate with AI.'}
                    </p>
                    {!isTutorialSubject && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-3 w-full sm:w-auto items-center justify-center">
                      <BackgroundButton
                        text={`Add Card to ${subject.name}`}
                        bgColor={
                          theme
                            ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                            : 'bg-orange-500 hover:bg-orange-400'
                        }
                        onClick={handleOpenAddCardModal}
                        wWidth="w-full sm:w-auto"
                        dataTour="create-add-card"
                      />
                      <BackgroundButton
                        text="Import Cards"
                        bgColor={
                          theme
                            ? `${primaryColor.bgClass} ${primaryColor.hoverClass}`
                            : 'bg-orange-500 hover:bg-orange-400'
                        }
                        onClick={() => setIsImportModalOpen(true)}
                        wWidth="w-full sm:w-auto"
                        dataTour="create-import"
                      />
                      {featureFlags.aiGenerate && (
                        <BackgroundButton
                          text="Generate Flashcards"
                          bgColor={
                            theme
                              ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
                              : 'bg-purple-500 hover:bg-purple-400'
                          }
                          wWidth="w-full sm:w-auto"
                          onClick={openGenerate}
                        />
                      )}
                    </div>
                    )}
                  </div>
                ) : (
                  <NoSelectionModal
                    text="No subject selected"
                    subtext="Choose an existing subject or create a new one to start adding cards."
                    text1="Add Cards to Subject"
                    text2="Create New Subject"
                    action1={handleOpenSubjectListModal}
                    action2={handleCreateNewSubject}
                    dataTour="create-pick-subject"
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

          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleUpsertCard}
            subject={subject}
          />

          {featureFlags.aiGenerateFromNotes && subject && (
            <div className="fixed bottom-4 right-4 z-40 w-[min(100%,24rem)] px-3">
              <NotesGeneratePanel
                onGenerated={async (text) => {
                  const generated = parseGeneratedFlashcards(text);
                  for (const card of generated) {
                    await handleUpsertCard({
                      ...card,
                      subject_id: subject.id,
                      user_id: subject.user_id,
                    });
                  }
                }}
              />
            </div>
          )}

          <AddSubject
            isOpen={isAddSubjectModalOpen}
            onClose={() => setIsAddSubjectModalOpen(false)}
            onSave={handleSaveSubject}
            text="Create New Subject"
            user={user}
          />

          <SubjectList
            isOpen={isSubjectListModalOpen}
            onClose={() => setIsSubjectListModalOpen(false)}
            user={user}
            page="create"
          />

          <SpotlightTour
            active={tour.active}
            step={tour.currentStep}
            stepIndex={tour.stepIndex}
            totalSteps={tour.totalSteps}
            isLast={tour.isLast}
            onNext={tour.next}
            onSkip={tour.skip}
          />

        </div>
      </div>
    </div>
  );
}

export default Create;
