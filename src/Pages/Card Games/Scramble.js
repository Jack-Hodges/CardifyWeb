import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCards, sortCardsById } from '../../components/Card/CardManipulation';
import { useUser } from '../../UserContext';
import TitleBar from '../../components/Navigation/TitleBar';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactMarkdown from 'react-markdown';
import BackgroundButton from '../../components/Elements/BackgroundButton';

function Scramble() {
  // State variables
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [availableChunks, setAvailableChunks] = useState([]);
  const [userQuestionChunks, setUserQuestionChunks] = useState([]);
  const [userAnswerChunks, setUserAnswerChunks] = useState([]);
  const [correctQuestionChunks, setCorrectQuestionChunks] = useState([]);
  const [correctAnswerChunks, setCorrectAnswerChunks] = useState([]);
  const [questionFeedback, setQuestionFeedback] = useState([]);
  const [answerFeedback, setAnswerFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};
  const { user, getUser } = useUser();

  // Load cards and randomize options
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

  // Initialize chunks when currentCardIndex changes
  useEffect(() => {
    if (cards.length > 0 && currentCardIndex < cards.length) {
      const card = cards[currentCardIndex];
      const questionChunksArray = splitTextIntoChunks(card.question);
      const answerChunksArray = splitTextIntoChunks(card.answer);

      // Store correct chunks
      setCorrectQuestionChunks(questionChunksArray);
      setCorrectAnswerChunks(answerChunksArray);

      // Combine and shuffle chunks
      const combinedChunks = [
        ...questionChunksArray.map((chunk) => ({ ...chunk, type: 'question' })),
        ...answerChunksArray.map((chunk) => ({ ...chunk, type: 'answer' })),
      ];
      const shuffledChunks = shuffleArray(combinedChunks);

      setAvailableChunks(shuffledChunks);
      setUserQuestionChunks([]);
      setUserAnswerChunks([]);
      setQuestionFeedback([]);
      setAnswerFeedback([]);
    }
  }, [cards, currentCardIndex]);

  function splitTextIntoChunks(text, maxChunks = 5) {
    const words = text.trim().split(/\s+/);
    const numWords = words.length;
    let chunks = [];

    if (numWords <= maxChunks) {
      chunks = words.map((word, idx) => ({
        id: `chunk-${idx}-${word}-${Math.random()}`,
        chunk: word,
      }));
    } else {
      const chunkSize = Math.ceil(numWords / maxChunks);
      for (let i = 0; i < numWords; i += chunkSize) {
        const chunkWords = words.slice(i, i + chunkSize).join(' ');
        chunks.push({
          id: `chunk-${i}-${chunkWords}-${Math.random()}`,
          chunk: chunkWords,
        });
      }
    }
    return chunks;
  }

  function shuffleArray(array) {
    const newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function handleCheckAnswer() {
    const questionFeedbackArray = userQuestionChunks.map((item, index) => {
      if (
        correctQuestionChunks[index] &&
        item.chunk.trim() === correctQuestionChunks[index].chunk.trim()
      ) {
        return true;
      } else {
        return false;
      }
    });
    setQuestionFeedback(questionFeedbackArray);

    const answerFeedbackArray = userAnswerChunks.map((item, index) => {
      if (
        correctAnswerChunks[index] &&
        item.chunk.trim() === correctAnswerChunks[index].chunk.trim()
      ) {
        return true;
      } else {
        return false;
      }
    });
    setAnswerFeedback(answerFeedbackArray);
  }

  function handleNextCard() {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } 
  }

  function handlePrevCard() {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (cards.length === 0) {
    return <div>No cards available.</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-screen h-[100dvh] overflow-y-auto">
        <TitleBar text="Scramble" />

        <div className="block sm:flex w-full h-full p-4 flex-col">
          {/* Question Assembly */}
          <div className="w-full">
            <h2 className="text-lg font-bold mb-2">Question</h2>
            <DropZone
              acceptedType="question"
              items={userQuestionChunks}
              setItems={setUserQuestionChunks}
              feedback={questionFeedback}
              setAvailableChunks={setAvailableChunks}
              availableChunks={availableChunks}
            />
          </div>

          {/* Answer Assembly */}
          <div className="w-full mt-4">
            <h2 className="text-lg font-bold mb-2">Answer</h2>
            <DropZone
              acceptedType="answer"
              items={userAnswerChunks}
              setItems={setUserAnswerChunks}
              feedback={answerFeedback}
              setAvailableChunks={setAvailableChunks}
              availableChunks={availableChunks}
            />
          </div>

          {/* Available Chunks */}
          <h2 className="text-lg font-bold mb-2 mt-4">Available Chunks</h2>
          <AvailableChunks
            availableChunks={availableChunks}
            setAvailableChunks={setAvailableChunks}
            setUserQuestionChunks={setUserQuestionChunks}
            setUserAnswerChunks={setUserAnswerChunks}
          />

          {/* Buttons */}
          <div className="flex space-x-4 mt-4">
            <BackgroundButton text="Check Answer" onClick={handleCheckAnswer} bgColor={'blue'} wWidth='w-44'/>
            <BackgroundButton text="Previous Card" onClick={handlePrevCard} bgColor={'orange'} wWidth='w-44'/>
            <BackgroundButton text="Next Card" onClick={handleNextCard} bgColor={'purple'} wWidth='w-44'/>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default Scramble;

// AvailableChunks Component
function AvailableChunks({
  availableChunks,
  setAvailableChunks,
  setUserQuestionChunks,
  setUserAnswerChunks,
}) {
  const [, drop] = useDrop({
    accept: 'CHUNK',
    drop: (draggedItem) => {
      if (draggedItem.from === 'dropZone') {
        // Remove from the appropriate dropZone
        if (draggedItem.acceptedType === 'question') {
          draggedItem.setItems((prevItems) =>
            prevItems.filter((item) => item.id !== draggedItem.id)
          );
        } else if (draggedItem.acceptedType === 'answer') {
          draggedItem.setItems((prevItems) =>
            prevItems.filter((item) => item.id !== draggedItem.id)
          );
        }

        // Add back to availableChunks
        setAvailableChunks((prev) => [
          ...prev,
          { ...draggedItem, from: 'availableChunks' },
        ]);
      }
    },
  });

  return (
    <div ref={drop} className="flex flex-wrap">
      {availableChunks.map((item) => (
        <DraggableChunk key={item.id} item={item} />
      ))}
    </div>
  );
}

// DropZone Component
function DropZone({
  acceptedType,
  items,
  setItems,
  feedback,
  setAvailableChunks,
  availableChunks,
}) {
  const [{ isOver }, drop] = useDrop({
    accept: 'CHUNK',
    drop: (draggedItem) => {
      if (draggedItem.type !== acceptedType) return;

      if (draggedItem.from === 'availableChunks') {
        setAvailableChunks((prev) =>
          prev.filter((chunk) => chunk.id !== draggedItem.id)
        );
      } else if (draggedItem.from === 'dropZone') {
        // Do nothing, already handled in hover
        return;
      }

      setItems((prevItems) => {
        if (prevItems.find((prevItem) => prevItem.id === draggedItem.id)) {
          return prevItems;
        }
        return [...prevItems, draggedItem];
      });

      draggedItem.from = 'dropZone';
      draggedItem.index = items.length;
      draggedItem.acceptedType = acceptedType;
      draggedItem.setItems = setItems;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`w-full min-h-[50px] border border-dashed border-gray-400 p-2 flex flex-wrap ${
        isOver ? 'bg-blue-100' : ''
      }`}
    >
      {items.map((item, index) => {
        const isCorrect = feedback[index];
        return (
          <ChunkInDropZone
            key={item.id}
            item={item}
            items={items}
            setItems={setItems}
            index={index}
            isCorrect={isCorrect}
            setAvailableChunks={setAvailableChunks}
            availableChunks={availableChunks}
            acceptedType={acceptedType}
          />
        );
      })}
    </div>
  );
}

// DraggableChunk Component
function DraggableChunk({ item }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'CHUNK',
    item: { ...item, from: 'availableChunks' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  };

  return (
    <div
      ref={drag}
      style={style}
      className="p-2 m-1 bg-gray-200 rounded text-center"
    >
      <ReactMarkdown>{item.chunk}</ReactMarkdown>
    </div>
  );
}

// ChunkInDropZone Component
function ChunkInDropZone({
  item,
  items,
  setItems,
  index,
  isCorrect,
  setAvailableChunks,
  availableChunks,
  acceptedType,
}) {
  const ref = React.useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'CHUNK',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(draggedItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (draggedItem.id === item.id) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the item's width
      // Dragging right
      if (draggedItem.index < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      // Dragging left
      if (draggedItem.index > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      // Time to actually perform the action
      const updatedItems = [...items];

      // Remove dragged item from its original position
      if (draggedItem.from === 'dropZone') {
        updatedItems.splice(dragIndex, 1);
      } else if (draggedItem.from === 'availableChunks') {
        // Remove from availableChunks
        setAvailableChunks((prev) =>
          prev.filter((chunk) => chunk.id !== draggedItem.id)
        );
      }

      // Insert the dragged item at hover index
      updatedItems.splice(hoverIndex, 0, draggedItem);

      setItems(updatedItems);

      // Update the index for dragged item
      draggedItem.index = hoverIndex;
      draggedItem.from = 'dropZone';
      draggedItem.acceptedType = acceptedType;
      draggedItem.setItems = setItems;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'CHUNK',
    item: { ...item, index, from: 'dropZone', acceptedType, setItems },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (draggedItem, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        // If the item was dropped outside, remove it from DropZone and add back to availableChunks
        setItems((prevItems) =>
          prevItems.filter((prevItem) => prevItem.id !== draggedItem.id)
        );
        setAvailableChunks((prev) => [
          ...prev,
          { ...draggedItem, from: 'availableChunks' },
        ]);
      }
    },
  });

  drag(drop(ref));

  const style = {
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  };

  let bgColor = 'bg-gray-200';
  if (isCorrect === true) bgColor = 'bg-green-300';
  else if (isCorrect === false) bgColor = 'bg-red-300';

  return (
    <div
      ref={ref}
      style={style}
      className={`p-2 m-1 rounded text-center ${bgColor}`}
      data-handler-id={handlerId}
    >
      <ReactMarkdown>{item.chunk}</ReactMarkdown>
    </div>
  );
}