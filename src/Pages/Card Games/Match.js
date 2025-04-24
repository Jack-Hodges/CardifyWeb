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
    const [gameOver, setGameOver] = useState(false);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [fallingCards, setFallingCards] = useState([]);

    const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);

    const location = useLocation();
    const { subject } = location.state || {};
    const { user, getUser, theme } = useUser();
    const { textColor, shadow, secondaryColor } = theme;

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

    return (
        <div className="w-screen h-[100dvh] overflow-y-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}>
            <TitleBar text="Match" />

            {/* If no subject or no cards, show the snippet */}
            {(!subject || (cards && cards.length === 0)) ? (
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
                // Otherwise, show the game area
                <div>
                    Type
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