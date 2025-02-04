import { useState } from 'react';
import EditModal from './EditModal';
import BackgroundButton from '../Elements/BackgroundButton';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useUser } from '../../UserContext';
import { EditableMathField, addStyles } from 'react-mathquill';

addStyles();

function CardList({ cards, onCardClick, onUpsertCard, subject, passedInColor = "bg-yellow-500 hover:bg-yellow-400" }) {

  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const { theme } = useUser();
  const { textColor, shadow } = theme;

  const handleAddClick = () => {
    setIsModalOpen(true); // Open the modal for adding a new flashcard
  };

  const plusIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );

  return (
    <div className="w-full h-full px-4">
      {/* Header Section: Fixed */}
      <div className="flex items-center mb-4 justify-between sticky top-0 z-10">
        <h2 className={`font-bold text-2xl ${shadow ? 'drop-shadow-custom' : ''} ${textColor}`}>All Flashcards</h2>
        <BackgroundButton 
          onClick={handleAddClick} 
          image={plusIcon} 
          text="Add"
          bgColor={passedInColor}
        />
      </div>

      {/* Scrollable Card List */}
      <div className="h-[calc(100vh-160px)] overflow-y-auto"> 
        <ul className="flex flex-col space-y-4">
          {cards.map((card, index) => (
            <li 
              key={index} 
              className={`bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 h-24 flex items-center justify-center text-center overflow-hidden cursor-pointer background-shadow-new
                hover:scale-95 transition duration-300 w-[99%] sm:w-[95%]`}
              onClick={() => onCardClick(index)} // Handle card click
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
                      color: 'inherit',
                    }}
                  />
                ) : (
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      u: ({ node, ...props }) => <u {...props} />,
                    }}
                    className="text-lg font-bold inline" // Add 'inline' class
                  >
                    {card.question}
                  </ReactMarkdown>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Modal for Adding New Flashcard */}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={subject}
        handleUpsertCard={onUpsertCard}
        clear={true}
        text={`Add New Flashcard to ${subject ? subject.name : ""}`}
      />
    </div>
  );
}

export default CardList;