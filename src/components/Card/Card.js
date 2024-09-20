import { useState, useEffect } from 'react';
import IconButtons from './IconButtons'; // Import the IconButtons component
import EditModal from './EditModal'; // Import the EditModal component
import DeleteModal from './DeleteModal'; // Import the DeleteModal component

function Card({ frontContent, backContent, flipped, setFlipped, animateFlip, onUpdateCard, cardId, onDeleteCard, edit }) {
    const [newFrontContent, setNewFrontContent] = useState(frontContent); // Card content state
    const [newBackContent, setNewBackContent] = useState(backContent); // Card content state
    const [modalFrontContent, setModalFrontContent] = useState(frontContent); // Modal content state
    const [modalBackContent, setModalBackContent] = useState(backContent); // Modal content state
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State to control delete modal visibility
    const [alignment] = useState('center'); // Default alignment is 'center'

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

    const confirmDeleteCard = (event) => {
        if (event) {
            event.stopPropagation(); // Stop propagation when confirming deletion
        }
    
        onDeleteCard(cardId); // Pass the cardId back to CreateCards.js to handle the deletion
    
        setIsDeleteModalOpen(false); // Close the delete confirmation modal
    };

    const cancelDelete = (event) => {
        // Guard for undefined event
        if (event) {
            event.stopPropagation(); // Stop propagation when cancelling deletion
        }

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
                <CardContent rotate={"rotateY(0deg)"} content={newFrontContent} onClickDelete={handleDeleteClick} onClickEdit={handleEditClick} edit={edit}/>

                {/* Back card */}
                <CardContent rotate={"rotateY(180deg)"} content={newBackContent} onClickDelete={handleDeleteClick} onClickEdit={handleEditClick} back edit={edit}/>
                
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
                text="Edit Question and Answer"
                alignment={alignment}
            />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDelete}
                onDelete={confirmDeleteCard}
                text="Delete Flashcard"
                alignment={alignment}
            />
        </div>
    );
}

export default Card;

function CardContent({ rotate, content, onClickDelete, onClickEdit, edit, back, alignment }) {
    return (
        <div
            className={`absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700 p-5 rounded-2xl select-none background-shadow ${alignment}`}
            style={{ backfaceVisibility: 'hidden', transform: rotate, whiteSpace: 'pre-wrap' }} // Add whiteSpace styling
        >
            {back && <p className="absolute top-0 font-bold text-2xl mt-2 text-yellow-500">Answer</p>}
            <p className="text-xl sm:text-4xl text-gray-700 dark:text-gray-200 font-bold text-center">{content}</p>
            {edit && (
                <div>
                    <div className="absolute top-2 right-2 cursor-pointer text-red-500" onClick={onClickDelete}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9M9.26 9l-.346 9M18.16 5.79L17.84 19.67a2.25 2.25 0 0 1-2.244 2.08H8.084A2.25 2.25 0 0 1 5.84 19.67L5.772 5.79M5.772 5.79a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916C16.75 3.794 15.84 2.81 14.66 2.774a51.96 51.96 0 0 0-3.32 0C10.16 2.81 9.25 3.794 9.25 4.874v.916m7.5 0a48.11 48.11 0 0 0-7.5 0" />
                        </svg>
                    </div>
                    <IconButtons onEditClick={onClickEdit} />
                </div>
            )}
        </div>
    );
}