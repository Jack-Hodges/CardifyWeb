import { useState } from 'react';
import EditModal from './EditModal';
import BackgroundButton from '../Elements/BackgroundButton';
import SafeMarkdown from '../Functions/SafeMarkdown';
import { useUser } from '../../UserContext';
import { EditableMathField, addStyles } from 'react-mathquill';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

addStyles();

function CardList({
  cards,
  onCardClick,
  onUpsertCard,
  subject,
  passedInColor = 'bg-yellow-500 hover:bg-yellow-400',
  onAddClick,
  onReorder,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useUser();
  const { textColor, shadow } = theme;

  const handleAddClick = () => {
    if (onAddClick && !onAddClick()) {
      return;
    }
    setIsModalOpen(true);
  };

  const onDragEnd = (result) => {
    if (!result.destination || !onReorder) return;
    if (result.source.index === result.destination.index) return;
    const next = Array.from(cards);
    const [removed] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, removed);
    onReorder(next.map((c, i) => ({ ...c, sort_order: i + 1 })));
  };

  const plusIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="3"
      stroke="currentColor"
      className="size-6"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );

  return (
    <div className="w-full h-full px-4">
      <div className="flex items-center mb-4 justify-between sticky top-0 z-10">
        <h2 className={`font-bold text-2xl ${shadow ? 'drop-shadow-custom' : ''} ${textColor}`}>
          All Flashcards
        </h2>
        <BackgroundButton
          onClick={handleAddClick}
          image={plusIcon}
          text="Add"
          bgColor={passedInColor}
        />
      </div>

      <div className="h-full lg:h-[calc(100vh-160px)] overflow-y-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="card-list">
            {(provided) => (
              <ul
                className="flex flex-col space-y-4 justify-center items-center"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {cards.map((card, index) => (
                  <Draggable key={String(card.id)} draggableId={String(card.id)} index={index}>
                    {(dragProvided, snapshot) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 h-24 flex items-center justify-center text-center overflow-hidden cursor-pointer background-shadow-new
                md:hover:scale-95 transition duration-300 w-[99%] sm:w-[95%] ${snapshot.isDragging ? 'opacity-90 ring-2 ring-blue-400' : ''}`}
                        onClick={() => onCardClick(index)}
                      >
                        <div className="text-gray-700 dark:text-gray-200 w-full overflow-hidden whitespace-nowrap text-ellipsis">
                          {card.frontMode === 1 ? (
                            <EditableMathField
                              latex={card.question}
                              style={{
                                minHeight: '4rem',
                                width: '100%',
                                backgroundColor: 'transparent',
                                color: 'inherit',
                                border: 'none',
                                pointerEvents: 'none',
                                fontSize: '2rem',
                                fontWeight: 'semibold',
                              }}
                            />
                          ) : (
                            <SafeMarkdown
                              components={{
                                u: ({ node, ...props }) => <u {...props} />,
                              }}
                              className="text-lg font-bold inline"
                            >
                              {card.question}
                            </SafeMarkdown>
                          )}
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={subject}
        handleUpsertCard={onUpsertCard}
        clear={true}
        text={`Add New Flashcard to ${subject ? subject.name : ''}`}
      />
    </div>
  );
}

export default CardList;
