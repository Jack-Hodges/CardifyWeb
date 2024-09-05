import { useState } from 'react';
import EditModal from './EditModal';

function CardList({ cards, onCardClick, onAddNewCard }) {

  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [newFrontContent, setNewFrontContent] = useState(''); // State for new flashcard's front content
  const [newBackContent, setNewBackContent] = useState(''); // State for new flashcard's back content

  const handleAddClick = () => {
    setNewFrontContent(''); // Clear the front content for a new flashcard
    setNewBackContent('');  // Clear the back content for a new flashcard
    setIsModalOpen(true); // Open the modal for adding a new flashcard
  };

  const handleSaveNewCard = () => {
    onAddNewCard(newFrontContent, newBackContent); // Pass new flashcard data to parent
    setIsModalOpen(false); // Close the modal after saving
  };

  return (
    <div className="w-full h-[87%] overflow-y-scroll px-4">
      <div class="flex">
        <h2 className="font-bold text-2xl mb-4 bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">All Flashcards</h2>
        <button
          onClick={handleAddClick}
          className="text-white bg-blue-500 hover:bg-blue-600 rounded-full p-2"
        >
          +
        </button>
      </div>
      <ul className="flex flex-col space-y-4">
        {cards.map((card, index) => (
          <li 
            key={index} 
            className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 h-24 flex items-center justify-center text-center overflow-hidden cursor-pointer"
            onClick={() => onCardClick(index)} // Handle card click
          >
            <p className="text-ellipsis overflow-hidden whitespace-nowrap w-full text-gray-500 dark:text-gray-200">
              {card.frontContent}
            </p>
          </li>
        ))}
      </ul>

      {/* Edit Modal for Adding New Flashcard */}
      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewCard}
        frontContent={newFrontContent}
        backContent={newBackContent}
        setFrontContent={setNewFrontContent}
        setBackContent={setNewBackContent}
      />

    </div>
  );
}
  
export default CardList;