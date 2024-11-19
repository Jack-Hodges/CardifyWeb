import { useEffect, useState, useRef } from 'react';
import { useUser } from '../../UserContext';
import { useLocation } from 'react-router-dom';
import { fetchCards } from "../../components/Card/CardManipulation";

import CardifyLogo from '../../images/Logos/CardifyLogoNoText.png';
import TitleBar from '../../components/Navigation/TitleBar';

// Helper function to shuffle an array
const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
};

// Format time from seconds to MM:SS
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function Memory() {
    const location = useLocation();
    const { subject } = location.state || {};
    const { user, getUser } = useUser();

    const [allCards, setAllCards] = useState([]); // Store all cards
    const [currentCardIndex, setCurrentCardIndex] = useState(0); // Track current page
    const [shuffledCards, setShuffledCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showCards, setShowCards] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Ref to store the timeout for flipping cards back
    const flipTimeoutRef = useRef(null);

    useEffect(() => {
        if (!user) {
            getUser();
            return;
        }

        const loadCards = async () => {
            setLoading(true);
            const data = await fetchCards(1);
            setAllCards(data);
            loadNextBatch(data, 0);
            setLoading(false);
            setIsTimerRunning(true);
        };

        loadCards();

        return () => {
            sessionStorage.removeItem('shuffledCards');
            // Clear any pending timeouts
            if (flipTimeoutRef.current) {
                clearTimeout(flipTimeoutRef.current);
            }
        };
    }, [subject, user, getUser]);

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const loadNextBatch = (cards, startIndex) => {
        const nextBatch = cards.slice(startIndex, startIndex + 5);
        const combinedCards = nextBatch.flatMap(card => [
            { id: card.id, content: card.question, isFront: true },
            { id: card.id, content: card.answer, isFront: false }
        ]);
        const shuffled = shuffleArray(combinedCards);
        setShuffledCards(shuffled);
        setFlippedCards([]);
    };

    const handleCardClick = async (card) => {
        if (gameCompleted || isProcessing) return;

        // If the card is already flipped or matched, do nothing
        if (flippedCards.some(flipped => flipped.id === card.id && flipped.isFront === card.isFront) 
            || matchedCards.includes(card.id)) {
            return;
        }

        // If we already have two cards flipped and they're not a match,
        // flip them back before showing the new card
        if (flippedCards.length === 2) {
            setIsProcessing(true);
            setFlippedCards([]);
            // Small delay to allow the cards to flip back
            await new Promise(resolve => setTimeout(resolve, 100));
            setIsProcessing(false);
            setFlippedCards([card]);
            return;
        }

        // Add the new card to flipped cards
        const newFlippedCards = [...flippedCards, card];
        setFlippedCards(newFlippedCards);

        // If we now have two cards flipped, check for a match
        if (newFlippedCards.length === 2) {
            const [firstCard, secondCard] = newFlippedCards;
            
            if (firstCard.id === secondCard.id && firstCard.isFront !== secondCard.isFront) {
                // It's a match!
                const newMatchedCards = [...matchedCards, firstCard.id];
                setMatchedCards(newMatchedCards);
                setFlippedCards([]);
                
                // Check if all cards are matched
                const allCurrentMatched = shuffledCards.every(c => 
                    newMatchedCards.includes(c.id) || c.id === firstCard.id
                );

                if (allCurrentMatched) {
                    if (currentCardIndex + 5 < allCards.length) {
                        setCurrentCardIndex(prev => prev + 5);
                        loadNextBatch(allCards, currentCardIndex + 5);
                    } else {
                        setIsTimerRunning(false);
                        setTimeout(() => {
                            setShowCards(false);
                            setGameCompleted(true);
                        }, 1000);
                    }
                }
            } else {
                // Not a match - leave cards visible briefly before auto-flipping
                flipTimeoutRef.current = setTimeout(() => {
                    setFlippedCards([]);
                    flipTimeoutRef.current = null;
                }, 1000);
            }
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="w-screen h-screen flex flex-col">
            <TitleBar text="Memory" />

            <div className="relative flex-1">
                <div 
                    className={`grid grid-cols-5 grid-rows-2 gap-4 w-full h-full p-4 transition-opacity duration-1000 
                        ${showCards ? 'opacity-100' : 'opacity-0'}`}
                    style={{ display: showCards ? 'grid' : 'none' }}
                >
                    {shuffledCards.map((card, index) => (
                        <MatchCard
                            key={`${card.id}-${card.isFront}-${index}`}
                            content={card.content}
                            onClick={() => handleCardClick(card)}
                            isFlipped={
                                flippedCards.some(
                                    flipped => 
                                        flipped.id === card.id && 
                                        flipped.isFront === card.isFront
                                ) || 
                                matchedCards.includes(card.id)
                            }
                            isMatched={matchedCards.includes(card.id)}
                        />
                    ))}
                </div>

                {gameCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-8 rounded-lg shadow-xl text-center transform transition-all duration-500 scale-100">
                            <h2 className="text-4xl font-bold text-green-600 mb-6">
                                🎉 Congratulations! 🎉
                            </h2>
                            <p className="text-2xl mb-6">
                                You completed the memory game in {formatTime(timer)}!
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-500 text-white px-8 py-3 rounded-lg text-xl hover:bg-blue-600 transition-colors"
                            >
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MatchCard({ content, onClick, isFlipped, isMatched }) {
    return (
        <div
            className={`rounded-3xl w-full h-full p-4 flex items-center justify-center cursor-pointer background-shadow background-hover 
                ${isMatched ? 'border-4 border-green-500' : ''} 
                ${isFlipped ? 'bg-white' : 'bg-gray-100'}`}
            onClick={onClick}
            style={{ userSelect: "none" }}
        >
            {isFlipped ? (
                <p className="text-center text-2xl font-bold" style={{ userSelect: "none" }}>
                    {content}
                </p>
            ) : (
                <img src={CardifyLogo} alt="Cardify Logo" className="w-16 h-16" />
            )}
        </div>
    );
}

export default Memory;