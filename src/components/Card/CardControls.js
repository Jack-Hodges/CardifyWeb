import BackgroundButton from '../Elements/BackgroundButton';
import FlashcardPDFExport from '../Functions/flashcardPDFExport';
import { useUser } from '../../UserContext';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import ImportModal from './ImportModal';
import { useState } from 'react';
import { toast } from 'react-toastify';

function CardControls({ 
    currentCardIndex, 
    totalCards, 
    onPrevClick, 
    onNextClick, 
    create = false, 
    themeText = 'text-gray-500 dark:text-gray-200', 
    cards,
    generateClick,
    onUpsertCard,
    subject
}) {
    const { theme } = useUser();
    const { shadow, primaryColor, secondaryColor } = theme;
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Conditional button for the next action
    const nextButton = currentCardIndex === totalCards && !create ? (
        <BackgroundButton text="Finish" onClick={onNextClick} bgColor={"bg-green-500 hover:bg-green-500"} />
    ) : (
        <BackgroundButton image={<ArrowRight strokeWidth={3} />} onClick={onNextClick} bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`} />
    );

    const handleImport = async (importedCards) => {
        try {
            // Add subject_id and user_id to each card
            const cardsToImport = importedCards.map(card => ({
                ...card,
                subject_id: subject.id,
                user_id: subject.user_id
            }));

            // Import each card
            for (const card of cardsToImport) {
                await onUpsertCard(card);
            }

            toast.success(`Successfully imported ${cardsToImport.length} cards`);
        } catch (error) {
            toast.error('Error importing cards: ' + error.message);
        }
    };

    return (
        <div className={`w-full h-12 flex items-center ${create ? 'justify-between' : 'justify-end'}`}>
            {/* Show these buttons only if `create` is true */}
            {create && (
                <div className="mt-2 flex">
                    <div className="mr-2">
                        <FlashcardPDFExport flashcards={cards} />
                    </div>
                    <BackgroundButton 
                        text="Import" 
                        image={<Upload />}
                        flip={true}
                        bgColor={`${primaryColor.bgClass} ${primaryColor.hoverClass}`} 
                        onClick={() => setIsImportModalOpen(true)}
                    />
                </div>
            )}
            
            <div className="h-12 flex items-center justify-center sm:justify-end mt-2">
                <div className="mt-0">
                    <BackgroundButton 
                        image={<ArrowLeft strokeWidth={3} />} 
                        onClick={onPrevClick} 
                        bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`} 
                    />
                </div>

                <p className={`text-2xl ${themeText} font-bold text-center w-16 ${shadow ? 'drop-shadow-custom' : ''}`}>
                    {currentCardIndex}/{totalCards}
                </p>

                <div className="mt-[0%]">
                    {nextButton}
                </div>
            </div>

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
                subject={subject}
            />
        </div>
    );
}

export default CardControls;