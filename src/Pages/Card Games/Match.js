import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import ReactMarkdown from 'react-markdown';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';

function Match() {
    const [cards, setCards] = useState([]); 
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [currentCard, setCurrentCard] = useState(null);
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);

    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

    const location = useLocation();
    const { subject } = location.state || {};
    const { user, getUser, theme } = useUser();
    const { shadow, secondaryColor } = theme;

    const navigate = useNavigate();

    const handleOpenSubjectListModal = () => {
        setIsSubjectListModalOpen(true);
    };

    const handleSwitchToCreate = () => {
        navigate('/create', { state: { subject } });
    };

    // Function to get random cards excluding the current card
    const getRandomCards = (currentCard, count) => {
        const availableCards = cards.filter(card => card.id !== currentCard.id);
        const shuffled = [...availableCards].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Function to set up a new round
    const setupNewRound = useCallback(() => {
        if (cards.length < 4) return; // Need at least 4 cards for the game

        // Select a random card as the current card
        const randomIndex = Math.floor(Math.random() * cards.length);
        const newCurrentCard = cards[randomIndex];
        setCurrentCard(newCurrentCard);

        // Get 2 random wrong answers
        const wrongOptions = getRandomCards(newCurrentCard, 2);
        
        // Combine correct and wrong answers and shuffle them
        const allOptions = [...wrongOptions, newCurrentCard]
            .sort(() => 0.5 - Math.random());
        
        setOptions(allOptions);
        setSelectedOption(null);
        setIsCorrect(null);
    }, [cards]);

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
        if (cards.length >= 4) {
            setupNewRound();
        }
    }, [cards, setupNewRound]);

    const handleOptionSelect = (selectedCard) => {
        if (selectedOption) return; // Prevent multiple selections
        
        setSelectedOption(selectedCard);
        const correct = selectedCard.id === currentCard.id;
        setIsCorrect(correct);
        
        if (correct) {
            setScore(prev => prev + 1);
        }

        // Wait 1.5 seconds before moving to next round
        setTimeout(() => {
            setupNewRound();
        }, 1500);
    };

    return (
        <div className="w-screen h-screen overflow-y-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
            <TitleBar text="Match" />

            {/* If no subject or no cards, show the snippet */}
            {(!subject || (cards && cards.length < 4)) ? (
                <div className="flex flex-col justify-center items-center w-full h-full">
                  {subject ? (
                    <div>
                      <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>
                        {cards.length < 4 ? 'Need at least 4 flashcards to play' : 'No subject selected'}
                      </p>
                      <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton 
                          text={cards.length < 4 ? `Add More Flashcards to ${subject.name}` : "Select a subject to practice"} 
                          bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} 
                          onClick={cards.length < 4 ? handleSwitchToCreate : handleOpenSubjectListModal} 
                          wWidth='w-full sm:w-auto'
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>No subject selected</p>
                      <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton 
                          text="Select a subject to practice" 
                          bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} 
                          onClick={handleOpenSubjectListModal} 
                          wWidth='w-full sm:w-auto'
                        />
                      </div>
                    </div>
                  )}
                </div>
            ) : (
                // Game area
                <div className="flex flex-col items-center p-4">
                    {/* Score and Timer */}
                    <div className="flex justify-between w-full max-w-2xl mb-8">
                        <div className="flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            <span className={`${theme ? theme.textClass : 'textColor'} text-xl`}>Score: {score}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Timer className="w-6 h-6" />
                            <span className={`${theme ? theme.textClass : 'textColor'} text-xl`}>{timeLeft}s</span>
                        </div>
                    </div>

                    {/* Current Card */}
                    <div className={`w-full max-w-2xl p-6 mb-8 rounded-lg ${theme ? theme.cardClass : 'bg-white'} ${shadow ? 'shadow-lg' : ''}`}>
                        <ReactMarkdown className={`${theme ? theme.textClass : 'textColor'}`}>
                            {currentCard?.front}
                        </ReactMarkdown>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                        {options.map((option, index) => (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(option)}
                                disabled={selectedOption !== null}
                                className={`p-4 rounded-lg transition-all ${
                                    selectedOption === option
                                        ? isCorrect
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                        : theme
                                            ? theme.cardClass
                                            : 'bg-white'
                                } ${shadow ? 'shadow-lg' : ''} ${
                                    selectedOption === null
                                        ? 'hover:scale-105'
                                        : ''
                                }`}
                            >
                                <ReactMarkdown className={`${theme ? theme.textClass : 'textColor'}`}>
                                    {option.back}
                                </ReactMarkdown>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <SubjectList 
                isOpen={isSubjectListModalOpen} 
                onClose={() => setIsSubjectListModalOpen(false)}
                user={user}
                page='match'
            />
        </div>
    );
}

export default Match;