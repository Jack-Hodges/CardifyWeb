import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import ReactMarkdown from 'react-markdown';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import SubjectList from '../../components/Subject/SubjectList';
import NoSelectionModal from '../../components/Modals/NoSelectionModal';

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

const DragDropGame = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const dragItemRef = useRef(null);

  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser, theme } = useUser();
  const { secondaryColor, tertiaryColor, shadow, textColor } = theme;
  const borderCol = 'blue';

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!user) {
      getUser();
      return;
    }

    if (!subject) {
      setCards([]);
      setLoading(false);
      return;
    }

    const loadCards = async () => {
      setLoading(true);
      const data = await fetchCards(subject.id);
      sortCardsById(data);
      setCards(data);
      setLoading(false);
    };

    loadCards();
  }, [subject, user, getUser]);

  useEffect(() => {
    if (!cards.length || loading) return;

    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    const questionChunks = splitIntoChunks(currentCard.question);
    const answerChunks = splitIntoChunks(currentCard.answer);
    
    const allChunks = [...questionChunks, ...answerChunks]
      .map((text, index) => ({
        id: `chunk-${index}`,
        content: text,
        originalArea: index < questionChunks.length ? 'question' : 'answer'
      }))
      .sort(() => Math.random() - 0.5);
      
    setAvailableChunks(allChunks);
    setQuestionArea([]);
    setAnswerArea([]);
    
    // Reset check state when card changes
    setIsChecked(false);
    setIsCorrect({ question: false, answer: false });
    setShowCorrectAnswer(false);
  }, [currentCardIndex, cards, loading]);

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
    
    // Check if question area has the correct chunks in the right order
    const questionCorrect = questionArea.length === questionChunks.length &&
      questionArea.every((chunk, index) => {
        const expectedChunk = questionChunks[index];
        return chunk.content === expectedChunk;
      });
    
    // Check if answer area has the correct chunks in the right order
    const answerCorrect = answerArea.length === answerChunks.length &&
      answerArea.every((chunk, index) => {
        const expectedChunk = answerChunks[index];
        return chunk.content === expectedChunk;
      });
    
    setIsCorrect({ question: questionCorrect, answer: answerCorrect });
    setIsChecked(true);
    
    // Show correct answer if either is wrong
    if (!questionCorrect || !answerCorrect) {
      setShowCorrectAnswer(true);
    }
  };

  const resetAnswer = () => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;
    
    const questionChunks = splitIntoChunks(currentCard.question);
    const answerChunks = splitIntoChunks(currentCard.answer);
    
    const allChunks = [...questionChunks, ...answerChunks]
      .map((text, index) => ({
        id: `chunk-${index}`,
        content: text,
        originalArea: index < questionChunks.length ? 'question' : 'answer'
      }))
      .sort(() => Math.random() - 0.5);
      
    setAvailableChunks(allChunks);
    setQuestionArea([]);
    setAnswerArea([]);
    setIsChecked(false);
    setIsCorrect({ question: false, answer: false });
    setShowCorrectAnswer(false);
  };

  const handleOpenSubjectListModal = () => {
    setIsSubjectListModalOpen(true);
  };

  const getEventCoordinates = (event) => {
    // Support both mouse and touch events
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || (event.changedTouches && event.changedTouches[0]?.clientX);
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || (event.changedTouches && event.changedTouches[0]?.clientY);
    return { clientX, clientY };
  };

  const handleStartDrag = (event, area, chunk) => {
    // Prevent default to stop scroll/selection
    event.preventDefault();
    
    const { clientX, clientY } = getEventCoordinates(event);
    const target = event.currentTarget; // Use currentTarget for better reliability

    setDraggedItem(chunk);
    setDraggedItemOrigin(area);
    setMouseOffset({
      x: clientX - target.getBoundingClientRect().left,
      y: clientY - target.getBoundingClientRect().top,
    });
    setDragging(true);

    // Add move and end event listeners
    if (event.type === 'touchstart') {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
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
    event.preventDefault(); // Prevent scrolling
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

    // Determine which drop area the pointer is over
    const dropAreas = ['question', 'answer', 'available'];
    let overArea = null;
    for (let area of dropAreas) {
      const dropAreaElement = document.getElementById(`drop-area-${area}`);
      if (dropAreaElement) {
        const rect = dropAreaElement.getBoundingClientRect();
        // Add some padding for mobile touch
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
      // Find drop position within the area
      const items = getItemsByArea(overArea);
      let dropIndex = items.length;

      let minDistance = Infinity;
      for (let i = 0; i < items.length; i++) {
        const itemElement = document.getElementById(items[i].id);
        if (itemElement) {
          const itemRect = itemElement.getBoundingClientRect();

          // Calculate distance from pointer to item's center
          const itemCenterX = itemRect.left + itemRect.width / 2;
          const itemCenterY = itemRect.top + itemRect.height / 2;
          const deltaX = clientX - itemCenterX;
          const deltaY = clientY - itemCenterY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < minDistance) {
            minDistance = distance;
            // Check if pointer is to the left of the item (or above on mobile)
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

  const navigate = useNavigate();

  const handleSwitchToCreate = () => {
    navigate('/create', { state: { subject } });
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
  };

  const finalizeDrop = () => {
    if (!dragging || !draggedItem) return;
    let droppedInArea = activeDropArea;

    if (droppedInArea) {
      moveItemToArea(draggedItem, draggedItemOrigin, droppedInArea, dropPosition);
    } else {
      // Return item to original area if not dropped in any area
      moveItemToArea(draggedItem, draggedItemOrigin, draggedItemOrigin);
    }

    // Cleanup
    setDragging(false);
    setDraggedItem(null);
    setDraggedItemOrigin(null);
    setMouseOffset({ x: 0, y: 0 });
    setActiveDropArea(null);
    setDropPosition(null);
  };

  const moveItemToArea = (item, fromArea, toArea, position = null) => {
    // Remove from source area
    if (fromArea === 'question') {
      setQuestionArea((prev) => prev.filter((c) => c.id !== item.id));
    } else if (fromArea === 'answer') {
      setAnswerArea((prev) => prev.filter((c) => c.id !== item.id));
    } else if (fromArea === 'available') {
      setAvailableChunks((prev) => prev.filter((c) => c.id !== item.id));
    }

    // Add to target area at the correct position
    const insertAtPosition = (array, item, position) => {
      const newArray = [...array];
      if (position === null || position >= newArray.length) {
        newArray.push(item);
      } else {
        newArray.splice(position, 0, item);
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
      className={`
        ${isMobile ? 'px-3 py-2 text-base min-h-[44px]' : 'px-2 py-1'} 
        rounded bg-white shadow-sm border border-gray-200 text-gray-700 
        cursor-pointer inline-flex items-center justify-center text-center
        ${isMobile ? 'active:bg-gray-50 active:scale-95' : 'hover:bg-gray-50'}
        transition-all duration-150 select-none
        ${dragging && draggedItem?.id === chunk.id ? 'opacity-50' : ''}
      `}
      style={{ 
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none'
      }}
    >
      <ReactMarkdown className="pointer-events-none">{chunk.content}</ReactMarkdown>
    </div>
  );

  const DropArea = ({ id, items, title, theme }) => {
    const getDropAreaBorderClass = () => {
      if (activeDropArea === id) return 'border-blue-500 bg-blue-50';
      if (isChecked && (id === 'question' || id === 'answer')) {
        return isCorrect[id] ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
      }
      return 'border-gray-300';
    };

    const getDropAreaTitle = () => {
      if (isChecked && (id === 'question' || id === 'answer')) {
        const icon = isCorrect[id] ? '✅' : '❌';
        return `${icon} ${title}`;
      }
      return title;
    };

    return (
      <div
        id={`drop-area-${id}`}
        className="w-full"
      >
        <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold py-2 ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'textClass'}`}>
          {getDropAreaTitle()}
        </h3>
        <div className={`
          ${isMobile ? 'px-4 py-4 min-h-[80px]' : 'px-4 py-2 min-h-14'} 
          rounded-lg border-2 border-dashed 
          ${getDropAreaBorderClass()} 
          flex flex-wrap gap-2 relative transition-all duration-200
        `}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {activeDropArea === id && dropPosition === index && draggedItem && (
                <div className={`
                  ${isMobile ? 'px-3 py-2 text-base min-h-[44px]' : 'px-2 py-1'} 
                  rounded border-2 border-blue-500 bg-blue-100 text-gray-700
                  inline-flex items-center justify-center text-center opacity-75
                `}>
                  <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
                </div>
              )}
              <ChunkItem chunk={item} area={id} />
            </React.Fragment>
          ))}
          {activeDropArea === id && dropPosition === items.length && draggedItem && (
            <div className={`
              ${isMobile ? 'px-3 py-2 text-base min-h-[44px]' : 'px-2 py-1'} 
              rounded border-2 border-blue-500 bg-blue-100 text-gray-700
              inline-flex items-center justify-center text-center opacity-75
            `}>
              <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
            </div>
          )}
          {items.length === 0 && !draggedItem && (
            <div className={`
              ${isMobile ? 'text-base py-4' : 'text-sm py-2'} 
              text-gray-400 italic text-center w-full
            `}>
              {id === 'available' ? 'Drag blocks from here' : `Drop ${title.toLowerCase()} blocks here`}
            </div>
          )}
        </div>
        
        {/* Show correct answer when wrong */}
        {showCorrectAnswer && isChecked && !isCorrect[id] && (id === 'question' || id === 'answer') && (
          <div className={`
            mt-3 p-3 rounded-lg bg-green-100 border border-green-300
            ${isMobile ? 'text-base' : 'text-sm'}
          `}>
            <h4 className="font-semibold text-green-800 mb-2">Correct {title}:</h4>
            <div className="text-green-700">
              <ReactMarkdown>
                {cards[currentCardIndex] ? cards[currentCardIndex][id] : ''}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-screen h-screen relative">
      {/* Fixed background */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: theme ? theme.image : ''}}
      ></div>
      
      {/* Scrolling content */}
      <div 
        className="relative z-10 min-h-screen overflow-auto pb-20"
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseUp={!isMobile ? handleMouseUp : undefined}
        style={{ 
          overscrollBehavior: 'contain', // Prevent pull-to-refresh on mobile
          touchAction: dragging ? 'none' : 'auto'
        }}
      >
        <TitleBar text="Scramble" />
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading cards...</div>
          </div>
        ) : !cards.length ? (
          <div className="flex flex-col justify-center items-center w-full h-full">
            {subject ? (
              <NoSelectionModal
                text={`${subject.name} has no flashcards`}
                text1={`Add Flashcards to ${subject.name}`}
                action1={handleSwitchToCreate}
              />
            ) : (
              <NoSelectionModal
                text="No subject selected"
                text1="Select a subject to practice"
                action1={handleOpenSubjectListModal}
              />
            )}
          </div>
        ) : (
          <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className={`mb-4 ${isMobile ? 'flex-col space-y-3' : 'flex justify-between items-center'}`}>
              <h2 className={`${isMobile ? 'text-lg text-center' : 'text-xl'} font-bold ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'textClass'}`}>
                Card {currentCardIndex + 1} of {cards.length}
              </h2>
              <div className={`${isMobile ? 'flex justify-center' : ''} space-x-2`}>
                <BackgroundButton 
                  text="Previous Card" 
                  bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"} 
                  disabled={currentCardIndex === 0} 
                  wWidth={isMobile ? "w-32" : "w-40"} 
                  onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                />
                <BackgroundButton 
                  text="Next Card" 
                  bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"} 
                  disabled={currentCardIndex === cards.length - 1} 
                  wWidth={isMobile ? "w-32" : "w-40"} 
                  onClick={() => setCurrentCardIndex((prev) => Math.min(cards.length - 1, prev + 1))}
                />
              </div>
            </div>

            <div className={`flex flex-col ${isMobile ? 'space-y-6' : 'space-y-4'}`}>
              <DropArea id="question" items={questionArea} title="Question" theme={theme}/>
              <DropArea id="answer" items={answerArea} title="Answer" theme={theme}/>

              <div id="drop-area-available">
                <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold py-2 ${shadow ? 'drop-shadow-custom' : ''} ${theme ? textColor : 'textClass'}`}>
                  {isMobile ? 'Tap and drag the blocks' : 'Drag the blocks'}
                </h3>
                <div className={`
                  ${isMobile ? 'px-4 py-4 min-h-[80px]' : 'px-4 py-2 min-h-14'} 
                  rounded-lg border-2 border-dashed 
                  ${activeDropArea === 'available' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                  flex flex-wrap gap-2 relative transition-all duration-200
                `}>
                  {availableChunks.map((chunk, index) => (
                    <React.Fragment key={chunk.id}>
                      {activeDropArea === 'available' && dropPosition === index && draggedItem && (
                        <div className={`
                          ${isMobile ? 'px-3 py-2 text-base min-h-[44px]' : 'px-2 py-1'} 
                          rounded border-2 ${theme ? borderCol : 'border-blue-500'} bg-blue-100
                          inline-flex items-center justify-center text-center opacity-75
                        `}>
                          <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
                        </div>
                      )}
                      <ChunkItem chunk={chunk} area="available" />
                    </React.Fragment>
                  ))}
                  {activeDropArea === 'available' && dropPosition === availableChunks.length && draggedItem && (
                    <div className={`
                      ${isMobile ? 'px-3 py-2 text-base min-h-[44px]' : 'px-2 py-1'} 
                      rounded border-2 border-blue-500 bg-blue-100
                      inline-flex items-center justify-center text-center opacity-75
                    `}>
                      <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
                    </div>
                  )}
                  {availableChunks.length === 0 && !draggedItem && (
                    <div className={`
                      ${isMobile ? 'text-base py-4' : 'text-sm py-2'} 
                      text-gray-400 italic text-center w-full
                    `}>
                      All blocks have been placed!
                    </div>
                  )}
                </div>
              </div>

              {/* Check Answer and Reset Buttons */}
              <div className={`flex ${isMobile ? 'justify-center' : 'justify-start'} pt-4`}>
                {!isChecked ? (
                  <BackgroundButton
                    text="Check Answer"
                    bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-blue-600 hover:bg-blue-500"}
                    onClick={checkAnswer}
                    disabled={questionArea.length === 0 && answerArea.length === 0}
                  />
                ) : (
                  <div className={`flex ${isMobile ? 'flex-col space-y-2 items-center' : 'flex-row space-x-3 items-center'}`}>
                    <BackgroundButton
                      text="Reset"
                      bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-gray-600 hover:bg-gray-500"}
                      wWidth={isMobile ? "w-full max-w-xs" : "w-32"}
                      onClick={resetAnswer}
                    />
                  </div>
                )}
              </div>
            </div>

            {dragging && draggedItem && (
              <div
                ref={dragItemRef}
                className={`
                  fixed pointer-events-none z-[9999]
                  ${isMobile ? 'px-3 py-2 text-base min-h-[44px]' : 'px-2 py-1'} 
                  rounded bg-white shadow-xl border-2 border-blue-500
                  inline-flex items-center justify-center text-center
                  opacity-90 transform scale-105
                `}
                style={{
                  left: '-9999px',
                  top: '-9999px',
                }}
              >
                <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        <SubjectList 
          isOpen={isSubjectListModalOpen} 
          onClose={() => setIsSubjectListModalOpen(false)}
          user={user}
          page='scramble'
        />
      </div>
    </div>
  );
};

export default DragDropGame;