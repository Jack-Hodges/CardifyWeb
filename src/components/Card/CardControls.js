import BackgroundButton from '../Elements/BackgroundButton';

function CardControls({ currentCardIndex, totalCards, onPrevClick, onNextClick }) {

    const rightArrow = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
    )

    const leftArrow = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
    )

    return (
        <div className="w-full h-12 flex items-center justify-center sm:justify-end mt-2">

            <div className="mt-[0%]">
                <BackgroundButton image={leftArrow} onClick={onPrevClick} bgColor={"red"}/>
            </div>
            
            <p className="text-2xl text-gray-500 dark:text-gray-200 font-bold text-center w-16">
                {currentCardIndex}/{totalCards}
            </p>

            <div className="mt-[0%]">
                <BackgroundButton image={rightArrow} onClick={onNextClick} bgColor={"red"}/>
            </div>
            

        </div>
    );
}

export default CardControls;