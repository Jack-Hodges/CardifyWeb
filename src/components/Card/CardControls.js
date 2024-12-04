import BackgroundButton from '../Elements/BackgroundButton';
import FlashcardPDFExport from '../Functions/flashcardPDFExport';
import { useUser } from '../../UserContext';

function CardControls({ currentCardIndex, totalCards, onPrevClick, onNextClick, create = false, themeText = 'text-gray-500 dark:text-gray-200', themeSecondary = 'bg-orange-500 hover:bg-orange-400', cards }) {

    const { theme } = useUser();
    const { shadow } = theme;

    const rightArrow = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
    );

    const leftArrow = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
    );

    // Conditional button for the next action
    const nextButton = currentCardIndex === totalCards && !create ? (
        <BackgroundButton text="Finish" onClick={onNextClick} bgColor={"bg-green-500 hover:bg-green-500"} />
    ) : (
        <BackgroundButton image={rightArrow} onClick={onNextClick} bgColor={`${themeSecondary.bgClass} ${themeSecondary.hoverClass}`} />
    );

    return (
        <div className="w-full h-12 flex items-center justify-between">
            <div className="mt-2">
                <FlashcardPDFExport flashcards={cards} />
            </div>
            
             <div className="h-12 flex items-center justify-center sm:justify-end mt-2">

                <div className="mt-0">
                    <BackgroundButton image={leftArrow} onClick={onPrevClick} bgColor={`${themeSecondary.bgClass} ${themeSecondary.hoverClass}`} />
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