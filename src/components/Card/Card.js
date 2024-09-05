import { useState, useEffect } from 'react';
import IconButtons from './IconButtons'; // Import the IconButtons component
import EditModal from './EditModal'; // Import the EditModal component

function Card({ frontContent, backContent, flipped, setFlipped, animateFlip, onUpdateCard }) {
    const [newFrontContent, setNewFrontContent] = useState(frontContent); // Card content state
    const [newBackContent, setNewBackContent] = useState(backContent); // Card content state
    const [modalFrontContent, setModalFrontContent] = useState(frontContent); // Modal content state
    const [modalBackContent, setModalBackContent] = useState(backContent); // Modal content state
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

    // Update the modal content state when the card changes (e.g., new card is selected)
    useEffect(() => {
        setNewFrontContent(frontContent);
        setNewBackContent(backContent);
        setModalFrontContent(frontContent); // Reset modal content to match card content
        setModalBackContent(backContent);   // Reset modal content to match card content
    }, [frontContent, backContent]);

    const handleEditClick = () => {
        setIsModalOpen(true); // Open the modal
    };

    const handleSave = () => {
        // Update the card content state with the modal content when Save is clicked
        setNewFrontContent(modalFrontContent);
        setNewBackContent(modalBackContent);
        onUpdateCard(modalFrontContent, modalBackContent); // Call update function to save in parent
        setIsModalOpen(false); // Close the modal
    };

    const handleCancel = () => {
        // Close the modal without saving changes
        setModalFrontContent(newFrontContent); // Reset modal content to match the current card state
        setModalBackContent(newBackContent);   // Reset modal content to match the current card state
        setIsModalOpen(false); // Close the modal
    };

    const handleCardClick = () => {
        setFlipped(!flipped);
    };

    return (
        <div className="relative h-full w-full" onClick={handleCardClick} style={{ perspective: '1000px' }}>
            <div
                className={`absolute inset-0 transform ${animateFlip ? 'transition-transform duration-500 ease-in-out' : ''} ${flipped ? 'rotate-y-180' : ''}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front card */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700 p-5 shadow-xl rounded-2xl select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                    }}
                >
                    <p className="text-4xl text-gray-500 dark:text-gray-200">{newFrontContent}</p> {/* Display the card's current content */}
                    <IconButtons onEditClick={handleEditClick} />
                </div>

                {/* Back card */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700 p-5 shadow-xl rounded-2xl select-none"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <p className="absolute top-0 font-bold text-2xl mt-2 bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">Answer</p>
                    <p className="text-4xl text-gray-500 dark:text-gray-200">{newBackContent}</p> {/* Display the card's current content */}
                    <IconButtons onEditClick={handleEditClick} />
                </div>
            </div>

            {/* Edit Modal */}
            <EditModal
                isOpen={isModalOpen}
                onClose={handleCancel}
                onSave={handleSave}
                frontContent={modalFrontContent} // Pass the modal state for question
                backContent={modalBackContent}   // Pass the modal state for answer
                setFrontContent={setModalFrontContent} // Update modal state for question
                setBackContent={setModalBackContent}   // Update modal state for answer
            />
        </div>
    );
}

export default Card;