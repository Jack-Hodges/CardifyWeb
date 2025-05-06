import { useEffect, useState, useRef } from 'react';
import { useUser } from '../../UserContext';
import { useLocation } from 'react-router-dom';
import { fetchCards } from "../../components/Card/CardManipulation";
import ReactMarkdown from 'react-markdown';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import { useNavigate } from 'react-router-dom';

import CardifyLogo from '../../images/Logos/CardifyLogoNoText.png';
import TitleBar from '../../components/Navigation/TitleBar';
import SubjectList from '../../components/Subject/SubjectList'; // Make sure this import is correct

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
    const { user, getUser, theme } = useUser();
    const { textColor, secondaryColor, tertiaryColor, image, shadow } = theme;
    const navigate = useNavigate();

    const [allCards, setAllCards] = useState([]); // Store all cards
    const [currentCardIndex, setCurrentCardIndex] = useState(0); // Track current batch index
    const [shuffledCards, setShuffledCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showCards, setShowCards] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

    // Ref to store the timeout for flipping cards back
    const flipTimeoutRef = useRef(null);

    const handleSwitchToHome = () => {
        navigate('/home');
    };

    const handleOpenSubjectListModal = () => {
        setIsSubjectListModalOpen(true);
    };

    useEffect(() => {
        if (!user) {
            getUser();
            return;
        }

        // If no subject is selected, we won't load cards.
        if (!subject) {
            setLoading(false);
            return;
        }

        const loadCards = async () => {
            setLoading(true);
            const data = await fetchCards(subject.id);
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
        // Create two card objects for each card. The back card will use image_url if backMode is 2 or 3.
        const combinedCards = nextBatch.flatMap(card => [
            { 
                id: card.id, 
                content: card.question, 
                isFront: true 
            },
            { 
                id: card.id, 
                content: (card.backMode === 2 || card.backMode === 3) ? card.image_url : card.answer, 
                isFront: false,
                isImage: (card.backMode === 2 || card.backMode === 3)
            }
        ]);
        const shuffled = shuffleArray(combinedCards);
        setShuffledCards(shuffled);
        setFlippedCards([]);
        setMatchedCards([]); // reset matched for new batch
    };

    const handleCardClick = async (card) => {
        if (gameCompleted || isProcessing || !subject) return;

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
                
                // Check if all cards in the current batch are matched
                const allCurrentMatched = shuffledCards.every(c => 
                    newMatchedCards.includes(c.id) || c.id === firstCard.id
                );

                if (allCurrentMatched) {
                    // Move to next batch or end game
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

    // Render logic
    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-cover bg-screen" style={{ backgroundImage: image }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-[100dvh] flex flex-col overflow-auto bg-cover bg-screen" style={{ backgroundImage: image }}>
            <TitleBar text="Memory" />

            {!subject ? (
                // No subject selected section
                <div className="flex flex-col justify-center items-center h-full w-full">
                    <p className={`${textColor} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>No subject selected</p>
                    <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton 
                            text="Select a subject to practice" 
                            bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'}
                            onClick={handleOpenSubjectListModal} 
                            wWidth='w-full sm:w-auto'
                        />
                    </div>

                    <SubjectList 
                        isOpen={isSubjectListModalOpen} 
                        onClose={() => setIsSubjectListModalOpen(false)}
                        user={user}
                        page='memory'
                    />
                </div>
            ) : (
                <div className="relative flex-1">
                    <div 
                        className={`grid grid-cols-2 sm:grid-cols-5 sm:grid-rows-2 gap-4 w-full h-full p-4 transition-opacity duration-1000 
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
                                isImage={card.isImage}
                            />
                        ))}
                    </div>

                    {gameCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-8 text-center transform transition-all duration-500 scale-100">
                                <h2 className={`text-4xl font-bold drop-shadow-custom ${textColor} mb-6`}>
                                    🎉 Congratulations! 🎉
                                </h2>
                                <p className={`text-2xl mb-6 font-bold drop-shadow-custom ${textColor}`}>
                                    You finished in {formatTime(timer)}!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <BackgroundButton 
                                        text="Back to Home" 
                                        bgColor={
                                            theme 
                                              ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` 
                                              : "bg-orange-500 hover:bg-orange-400"
                                          }
                                        onClick={handleSwitchToHome} 
                                    />
                                    <BackgroundButton 
                                        text={`Review ${subject.name} Again`} 
                                        bgColor={
                                            theme 
                                              ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` 
                                              : "bg-purple-500 hover:bg-purple-400"
                                          }
                                        onClick={() => window.location.reload()} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <SubjectList 
                        isOpen={isSubjectListModalOpen} 
                        onClose={() => setIsSubjectListModalOpen(false)}
                        user={user}
                        page={'memory'}
                    />
                </div>
            )}
        </div>
    );
}

function MatchCard({ content, onClick, isFlipped, isMatched, isImage }) {
    return (
        <div
            className={`rounded-3xl w-full h-full p-4 flex items-center justify-center cursor-pointer background-shadow-new background-hover 
                ${isMatched ? 'border-4 border-green-500' : ''} 
                ${isFlipped ? 'bg-white' : 'bg-gray-100'}`}
            onClick={onClick}
            style={{ userSelect: "none" }}
        >
            {isFlipped ? (
                isImage ? (
                    <img 
                        src={content} 
                        alt="Card back" 
                        className="max-w-full max-h-full object-contain" 
                        style={{ userSelect: "none" }}
                    />
                ) : (
                    <div className="text-center prose prose-sm max-w-full overflow-auto" style={{ userSelect: "none" }}>
                        <ReactMarkdown 
                            components={{
                                p: ({ node, ...props }) => {
                                    const content = props.children || "Default paragraph content";
                                    return <p className="text-2xl font-bold m-0" {...props}>{content}</p>;
                                },
                                h1: ({ node, ...props }) => {
                                    const content = props.children || "Default Heading 1";
                                    return <h1 className="text-2xl font-bold m-0" {...props}>{content}</h1>;
                                },
                                h2: ({ node, ...props }) => {
                                    const content = props.children || "Default Heading 2";
                                    return <h2 className="text-xl font-bold m-0" {...props}>{content}</h2>;
                                },
                                h3: ({ node, ...props }) => {
                                    const content = props.children || "Default Heading 3";
                                    return <h3 className="text-lg font-bold m-0" {...props}>{content}</h3>;
                                },
                                ul: ({ node, ...props }) => {
                                    const content = props.children || <li>Default list item</li>;
                                    return <ul className="list-disc m-0 pl-4" {...props}>{content}</ul>;
                                },
                                ol: ({ node, ...props }) => {
                                    const content = props.children || <li>Default ordered item</li>;
                                    return <ol className="list-decimal m-0 pl-4" {...props}>{content}</ol>;
                                },
                                li: ({ node, ...props }) => {
                                    const content = props.children || "Default list item";
                                    return <li className="m-0" {...props}>{content}</li>;
                                },
                                code: ({ node, ...props }) => {
                                    const content = props.children || "Default code snippet";
                                    return <code className="bg-gray-100 px-1 rounded" {...props}>{content}</code>;
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )
            ) : (
                <img src={CardifyLogo} alt="Cardify Logo" className="w-16 h-16" />
            )}
        </div>
    );
}

export default Memory;