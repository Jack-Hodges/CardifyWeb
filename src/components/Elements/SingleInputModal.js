import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import BackgroundButton from '../Elements/BackgroundButton';

function SingleInputModal({ isOpen, onClose, onSave, frontContent, setFrontContent, text, hideCanc = false }) {
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
        onSave(frontContent); // Pass the updated content back to the parent component
        handleClose(); // Close the modal after saving
    };

    if (!isVisible && !isClosing) return null; // If the modal is not visible and not closing, return nothing

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-6 transition-opacity duration-300 ${
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
                className={`relative flex flex-col w-full sm:w-3/4 max-w-2xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[90dvh] overflow-hidden
                    bg-white dark:bg-gray-800 sm:rounded-lg shadow-lg
                    transform transition-all duration-300 ease-in-out ${
                    isClosing ? 'animate-pop-down' : 'animate-pop-up'
                }`}
                onClick={(e) => e.stopPropagation()} // Ensure clicking inside the modal also doesn't propagate
            >
                <div className="flex-none px-6 sm:px-8 pt-6 sm:pt-8 pb-2">
                    <h2 className="text-2xl font-semibold mb-0 text-green-500">{text}</h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-8 py-4">
                    <input
                        id="question"
                        value={frontContent}
                        onChange={(e) => setFrontContent(e.target.value)} // Update the front content
                        className="bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-md resize-none h-10 text-gray-500 dark:text-gray-200"
                        placeholder="Enter the question here"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex-none px-6 sm:px-8 py-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-4">
                        { !hideCanc && (
                            <BackgroundButton text="Cancel" bgColor="red" onClick={handleClose} />
                        )}
                        <BackgroundButton text="Save" bgColor="blue" onClick={handleSave} />
                    </div>
                </div>
            </div>
        </div>,
        document.body // Render the modal into the body of the document
    );
}

export default SingleInputModal;