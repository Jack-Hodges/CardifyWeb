import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import ReactMarkdown from 'react-markdown';
import TitleBar from '../../components/Navigation/TitleBar';
import SubjectList from '../../components/Subject/SubjectList'; // If you need subject selection
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import GameComplete from '../../components/Elements/GameComplete';
import PageEmptyState from '../../components/Elements/PageEmptyState';
// Make sure you have functions handleSwitchToCreate and handleOpenSubjectListModal defined,
// and also ensure secondaryColor is defined from your theme context just like in Practice.

function Dash() {
    const [cards, setCards] = useState([]); 
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [fallingCards, setFallingCards] = useState([]);

    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

    const location = useLocation();
    const { subject } = location.state || {};
    const { user, getUser, theme } = useUser();
    const { textColor, shadow } = theme;

    const navigate = useNavigate();

    const handleOpenSubjectListModal = () => {
        setIsSubjectListModalOpen(true);
    };

    const handleSwitchToCreate = () => {
        navigate('/create', { state: { subject } });
    };

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

    useEffect(() => {
        if (gameOver) return;

        const spawnInterval = setInterval(() => {
            const newCard = generateFallingCard();
            if (newCard) {
                setFallingCards(prev => [...prev, newCard]);
            }
        }, 2000);

        return () => clearInterval(spawnInterval);
    }, [generateFallingCard, gameOver]);

    useEffect(() => {
        if (gameOver) return;

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
    }, [gameOver]);

    useEffect(() => {
        if (gameOver) return;

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
    }, [gameOver]);

    function handleCardClick(clickedCard) {
        if (gameOver) return;

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

    return (
      <div className="w-screen h-screen relative">
        {/* Fixed background - ensure it covers entire viewport */}
        <div 
          className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat z-0"
          style={{ 
            background: theme.image.startsWith('url(') || theme.image.startsWith('linear-gradient') || theme.image.startsWith('#') 
              ? theme.image 
              : `url(${theme.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        {/* Scrolling content */}
        <div className="relative z-10 min-h-screen pb-20">
            <TitleBar text="Dash" />

            {/* If no subject or no cards, show the snippet */}
            {(!subject || (cards && cards.length === 0)) ? (
                <PageEmptyState>
                  {subject ? (
                    <NoSelectionModal
                      text={`${subject.name} has no flashcards`}
                      subtext="Add some cards to this subject to start playing Dash."
                      text1={`Add Flashcards to ${subject.name}`}
                      action1={handleSwitchToCreate}
                    />
                  ) : (
                    <NoSelectionModal
                      text="No subject selected"
                      subtext="Pick a subject to start playing Dash."
                      text1="Select a subject to practice"
                      action1={handleOpenSubjectListModal}
                    />
                  )}
                </PageEmptyState>
            ) : gameOver ? (
                <GameComplete
                  title={`Time's up! Final score: ${score}`}
                  primaryText="Back to Home"
                  onPrimary={() => navigate('/home')}
                  secondaryText={`Play ${subject.name} again`}
                  onSecondary={() => window.location.reload()}
                />
            ) : (
                // Otherwise, show the game area
                <React.Fragment>
                    {/* Stats Bar */}
                    <div className="flex justify-between items-center mb-6 p-4">
                        <div className="flex items-center gap-2">
                            <Timer className="text-blue-500" />
                            <span className={`text-2xl font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'textColor'}`}>{timeLeft}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="text-yellow-500" />
                            <span className={`text-2xl font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'textColor'}`}>{score}</span>
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

                    </div>
                </React.Fragment>
            )}

            <SubjectList 
              isOpen={isSubjectListModalOpen} 
              onClose={() => setIsSubjectListModalOpen(false)}
              user={user}
              page='dash'
            />
        </div>
        </div>
    );
}

export default Dash;