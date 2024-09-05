import Left from '../../images/icons/leftArrow.png';
import Right from '../../images/icons/rightArrow.png';

function CardControls({ currentCardIndex, totalCards, onPrevClick, onNextClick }) {
    return (
        <div className="w-full h-12 flex items-center justify-center sm:justify-end mt-2">
            <img 
                className="h-12 pr-5 cursor-pointer" 
                src={Left} 
                alt="Previous Card" 
                onClick={onPrevClick} 
            />
            <p className="text-2xl text-gray-500 dark:text-gray-200 font-bold text-center w-16">
                {currentCardIndex}/{totalCards}
            </p>
            <img 
                className="h-12 pl-5 cursor-pointer" 
                src={Right} 
                alt="Next Card" 
                onClick={onNextClick} 
            />
        </div>
    );
}

export default CardControls;