import BackgroundButton from '../Elements/BackgroundButton';
import { useUser } from '../../UserContext';
import { ArrowLeft, ArrowRight, Sparkles, Upload, Download, Share2 } from 'lucide-react';
import ImportModal from '../Modals/ImportModal';
import ExportModal from '../Modals/ExportModal';
import GenerateModal from '../Modals/GenerateModal';
import ShareSubjectModal from '../Modals/ShareSubjectModal';
import { useState } from 'react';
import { toast } from '../Toast';
import { adjustLocalFlashcardCount } from '../Profile/ProfileManipulation';
import featureFlags from '../../config/featureFlags';
import { TUTORIAL_SUBJECT_ID } from '../Subject/SubjectManipulation';

function CardControls({
  currentCardIndex,
  totalCards,
  onPrevClick,
  onNextClick,
  create = false,
  themeText = 'text-gray-500 dark:text-gray-200',
  cards,
  generateClick,
  onGenerate,
  onUpsertCard,
  onBulkImport,
  subject,
  isGenerateModalOpen,
  setIsGenerateModalOpen,
  isGenerating,
  readOnly = false,
}) {
  const { theme, setProfile } = useUser();
  const { shadow, primaryColor, secondaryColor } = theme;
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const canShare =
    create &&
    subject &&
    !readOnly &&
    !subject.permission &&
    subject.id !== TUTORIAL_SUBJECT_ID;
  const showGenerate = create && !readOnly && featureFlags.aiGenerate;

  const nextButton = currentCardIndex === totalCards && !create ? (
    <BackgroundButton text="Finish" onClick={onNextClick} bgColor="bg-green-500 hover:bg-green-500" />
  ) : (
    <BackgroundButton
      image={<ArrowRight strokeWidth={3} />}
      onClick={onNextClick}
      bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
    />
  );

  const handleImport = async (importedCards) => {
    try {
      if (typeof onBulkImport === 'function') {
        await onBulkImport(importedCards);
      } else {
        const cardsToImport = importedCards.map((card) => ({
          ...card,
          subject_id: subject.id,
          user_id: subject.user_id,
        }));
        for (const card of cardsToImport) {
          await onUpsertCard(card);
        }
        if (typeof setProfile === 'function') {
          adjustLocalFlashcardCount(setProfile, cardsToImport.length);
        }
      }

      toast.success(`Successfully imported ${importedCards.length} cards`);
    } catch (error) {
      toast.error('Error importing cards: ' + error.message);
    }
  };

  const openGenerate = () => {
    if (generateClick) generateClick();
    else if (setIsGenerateModalOpen) setIsGenerateModalOpen(true);
  };

  return (
    <div className={`w-full h-12 flex items-center ${create ? 'justify-between' : 'justify-end'}`}>
      {create && !readOnly && (
        <div className="mt-2 flex gap-2">
          {canShare && (
            <>
              <div className="hidden sm:block">
                <BackgroundButton
                  text="Share"
                  image={<Share2 />}
                  flip
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  onClick={() => setIsShareModalOpen(true)}
                />
              </div>
              <div className="block sm:hidden">
                <BackgroundButton
                  image={<Share2 />}
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  onClick={() => setIsShareModalOpen(true)}
                />
              </div>
            </>
          )}
          <div className="hidden sm:block">
            <BackgroundButton
              text="Export"
              image={<Download />}
              flip
              bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
              onClick={() => setIsExportModalOpen(true)}
              dataTour="create-export"
            />
          </div>
          <div className="block sm:hidden">
            <BackgroundButton
              image={<Download />}
              bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
              onClick={() => setIsExportModalOpen(true)}
              dataTour="create-export"
            />
          </div>
          <div className="hidden sm:block">
            <BackgroundButton
              text="Import"
              image={<Upload />}
              flip
              bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
              onClick={() => setIsImportModalOpen(true)}
              dataTour="create-import"
            />
          </div>
          <div className="block sm:hidden">
            <BackgroundButton
              image={<Upload />}
              bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
              onClick={() => setIsImportModalOpen(true)}
              dataTour="create-import"
            />
          </div>
          {showGenerate && (
            <>
              <div className="hidden sm:block">
                <BackgroundButton
                  text="Generate"
                  image={<Sparkles />}
                  flip
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  onClick={openGenerate}
                />
              </div>
              <div className="block sm:hidden">
                <BackgroundButton
                  image={<Sparkles />}
                  bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`}
                  onClick={openGenerate}
                />
              </div>
            </>
          )}
        </div>
      )}

      <div
        className="h-12 flex items-center justify-center sm:justify-end mt-2"
        data-tour={create ? undefined : 'practice-controls'}
      >
        <div className="mt-0">
          <BackgroundButton
            image={<ArrowLeft strokeWidth={3} />}
            onClick={onPrevClick}
            bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`}
          />
        </div>

        <p
          className={`text-2xl ${themeText} font-bold text-center min-w-[4.75rem] sm:min-w-[5.5rem] px-1 whitespace-nowrap ${shadow ? 'drop-shadow-custom' : ''}`}
        >
          {currentCardIndex}/{totalCards}
        </p>

        <div className="mt-[0%]">{nextButton}</div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        subject={subject}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        cards={cards}
        subject={subject}
      />

      <ShareSubjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        subject={subject}
      />

      {typeof onGenerate === 'function' && showGenerate && (
        <GenerateModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}

export default CardControls;
