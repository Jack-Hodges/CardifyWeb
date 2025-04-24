import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';

function Type() {
    const [cards, setCards] = useState([]); 
    const [filteredCards, setFilteredCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

    const location = useLocation();
    const { subject } = location.state || {};
    const { user, getUser, theme } = useUser();
    const { textColor, shadow, secondaryColor, tertiaryColor } = theme;

    const navigate = useNavigate();

    const handleOpenSubjectListModal = () => {
        setIsSubjectListModalOpen(true);
    };

    const handleSwitchToCreate = () => {
        navigate('/create', { state: { subject } });
    };

    // Fisher-Yates shuffle algorithm
    const shuffleCards = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
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
        // Filter out image cards and shuffle
        const nonImageCards = cards.filter(card => card.backMode !== 3);
        const shuffledCards = shuffleCards(nonImageCards);
        setFilteredCards(shuffledCards);
        setCurrentCardIndex(0);
        setUserAnswer('');
        setShowAnswer(false);
    }, [cards]);

    const handleAnswerSubmit = () => {
        if (!filteredCards[currentCardIndex]) return;
        
        const correctAnswer = filteredCards[currentCardIndex].answer.toLowerCase().trim();
        const userAnswerLower = userAnswer.toLowerCase().trim();
        
        setIsCorrect(correctAnswer === userAnswerLower);
        setShowAnswer(true);
    };

    const handleNextCard = () => {
        setCurrentCardIndex(prev => (prev + 1) % filteredCards.length);
        setUserAnswer('');
        setShowAnswer(false);
        setIsCorrect(false);
    };

    const handleSkipCard = () => {
        handleNextCard();
    };

    return (
        <div className="w-screen h-[100dvh] overflow-y-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
            <TitleBar text="Type" />

            {/* If no subject or no cards, show the snippet */}
            {(!subject || (filteredCards && filteredCards.length === 0)) ? (
                <div className="flex flex-col justify-center items-center w-full h-full">
                  {subject ? (
                    <div>
                      <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>{subject.name} has no flashcards</p>
                      <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton text={`Add Flashcards to ${subject.name}`} bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} onClick={handleSwitchToCreate} wWidth='w-full sm:w-auto'/>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className={`${theme ? theme.textClass : 'textColor'} text-4xl font-bold text-center ${shadow ? 'drop-shadow-custom' : ''}`}>No subject selected</p>
                      <div className="block sm:flex justify-center gap-4 mt-5 mx-4 sm:mx-auto">
                        <BackgroundButton text="Select a subject to practice" bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} onClick={handleOpenSubjectListModal} wWidth='w-full sm:w-auto'/>
                      </div>
                    </div>
                  )}
                </div>
            ) : (
                // Game area
                <div className="flex flex-col items-center justify-center p-4 w-full h-[100dvh]">
                    <div className="w-full h-1/2 flex flex-col items-center">
                        {!showAnswer ? (
                            <div className="w-3/5 mb-8 h-full">
                                <Card 
                                    card={filteredCards[currentCardIndex]} 
                                    flipped={false}
                                    setFlipped={() => {}}
                                    animateFlip={false}
                                    practice={false}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[93%] flex gap-4 ml-10 mr-10">
                                <div className="h-full w-full flex background-shadow-new bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl items-center justify-center">
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            u: ({ node, ...props }) => <u {...props} />,
                                        }}
                                        className={`text-xl sm:text-4xl text-gray-700 dark:text-gray-200 
                                        font-bold text-center`}
                                        >
                                        {filteredCards[currentCardIndex].answer}
                                    </ReactMarkdown>
                                </div>
                                <div className="h-full w-full flex background-shadow-new bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl items-center justify-center">
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            u: ({ node, ...props }) => <u {...props} />,
                                        }}
                                        className={`text-xl sm:text-4xl text-gray-700 dark:text-gray-200 
                                        font-bold text-center`}
                                        >
                                        {userAnswer}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                        
                    </div>

                    <div className="w-full max-w-2xl mb-4">
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAnswerSubmit();
                                }
                            }}
                            placeholder="Type your answer here..."
                            className="w-full p-4 text-xl rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                            disabled={showAnswer}
                        />
                    </div>

                    {/* {showAnswer && (
                        
                        <div className={`w-full max-w-2xl mb-4 p-4 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                            <Card 
                            card={filteredCards[currentCardIndex]} 
                            flipped={false}
                            setFlipped={() => {}}
                            animateFlip={false}
                            practice={false}
                        />
                        </div>
                    )} */}

                    <div className="flex gap-4">
                        {!showAnswer ? (
                            <>
                                <BackgroundButton 
                                    text="Skip Card" 
                                    bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} 
                                    onClick={handleSkipCard}
                                />
                                <BackgroundButton 
                                    text="Submit Answer" 
                                    bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} 
                                    onClick={handleAnswerSubmit}
                                />
                            </>
                        ) : (
                            <BackgroundButton 
                                text="Next Card" 
                                bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : 'bg-orange-500 hover:bg-orange-400'} 
                                onClick={handleNextCard}
                            />
                        )}
                    </div>
                </div>
            )}

            <SubjectList 
              isOpen={isSubjectListModalOpen} 
              onClose={() => setIsSubjectListModalOpen(false)}
              user={user}
              page='type'
            />
        </div>
    );
}

export default Type;