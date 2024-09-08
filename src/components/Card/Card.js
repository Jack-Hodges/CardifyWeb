import { useState, useEffect } from 'react';
import IconButtons from './IconButtons'; // Import the IconButtons component
import EditModal from './EditModal'; // Import the EditModal component
import supabase from '../../supabaseClient'; // Import Supabase client

function Card({ frontContent, backContent, flipped, setFlipped, animateFlip, onUpdateCard, cardId, onDeleteCard }) {
    const [newFrontContent, setNewFrontContent] = useState(frontContent); // Card content state
    const [newBackContent, setNewBackContent] = useState(backContent); // Card content state
    const [modalFrontContent, setModalFrontContent] = useState(frontContent); // Modal content state
    const [modalBackContent, setModalBackContent] = useState(backContent); // Modal content state
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State to control delete modal visibility

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
        if (!isDeleteModalOpen) {
            setFlipped(!flipped); // Flip the card only when delete modal is not open
        }
    };

    // Handle delete card confirmation
    const handleDeleteClick = (event) => {
        event.stopPropagation(); // Prevent the card from flipping
        setIsDeleteModalOpen(true); // Open the delete confirmation modal
    };

    const confirmDeleteCard = async (event) => {
        event.stopPropagation(); // Stop propagation when confirming deletion
        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', cardId); // Use the card's id to delete from Supabase

        if (error) {
            console.error('Error deleting card:', error);
        } else {
            onDeleteCard(cardId); // Call the parent function to remove the card from the UI
        }

        setIsDeleteModalOpen(false); // Close the delete confirmation modal
    };

    const cancelDelete = (event) => {
        event.stopPropagation(); // Stop propagation when cancelling deletion
        setIsDeleteModalOpen(false); // Close the delete confirmation modal without deleting
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
                    <div className="absolute top-2 right-2 cursor-pointer text-red-500" onClick={handleDeleteClick}>
                        {/* Red bin icon for delete */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </div>
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
                    <div className="absolute top-2 right-2 cursor-pointer text-red-500" onClick={handleDeleteClick}>
                        {/* Red bin icon for delete */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </div>
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

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(event) => event.stopPropagation()}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-lg">
                        <p className="text-lg text-gray-900 dark:text-gray-200 mb-4">Are you sure you want to delete this card?</p>
                        <div className="flex justify-end">
                            <button
                                onClick={confirmDeleteCard}
                                className="text-white bg-red-500 hover:bg-red-600 rounded-full px-4 py-2 mr-2"
                            >
                                Delete
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full px-4 py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Card;