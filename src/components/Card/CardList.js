import { useState } from 'react';
import EditModal from './EditModal';
import BackgroundButton from '../Elements/BackgroundButton';
import SafeMarkdown from '../Functions/SafeMarkdown';
import { useUser } from '../../UserContext';
import { EditableMathField, addStyles } from 'react-mathquill';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

addStyles();

function CardList({
  cards,
  onCardClick,
  onUpsertCard,
  subject,
  passedInColor = 'bg-yellow-500 hover:bg-yellow-400',
  onAddClick,
  onReorder,
  selectedIndex = 0,
  readOnly = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useUser();
  const { textColor, shadow, secondaryColor } = theme;

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
    onReorder(next.map((c, i) => ({ ...c, sort_order: i + 1 })), {
      from: result.source.index,
      to: result.destination.index,
    });
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
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-4 justify-between sticky top-[env(safe-area-inset-top)] sm:top-0 z-10 shrink-0">
        <h2 className={`font-bold text-2xl min-w-0 truncate ${shadow ? 'drop-shadow-custom' : ''} ${textColor}`}>
          All Flashcards
        </h2>
        {!readOnly && (
        <BackgroundButton
          onClick={handleAddClick}
          image={plusIcon}
          text="Add"
          bgColor={passedInColor}
          dataTour="create-add-card"
        />
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="card-list">
          {(provided) => (
            <ul
              className="flex flex-col space-y-3 items-stretch flex-1 min-h-0 overflow-y-auto pb-8 pr-1.5"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {cards.map((card, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <Draggable key={String(card.id)} draggableId={String(card.id)} index={index} isDragDisabled={readOnly}>
                    {(dragProvided, snapshot) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`rounded-lg h-24 flex items-center text-center border-4 ${
                          snapshot.isDragging
                            ? 'opacity-95 border-blue-500 bg-gray-50 dark:bg-gray-700 shadow-lg z-20'
                            : isSelected
                              ? `${secondaryColor?.bgClass || 'bg-purple-500'} text-white background-shadow-new`
                              : 'bg-gray-50 dark:bg-gray-700 background-shadow-new'
                        }`}
                        style={dragProvided.draggableProps.style}
                      >
                        {!readOnly && (
                        <button
                          type="button"
                          className={`shrink-0 h-full px-2 flex items-center cursor-grab active:cursor-grabbing touch-none ${
                            isSelected ? 'text-white/90' : 'text-gray-400 dark:text-gray-400'
                          }`}
                          aria-label="Drag to reorder"
                          {...dragProvided.dragHandleProps}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical size={22} />
                        </button>
                        )}
                        <button
                          type="button"
                          className={`flex-1 min-w-0 h-full px-3 flex items-center justify-center cursor-pointer ${
                            isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                          }`}
                          onClick={() => onCardClick(index)}
                        >
                          <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis">
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
                        </button>
                      </li>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

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
