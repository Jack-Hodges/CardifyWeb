import BackgroundButton from '../Elements/BackgroundButton';
import FlashcardPDFExport from '../Functions/flashcardPDFExport';
import { useUser } from '../../UserContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';


function CardControls({ 
    currentCardIndex, 
    totalCards, 
    onPrevClick, 
    onNextClick, 
    create = false, 
    themeText = 'text-gray-500 dark:text-gray-200', 
    cards,
    generateClick 
}) {
    const { theme } = useUser();
    const { shadow, secondaryColor } = theme;

    // Conditional button for the next action
    const nextButton = currentCardIndex === totalCards && !create ? (
        <BackgroundButton text="Finish" onClick={onNextClick} bgColor={"bg-green-500 hover:bg-green-500"} />
    ) : (
        <BackgroundButton image={<ArrowRight strokeWidth={3} />} onClick={onNextClick} bgColor={`${secondaryColor.bgClass} ${secondaryColor.hoverClass}`} />
    );

    return (
        <div className={`w-full h-12 flex items-center ${create ? 'justify-between' : 'justify-end'}`}>
            {/* Show these buttons only if `create` is true */}
            {create && (
                <div className="mt-2 flex">
                    <div className="mr-2">
                        <FlashcardPDFExport flashcards={cards} />
                    </div>
                    {/* <BackgroundButton 
                        text="Generate Flashcards" 
                        bgColor={`${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`} 
                        onClick={generateClick}
                    /> */}
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
        </div>
    );
}

export default CardControls;