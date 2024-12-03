import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Zap, Ban } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import ReactMarkdown from 'react-markdown';
import TitleBar from '../../components/Navigation/TitleBar';

function Dash() {
    const [cards, setCards] = useState([]); 
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [fallingCards, setFallingCards] = useState([]);
    const [isPaused, setIsPaused] = useState(false);

    const location = useLocation();
    const { subject } = location.state || {};
    const { user, getUser, theme } = useUser();

    // Initialize with a random target card
    useEffect(() => {
        if (!user) {
            getUser();
            return;
        }

        if (!subject) {
            setCards([]);
            return;
        }

        const loadCards = async () => {
            const data = await fetchCards(subject.id);
            setCards(data);
        };

        loadCards();
    }, [subject, user, getUser]);

    useEffect(() => {
        if (cards && cards.length > 0) {
            setCurrentTarget(cards[Math.floor(Math.random() * cards.length)]);
        }
    }, [cards]);

    // Generate a falling card
    const generateFallingCard = useCallback(() => {
        if (!currentTarget || !cards || cards.length === 0) return null;

        const possibleAnswers = [currentTarget.answer];
        const availableCards = cards.filter(card => card.answer !== currentTarget.answer);
        const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5);

        for (let card of shuffledCards) {
            if (possibleAnswers.length < Math.min(4, cards.length)) {
                possibleAnswers.push(card.answer);
            }
        }

        const shuffledAnswer = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];

        return {
            id: Date.now(),
            content: shuffledAnswer,
            xPosition: 20 + Math.random() * 60,
            yPosition: -10,
            speed: 1 + Math.random() * 1,
        };
    }, [currentTarget, cards]);

    // Spawn new cards periodically
    useEffect(() => {
        if (gameOver || isPaused) return;

        const spawnInterval = setInterval(() => {
            const newCard = generateFallingCard();
            if (newCard) {
                setFallingCards(prev => [...prev, newCard]);
            }
        }, 2000);

        return () => clearInterval(spawnInterval);
    }, [generateFallingCard, gameOver, isPaused]);

    // Move cards down
    useEffect(() => {
        if (gameOver || isPaused) return;

        const moveInterval = setInterval(() => {
            setFallingCards(prev => {
                return prev
                    .map(card => ({
                        ...card,
                        yPosition: card.yPosition + card.speed,
                    }))
                    .filter(card => card.yPosition < 100);
            });
        }, 50);

        return () => clearInterval(moveInterval);
    }, [gameOver, isPaused]);

    // Timer countdown
    useEffect(() => {
        if (gameOver || isPaused) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    setGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameOver, isPaused]);

    // Handle card click
    function handleCardClick(clickedCard) {
        if (gameOver || isPaused) return;

        if (clickedCard.content === currentTarget.answer) {
            setScore(prev => prev + 10);
            setTimeLeft(prev => prev + 5);
            setFallingCards(prev => prev.filter(card => card.id !== clickedCard.id));
            
            const newTarget = cards[Math.floor(Math.random() * cards.length)];
            setCurrentTarget(newTarget);
        } else {
            setTimeLeft(prev => Math.max(0, prev - 5));
        }
    }

    // Power-ups
    function slowTime() {
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 3000);
    }

    function clearScreen() {
        setFallingCards([]);
    }

    return (
        <div className="w-screen h-[100dvh] overflow-y-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
            <TitleBar text="Dash" />
            {/* Stats Bar */}
            <div className="flex justify-between items-center mb-6 p-4">
                <div className="flex items-center gap-2">
                    <Timer className="text-blue-500" />
                    <span className={`text-2xl font-bold ${theme ? theme.textClass : 'textColor'}`}>{timeLeft}s</span>
                </div>
                <div className="flex items-center gap-2">
                    <Zap className="text-yellow-500" />
                    <span className={`text-2xl font-bold ${theme ? theme.textClass : 'textColor'}`}>{score}</span>
                </div>
            </div>

            {/* Game Area */}
            <div className="relative h-[70dvh] rounded-lg overflow-hidden">
                {/* Falling Cards */}
                {fallingCards.map((card) => (
                    <div
                        key={card.id}
                        className="absolute p-3 bg-white rounded-lg shadow-md cursor-pointer hover:bg-blue-50 transition-colors transform -translate-x-1/2"
                        style={{
                            left: `${card.xPosition}%`,
                            top: `${card.yPosition}%`,
                        }}
                        onClick={() => handleCardClick(card)}
                    >
                        <div className="text-lg font-medium prose prose-sm max-w-none">
                            <ReactMarkdown>{card.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}

                {/* Target Card - Fixed at bottom */}
                {currentTarget && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-blue-200">
                        <div className="text-center text-xl font-bold prose max-w-none">
                            <ReactMarkdown>{currentTarget.question}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg text-center">
                            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                            <p className="text-xl">Final Score: {score}</p>
                            <button 
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                onClick={() => window.location.reload()}
                            >
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Power-up Bar */}
            <div className="flex justify-center gap-4 mt-4">
                <button 
                    className="px-4 py-2 bg-blue-100 rounded-lg flex items-center gap-2 hover:bg-blue-200"
                    onClick={slowTime}
                    disabled={isPaused}
                >
                    <Timer size={16} />
                    Slow Time
                </button>
                <button 
                    className="px-4 py-2 bg-purple-100 rounded-lg flex items-center gap-2 hover:bg-purple-200"
                    onClick={clearScreen}
                >
                    <Ban size={16} />
                    Clear All
                </button>
            </div>
        </div>
    );
}

export default Dash;