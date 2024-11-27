import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import ReactMarkdown from 'react-markdown';
import TitleBar from '../../components/Navigation/TitleBar';
import BackgroundButton from '../../components/Elements/BackgroundButton';
import { getBorder } from '../../components/Functions/getColor';

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

  const dragItemRef = useRef(null);

  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser, theme } = useUser();
  const { secondaryColor, tertiaryColor } = theme;
  const borderCol = theme ? getBorder(theme.border) : 'blue';

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
  }, [currentCardIndex, cards, loading]);

  const getItemsByArea = (area) => {
    if (area === 'question') return questionArea;
    if (area === 'answer') return answerArea;
    if (area === 'available') return availableChunks;
    return [];
  };

  const handleMouseDown = (event, area, chunk) => {
    event.preventDefault();
    setDraggedItem(chunk);
    setDraggedItemOrigin(area);
    setMouseOffset({
      x: event.clientX - event.target.getBoundingClientRect().left,
      y: event.clientY - event.target.getBoundingClientRect().top,
    });
    setDragging(true);
  };

  const handleMouseMove = (event) => {
    if (!dragging) return;
    const dragItem = dragItemRef.current;
    if (dragItem) {
      dragItem.style.left = `${event.clientX - mouseOffset.x}px`;
      dragItem.style.top = `${event.clientY - mouseOffset.y}px`;
    }

    // Determine which drop area the mouse is over
    const dropAreas = ['question', 'answer', 'available'];
    let overArea = null;
    for (let area of dropAreas) {
      const dropAreaElement = document.getElementById(`drop-area-${area}`);
      const rect = dropAreaElement.getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        overArea = area;
        break;
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

          // Calculate distance from mouse to item's center
          const itemCenterX = itemRect.left + itemRect.width / 2;
          const itemCenterY = itemRect.top + itemRect.height / 2;
          const deltaX = event.clientX - itemCenterX;
          const deltaY = event.clientY - itemCenterY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < minDistance) {
            minDistance = distance;
            // Check if mouse is to the left of the item
            if (event.clientX < itemCenterX) {
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

  const handleMouseUp = () => {
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
      onMouseDown={(e) => handleMouseDown(e, area, chunk)}
      className="px-2 py-1 rounded bg-white shadow-sm border border-gray-200 text-gray-700 cursor-pointer inline-block"
    >
      <ReactMarkdown>{chunk.content}</ReactMarkdown>
    </div>
  );

  const DropArea = ({ id, items, title, theme }) => (
    <div
      id={`drop-area-${id}`}
      className="w-full"
    >
      <h3 className={`text-lg font-semibold py-2 ${theme ? theme.textClass : 'textClass'}`}>{title}</h3>
      <div className="px-4 py-2 min-h-14 rounded-lg border-2 border-dashed border-gray-300 flex flex-wrap gap-2 relative">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {activeDropArea === id && dropPosition === index && draggedItem && (
              <div className="px-2 py-1 rounded border-2 border-blue-500 bg-blue-50 text-gray-700">
                <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
              </div>
            )}
            <ChunkItem chunk={item} area={id} />
          </React.Fragment>
        ))}
        {activeDropArea === id && dropPosition === items.length && draggedItem && (
          <div className="px-2 py-1 rounded border-2 border-blue-500 bg-blue-50 text-gray-700">
            <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-screen h-[100dvh] overflow-y-auto bg-cover bg-screen" style={{ backgroundImage: theme ? theme.image : ''}}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <TitleBar text="Scramble" />
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading cards...</div>
        </div>
      ) : !cards.length ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">
            No cards available for this subject
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h2 className={`text-xl font-bold ${theme ? theme.textClass : 'textClass'}`}>
              Card {currentCardIndex + 1} of {cards.length}
            </h2>
            <div className="space-x-2">
              <BackgroundButton text="Previous Card" bgColor={theme ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}` : "bg-orange-500 hover:bg-orange-400"} disabled={currentCardIndex === 0 } wWidth="w-40" onClick={
                () => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}/>

              <BackgroundButton text="Next Card" bgColor={theme ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}` : "bg-purple-500 hover:bg-purple-400"} disabled={currentCardIndex === cards.length - 1 } wWidth="w-40" onClick={
                () => setCurrentCardIndex((prev) =>
                  Math.min(cards.length - 1, prev + 1)
                )}/>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <DropArea id="question" items={questionArea} title="Question" theme={theme}/>
            <DropArea id="answer" items={answerArea} title="Answer" theme={theme}/>

            <div
              id="drop-area-available"
            >
              <h3 className={`text-lg font-semibold py-2 ${theme ? theme.textClass : 'textClass'}`}>
                Drag the blocks
              </h3>
              <div className="px-4 py-2 min-h-14 rounded-lg border-2 border-dashed border-gray-300 flex flex-wrap gap-2 relative">
                {availableChunks.map((chunk, index) => (
                  <React.Fragment key={chunk.id}>
                    {activeDropArea === 'available' && dropPosition === index && draggedItem && (
                      <div className={`px-2 py-1 rounded border-2 ${theme ? borderCol : 'border-blue-500'} bg-blue-50`}>
                        <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
                      </div>
                    )}
                    <ChunkItem chunk={chunk} area="available" />
                  </React.Fragment>
                ))}
                {activeDropArea === 'available' && dropPosition === availableChunks.length && draggedItem && (
                  <div className="px-2 py-1 rounded border-2 border-blue-500 bg-blue-50">
                    <ReactMarkdown>{draggedItem.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>

          {dragging && draggedItem && (
            <div
              ref={dragItemRef}
              className="fixed pointer-events-none px-2 py-1 rounded bg-white shadow-lg border border-gray-300"
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
    </div>
  );
};

export default DragDropGame;