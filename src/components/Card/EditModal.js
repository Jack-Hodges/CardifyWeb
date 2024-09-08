import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function EditModal({ isOpen, onClose, onSave, frontContent, backContent, setFrontContent, setBackContent, text }) {
    const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animations
    const [isClosing, setIsClosing] = useState(false); // State to track if the modal is closing

    // Handle the modal appearing (fade in) when isOpen changes
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true); // Show modal and trigger the fade-in
        } else if (!isClosing) {
            setIsVisible(false); // Hide modal after animation if not closing
        }
    }, [isOpen, isClosing]);

    // Handle close animation
    const handleClose = () => {
        setIsClosing(true); // Start the closing animation
        setTimeout(() => {
            setIsClosing(false); // Reset closing state after animation
            onClose(); // Trigger the actual onClose callback
            setIsVisible(false); // Hide the modal after it fades out
        }, 300); // 300ms to match the duration of the closing animation
    };

    const handleSave = () => {
        onSave(frontContent, backContent); // Pass the updated content back to CardMain
        handleClose(); // Close the modal after saving
    };

    if (!isVisible && !isClosing) return null; // If the modal is not visible and not closing, return nothing

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent modal clicks from triggering the card click
        >
            {/* Black Background */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
            ></div>

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-3/4 max-w-2xl transform transition-all duration-300 ease-in-out ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
            >
                <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-transparent">
                    {text}
                </h2>

                {/* Question Input */}
                <div className="mb-6">
                    <label htmlFor="question" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Question
                    </label>
                    <textarea
                        id="question"
                        value={frontContent}
                        onChange={(e) => setFrontContent(e.target.value)} // Update the front content
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
                        placeholder="Enter the question here"
                    />
                </div>

                {/* Answer Input */}
                <div className="mb-6">
                    <label htmlFor="answer" className="block text-lg font-medium mb-2 text-gray-500 dark:text-gray-200">
                        Answer
                    </label>
                    <textarea
                        id="answer"
                        value={backContent}
                        onChange={(e) => setBackContent(e.target.value)} // Update the back content
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-24 text-gray-500 dark:text-gray-200"
                        placeholder="Enter the answer here"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <BackgroundButton text="Cancel" bgColor="bg-red-500" onClick={handleClose}/>
                    <BackgroundButton text="Save" bgColor="bg-blue-500" onClick={handleSave}/>
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default EditModal;