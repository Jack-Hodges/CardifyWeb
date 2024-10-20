import { useEffect, useState } from 'react';
import { useUser } from '../../UserContext';
import { useLocation } from 'react-router-dom';
import { fetchCards } from "../../components/Card/CardManipulation";

import CardifyLogo from '../../images/Logos/CardifyLogoNoText.png';
import TitleBar from '../../components/Navigation/TitleBar';

// Helper function to shuffle an array
const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
};

function Memory() {

    const location = useLocation(); // Access location object
    const { subject } = location.state || {};
    const { user, getUser } = useUser();

    const [shuffledCards, setShuffledCards] = useState([]); // Combined shuffled array
    const [loading, setLoading] = useState(true); // Loading state
    const [flippedCards, setFlippedCards] = useState([]); // Track flipped cards
    const [selectedCards, setSelectedCards] = useState([]); // Track selected cards
    const [matchedCards, setMatchedCards] = useState([]); // Track matched cards

    useEffect(() => {
        if (!user) {
            getUser();
            return;
        }
    
        if (!subject) {
            const loadCards = async () => {
                setLoading(true); // Start loading
                const data = await fetchCards(1); // Fetch flashcards with subject_id
    
                // Create one combined array of both fronts and backs
                const combinedCards = data.flatMap(card => [
                    { id: card.id, content: card.question, isFront: true },
                    { id: card.id, content: card.answer, isFront: false }
                ]);
    
                // Shuffle the combined array of fronts and backs on every reload
                const shuffled = shuffleArray(combinedCards);
                setShuffledCards(shuffled);
    
                // Store the shuffled cards in sessionStorage
                sessionStorage.setItem('shuffledCards', JSON.stringify(shuffled));
    
                setLoading(false); // Stop loading
            };
    
            loadCards();
        } else {
            setLoading(false); // Stop loading if no subject
        }
    
        // Clean up when the component unmounts (optional)
        return () => {
            sessionStorage.removeItem('shuffledCards');
        };
    }, [subject, user, getUser]);

    const handleCardClick = (card) => {
        // If the card is already flipped or matched, do nothing
        if (flippedCards.some(flipped => flipped.id === card.id && flipped.isFront === card.isFront)) return;
        if (matchedCards.includes(card.id)) return;
    
        // If two cards are already flipped, prevent any more flips until they are reset
        if (selectedCards.length === 2) return;
    
        // Flip the clicked card
        setFlippedCards([...flippedCards, card]);
    
        // Add the clicked card to the selected cards
        setSelectedCards([...selectedCards, card]);
    
        // If two cards are selected, check if they match
        if (selectedCards.length === 1) {
            const firstCard = selectedCards[0];
            const secondCard = card;
    
            // Check if the two cards match (same id, one front and one back)
            if (firstCard.id === secondCard.id && firstCard.isFront !== secondCard.isFront) {
                // It's a match, mark both sides as matched
                setMatchedCards([...matchedCards, firstCard.id]);
            }
    
            // Reset the selected cards after a short delay (to allow the user to see the second card)
            setTimeout(() => {
                setSelectedCards([]);
                setFlippedCards([]);
            }, 1000);
        }
    };

    if (loading) {
        return <p>Loading...</p>; // Display a loading message while cards are being fetched
    }

    return (
        <div className="w-screen h-screen flex flex-col"> {/* Full screen layout */}
            <TitleBar text="Memory" />
    
            <div className="grid grid-cols-5 grid-rows-2 gap-4 w-full h-full p-4">
                {shuffledCards.slice(0,10).map((card, index) => (
                    <MatchCard
                        key={index}
                        content={card.content}
                        onClick={() => handleCardClick(card)}
                        isFlipped={flippedCards.some(
                            (flipped) =>
                                flipped.id === card.id && flipped.isFront === card.isFront
                        ) || matchedCards.includes(card.id)}
                        isMatched={matchedCards.includes(card.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default Memory;
    
function MatchCard({ content, onClick, isFlipped, isMatched }) {
    return (
        <div
            className={`rounded-3xl w-full h-full p-4 flex items-center justify-center cursor-pointer background-shadow background-hover bg-white`}
            onClick={onClick}
            style={{ userSelect: "none" }} // Prevent text from being highlighted
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