import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import { fetchCards } from '../../components/Card/CardManipulation';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import Card from '../../components/Card/Card';
import { EditableMathField, addStyles } from 'react-mathquill';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import GameComplete from '../../components/Elements/GameComplete';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameSettings from '../../components/Games/GameSettings';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
addStyles();

function Type() {
    const [cards, setCards] = useState([]); 
    const [filteredCards, setFilteredCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);

    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [skippedCount, setSkippedCount] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [finished, setFinished] = useState(false);
    const [cardCount, setCardCount] = useState(20);
    const [shuffleOn, setShuffleOn] = useState(true);
    const [started, setStarted] = useState(false);

    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

    const { subject } = useSubjectFromRoute();
    const { user, getUser, theme } = useUser();
    const { shadow, secondaryColor, tertiaryColor } = theme;

    const navigate = useNavigate();

    const handleOpenSubjectListModal = () => {
        setIsSubjectListModalOpen(true);
    };

    const handleSwitchToCreate = () => {
        if (subject) navigate(`/create/${subject.id}`, { state: { subject } });
        else navigate('/create');
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
            setStarted(false);
            return;
        }

        const loadCards = async () => {
            const data = await fetchCards(subject.id);
            setCards(data);
            setCardCount(Math.min(20, data.filter((c) => c.backMode !== 3).length || 1));
            setStarted(false);
            setFinished(false);
        };

        loadCards();
    }, [subject, user, getUser]);

    const handleStart = () => {
        const nonImageCards = cards.filter((card) => card.backMode !== 3);
        let pool = shuffleOn ? shuffleCards(nonImageCards) : nonImageCards;
        pool = pool.slice(0, Math.min(cardCount, pool.length));
        setFilteredCards(pool);
        setCurrentCardIndex(0);
        setUserAnswer('');
        setShowAnswer(false);
        setCorrectCount(0);
        setIncorrectCount(0);
        setSkippedCount(0);
        setProcessedCount(0);
        setFinished(false);
        setStarted(true);
    };

    const handleAnswerSubmit = () => {
        if (!filteredCards[currentCardIndex]) return;
        setShowAnswer(true);
    };

    const handleSkipCard = () => {
        setSkippedCount(s => s + 1);
        const nextProcessed = processedCount + 1;
        if (nextProcessed >= filteredCards.length) {
          setFinished(true);
        } else {
          setProcessedCount(nextProcessed);
          setCurrentCardIndex(prev => prev + 1);
          setUserAnswer('');
          setShowAnswer(false);
        }
    };

    const advanceCard = () => {
      const nextProcessed = processedCount + 1;
      if (nextProcessed >= filteredCards.length) {
        setFinished(true);
      } else {
        setProcessedCount(nextProcessed);
        setCurrentCardIndex(prev => prev + 1);
        setUserAnswer('');
        setShowAnswer(false);
      }
    };

    const handleMarkCorrect = () => {
      setCorrectCount(c => c + 1);
      advanceCard();
    };

    const handleMarkIncorrect = () => {
      setIncorrectCount(i => i + 1);
      advanceCard();
    };

    if (finished) {
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
            <TitleBar text="Type" />
            <GameComplete
              title="Session Complete!"
              primaryText="Back to Home"
              onPrimary={() => navigate('/home')}
              secondaryText={`Review ${subject?.name} Again`}
              onSecondary={() => {
                setFinished(false);
                setStarted(false);
                // Reset counts
                setCorrectCount(0);
                setIncorrectCount(0);
                setSkippedCount(0);
                setProcessedCount(0);
                // Reshuffle and reset cards
                const nonImage = cards.filter(card => card.backMode !== 3);
                const reshuffled = shuffleCards(nonImage);
                setFilteredCards(reshuffled);
                setCurrentCardIndex(0);
                setUserAnswer('');
                setShowAnswer(false);
              }}
            >
              <div className={`${theme ? theme.textClass : 'textColor'} text-xl font-semibold space-y-2 ${shadow ? 'drop-shadow-custom' : ''}`}>
                <p>{correctCount} Correct</p>
                <p>{incorrectCount} Incorrect</p>
                <p>{skippedCount} Skipped</p>
              </div>
            </GameComplete>
          </div>
        </div>
      );
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
            <TitleBar text="Type" />

            {/* If no subject or no cards, show the snippet */}
            {(!subject || cards.length === 0) ? (
                <PageEmptyState>
                  {subject ? (
                    <NoSelectionModal
                      text={`${subject.name} has no flashcards`}
                      subtext="Add some flashcards to this subject to start playing Type."
                      text1={`Add Flashcards to ${subject.name}`}
                      action1={handleSwitchToCreate}
                    />
                  ) : (
                    <NoSelectionModal
                      text="No subject selected"
                      subtext="Pick a subject to start playing Type."
                      text1="Select a subject to practice"
                      action1={handleOpenSubjectListModal}
                    />
                  )}
                </PageEmptyState>
            ) : !started ? (
                <PageEmptyState>
                  <GameSettings
                    cardCount={cardCount}
                    setCardCount={setCardCount}
                    maxCards={Math.max(1, cards.filter((c) => c.backMode !== 3).length)}
                    shuffle={shuffleOn}
                    setShuffle={setShuffleOn}
                    showTimer={false}
                    onStart={handleStart}
                  />
                </PageEmptyState>
            ) : (
                // Game area
                <div className="flex flex-col items-center justify-center p-4 w-full h-screen">
                    <div className="w-full h-2/3 flex flex-col items-center">
                        {!showAnswer ? (
                            <div className="w-full sm:w-4/5 mb-8 h-full transition-transform duration-500 ease-in-out">
                                <Card 
                                    card={filteredCards[currentCardIndex]} 
                                    flipped={false}
                                    setFlipped={() => {}}
                                    animateFlip={false}
                                    practice={false}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[93%] flex flex-col sm:flex-row gap-4 ml-10 mr-10 transition-opacity duration-500 ease-in-out">
                                <div className="relative h-4/5 w-full flex background-shadow-new bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl items-center justify-center">
                                    <h1 className="absolute top-0 font-bold text-2xl mt-2 text-yellow-500">Answer</h1>
                                    {filteredCards[currentCardIndex].backMode === 1 ? (
                                        <EditableMathField
                                            latex={filteredCards[currentCardIndex].answer}
                                            style={{
                                            minHeight: '4rem',
                                            width: '100%',
                                            backgroundColor: 'transparent',
                                            color: 'inherit',
                                            border: 'none',
                                            pointerEvents: 'none',
                                            fontSize: '2.25rem',
                                            fontWeight: 'semibold',
                                            }}
                                        />
                                    ) : (
                                        <SafeMarkdown
                                                                                        components={{
                                                u: ({ node, ...props }) => <u {...props} />,
                                            }}
                                            className={`text-xl sm:text-4xl text-gray-700 dark:text-gray-200 
                                            font-bold text-center`}
                                            >
                                            {filteredCards[currentCardIndex].answer}
                                        </SafeMarkdown>
                                    )}
                                    
                                </div>
                                <div className="relative h-4/5 w-full flex background-shadow-new bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl items-center justify-center">
                                    <h1 className="absolute top-0 font-bold text-2xl mt-2 text-yellow-500">Your Answer</h1>
                                    {filteredCards[currentCardIndex].backMode === 1 ? (
                                        <EditableMathField
                                            latex={userAnswer}
                                            style={{
                                            minHeight: '4rem',
                                            width: '100%',
                                            backgroundColor: 'transparent',
                                            color: 'inherit',
                                            border: 'none',
                                            pointerEvents: 'none',
                                            fontSize: '2.25rem',
                                            fontWeight: 'semibold',
                                            }}
                                        />
                                    ) : (
                                        <SafeMarkdown
                                                                                        components={{
                                                u: ({ node, ...props }) => <u {...props} />,
                                            }}
                                            className={`text-xl sm:text-4xl text-gray-700 dark:text-gray-200 
                                            font-bold text-center`}
                                            >
                                            {userAnswer}
                                        </SafeMarkdown>
                                    )}
                                </div>
                            </div>
                        )}
                        
                    </div>

                    {!showAnswer && (
                      <div className="w-full max-w-2xl mb-4 transition-opacity duration-500 ease-in-out">
                      {/* answer input */}
                      <div className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-2xl min-h-[6rem] flex items-center background-shadow-new">
                        {filteredCards[currentCardIndex].backMode === 1 ? (
                          <EditableMathField
                            latex={userAnswer}
                            onChange={(mathField) => setUserAnswer(mathField.latex())}
                            onKeyUp={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: 'transparent',
                              color: 'inherit',
                              border: 'none',
                              minHeight: '1.5rem'
                            }}
                            disabled={showAnswer}
                          />
                        ) : (
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleAnswerSubmit(); }}
                            placeholder="Type your answer here..."
                            className="w-full bg-transparent text-xl focus:outline-none"
                            disabled={showAnswer}
                          />
                        )}
                      </div>
                    </div>
                    )}

                    <div className="flex gap-4 transition-all duration-300">
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
                        <>
                          <BackgroundButton
                            text="Incorrect"
                            bgColor="bg-red-500 hover:bg-red-400"
                            onClick={handleMarkIncorrect}
                          />
                          <BackgroundButton
                            text="Correct"
                            bgColor="bg-green-500 hover:bg-green-400"
                            onClick={handleMarkCorrect}
                          />
                        </>
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
        </div>
    );
}

export default Type;