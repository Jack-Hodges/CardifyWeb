import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Shuffle, HelpCircle, MessageSquare } from 'lucide-react';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import SafeMarkdown from '../../components/Functions/SafeMarkdown';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';
import LoadingSpinner from '../../components/Elements/LoadingSpinner';
import PageEmptyState from '../../components/Elements/PageEmptyState';
import GameComplete from '../../components/Elements/GameComplete';
import GameSettings from '../../components/Games/GameSettings';
import GameHUD, { hudIcons } from '../../components/Games/GameHUD';
import useSubjectFromRoute from '../../hooks/useSubjectFromRoute';
import useGameStudySession from '../../hooks/useGameStudySession';
import { getThemeBackgroundStyle } from '../../components/Functions/getTheme';

const splitIntoChunks = (text, maxChunks = 5) => {
  if (!text || typeof text !== 'string') return [];

  const words = text.split(' ');
  const chunks = [];
  const wordsPerChunk = Math.max(1, Math.ceil(words.length / maxChunks));

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ');
    chunks.push(chunk);
  }

  return chunks.slice(0, maxChunks);
};

const shuffleArray = (array) => {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const tileClass = (isMobile, isDraggingSource) => `
  ${isMobile ? 'px-3 py-2.5 text-base min-h-[44px]' : 'px-3.5 py-2 text-base'}
  rounded-xl bg-white text-gray-900 font-semibold
  background-shadow-new background-hover cursor-pointer
  inline-flex items-center justify-center text-center
  transition-all duration-150 select-none
  ${isDraggingSource ? 'opacity-40 scale-95' : 'hover:scale-[1.02] active:scale-95'}
`;

const ghostTileClass = (isMobile) => `
  ${isMobile ? 'px-3 py-2.5 text-base min-h-[44px]' : 'px-3.5 py-2 text-base'}
  rounded-xl bg-white text-gray-900 font-semibold
  background-shadow-new border-2 border-[var(--theme-border-color)]
  inline-flex items-center justify-center text-center
  opacity-95 scale-110
`;

const placeholderTileClass = (isMobile) => `
  ${isMobile ? 'px-3 py-2.5 text-base min-h-[44px]' : 'px-3.5 py-2 text-base'}
  rounded-xl border-2 border-dashed border-white/50 bg-white/20 text-white font-semibold
  inline-flex items-center justify-center text-center
`;

const wellClass = ({ isActive, isChecked, isZoneCorrect, isMobile }) => {
  let state = 'border-white/40 bg-black/25';
  if (isActive) {
    state = 'border-white/80 bg-white/25 shadow-[0_0_0_3px_rgba(255,255,255,0.2)]';
  } else if (isChecked) {
    state = isZoneCorrect
      ? 'border-green-300 bg-green-600/30'
      : 'border-red-300 bg-red-600/30';
  }

  return `
    ${isMobile ? 'px-3 py-3 min-h-[72px]' : 'px-4 py-3 min-h-[64px]'}
    rounded-2xl border-2 border-dashed
    flex flex-wrap gap-2 relative transition-all duration-200
    ${state}
  `;
};

const DragDropGame = () => {
  const [allCards, setAllCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cardCount, setCardCount] = useState(12);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [questionArea, setQuestionArea] = useState([]);
  const [answerArea, setAnswerArea] = useState([]);
  const [availableChunks, setAvailableChunks] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemOrigin, setDraggedItemOrigin] = useState(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [activeDropArea, setActiveDropArea] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [isSubjectListModalOpen, setIsSubjectListModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState({ question: false, answer: false });
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());

  const dragItemRef = useRef(null);

  const { subject } = useSubjectFromRoute();
  const { user, getUser, theme } = useUser();
  const study = useGameStudySession('scramble');
  const { secondaryColor, tertiaryColor, textClass, shadow } = theme;
  const textTone = textClass || 'textColor';
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const subjectId = subject?.id ?? null;
  const userId = user?.id ?? null;
  const currentCardId = cards[currentCardIndex]?.id ?? null;
  const roundSetupKeyRef = useRef('');

  useEffect(() => {
    if (!userId) {
      getUser();
      return;
    }

    if (!subjectId) {
      setAllCards([]);
      setCards([]);
      setStarted(false);
      setFinished(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadCards = async () => {
      setLoading(true);
      setStarted(false);
      setFinished(false);
      setCurrentCardIndex(0);
      roundSetupKeyRef.current = '';
      const data = await fetchCards(subjectId);
      if (cancelled) return;
      sortCardsById(data);
      setAllCards(data);
      setCardCount(Math.max(1, data.length || 1));
      setLoading(false);
    };

    loadCards();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, userId]);

  useEffect(() => {
    if (!started || !cards.length || loading || currentCardId == null) return;

    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    const setupKey = `${currentCardId}:${currentCardIndex}`;
    if (roundSetupKeyRef.current === setupKey) return;
    roundSetupKeyRef.current = setupKey;

    const questionChunks = splitIntoChunks(currentCard.question);
    const answerChunks = splitIntoChunks(currentCard.answer);

    const allChunks = [...questionChunks, ...answerChunks]
      .map((text, index) => ({
        id: `chunk-${index}`,
        content: text,
        originalArea: index < questionChunks.length ? 'question' : 'answer',
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableChunks(allChunks);
    setQuestionArea([]);
    setAnswerArea([]);
    setIsChecked(false);
    setIsCorrect({ question: false, answer: false });
    setShowCorrectAnswer(false);
    setRoundKey((k) => k + 1);
  }, [started, currentCardIndex, currentCardId, cards, loading]);

  const handleStart = () => {
    let pool = [...allCards];
    if (shuffleOn) pool = shuffleArray(pool);
    pool = pool.slice(0, Math.min(cardCount, pool.length));
    setCards(pool);
    setCurrentCardIndex(0);
    setCheckedCount(0);
    setPerfectCount(0);
    setSessionStartedAt(Date.now());
    setFinished(false);
    setStarted(true);
    roundSetupKeyRef.current = '';
    study.begin(subjectId);
  };

  const playAgain = () => {
    setStarted(false);
    setFinished(false);
    setCards([]);
    setCheckedCount(0);
    setPerfectCount(0);
  };

  useEffect(() => {
    if (!finished || !started) return undefined;
    study.finish({
      correct: perfectCount,
      incorrect: Math.max(0, checkedCount - perfectCount),
      cards_seen: cards.length,
      weak_card_ids: [],
    });
    return undefined;
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const getItemsByArea = (area) => {
    if (area === 'question') return questionArea;
    if (area === 'answer') return answerArea;
    if (area === 'available') return availableChunks;
    return [];
  };

  const checkAnswer = () => {
    if (!cards.length) return;

    const currentCard = cards[currentCardIndex];
    const questionChunks = splitIntoChunks(currentCard.question);
    const answerChunks = splitIntoChunks(currentCard.answer);

    const questionCorrect =
      questionArea.length === questionChunks.length &&
      questionArea.every((chunk, index) => chunk.content === questionChunks[index]);

    const answerCorrect =
      answerArea.length === answerChunks.length &&
      answerArea.every((chunk, index) => chunk.content === answerChunks[index]);

    setIsCorrect({ question: questionCorrect, answer: answerCorrect });
    setIsChecked(true);
    setCheckedCount((c) => c + 1);
    if (questionCorrect && answerCorrect) {
      setPerfectCount((c) => c + 1);
    }

    if (!questionCorrect || !answerCorrect) {
      setShowCorrectAnswer(true);
    }
  };

  const resetAnswer = () => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    // Allow the round-setup effect to re-run if index/id unchanged
    roundSetupKeyRef.current = '';

    const questionChunks = splitIntoChunks(currentCard.question);
    const answerChunks = splitIntoChunks(currentCard.answer);

    const allChunks = [...questionChunks, ...answerChunks]
      .map((text, index) => ({
        id: `chunk-${index}`,
        content: text,
        originalArea: index < questionChunks.length ? 'question' : 'answer',
      }))
      .sort(() => Math.random() - 0.5);

    setAvailableChunks(allChunks);
    setQuestionArea([]);
    setAnswerArea([]);
    setIsChecked(false);
    setIsCorrect({ question: false, answer: false });
    setShowCorrectAnswer(false);
    setRoundKey((k) => k + 1);
    roundSetupKeyRef.current = `${currentCard.id}:${currentCardIndex}`;
  };

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true);
  };

  const getEventCoordinates = (event) => {
    const clientX =
      event.clientX ||
      (event.touches && event.touches[0]?.clientX) ||
      (event.changedTouches && event.changedTouches[0]?.clientX);
    const clientY =
      event.clientY ||
      (event.touches && event.touches[0]?.clientY) ||
      (event.changedTouches && event.changedTouches[0]?.clientY);
    return { clientX, clientY };
  };

  const handleStartDrag = (event, area, chunk) => {
    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = getEventCoordinates(event);
    const target = event.currentTarget;

    setDraggedItem(chunk);
    setDraggedItemOrigin(area);
    setMouseOffset({
      x: clientX - target.getBoundingClientRect().left,
      y: clientY - target.getBoundingClientRect().top,
    });
    setDragging(true);

    if (event.type === 'touchstart') {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    } else {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (event) => {
    if (!dragging) return;
    const { clientX, clientY } = getEventCoordinates(event);
    updateDragPosition(clientX, clientY);
  };

  const handleTouchMove = (event) => {
    if (!dragging) return;
    event.preventDefault();
    const { clientX, clientY } = getEventCoordinates(event);
    updateDragPosition(clientX, clientY);
  };

  const updateDragPosition = (clientX, clientY) => {
    const dragItem = dragItemRef.current;
    if (dragItem) {
      dragItem.style.left = `${clientX - mouseOffset.x}px`;
      dragItem.style.top = `${clientY - mouseOffset.y}px`;
      dragItem.style.zIndex = '9999';
    }

    const dropAreas = ['question', 'answer', 'available'];
    let overArea = null;
    for (let area of dropAreas) {
      const dropAreaElement = document.getElementById(`drop-area-${area}`);
      if (dropAreaElement) {
        const rect = dropAreaElement.getBoundingClientRect();
        const padding = isMobile ? 20 : 0;
        if (
          clientX >= rect.left - padding &&
          clientX <= rect.right + padding &&
          clientY >= rect.top - padding &&
          clientY <= rect.bottom + padding
        ) {
          overArea = area;
          break;
        }
      }
    }
    setActiveDropArea(overArea);

    if (overArea) {
      const items = getItemsByArea(overArea);
      let dropIndex = items.length;
      let minDistance = Infinity;

      for (let i = 0; i < items.length; i++) {
        const itemElement = document.getElementById(items[i].id);
        if (itemElement) {
          const itemRect = itemElement.getBoundingClientRect();
          const itemCenterX = itemRect.left + itemRect.width / 2;
          const itemCenterY = itemRect.top + itemRect.height / 2;
          const deltaX = clientX - itemCenterX;
          const deltaY = clientY - itemCenterY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < minDistance) {
            minDistance = distance;
            if (isMobile ? clientY < itemCenterY : clientX < itemCenterX) {
              dropIndex = i;
            } else {
              dropIndex = i + 1;
            }
          }
        }
      }
      setDropPosition(dropIndex);
    } else {
      setDropPosition(null);
    }
  };

  const handleSwitchToCreate = () => {
    if (subject) navigate(`/create/${subject.id}`, { state: { subject } });
    else navigate('/create');
  };

  const handleMouseUp = () => {
    cleanupDragListeners();
    finalizeDrop();
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    cleanupDragListeners();
    finalizeDrop();
  };

  const cleanupDragListeners = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
  };

  const finalizeDrop = () => {
    if (!dragging || !draggedItem) return;
    const droppedInArea = activeDropArea;

    if (droppedInArea) {
      moveItemToArea(draggedItem, draggedItemOrigin, droppedInArea, dropPosition);
    } else {
      moveItemToArea(draggedItem, draggedItemOrigin, draggedItemOrigin);
    }

    setDragging(false);
    setDraggedItem(null);
    setDraggedItemOrigin(null);
    setMouseOffset({ x: 0, y: 0 });
    setActiveDropArea(null);
    setDropPosition(null);
  };

  const moveItemToArea = (item, fromArea, toArea, position = null) => {
    if (fromArea === 'question') {
      setQuestionArea((prev) => prev.filter((c) => c.id !== item.id));
    } else if (fromArea === 'answer') {
      setAnswerArea((prev) => prev.filter((c) => c.id !== item.id));
    } else if (fromArea === 'available') {
      setAvailableChunks((prev) => prev.filter((c) => c.id !== item.id));
    }

    const insertAtPosition = (array, nextItem, pos) => {
      const newArray = [...array];
      if (pos === null || pos >= newArray.length) {
        newArray.push(nextItem);
      } else {
        newArray.splice(pos, 0, nextItem);
      }
      return newArray;
    };

    if (toArea === 'question') {
      setQuestionArea((prev) => insertAtPosition(prev, item, position));
    } else if (toArea === 'answer') {
      setAnswerArea((prev) => insertAtPosition(prev, item, position));
    } else if (toArea === 'available') {
      setAvailableChunks((prev) => insertAtPosition(prev, item, position));
    }
  };

  const ChunkItem = ({ chunk, area }) => (
    <div
      id={chunk.id}
      onMouseDown={(e) => handleStartDrag(e, area, chunk)}
      onTouchStart={(e) => handleStartDrag(e, area, chunk)}
      className={tileClass(isMobile, dragging && draggedItem?.id === chunk.id)}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'manipulation',
      }}
    >
      <SafeMarkdown className="pointer-events-none text-sm sm:text-base text-gray-900 [&_*]:text-gray-900">
        {chunk.content}
      </SafeMarkdown>
    </div>
  );

  const DropPlaceholder = () => (
    <div className={placeholderTileClass(isMobile)}>
      <SafeMarkdown className="pointer-events-none text-sm sm:text-base text-white [&_*]:text-white">
        {draggedItem.content}
      </SafeMarkdown>
    </div>
  );

  const DropArea = ({ id, items, title, icon: Icon }) => {
    const zoneChecked = isChecked && (id === 'question' || id === 'answer');
    const zoneCorrect = isCorrect[id];

    return (
      <div id={`drop-area-${id}`} className="w-full">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={18} className="text-blue-300 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-sm">{title}</h3>
          {zoneChecked && (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                zoneCorrect ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {zoneCorrect ? (
                <Check size={14} strokeWidth={3} className="text-white" />
              ) : (
                <X size={14} strokeWidth={3} className="text-white" />
              )}
            </span>
          )}
        </div>

        <div
          className={wellClass({
            isActive: activeDropArea === id,
            isChecked: zoneChecked,
            isZoneCorrect: zoneCorrect,
            isMobile,
          })}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {activeDropArea === id && dropPosition === index && draggedItem && (
                <DropPlaceholder />
              )}
              <ChunkItem chunk={item} area={id} />
            </React.Fragment>
          ))}
          {activeDropArea === id && dropPosition === items.length && draggedItem && (
            <DropPlaceholder />
          )}
          {items.length === 0 && !draggedItem && (
            <div className="text-sm sm:text-base text-white/80 font-medium text-center w-full py-2">
              Drop {title.toLowerCase()} tiles here
            </div>
          )}
        </div>

        {showCorrectAnswer && isChecked && !isCorrect[id] && (id === 'question' || id === 'answer') && (
          <div className="mt-2 px-3 py-3 rounded-xl bg-black/45 border border-green-400/50 backdrop-blur-md">
            <p className="text-sm font-bold text-green-300 mb-1">Correct {title}</p>
            <div className="text-base text-white leading-snug font-medium [&_*]:text-white">
              <SafeMarkdown>
                {cards[currentCardIndex] ? cards[currentCardIndex][id] : ''}
              </SafeMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  const themeBgStyle = getThemeBackgroundStyle(theme.image);

  return (
    <div
      className="w-screen min-h-[100lvh] sm:h-screen relative bg-cover bg-center bg-no-repeat"
      style={{...themeBgStyle}}
    >
      <div
        className="hidden sm:block fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{...themeBgStyle}}
      />

      <div
        className="relative z-10 min-h-[100lvh] sm:h-full flex flex-col sm:overflow-hidden"
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseUp={!isMobile ? handleMouseUp : undefined}
        style={{
          touchAction: dragging ? 'none' : 'manipulation',
          overscrollBehavior: 'none',
        }}
      >
        <div className="flex-shrink-0">
          <TitleBar text="Scramble" />
        </div>

        <div className="flex-1 flex flex-col min-h-0 sm:overflow-hidden">
          {loading ? (
            <LoadingSpinner text="Loading cards..." />
          ) : !allCards.length ? (
            <PageEmptyState>
              {subject ? (
                <NoSelectionModal
                  text={`${subject.name} has no flashcards`}
                  subtext="Add some flashcards to this subject to start playing Scramble."
                  text1={`Add Flashcards to ${subject.name}`}
                  action1={handleSwitchToCreate}
                />
              ) : (
                <NoSelectionModal
                  text="No subject selected"
                  subtext="Pick a subject to start playing Scramble."
                  text1="Select a subject to practice"
                  action1={handleOpenSubjectListModal}
                />
              )}
            </PageEmptyState>
          ) : finished ? (
            <GameComplete
              title="Session complete!"
              primaryText="Back to Home"
              onPrimary={() => navigate('/home')}
              secondaryText="Play again"
              onSecondary={playAgain}
            >
              <p className={`${textTone} text-xl font-semibold ${shadow ? 'drop-shadow-custom' : ''}`}>
                {perfectCount}/{checkedCount || cards.length} perfect checks
              </p>
              <p className={`${textTone} text-base opacity-80 mt-2 ${shadow ? 'drop-shadow-custom' : ''}`}>
                {cards.length} cards ·{' '}
                {Math.round((Date.now() - sessionStartedAt) / 1000)}s
              </p>
            </GameComplete>
          ) : !started ? (
            <PageEmptyState>
              <GameSettings
                cardCount={cardCount}
                setCardCount={setCardCount}
                maxCards={allCards.length}
                shuffle={shuffleOn}
                setShuffle={setShuffleOn}
                showTimer={false}
                onStart={handleStart}
              />
            </PageEmptyState>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 px-3 sm:px-6 py-3 sm:py-4 max-w-5xl w-full mx-auto sm:overflow-hidden">
              <GameHUD
                items={[
                  {
                    key: 'progress',
                    icon: hudIcons.layers,
                    value: `${currentCardIndex + 1}/${cards.length}`,
                    label: 'Progress',
                  },
                  {
                    key: 'perfect',
                    icon: hudIcons.check,
                    value: perfectCount,
                    hint: 'perfect',
                  },
                  {
                    key: 'checks',
                    icon: hudIcons.zap,
                    value: checkedCount,
                    hint: 'checks',
                  },
                ]}
                trailing={subject?.name}
              />

              <div className="flex-shrink-0 mb-3 flex justify-center sm:justify-end gap-2">
                <BackgroundButton
                  text="Previous"
                  bgColor={
                    theme
                      ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                      : 'bg-orange-500 hover:bg-orange-400'
                  }
                  disabled={currentCardIndex === 0}
                  wWidth={isMobile ? 'w-28' : 'w-32'}
                  onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                />
                <BackgroundButton
                  text={currentCardIndex === cards.length - 1 ? 'Finish' : 'Next'}
                  bgColor={
                    currentCardIndex === cards.length - 1
                      ? 'bg-green-500 hover:bg-green-400'
                      : theme
                        ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
                        : 'bg-purple-500 hover:bg-purple-400'
                  }
                  wWidth={isMobile ? 'w-28' : 'w-32'}
                  onClick={() => {
                    if (currentCardIndex === cards.length - 1) setFinished(true);
                    else setCurrentCardIndex((prev) => Math.min(cards.length - 1, prev + 1));
                  }}
                />
              </div>

              {/* Glass board */}
              <div
                key={roundKey}
                className="flex-1 min-h-0 flex flex-col overflow-hidden
                  bg-gradient-to-t from-black/55 via-black/45 to-black/35 backdrop-blur-xl
                  rounded-2xl border border-white/25 shadow-2xl shadow-black/40
                  animate-pop-up"
              >
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
                  <DropArea
                    id="question"
                    items={questionArea}
                    title="Question"
                    icon={HelpCircle}
                  />
                  <DropArea
                    id="answer"
                    items={answerArea}
                    title="Answer"
                    icon={MessageSquare}
                  />

                  {/* Word bank */}
                  <div id="drop-area-available" className="pt-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Shuffle size={18} className="text-white/90 shrink-0" />
                        <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-sm">Word bank</h3>
                      </div>
                      <p className="text-sm text-white/85 font-medium hidden sm:block">
                        Drag tiles into Question and Answer
                      </p>
                    </div>
                    <p className="text-sm text-white/85 font-medium mb-2 sm:hidden">
                      {isMobile
                        ? 'Tap and drag tiles into Question and Answer'
                        : 'Drag tiles into Question and Answer'}
                    </p>
                    <div
                      className={wellClass({
                        isActive: activeDropArea === 'available',
                        isChecked: false,
                        isZoneCorrect: false,
                        isMobile,
                      })}
                    >
                      {availableChunks.map((chunk, index) => (
                        <React.Fragment key={chunk.id}>
                          {activeDropArea === 'available' &&
                            dropPosition === index &&
                            draggedItem && <DropPlaceholder />}
                          <ChunkItem chunk={chunk} area="available" />
                        </React.Fragment>
                      ))}
                      {activeDropArea === 'available' &&
                        dropPosition === availableChunks.length &&
                        draggedItem && <DropPlaceholder />}
                      {availableChunks.length === 0 && !draggedItem && (
                        <div className="text-sm sm:text-base text-white/80 font-medium text-center w-full py-2">
                          All tiles placed
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="flex-none px-4 sm:px-6 py-3 sm:py-4 border-t border-white/15 bg-black/10">
                  <div
                    className={`flex ${
                      isMobile ? 'justify-center' : 'sm:justify-end'
                    }`}
                  >
                    {!isChecked ? (
                      <BackgroundButton
                        text="Check answer"
                        bgColor={
                          theme
                            ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                            : 'bg-purple-500 hover:bg-purple-400'
                        }
                        wWidth="w-full sm:w-auto"
                        onClick={checkAnswer}
                        disabled={questionArea.length === 0 && answerArea.length === 0}
                      />
                    ) : (
                      <BackgroundButton
                        text="Reset"
                        bgColor={
                          theme
                            ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
                            : 'bg-gray-600 hover:bg-gray-500'
                        }
                        wWidth="w-full sm:w-auto"
                        onClick={resetAnswer}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {dragging && draggedItem && (
          <div
            ref={dragItemRef}
            className={`fixed pointer-events-none z-[9999] ${ghostTileClass(isMobile)}`}
            style={{
              left: '-9999px',
              top: '-9999px',
            }}
          >
            <SafeMarkdown className="pointer-events-none text-sm sm:text-base text-gray-900 [&_*]:text-gray-900">
              {draggedItem.content}
            </SafeMarkdown>
          </div>
        )}

        <SubjectList
          isOpen={isSubjectListModalOpen}
          onClose={() => setIsSubjectListModalOpen(false)}
          user={user}
          page="scramble"
        />
      </div>
    </div>
  );
};

export default DragDropGame;
